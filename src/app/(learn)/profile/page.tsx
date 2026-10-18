import Link from "next/link";
import { Settings } from "lucide-react";
import { accountData, learningData, requireUser } from "@/lib/data";
import { activeStreak } from "@/lib/domain";
import { Navigation } from "@/components/navigation";
import { Empty } from "@/components/ui";
export default async function Profile() {
  const [a, data, { db, user }] = await Promise.all([
    accountData(),
    learningData(),
    requireUser(),
  ]);
  const done = data.progress.filter((p) => p.completed_at);
  const { count, error } = await db
    .from("exercise_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "passed");
  if (error) throw new Error("Statistiques indisponibles.");
  const projects = done.filter(
    (p) => data.lessons.find((l) => l.id === p.lesson_id)?.type === "project",
  ).length;
  return (
    <section className="screen-page with-nav">
      <div className="page-content">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1 className="page-title">Mon profil</h1>
          <Link href="/settings" className="backbtn" aria-label="Paramètres">
            <Settings size={23} />
          </Link>
        </div>
        <div className="profile-head">
          <div className="avatar lg">🧑🏻‍💻</div>
          <div>
            <strong>{a.name}</strong>
            <p>Apprenti développeur ✏️</p>
          </div>
        </div>
        <div className="metrics">
          {[
            ["👑", a.xp, "XP total"],
            [
              "🔥",
              activeStreak(a.streak.last, a.streak.current),
              "Jours de série",
            ],
            ["⚡", done.length, "Activités terminées"],
          ].map(([emoji, value, label]) => (
            <div className="metric" key={label}>
              <div className="memoji">{emoji}</div>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="section-heading">
          <h2 className="sec-title">Tes badges</h2>
          <Link href="/leaderboard" className="text-link">
            Classement →
          </Link>
        </div>
        {a.achievements.length ? (
          <div className="badges">
            {a.achievements.map((x) => (
              <div
                className="badge-item"
                key={x.achievement_id}
                title={x.achievements.description}
              >
                <div className="medal">{x.achievements.icon}</div>
                <p>{x.achievements.title}</p>
              </div>
            ))}
          </div>
        ) : (
          <Empty title="Ton premier badge t’attend">
            <p>Termine une activité pour faire pousser ta collection.</p>
          </Empty>
        )}
        <h2 className="sec-title" style={{ marginTop: 28 }}>
          Statistiques
        </h2>
        {[
          ["Activités terminées", done.length],
          ["Tentatives réussies", count || 0],
          ["Projets complétés", projects],
          ["Plus longue série", `${a.streak.longest} jours`],
        ].map(([k, v]) => (
          <div className="statrow" key={k}>
            <span>◈ &nbsp; {k}</span>
            <b>{v}</b>
          </div>
        ))}
        <p className="form-help" style={{ marginTop: 22 }}>
          Une activité validée par jour UTC entretient ta série. Les reprises
          comptent comme pratique, sans XP supplémentaire.
        </p>
      </div>
      <Navigation />
    </section>
  );
}
