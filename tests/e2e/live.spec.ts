import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
test("real Supabase account, progress, duplicate XP and server verification", async ({
  page,
  request,
}) => {
  test.skip(
    process.env.LITECODE_E2E_LIVE !== "1",
    "Requires explicitly enabled disposable local Supabase and runner.",
  );
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // Never create test accounts against a remote project automatically.
  expect(["127.0.0.1", "localhost"].includes(new URL(url).hostname)).toBe(true);
  const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const email = `litecode-${Date.now()}@example.test`,
    password = `Learning-${Date.now()}!`;
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  expect(error).toBeNull();
  const id = data.user!.id;
  try {
    await page.goto("/auth");
    await page.getByLabel("Courriel").fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(password);
    await page
      .getByRole("button", { name: "Se connecter", exact: true })
      .click();
    await page.getByRole("button", { name: "Allons-y" }).click();
    await expect(page).toHaveURL(/\/home$/);
    await expect(
      page.getByText("0 XP", { exact: false }).first(),
    ).toBeVisible();
    const locked = await page.request.post("/api/lessons/mvp-004/attempt", {
      data: { code: "function solve(n){return n+1}" },
    });
    expect(locked.status()).toBe(403);
    for (const [lesson, answer] of [
      ["mvp-001", "1"],
      ["mvp-002", "1"],
      ["mvp-003", "let"],
    ]) {
      await page.goto(`/lesson/${lesson}`);
      await page
        .getByRole("link", {
          name: /Vérifier ma compréhension|Passer à la pratique/,
        })
        .click();
      const r = await page.request.post(`/api/lessons/${lesson}/attempt`, {
        data: { answers: { [`${lesson}-q1`]: answer } },
      });
      expect(r.ok()).toBe(true);
      expect((await r.json()).passed).toBe(true);
    }
    const first = await page.request.post("/api/lessons/mvp-004/attempt", {
      data: { code: "function solve(n){return n+1}" },
    });
    expect(first.ok()).toBe(true);
    const result = await first.json();
    expect(result.xp).toBe(20);
    const second = await page.request.post("/api/lessons/mvp-004/attempt", {
      data: { code: "function solve(n){return n+1}" },
    });
    expect((await second.json()).xp).toBe(0);
    await page.goto(`/result/${result.attemptId}`);
    await expect(
      page.getByRole("heading", { name: "Excellent ! 🎉" }),
    ).toBeVisible();
    await page.goto("/profile");
    await expect(page.getByText("50", { exact: true })).toBeVisible();
    const hidden = await request.get(`${url}/rest/v1/question_keys`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
    });
    expect(hidden.ok()).toBe(false);
  } finally {
    await db.auth.admin.deleteUser(id);
  }
});
