export type AuthHashResult =
  | { kind: "none" }
  | { kind: "error" }
  | {
      kind: "session";
      accessToken: string;
      refreshToken: string;
      type: string | null;
    };

/**
 * Supabase falls back to the Site URL when the requested redirect URL is not
 * allow-listed. In that case the confirmation tokens arrive in the URL hash
 * (`#access_token=...&refresh_token=...`), which never reaches the server.
 * Parse only auth payloads so ordinary anchors (for example `#module-01`)
 * keep working.
 */
export function parseAuthHash(hash: string): AuthHashResult {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw) return { kind: "none" };
  const params = new URLSearchParams(raw);
  const error = params.get("error") ?? params.get("error_code");
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (error) return { kind: "error" };
  if (!accessToken && !refreshToken) return { kind: "none" };
  if (!accessToken || !refreshToken) return { kind: "error" };
  return {
    kind: "session",
    accessToken,
    refreshToken,
    type: params.get("type"),
  };
}
