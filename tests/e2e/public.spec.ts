import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
test("welcome routes new learners to signup without overflow", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Le code/ })).toBeVisible();
  await expect(
    page.getByAltText("Un petit robot souriant qui programme"),
  ).toBeVisible();
  await expect(page.locator("body")).toHaveJSProperty(
    "scrollWidth",
    testInfo.project.use.viewport!.width,
  );
  await page.screenshot({
    path: `test-results/welcome-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "Commencer", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /Ta prochaine aventure/ }),
  ).toBeVisible();
  await expect(page.getByLabel("Confirmer le mot de passe")).toHaveAttribute("type", "password");
  await expect(page.getByRole("checkbox", { name: /Se souvenir de cet appareil/ })).toBeChecked();
  await expect(page.getByLabel("Courriel")).toHaveAttribute("type", "email");
  await page.getByLabel("Courriel").fill("learner@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("Learning-123");
  await page.getByLabel("Confirmer le mot de passe").fill("Different-123");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  expect(await page.getByLabel("Confirmer le mot de passe").evaluate((input) => (input as HTMLInputElement).validity.customError)).toBe(true);
  await expect(page).toHaveURL(/\/auth\?mode=signup$/);
});
test("protected data and mutations require configuration and a signed-in account", async ({
  page,
  request,
}) => {
  for (const route of [
    "/home",
    "/path",
    "/lesson/mvp-001",
    "/exercise/mvp-004",
    "/profile",
    "/leaderboard",
    "/settings",
    "/projects",
    "/challenges",
    "/hints/mvp-001",
  ]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/(?:setup|auth)$/);
    const configured = new URL(page.url()).pathname === "/auth";
    await expect(page.getByRole("heading", {
      name: configured ? "Heureux de te revoir !" : /Le parcours attend/,
    })).toBeVisible();
  }
  for (const endpoint of ["attempt", "hint"]) {
    const result = await request.post(`/api/lessons/mvp-001/${endpoint}`, {
      data: { answers: { "mvp-001-q1": "1" } },
    });
    expect([401, 503]).toContain(result.status());
  }
  const forged = await request.post("/api/lessons/mvp-001/attempt", {
    headers: { Origin: "https://attacker.invalid" },
    data: { passed: true, xp: 1000 },
  });
  expect(forged.status()).toBe(403);
});
test("authentication forms, recovery and install manifest work", async ({
  page,
  request,
}) => {
  await page.goto("/auth");
  await expect(
    page.getByRole("heading", { name: "Heureux de te revoir !" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Mot de passe oublié ?" }).click();
  await expect(
    page.getByRole("heading", { name: "Retrouve ton compte." }),
  ).toBeVisible();
  await expect(page.getByLabel("Mot de passe")).toHaveCount(0);
  await expect(page.locator('input[name="password"]')).toHaveCount(0);
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.display).toBe("standalone");
  for (const icon of manifest.icons)
    expect((await request.get(icon.src)).ok()).toBe(true);
});
test("onboarding routes require a confirmed signed-in account", async ({ page }) => {
  await page.goto("/onboarding/objectives");
  await expect(page).toHaveURL(/\/(?:setup|auth)$/);
});
test("capture the supplied prototype for visual comparison", async ({
  page,
}, testInfo) => {
  if (testInfo.project.name !== "iphone-390") return;
  await page.setContent(
    readFileSync("references/prototype_mobile_16_ecrans.html", "utf8"),
  );
  await page.locator("#previewBtn").click();
  await page
    .locator("#soloPhone")
    .screenshot({ path: "test-results/reference-welcome.png" });
  await page.locator("#screenpicker").selectOption("1", { force: true });
  await page
    .locator("#soloPhone")
    .screenshot({ path: "test-results/reference-objectives.png" });
});
