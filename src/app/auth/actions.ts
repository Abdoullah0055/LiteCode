"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { supabase, configured, admin } from "@/lib/supabase/server";
import { postAuthDestination, requireUser } from "@/lib/data";
import { authCallbackUrl } from "@/lib/auth-callback-url";
import {
  applyAuthCookiePolicy,
  isProjectAuthCookie,
  onboardingStepAllows,
  REMEMBER_DEVICE_COOKIE,
  secureFromAppOrigin,
} from "@/lib/auth-policy";
const email = z.email().max(254);
const password = z.string().min(8).max(128);
const authSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("signup"), email, password,
    passwordConfirm: z.string().min(8).max(128), rememberDevice: z.boolean(),
  }).refine((value) => value.password === value.passwordConfirm, {
    path: ["passwordConfirm"], message: "Les mots de passe ne correspondent pas.",
  }),
  z.object({ mode: z.literal("login"), email, password, rememberDevice: z.boolean() }),
  z.object({ mode: z.literal("reset"), email }),
]);
type AuthState = { message: string; fieldErrors?: Record<string, string> };

export async function persistDevicePreference(remember: boolean) {
  const jar = await cookies();
  const requestHeaders = await headers();
  jar.set(REMEMBER_DEVICE_COOKIE, remember ? "yes" : "session", {
    ...applyAuthCookiePolicy(
      {},
      remember,
      secureFromAppOrigin(
        process.env.NEXT_PUBLIC_SITE_URL,
        requestHeaders.get("origin"),
        requestHeaders.get("host"),
        process.env.NODE_ENV === "production",
      ),
    ),
  });
}

async function requestCookieSecure() {
  const requestHeaders = await headers();
  return secureFromAppOrigin(
    process.env.NEXT_PUBLIC_SITE_URL,
    requestHeaders.get("origin"),
    requestHeaders.get("host"),
    process.env.NODE_ENV === "production",
  );
}

export async function authenticate(
  _prev: AuthState,
  form: FormData,
): Promise<AuthState> {
  if (!configured())
    return {
      message:
        "Supabase n’est pas encore configuré. Les variables sont volontairement vides.",
    };
  const requestedMode = form.get("mode");
  const parsed = authSchema.safeParse({
    mode: requestedMode,
    email: form.get("email"),
    ...(requestedMode !== "reset" ? { password: form.get("password") } : {}),
    ...(requestedMode === "signup" ? { passwordConfirm: form.get("passwordConfirm") } : {}),
    ...(requestedMode !== "reset" ? { rememberDevice: form.get("rememberDevice") === "on" } : {}),
  });
  if (!parsed.success)
    return {
      message: requestedMode === "signup"
        ? "Vérifie les champs indiqués."
        : requestedMode === "reset"
          ? "Entre un courriel valide."
          : "Vérifie le courriel et le mot de passe.",
      fieldErrors: Object.fromEntries(parsed.error.issues.map((issue) => {
        const field = String(issue.path[0] ?? "form");
        const message = field === "passwordConfirm"
          ? "Les mots de passe ne correspondent pas."
          : field === "email"
            ? "Entre un courriel valide."
            : "Le mot de passe doit contenir entre 8 et 128 caractères.";
        return [field, message];
      })),
    };
  const { email } = parsed.data;
  const db = await supabase();
  if (parsed.data.mode === "reset") {
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: await authCallbackUrl("settings"),
    });
    return {
      message: error
        ? "Impossible d’envoyer le courriel. Réessaie plus tard."
        : "Si ce compte existe, un courriel de récupération a été envoyé.",
    };
  }
  if (parsed.data.mode === "signup") {
    const rememberDevice = parsed.data.rememberDevice;
    await persistDevicePreference(rememberDevice);
    const { data, error } = await db.auth.signUp({
      email,
      password: parsed.data.password,
      options: { emailRedirectTo: await authCallbackUrl("onboarding") },
    });
    if (error)
      return {
        message:
          "Inscription impossible. Vérifie les informations et réessaie.",
      };
    if (!data.session)
      return {
        message:
          "Vérifie ton courriel pour confirmer ton compte, puis connecte-toi.",
      };
    redirect(await postAuthDestination(db, data.user!.id));
  } else {
    await persistDevicePreference(parsed.data.rememberDevice);
    const { data, error } = await db.auth.signInWithPassword({
      email,
      password: parsed.data.password,
    });
    if (error)
      return {
        message: "Courriel ou mot de passe incorrect, ou compte non confirmé.",
      };
    redirect(await postAuthDestination(db, data.user.id));
  }
}
export async function signOut() {
  const db = await supabase();
  await db.auth.signOut({ scope: "local" });
  const jar = await cookies();
  const secure = await requestCookieSecure();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  for (const cookie of jar.getAll()) {
    if (isProjectAuthCookie(cookie.name, supabaseUrl))
      jar.set(cookie.name, "", applyAuthCookiePolicy({ maxAge: 0 }, false, secure));
  }
  jar.set(REMEMBER_DEVICE_COOKIE, "", applyAuthCookiePolicy({ maxAge: 0 }, false, secure));
  redirect("/");
}
const preferences = z.object({
  display_name: z.string().trim().min(1).max(40),
  goal: z.enum(["basics", "career", "projects", "improve", "curiosity"]),
  daily_goal: z.coerce.number().refine((n) => [5, 10, 15, 30].includes(n)),
  dark_mode: z.boolean(),
  sound: z.boolean(),
  leaderboard_visible: z.boolean(),
  remember_device: z.boolean(),
});
export async function saveSettings(_prev: { message: string }, form: FormData) {
  const { user, db: authDb } = await requireUser();
  const parsed = preferences.safeParse({
    ...Object.fromEntries(form),
    dark_mode: form.get("dark_mode") === "on",
    sound: form.get("sound") === "on",
    leaderboard_visible: form.get("leaderboard_visible") === "on",
    remember_device: form.get("remember_device") === "on",
  });
  if (!parsed.success) return { message: "Vérifie le nom et les préférences." };
  const { display_name, remember_device, ...settings } = parsed.data;
  await persistDevicePreference(remember_device);
  const db = admin();
  const result = await db
    .from("profiles")
    .update({ display_name })
    .eq("id", user.id);
  if (result.error) return { message: "Enregistrement du profil impossible." };
  const s = await db
    .from("user_settings")
    .update(settings)
    .eq("user_id", user.id);
  if (s.error) return { message: "Enregistrement des préférences impossible." };
  const refreshed = await authDb.auth.refreshSession();
  if (refreshed.error)
    return { message: "Préférences enregistrées, mais la session n’a pas pu être renouvelée." };
  revalidatePath("/", "layout");
  return { message: "Préférences enregistrées." };
}
async function currentOnboarding(userId: string) {
  const { data, error } = await admin()
    .from("user_settings")
    .select("onboarding_step,onboarding_completed_at")
    .eq("user_id", userId)
    .maybeSingle();
  return error || !data ? null : data;
}

