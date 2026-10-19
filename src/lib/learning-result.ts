import type { TestResult } from "./types";

/** Adapts saved legacy, versioned and project result snapshots to the result screen. */
export function normalizeLearningResults(input: unknown): TestResult[] {
  if (!Array.isArray(input)) return [];
  const results: TestResult[] = [];
  for (const value of input) {
    if (!value || typeof value !== "object") continue;
    const item = value as Record<string, unknown>;
    if (Array.isArray(item.results)) {
      results.push(...normalizeLearningResults(item.results));
      continue;
    }
    if (typeof item.passed !== "boolean") continue;
    const label = typeof item.label === "string" ? item.label : typeof item.interactionId === "string" ? item.interactionId.replaceAll("-", " ") : "Réponse";
    const explanation = [item.feedback, item.explanation, item.error].find((text) => typeof text === "string");
    results.push({ label, passed: item.passed, ...(typeof explanation === "string" ? { error: explanation } : {}), ...(item.actual !== undefined ? { actual: item.actual } : {}) });
  }
  return results;
}
