import type { CookieOptions } from "@supabase/ssr";

export const REMEMBER_DEVICE_COOKIE = "litecode-remember-device";
export const REMEMBER_DEVICE_SECONDS = 30 * 24 * 60 * 60;

export function applyAuthCookiePolicy(
  options: CookieOptions,
  remember: boolean,
  secure: boolean,
): CookieOptions {
  const expiredByDate = options.expires
    ? new Date(options.expires).getTime() <= Date.now()
    : false;
  const result: CookieOptions = {
    ...options,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure,
  };
  if (options.maxAge === 0 || expiredByDate) {
    result.maxAge = 0;
  } else if (remember) {
    result.maxAge = REMEMBER_DEVICE_SECONDS;
    delete result.expires;
  } else {
    delete result.maxAge;
    delete result.expires;
  }
  return result;
}

export function shouldRememberDevice(value: string | undefined): boolean {
  return value === "yes";
}

export function isProjectAuthCookie(name: string, supabaseUrl: string): boolean {
  try {
    const base = `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`;
    return name === base || new RegExp(`^${base}\\.\\d+$`).test(name);
  } catch {
    return false;
  }
}

export function secureFromRequestOrigin(
  origin: string | null | undefined,
  host: string | null | undefined,
  fallback: boolean,
): boolean {
  if (!host || /[\s,/@\\?#]/.test(host)) return fallback;
  if (!origin) {
    if (/^(?:localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?$/i.test(host))
      return false;
    return fallback;
  }
  try {
    const url = new URL(origin);
    if (
      (url.protocol === "https:" || url.protocol === "http:") &&
      url.origin === origin &&
      url.host === host
    )
      return url.protocol === "https:";
  } catch {
    return fallback;
  }
  return fallback;
}

export function secureFromAppOrigin(
  configuredOrigin: string | null | undefined,
  requestOrigin: string | null | undefined,
  host: string | null | undefined,
  fallback: boolean,
): boolean {
  if (configuredOrigin) {
    try {
      const url = new URL(configuredOrigin);
      if (
        (url.protocol === "https:" || url.protocol === "http:") &&
        url.origin === configuredOrigin
      )
        return url.protocol === "https:";
    } catch {
      return fallback;
    }
  }
  return secureFromRequestOrigin(requestOrigin, host, fallback);
}

export function onboardingDestination(
  step: string | null | undefined,
  completedAt: string | null | undefined,
): string {
  if (completedAt || step === "complete") return "/home";
  switch (step) {
    case "languages":
      return "/onboarding/languages";
    case "finish":
      return "/onboarding/finish";
    default:
      return "/onboarding/objectives";
  }
}

export function onboardingStepAllows(
  current: string,
  target: "objectives" | "languages" | "finish",
): boolean {
  const order = ["objectives", "languages", "finish"];
  return order.indexOf(target) <= order.indexOf(current);
}
