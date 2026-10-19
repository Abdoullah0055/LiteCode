import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import curriculum from "../../curriculum/original.fr.json";
import type { InteractionAnswer, PublicActivity, VersionedDraft } from "../../src/lib/learning-model";
import { LearningExercise } from "../../src/components/learning-exercise";
import { FinishOnboarding } from "../../src/components/onboarding";
import "../../src/app/globals.css";

const source = curriculum.lessons.map((lesson) => lesson.activity.public) as unknown as PublicActivity[];
const interactionKinds = ["choice", "matching", "classify", "ordering", "blanks", "trace", "debug"] as const;
const interactions: PublicActivity["interactions"] = interactionKinds.map((kind) => {
  const item = source.flatMap((activity) => activity.interactions).find((interaction) => interaction.definition.kind === kind && (kind !== "ordering" || (interaction.definition.kind === "ordering" && interaction.definition.items.length >= 3)))!;
  return { ...item, id: `${kind}-sample`, prompt: kind === "trace" || kind === "blanks" ? `Entre ta réponse pour \`${item.id}\`.` : item.prompt };
});
const trace = interactions.find((item) => item.definition.kind === "trace")!;
const blanks = interactions.find((item) => item.definition.kind === "blanks")!;
// Add repeated business IDs so the browser can verify unique DOM IDs across widgets.
const traceDefinition: Extract<PublicActivity["interactions"][number]["definition"], { kind: "trace" }> = trace.definition.kind === "trace" ? { ...trace.definition, cells: [{ id: "shared-field", label: "Valeur A" }, { id: "shared-field-2", label: "Valeur B" }] } : { kind: "trace", cells: [] };
const blankDefinition: Extract<PublicActivity["interactions"][number]["definition"], { kind: "blanks" }> = blanks.definition.kind === "blanks" ? { ...blanks.definition, blanks: [{ id: "shared-field", label: "Réponse courte", mode: "short", caseInsensitive: false }, ...blanks.definition.blanks.filter((blank) => blank.mode === "options").slice(0, 1)] } : { kind: "blanks", blanks: [] };
const fixtureInteractions = [
  ...interactions.map((item) => item.id === trace.id ? { ...item, definition: traceDefinition } : item.id === blanks.id ? { ...item, definition: blankDefinition } : item),
  { ...trace, id: "trace-sample-copy", definition: traceDefinition, prompt: "Deuxième trace du champ partagé." },
  { ...blanks, id: "blanks-sample-copy", definition: blankDefinition, prompt: "Deuxième texte à trous du champ partagé." },
];
const testActivity = {
  ...source.find((activity) => activity.id === "mvp-004")!,
  id: "mvp-900",
  title: "Recette des interactions",
  project: undefined,
  interactions: fixtureInteractions,
} as PublicActivity;
const projectActivity = source.find((activity) => activity.id === "mvp-008")!;
const resumedDraft: VersionedDraft = { version: projectActivity.version, currentStep: "message", answers: { message: { kind: "matching", pairs: [{ leftId: "lina", rightId: "prenom" }] } } };
const resumedSteps = [{ position: 1, submission: { version: projectActivity.version, answers: { bonus: { kind: "blanks", values: { expression: "two" } } as InteractionAnswer } }, passed: true }];
const editedDraft: VersionedDraft = { version: projectActivity.version, currentStep: "sortie", answers: { bonus: { kind: "blanks", values: { expression: "six" } } } };
const editedSteps: { position: number; submission: { version: number; answers: Record<string, InteractionAnswer> }; passed: boolean }[] = [
  { position: 1, submission: { version: projectActivity.version, answers: { bonus: { kind: "blanks", values: { expression: "two" } } as InteractionAnswer } }, passed: true },
  { position: 2, submission: { version: projectActivity.version, answers: { message: { kind: "matching", pairs: [{ leftId: "lina", rightId: "prenom" }] } as InteractionAnswer } }, passed: true },
  { position: 3, submission: { version: projectActivity.version, answers: { affichage: { kind: "ordering", order: ["prenom", "score"] } as InteractionAnswer } }, passed: true },
  { position: 4, submission: { version: projectActivity.version, answers: { sortie: { kind: "choice", selected: ["eight"] } as InteractionAnswer } }, passed: true },
];

const originalFetch = window.fetch.bind(window);
let fixtureHintCount = 0;
window.fetch = async (input, init) => {
  const url = String(input);
  if (url.includes("/api/lessons/") && url.endsWith("/hint")) {
    if (init?.method === "POST") fixtureHintCount = Math.min(2, fixtureHintCount + 1);
    return Response.json({ hints: ["Repère `score` dans le code.", "Vérifie la valeur après le bonus."].slice(0, fixtureHintCount), total: 2 });
  }
  if (url.includes("/api/learning/") && (init?.method === "PUT" || init?.method === "POST")) {
    if (url.endsWith("/draft")) Object.assign(window, { __lastDraftFixture: JSON.parse(String(init.body)) });
    if (url.endsWith("/project/finish")) { Object.assign(window, { __lastFinishFixture: true }); return Response.json({ passed: true, attemptId: "fixture-attempt", results: [], xp: 20 }); }
    return Response.json({ passed: true, attemptId: "fixture-attempt", nextStepId: null, completedSteps: 1, totalSteps: 4, results: [{ interactionId: "fixture", passed: true, feedback: "Étape enregistrée." }], xp: 0 });
  }
  return originalFetch(input, init);
};

const theory004 = source.find((activity) => activity.id === "mvp-004")!;

function Harness() {
  const [dark, setDark] = useState(false);
  const [screen, setScreen] = useState<"exercise" | "theory" | "project" | "resume" | "resume-edited" | "finish">("exercise");
  return <div className="app-shell"><main className={dark ? "dark-app" : ""}>
    <nav className="harness-controls" aria-label="Contrôles de recette">
      <button type="button" onClick={() => setDark((value) => !value)}>Basculer le thème</button>
      <button type="button" onClick={() => setScreen("exercise")}>Voir les interactions</button>
      <button type="button" onClick={() => setScreen("theory")}>Voir théorie 004</button>
      <button type="button" onClick={() => setScreen("project")}>Voir le projet</button>
      <button type="button" onClick={() => setScreen("resume")}>Reprendre le projet</button>
      <button type="button" onClick={() => setScreen("resume-edited")}>Reprendre après modification</button>
      <button type="button" onClick={() => setScreen("finish")}>Voir l’accueil final</button>
    </nav>
    {screen === "exercise" ? <LearningExercise key={screen} activity={testActivity} position={1} hearts={5} sound={false} draft={null} /> : screen === "theory" ? <LearningExercise key={screen} activity={theory004} position={4} hearts={5} sound={false} draft={null} /> : screen === "project" ? <LearningExercise key={screen} activity={projectActivity} position={8} hearts={5} sound={false} draft={null} /> : screen === "resume" ? <LearningExercise key={screen} activity={projectActivity} position={8} hearts={5} sound={false} draft={resumedDraft} savedSteps={resumedSteps} /> : screen === "resume-edited" ? <LearningExercise key={screen} activity={projectActivity} position={8} hearts={5} sound={false} draft={editedDraft} savedSteps={editedSteps} /> : <FinishOnboarding key={screen} goal="basics" firstModule={{ title: "Premiers pas" }} firstLesson={{ id: "mvp-001", title: "Découvrir une variable", duration_minutes: 5 }} />}
  </main></div>;
}

createRoot(document.getElementById("root")!).render(<Harness />);
