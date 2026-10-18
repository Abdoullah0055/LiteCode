import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { isSameOrigin } from "../src/lib/request-origin";

function request(
  url: string,
  origin?: string,
  extra: Record<string, string> = {},
) {
  return new NextRequest(url, {
    headers: {
      host: new URL(url).host,
      ...(origin ? { origin } : {}),
      ...extra,
    },
  });
}
describe("API origin protection", () => {
  it("accepts the actual loopback host even when Next.js normalizes its URL", () => {
    const r = request(
      "http://127.0.0.1:3108/api/lessons/mvp-001/attempt",
      "http://127.0.0.1:3108",
    );
    expect(r.nextUrl.hostname).toBe("localhost");
    expect(isSameOrigin(r)).toBe(true);
  });
  it("accepts localhost and production HTTPS requests", () => {
    expect(
      isSameOrigin(
        request("http://localhost:3000/api", "http://localhost:3000"),
      ),
    ).toBe(true);
    expect(
      isSameOrigin(
        request("https://litecode.example/api", "https://litecode.example"),
      ),
    ).toBe(true);
    expect(
      isSameOrigin(request("http://[::1]:3000/api", "http://[::1]:3000")),
    ).toBe(true);
  });
  it("rejects foreign hosts, ports, schemes and opaque origins", () => {
    for (const origin of [
      "https://attacker.invalid",
      "http://127.0.0.1:4001",
      "https://127.0.0.1:3108",
      "http://localhost:3108",
      "null",
      "not-a-url",
    ]) {
      expect(
        isSameOrigin(request("http://127.0.0.1:3108/api", origin)),
        origin,
      ).toBe(false);
    }
  });
  it("does not trust a client-supplied forwarded host", () => {
    expect(
      isSameOrigin(
        request("https://litecode.example/api", "https://attacker.invalid", {
          "x-forwarded-host": "attacker.invalid",
        }),
      ),
    ).toBe(false);
  });
  it("allows requests without Origin and falls back to the URL when Host is absent", () => {
    expect(isSameOrigin(request("https://litecode.example/api"))).toBe(true);
    expect(
      isSameOrigin(
        new NextRequest("https://litecode.example/api", {
          headers: { origin: "https://litecode.example" },
        }),
      ),
    ).toBe(true);
  });
});
