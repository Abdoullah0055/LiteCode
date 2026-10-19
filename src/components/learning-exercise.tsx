"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb } from "lucide-react";
import type { DraftInteractionAnswer, InteractionAnswer, PublicActivity, VersionedDraft } from "@/lib/learning-model";
import { interactionAnswerComplete } from "@/lib/learning-model";
import { createSaveQueue } from "@/lib/save-queue";
import { prepareLearningSound } from "@/components/learning-sound";
import { HintPanel } from "@/components/hints";
import { Taskbar } from "@/components/ui";
import { TheoryContent } from "@/components/theory-content";
import { CodeBlock } from "@/components/code-block";
import { InteractionWidget } from "@/components/learning/interaction";

type SavedStep = { position: number; submission: { version: number; answers: Record<string, InteractionAnswer> }; passed: boolean };

export function LearningExercise({ activity, position, hearts, sound, draft, savedSteps = [] }: {
  activity: PublicActivity; position: number; hearts: number; sound: boolean;
  draft: VersionedDraft | null; savedSteps?: SavedStep[];
}) {
  const router = useRouter();
  const isProject = Boolean(activity.project);
  const steps = useMemo(() => activity.project?.steps || activity.interactions.map(({ id }) => id), [activity]);
  const [answers, setAnswers] = useState<Record<string, DraftInteractionAnswer>>(draft?.answers || Object.assign({}, ...savedSteps.map((step) => step.submission.answers)));
  const [activeStep, setActiveStep] = useState(Math.min(steps.length - 1, Math.max(0, steps.indexOf(draft?.currentStep || ""))));
  const [passedSteps, setPassedSteps] = useState(() => new Set(savedSteps.filter((step) => step.passed).map((step) => step.position - 1)));
  const [changedSteps, setChangedSteps] = useState(() => new Set<number>());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resultFeedback, setResultFeedback] = useState("");
  const [showHints, setShowHints] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const hintButtonRef = useRef<HTMLButtonElement>(null);
  const saveQueue = useRef(createSaveQueue());
  const saveSerial = useRef(0);

  const queueDraft = useCallback((nextAnswers: Record<string, DraftInteractionAnswer>, stepId: string) => {
    const payload: VersionedDraft = { version: activity.version, currentStep: stepId, answers: nextAnswers };
    return saveQueue.current.enqueue(async () => {
      const response = await fetch(`/api/learning/${activity.id}/draft`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("Brouillon non sauvegardé. Réessaie.");
    });
  }, [activity.id, activity.version]);

  useEffect(() => {
    const serial = ++saveSerial.current;
    const timer = setTimeout(() => {
      queueDraft(answers, steps[activeStep]).then(() => {
        if (serial === saveSerial.current) setNotice("Brouillon sauvegardé");
      }).catch(() => {
        if (serial === saveSerial.current) setNotice("Brouillon non sauvegardé — réessaie");
      });
    }, 700);
    return () => clearTimeout(timer);
  }, [answers, activeStep, queueDraft, steps]);

  useEffect(() => {
    if (!showHints) return;
    const previous = document.activeElement as HTMLElement | null;
    const root = dialogRef.current;
    root?.querySelector<HTMLButtonElement>("button")?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowHints(false);
      if (event.key === "Tab" && root) {
        const nodes = root.querySelectorAll<HTMLElement>("button:not(:disabled),a[href]");
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", handle);
    return () => { document.removeEventListener("keydown", handle); previous?.focus(); };
  }, [showHints]);

  const activeId = steps[activeStep];
  const active = activity.interactions.find(({ id }) => id === activeId)!;
  const visibleInteractions = isProject ? [active] : activity.interactions;
  const complete = visibleInteractions.every((item) => interactionAnswerComplete(item.definition, answers[item.id]));

  function updateAnswer(id: string, answer: InteractionAnswer) {
    const next = { ...answers, [id]: answer };
    setAnswers(next);
    if (isProject) setChangedSteps((current) => new Set(current).add(activeStep));
    setResultFeedback("");
    setNotice("Modifications en cours…");
  }

  async function post(path: string, body: unknown) {
    const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw Object.assign(new Error(result.error || "Vérification indisponible."), { status: response.status });
    return result as { attemptId?: string; passed: boolean; results: { interactionId: string; label?: string; passed: boolean; explanation?: string; feedback?: string }[]; xp?: number };
  }

  async function validate() {
    if (!complete || busy) return;
    setBusy(true); setError("");
    const finishSound = prepareLearningSound(sound);
    try {
      await queueDraft(answers, activeId);
      if (isProject) {
        const result = await post(`/api/learning/${activity.id}/steps/${activeId}`, { version: activity.version, answers: { [activeId]: answers[activeId] } });
        const passed = result.passed;
        setResultFeedback(result.results[0]?.feedback || result.results[0]?.explanation || "");
        setPassedSteps((current) => {
          const next = new Set(current);
          for (const index of [...next]) if (index >= activeStep) next.delete(index);
          if (passed) next.add(activeStep);
          return next;
        });
        setChangedSteps((current) => new Set([...current].filter((index) => index < activeStep)));
        finishSound(passed);
        if (passed && activeStep < steps.length - 1) setActiveStep(activeStep + 1);
        else if (!passed) setError("Cette étape est à revoir. Ajuste ta réponse puis réessaie.");
        else setNotice("Toutes les étapes sont prêtes. Tu peux finaliser le projet.");
      } else {
        const result = await post(`/api/learning/${activity.id}/attempt`, { version: activity.version, answers });
        finishSound(result.passed);
        router.push(`/result/${result.attemptId}`);
        router.refresh();
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible de vérifier la réponse.");
    } finally { finishSound(); setBusy(false); }
  }

  async function finishProject() {
    if (busy || passedSteps.size !== steps.length) return;
    setBusy(true); setError("");
    const finishSound = prepareLearningSound(sound);
    try {
      await queueDraft(answers, activeId);
      const result = await post(`/api/learning/${activity.id}/project/finish`, { version: activity.version });
      finishSound(result.passed);
      router.push(`/result/${result.attemptId}`); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Impossible de finaliser le projet."); }
    finally { finishSound(); setBusy(false); }
  }

  let firstIncompleteStep = 0;
  while (passedSteps.has(firstIncompleteStep)) firstIncompleteStep++;
  const earliestChangedStep = changedSteps.size ? Math.min(...changedSteps) : steps.length;
  const canSelectStep = (index: number) => index <= Math.min(firstIncompleteStep, earliestChangedStep);
  return <section className="screen-page">
    <div className="page-content"><Taskbar position={position - 1} hearts={hearts} />
      <div className="task-content learning-task">
        <p className="eyebrow">{activity.title}</p>
        <h1>{isProject ? "Projet guidé" : "À toi de répondre"}</h1>
        <details className="learning-theory-review"><summary>Revoir la règle</summary><TheoryContent blocks={activity.theory} /></details>
        {isProject && <nav className="project-stepper" aria-label="Étapes du projet">{steps.map((stepId, index) => {
          const state = changedSteps.has(index) || [...changedSteps].some((changed) => changed < index) ? "review" : passedSteps.has(index) ? "passed" : "todo";
          return <button key={stepId} type="button" disabled={!canSelectStep(index)} aria-current={activeStep === index ? "step" : undefined} className={`project-step ${state} ${activeStep === index ? "current" : ""}`} onClick={() => { setActiveStep(index); setError(""); setResultFeedback(""); }}>
            <span>{state === "passed" ? "✓" : state === "review" ? "↻" : index + 1}</span><b>Étape {index + 1}</b><small>{state === "passed" ? "Validée" : state === "review" ? "À revérifier" : "À faire"}</small>
          </button>;
        })}</nav>}
        {visibleInteractions.map((interaction) => <article className="learning-interaction" key={interaction.id}>
          <h2>{interaction.prompt}</h2>
          {interaction.context && <TheoryContent blocks={interaction.context} />}
          {interaction.code && <CodeBlock code={interaction.code.code} language={interaction.code.language} />}
          <InteractionWidget definition={interaction.definition} answer={answers[interaction.id]} onChange={(answer) => updateAnswer(interaction.id, answer)} disabled={busy} />
        </article>)}
        <div className="learning-actions"><button ref={hintButtonRef} type="button" className="inline-link" onClick={() => setShowHints(true)}><Lightbulb size={16} /> Besoin d’un indice ?</button><a href={`/lesson/${activity.id}`} className="inline-link">Revoir la leçon</a></div>
        <p className="save-status" role="status">{busy ? "Vérification…" : notice}</p>
        {resultFeedback && <p className="interaction-feedback" role="status">{resultFeedback}</p>}
        {error && <p className="error-notice" role="alert">{error}</p>}
      </div>
    </div>
    <div className="bottom sticky-action">{isProject && passedSteps.size === steps.length && changedSteps.size === 0 ? <button className="primary" disabled={busy} onClick={finishProject}>{busy ? "Finalisation…" : "Finaliser le projet"}</button> : <button className="primary" disabled={busy || !complete} onClick={validate}>{busy ? "Vérification…" : isProject ? "Vérifier cette étape" : "Valider mes réponses"}</button>}</div>
    {showHints && <div className="dialog-backdrop" ref={dialogRef} role="dialog" aria-modal="true" aria-label="Indices progressifs"><HintPanel id={activity.id} onClose={() => setShowHints(false)} /></div>}
  </section>;
}
