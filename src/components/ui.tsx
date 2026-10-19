import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, Heart, Puzzle, X } from "lucide-react";
import type { ReactNode } from "react";
export function ButtonLink({
  href,
  children,
  ghost = false,
}: {
  href: string;
  children: ReactNode;
  ghost?: boolean;
}) {
  return (
    <Link href={href} className={`primary${ghost ? " ghost" : ""}`}>
      {children}
    </Link>
  );
}
export function Back({
  href = "/home",
  title,
}: {
  href?: string;
  title?: string;
}) {
  return (
    <div className="top-back">
      <Link className="backbtn" href={href} aria-label="Retour">
        <ArrowLeft size={23} />
      </Link>
      {title && (
        <h1 className="page-title" style={{ margin: 0 }}>
          {title}
        </h1>
      )}
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span aria-hidden="true">🌱</span>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
export function Taskbar({
  position,
  hearts,
}: {
  position: number;
  hearts: number;
}) {
  return (
    <div className="taskbar">
      <Link href="/path" className="xbtn" aria-label="Quitter l’activité">
        <X size={24} />
      </Link>
      <div
        className="task-progress"
        role="progressbar"
        aria-label="Parcours"
        aria-valuenow={position}
        aria-valuemin={0}
        aria-valuemax={80}
      >
        <i style={{ width: `${(position / 80) * 100}%` }} />
      </div>
      <div
        className="hearts"
        title="5 cœurs par jour UTC, un par erreur. Tu peux continuer à pratiquer à zéro."
      >
        <Heart size={20} fill="currentColor" style={{ display: "inline" }} />{" "}
        <small>{hearts}</small>
      </div>
    </div>
  );
}
export function ModuleIcon({ position }: { position: number }) {
  const marks = ["JS", "Aa", "⇄", "ƒ", "☷", "↻", "◇", "⚒", "⑂", "↗"];
  const colors = [
    "#ffda45",
    "#83c9ff",
    "#b6e9ad",
    "#19b6c8",
    "#5288f8",
    "#ffad34",
    "#ae9af7",
    "#f59b70",
    "#77cead",
    "#83bfff",
  ];
  return (
    <span
      className="cicon"
      style={{
        background: colors[position - 1],
        color: position === 1 ? "#202c3b" : "#fff",
      }}
    >
      {marks[position - 1]}
    </span>
  );
}

export function ActivityTypeIcon({ type }: { type: "lesson" | "exercise" | "project" }) {
  const Icon = type === "project" ? BriefcaseBusiness : Puzzle;
  return <Icon size={16} aria-hidden="true" />;
}
