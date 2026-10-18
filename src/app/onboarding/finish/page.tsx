import { FinishOnboarding } from "@/components/onboarding";
import { requireUser } from "@/lib/data";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requireUser();
  return <FinishOnboarding />;
}
