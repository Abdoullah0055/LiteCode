import { notFound } from "next/navigation";
import { accountData, learningData, requireUser } from "@/lib/data";
import { isUnlocked } from "@/lib/domain";
import { ButtonLink, Taskbar, Empty } from "@/components/ui";
import { CodeBlock } from "@/components/code-block";
import { TheoryContent } from "@/components/theory-content";
import { admin } from "@/lib/supabase/server";
import { loadAuthoredActivity } from "@/lib/learning-runtime";
export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, a, session] = await Promise.all([learningData(), accountData(), requireUser()]);
  const l = data.lessons.find((x) => x.id === id);
  if (!l) notFound();
  const completed = data.progress
    .filter((p) => p.completed_at)
    .map((p) => p.lesson_id);
  const open = isUnlocked(
    data.prerequisites
      .filter((p) => p.lesson_id === id)
      .map((p) => p.required_lesson_id),
    completed,
  );
  const { data: activeVersion, error: versionError } = await session.db.from("lesson_versions")
    .select("id").eq("lesson_id", id).eq("is_active", true).maybeSingle();
  if (versionError) throw new Error("Version de leçon indisponible.");
  const authored = activeVersion ? await loadAuthoredActivity(admin(), id) : null;
  return (
    <section className="screen-page">
      <div className="page-content">
        <Taskbar position={l.position - 1} hearts={a.hearts} />
        {!open ? (
          <Empty title="Encore un petit pas avant celle-ci">
            <p>Termine les prérequis pour déverrouiller cette activité.</p>
            <ButtonLink href="/path">Voir mon parcours</ButtonLink>
          </Empty>
        ) : (
          <>
            <p className="eyebrow">
              {data.modules.find((m) => m.id === l.module_id)?.title} ·{" "}
              {l.duration_minutes} min
            </p>
            <h1 className="page-title">{l.title}</h1>
            {completed.includes(id) && (
              <div className="complete-card">
                ✓ Activité terminée. Tu peux la refaire sans gagner de XP
                supplémentaires.
              </div>
            )}
            {authored ? <TheoryContent blocks={authored.activity.public.theory} /> : <><p className="lesson-copy">{l.body}</p>
            <CodeBlock code={l.example} />
            <div className="tipbox">
              <h2 className="sec-title">🌟 À toi de jouer</h2>
              <p>{l.instructions}</p>
            </div></>}
            {authored ? null : <div className="lesson-footer">
              {l.attribution}
              <br />
              Contenu rédigé en français pour LiteCode.{" "}
              <a href={l.source_url} target="_blank" rel="noreferrer">
                Référence thématique
              </a>{" "}
              ; texte source non reproduit.
            </div>}
          </>
        )}
      </div>
      {open && (
        <div className="bottom sticky-action">
          <ButtonLink href={`/exercise/${l.id}`}>
            {l.type === "project"
              ? "Commencer le projet"
              : l.type === "lesson"
                ? "Vérifier ma compréhension"
                : "Passer à la pratique"}{" "}
            →
          </ButtonLink>
        </div>
      )}
    </section>
  );
}
