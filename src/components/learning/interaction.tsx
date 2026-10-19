"use client";
import type { DraftInteractionAnswer, Interaction, InteractionAnswer } from "@/lib/learning-model";
import { ChoiceInteraction } from "./choice";
import { MatchingInteraction } from "./matching";
import { ClassifyInteraction } from "./classify";
import { OrderingInteraction } from "./ordering";
import { BlanksInteraction } from "./blanks";
import { TraceInteraction } from "./trace";
import { DebugInteraction } from "./debug";

export function InteractionWidget({ definition, answer, onChange, disabled = false }: {
  definition: Interaction;
  answer?: InteractionAnswer | DraftInteractionAnswer;
  onChange: (answer: InteractionAnswer) => void;
  disabled?: boolean;
}) {
  switch (definition.kind) {
    case "choice": return <ChoiceInteraction definition={definition} answer={answer?.kind === "choice" ? answer : undefined} onChange={onChange} disabled={disabled} />;
    case "matching": return <MatchingInteraction definition={definition} answer={answer?.kind === "matching" ? answer : undefined} onChange={onChange} disabled={disabled} />;
    case "classify": return <ClassifyInteraction definition={definition} answer={answer?.kind === "classify" ? answer : undefined} onChange={onChange} disabled={disabled} />;
    case "ordering": return <OrderingInteraction definition={definition} answer={answer?.kind === "ordering" ? answer : undefined} onChange={onChange} disabled={disabled} />;
    case "blanks": return <BlanksInteraction definition={definition} answer={answer?.kind === "blanks" ? answer : undefined} onChange={onChange} disabled={disabled} />;
    case "trace": return <TraceInteraction definition={definition} answer={answer?.kind === "trace" ? answer : undefined} onChange={onChange} disabled={disabled} />;
    case "debug": return <DebugInteraction definition={definition} answer={answer?.kind === "debug" ? answer : undefined} onChange={onChange} disabled={disabled} />;
  }
}
