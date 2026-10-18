"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Back, ButtonLink } from "./ui";
import { saveOnboarding } from "@/app/auth/actions";
export const goals = [
  ["basics", "👨‍💻", "Apprendre les bases", "Découvrir le code pas à pas"],
  [
    "career",
    "🖥️",
    "Devenir développeur",
    "Acquérir des compétences pour un métier",
  ],
  [
    "projects",
    "🛠️",
    "Créer mes propres projets",
    "Applications, jeux, sites web",
  ],
  ["improve", "📈", "Booster mes compétences", "Aller plus loin"],
  ["curiosity", "🦊", "Juste pour le plaisir", "Coder par curiosité"],
];
export function Objectives() {
  const [goal, setGoal] = useState("basics");
  const router = useRouter();
  return (
    <section className="screen-page">
      <div className="flow-top" style={{ flex: 1 }}>
        <Back href="/" />
        <div className="stepdots">
          <span className="on" />
          <span />
        </div>
        <div className="flow-title">
          <h1 className="page-title">Quel est ton objectif ?</h1>
          <p>Choisis ce qui te motive :</p>
        </div>
        <div style={{ marginTop: 32 }}>
          {goals.map(([id, emoji, title, desc], i) => (
            <button
              key={id}
              className={`choice ${goal === id ? "selected" : ""}`}
              aria-pressed={goal === id}
              onClick={() => setGoal(id)}
            >
              <span
                className="choice-ico"
                style={{
                  background: [
                    "#fff0c3",
                    "#e7ddff",
                    "#d2faff",
                    "#ffe0e7",
                    "#fff1c6",
                  ][i],
                }}
              >
                {emoji}
              </span>
              <span>
                <span className="choice-title">{title}</span>
                <span className="choice-desc" style={{ display: "block" }}>
                  {desc}
                </span>
              </span>
              <span className="choice-mark">{goal === id ? "●" : ""}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="bottom">
        <button
          className="primary"
          onClick={() => {
            localStorage.setItem("litecode-goal", goal);
            router.push("/onboarding/languages");
          }}
        >
          Continuer
        </button>
      </div>
    </section>
  );
}
export function Languages() {
  return (
    <section className="screen-page">
      <div className="flow-top" style={{ flex: 1 }}>
        <Back href="/onboarding/objectives" />
        <div className="stepdots">
          <span />
          <span className="on" />
        </div>
        <div className="flow-title">
          <h1 className="page-title">
            Quel langage
            <br />
            veux-tu apprendre ?
          </h1>
          <p>Une première aventure en JavaScript.</p>
        </div>
        <div className="tile-grid">
          {[
            ["JavaScript", "JS", ""],
            ["Python", "🐍", "py"],
            ["HTML & CSS", "5", "html"],
            ["SQL", "▰", "sql"],
            ["Node.js", "node", "node"],
            ["Autres langages", "•••", "more"],
          ].map(([name, mark, css], i) => (
            <button
              key={name}
              disabled={i !== 0}
              className={`language ${i === 0 ? "selected" : ""}`}
              aria-pressed={i === 0}
            >
              <span className={`langbadge ${css}`}>{mark}</span>
              <span>{name}</span>
              {i !== 0 && <small>Bientôt disponible</small>}
            </button>
          ))}
        </div>
      </div>
      <div className="bottom">
        <ButtonLink href="/auth?mode=signup">Créer mon compte</ButtonLink>
        <p className="onboarding-step">
          80 activités · À ton rythme · Dès aujourd’hui
        </p>
      </div>
    </section>
  );
}
export function FinishOnboarding() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <section className="page-content">
      <p className="eyebrow">C’est parti !</p>
      <h1 className="page-title">Ton parcours t’attend 🌱</h1>
      <p className="intro">
        Sauvegarde ton objectif et commence ta première activité.
      </p>
      {error && (
        <p className="error-notice" role="alert">
          {error}
        </p>
      )}
      <button
        className="primary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await saveOnboarding(
              localStorage.getItem("litecode-goal") || "basics",
            );
            if (result.error) setError(result.error);
            else router.replace("/home");
          })
        }
      >
        {pending ? "Enregistrement…" : "Allons-y"}
      </button>
    </section>
  );
}
