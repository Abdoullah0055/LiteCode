import "server-only";
import { headers } from "next/headers";
import { secureFromAppOrigin } from "@/lib/auth-policy";

function validOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.origin !== value ||
      url.username ||
      url.password
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

export async function authCallbackUrl(next: "onboarding" | "settings") {
  const configured = validOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const originHeader = validOrigin(requestHeaders.get("origin") ?? undefined);
  const secure = secureFromAppOrigin(
    process.env.NEXT_PUBLIC_SITE_URL,
    originHeader,
    host,
    process.env.NODE_ENV === "production",
  );
  const protocol = secure ? "https" : "http";
  const hostOrigin = host && !/[\s,/@\\?#]/.test(host)
    ? `${protocol}://${host}`
    : null;
  const trustedRequestOrigin =
    originHeader && hostOrigin && originHeader === hostOrigin
      ? originHeader
      : hostOrigin;
  const origin = configured ?? validOrigin(trustedRequestOrigin ?? undefined);
  if (!origin) throw new Error("Impossible de construire l’URL de confirmation.");
  return `${origin}/auth/confirm?next=${next}`;
}
