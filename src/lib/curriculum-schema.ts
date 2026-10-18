import { z } from "zod";
export const testCaseSchema = z.object({
  label: z.string().min(1),
  args: z.array(z.unknown()),
  expected: z.unknown(),
  preserve_inputs: z.boolean().optional(),
  require_new_array: z.boolean().optional(),
});
export const authoredLessonSchema = z.object({
  id: z.string().regex(/^mvp-\d{3}$/),
  position: z.number().int().positive(),
  moduleId: z.string(),
  title: z.string().min(3),
  type: z.enum([
    "lesson",
    "multiple_choice",
    "quiz",
    "fill_in_the_blank",
    "coding_challenge",
    "debugging_exercise",
    "project",
  ]),
  body: z.string().min(80),
  example: z.string(),
  prompt: z.string().min(10),
  xp: z.number().int().min(0).max(100),
  estimatedDurationMinutes: z.number().int().positive(),
  prerequisites: z.array(z.string()),
  hints: z.array(z.string().min(8)).min(2),
  explanation: z.string().min(10),
  license: z.literal("LicenseRef-LiteCode-Original"),
  attribution: z.string(),
  modifications: z.array(z.string()).min(1),
  sourceReference: z.object({
    kind: z.literal("topic-reference-not-reused-content"),
    structureUrl: z.url(),
  }),
  choices: z.array(z.string()).min(2).optional(),
  answer: z.string().optional(),
  starter: z.string().optional(),
  solution: z.string().optional(),
  cases: z.array(testCaseSchema).min(3).optional(),
  steps: z.array(z.string()).optional(),
});
export type AuthoredLesson = z.infer<typeof authoredLessonSchema>;
export function validateCurriculum(input: unknown) {
  const data = z
    .object({
      modules: z
        .array(z.object({ id: z.string(), title: z.string() }))
        .length(10),
      lessons: z.array(authoredLessonSchema).length(80),
    })
    .parse(input);
  const seen = new Set<string>();
  const modules = new Set(data.modules.map((m) => m.id));
  data.lessons.forEach((l, index) => {
    if (seen.has(l.id) || l.position !== index + 1 || !modules.has(l.moduleId))
      throw new Error(`Invalid identity/order: ${l.id}`);
    if (l.prerequisites.some((id) => !seen.has(id)))
      throw new Error(`Forward or missing prerequisite: ${l.id}`);
    const code = ["coding_challenge", "debugging_exercise", "project"].includes(
      l.type,
    );
    if (code ? !l.cases || !l.solution || !l.starter : !l.choices || !l.answer)
      throw new Error(`Missing validation: ${l.id}`);
    if (
      !code &&
      l.type !== "fill_in_the_blank" &&
      !l.choices?.[Number(l.answer)]
    )
      throw new Error(`Missing correct option: ${l.id}`);
    if (l.type === "fill_in_the_blank" && !l.choices?.includes(l.answer!))
      throw new Error(`Invalid blank: ${l.id}`);
    seen.add(l.id);
  });
  if (
    data.modules.some(
      (m) => data.lessons.filter((l) => l.moduleId === m.id).length !== 8,
    )
  )
    throw new Error("Each module must contain 8 lessons");
  return data;
}
