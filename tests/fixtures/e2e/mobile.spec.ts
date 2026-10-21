import { expect, test } from "@playwright/test";

type FixtureDraftWindow = Window & {
  __lastDraftFixture?: {
    answers: Record<string, { kind?: string; values?: Record<string, string> }>;
  };
};

test("seven interaction families fit, labels target their own inputs, and actions stay usable", async ({ page }, info) => {
  await page.goto("/mobile-harness.html");
  await expect(page.locator(".learning-task > .eyebrow")).toHaveText("Recette des interactions");
  await expect(page.locator(".learning-interaction")).toHaveCount(9);
  const interactions = page.locator(".learning-interaction");
  const choice = interactions.nth(0).locator(".answer-card").first();
  await choice.click();
  await expect(choice).toHaveAttribute("aria-pressed", "true");
  await interactions.nth(1).locator(".pair-column").first().getByRole("button").first().click();
  await interactions.nth(1).locator(".pair-column").nth(1).getByRole("button").first().click();
  await interactions.nth(2).locator(".classification-items button").first().click();
  await interactions.nth(2).locator(".zone-drop").first().click();
  await interactions.nth(3).getByRole("button", { name: /Monter/ }).last().click();
  await interactions.nth(4).getByLabel("Réponse courte").fill("essai");
  await interactions.nth(4).getByRole("button").filter({ hasText: /./ }).last().click();
  await interactions.nth(5).getByLabel("Valeur A").first().fill("2");
  await interactions.nth(5).getByLabel("Valeur B").fill("4");
  await interactions.nth(6).locator(".debug-line").first().click();
  await interactions.nth(6).locator(".debug-replacements .answer-card").first().click();
  await interactions.nth(7).getByLabel("Valeur A").fill("3");
  await interactions.nth(8).getByLabel("Réponse courte").fill("autre");
  const ids = await page.locator("input[id]").evaluateAll((inputs) => inputs.map((input) => input.id));
  expect(new Set(ids).size).toBe(ids.length);
  const labelBindings = await page.locator("label[for]").evaluateAll((labels) => labels.map((label) => (label as HTMLLabelElement).control?.id === (label as HTMLLabelElement).htmlFor));
  expect(labelBindings.every(Boolean)).toBe(true);
  await expect(page.getByRole("status").filter({ hasText: "Brouillon sauvegardé" })).toBeVisible({ timeout: 5000 });
  const draft = await page.evaluate(() => (window as Window & { __lastDraftFixture?: { answers: Record<string, { kind: string }> } }).__lastDraftFixture);
  expect(Object.values(draft!.answers).map(({ kind }) => kind)).toEqual(expect.arrayContaining(["choice", "matching", "classify", "ordering", "blanks", "trace", "debug"]));
  expect(Object.keys(draft!.answers)).toHaveLength(9);
  await expect(page.getByRole("button", { name: "Besoin d’un indice ?" })).toBeVisible();
  await page.getByRole("button", { name: "Besoin d’un indice ?" }).click();
  await expect(page.getByRole("dialog", { name: "Indices progressifs" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Fermer les indices" })).toBeFocused();
  await expect(page.getByText("0/2 indices révélés")).toBeVisible();
  await page.getByRole("button", { name: "Révéler le premier indice" }).click();
  await expect(page.getByText("1/2 indices révélés")).toBeVisible();
  await page.getByRole("button", { name: "Indice suivant" }).click();
  await expect(page.getByText("2/2 indices révélés")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tous les indices sont révélés" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Besoin d’un indice ?" })).toBeFocused();
  await page.getByRole("button", { name: "Besoin d’un indice ?" }).click();
  await expect(page.getByText("2/2 indices révélés")).toBeVisible();
  await page.getByRole("button", { name: "Retour à l’exercice" }).click();
  await expect(page.getByRole("button", { name: "Besoin d’un indice ?" })).toBeFocused();
  await page.getByRole("button", { name: "Basculer le thème" }).click();
  await expect(page.locator("main.dark-app")).toBeAttached();
  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client);
  for (const button of await page.locator(".learning-task button").all()) {
    const box = await button.boundingBox();
    if (box) expect(box.height).toBeGreaterThanOrEqual(44);
  }
  if (info.project.name === "mobile-390") {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByRole("button", { name: "Basculer le thème" }).click();
    await page.addStyleTag({ content: ".harness-controls { display: none !important; }" });
    await page.screenshot({ path: "test-results/litecode-widgets-390.png" });
  }
});

