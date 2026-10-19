import {
  authoredActivitySchema,
  interactionKeySchema,
  interactionSchema,
  interactionAnswerSchema,
  versionedSubmissionSchema,
  type AuthoredActivity,
  keyMatchesDefinition,
} from "./learning-model";

export type GradeResult = { passed: boolean; error?: "invalid_definition" | "invalid_answer" };
const fail = (error: GradeResult["error"] = "invalid_answer"): GradeResult => ({ passed: false, error });
const sameSet = (a: string[], b: string[]) => a.length === b.length && new Set(a).size === a.length && a.every((item) => b.includes(item));
const exactKeys = (input: Record<string, unknown>, expected: string[]) => {
  const actual = Object.keys(input);
  return actual.length === expected.length && expected.every((key) => Object.hasOwn(input, key));
};
const normalizeShort = (value: string, caseInsensitive: boolean) => {
  const trimmed = value.trim().replace(/\s+/g, " ");
  return caseInsensitive ? trimmed.toLocaleLowerCase("fr") : trimmed;
};
const optionIds = (items: { id: string }[]) => items.map(({ id }) => id);

/** Corrects structured answers only. Learner code is never evaluated or executed. */
export function gradeInteraction(definitionInput: unknown, keyInput: unknown, answerInput: unknown): GradeResult {
  const parsedDefinition = interactionSchema.safeParse(definitionInput);
  const parsedKey = interactionKeySchema.safeParse(keyInput);
  if (!parsedDefinition.success || !parsedKey.success || !keyMatchesDefinition(parsedDefinition.data, parsedKey.data)) return fail("invalid_definition");
  const parsedAnswer = interactionAnswerSchema.safeParse(answerInput);
  if (!parsedAnswer.success || parsedAnswer.data.kind !== parsedDefinition.data.kind) return fail();
  let answerSize: number;
  try { answerSize = JSON.stringify(parsedAnswer.data).length; } catch { return fail(); }
  if (answerSize > 2000) return fail();
  const answer = { ...parsedAnswer.data } as Record<string, unknown>;
  delete answer.kind;
  const definition = parsedDefinition.data;
  const key = parsedKey.data;

  switch (definition.kind) {
    case "choice": {
      if (!exactKeys(answer, ["selected"]) || !Array.isArray(answer.selected) || !answer.selected.every((id) => typeof id === "string")) return fail();
      const selected = answer.selected as string[];
      if (selected.length < 1 || selected.length > definition.options.length || new Set(selected).size !== selected.length || !selected.every((id) => optionIds(definition.options).includes(id)) || (definition.mode === "single" && selected.length !== 1)) return fail();
      return { passed: key.kind === "choice" && key.accepted.some((set) => sameSet(selected, set)) };
    }
    case "matching": {
      if (!exactKeys(answer, ["pairs"]) || !Array.isArray(answer.pairs) || answer.pairs.length !== definition.left.length) return fail();
      const pairs = answer.pairs as { leftId: string; rightId: string }[];
      if (!pairs.every((pair) => pair && Object.keys(pair).length === 2 && typeof pair.leftId === "string" && typeof pair.rightId === "string" && optionIds(definition.left).includes(pair.leftId) && optionIds(definition.right).includes(pair.rightId))) return fail();
      const left = pairs.map(({ leftId }) => leftId), right = pairs.map(({ rightId }) => rightId);
      if (!sameSet(left, optionIds(definition.left)) || (definition.oneToOne && new Set(right).size !== right.length)) return fail();
      return { passed: key.kind === "matching" && key.accepted.some((accepted) => accepted.length === pairs.length && accepted.every(({ leftId, rightId }) => pairs.some((pair) => pair.leftId === leftId && pair.rightId === rightId))) };
    }
    case "classify": {
      if (!exactKeys(answer, ["assignments"]) || typeof answer.assignments !== "object" || answer.assignments === null || Array.isArray(answer.assignments)) return fail();
      const assignments = answer.assignments as Record<string, string>;
      if (!exactKeys(assignments, optionIds(definition.items)) || Object.entries(assignments).some(([item, category]) => !optionIds(definition.items).includes(item) || !optionIds(definition.categories).includes(category))) return fail();
      return { passed: key.kind === "classify" && key.accepted.some((accepted) => optionIds(definition.items).every((id) => accepted[id] === assignments[id])) };
    }
    case "ordering": {
      if (!exactKeys(answer, ["order"]) || !Array.isArray(answer.order) || !answer.order.every((id) => typeof id === "string") || !sameSet(answer.order as string[], optionIds(definition.items))) return fail();
      const order = answer.order as string[];
      return { passed: key.kind === "ordering" && key.accepted.some((accepted) => accepted.length === order.length && accepted.every((id, index) => id === order[index])) };
    }
    case "blanks": {
      if (!exactKeys(answer, ["values"]) || typeof answer.values !== "object" || answer.values === null || Array.isArray(answer.values)) return fail();
      const values = answer.values as Record<string, unknown>;
      if (!exactKeys(values, definition.blanks.map(({ id }) => id)) || Object.values(values).some((value) => typeof value !== "string" || value.length > 120)) return fail();
      return { passed: key.kind === "blanks" && definition.blanks.every(({ id, mode }) => {
        const candidate = values[id] as string;
        const expected = key.accepted[id];
        const blank = definition.blanks.find((item) => item.id === id)!;
        return mode === "short" ? expected.some((item) => normalizeShort(item, blank.mode === "short" && blank.caseInsensitive) === normalizeShort(candidate, blank.mode === "short" && blank.caseInsensitive)) : expected.includes(candidate);
      }) };
    }
    case "trace": {
      if (!exactKeys(answer, ["values"]) || typeof answer.values !== "object" || answer.values === null || Array.isArray(answer.values)) return fail();
      const values = answer.values as Record<string, unknown>;
      if (!exactKeys(values, optionIds(definition.cells)) || Object.values(values).some((value) => typeof value !== "string" || value.length > 120)) return fail();
      return { passed: key.kind === "trace" && optionIds(definition.cells).every((id) => key.accepted[id].includes(values[id] as string)) };
    }
    case "debug": {
      if (!exactKeys(answer, ["lineId", "replacementId"]) || typeof answer.lineId !== "string" || typeof answer.replacementId !== "string" || !optionIds(definition.lines).includes(answer.lineId) || !optionIds(definition.replacements).includes(answer.replacementId)) return fail();
      return { passed: key.kind === "debug" && key.accepted.some((item) => item.lineId === answer.lineId && item.replacementId === answer.replacementId) };
    }
  }
}

