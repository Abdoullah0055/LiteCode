import type { WidgetProps } from "./types";
export function BlanksInteraction({ definition, answer, onChange, disabled }: WidgetProps<"blanks">) {
  const values = answer?.values || {};
  function update(id: string, value: string) { onChange({ kind: "blanks", values: { ...values, [id]: value } }); }
  return <fieldset className="interaction-widget"><legend>Complète chaque espace.</legend><div className="short-answer-list">
    {definition.blanks.map((blank) => <div className="short-answer-card" key={blank.id}>{blank.mode === "options" ? <p id={`blank-${blank.id}-label`}>{blank.label}</p> : <label htmlFor={`blank-${blank.id}`}>{blank.label}</label>}
      {blank.mode === "options" ? <div className="choice-options">{blank.options.map((option) => <button key={option.id} type="button" disabled={disabled} aria-pressed={values[blank.id] === option.id} className={`answer-card compact ${values[blank.id] === option.id ? "is-selected" : ""}`} onClick={() => update(blank.id, option.id)}>{option.label}</button>)}</div>
        : <input id={`blank-${blank.id}`} type="text" inputMode="text" autoComplete="off" maxLength={120} value={values[blank.id] || ""} disabled={disabled} onChange={(event) => update(blank.id, event.target.value)} />}
    </div>)}
  </div></fieldset>;
}
