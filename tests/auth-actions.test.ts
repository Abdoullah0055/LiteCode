import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const cookieValues = new Map<string, { value: string; options?: unknown }>();
  const jar = {
    get: (name: string) => cookieValues.has(name) ? { name, ...cookieValues.get(name)! } : undefined,
    getAll: () => [...cookieValues].map(([name, item]) => ({ name, ...item })),
    set: (name: string, value: string, options?: unknown) => cookieValues.set(name, { value, options }),
  };
  const auth = {
    signUp: vi.fn(), signInWithPassword: vi.fn(), resetPasswordForEmail: vi.fn(),
    signOut: vi.fn(), updateUser: vi.fn(), refreshSession: vi.fn(),
  };
  const chain = {
    select: vi.fn(), eq: vi.fn(), is: vi.fn(), update: vi.fn(), maybeSingle: vi.fn(),
  };
  for (const method of ["select", "eq", "is", "update"] as const)
    chain[method].mockReturnValue(chain);
  return {
    cookieValues, jar, auth, chain,
    db: { auth },
    adminDb: { from: vi.fn(() => chain) },
    configured: vi.fn(() => true),
    postAuthDestination: vi.fn(async () => "/home"),
    requireUser: vi.fn(async () => ({ user: { id: "user-1" }, db: { auth } })),
  };
});

vi.mock("next/headers", () => ({
  cookies: async () => mocks.jar,
  headers: async () => new Headers({ host: "litecode.test", origin: "https://litecode.test" }),
}));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  supabase: async () => mocks.db,
  configured: mocks.configured,
  admin: () => mocks.adminDb,
}));
vi.mock("@/lib/data", () => ({
  postAuthDestination: mocks.postAuthDestination,
  requireUser: mocks.requireUser,
}));
vi.mock("@/lib/auth-callback-url", () => ({ authCallbackUrl: async (next: string) => `https://litecode.test/auth/confirm?next=${next}` }));

import { authenticate, finishOnboarding, saveOnboardingGoal, signOut } from "../src/app/auth/actions";

