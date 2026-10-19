import { z } from "zod";

const id = z.string().regex(/^[a-z][a-z0-9-]{0,63}$/);
const label = z.string().trim().min(1).max(240);
const uniqueIds = <T extends { id: string }>(items: T[]) =>
  new Set(items.map((item) => item.id)).size === items.length;

export const theorySegmentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), text: z.string().max(2000) }).strict(),
  z.object({ type: z.literal("strong"), text: z.string().trim().min(1).max(500) }).strict(),
  z.object({ type: z.literal("code"), text: z.string().min(1).max(500) }).strict(),
]);
export const theoryBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("heading"), level: z.union([z.literal(2), z.literal(3)]), text: label }).strict(),
  z.object({ type: z.literal("paragraph"), segments: z.array(theorySegmentSchema).min(1).max(40) }).strict(),
  z.object({ type: z.literal("code"), language: z.enum(["javascript", "text"]), code: z.string().min(1).max(4000), output: z.string().max(1000).optional() }).strict(),
  z.object({ type: z.literal("list"), ordered: z.boolean().default(false), items: z.array(z.array(theorySegmentSchema).min(1).max(20)).min(1).max(20) }).strict(),
  z.object({ type: z.literal("note"), tone: z.enum(["info", "tip", "warning"]), segments: z.array(theorySegmentSchema).min(1).max(30) }).strict(),
]);

const choiceSchema = z.object({ kind: z.literal("choice"), mode: z.enum(["single", "multiple"]), options: z.array(z.object({ id, label }).strict()).min(2).max(12) }).strict().superRefine((v, ctx) => { if (!uniqueIds(v.options)) ctx.addIssue({ code: "custom", message: "Choice option IDs must be unique" }); });
const matchingSchema = z.object({ kind: z.literal("matching"), left: z.array(z.object({ id, label }).strict()).min(1).max(12), right: z.array(z.object({ id, label }).strict()).min(1).max(12), oneToOne: z.boolean().default(true) }).strict().superRefine((v, ctx) => {
  if (!uniqueIds(v.left) || !uniqueIds(v.right) || v.left.some((item) => v.right.some((other) => other.id === item.id))) ctx.addIssue({ code: "custom", message: "Matching IDs must be unique across both columns" });
});
const classifySchema = z.object({ kind: z.literal("classify"), items: z.array(z.object({ id, label }).strict()).min(1).max(20), categories: z.array(z.object({ id, label }).strict()).min(2).max(10) }).strict().superRefine((v, ctx) => {
  if (!uniqueIds(v.items) || !uniqueIds(v.categories) || v.items.some((item) => v.categories.some((other) => other.id === item.id))) ctx.addIssue({ code: "custom", message: "Classification IDs must be unique" });
});
const orderingSchema = z.object({ kind: z.literal("ordering"), items: z.array(z.object({ id, label }).strict()).min(2).max(20) }).strict().superRefine((v, ctx) => { if (!uniqueIds(v.items)) ctx.addIssue({ code: "custom", message: "Ordering IDs must be unique" }); });
const blankSchema = z.discriminatedUnion("mode", [
  z.object({ id, label, mode: z.literal("options"), options: z.array(z.object({ id, label }).strict()).min(2).max(12) }).strict().superRefine((v, ctx) => { if (!uniqueIds(v.options)) ctx.addIssue({ code: "custom", message: "Blank option IDs must be unique" }); }),
  z.object({ id, label, mode: z.literal("short"), caseInsensitive: z.boolean().default(false) }).strict(),
]);
const blanksSchema = z.object({ kind: z.literal("blanks"), blanks: z.array(blankSchema).min(1).max(12) }).strict().superRefine((v, ctx) => { if (!uniqueIds(v.blanks)) ctx.addIssue({ code: "custom", message: "Blank IDs must be unique" }); });
const traceSchema = z.object({ kind: z.literal("trace"), cells: z.array(z.object({ id, label }).strict()).min(1).max(20) }).strict().superRefine((v, ctx) => { if (!uniqueIds(v.cells)) ctx.addIssue({ code: "custom", message: "Trace cell IDs must be unique" }); });
const debugSchema = z.object({ kind: z.literal("debug"), lines: z.array(z.object({ id, text: z.string().min(1).max(500) }).strict()).min(1).max(20), replacements: z.array(z.object({ id, text: z.string().min(1).max(500) }).strict()).min(2).max(12) }).strict().superRefine((v, ctx) => { if (!uniqueIds(v.lines) || !uniqueIds(v.replacements) || v.lines.some((item) => v.replacements.some((other) => other.id === item.id))) ctx.addIssue({ code: "custom", message: "Debug IDs must be unique" }); });

