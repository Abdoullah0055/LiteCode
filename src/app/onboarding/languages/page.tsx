import { Languages } from "@/components/onboarding";
import { requireOnboardingStep } from "@/lib/data";
export default async function Page() {
  await requireOnboardingStep("languages");
  return <Languages />;
}
