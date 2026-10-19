import { FinishOnboarding } from "@/components/onboarding";
import { requireOnboardingStep } from "@/lib/data";
export const dynamic = "force-dynamic";
export default async function Page() {
  const { db, settings } = await requireOnboardingStep("finish");
  const [module, lesson] = await Promise.all([
    db.from("modules").select("title").order("position").limit(1).maybeSingle(),
    db.from("lessons").select("id,title,duration_minutes").order("position").limit(1).maybeSingle(),
  ]);
  return <FinishOnboarding goal={settings.goal} firstModule={module.data} firstLesson={lesson.data} />;
}
