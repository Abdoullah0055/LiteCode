import { NextResponse, type NextRequest } from "next/server";
import { apiContext, apiFailure, ApiError } from "@/lib/api";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { server, user } = await apiContext(request, id);
    const [progress, hints] = await Promise.all([
      server
        .from("user_progress")
        .select("hints_revealed")
        .eq("user_id", user.id)
        .eq("lesson_id", id)
        .maybeSingle(),
      server
        .from("hints")
        .select("body,position")
        .eq("lesson_id", id)
        .order("position"),
    ]);
    if (progress.error || hints.error || !hints.data?.length)
      throw new ApiError("Indices indisponibles.", 503);
    return NextResponse.json({
      hints: hints.data
        .slice(0, progress.data?.hints_revealed || 0)
        .map((h) => h.body),
      total: hints.data.length,
    });
  } catch (error) {
    return apiFailure(error);
  }
}
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { server, user } = await apiContext(request, id);
    const { data: progress, error: pe } = await server
      .from("user_progress")
      .select("hints_revealed")
      .eq("user_id", user.id)
      .eq("lesson_id", id)
      .maybeSingle();
    const { data: hints, error: he } = await server
      .from("hints")
      .select("body,position")
      .eq("lesson_id", id)
      .order("position");
    if (pe || he || !hints?.length)
      throw new ApiError("Indices indisponibles.", 503);
    const count = Math.min((progress?.hints_revealed || 0) + 1, hints.length);
    const { error } = await server
      .from("user_progress")
      .upsert(
        { user_id: user.id, lesson_id: id, hints_revealed: count },
        { onConflict: "user_id,lesson_id" },
      );
    if (error) throw new ApiError("Indice non enregistré.", 503);
    return NextResponse.json({
      hints: hints.slice(0, count).map((h) => h.body),
      total: hints.length,
    });
  } catch (error) {
    return apiFailure(error);
  }
}
