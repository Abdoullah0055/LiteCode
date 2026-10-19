"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  finishOnboarding,
  goToOnboardingStep,
  saveOnboardingGoal,
  saveOnboardingLanguage,
} from "@/app/auth/actions";

export const goals = [
  ["basics", "👨‍💻", "Apprendre les bases", "Découvrir le code pas à pas"],
  ["career", "🖥️", "Devenir développeur", "Acquérir des compétences pour un métier"],
  ["projects", "🛠️", "Créer mes propres projets", "Applications, jeux, sites web"],
  ["improve", "📈", "Booster mes compétences", "Aller plus loin"],
  ["curiosity", "🦊", "Juste pour le plaisir", "Coder par curiosité"],
] as const;

function BackStep({ target, href }: { target: "objectives" | "languages"; href: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <BackStepAction target={target} href={href} router={router} pending={pending} start={start} />
  );
}

function BackStepAction({
  target, href, router, pending, start,
}: {
  target: "objectives" | "languages";
  href: string;
  router: ReturnType<typeof useRouter>;
  pending: boolean;
  start: (callback: () => void | Promise<void>) => void;
}) {
  const [error, setError] = useState("");
  return <div>
    <button type="button" className="top-back onboarding-back" disabled={pending} onClick={() => start(async () => {
      const result = await goToOnboardingStep(target);
      if (result.ok) router.replace(href);
      else setError(result.error ?? "Impossible de revenir à cette étape.");
    })}><span aria-hidden="true">‹</span> Retour</button>
    {error && <p className="error-notice" role="alert">{error}</p>}
  </div>;
}

export function Objectives({ initialGoal }: { initialGoal: string }) {
  const [goal, setGoal] = useState(initialGoal);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <section className="screen-page">
      <div className="flow-top" style={{ flex: 1 }}>
        <p className="eyebrow onboarding-brand">{"{ }"} LiteCode</p>
        <div className="stepdots"><span className="on" /><span /></div>
        <div className="flow-title">
          <h1 className="page-title">Quel est ton objectif ?</h1>
          <p>Choisis ce qui te motive :</p>
        </div>
        <div style={{ marginTop: 32 }}>
          {goals.map(([id, emoji, title, desc], i) => (
            <button
              key={id}
              type="button"
              className={`choice ${goal === id ? "selected" : ""}`}
              aria-pressed={goal === id}
              onClick={() => setGoal(id)}
            >
              <span className="choice-ico" style={{ background: ["#fff0c3", "#e7ddff", "#d2faff", "#ffe0e7", "#fff1c6"][i] }}>{emoji}</span>
              <span><span className="choice-title">{title}</span><span className="choice-desc" style={{ display: "block" }}>{desc}</span></span>
              <span className="choice-mark" aria-hidden="true">{goal === id ? "●" : ""}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="bottom">
        {error && <p className="error-notice" role="alert">{error}</p>}
        <button className="primary" disabled={pending} onClick={() => start(async () => {
          const result = await saveOnboardingGoal(goal);
          if (result.error) setError(result.error);
          else router.push("/onboarding/languages");
        })}>{pending ? "Enregistrement…" : "Continuer"}</button>
      </div>
    </section>
  );
}

export function Languages() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <section className="screen-page">
      <div className="flow-top" style={{ flex: 1 }}>
        <BackStep target="objectives" href="/onboarding/objectives" />
        <div className="stepdots"><span /><span className="on" /></div>
        <div className="flow-title">
          <h1 className="page-title">Quel langage<br />veux-tu apprendre ?</h1>
          <p>Une première aventure en JavaScript.</p>
        </div>
        <div className="tile-grid">
          {[["JavaScript", "JS", ""], ["Python", "🐍", "py"], ["HTML & CSS", "5", "html"], ["SQL", "▰", "sql"], ["Node.js", "node", "node"], ["Autres langages", "•••", "more"]].map(([name, mark, css], i) => (
            <button key={name} type="button" disabled={i !== 0} className={`language ${i === 0 ? "selected" : ""}`} aria-pressed={i === 0}>
              <span className={`langbadge ${css}`}>{mark}</span><span>{name}</span>{i !== 0 && <small>Bientôt disponible</small>}
            </button>
          ))}
        </div>
      </div>
      <div className="bottom">
        {error && <p className="error-notice" role="alert">{error}</p>}
        <button className="primary" disabled={pending} onClick={() => start(async () => {
          const result = await saveOnboardingLanguage("JavaScript");
          if (result.error) setError(result.error);
          else router.push("/onboarding/finish");
        })}>{pending ? "Enregistrement…" : "Continuer"}</button>
        <p className="onboarding-step">80 activités · À ton rythme · Dès aujourd’hui</p>
      </div>
    </section>
  );
}

const goalWelcome: Record<string, string> = {
  basics: "Tu vas découvrir les bases du code, une étape à la fois.",
  career: "Tu vas construire des bases solides pour ton avenir en développement.",
  projects: "Tu vas apprendre en créant des projets, une idée à la fois.",
  improve: "Tu vas renforcer tes compétences avec une pratique régulière.",
  curiosity: "Tu vas explorer le code à ton rythme, par curiosité.",
};

export function FinishOnboarding({
  goal,
  firstModule,
  firstLesson,
}: {
  goal: string;
  firstModule: { title: string } | null;
  firstLesson: { id: string; title: string; duration_minutes: number } | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <section className="onboarding-finish">
      <BackStep target="languages" href="/onboarding/languages" />
      <div className="finish-sky" aria-hidden="true"><span className="finish-cloud cloud-one" /><span className="finish-cloud cloud-two" /><span className="finish-path" /></div>
      <div className="finish-copy">
        <p className="eyebrow">C’est parti !</p>
        <h1 className="page-title">Bienvenue dans ton aventure&nbsp;!</h1>
        <p className="intro">{goalWelcome[goal] ?? goalWelcome.basics}</p>
      </div>
      <div className="finish-mascot">
        {/* The supplied public mascot is also used on the welcome screen. */}
        <Image src="/mascot.svg" alt="Le robot LiteCode t’accueille sur le chemin du code" width={300} height={320} priority />
        <span className="finish-star star-one" aria-hidden="true">✦</span>
        <span className="finish-star star-two" aria-hidden="true">✷</span>
      </div>
      <article className="first-module-card">
        <div className="module-card-icon" aria-hidden="true">🌱</div>
        <div>
          <p className="module-card-label">Ton premier module</p>
          <h2>{firstModule?.title ?? "Ton parcours se prépare"}</h2>
          {firstLesson ? <p>{firstLesson.title} · {firstLesson.duration_minutes} min</p> : <p>Les activités apparaîtront dès que le parcours sera chargé.</p>}
        </div>
      </article>
      {error && <p className="error-notice finish-error" role="alert">{error}</p>}
      <div className="finish-action">
        <button className="primary" disabled={pending} onClick={() => start(async () => {
          const result = await finishOnboarding();
          if (result.error) setError(result.error);
          else router.replace("/home");
        })}>{pending ? "Préparation…" : "Commencer mon parcours"}</button>
      </div>
    </section>
  );
}
