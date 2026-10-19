import { beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
  const value = {
    row: { onboarding_step: "objectives", onboarding_completed_at: null as string | null, goal: "basics" },
    error: null as { message: string } | null,
  };
  const query = {
    select: () => query,
    eq: () => query,
    maybeSingle: async () => ({ data: value.row, error: value.error }),
  };
  return {
    value,
    db: {
      from: () => query,
      auth: { getUser: async () => ({ data: { user: { id: "learner" } }, error: null }) },
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  configured: () => true,
  supabase: async () => state.db,
}));
vi.mock("next/navigation", () => ({
  redirect: (destination: string) => { throw new Error(`REDIRECT:${destination}`); },
}));

import { postAuthDestination, requireOnboardingStep } from "../src/lib/data";
import { supabase } from "../src/lib/supabase/server";

beforeEach(() => {
  state.value.row = { onboarding_step: "objectives", onboarding_completed_at: null, goal: "basics" };
  state.value.error = null;
});

it("resumes the saved onboarding step through the actual data helper", async () => {
  state.value.row.onboarding_step = "languages";
  expect(await postAuthDestination(await supabase(), "learner")).toBe("/onboarding/languages");
  await expect(requireOnboardingStep("objectives")).rejects.toThrow("REDIRECT:/onboarding/languages");
});

it("keeps completed accounts out of onboarding", async () => {
  state.value.row.onboarding_step = "complete";
  state.value.row.onboarding_completed_at = "2026-10-19T12:00:00Z";
  expect(await postAuthDestination(await supabase(), "learner")).toBe("/home");
  await expect(requireOnboardingStep("finish")).rejects.toThrow("REDIRECT:/home");
});

it("shows the migration error consistently instead of silently skipping onboarding", async () => {
  state.value.error = { message: "onboarding column unavailable" };
  expect(await postAuthDestination(await supabase(), "learner")).toBe("/setup?error=onboarding");
  await expect(requireOnboardingStep("objectives")).rejects.toThrow("REDIRECT:/setup?error=onboarding");
});
