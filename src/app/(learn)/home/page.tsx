import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { accountData, learningData } from "@/lib/data";
import { activeStreak, isUnlocked } from "@/lib/domain";
import { Navigation } from "@/components/navigation";
import { Empty, ModuleIcon } from "@/components/ui";
export default async function Home() {
  const [data, a] = await Promise.all([learningData(), accountData()]);
  const completed = data.progress
    .filter((p) => p.completed_at)
    .map((p) => p.lesson_id);
  const next = data.lessons.find(
    (l) =>
      !completed.includes(l.id) &&
      isUnlocked(
        data.prerequisites
          .filter((p) => p.lesson_id === l.id)
          .map((p) => p.required_lesson_id),
        completed,
      ),
  );
  return (
    <section className="screen-page with-nav">
      <div className="page-content">
        <div className="apphead">
          <Link href="/profile" className="avatar" aria-label="Mon profil">
            🧑🏻‍💻
          </Link>
          <h1 className="home-name">Salut {a.name} !</h1>
          <div className="stats-top">
            <span>
              <span className="fire">🔥</span>{" "}
              {activeStreak(a.streak.last, a.streak.current)} jours
              <br />
              de série
            </span>
            <span className="xp-pill">👑 {a.xp} XP</span>
          </div>
        </div>
        {next ? (
          <div className="home-banner">
            <div className="banner-label">
              {completed.length ? "Continue ta leçon" : "Ta première aventure"}
            </div>
            <h2 className="banner-title">{next.title}</h2>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${(completed.length / 80) * 100}%` }}
              />
            </div>
            <div className="banner-progress-label">
              {completed.length}/80 activités
            </div>
            <Link
              className="banner-go"
              href={`/lesson/${next.id}`}
              aria-label="Commencer la leçon"
            >
              ▶
            </Link>
          </div>
        ) : (
          <Empty
            title={
              data.lessons.length
                ? "Parcours terminé ! 🎉"
                : "Ton parcours est vide"
            }
          >
            <p>
              {data.lessons.length
                ? "Tu peux refaire les exercices pour consolider tes acquis."
                : "Exécute le seed Supabase pour charger les activités."}
            </p>
          </Empty>
        )}
        <div className="section-heading">
          <h2 className="sec-title">Ton parcours</h2>
          <Link className="text-link" href="/path">
            Voir tout
          </Link>
        </div>
        {data.modules.slice(0, 4).map((m) => {
          const lessons = data.lessons.filter((l) => l.module_id === m.id);
          const done = lessons.filter((l) => completed.includes(l.id)).length;
          return (
            <Link
              key={m.id}
              href={`/path#${m.id}`}
              className={`course ${next?.module_id === m.id ? "sel" : ""}`}
            >
              <ModuleIcon position={m.position} />
              <span className="ctext">
                <span className="ctitle">{m.title}</span>
                <span className="cdesc">
                  {done}/{lessons.length} activités
                </span>
                <span className="minibar">
                  <i style={{ width: `${(done / 8) * 100}%` }} />
                </span>
              </span>
              <ChevronRight size={17} className="course-arrow" />
            </Link>
          );
        })}
        <div className="daily-card">
          <span style={{ fontSize: 32 }} aria-hidden="true">
            🌱
          </span>
          <div>
            <strong>Un petit pas, chaque jour</strong>
            <p>
              {a.xpToday} XP aujourd’hui. Ton objectif : {a.settings.daily_goal}{" "}
              minutes de pratique.
            </p>
          </div>
        </div>
      </div>
      <Navigation />
    </section>
  );
}
