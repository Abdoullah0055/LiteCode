import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { assertTestProject } from "../helpers/test-project";
test("real Supabase account, progress, duplicate XP and server verification", async ({
  page,
  request,
}) => {
  test.skip(
    process.env.LITECODE_E2E_LIVE !== "1",
    "Requires explicitly enabled dedicated hosted Supabase test project.",
  );
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // Never write to a hosted project without matching its explicitly confirmed ref.
  assertTestProject(url, process.env.LITECODE_E2E_TEST_PROJECT_REF);
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
    await expect(page.getByRole("heading", { name: "Quel est ton objectif ?" })).toBeVisible();
    await page.getByRole("button", { name: "Continuer", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Quel langage/ })).toBeVisible();
    await page.getByRole("button", { name: "Continuer", exact: true }).click();
    await expect(page.getByRole("button", { name: "Commencer mon parcours" })).toBeVisible();
    await page.getByRole("button", { name: "Commencer mon parcours" }).click();
    await expect(page).toHaveURL(/\/home$/);
    await expect(
      page.getByText("0 XP", { exact: false }).first(),
    ).toBeVisible();
    const locked = await page.request.post("/api/learning/mvp-004/attempt", {
      data: { version: 2, answers: {} },
    });
    expect(locked.status()).toBe(403);
    const progressAnswers = [
      ["mvp-001", { roles: { kind: "matching", pairs: [
        { leftId: "structure", rightId: "html" },
        { leftId: "appearance", rightId: "css" },
        { leftId: "behavior", rightId: "js" },
      ] } }],
      ["mvp-002", { types: { kind: "classify", assignments: {
        score: "number", code: "string", actif: "boolean", pseudo: "string",
      } } }],
      ["mvp-003", { declaration: { kind: "blanks", values: { points: "let", date: "const" } } }],
    ] as const;
    for (const [lesson, answers] of progressAnswers) {
      await page.goto(`/lesson/${lesson}`);
      await page
        .getByRole("link", {
          name: /Commencer l’exercice interactif/,
        })
        .click();
      const r = await page.request.post(`/api/learning/${lesson}/attempt`, {
        data: { version: 2, answers },
      });
      expect(r.ok()).toBe(true);
      expect((await r.json()).passed).toBe(true);
    }
    const submission = { version: 2, answers: {
      "variable-roles": { kind: "classify", assignments: { prenom: "fixed", score: "changes" } },
      "score-trace": { kind: "trace", values: { start: "2", bonus: "5" } },
      "const-intention": { kind: "choice", selected: ["const"] },
    } };
    const first = await page.request.post("/api/learning/mvp-004/attempt", {
      data: submission,
    });
    expect(first.ok()).toBe(true);
    const result = await first.json();
    expect(result.xp).toBe(20);
    const second = await page.request.post("/api/learning/mvp-004/attempt", {
      data: submission,
    });
    expect((await second.json()).xp).toBe(0);
    await page.goto(`/result/${result.attemptId}`);
    await expect(
      page.getByRole("heading", { name: "Excellent ! 🎉" }),
    ).toBeVisible();
    await page.goto("/profile");
    await expect(page.getByText("50", { exact: true })).toBeVisible();
    const hidden = await request.get(`${url}/rest/v1/interaction_keys`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
    });
    expect(hidden.ok()).toBe(false);
  } finally {
    await db.auth.admin.deleteUser(id);
  }
});
