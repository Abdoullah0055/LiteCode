import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  authoredActivitySchema,
  publicActivitySchema,
  versionedSubmissionSchema,
} from "../src/lib/learning-model";
import { gradeActivitySubmission, gradeInteraction } from "../src/lib/learning-grading";

const pilot = JSON.parse(
  readFileSync("curriculum/pilot-mvp-004.json", "utf8"),
);

it("accepts the pilot as authored content while keeping the public DTO key-free", () => {
  expect(authoredActivitySchema.parse(pilot).public.id).toBe("mvp-004");
  const publicOnly = publicActivitySchema.parse(pilot.public);
  expect(publicOnly).not.toHaveProperty("grading");
  expect(() => publicActivitySchema.parse(pilot)).toThrow();
});

it("grades choice answers and rejects omitted or unknown option IDs", () => {
  const definition = { kind: "choice", mode: "single", options: [{ id: "a", label: "A" }, { id: "b", label: "B" }] } as const;
  const key = { kind: "choice", accepted: [["b"]] };
  expect(gradeInteraction(definition, key, { kind: "choice", selected: ["b"] }).passed).toBe(true);
  expect(gradeInteraction(definition, key, {}).passed).toBe(false);
  expect(gradeInteraction(definition, key, { kind: "choice", selected: ["missing"] }).passed).toBe(false);
});

it("grades matching independent of pair order and rejects duplicate pairs", () => {
  const definition = { kind: "matching", left: [{ id: "l1", label: "L1" }, { id: "l2", label: "L2" }], right: [{ id: "r1", label: "R1" }, { id: "r2", label: "R2" }] } as const;
  const key = { kind: "matching", accepted: [[{ leftId: "l1", rightId: "r2" }, { leftId: "l2", rightId: "r1" }]] };
  expect(gradeInteraction(definition, key, { kind: "matching", pairs: [{ leftId: "l2", rightId: "r1" }, { leftId: "l1", rightId: "r2" }] }).passed).toBe(true);
  expect(gradeInteraction(definition, key, { kind: "matching", pairs: [{ leftId: "l1", rightId: "r2" }, { leftId: "l1", rightId: "r2" }] }).passed).toBe(false);
});

it("grades classifications only when every known item has exactly one category", () => {
  const definition = { kind: "classify", items: [{ id: "i1", label: "I1" }, { id: "i2", label: "I2" }], categories: [{ id: "c1", label: "C1" }, { id: "c2", label: "C2" }] } as const;
  const key = { kind: "classify", accepted: [{ i1: "c1", i2: "c2" }] };
  expect(gradeInteraction(definition, key, { kind: "classify", assignments: { i2: "c2", i1: "c1" } }).passed).toBe(true);
  expect(gradeInteraction(definition, key, { kind: "classify", assignments: { i1: "c1", i2: "unknown" } }).passed).toBe(false);
  expect(gradeInteraction(definition, key, { kind: "classify", assignments: { i1: "c1" } }).passed).toBe(false);
});

it("accepts explicitly equivalent orderings and rejects missing elements", () => {
  const definition = { kind: "ordering", items: [{ id: "a", label: "A" }, { id: "b", label: "B" }, { id: "c", label: "C" }] } as const;
  const key = { kind: "ordering", accepted: [["a", "b", "c"], ["b", "a", "c"]] };
  expect(gradeInteraction(definition, key, { kind: "ordering", order: ["b", "a", "c"] }).passed).toBe(true);
  expect(gradeInteraction(definition, key, { kind: "ordering", order: ["a", "c"] }).passed).toBe(false);
});

it("normalizes permitted short blank variants and checks required blank count", () => {
  const definition = { kind: "blanks", blanks: [{ id: "name", label: "Nom", mode: "short", caseInsensitive: true }, { id: "score", label: "Score", mode: "options", options: [{ id: "zero", label: "0" }, { id: "one", label: "1" }] }] } as const;
  const key = { kind: "blanks", accepted: { name: ["score", "le score"], score: ["one"] } };
  expect(gradeInteraction(definition, key, { kind: "blanks", values: { name: " Le SCORE ", score: "one" } }).passed).toBe(true);
  expect(gradeInteraction(definition, key, { kind: "blanks", values: { name: "score" } }).passed).toBe(false);
  expect(gradeInteraction(definition, key, { kind: "blanks", values: { name: "score", score: "missing" } }).passed).toBe(false);
});

