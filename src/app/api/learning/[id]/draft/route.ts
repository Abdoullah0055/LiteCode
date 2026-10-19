import { NextResponse, type NextRequest } from "next/server";
import { apiContext, apiFailure, ApiError } from "@/lib/api";
import { loadAuthoredActivity } from "@/lib/learning-runtime";
import { validateVersionedDraft, versionedDraftSchema } from "@/lib/learning-model";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { server, user } = await apiContext(request, id);
    const { activity, versionId } = await loadAuthoredActivity(server, id);
    const { data, error } = await server.from("user_progress").select("draft_answers,draft_content_version_id")
      .eq("user_id", user.id).eq("lesson_id", id).maybeSingle();
    if (error) throw new ApiError("Brouillon indisponible.", 503);
    const draft = data?.draft_content_version_id === versionId ? validateVersionedDraft(activity.public, data.draft_answers) : null;
    return NextResponse.json({ draft });
  } catch (error) { return apiFailure(error); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { server, user } = await apiContext(request, id);
    if (Number(request.headers.get("content-length") || 0) > 12000) throw new ApiError("Brouillon trop long.", 413);
    const { activity, versionId } = await loadAuthoredActivity(server, id);
    const payload = versionedDraftSchema.parse(await request.json());
    if (payload.version !== activity.public.version)
      throw new ApiError("Cette activité a été mise à jour. Recharge-la avant de répondre.", 409);
    const input = validateVersionedDraft(activity.public, payload);
    if (!input) throw new ApiError("Brouillon invalide.", 400);
    const { error } = await server.rpc("save_learning_draft", {
      p_user: user.id, p_lesson: id, p_version_id: versionId, p_draft: input,
    });
    if (error) throw new ApiError(error.message.includes("stale") ? "Cette activité a été mise à jour. Recharge-la avant de répondre." : "Brouillon non sauvegardé.", error.message.includes("stale") ? 409 : 503);
    return NextResponse.json({ saved: true, version: input.version });
  } catch (error) { return apiFailure(error); }
}
