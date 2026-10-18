import { expect, it } from "vitest";
import data from "../curriculum/original.fr.json";
import { validateCurriculum } from "../src/lib/curriculum-schema";
import { evaluate } from "../runner/evaluate.mjs";
import metadata from "../references/catalog_80_metadata_only.json";
it("refuses metadata-only material as publishable original content", () => {
  expect(() => validateCurriculum(metadata)).toThrow();
  const duplicate = structuredClone(data);
  duplicate.lessons[1].id = duplicate.lessons[0].id;
  expect(() => validateCurriculum(duplicate)).toThrow();
});
it("validates 80 original activities and their prerequisite DAG", () => {
  expect(validateCurriculum(data).lessons).toHaveLength(80);
  expect(() =>
    validateCurriculum({
      ...data,
      lessons: [...data.lessons, data.lessons[0]],
    }),
  ).toThrow();
  const bad = structuredClone(data);
  bad.lessons[0].prerequisites = ["mvp-080"];
  expect(() => validateCurriculum(bad)).toThrow();
});
it("every original reference solution passes all its actual JS cases", async () => {
  for (const item of data.lessons) {
    if ("cases" in item && item.cases && "solution" in item && item.solution) {
      const results = await evaluate(item.solution, item.cases);
      expect(
        results.every((r) => r.passed),
        `${item.id}: ${JSON.stringify(results)}`,
      ).toBe(true);
      const wrong = await evaluate(
        "function solve(){return undefined}",
        item.cases,
      );
      expect(
        wrong.some((r) => !r.passed),
        item.id,
      ).toBe(true);
    }
  }
});
