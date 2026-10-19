"use client";
import { useState } from "react";
import type { WidgetProps } from "./types";
export function ClassifyInteraction({ definition, answer, onChange, disabled }: WidgetProps<"classify">) {
  const [selected, setSelected] = useState<string | null>(null);
  const assignments = answer?.assignments || {};
  const buckets = definition.categories.map((category) => ({ ...category, items: definition.items.filter((item) => assignments[item.id] === category.id) }));
  return <fieldset className="interaction-widget">
    <legend>Choisis un jeton, puis sa zone de classement.</legend>
    <p className="form-help" aria-live="polite">{selected ? `« ${definition.items.find((item) => item.id === selected)?.label} » est sélectionné. Choisis une zone.` : `${definition.items.length - Object.keys(assignments).length} jeton${definition.items.length - Object.keys(assignments).length === 1 ? "" : "s"} à classer.`}</p>
    <div className="classification-items" aria-label="Jetons à classer">{definition.items.filter((item) => !assignments[item.id]).map((item) => <button key={item.id} type="button" disabled={disabled} aria-pressed={selected === item.id} className={`token-card ${selected === item.id ? "is-selected" : ""}`} onClick={() => setSelected(item.id)}>{item.label}</button>)}</div>
    <div className="classification-zones">{buckets.map((bucket) => <section key={bucket.id} className="classification-zone" aria-label={`Zone ${bucket.label}`}>
      <h3>{bucket.label}</h3><div className="zone-tokens">{bucket.items.map((item) => <button key={item.id} type="button" disabled={disabled} aria-pressed={selected === item.id} className={`assigned-token ${selected === item.id ? "is-selected" : ""}`} onClick={() => setSelected(item.id)}>{item.label}</button>)}
        <button type="button" disabled={disabled || !selected} aria-pressed={false} className="zone-drop" onClick={() => { if (!selected) return; onChange({ kind: "classify", assignments: { ...assignments, [selected]: bucket.id } }); setSelected(null); }}>Déposer ici</button>
      </div></section>)}</div>
  </fieldset>;
}
