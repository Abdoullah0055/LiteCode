import {FinishOnboarding} from '@/components/onboarding';
import {requireUser} from '@/lib/data';
export default async function Page(){await requireUser();return <FinishOnboarding/>;}
