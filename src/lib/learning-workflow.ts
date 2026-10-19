import { gradeInteraction } from "./learning-grading";
import { authoredActivitySchema, versionedSubmissionSchema, type AuthoredActivity } from "./learning-model";

export type ProjectStepResult = {
  stepId: string;
  passed: boolean;
  results: { interactionId: string; label: string; passed: boolean; explanation?: string; feedback?: string }[];
  error?: "invalid_definition" | "invalid_submission" | "version_mismatch" | "invalid_step";
};

/** A project step grades only its own stable interaction ID and never grants activity rewards. */
export function gradeProjectStep(activityInput: unknown, stepId: string, submissionInput: unknown): ProjectStepResult {
  const parsed = authoredActivitySchema.safeParse(activityInput);
  if (!parsed.success) return { stepId, passed: false, results: [], error: "invalid_definition" };
  const activity: AuthoredActivity = parsed.data;
  if (!activity.public.project?.steps.includes(stepId)) return { stepId, passed: false, results: [], error: "invalid_step" };
  const submission = versionedSubmissionSchema.safeParse(submissionInput);
  if (!submission.success) return { stepId, passed: false, results: [], error: "invalid_submission" };
  if (submission.data.version !== activity.public.version) return { stepId, passed: false, results: [], error: "version_mismatch" };
  const interaction = activity.public.interactions.find(({ id }) => id === stepId);
  const answer = submission.data.answers[stepId];
  if (!interaction || !answer || Object.keys(submission.data.answers).some((id) => id !== stepId))
    return { stepId, passed: false, results: [], error: "invalid_submission" };
  const key = activity.grading.find((entry) => entry.interactionId === stepId);
  if (!key) return { stepId, passed: false, results: [], error: "invalid_definition" };
  const grade = gradeInteraction(interaction.definition, key.key, answer);
  if (grade.error) return { stepId, passed: false, results: [], error: "invalid_submission" };
  const feedback = grade.passed ? key.feedback?.correct : key.feedback?.incorrect;
  return {
    stepId,
    passed: grade.passed,
    results: [{ interactionId: stepId, label: interaction.prompt, passed: grade.passed, explanation: key.explanation, ...(feedback ? { feedback } : {}) }],
  };
}

/** Regrades saved project step submissions against this pinned version before the final attempt. */
export function gradeProjectCompletion(activityInput: unknown, savedInputs: unknown[]): {
  passed: boolean;
  results: ProjectStepResult[];
  error?: "invalid_definition" | "invalid_submission" | "incomplete_project";
} {
  const parsed = authoredActivitySchema.safeParse(activityInput);
  if (!parsed.success) return { passed: false, results: [], error: "invalid_definition" };
  const activity: AuthoredActivity = parsed.data;
  const steps = activity.public.project?.steps;
  if (!steps) return { passed: false, results: [], error: "invalid_definition" };
  const saved = new Map<string, unknown>();
  for (const input of savedInputs) {
    const submission = versionedSubmissionSchema.safeParse(input);
    if (!submission.success || submission.data.version !== activity.public.version) return { passed: false, results: [], error: "invalid_submission" };
    const ids = Object.keys(submission.data.answers);
    if (ids.length !== 1 || !steps.includes(ids[0]) || saved.has(ids[0])) return { passed: false, results: [], error: "invalid_submission" };
    saved.set(ids[0], input);
  }
  if (saved.size !== steps.length || steps.some((step) => !saved.has(step))) return { passed: false, results: [], error: "incomplete_project" };
  const results = steps.map((step) => gradeProjectStep(activity, step, saved.get(step)));
  return { passed: results.every((result) => result.passed), results };
}
