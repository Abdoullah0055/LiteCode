import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { REMEMBER_DEVICE_COOKIE, REMEMBER_DEVICE_SECONDS } from "../src/lib/auth-policy";

const mocks = vi.hoisted(() => ({
  values: [] as { name: string; value: string; options: Record<string, unknown> }[],
}));
vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url: string, _key: string, config: { cookies: { setAll: (values: typeof mocks.values) => void } }) => ({
    auth: { getUser: async () => {
      config.cookies.setAll(mocks.values);
      return { data: { user: null } };
    } },
  }),
}));

import { proxy } from "../src/proxy";

describe("Supabase proxy cookie policy", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-test-key");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    mocks.values = [];
  });

  it("renews persistent token chunks and the device preference for 30 days", async () => {
    mocks.values = [{ name: "sb-project-auth-token.0", value: "chunk", options: { maxAge: 400 * 24 * 60 * 60 } }];
    const request = new NextRequest("https://litecode.test/home", { headers: { cookie: `${REMEMBER_DEVICE_COOKIE}=yes` } });
    const response = await proxy(request);
    const token = response.cookies.get("sb-project-auth-token.0");
    const preference = response.cookies.get(REMEMBER_DEVICE_COOKIE);
    expect(token?.maxAge).toBe(REMEMBER_DEVICE_SECONDS);
    expect(token?.httpOnly).toBe(true);
    expect(token?.secure).toBe(true);
    expect(token?.sameSite).toBe("lax");
    expect(preference?.maxAge).toBe(REMEMBER_DEVICE_SECONDS);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("keeps unchecked cookies as session cookies", async () => {
    mocks.values = [{ name: "sb-project-auth-token", value: "token", options: { maxAge: 400, expires: new Date("2030-01-01") } }];
    const response = await proxy(new NextRequest("http://litecode.test/home"));
    const token = response.cookies.get("sb-project-auth-token");
    expect(token?.maxAge).toBeUndefined();
    expect(token?.expires).toBeUndefined();
    expect(token?.httpOnly).toBe(true);
    expect(token?.secure).toBe(false);
    expect(response.cookies.get(REMEMBER_DEVICE_COOKIE)).toBeUndefined();
  });

  it("preserves maxAge zero for logout and chunk deletion", async () => {
    mocks.values = [{ name: "sb-project-auth-token.1", value: "", options: { maxAge: 0 } }];
    const request = new NextRequest("https://litecode.test/home", { headers: { cookie: `${REMEMBER_DEVICE_COOKIE}=yes` } });
    const response = await proxy(request);
    expect(response.cookies.get("sb-project-auth-token.1")?.maxAge).toBe(0);
    expect(response.cookies.get(REMEMBER_DEVICE_COOKIE)).toBeUndefined();
  });
});
