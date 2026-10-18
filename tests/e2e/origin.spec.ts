import { test, expect } from "@playwright/test";

test("same-origin browser submissions reach authentication while foreign origins are denied", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const status = await page.evaluate(async () => {
    // A real browser supplies Origin, unlike APIRequestContext by default.
    // No session is sent, so this cannot write a learning attempt or grant XP.
    const response = await fetch("/api/lessons/mvp-001/attempt", {
      method: "POST",
      credentials: "omit",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: {} }),
    });
    return response.status;
  });
  expect([401, 503]).toContain(status);
  const foreign = await request.post("/api/lessons/mvp-001/attempt", {
    headers: { Origin: "https://attacker.invalid" },
    data: { answers: {} },
  });
  expect(foreign.status()).toBe(403);
});