it("grades trace cells with allowed value variants and rejects unknown cells", () => {
  const definition = { kind: "trace", cells: [{ id: "after-start", label: "Après départ" }, { id: "after-add", label: "Après ajout" }] } as const;
  const key = { kind: "trace", accepted: { "after-start": ["2"], "after-add": ["5", "05"] } };
  expect(gradeInteraction(definition, key, { kind: "trace", values: { "after-start": "2", "after-add": "05" } }).passed).toBe(true);
  expect(gradeInteraction(definition, key, { kind: "trace", values: { "after-start": "2", "after-add": "5", surprise: "0" } }).passed).toBe(false);
});

it("grades debug line and replacement together and rejects incomplete or unknown IDs", () => {
  const definition = { kind: "debug", lines: [{ id: "line-1", text: "let score = 0" }, { id: "line-2", text: "score = score + 1" }], replacements: [{ id: "fix-1", text: "score += 1" }, { id: "fix-2", text: "score = 1" }] } as const;
  const key = { kind: "debug", accepted: [{ lineId: "line-2", replacementId: "fix-1" }] };
  expect(gradeInteraction(definition, key, { kind: "debug", lineId: "line-2", replacementId: "fix-1" }).passed).toBe(true);
  expect(gradeInteraction(definition, key, { kind: "debug", lineId: "line-2" }).passed).toBe(false);
  expect(gradeInteraction(definition, key, { kind: "debug", lineId: "bad", replacementId: "fix-1" }).passed).toBe(false);
});

it("rejects malformed interaction definitions and oversized answers", () => {
  const duplicate = structuredClone(pilot);
  duplicate.public.interactions[2].definition.options[1].id = "const";
  expect(() => authoredActivitySchema.parse(duplicate)).toThrow();
  expect(gradeInteraction({ kind: "choice", mode: "single", options: [{ id: "a", label: "A" }, { id: "b", label: "B" }] }, { kind: "choice", accepted: [["a"]] }, { kind: "choice", selected: ["a"], extra: "x".repeat(5000) }).passed).toBe(false);
});

it("rejects author keys outside declared IDs and requires complete project step coverage", () => {
  const invalidKey = structuredClone(pilot);
  invalidKey.grading[0].key.accepted[0].score = "not-a-category";
  expect(() => authoredActivitySchema.parse(invalidKey)).toThrow();
  const invalidProject = structuredClone(pilot);
  invalidProject.public.project = { steps: ["variable-roles", "score-trace"] };
  expect(() => publicActivitySchema.parse(invalidProject.public)).toThrow();
});

it("defines a strict versioned answer envelope for the step 3 API", () => {
  const parsed = versionedSubmissionSchema.parse({ version: 1, answers: { "score-trace": { kind: "trace", values: { start: "2", bonus: "5" } } } });
  expect(parsed.version).toBe(1);
  expect(() => versionedSubmissionSchema.parse({ version: 1, xp: 20, answers: {} })).toThrow();
  expect(() => versionedSubmissionSchema.parse({ version: 1, answers: { q: { kind: "choice", selected: ["a"], correctAnswer: "a" } } })).toThrow();
});

it("returns private explanations per submitted interaction and identifies stale versions", () => {
  const result = gradeActivitySubmission(pilot, { version: 1, answers: {
    "variable-roles": { kind: "classify", assignments: { prenom: "fixed", score: "changes" } },
    "score-trace": { kind: "trace", values: { start: "2", bonus: "5" } },
    "const-intention": { kind: "choice", selected: ["const"] },
  } });
  expect(result.passed).toBe(true);
  expect(result.results.every((item) => item.explanation)).toBe(true);
  expect(JSON.stringify(result)).not.toContain("accepted");
  expect(gradeActivitySubmission(pilot, { version: 2, answers: {} }).error).toBe("version_mismatch");
  expect(gradeActivitySubmission(pilot, { version: 1, answers: { "variable-roles": { kind: "classify", assignments: { prenom: "fixed", score: "changes" } } } }).passed).toBe(false);
});
