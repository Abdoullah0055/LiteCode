"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
export function HintPanel({
  id,
  onClose,
}: {
  id: string;
  onClose?: () => void;
}) {
  const [hints, setHints] = useState<string[]>([]);
  const [total, setTotal] = useState(2);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState("");
  const reveal = useCallback(async () => {
    setPending(true);
    setError("");
    try {
      const r = await fetch(`/api/lessons/${id}/hint`, { method: "POST" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setHints(data.hints);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Indice indisponible.");
    } finally {
      setPending(false);
    }
  }, [id]);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/lessons/${id}/hint`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
      })
      .then((data) => {
        setHints(data.hints);
        setTotal(data.total);
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error ? error.message : "Indices indisponibles.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setPending(false);
      });
    return () => controller.abort();
  }, [id]);
  return (
    <div className="hint-card">
      {onClose && (
        <button
          className="hint-close"
          aria-label="Fermer les indices"
          onClick={onClose}
        >
          ×
        </button>
      )}
      <div className="hintcircle">💡</div>
      <h2>Un petit coup de pouce</h2>
      <p className="hint-counter">
        {hints.length}/{total} indices révélés
      </p>
      {hints.length ? (
        hints.map((h, i) => (
          <p key={i}>
            <strong>Indice {i + 1}.</strong> {h}
          </p>
        ))
      ) : (
        <p>Révèle les conseils un à un. Les indices ne retirent aucun XP.</p>
      )}
      {error && (
        <p role="alert" className="error-notice">
          {error}
        </p>
      )}
      <button
        className="primary"
        disabled={pending || hints.length >= total}
        onClick={reveal}
      >
        {pending
          ? "Chargement…"
          : hints.length === 0
            ? "Révéler le premier indice"
            : hints.length < total
              ? "Indice suivant"
              : "Tous les indices sont révélés"}
      </button>
      {onClose ? (
        <button className="primary ghost" onClick={onClose}>
          Retour à l’exercice
        </button>
      ) : (
        <Link href={`/exercise/${id}`} className="primary ghost">
          Retour à l’exercice
        </Link>
      )}
    </div>
  );
}
