import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { postAuthDestination } from "@/lib/data";
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const token = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const db = await supabase();
  const result = code
    ? await db.auth.exchangeCodeForSession(code)
    : token && type
      ? await db.auth.verifyOtp({ token_hash: token, type })
      : null;
  if (result && !result.error) {
    const { data: { user }, error } = await db.auth.getUser();
    if (!error && user) {
      const destination =
        type === "recovery" || next === "settings"
          ? "/settings"
          : await postAuthDestination(db, user.id);
      const response = NextResponse.redirect(new URL(destination, url.origin));
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
  }
  const response = NextResponse.redirect(
    new URL("/auth?error=confirmation", url.origin),
  );
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