export async function saveOnboardingGoal(goal: string) {
  const { user } = await requireUser();
  const current = await currentOnboarding(user.id);
  if (!current || current.onboarding_completed_at || current.onboarding_step === "complete")
    return { error: "Ce parcours d’accueil est déjà terminé." };
  if (current.onboarding_step !== "objectives")
    return { error: "Reprends l’étape enregistrée de ton accueil." };
  const parsed = z
    .enum(["basics", "career", "projects", "improve", "curiosity"])
    .safeParse(goal);
  if (!parsed.success) return { error: "Objectif invalide." };
  const { data, error } = await admin()
    .from("user_settings")
    .update({ goal: parsed.data, onboarding_step: "languages" })
    .eq("user_id", user.id)
    .eq("onboarding_step", current.onboarding_step)
    .is("onboarding_completed_at", null)
    .select("user_id").maybeSingle();
  if (error || !data) return { error: "Impossible de sauvegarder ton objectif." };
  revalidatePath("/home");
  return { ok: true };
}

export async function saveOnboardingLanguage(language: string) {
  const { user } = await requireUser();
  const current = await currentOnboarding(user.id);
  if (!current || current.onboarding_completed_at || current.onboarding_step !== "languages")
    return { error: "Reprends l’étape enregistrée de ton accueil." };
  if (language !== "JavaScript") return { error: "Ce langage sera bientôt disponible." };
  const { data, error } = await admin().from("user_settings")
    .update({ languages: [language], onboarding_step: "finish" })
    .eq("user_id", user.id)
    .eq("onboarding_step", current.onboarding_step)
    .is("onboarding_completed_at", null)
    .select("user_id").maybeSingle();
  if (error || !data) return { error: "Impossible de sauvegarder ton langage." };
  return { ok: true };
}

export async function goToOnboardingStep(target: "objectives" | "languages") {
  const { user } = await requireUser();
  const current = await currentOnboarding(user.id);
  if (!current || current.onboarding_completed_at || current.onboarding_step === "complete")
    return { error: "Ce parcours d’accueil est déjà terminé." };
  if (!onboardingStepAllows(current.onboarding_step, target))
    return { error: "Cette étape n’est pas encore accessible." };
  const { data, error } = await admin().from("user_settings")
    .update({ onboarding_step: target })
    .eq("user_id", user.id)
    .eq("onboarding_step", current.onboarding_step)
    .is("onboarding_completed_at", null)
    .select("user_id").maybeSingle();
  if (error || !data) return { error: "Impossible de revenir à cette étape." };
  return { ok: true };
}

export async function finishOnboarding() {
  const { user } = await requireUser();
  const current = await currentOnboarding(user.id);
  if (!current || current.onboarding_step !== "finish" || current.onboarding_completed_at)
    return { error: "Termine les étapes précédentes avant de continuer." };
  const { data, error } = await admin().from("user_settings")
    .update({ onboarding_step: "complete", onboarding_completed_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("onboarding_step", "finish")
    .is("onboarding_completed_at", null)
    .select("user_id").maybeSingle();
  if (error || !data) return { error: "Impossible d’enregistrer la fin de ton accueil." };
  revalidatePath("/home");
  return { ok: true };
}
export async function updatePassword(
  _prev: { message: string },
  form: FormData,
) {
  await requireUser();
  const value = z.string().min(8).max(128).safeParse(form.get("password"));
  if (!value.success) return { message: "Utilise au moins 8 caractères." };
  const db = await supabase();
  const { error } = await db.auth.updateUser({ password: value.data });
  return {
    message: error
      ? "Modification impossible. Reconnecte-toi puis réessaie."
      : "Mot de passe modifié.",
  };
}
