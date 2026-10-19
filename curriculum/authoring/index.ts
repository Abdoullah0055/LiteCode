import { authoredActivitySchema } from "../../src/lib/learning-model";
import { module01 } from "./module-01";
import { module02 } from "./module-02";
import { module03 } from "./module-03";
import { module04 } from "./module-04";
import { module05 } from "./module-05";
import { module06 } from "./module-06";
import { module07 } from "./module-07";
import { module08 } from "./module-08";
import { module09 } from "./module-09";
import { module10 } from "./module-10";
import { depthSections } from "./depth";
import { paragraph } from "./helpers";

export const authoredActivities = [
  ...module01,
  ...module02,
  ...module03,
  ...module04,
  ...module05,
  ...module06,
  ...module07,
  ...module08,
  ...module09,
  ...module10,
].map((activity) => {
  const additional = (depthSections[activity.public.id] ?? []).flatMap((section) => [
    { type: "heading" as const, level: 3 as const, text: section.heading },
    ...section.paragraphs.map(paragraph),
    ...(section.example ? [{ type: "code" as const, language: "javascript" as const, ...section.example }] : []),
  ]);
  return authoredActivitySchema.parse({
    ...activity,
    public: { ...activity.public, theory: [...activity.public.theory, ...additional] },
  });
});
