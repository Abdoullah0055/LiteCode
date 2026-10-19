"use client";
import Link from "next/link";
import { useActionState, useRef } from "react";
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
    fieldErrors: undefined,
  });
  const passwordRef = useRef<HTMLInputElement>(null);
  const passwordConfirmRef = useRef<HTMLInputElement>(null);
  const fieldError = (name: string) => state.fieldErrors?.[name];
  function validateConfirmation() {
    const password = passwordRef.current?.value ?? "";
    const confirmation = passwordConfirmRef.current;
    if (confirmation)
      confirmation.setCustomValidity(
        confirmation.value && confirmation.value !== password
          ? "Les mots de passe ne correspondent pas."
          : "",
      );
  }
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
      <form
        action={action}
        className="form-stack"
        onSubmit={(event) => {
          if (mode !== "signup") return;
          validateConfirmation();
          if (!event.currentTarget.checkValidity()) {
            event.preventDefault();
            event.currentTarget.reportValidity();
          }
        }}
      >
        <input type="hidden" name="mode" value={mode} />
        <label className="field">
          Courriel
          <input
            type="email"
            name="email"
            aria-invalid={Boolean(fieldError("email"))}
            aria-describedby={fieldError("email") ? "email-error" : undefined}
            autoComplete="email"
            required
            maxLength={254}
            placeholder="toi@exemple.com"
          />
          {fieldError("email") && <span id="email-error" className="field-error">{fieldError("email")}</span>}
        </label>
        {mode !== "reset" ? (
          <label className="field">
            Mot de passe
            <input
              type="password"
              name="password"
              ref={mode === "signup" ? passwordRef : undefined}
              onChange={mode === "signup" ? validateConfirmation : undefined}
              aria-invalid={Boolean(fieldError("password"))}
              aria-describedby={fieldError("password") ? "password-error" : undefined}
              required
              minLength={8}
              maxLength={128}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              placeholder="8 caractères minimum"
            />
            {fieldError("password") && <span id="password-error" className="field-error">{fieldError("password")}</span>}
          </label>
        ) : null}
        {mode === "signup" && (
          <label className="field">
            Confirmer le mot de passe
            <input
              type="password"
              name="passwordConfirm"
              ref={passwordConfirmRef}
              onChange={validateConfirmation}
              aria-invalid={Boolean(fieldError("passwordConfirm"))}
              aria-describedby={fieldError("passwordConfirm") ? "password-confirm-error" : undefined}
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              placeholder="Répète ton mot de passe"
            />
            {fieldError("passwordConfirm") && <span id="password-confirm-error" className="field-error">{fieldError("passwordConfirm")}</span>}
          </label>
        )}
        {mode !== "reset" && (
          <label className="remember-device">
            <input type="checkbox" name="rememberDevice" defaultChecked />
            <span>Se souvenir de cet appareil pendant 30 jours</span>
          </label>
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
      {mode !== "reset" && (
        <Link className="inline-link" href="/auth?mode=reset">
          Mot de passe oublié ?
        </Link>
      )}
      <p className="form-help">
        Ton parcours et tes résultats restent associés à ton compte.
      </p>
    </>
  );
}