test("real activity mvp-004 renders its theory instructions on mobile", async ({ page }, info) => {
  await page.goto("/mobile-harness.html");
  await page.getByRole("button", { name: "Voir théorie 004" }).click();
  await expect(page.getByText("Comprendre let et const", { exact: true })).toBeVisible();
  await page.getByText("Revoir la règle", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Une variable donne un nom à une valeur" })).toBeVisible();
  await expect(page.getByRole("figure", { name: "Code, JavaScript" }).first()).toBeVisible();
  await expect(page.locator(".theory-output").first()).toContainText("Lina");
  await expect(page.locator(".learning-interaction").first()).toBeVisible();
  if (info.project.name === "mobile-390") {
    await page.addStyleTag({ content: ".harness-controls { display: none !important; }" });
    await page.locator(".theory-content").screenshot({ path: "test-results/litecode-theory-004-390.png" });
  }
});

test("signup confirmation is prominent, focused, and readable on narrow screens", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (options) {
      (window as Window & { __scrollBehavior?: boolean | ScrollIntoViewOptions }).__scrollBehavior = options;
      originalScrollIntoView.call(this, options);
    };
  });
  await page.goto("/mobile-harness.html");
  await page.getByRole("button", { name: "Voir confirmation courriel" }).click();
  await page.getByLabel("Courriel").fill("learner@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("Learning-123");
  await page.getByLabel("Confirmer le mot de passe").fill("Learning-123");
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  const notice = page.getByRole("status");
  await expect(notice).toContainText("Vérifie ton courriel");
  await expect(notice).toContainText("Ouvre le lien reçu pour confirmer ton compte, puis connecte-toi.");
  await expect(notice).toBeFocused();
  await expect(notice).toBeInViewport();
  expect(await notice.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return box.top >= 0 && box.bottom <= window.innerHeight;
  })).toBe(true);
  expect(await page.evaluate(() => (window as Window & { __scrollBehavior?: boolean | ScrollIntoViewOptions }).__scrollBehavior)).toEqual({ behavior: "auto", block: "start" });
  await expect(page.locator(".form-message")).toHaveCount(0);
  expect(await notice.evaluate((element) => Boolean(element.compareDocumentPosition(element.parentElement!.querySelector(".segment-control")!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client);
  if (page.viewportSize()?.width === 390)
    await page.screenshot({ path: "test-results/auth-confirmation-390.png", fullPage: true });

  await page.getByRole("button", { name: "Basculer le thème" }).click();
  await expect(page.locator(".auth-confirmation")).toHaveCSS("background-color", "rgb(27, 60, 57)");
});

test("ordering supports real touch drags in both directions and leaves page scrolling available elsewhere", async ({ page, context }) => {
  await page.goto("/mobile-harness.html");
  const cards = page.locator(".order-card");
  await expect(cards).toHaveCount(3);
  const cdp = await context.newCDPSession(page);
  await cards.last().scrollIntoViewIfNeeded();
  async function touchDrag(fromIndex: number, toIndex: number) {
    const handle = page.getByRole("button", { name: /^Déplacer / }).nth(fromIndex);
    const from = await handle.boundingBox();
    const target = await cards.nth(toIndex).boundingBox();
    if (!from || !target) throw new Error("Ordering elements need visible bounds");
    const x = from.x + from.width / 2;
    const y = from.y + from.height / 2;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
    const endY = toIndex > fromIndex ? target.y + target.height - 3 : target.y + 3;
    for (let step = 1; step <= 5; step++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: target.x + target.width / 2, y: y + (endY - y) * step / 5, id: 1 }] });
      await page.waitForTimeout(35);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  }
  const initial = await cards.first().getAttribute("data-item-id");
  await touchDrag(0, 2);
  await expect(cards.nth(2)).toHaveAttribute("data-item-id", initial!);
  const last = await cards.nth(2).getAttribute("data-item-id");
  await touchDrag(2, 0);
  await expect(cards.first()).toHaveAttribute("data-item-id", last!);
  await page.getByRole("button", { name: "Monter", exact: false }).last().click();
  await expect(cards).toHaveCount(3);
  const touchAction = await page.locator(".order-drag-handle").first().evaluate((el) => getComputedStyle(el).touchAction);
  expect(touchAction).toBe("none");
  expect(await page.locator(".order-card").first().evaluate((el) => getComputedStyle(el).touchAction)).toBe("auto");
  const startScroll = await page.evaluate(() => window.scrollY);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 5, y: 730, id: 2 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 5, y: 310, id: 2 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(startScroll);
  const second = await page.locator(".order-card").nth(1).getAttribute("data-item-id");
  await page.getByRole("button", { name: `Monter ${await page.locator(".order-card").nth(1).locator(".order-label").textContent()}` }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".order-card").first()).toHaveAttribute("data-item-id", second!);
});

