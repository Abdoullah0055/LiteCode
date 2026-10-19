import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  applyAuthCookiePolicy,
  REMEMBER_DEVICE_COOKIE,
  secureFromAppOrigin,
  shouldRememberDevice,
} from "@/lib/auth-policy";
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    return response;
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          const remember = shouldRememberDevice(
            request.cookies.get(REMEMBER_DEVICE_COOKIE)?.value,
          );
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          const secure = secureFromAppOrigin(
            process.env.NEXT_PUBLIC_SITE_URL,
            request.nextUrl.origin,
            request.nextUrl.host,
            process.env.NODE_ENV === "production",
          );
          values.forEach(({ name, value, options }) =>
            response.cookies.set(
              name,
              value,
              applyAuthCookiePolicy(options ?? {}, remember, secure),
            ),
          );
          if (remember && values.some(({ options }) => options?.maxAge !== 0))
            response.cookies.set(
              REMEMBER_DEVICE_COOKIE,
              "yes",
              applyAuthCookiePolicy({}, true, secure),
            );
        },
      },
    },
  );
  await client.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|icon|manifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
