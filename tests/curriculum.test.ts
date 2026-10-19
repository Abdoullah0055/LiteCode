import { expect, it } from "vitest";
import { Script } from "node:vm";
import curriculum from "../curriculum/original.fr.json";
import legacy from "../curriculum/source-metadata-v1.json";
import metadata from "../references/catalog_80_metadata_only.json";
import { validateCurriculum } from "../src/lib/curriculum-schema";
import {
  authoredActivitySchema,
  interactionAnswerSchema,
  type Interaction,
  type InteractionAnswer,
  type InteractionKey,
} from "../src/lib/learning-model";
import { gradeInteraction } from "../src/lib/learning-grading";

function acceptedAnswer(definition: Interaction, key: InteractionKey): InteractionAnswer {
  switch (definition.kind) {
    case "choice": return { kind: "choice", selected: key.kind === "choice" ? key.accepted[0] : [] };
    case "matching": return { kind: "matching", pairs: key.kind === "matching" ? key.accepted[0] : [] };
    case "classify": return { kind: "classify", assignments: key.kind === "classify" ? key.accepted[0] : {} };
    case "ordering": return { kind: "ordering", order: key.kind === "ordering" ? key.accepted[0] : [] };
    case "blanks": return { kind: "blanks", values: key.kind === "blanks" ? Object.fromEntries(Object.entries(key.accepted).map(([id, values]) => [id, values[0]])) : {} };
    case "trace": return { kind: "trace", values: key.kind === "trace" ? Object.fromEntries(Object.entries(key.accepted).map(([id, values]) => [id, values[0]])) : {} };
    case "debug": return { kind: "debug", ...(key.kind === "debug" ? key.accepted[0] : { lineId: "", replacementId: "" }) };
  }
}

function plausibleWrongAnswer(definition: Interaction, key: InteractionKey): InteractionAnswer {
  switch (definition.kind) {
    case "choice": {
      const correct = key.kind === "choice" ? key.accepted : [];
      const option = definition.options.find((item) => !correct.some((set) => set.includes(item.id)));
      if (!option) throw new Error("Choice needs a plausible distractor");
      return { kind: "choice", selected: [option.id] };
    }
    case "matching": {
      if (key.kind !== "matching") throw new Error("Mismatched matching key");
      const pairs = structuredClone(key.accepted[0]);
      if (pairs.length < 2) {
        const alternative = definition.right.find((item) => item.id !== pairs[0]?.rightId);
        if (!alternative) throw new Error("Matching needs an alternative right ID");
        pairs[0].rightId = alternative.id;
      } else [pairs[0].rightId, pairs[1].rightId] = [pairs[1].rightId, pairs[0].rightId];
      return { kind: "matching", pairs };
    }
    case "classify": {
      if (key.kind !== "classify") throw new Error("Mismatched classify key");
      const assignments = { ...key.accepted[0] };
      const first = definition.items[0].id;
      assignments[first] = definition.categories.find((item) => item.id !== assignments[first])!.id;
      return { kind: "classify", assignments };
    }
    case "ordering": {
      if (key.kind !== "ordering") throw new Error("Mismatched ordering key");
      const correct = key.accepted;
      const base = definition.items.map((item) => item.id);
      if (!correct.some((accepted) => accepted.every((id, index) => id === base[index])))
        return { kind: "ordering", order: base };
      const candidates = [base.slice().reverse(), [...base.slice(1), base[0]]];
      const wrong = candidates.find((order) => !correct.some((accepted) => accepted.every((id, index) => id === order[index])));
      if (!wrong) throw new Error("Ordering needs a plausible alternate sequence");
      return { kind: "ordering", order: wrong };
    }
    case "blanks": {
      if (key.kind !== "blanks") throw new Error("Mismatched blanks key");
      const values: Record<string, string> = {};
      for (const blank of definition.blanks) {
        if (blank.mode === "options") {
          const allowed = key.accepted[blank.id];
          const option = blank.options.find((item) => !allowed.includes(item.id));
          if (!option) throw new Error("Blank needs a plausible option distractor");
          values[blank.id] = option.id;
        } else values[blank.id] = "réponse plausible mais incorrecte";
      }
      return { kind: "blanks", values };
    }
    case "trace": {
      if (key.kind !== "trace") throw new Error("Mismatched trace key");
      const candidates = ["999", "0", "-1", "false", "true", "undefined"];
      const values = Object.fromEntries(definition.cells.map((cell) => [
        cell.id,
        candidates.find((candidate) => !key.accepted[cell.id].includes(candidate)) ?? "999999",
      ]));
      return { kind: "trace", values };
    }
    case "debug": {
      if (key.kind !== "debug") throw new Error("Mismatched debug key");
      const wrong = definition.lines.flatMap((line) => definition.replacements.map((replacement) => ({ lineId: line.id, replacementId: replacement.id })))
        .find((candidate) => !key.accepted.some((accepted) => accepted.lineId === candidate.lineId && accepted.replacementId === candidate.replacementId));
      if (!wrong) throw new Error("Debug interaction needs an alternate valid pair");
      return { kind: "debug", ...wrong };
    }
  }
}

