import { z } from "zod";
import { authoredActivitySchema } from "./learning-model";

const moduleSchema = z.object({
  id: z.string().regex(/^module-\d{2}$/),
  title: z.string().trim().min(3),
  referenceBlock: z.string().min(1),
}).strict();

const lessonSchema = z.object({
  id: z.string().regex(/^mvp-\d{3}$/),
  position: z.number().int().positive(),
  type: z.enum(["lesson", "exercise", "project"]),
  title: z.string().trim().min(3),
  course: z.string().min(1),
  moduleId: z.string().regex(/^module-\d{2}$/),
  module: z.string().min(1),
  language: z.literal("javascript"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  estimatedDurationMinutes: z.number().int().positive(),
  xp: z.number().int().min(0).max(100),
  tags: z.array(z.string().min(1)),
  prerequisites: z.array(z.string().regex(/^mvp-\d{3}$/)),
  hints: z.array(z.string().trim().min(12).max(500)).min(2),
  sourceReference: z.object({
    kind: z.literal("topic-reference-not-reused-content"),
    block: z.string().min(1),
    structureUrl: z.url(),
    exactLessonSource: z.null(),
  }).strict(),
  license: z.literal("LicenseRef-LiteCode-Original"),
  attribution: z.string().min(1),
  modifications: z.array(z.string().min(1)).min(1),
  activity: authoredActivitySchema,
}).strict();

export const authoredCurriculumSchema = z.object({
  schemaVersion: z.literal(2),
  modules: z.array(moduleSchema).length(10),
  lessons: z.array(lessonSchema).length(80),
}).strict();
export type AuthoredLesson = z.infer<typeof lessonSchema>;

const requiredProjects = new Set([
  "mvp-008", "mvp-016", "mvp-024", "mvp-032", "mvp-040",
  "mvp-048", "mvp-056", "mvp-064", "mvp-072", "mvp-080",
]);

export function validateCurriculum(input: unknown) {
  const data = authoredCurriculumSchema.parse(input);
  const seen = new Set<string>();
  const modules = new Set(data.modules.map((module) => module.id));
  const seenProjects = new Set<string>();
  data.lessons.forEach((lesson, index) => {
    if (lesson.id !== `mvp-${String(index + 1).padStart(3, "0")}` || lesson.position !== index + 1 || !modules.has(lesson.moduleId))
      throw new Error(`Invalid curriculum identity/order: ${lesson.id}`);
    if (lesson.activity.public.id !== lesson.id || lesson.activity.public.version !== 2 || lesson.activity.xp !== lesson.xp)
      throw new Error(`Activity metadata mismatch: ${lesson.id}`);
    if (lesson.prerequisites.some((id) => !seen.has(id)))
      throw new Error(`Forward or missing prerequisite: ${lesson.id}`);
    if (requiredProjects.has(lesson.id) !== (lesson.type === "project") || Boolean(lesson.activity.public.project) !== requiredProjects.has(lesson.id))
      throw new Error(`Project identity mismatch: ${lesson.id}`);
    if (lesson.activity.public.project) seenProjects.add(lesson.id);
    seen.add(lesson.id);
  });
  if (new Set(data.modules.map(({ id }) => id)).size !== data.modules.length)
    throw new Error("Module IDs must be unique");
  if (data.modules.some((module) => data.lessons.filter((lesson) => lesson.moduleId === module.id).length !== 8))
    throw new Error("Each module must contain 8 activities");
  if (seenProjects.size !== requiredProjects.size)
    throw new Error("The curriculum must contain exactly the ten guided projects");
  return data;
}
