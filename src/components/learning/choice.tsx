import type { WidgetProps } from "./types";
export function ChoiceInteraction({ definition, answer, onChange, disabled }: WidgetProps<"choice">) {
  const selected = answer?.selected || [];
  function toggle(id: string) {
    const next = definition.mode === "single" ? [id] : selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id];
    onChange({ kind: "choice", selected: next });
  }
  return <fieldset className="interaction-widget choice-widget">
    <legend>{definition.mode === "single" ? "Choisis une réponse" : "Choisis toutes les réponses qui conviennent"}</legend>
    <div className="choice-options">{definition.options.map((option) => {
      const active = selected.includes(option.id);
      return <button key={option.id} type="button" disabled={disabled} aria-pressed={active} className={`answer-card ${active ? "is-selected" : ""}`} onClick={() => toggle(option.id)}>
        <span className="answer-mark" aria-hidden="true">{active ? "✓" : definition.mode === "single" ? "○" : "□"}</span>{option.label}
      </button>;
    })}</div>
  </fieldset>;
}
