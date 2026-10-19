import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import {
  applyAuthCookiePolicy,
  REMEMBER_DEVICE_COOKIE,
  secureFromAppOrigin,
  shouldRememberDevice,
} from "@/lib/auth-policy";
export const configured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
export async function supabase() {
  if (!configured())
    throw new Error("Supabase non configuré. Consulte README.md.");
  const jar = await cookies();
  const requestHeaders = await headers();
  const secure = secureFromAppOrigin(
    process.env.NEXT_PUBLIC_SITE_URL,
    requestHeaders.get("origin"),
    requestHeaders.get("host"),
    process.env.NODE_ENV === "production",
  );
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll(values) {
          try {
            const remember = shouldRememberDevice(
              jar.get(REMEMBER_DEVICE_COOKIE)?.value,
            );
            values.forEach(({ name, value, options }) => {
              jar.set(
                name,
                value,
                applyAuthCookiePolicy(options ?? {}, remember, secure),
              );
            });
            if (
              remember &&
              values.some(({ options }) => options?.maxAge !== 0)
            ) {
              jar.set(
                REMEMBER_DEVICE_COOKIE,
                "yes",
                applyAuthCookiePolicy({}, true, secure),
              );
            }
          } catch {
            /* Server Components cannot write; proxy refreshes sessions. */
          }
        },
      },
    },
  );
}
export function admin() {
  if (!configured() || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error("La clé serveur Supabase est manquante.");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
