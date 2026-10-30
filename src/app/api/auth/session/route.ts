import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";
import { configured, supabase } from "@/lib/supabase/server";
import { postAuthDestination } from "@/lib/data";
import { isSameOrigin } from "@/lib/request-origin";

const payload = z.object({
  access_token: z.string().min(20).max(4096),
  refresh_token: z.string().min(1).max(512),
  type: z
    .enum(["signup", "recovery", "email", "magiclink", "invite", "email_change"])
    .optional(),
});

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request))
    return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  if (!configured())
    return NextResponse.json(
      { error: "Supabase n’est pas configuré." },
      { status: 503 },
    );
  if (Number(request.headers.get("content-length") || 0) > 8192)
    return NextResponse.json({ error: "Requête trop longue." }, { status: 413 });
  const parsed = payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Lien de confirmation invalide." },
      { status: 400 },
    );

  const db = await supabase();
  const { data, error } = await db.auth.setSession({
    access_token: parsed.data.access_token,
    refresh_token: parsed.data.refresh_token,
  });
  if (error || !data.user)
    return NextResponse.json(
      { error: "Le lien de confirmation est invalide ou a expiré." },
      { status: 401 },
    );

  const destination =
    parsed.data.type === "recovery"
      ? "/settings"
      : await postAuthDestination(db, data.user.id);
  return NextResponse.json(
    { destination },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
