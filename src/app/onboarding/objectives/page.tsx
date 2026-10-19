import { Objectives } from "@/components/onboarding";
import { requireOnboardingStep } from "@/lib/data";
export default async function Page() {
  const { settings } = await requireOnboardingStep("objectives");
  return <Objectives initialGoal={settings.goal} />;
}