export const interactionSchema = z.discriminatedUnion("kind", [choiceSchema, matchingSchema, classifySchema, orderingSchema, blanksSchema, traceSchema, debugSchema]);
export type Interaction = z.infer<typeof interactionSchema>;

const shortText = z.string().trim().min(1).max(120);
const shortList = z.array(id).min(1).max(20);
const recordOfIds = z.record(id, id).refine((v) => Object.keys(v).length <= 20);
export const interactionKeySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("choice"), accepted: z.array(shortList).min(1).max(12) }).strict(),
  z.object({ kind: z.literal("matching"), accepted: z.array(z.array(z.object({ leftId: id, rightId: id }).strict()).min(1).max(12)).min(1).max(12) }).strict(),
  z.object({ kind: z.literal("classify"), accepted: z.array(recordOfIds).min(1).max(12) }).strict(),
  z.object({ kind: z.literal("ordering"), accepted: z.array(shortList).min(1).max(12) }).strict(),
  z.object({ kind: z.literal("blanks"), accepted: z.record(id, z.array(shortText).min(1).max(12)).refine((v) => Object.keys(v).length <= 12) }).strict(),
  z.object({ kind: z.literal("trace"), accepted: z.record(id, z.array(shortText).min(1).max(12)).refine((v) => Object.keys(v).length <= 20) }).strict(),
  z.object({ kind: z.literal("debug"), accepted: z.array(z.object({ lineId: id, replacementId: id }).strict()).min(1).max(12) }).strict(),
]);
export type InteractionKey = z.infer<typeof interactionKeySchema>;

