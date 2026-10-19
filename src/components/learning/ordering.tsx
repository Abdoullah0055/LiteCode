"use client";
import { ArrowDown, ArrowUp } from "lucide-react";
import { GripVertical } from "lucide-react";
import { useRef, useState } from "react";
import type { WidgetProps } from "./types";

export function OrderingInteraction({ definition, answer, onChange, disabled }: WidgetProps<"ordering">) {
  const authoredOrder = definition.items.map(({ id }) => id);
  const order = answer?.kind === "ordering"
    ? [...answer.order, ...authoredOrder.filter((id) => !answer.order.includes(id))]
    : authoredOrder;
  function move(index: number, offset: number) {
    if (index + offset < 0 || index + offset >= order.length) return;
    const next = [...order];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange({ kind: "ordering", order: next });
  }
  const draggedIndex = useRef<number | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  function moveTo(from: number, insertionIndex: number) {
    if (from < 0 || insertionIndex < 0) return;
    const to = Math.min(order.length - 1, insertionIndex > from ? insertionIndex - 1 : insertionIndex);
    if (from === to || to >= order.length) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    draggedIndex.current = to;
    onChange({ kind: "ordering", order: next });
  }
  return <fieldset className="interaction-widget"><legend>Replace les blocs dans l’ordre voulu.</legend>
    <ol className="order-list" aria-label="Blocs à réordonner"
      onPointerMove={(event) => {
        if (draggedIndex.current === null || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
        const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-order-index]");
        if (!target || target.closest(".order-list") !== event.currentTarget) return;
        const targetIndex = Number(target.dataset.orderIndex);
        if (target.dataset.itemId === draggedId) return;
        const rect = target.getBoundingClientRect();
        const insertionIndex = event.clientY > rect.top + rect.height / 2 ? targetIndex + 1 : targetIndex;
        moveTo(draggedIndex.current, insertionIndex);
      }}
      onPointerUp={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); draggedIndex.current = null; setDraggedId(null); }}
      onPointerCancel={() => { draggedIndex.current = null; setDraggedId(null); }}
    >{order.map((id, index) => {
      const label = definition.items.find((item) => item.id === id)?.label || id;
      return <li className={`order-card ${draggedId === id ? "is-dragging" : ""}`} data-order-index={index} data-item-id={id} key={id}>
      <button type="button" className="order-drag-handle" aria-label={`Déplacer ${label}`} disabled={disabled}
        onPointerDown={(event) => { if (event.button !== 0) return; draggedIndex.current = index; setDraggedId(id); event.currentTarget.closest<HTMLOListElement>(".order-list")?.setPointerCapture(event.pointerId); }}
      ><GripVertical size={18} aria-hidden="true" /></button>
      <span className="order-number">{index + 1}</span><span className="order-label">{label}</span>
      <div className="order-controls"><button type="button" disabled={disabled || index === 0} aria-label={`Monter ${label}`} onClick={() => move(index, -1)}><ArrowUp size={17} /></button><button type="button" disabled={disabled || index === order.length - 1} aria-label={`Descendre ${label}`} onClick={() => move(index, 1)}><ArrowDown size={17} /></button></div>
    </li>; })}</ol>
    <p className="sr-only" aria-live="polite">{draggedId ? `Déplacement de ${definition.items.find((item) => item.id === draggedId)?.label || draggedId}` : "Utilise la poignée pour glisser un bloc, ou les flèches pour le déplacer."}</p>
  </fieldset>;
}
