import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(), verifyOtp: vi.fn(), getUser: vi.fn(),
  db: { auth: {} as Record<string, unknown> },
  postAuthDestination: vi.fn(),
}));
mocks.db.auth = {
  exchangeCodeForSession: mocks.exchangeCodeForSession,
  verifyOtp: mocks.verifyOtp,
  getUser: mocks.getUser,
};
vi.mock("@/lib/supabase/server", () => ({ supabase: async () => mocks.db }));
vi.mock("@/lib/data", () => ({ postAuthDestination: mocks.postAuthDestination }));

import { GET } from "../src/app/auth/confirm/route";

describe("email authentication callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    mocks.verifyOtp.mockResolvedValue({ error: null });
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mocks.postAuthDestination.mockResolvedValue("/onboarding/languages");
  });

  it("exchanges PKCE and uses the saved onboarding destination, ignoring external next URLs", async () => {
    const response = await GET(new NextRequest("https://litecode.test/auth/confirm?code=pkce-code&next=https%3A%2F%2Fattacker.invalid"));
    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("pkce-code");
    expect(mocks.postAuthDestination).toHaveBeenCalledWith(mocks.db, "user-1");
    expect(response.headers.get("location")).toBe("https://litecode.test/onboarding/languages");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("routes recovery confirmation to settings", async () => {
    const response = await GET(new NextRequest("https://litecode.test/auth/confirm?token_hash=opaque&type=recovery"));
    expect(mocks.verifyOtp).toHaveBeenCalledWith({ token_hash: "opaque", type: "recovery" });
    expect(response.headers.get("location")).toBe("https://litecode.test/settings");
    expect(mocks.postAuthDestination).not.toHaveBeenCalled();
  });

  it("returns an error route when the callback cannot establish a session", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: new Error("invalid") });
    const response = await GET(new NextRequest("https://litecode.test/auth/confirm?code=bad"));
    expect(response.headers.get("location")).toBe("https://litecode.test/auth?error=confirmation");
  });
});
