import { NextResponse, type NextRequest } from "next/server";
import { apiContext, apiFailure, ApiError } from "@/lib/api";
import { loadAuthoredActivity } from "@/lib/learning-runtime";
import { versionedSubmissionSchema } from "@/lib/learning-model";
import { gradeProjectStep } from "@/lib/learning-workflow";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  try {
    const { id, stepId } = await params;
    const { server, user } = await apiContext(request, id);
    if (Number(request.headers.get("content-length") || 0) > 12000) throw new ApiError("Réponse trop longue.", 413);
    const submission = versionedSubmissionSchema.parse(await request.json());
    const runtime = await loadAuthoredActivity(server, id);
    const { activity, versionId, projectId, steps } = runtime;
    if (submission.version !== activity.public.version) throw new ApiError("Cette activité a été mise à jour. Recharge-la avant de répondre.", 409);
    if (!activity.public.project || !projectId) throw new ApiError("Ce parcours n’a pas d’étapes de projet.", 400);
    const position = steps.findIndex((step) => step.id === stepId) + 1;
    if (!position) throw new ApiError("Étape introuvable.", 404);
    const { data: saved, error: savedError } = await server.from("learning_project_step_results")
      .select("position,passed").eq("user_id", user.id).eq("version_id", versionId).eq("project_id", projectId);
    if (savedError) throw new ApiError("Progression du projet indisponible.", 503);
    const byPosition = new Map((saved || []).map((item) => [item.position, item.passed]));
    let expected = 1;
    while (byPosition.get(expected) === true) expected++;
    if (position > expected) throw new ApiError("Termine les étapes précédentes avant de continuer.", 409);
    const grade = gradeProjectStep(activity, stepId, submission);
    if (grade.error === "invalid_definition") throw new ApiError("Correction indisponible.", 503);
    if (grade.error) throw new ApiError("Réponse d’étape invalide.", grade.error === "version_mismatch" ? 409 : 400);
    const { error } = await server.rpc("save_learning_project_step", {
      p_user: user.id, p_version_id: versionId, p_project_id: projectId, p_position: position,
      p_interaction_id: stepId, p_submission: submission, p_results: grade.results, p_passed: grade.passed,
    });
    if (error) throw new ApiError(error.message.includes("Invalid project step") ? "Cette étape a changé. Recharge le projet." : "Résultat d’étape non enregistré.", error.message.includes("Invalid project step") ? 409 : 503);
    return NextResponse.json({ ...grade, nextStepId: grade.passed ? steps[position]?.id || null : stepId, completedSteps: position - (grade.passed ? 0 : 1), totalSteps: steps.length });
  } catch (error) { return apiFailure(error); }
}
