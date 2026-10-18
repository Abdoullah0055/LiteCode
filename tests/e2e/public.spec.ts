import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
test("welcome and onboarding follow the reference without overflow", async ({
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
    page.getByRole("heading", { name: "Quel est ton objectif ?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Créer mes propres projets/ }).click();
  await expect(
    page.getByRole("button", { name: /Créer mes propres projets/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({
    path: `test-results/objectives-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /Quel langage/ }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Python/ })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: /JavaScript/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("body")).toHaveJSProperty(
    "scrollWidth",
    testInfo.project.use.viewport!.width,
  );
  await page.screenshot({
    path: `test-results/languages-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "Créer mon compte" }).click();
  await expect(
    page.getByRole("heading", { name: /Ta prochaine aventure/ }),
  ).toBeVisible();
  await expect(page.getByLabel("Courriel")).toHaveAttribute("type", "email");
});
test("empty environment explicitly gates protected data and mutations", async ({
  page,
  request,
}) => {
  // This suite is specifically for the intentionally unconfigured handoff.
  test.skip(
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    "Run the live suite when Supabase is configured.",
  );
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
    await expect(page).toHaveURL(/\/setup$/);
    await expect(
      page.getByRole("heading", { name: /Le parcours attend/ }),
    ).toBeVisible();
  }
  for (const endpoint of ["attempt", "hint"]) {
    const result = await request.post(`/api/lessons/mvp-001/${endpoint}`, {
      data: { answers: { "mvp-001-q1": "1" } },
    });
    expect(result.status()).toBe(503);
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
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.display).toBe("standalone");
  for (const icon of manifest.icons)
    expect((await request.get(icon.src)).ok()).toBe(true);
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