it("validates the complete version 2 curriculum, history, order, XP and projects", () => {
  expect(() => validateCurriculum(metadata)).toThrow();
  const data = validateCurriculum(curriculum);
  expect(data.lessons).toHaveLength(80);
  expect(data.modules).toHaveLength(10);
  expect(data.modules.every((module) => data.lessons.filter((lesson) => lesson.moduleId === module.id).length === 8)).toBe(true);
  expect(data.lessons.map((lesson) => lesson.id)).toEqual(Array.from({ length: 80 }, (_, index) => `mvp-${String(index + 1).padStart(3, "0")}`));
  expect(data.lessons.map((lesson) => lesson.xp)).toEqual(legacy.lessons.map((lesson) => lesson.xp));
  expect(data.lessons.filter((lesson) => lesson.activity.public.project)).toHaveLength(10);
  const duplicate = structuredClone(curriculum);
  duplicate.lessons[1].id = duplicate.lessons[0].id;
  expect(() => validateCurriculum(duplicate)).toThrow();
  const forward = structuredClone(curriculum);
  forward.lessons[0].prerequisites = ["mvp-080"];
  expect(() => validateCurriculum(forward)).toThrow();
});

it("parses every theory block announced as JavaScript without executing it", () => {
  const data = validateCurriculum(curriculum);
  for (const lesson of data.lessons) {
    for (const block of lesson.activity.public.theory) {
      if (block.type === "code" && block.language === "javascript") {
        expect(() => new Script(block.code), `${lesson.id}: ${block.code}`).not.toThrow();
      }
    }
  }
});

it("grades a correct response and a plausible valid-ID error for every interaction", () => {
  const data = validateCurriculum(curriculum);
  let interactions = 0;
  for (const lesson of data.lessons) {
    const activity = authoredActivitySchema.parse(lesson.activity);
    for (const item of activity.public.interactions) {
      const key = activity.grading.find((entry) => entry.interactionId === item.id)!.key;
      const correct = interactionAnswerSchema.parse(acceptedAnswer(item.definition, key));
      const wrong = interactionAnswerSchema.parse(plausibleWrongAnswer(item.definition, key));
      expect(gradeInteraction(item.definition, key, correct).passed, `${lesson.id}/${item.id} correct`).toBe(true);
      expect(gradeInteraction(item.definition, key, wrong).passed, `${lesson.id}/${item.id} plausible wrong`).toBe(false);
      if (item.definition.kind === "ordering") {
        const initial = item.definition.items.map(({ id }) => id);
        for (const accepted of (key as Extract<InteractionKey, { kind: "ordering" }>).accepted) {
          expect(initial).not.toEqual(accepted);
        }
      }
      interactions++;
    }
  }
  expect(interactions).toBe(111);
});
