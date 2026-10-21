type AuthFixtureState = { message?: string; status?: "success" | "error"; confirmationRequired?: boolean; fieldErrors?: Record<string, string> };
type AuthFixtureWindow = Window & { __authActionResult?: AuthFixtureState; __authActionHold?: boolean; __authActionPending?: boolean; __authActionRelease?: () => void };

export async function authenticate(): Promise<AuthFixtureState> {
  const fixture = window as AuthFixtureWindow;
  if (fixture.__authActionHold) {
    fixture.__authActionPending = true;
    await new Promise<void>((resolve) => { fixture.__authActionRelease = resolve; });
    fixture.__authActionPending = false;
  }
  return fixture.__authActionResult ?? { message: "", status: "success", confirmationRequired: true };
}
export async function finishOnboarding() { return { ok: true }; }
export async function goToOnboardingStep() { return { ok: true }; }
export async function saveOnboardingGoal() { return { ok: true }; }
export async function saveOnboardingLanguage() { return { ok: true }; }
