import { readFileSync, writeFileSync } from "node:fs";
import { authoredActivities } from "../curriculum/authoring";
import { activityHints } from "../curriculum/authoring/hints";
import { validateCurriculum } from "../src/lib/curriculum-schema";

const legacy = JSON.parse(
  readFileSync("curriculum/source-metadata-v1.json", "utf8"),
) as { modules: { id: string; title: string; referenceBlock: string }[]; lessons: Record<string, unknown>[] };
const projectIds = new Set([
  "mvp-008", "mvp-016", "mvp-024", "mvp-032", "mvp-040",
  "mvp-048", "mvp-056", "mvp-064", "mvp-072", "mvp-080",
]);
const oldById = new Map(legacy.lessons.map((lesson) => [String(lesson.id), lesson]));
const lessons = authoredActivities.map((activity, index) => {
  const old = oldById.get(activity.public.id);
  if (!old) throw new Error(`Historical metadata missing for ${activity.public.id}`);
  const module = legacy.modules.find((item) => item.id === old.moduleId);
  if (!module) throw new Error(`Historical module missing for ${activity.public.id}`);
  const hints = activityHints[activity.public.id];
  if (!hints || hints.length !== 2)
    throw new Error(`Two progressive theory hints required for ${activity.public.id}`);
  return {
    id: activity.public.id,
    position: index + 1,
    type: projectIds.has(activity.public.id) ? "project" : "exercise",
    title: activity.public.title,
    course: old.course,
    moduleId: old.moduleId,
    module: module.title,
    language: "javascript",
    difficulty: old.difficulty,
    estimatedDurationMinutes: old.estimatedDurationMinutes,
    xp: old.xp,
    tags: old.tags,
    prerequisites: old.prerequisites,
    hints,
    sourceReference: old.sourceReference,
    license: old.license,
    attribution: old.attribution,
    modifications: old.modifications,
    activity: { ...activity, xp: old.xp },
  };
});
const data = validateCurriculum({ schemaVersion: 2, modules: legacy.modules, lessons });
writeFileSync("curriculum/original.fr.json", `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(`Authored canonical v2 source: ${data.lessons.length} activities.`);
