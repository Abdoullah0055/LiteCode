import { NextResponse, type NextRequest } from "next/server";
import { apiContext, apiFailure, ApiError } from "@/lib/api";
import { gradeActivitySubmission } from "@/lib/learning-grading";
import { loadAuthoredActivity } from "@/lib/learning-runtime";
import { versionedSubmissionSchema } from "@/lib/learning-model";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { server, user } = await apiContext(request, id);
    if (Number(request.headers.get("content-length") || 0) > 12000) throw new ApiError("Soumission trop longue.", 413);
    const input = versionedSubmissionSchema.parse(await request.json());
    const { activity, versionId } = await loadAuthoredActivity(server, id);
    if (input.version !== activity.public.version) throw new ApiError("Cette activité a été mise à jour. Recharge-la avant de répondre.", 409);
    if (activity.public.project) throw new ApiError("Utilise la validation finale du projet.", 400);
    const grade = gradeActivitySubmission(activity, input);
    if (grade.error === "version_mismatch") throw new ApiError("Cette activité a été mise à jour. Recharge-la avant de répondre.", 409);
    if (grade.error === "invalid_definition") throw new ApiError("Correction indisponible.", 503);
    if (grade.error) throw new ApiError("Réponse invalide.", 400);
    const { data: attemptId, error: beginError } = await server.rpc("begin_learning_attempt", {
      p_user: user.id, p_lesson: id, p_version_id: versionId, p_submission: input,
    });
    if (beginError) throw new ApiError(beginError.message.includes("stale") ? "Cette activité a été mise à jour. Recharge-la avant de répondre." : "Cette activité ne peut pas encore être envoyée.", beginError.message.includes("stale") ? 409 : beginError.message.includes("Too many") ? 429 : 403);
    const { data: reward, error: finishError } = await server.rpc("finish_attempt", {
      p_user: user.id, p_attempt: attemptId, p_status: grade.passed ? "passed" : "failed", p_results: grade.results,
    });
    if (finishError) throw new ApiError("Résultat non enregistré. Réessaie.", 503);
    return NextResponse.json({ attemptId, passed: grade.passed, results: grade.results, xp: Number(reward?.xp || 0) });
  } catch (error) { return apiFailure(error); }
}
