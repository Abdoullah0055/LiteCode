"use client";
import Link from "next/link";
import { useActionState } from "react";
import { authenticate } from "@/app/auth/actions";
export function AuthForm({
  mode = "login",
  configured,
}: {
  mode: "login" | "signup" | "reset";
  configured: boolean;
}) {
  const [state, action, pending] = useActionState(authenticate, {
    message: "",
  });
  return (
    <>
      <div className="segment-control">
        <Link href="/auth" className={mode === "login" ? "selected" : ""}>
          Se connecter
        </Link>
        <Link
          href="/auth?mode=signup"
          className={mode === "signup" ? "selected" : ""}
        >
          Créer un compte
        </Link>
      </div>
      <form action={action} className="form-stack">
        <input type="hidden" name="mode" value={mode} />
        <label className="field">
          Courriel
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="toi@exemple.com"
          />
        </label>
        {mode !== "reset" ? (
          <label className="field">
            Mot de passe
            <input
              type="password"
              name="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              placeholder="8 caractères minimum"
            />
          </label>
        ) : (
          <input type="hidden" name="password" value="reset-request" />
        )}
        {!configured && (
          <p className="error-notice">
            Supabase n’est pas configuré. Renseigne les variables indiquées dans
            README.md pour activer les comptes.
          </p>
        )}
        <button
          type="submit"
          className="primary"
          disabled={pending || !configured}
        >
          {pending
            ? "Un instant…"
            : mode === "signup"
              ? "Créer mon compte"
              : mode === "reset"
                ? "Recevoir un lien"
                : "Se connecter"}
        </button>
        <p role="status" className="form-message">
          {state.message}
        </p>
      </form>
      <Link className="inline-link" href="/auth?mode=reset">
        Mot de passe oublié ?
      </Link>
      <p className="form-help">
        Ton parcours et tes résultats restent associés à ton compte.
      </p>
    </>
  );
}