const answerIdList = z.array(id).min(1).max(20);
const answerTextRecord = z.record(id, z.string().max(120)).refine((v) => Object.keys(v).length <= 20);
export const interactionAnswerSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("choice"), selected: answerIdList }).strict(),
  z.object({ kind: z.literal("matching"), pairs: z.array(z.object({ leftId: id, rightId: id }).strict()).min(1).max(12) }).strict(),
  z.object({ kind: z.literal("classify"), assignments: z.record(id, id).refine((v) => Object.keys(v).length <= 20) }).strict(),
  z.object({ kind: z.literal("ordering"), order: answerIdList }).strict(),
  z.object({ kind: z.literal("blanks"), values: answerTextRecord }).strict(),
  z.object({ kind: z.literal("trace"), values: answerTextRecord }).strict(),
  z.object({ kind: z.literal("debug"), lineId: id, replacementId: id }).strict(),
]);
export type InteractionAnswer = z.infer<typeof interactionAnswerSchema>;
const draftAnswerSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("choice"), selected: z.array(id).max(12) }).strict(),
  z.object({ kind: z.literal("matching"), pairs: z.array(z.object({ leftId: id, rightId: id }).strict()).max(12) }).strict(),
  z.object({ kind: z.literal("classify"), assignments: z.record(id, id).refine((v) => Object.keys(v).length <= 20) }).strict(),
  z.object({ kind: z.literal("ordering"), order: z.array(id).max(20) }).strict(),
  z.object({ kind: z.literal("blanks"), values: z.record(id, z.string().max(120)).refine((v) => Object.keys(v).length <= 12) }).strict(),
  z.object({ kind: z.literal("trace"), values: z.record(id, z.string().max(120)).refine((v) => Object.keys(v).length <= 20) }).strict(),
  z.object({ kind: z.literal("debug"), lineId: id.optional(), replacementId: id.optional() }).strict(),
]);
export type DraftInteractionAnswer = z.infer<typeof draftAnswerSchema>;
export const versionedDraftSchema = z.object({
  version: z.number().int().positive(),
  currentStep: id.optional(),
  answers: z.record(id, draftAnswerSchema).refine((answers) => Object.keys(answers).length <= 20),
}).strict();
export type VersionedDraft = z.infer<typeof versionedDraftSchema>;
export function validateVersionedDraft(activity: PublicActivity, input: unknown): VersionedDraft | null {
  const parsed = versionedDraftSchema.safeParse(input);
  if (!parsed.success || parsed.data.version !== activity.version) return null;
  const definitions = new Map(activity.interactions.map((item) => [item.id, item.definition]));
  if (parsed.data.currentStep && !(activity.project?.steps || activity.interactions.map(({ id }) => id)).includes(parsed.data.currentStep)) return null;
  for (const [interactionId, answer] of Object.entries(parsed.data.answers)) {
    const definition = definitions.get(interactionId);
    if (!definition || definition.kind !== answer.kind) return null;
    const has = (allowed: string[], value: string) => allowed.includes(value);
    switch (definition.kind) {
      case "choice": if (answer.kind !== "choice" || new Set(answer.selected).size !== answer.selected.length || answer.selected.some((item) => !has(definition.options.map(({ id }) => id), item))) return null; break;
      case "matching": if (answer.kind !== "matching" || answer.pairs.some((pair) => !has(definition.left.map(({ id }) => id), pair.leftId) || !has(definition.right.map(({ id }) => id), pair.rightId))) return null; break;
      case "classify": if (answer.kind !== "classify" || Object.entries(answer.assignments).some(([item, category]) => !has(definition.items.map(({ id }) => id), item) || !has(definition.categories.map(({ id }) => id), category))) return null; break;
      case "ordering": if (answer.kind !== "ordering" || new Set(answer.order).size !== answer.order.length || answer.order.some((item) => !has(definition.items.map(({ id }) => id), item))) return null; break;
      case "blanks": if (answer.kind !== "blanks" || Object.keys(answer.values).some((blankId) => !definition.blanks.some(({ id }) => id === blankId))) return null; else if (definition.blanks.some((blank) => blank.mode === "options" && answer.values[blank.id] !== undefined && !blank.options.some((option) => option.id === answer.values[blank.id]))) return null; break;
      case "trace": if (answer.kind !== "trace" || Object.keys(answer.values).some((cellId) => !definition.cells.some(({ id }) => id === cellId))) return null; break;
      case "debug": if (answer.kind !== "debug" || (answer.lineId && !definition.lines.some(({ id }) => id === answer.lineId)) || (answer.replacementId && !definition.replacements.some(({ id }) => id === answer.replacementId))) return null; break;
    }
  }
  return parsed.data;
}
export function interactionAnswerComplete(definition: Interaction, answer: InteractionAnswer | DraftInteractionAnswer | undefined): boolean {
  if (!answer || answer.kind !== definition.kind) return false;
  switch (definition.kind) {
    case "choice": return answer.kind === "choice" && answer.selected.length > 0 && (definition.mode !== "single" || answer.selected.length === 1);
    case "matching": return answer.kind === "matching" && answer.pairs.length === definition.left.length && new Set(answer.pairs.map(({ leftId }) => leftId)).size === definition.left.length;
    case "classify": return answer.kind === "classify" && definition.items.every(({ id }) => Boolean(answer.assignments[id]));
    case "ordering": return answer.kind === "ordering" && answer.order.length === definition.items.length && new Set(answer.order).size === definition.items.length;
    case "blanks": return answer.kind === "blanks" && definition.blanks.every((blank) => {
      const value = answer.values[blank.id];
      return typeof value === "string" && (blank.mode === "options" ? blank.options.some((option) => option.id === value) : value.trim().length > 0);
    });
    case "trace": return answer.kind === "trace" && definition.cells.every(({ id }) => Boolean(answer.values[id]?.trim()));
    case "debug": return answer.kind === "debug" && Boolean(answer.lineId && answer.replacementId);
  }
}
export const versionedSubmissionSchema = z.object({
  version: z.number().int().positive(),
  answers: z.record(id, interactionAnswerSchema).refine((answers) => Object.keys(answers).length <= 20),
}).strict();
export type VersionedSubmission = z.infer<typeof versionedSubmissionSchema>;