export type ActivityGradeResult = {
  passed: boolean;
  results: { interactionId: string; label: string; passed: boolean; explanation?: string; feedback?: string }[];
  error?: "invalid_definition" | "invalid_submission" | "version_mismatch" | "unknown_answer_id";
};

/** Grades a complete versioned activity and returns explanations, never answer keys. */
export function gradeActivitySubmission(activityInput: unknown, submissionInput: unknown): ActivityGradeResult {
  const parsedActivity = authoredActivitySchema.safeParse(activityInput);
  if (!parsedActivity.success) return { passed: false, results: [], error: "invalid_definition" };
  const parsedSubmission = versionedSubmissionSchema.safeParse(submissionInput);
  if (!parsedSubmission.success) return { passed: false, results: [], error: "invalid_submission" };
  const activity: AuthoredActivity = parsedActivity.data;
  if (parsedSubmission.data.version !== activity.public.version) return { passed: false, results: [], error: "version_mismatch" };

  const expectedIds = activity.public.interactions.map(({ id }) => id);
  if (Object.keys(parsedSubmission.data.answers).some((id) => !expectedIds.includes(id))) return { passed: false, results: [], error: "unknown_answer_id" };
  const keys = new Map(activity.grading.map((entry) => [entry.interactionId, entry]));
  let invalidAnswer = false;
  const results = activity.public.interactions.map((item) => {
    const entry = keys.get(item.id)!;
    const answer = parsedSubmission.data.answers[item.id];
    if (!answer) { invalidAnswer = true; return { interactionId: item.id, label: item.prompt, passed: false, feedback: "Réponse manquante." }; }
    const grade = gradeInteraction(item.definition, entry.key, answer);
    if (grade.error) invalidAnswer = true;
    const feedback = grade.passed ? entry.feedback?.correct : entry.feedback?.incorrect;
    return { interactionId: item.id, label: item.prompt, passed: grade.passed, explanation: entry.explanation, ...(feedback ? { feedback } : {}) };
  });
  if (invalidAnswer) return { passed: false, results, error: "invalid_submission" };
  return { passed: results.every((item) => item.passed), results };
}
