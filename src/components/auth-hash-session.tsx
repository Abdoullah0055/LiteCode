"use client";
import { useEffect, useRef } from "react";
import { parseAuthHash } from "@/lib/auth-hash";

/**
 * Recovers the session when Supabase redirects a confirmation or recovery
 * email to the Site URL with tokens in the hash fragment. The tokens are sent
 * to a same-origin server route so the existing cookie policy still applies.
 */
export function AuthHashSession() {
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    const result = parseAuthHash(window.location.hash);
    if (result.kind === "none") return;
    handled.current = true;

    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );

    if (result.kind === "error") {
      window.location.replace("/auth?error=confirmation");
      return;
    }

    void (async () => {
      try {
        const response = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: result.accessToken,
            refresh_token: result.refreshToken,
            type: result.type ?? undefined,
          }),
        });
        const payload = (await response.json().catch(() => null)) as {
          destination?: string;
        } | null;
        window.location.replace(
          response.ok && payload?.destination
            ? payload.destination
            : "/auth?error=confirmation",
        );
      } catch {
        window.location.replace("/auth?error=confirmation");
      }
    })();
  }, []);

  return null;
}
