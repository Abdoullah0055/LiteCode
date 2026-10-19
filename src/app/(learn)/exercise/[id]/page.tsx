import { notFound } from "next/navigation";
import { accountData, learningData, requireUser } from "@/lib/data";
import { isUnlocked } from "@/lib/domain";
import { ButtonLink, Empty } from "@/components/ui";
import { admin } from "@/lib/supabase/server";
import { loadAuthoredActivity } from "@/lib/learning-runtime";
import { validateVersionedDraft, type InteractionAnswer } from "@/lib/learning-model";
import { LearningExercise } from "@/components/learning-exercise";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, account, { db, user }] = await Promise.all([learningData(), accountData(), requireUser()]);
  const lesson = data.lessons.find((item) => item.id === id);
  if (!lesson) notFound();

  const unlocked = isUnlocked(
    data.prerequisites.filter((item) => item.lesson_id === id).map((item) => item.required_lesson_id),
    data.progress.filter((item) => item.completed_at).map((item) => item.lesson_id),
  );
  if (!unlocked) {
    return <div className="page-content"><Empty title="Activité verrouillée"><p>Termine les prérequis.</p><ButtonLink href="/path">Mon parcours</ButtonLink></Empty></div>;
  }

  const { data: activeVersion, error } = await db.from("lesson_versions")
    .select("id").eq("lesson_id", id).eq("is_active", true).maybeSingle();
  if (error || !activeVersion) {
    return <div className="page-content"><Empty title="Mise à jour nécessaire"><p>Cette activité attend son contenu structuré. Applique les migrations et le seed du curriculum v2, puis recharge la page.</p><ButtonLink href="/setup">Voir la configuration</ButtonLink></Empty></div>;
  }

  const runtime = await loadAuthoredActivity(admin(), id);
  const [draftResult, stepResult] = await Promise.all([
    db.from("user_progress").select("draft_answers,draft_content_version_id").eq("user_id", user.id).eq("lesson_id", id).maybeSingle(),
    runtime.projectId
      ? db.from("learning_project_step_results").select("position,submission,passed").eq("user_id", user.id).eq("version_id", runtime.versionId).eq("project_id", runtime.projectId).order("position")
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (draftResult.error || stepResult.error) throw new Error("Progression de l’activité indisponible.");
  const draft = draftResult.data?.draft_content_version_id === runtime.versionId
    ? validateVersionedDraft(runtime.activity.public, draftResult.data.draft_answers)
    : null;
  return <LearningExercise activity={runtime.activity.public} position={lesson.position} hearts={account.hearts} sound={account.settings.sound} draft={draft} savedSteps={(stepResult.data || []) as { position: number; submission: { version: number; answers: Record<string, InteractionAnswer> }; passed: boolean }[]} />;
}
