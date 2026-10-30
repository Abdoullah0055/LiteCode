import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  setSession: vi.fn(),
  postAuthDestination: vi.fn(),
  isSameOrigin: vi.fn(),
  configured: vi.fn(() => true),
  db: { auth: {} as Record<string, unknown> },
}));
mocks.db.auth = { setSession: mocks.setSession };
vi.mock("@/lib/supabase/server", () => ({
  supabase: async () => mocks.db,
  configured: mocks.configured,
}));
vi.mock("@/lib/data", () => ({ postAuthDestination: mocks.postAuthDestination }));
vi.mock("@/lib/request-origin", () => ({ isSameOrigin: mocks.isSameOrigin }));

import { POST } from "../src/app/api/auth/session/route";

function request(body: unknown) {
  return new NextRequest("https://litecode.test/api/auth/session", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://litecode.test",
      host: "litecode.test",
    },
    body: JSON.stringify(body),
  });
}

const validBody = {
  access_token: "header.payload.signature",
  refresh_token: "refresh-value",
  type: "signup",
};

describe("hash session recovery route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSameOrigin.mockReturnValue(true);
    mocks.configured.mockReturnValue(true);
    mocks.setSession.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mocks.postAuthDestination.mockResolvedValue("/onboarding/languages");
  });

  it("stores the session and routes to the saved onboarding step", async () => {
    const response = await POST(request(validBody));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual({
      destination: "/onboarding/languages",
    });
    expect(mocks.setSession).toHaveBeenCalledWith({
      access_token: "header.payload.signature",
      refresh_token: "refresh-value",
    });
    expect(mocks.postAuthDestination).toHaveBeenCalledWith(mocks.db, "user-1");
  });

  it("routes recovery sessions to settings without onboarding lookup", async () => {
    const response = await POST(request({ ...validBody, type: "recovery" }));
    await expect(response.json()).resolves.toEqual({ destination: "/settings" });
    expect(mocks.postAuthDestination).not.toHaveBeenCalled();
  });

  it("rejects cross-origin submissions", async () => {
    mocks.isSameOrigin.mockReturnValue(false);
    const response = await POST(request(validBody));
    expect(response.status).toBe(403);
    expect(mocks.setSession).not.toHaveBeenCalled();
  });

  it("rejects malformed payloads and expired links", async () => {
    const malformed = await POST(request({ access_token: "short" }));
    expect(malformed.status).toBe(400);

    mocks.setSession.mockResolvedValue({
      data: { user: null },
      error: { message: "invalid" },
    });
    const expired = await POST(request(validBody));
    expect(expired.status).toBe(401);
  });
});
