import { notFound } from "next/navigation";
import { accountData, learningData, requireUser } from "@/lib/data";
import { isUnlocked } from "@/lib/domain";
import { ButtonLink, Taskbar, Empty } from "@/components/ui";
import { TheoryContent } from "@/components/theory-content";
import { admin } from "@/lib/supabase/server";
import { loadAuthoredActivity } from "@/lib/learning-runtime";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, account, session] = await Promise.all([learningData(), accountData(), requireUser()]);
  const lesson = data.lessons.find((item) => item.id === id);
  if (!lesson) notFound();

  const completed = data.progress.filter((item) => item.completed_at).map((item) => item.lesson_id);
  const open = isUnlocked(
    data.prerequisites.filter((item) => item.lesson_id === id).map((item) => item.required_lesson_id),
    completed,
  );
  const { data: activeVersion, error } = await session.db.from("lesson_versions")
    .select("id").eq("lesson_id", id).eq("is_active", true).maybeSingle();
  if (error || !activeVersion) {
    return (
      <section className="screen-page">
        <div className="page-content">
          <Taskbar position={lesson.position - 1} hearts={account.hearts} />
          <Empty title="Mise à jour nécessaire">
            <p>Cette activité attend son contenu structuré. Applique les migrations et le seed du curriculum v2, puis recharge la page.</p>
            <ButtonLink href="/setup">Voir la configuration</ButtonLink>
          </Empty>
        </div>
      </section>
    );
  }

  const authored = await loadAuthoredActivity(admin(), id);
  return (
    <section className="screen-page">
      <div className="page-content">
        <Taskbar position={lesson.position - 1} hearts={account.hearts} />
        {!open ? (
          <Empty title="Encore un petit pas avant celle-ci">
            <p>Termine les prérequis pour déverrouiller cette activité.</p>
            <ButtonLink href="/path">Voir mon parcours</ButtonLink>
          </Empty>
        ) : (
          <>
            <p className="eyebrow">{data.modules.find((item) => item.id === lesson.module_id)?.title} · {lesson.duration_minutes} min</p>
            <h1 className="page-title">{lesson.title}</h1>
            {completed.includes(id) && (
              <div className="complete-card">✓ Activité terminée. Tu peux la refaire sans gagner de XP supplémentaires.</div>
            )}
            <TheoryContent blocks={authored.activity.public.theory} />
          </>
        )}
      </div>
      {open && (
        <div className="bottom sticky-action">
          <ButtonLink href={`/exercise/${lesson.id}`}>
            {lesson.type === "project" ? "Commencer le projet" : "Commencer l’exercice interactif"} →
          </ButtonLink>
        </div>
      )}
    </section>
  );
}
