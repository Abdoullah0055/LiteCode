import { AuthForm } from "@/components/auth-form";
import { Back } from "@/components/ui";
import { configured } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import { postAuthDestination } from "@/lib/data";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string }>;
}) {
  const p = await searchParams;
  if (configured()) {
    const db = await supabase();
    const { data: { user } } = await db.auth.getUser();
    if (user) redirect(await postAuthDestination(db, user.id));
  }
  const mode =
    p.mode === "signup" ? "signup" : p.mode === "reset" ? "reset" : "login";
  return (
    <div className="app-shell">
      <main className="page-content">
        <Back href="/" />
        <p className="eyebrow">{"{ }"} LiteCode</p>
        <h1 className="page-title">
          {mode === "signup"
            ? "Ta prochaine aventure commence ici."
            : mode === "reset"
              ? "Retrouve ton compte."
              : "Heureux de te revoir !"}
        </h1>
        <p className="intro">Un petit pas de code, chaque jour.</p>
        {p.error && (
          <p className="error-notice">
            Le lien de confirmation est invalide ou a expiré.
          </p>
        )}
        <AuthForm key={mode} mode={mode} configured={configured()} />
      </main>
    </div>
  );
}
