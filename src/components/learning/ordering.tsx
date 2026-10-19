"use client";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { WidgetProps } from "./types";

export function OrderingInteraction({ definition, answer, onChange, disabled }: WidgetProps<"ordering">) {
  const authoredOrder = definition.items.map(({ id }) => id);
  const order = answer?.kind === "ordering"
    ? [...answer.order, ...authoredOrder.filter((id) => !answer.order.includes(id))]
    : authoredOrder;
  function move(index: number, offset: number) {
    const next = [...order];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange({ kind: "ordering", order: next });
  }
  return <fieldset className="interaction-widget"><legend>Replace les blocs dans l’ordre voulu.</legend>
    <ol className="order-list">{order.map((id, index) => <li className="order-card" key={id}>
      <span className="order-number">{index + 1}</span><span>{definition.items.find((item) => item.id === id)?.label}</span>
      <div className="order-controls"><button type="button" disabled={disabled || index === 0} aria-label={`Monter ${definition.items.find((item) => item.id === id)?.label}`} onClick={() => move(index, -1)}><ArrowUp size={17} /></button><button type="button" disabled={disabled || index === order.length - 1} aria-label={`Descendre ${definition.items.find((item) => item.id === id)?.label}`} onClick={() => move(index, 1)}><ArrowDown size={17} /></button></div>
    </li>)}</ol>
  </fieldset>;
}