const publicInteractionSchema = z.object({ id, prompt: z.string().trim().min(1).max(1000), context: z.array(theoryBlockSchema).max(12).optional(), code: z.object({ language: z.enum(["javascript", "text"]), code: z.string().min(1).max(4000), output: z.string().max(1000).optional() }).strict().optional(), definition: interactionSchema }).strict();
export const publicActivitySchema = z.object({
  id: z.string().regex(/^mvp-\d{3}$/), version: z.number().int().positive(), title: z.string().trim().min(3).max(160),
  theory: z.array(theoryBlockSchema).min(1).max(40), interactions: z.array(publicInteractionSchema).min(1).max(20),
  project: z.object({ steps: z.array(id).min(2).max(12) }).strict().optional(),
}).strict().superRefine((v, ctx) => {
  const seen = new Set<string>();
  for (const interaction of v.interactions) { if (seen.has(interaction.id)) ctx.addIssue({ code: "custom", message: "Interaction IDs must be unique" }); seen.add(interaction.id); }
  if (v.project && (v.project.steps.some((step) => !seen.has(step)) || new Set(v.project.steps).size !== v.project.steps.length || v.project.steps.length !== v.interactions.length)) ctx.addIssue({ code: "custom", message: "Every project interaction must be covered once by its steps" });
});
export type PublicActivity = z.infer<typeof publicActivitySchema>;

export const authoredActivitySchema = z.object({
  public: publicActivitySchema,
  grading: z.array(z.object({ interactionId: id, key: interactionKeySchema, explanation: z.string().trim().min(1).max(1000), feedback: z.object({ correct: z.string().max(500).optional(), incorrect: z.string().max(500).optional() }).strict().optional() }).strict()).min(1).max(20),
  xp: z.number().int().min(0).max(100),
}).strict().superRefine((v, ctx) => {
  const publicById = new Map(v.public.interactions.map((item) => [item.id, item.definition]));
  const keys = new Set<string>();
  for (const entry of v.grading) {
    const definition = publicById.get(entry.interactionId);
    if (keys.has(entry.interactionId) || !definition || !keyMatchesDefinition(definition, entry.key)) {
      ctx.addIssue({ code: "custom", message: "Grading keys must uniquely match a public interaction" });
      continue;
    }
    keys.add(entry.interactionId);
  }
  if (keys.size !== publicById.size) ctx.addIssue({ code: "custom", message: "Every public interaction needs a private grading key" });
});

export function keyMatchesDefinition(definition: Interaction, key: InteractionKey): boolean {
  if (definition.kind !== key.kind) return false;
  const ids = (items: { id: string }[]) => items.map(({ id }) => id);
  const sameSet = (left: string[], right: string[]) => left.length === right.length && new Set(left).size === left.length && left.every((item) => right.includes(item));
  const exact = (record: Record<string, unknown>, expected: string[]) => Object.keys(record).length === expected.length && expected.every((id) => Object.hasOwn(record, id));
  switch (definition.kind) {
    case "choice": return key.kind === "choice" && key.accepted.every((set) => set.length > 0 && set.length <= definition.options.length && (definition.mode !== "single" || set.length === 1) && sameSet(set, [...new Set(set)]) && set.every((item) => ids(definition.options).includes(item)));
    case "matching": return key.kind === "matching" && key.accepted.every((pairs) => {
      const left = pairs.map(({ leftId }) => leftId), right = pairs.map(({ rightId }) => rightId);
      return pairs.length === definition.left.length && sameSet(left, ids(definition.left)) && right.every((item) => ids(definition.right).includes(item)) && (!definition.oneToOne || new Set(right).size === right.length);
    });
    case "classify": return key.kind === "classify" && key.accepted.every((map) => exact(map, ids(definition.items)) && Object.values(map).every((item) => ids(definition.categories).includes(item)));
    case "ordering": return key.kind === "ordering" && key.accepted.every((order) => sameSet(order, ids(definition.items)));
    case "blanks": return key.kind === "blanks" && exact(key.accepted, definition.blanks.map(({ id }) => id)) && definition.blanks.every((blank) => key.accepted[blank.id].every((item) => blank.mode === "short" ? item.trim().length > 0 : ids(blank.options).includes(item)));
    case "trace": return key.kind === "trace" && exact(key.accepted, ids(definition.cells)) && Object.values(key.accepted).every((values) => values.every((item) => item.trim().length > 0));
    case "debug": return key.kind === "debug" && key.accepted.every(({ lineId, replacementId }) => ids(definition.lines).includes(lineId) && ids(definition.replacements).includes(replacementId));
  }
}
export type AuthoredActivity = z.infer<typeof authoredActivitySchema>;
