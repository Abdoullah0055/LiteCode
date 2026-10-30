import { describe, expect, it } from "vitest";
import { parseAuthHash } from "../src/lib/auth-hash";

describe("email confirmation hash fallback", () => {
  it("ignores ordinary anchors and empty hashes", () => {
    expect(parseAuthHash("")).toEqual({ kind: "none" });
    expect(parseAuthHash("#module-01")).toEqual({ kind: "none" });
  });

  it("reads the tokens Supabase puts in the fragment after a Site URL fallback", () => {
    expect(
      parseAuthHash(
        "#access_token=header.payload.signature&expires_in=3600&refresh_token=refresh-value&token_type=bearer&type=signup",
      ),
    ).toEqual({
      kind: "session",
      accessToken: "header.payload.signature",
      refreshToken: "refresh-value",
      type: "signup",
    });
  });

  it("keeps the recovery type so the server can route to settings", () => {
    expect(
      parseAuthHash(
        "#access_token=header.payload.signature&refresh_token=refresh-value&type=recovery",
      ),
    ).toMatchObject({ kind: "session", type: "recovery" });
  });

  it("treats provider errors and incomplete sessions as failures", () => {
    expect(
      parseAuthHash(
        "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid",
      ),
    ).toEqual({ kind: "error" });
    expect(parseAuthHash("#access_token=header.payload.signature")).toEqual({
      kind: "error",
    });
  });
});
