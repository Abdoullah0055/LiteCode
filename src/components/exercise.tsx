"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import { Lightbulb, RotateCcw } from "lucide-react";
import { HintPanel } from "./hints";
import { Taskbar } from "./ui";
import { prepareLearningSound } from "./learning-sound";
import { createDraftWriter } from "@/lib/save-queue";
import { CodeBlock } from "./code-block";
import type {
  Challenge,
  Lesson,
  Progress,
  Question,
  TestResult,
} from "@/lib/types";

export function Exercise({
  lesson,
  questions,
  challenge,
  progress,
  hearts,
  sound,
}: {
  lesson: Lesson;
  questions: Question[];
  challenge: Challenge | null;
  progress: Progress | null;
  hearts: number;
  sound: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState(
    progress?.draft_code ?? challenge?.starter_code ?? "",
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [saveStatus, setSaveStatus] = useState(
    progress?.draft_code ? "Brouillon restauré" : "",
  );
  const [projectResults, setProjectResults] = useState<TestResult[]>(
    progress?.project_steps || [],
  );
  const dialogRef = useRef<HTMLDivElement>(null);
  const hintButtonRef = useRef<HTMLButtonElement>(null);
  const version = useRef(0);
  const [draftWriter] = useState(() =>
    createDraftWriter(code, async (value) => {
      const response = await fetch(`/api/lessons/${lesson.id}/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      if (!response.ok) throw new Error("Brouillon non enregistré. Réessaie.");
    }),
  );
  useEffect(() => {
    const serial = ++version.current;
    if (!challenge || pending || !draftWriter.needsSave(code)) return;
    const timer = setTimeout(async () => {
      setSaveStatus("Sauvegarde…");
      try {
        await draftWriter.save(code);
        if (serial === version.current) {
          setSaveStatus("Brouillon sauvegardé");
        }
      } catch {
        if (serial === version.current)
          setSaveStatus("Brouillon non sauvegardé — réessaie");
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [code, challenge, pending, draftWriter]);
  useEffect(() => {
    if (!showHints) return;
    const previous = document.activeElement as HTMLElement | null;
    const root = dialogRef.current;
    root?.querySelector<HTMLButtonElement>("button")?.focus();
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowHints(false);
      if (e.key === "Tab" && root) {
        const nodes = root.querySelectorAll<HTMLElement>(
          "button:not(:disabled),a[href]",
        );
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, [showHints]);
  async function submit() {
    setPending(true);
    setError("");
    const finishSound = prepareLearningSound(sound);
    try {
      if (challenge) {
        await draftWriter.save(code);
      }
      const r = await fetch(`/api/lessons/${lesson.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(challenge ? { code } : { answers }),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error || "Vérification indisponible.");
      finishSound(result.passed);
      setProjectResults(result.results);
      router.push(`/result/${result.attemptId}`);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Impossible de vérifier la réponse.",
      );
    } finally {
      finishSound();
      setPending(false);
    }
  }
  const title =
    lesson.type === "debugging_exercise"
      ? "Corrige le bug"
      : lesson.type === "fill_in_the_blank"
        ? "Complète le code"
        : lesson.type === "project"
          ? "Projet guidé"
          : challenge
            ? "Exercice de code"
            : "À toi de répondre";
  const canSubmit = challenge
    ? Boolean(code.trim())
    : questions.length > 0 &&
      questions.every((q) => answers[q.id] !== undefined);
  return (
    <section className="screen-page">
      <div className="page-content">
        <Taskbar position={lesson.position - 1} hearts={hearts} />
        <div className="task-content">
          <p className="eyebrow">{lesson.title}</p>
          <h1>{title}</h1>
          {lesson.type === "project" ? (
            <div className="projectcard">
              <h2 className="sec-title">🗂️ {lesson.title}</h2>
              <p>{lesson.instructions}</p>
            </div>
          ) : (
            <p className="intro">{lesson.instructions}</p>
          )}
          {challenge ? (
            <>
              {lesson.type === "project" && (
                <div aria-label="Étapes du projet">
                  {challenge.steps.map((step, i) => (
                    <div className="projectcheck" key={i}>
                      <span
                        className={
                          projectResults[i]?.passed ? "okicon" : "todoicon"
                        }
                      >
                        {projectResults[i]?.passed ? "✓" : ""}
                      </span>
                      <span>
                        {i + 1}. {step}
                      </span>
                    </div>
                  ))}
                  <p className="form-help">
                    Chaque étape est validée par un test réel. Tous les tests
                    doivent réussir pour terminer le projet.
                  </p>
                </div>
              )}
              <div className="editor-toolbar">
                <span className="save-status" role="status">
                  {saveStatus || "Brouillon sauvegardé automatiquement"}
                </span>
                <button
                  className="inline-link"
                  onClick={() => {
                    setCode(challenge.starter_code);
                    setSaveStatus("Code réinitialisé");
                  }}
                  aria-label="Réinitialiser le code"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
              <div className="codebox">
                <div className="code-head">
                  <span>javascript</span>
                  <span>{"{ }"}</span>
                </div>
                <label htmlFor="code-editor" className="sr-only">
                  Éditeur JavaScript
                </label>
                <Editor
                  disabled={pending}
                  maxLength={20000}
                  className="editor-wrap"
                  value={code}
                  onValueChange={(value) => {
                    if (value.length <= 20000) setCode(value);
                  }}
                  highlight={(value) =>
                    Prism.highlight(
                      value,
                      Prism.languages.javascript,
                      "javascript",
                    )
                  }
                  padding={16}
                  textareaId="code-editor"
                  textareaClassName="code-editor"
                  aria-label="Éditeur JavaScript"
                  spellCheck={false}
                  tabSize={2}
                  insertSpaces
                  style={{
                    color: "#e7eef9",
                    background: "#101e29",
                    minHeight: 235,
                  }}
                />
              </div>
              <p className="form-help">
                Implémente solve. Pas d’accès réseau, aux fichiers ou au DOM.
                Utilise return pour répondre.
              </p>
            </>
          ) : (
            <>
              <CodeBlock code={lesson.example} />
              {questions.map((q) => (
                <fieldset
                  key={q.id}
                  style={{ border: 0, padding: 0, margin: "20px 0" }}
                >
                  <legend
                    className="sec-title"
                    style={{ fontSize: 17, marginBottom: 12 }}
                  >
                    {q.prompt}
                  </legend>
                  <div className={q.kind === "blank" ? "wordchips" : ""}>
                    {[...q.answer_options]
                      .sort((a, b) => a.position - b.position)
                      .map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          aria-pressed={answers[q.id] === o.value}
                          className={
                            q.kind === "blank"
                              ? `wordchip ${answers[q.id] === o.value ? "sel" : ""}`
                              : `option ${answers[q.id] === o.value ? "selected" : ""}`
                          }
                          onClick={() =>
                            setAnswers((a) => ({ ...a, [q.id]: o.value }))
                          }
                        >
                          {q.kind === "choice" && (
                            <span className="radio-dot">
                              {answers[q.id] === o.value ? "✓" : ""}
                            </span>
                          )}
                          {o.label}
                        </button>
                      ))}
                  </div>
                </fieldset>
              ))}
            </>
          )}
          <div className="code-actions">
            <Link href={`/lesson/${lesson.id}`} className="inline-link">
              Revoir la leçon
            </Link>
            <button
              ref={hintButtonRef}
              className="inline-link hint-link"
              onClick={() => setShowHints(true)}
            >
              <Lightbulb
                size={16}
                style={{ display: "inline", verticalAlign: "middle" }}
              />{" "}
              Besoin d’un indice ?
            </button>
          </div>
          {error && (
            <p className="error-notice" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
      <div className="bottom sticky-action">
        <button
          className="primary"
          disabled={pending || !canSubmit}
          onClick={submit}
        >
          {pending
            ? "Vérification en cours…"
            : challenge
              ? "Exécuter les tests"
              : "Valider ma réponse"}
        </button>
      </div>
      {showHints && (
        <div
          className="dialog-backdrop"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Indices progressifs"
        >
          <HintPanel id={lesson.id} onClose={() => setShowHints(false)} />
        </div>
      )}
    </section>
  );
}
