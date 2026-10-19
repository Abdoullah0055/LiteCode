"use client";
import { useState } from "react";
import type { WidgetProps } from "./types";
export function DebugInteraction({ definition, answer, onChange, disabled }: WidgetProps<"debug">) {
  const [lineId, setLineId] = useState(answer?.lineId || "");
  const [replacementId, setReplacementId] = useState(answer?.replacementId || "");
  function update(nextLine: string, nextReplacement: string) {
    setLineId(nextLine); setReplacementId(nextReplacement);
    if (nextLine && nextReplacement) onChange({ kind: "debug", lineId: nextLine, replacementId: nextReplacement });
  }
  const replacement = definition.replacements.find(({ id }) => id === replacementId);
  return <fieldset className="interaction-widget"><legend>Choisis la ligne fautive, puis sa correction.</legend>
    <ol className="debug-lines">{definition.lines.map((line, index) => <li key={line.id}><button type="button" disabled={disabled} aria-pressed={lineId === line.id} className={`debug-line ${lineId === line.id ? "is-selected" : ""}`} onClick={() => update(line.id, replacementId)}><span>{index + 1}</span><code>{line.text}</code></button></li>)}</ol>
    <div className="debug-replacements"><p>Remplacement proposé</p>{definition.replacements.map((item) => <button key={item.id} type="button" disabled={disabled} aria-pressed={replacementId === item.id} className={`answer-card ${replacementId === item.id ? "is-selected" : ""}`} onClick={() => update(lineId, item.id)}><code>{item.text}</code></button>)}</div>
    <div className="debug-preview" aria-live="polite"><strong>Aperçu</strong><pre>{definition.lines.map((line, index) => `${index + 1}. ${line.id === lineId && replacement ? replacement.text : line.text}`).join("\n")}</pre></div>
  </fieldset>;
}
