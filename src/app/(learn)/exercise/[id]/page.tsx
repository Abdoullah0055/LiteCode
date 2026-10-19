import { notFound } from "next/navigation";
import { accountData, learningData, requireUser } from "@/lib/data";
import { isUnlocked } from "@/lib/domain";
import { Exercise } from "@/components/exercise";
import { ButtonLink, Empty } from "@/components/ui";
import type { Challenge, Question } from "@/lib/types";
import { admin } from "@/lib/supabase/server";
import { loadAuthoredActivity } from "@/lib/learning-runtime";
import { validateVersionedDraft } from "@/lib/learning-model";
import { LearningExercise } from "@/components/learning-exercise";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, a, { db, user }] = await Promise.all([
    learningData(),
    accountData(),
    requireUser(),
  ]);
  const l = data.lessons.find((x) => x.id === id);
  if (!l) notFound();
  if (
    !isUnlocked(
      data.prerequisites
        .filter((p) => p.lesson_id === id)
        .map((p) => p.required_lesson_id),
      data.progress.filter((p) => p.completed_at).map((p) => p.lesson_id),
    )
  )
    return (
      <div className="page-content">
        <Empty title="Activité verrouillée">
          <p>Termine les prérequis.</p>
          <ButtonLink href="/path">Mon parcours</ButtonLink>
        </Empty>
      </div>
    );
  const { data: activeVersion, error: versionError } = await db.from("lesson_versions")
    .select("id").eq("lesson_id", id).eq("is_active", true).maybeSingle();
  if (versionError) throw new Error("Version d’activité indisponible.");
  if (activeVersion) {
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
    return <LearningExercise activity={runtime.activity.public} position={l.position} hearts={a.hearts} sound={a.settings.sound} draft={draft} savedSteps={(stepResult.data || []) as { position: number; submission: { version: number; answers: Record<string, import("@/lib/learning-model").InteractionAnswer> }; passed: boolean }[]} />;
  }
  const [q, c] = await Promise.all([
    db
      .from("questions")
      .select("id,prompt,kind,answer_options(id,label,value,position)")
      .eq("lesson_id", id)
      .order("position"),
    db
      .from("challenges")
      .select("starter_code,steps,language")
      .eq("lesson_id", id)
      .maybeSingle(),
  ]);
  if (q.error || c.error) throw new Error("Exercice indisponible.");
  if (!c.data && !q.data?.length)
    throw new Error("Cette activité ne dispose pas encore de validation.");
  return (
    <Exercise
      key={l.id}
      lesson={l}
      questions={(q.data || []) as Question[]}
      challenge={c.data as Challenge | null}
      progress={data.progress.find((p) => p.lesson_id === id) || null}
      hearts={a.hearts}
      sound={a.settings.sound}
    />
  );
}