test("project fixture keeps steps sequential, invalidates later steps after edits, and resumes its saved draft", async ({ page }) => {
  await page.goto("/mobile-harness.html");
  await page.getByRole("button", { name: "Voir le projet" }).click();
  await expect(page.getByRole("heading", { name: "Projet guidé" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Étape 2 À faire/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Finaliser le projet" })).toHaveCount(0);
  await page.getByRole("button", { name: "2", exact: true }).click();
  await page.getByRole("button", { name: "Vérifier cette étape" }).click();
  await expect(page.getByRole("heading", { name: /Associe chaque donnée/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Étape 3/ })).toBeDisabled();
  await page.getByRole("button", { name: "Lina" }).click();
  await page.getByRole("button", { name: /console.log\(prenom\)/ }).click();
  await page.getByRole("button", { name: "8" }).click();
  await page.getByRole("button", { name: /console.log\(score\)/ }).click();
  await page.getByRole("button", { name: "Vérifier cette étape" }).click();
  await expect(page.getByRole("heading", { name: /Place les deux appels/ })).toBeVisible();
  await page.getByRole("button", { name: "Monter Afficher le prénom" }).click();
  await page.getByRole("button", { name: "Vérifier cette étape" }).click();
  await expect(page.getByRole("heading", { name: /Quel score est affiché/ })).toBeVisible();
  await page.getByRole("button", { name: "8", exact: true }).click();
  await page.getByRole("button", { name: "Vérifier cette étape" }).click();
  await expect(page.getByRole("button", { name: "Finaliser le projet" })).toBeVisible();
  await page.getByRole("button", { name: "Finaliser le projet" }).click();
  await expect.poll(() => page.evaluate(() => (window as Window & { __lastFinishFixture?: boolean }).__lastFinishFixture)).toBe(true);
  await page.getByRole("button", { name: /Étape 1/ }).click();
  await page.getByRole("button", { name: "6", exact: true }).click();
  await expect(page.getByRole("button", { name: "Finaliser le projet" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Étape 2/ })).toBeDisabled();
  await page.getByRole("button", { name: "Reprendre le projet" }).click();
  await expect(page.getByRole("button", { name: /Étape 1 Validée/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Associe chaque donnée/ })).toBeVisible();
  await page.getByRole("button", { name: /Étape 1 Validée/ }).click();
  await expect(page.getByRole("button", { name: "2", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /Étape 2/ }).click();
  await expect(page.getByText("→ console.log(prenom)")).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as FixtureDraftWindow).__lastDraftFixture?.answers.bonus?.values?.expression)).toBe("two");
  await expect(page.getByRole("button", { name: /Étape 1 Validée/ })).toBeVisible();
  await page.getByRole("button", { name: "Reprendre après modification" }).click();
  await expect(page.getByRole("heading", { name: /Le score commence/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "6", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => page.evaluate(() => (window as FixtureDraftWindow).__lastDraftFixture?.answers.bonus?.values?.expression)).toBe("six");
  await expect(page.getByRole("button", { name: /Étape 1 À revérifier/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Étape 2/ })).toBeDisabled();
});

test("finish illustration renders and reduced motion remains respected", async ({ page }, info) => {
  await page.goto("/mobile-harness.html");
  await page.getByRole("button", { name: "Voir l’accueil final" }).click();
  await expect(page.getByRole("heading", { name: "Bienvenue dans ton aventure !" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Le robot LiteCode t’accueille sur le chemin du code" })).toBeVisible();
  await expect.poll(() => page.locator(".finish-mascot img").evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByRole("heading", { name: "Premiers pas" })).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await page.locator(".finish-mascot img").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  if (info.project.name === "mobile-390") {
    await page.addStyleTag({ content: ".harness-controls { display: none !important; }" });
    await page.screenshot({ path: "test-results/litecode-finish-390.png", fullPage: true });
  }
});
