import type { DraftInteractionAnswer, Interaction, InteractionAnswer } from "@/lib/learning-model";
type AnyAnswer = InteractionAnswer | DraftInteractionAnswer;
export type WidgetProps<K extends Interaction["kind"]> = {
  definition: Extract<Interaction, { kind: K }>;
  answer?: Extract<AnyAnswer, { kind: K }>;
  onChange: (answer: Extract<InteractionAnswer, { kind: K }>) => void;
  disabled?: boolean;
};
