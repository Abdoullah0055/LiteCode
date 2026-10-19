import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiContext, apiFailure, ApiError } from "@/lib/api";
import { loadAuthoredActivity } from "@/lib/learning-runtime";
import { gradeProjectCompletion } from "@/lib/learning-workflow";

const requestSchema = z.object({ version: z.number().int().positive() }).strict();

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { server, user } = await apiContext(request, id);
    const input = requestSchema.parse(await request.json());
    const runtime = await loadAuthoredActivity(server, id);
    const { activity, versionId, projectId, steps } = runtime;
    if (input.version !== activity.public.version) throw new ApiError("Cette activité a été mise à jour. Recharge-la avant de répondre.", 409);
    if (!activity.public.project || !projectId) throw new ApiError("Ce parcours n’est pas un projet guidé.", 400);
    const { data: saved, error } = await server.from("learning_project_step_results")
      .select("position,submission").eq("user_id", user.id).eq("version_id", versionId).eq("project_id", projectId).order("position");
    if (error) throw new ApiError("Étapes sauvegardées indisponibles.", 503);
    const byPosition = new Map((saved || []).map((row) => [row.position, row.submission]));
    if (steps.some((step) => !byPosition.has(step.position))) throw new ApiError("Termine toutes les étapes avant de finaliser le projet.", 409);
    const submissions = steps.map((step) => byPosition.get(step.position));
    const grade = gradeProjectCompletion(activity, submissions);
    if (grade.error) throw new ApiError("Réponses enregistrées incompatibles avec cette version. Recommence le projet.", 409);
    if (!grade.passed) throw new ApiError("Une étape doit être corrigée avant de finaliser le projet.", 409);
    const answers = Object.assign({}, ...submissions.map((submission) => (submission as { answers: object }).answers));
    const finalSubmission = { version: activity.public.version, answers };
    const { data: attemptId, error: beginError } = await server.rpc("begin_learning_attempt", {
      p_user: user.id, p_lesson: id, p_version_id: versionId, p_submission: finalSubmission,
    });
    if (beginError) throw new ApiError(beginError.message.includes("stale") ? "Cette activité a été mise à jour. Recharge-la avant de répondre." : "Ce projet ne peut pas être finalisé maintenant.", beginError.message.includes("stale") ? 409 : beginError.message.includes("Too many") ? 429 : 403);
    const { error: authorizeError } = await server.rpc("authorize_project_completion", {
      p_user: user.id, p_attempt: attemptId, p_version_id: versionId,
    });
    if (authorizeError) throw new ApiError("La validation finale du projet a échoué. Réessaie.", 503);
    const { data: reward, error: finishError } = await server.rpc("finish_attempt", {
      p_user: user.id, p_attempt: attemptId, p_status: "passed", p_results: grade.results,
    });
    if (finishError) throw new ApiError("Résultat non enregistré. Réessaie.", 503);
    return NextResponse.json({ attemptId, passed: true, results: grade.results.flatMap((step) => step.results), xp: Number(reward?.xp || 0) });
  } catch (error) { return apiFailure(error); }
}
