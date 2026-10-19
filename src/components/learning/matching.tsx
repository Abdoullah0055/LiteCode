"use client";
import { useState } from "react";
import type { WidgetProps } from "./types";
export function MatchingInteraction({ definition, answer, onChange, disabled }: WidgetProps<"matching">) {
  const [selected, setSelected] = useState<string | null>(null);
  const pairs = answer?.pairs || [];
  const assigned = new Map(pairs.map(({ leftId, rightId }) => [leftId, rightId]));
  const usedRight = new Set(pairs.filter(({ leftId }) => leftId !== selected).map(({ rightId }) => rightId));
  function chooseRight(rightId: string) {
    if (!selected) return;
    const rest = pairs.filter(({ leftId }) => leftId !== selected);
    onChange({ kind: "matching", pairs: [...rest, { leftId: selected, rightId }] });
    setSelected(null);
  }
  return <fieldset className="interaction-widget">
    <legend>Relie chaque carte en choisissant une carte de destination.</legend>
    <p className="form-help" aria-live="polite">{selected ? `Carte choisie : ${definition.left.find((item) => item.id === selected)?.label}. Choisis sa correspondance.` : `${definition.left.length - pairs.length} association${definition.left.length - pairs.length === 1 ? "" : "s"} à faire.`}</p>
    <div className="pair-board"><div className="pair-column"><h3>À associer</h3>{definition.left.map((item) => <div key={item.id} className="matching-row"><button type="button" disabled={disabled} aria-pressed={selected === item.id} className={`token-card ${selected === item.id ? "is-selected" : assigned.has(item.id) ? "is-matched" : ""}`} onClick={() => setSelected(item.id)}>{item.label}<small>{assigned.has(item.id) ? `→ ${definition.right.find((target) => target.id === assigned.get(item.id))?.label}` : "À relier"}</small></button>{assigned.has(item.id) && <button type="button" className="pair-remove" disabled={disabled} aria-label={`Retirer l’association de ${item.label}`} onClick={() => { onChange({ kind: "matching", pairs: pairs.filter((pair) => pair.leftId !== item.id) }); if (selected === item.id) setSelected(null); }}>Retirer</button>}</div>)}</div>
      <div className="pair-column"><h3>Destination</h3>{definition.right.map((item) => <button key={item.id} type="button" disabled={disabled || !selected || (definition.oneToOne && usedRight.has(item.id))} aria-pressed={Boolean(selected && assigned.get(selected) === item.id)} className={`token-card target-token ${selected && assigned.get(selected) === item.id ? "is-matched" : ""}`} onClick={() => chooseRight(item.id)}>{item.label}</button>)}</div></div>
    <button type="button" className="inline-link" disabled={disabled || !pairs.length} onClick={() => { onChange({ kind: "matching", pairs: [] }); setSelected(null); }}>Effacer les associations</button>
  </fieldset>;
}
