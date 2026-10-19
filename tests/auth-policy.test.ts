import { describe, expect, it } from "vitest";
import {
  applyAuthCookiePolicy,
  isProjectAuthCookie,
  onboardingDestination,
  onboardingStepAllows,
  REMEMBER_DEVICE_SECONDS,
  secureFromAppOrigin,
  shouldRememberDevice,
} from "../src/lib/auth-policy";

describe("auth cookie and onboarding policies", () => {
  it("sets persistent HttpOnly same-site cookies and slides their expiry", () => {
    expect(applyAuthCookiePolicy({ maxAge: 400 * 24 * 60 * 60 }, true, true)).toEqual({
      maxAge: REMEMBER_DEVICE_SECONDS,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true,
    });
    expect(shouldRememberDevice("yes")).toBe(true);
    expect(shouldRememberDevice(undefined)).toBe(false);
  });

  it("keeps unchecked cookies as session cookies and preserves deletions for chunks", () => {
    expect(applyAuthCookiePolicy({ maxAge: 400, expires: new Date("2030-01-01") }, false, false)).toEqual({
      path: "/", httpOnly: true, sameSite: "lax", secure: false,
    });
    for (const name of ["sb-project-auth-token", "sb-project-auth-token.0", "sb-project-auth-token.1"]) {
      expect(name.startsWith("sb-project-auth-token")).toBe(true);
      expect(applyAuthCookiePolicy({ maxAge: 0 }, true, true).maxAge).toBe(0);
    }
  });

  it("matches only the SDK auth cookie and chunks for the configured project", () => {
    expect(isProjectAuthCookie("sb-project-auth-token", "https://project.supabase.co")).toBe(true);
    expect(isProjectAuthCookie("sb-project-auth-token.0", "https://project.supabase.co")).toBe(true);
    expect(isProjectAuthCookie("sb-another-auth-token", "https://project.supabase.co")).toBe(false);
    expect(isProjectAuthCookie("sb-project-auth-token-extra", "https://project.supabase.co")).toBe(false);
    expect(isProjectAuthCookie("sb-project-auth-token.0", "invalid-url")).toBe(false);
  });

  it("sends incomplete accounts to their saved step and completed accounts home", () => {
    expect(onboardingDestination("objectives", null)).toBe("/onboarding/objectives");
    expect(onboardingDestination("languages", null)).toBe("/onboarding/languages");
    expect(onboardingDestination("finish", null)).toBe("/onboarding/finish");
    expect(onboardingDestination("complete", null)).toBe("/home");
    expect(onboardingDestination("objectives", "2026-10-19T12:00:00Z")).toBe("/home");
  });

  it("only allows back navigation to a previously reached step", () => {
    expect(onboardingStepAllows("finish", "languages")).toBe(true);
    expect(onboardingStepAllows("languages", "objectives")).toBe(true);
    expect(onboardingStepAllows("objectives", "languages")).toBe(false);
  });

  it("uses HTTP for local production callbacks without an Origin header", () => {
    expect(secureFromAppOrigin("", null, "127.0.0.1:3107", true)).toBe(false);
    expect(secureFromAppOrigin("", null, "localhost:3000", true)).toBe(false);
    expect(secureFromAppOrigin("", null, "[::1]:3000", true)).toBe(false);
    expect(secureFromAppOrigin("", null, "litecode.example", true)).toBe(true);
    expect(secureFromAppOrigin("https://litecode.example", "http://localhost:3000", "localhost:3000", false)).toBe(true);
  });
});
