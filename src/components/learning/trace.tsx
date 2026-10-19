import type { WidgetProps } from "./types";
export function TraceInteraction({ definition, answer, onChange, disabled }: WidgetProps<"trace">) {
  const values = answer?.values || {};
  return <fieldset className="interaction-widget"><legend>Inscris la valeur à chaque moment.</legend><div className="short-answer-list">
    {definition.cells.map((cell, index) => <div className="short-answer-card trace-cell" key={cell.id}><label htmlFor={`trace-${cell.id}`}><span>Étape {index + 1}</span>{cell.label}</label><input id={`trace-${cell.id}`} type="text" inputMode="text" autoComplete="off" maxLength={120} value={values[cell.id] || ""} disabled={disabled} onChange={(event) => onChange({ kind: "trace", values: { ...values, [cell.id]: event.target.value } })} /></div>)}
  </div></fieldset>;
}