describe("authentication and onboarding server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookieValues.clear();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://litecode-project.supabase.co";
    mocks.configured.mockReturnValue(true);
    mocks.chain.select.mockReturnValue(mocks.chain);
    mocks.chain.eq.mockReturnValue(mocks.chain);
    mocks.chain.is.mockReturnValue(mocks.chain);
    mocks.chain.update.mockReturnValue(mocks.chain);
    mocks.chain.maybeSingle.mockResolvedValue({ data: { onboarding_step: "objectives", onboarding_completed_at: null, user_id: "user-1" }, error: null });
  });

  it("rejects mismatched signup passwords on the server with a field error", async () => {
    const form = new FormData();
    form.set("mode", "signup"); form.set("email", "learner@example.test");
    form.set("password", "Learning-123"); form.set("passwordConfirm", "Different-123");
    form.set("rememberDevice", "on");
    const result = await authenticate({ message: "" }, form);
    expect(result.status).toBe("error");
    expect(result.fieldErrors?.passwordConfirm).toContain("ne correspondent pas");
    expect(mocks.db.auth.signUp).not.toHaveBeenCalled();
  });

  it("sends reset without a password and limits its callback to settings", async () => {
    mocks.db.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    const form = new FormData(); form.set("mode", "reset"); form.set("email", "learner@example.test");
    const result = await authenticate({ message: "" }, form);
    expect(result.status).toBe("success");
    expect(result.message).toContain("Si ce compte existe");
    expect(mocks.db.auth.resetPasswordForEmail).toHaveBeenCalledWith("learner@example.test", {
      redirectTo: "https://litecode.test/auth/confirm?next=settings",
    });
  });

  it("returns explicit reset and login response statuses", async () => {
    const resetForm = new FormData();
    resetForm.set("mode", "reset"); resetForm.set("email", "learner@example.test");
    mocks.db.auth.resetPasswordForEmail.mockResolvedValue({ error: { code: "unexpected_failure" } });
    await expect(authenticate({ message: "" }, resetForm)).resolves.toMatchObject({ status: "error" });

    const loginForm = new FormData();
    for (const [key, value] of Object.entries({ mode: "login", email: "learner@example.test", password: "Learning-123", rememberDevice: "on" })) loginForm.set(key, value);
    mocks.db.auth.signInWithPassword.mockResolvedValue({ error: { code: "invalid_credentials" } });
    await expect(authenticate({ message: "" }, loginForm)).resolves.toMatchObject({
      status: "error",
      message: "Courriel ou mot de passe incorrect, ou compte non confirmé.",
    });
  });

  it("sends signup confirmation to the callback and routes immediate sessions centrally", async () => {
    mocks.db.auth.signUp.mockResolvedValue({ data: { session: {}, user: { id: "user-1" } }, error: null });
    const form = new FormData();
    for (const [key, value] of Object.entries({ mode: "signup", email: "learner@example.test", password: "Learning-123", passwordConfirm: "Learning-123", rememberDevice: "on" })) form.set(key, value);
    await expect(authenticate({ message: "" }, form)).rejects.toThrow("REDIRECT:/home");
    expect(mocks.db.auth.signUp).toHaveBeenCalledWith(expect.objectContaining({
      options: { emailRedirectTo: "https://litecode.test/auth/confirm?next=onboarding" },
    }));
    expect(mocks.cookieValues.get("litecode-remember-device")?.value).toBe("yes");
    expect(mocks.cookieValues.get("litecode-remember-device")?.options).toMatchObject({ secure: true, httpOnly: true, sameSite: "lax", path: "/" });
  });

  it("returns an explicit confirmation state when signup has no session", async () => {
    mocks.db.auth.signUp.mockResolvedValue({ data: { session: null, user: { id: "user-1" } }, error: null });
    const form = new FormData();
    for (const [key, value] of Object.entries({ mode: "signup", email: "learner@example.test", password: "Learning-123", passwordConfirm: "Learning-123", rememberDevice: "on" })) form.set(key, value);
    await expect(authenticate({ message: "" }, form)).resolves.toEqual({
      status: "success",
      message: "",
      confirmationRequired: true,
    });
  });

  it("explains the email quota without reporting a successful signup", async () => {
    mocks.db.auth.signUp.mockResolvedValue({
      data: { session: null, user: null },
      error: { code: "over_email_send_rate_limit", status: 429 },
    });
    const form = new FormData();
    for (const [key, value] of Object.entries({ mode: "signup", email: "learner@example.test", password: "Learning-123", passwordConfirm: "Learning-123", rememberDevice: "on" })) form.set(key, value);
    await expect(authenticate({ message: "", confirmationRequired: true }, form)).resolves.toEqual({
      status: "error",
      message: "La limite d’envoi des courriels de confirmation est atteinte. Réessaie plus tard.",
    });
  });

  it("keeps other signup errors generic without exposing provider details", async () => {
    mocks.db.auth.signUp.mockResolvedValue({
      data: { session: null, user: null },
      error: { code: "unexpected_failure", message: "private provider details" },
    });
    const form = new FormData();
    for (const [key, value] of Object.entries({ mode: "signup", email: "learner@example.test", password: "Learning-123", passwordConfirm: "Learning-123", rememberDevice: "on" })) form.set(key, value);
    await expect(authenticate({ message: "" }, form)).resolves.toEqual({
      status: "error",
      message: "Inscription impossible. Vérifie les informations et réessaie.",
    });
  });

  it("saves an objective before advancing and refuses completion from an earlier step", async () => {
    const saved = await saveOnboardingGoal("projects");
    expect(saved).toEqual({ ok: true });
    expect(mocks.chain.update).toHaveBeenCalledWith({ goal: "projects", onboarding_step: "languages" });
    await expect(finishOnboarding()).resolves.toEqual({ error: "Termine les étapes précédentes avant de continuer." });
  });

  it("signs out locally and deletes only this project's auth chunks and preference", async () => {
    mocks.cookieValues.set("sb-litecode-project-auth-token", { value: "session" });
    mocks.cookieValues.set("sb-litecode-project-auth-token.0", { value: "chunk" });
    mocks.cookieValues.set("sb-another-project-auth-token", { value: "other-session" });
    mocks.cookieValues.set("litecode-remember-device", { value: "yes" });
    await expect(signOut()).rejects.toThrow("REDIRECT:/");
    expect(mocks.db.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(mocks.cookieValues.get("sb-litecode-project-auth-token.0")?.options).toMatchObject({ maxAge: 0, secure: true, httpOnly: true });
    expect(mocks.cookieValues.get("sb-another-project-auth-token")?.value).toBe("other-session");
    expect(mocks.cookieValues.get("litecode-remember-device")?.options).toMatchObject({ maxAge: 0 });
  });
});
