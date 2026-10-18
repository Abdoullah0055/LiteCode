import Link from "next/link";
import { learningData } from "@/lib/data";
import { isUnlocked } from "@/lib/domain";
import { Back, Empty } from "./ui";
import { Navigation } from "./navigation";
export async function ActivityList({
  projects = false,
}: {
  projects?: boolean;
}) {
  const data = await learningData();
  const done = data.progress
    .filter((p) => p.completed_at)
    .map((p) => p.lesson_id);
  const items = data.lessons.filter((l) =>
    projects ? l.type === "project" : !["lesson", "project"].includes(l.type),
  );
  return (
    <section className="screen-page with-nav">
      <div className="page-content">
        <Back title={projects ? "Tes projets" : "Les défis"} />
        <p className="intro">
          {projects
            ? "Assemble tes nouvelles compétences, une étape à la fois."
            : "Du code, des questions et des petits déclics."}
        </p>
        {!projects && (
          <Link href="/leaderboard" className="inline-link">
            🏆 Voir le classement
          </Link>
        )}
        {!items.length && <Empty title="Aucune activité chargée" />}
        {items.map((l) => {
          const open = isUnlocked(
            data.prerequisites
              .filter((p) => p.lesson_id === l.id)
              .map((p) => p.required_lesson_id),
            done,
          );
          return (
            <article className="project-list-card" key={l.id}>
              <span className="eyebrow">
                {projects
                  ? "🗂️ Projet guidé"
                  : l.type === "debugging_exercise"
                    ? "🐞 Debugging"
                    : "⚡ Pratique"}
              </span>
              <h2>{l.title}</h2>
              <p>
                {l.duration_minutes} min · {l.xp} XP ·{" "}
                {data.modules.find((m) => m.id === l.module_id)?.title}
              </p>
              {open ? (
                <Link className="inline-link" href={`/lesson/${l.id}`}>
                  {done.includes(l.id) ? "✓ Refaire l’activité" : "Commencer →"}
                </Link>
              ) : (
                <small>🔒 Termine les étapes précédentes du parcours.</small>
              )}
            </article>
          );
        })}
      </div>
      <Navigation />
    </section>
  );
}
