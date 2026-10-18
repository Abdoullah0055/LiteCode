import Link from "next/link";
import { requireUser } from "@/lib/data";
import { admin } from "@/lib/supabase/server";
import { Back, Empty } from "@/components/ui";
import { Navigation } from "@/components/navigation";
export default async function Leaderboard({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  const global = period === "all";
  const { user } = await requireUser();
  const week = new Date();
  week.setUTCHours(0, 0, 0, 0);
  week.setUTCDate(week.getUTCDate() - ((week.getUTCDay() + 6) % 7));
  const { data, error } = await admin().rpc("rankings", {
    p_since: global ? "1970-01-01T00:00:00Z" : week.toISOString(),
  });
  if (error) throw new Error("Classement indisponible.");
  const rows = (data || []) as {
    user_id: string;
    display_name: string;
    xp: number;
  }[];
  return (
    <section className="screen-page with-nav">
      <div className="page-content">
        <Back href="/profile" title="Classement" />
        <div className="rank-switch">
          <Link href="/leaderboard" className={!global ? "sel" : ""}>
            Cette semaine
          </Link>
          <Link href="/leaderboard?period=all" className={global ? "sel" : ""}>
            Global
          </Link>
        </div>
        {rows.length ? (
          rows.map((r, i) => (
            <div
              key={r.user_id}
              className={`rank ${r.user_id === user.id ? "me" : ""}`}
            >
              <span className="rank-place">
                {["🥇", "🥈", "🥉"][i] || i + 1}
              </span>
              <div className="avatar">🧑‍💻</div>
              <strong>
                {r.display_name}
                {r.user_id === user.id ? " (toi)" : ""}
              </strong>
              <span className="rank-xp">{r.xp} XP</span>
            </div>
          ))
        ) : (
          <Empty title="La première place t’attend">
            <p>
              Aucun XP pour cette période. Termine une activité pour entrer dans
              le classement.
            </p>
          </Empty>
        )}
        <p className="center form-help" style={{ marginTop: 25 }}>
          {global
            ? "XP cumulés depuis le début."
            : "Du lundi 00:00 UTC à maintenant."}{" "}
          Seuls les profils ayant choisi d’apparaître sont affichés.
        </p>
      </div>
      <Navigation />
    </section>
  );
}
