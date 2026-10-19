import { expect, it } from "vitest";
import { normalizeLearningResults } from "../src/lib/learning-result";

it("normalizes legacy, versioned and nested project feedback for the result screen", () => {
  expect(normalizeLearningResults([
    { label: "Test historique", passed: false, error: "À revoir" },
    { interactionId: "score-trace", label: "Indique la valeur", passed: false, explanation: "Le score vaut 5." },
    { stepId: "step-1", passed: true, results: [{ interactionId: "const-intention", label: "Choisis le mot", passed: true }] },
  ])).toEqual([
    { label: "Test historique", passed: false, error: "À revoir" },
    { label: "Indique la valeur", passed: false, error: "Le score vaut 5." },
    { label: "Choisis le mot", passed: true },
  ]);
});
