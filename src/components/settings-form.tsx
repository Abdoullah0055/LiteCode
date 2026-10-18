"use client";
import { useActionState } from "react";
import { saveSettings, signOut, updatePassword } from "@/app/auth/actions";
import type { Settings } from "@/lib/types";
export function SettingsForm({
  name,
  settings,
  email,
}: {
  name: string;
  settings: Settings;
  email: string;
}) {
  const [state, action, pending] = useActionState(saveSettings, {
    message: "",
  });
  const [passwordState, passwordAction, passwordPending] = useActionState(
    updatePassword,
    { message: "" },
  );
  return (
    <>
      <form action={action}>
        <h2 className="settings-h">Apprentissage</h2>
        <label className="field" style={{ marginTop: 20 }}>
          Objectif
          <select name="goal" defaultValue={settings.goal}>
            {[
              ["basics", "Apprendre les bases"],
              ["career", "Devenir développeur"],
              ["projects", "Créer mes projets"],
              ["improve", "Progresser"],
              ["curiosity", "Par curiosité"],
            ].map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field" style={{ marginTop: 20 }}>
          Objectif quotidien
          <select name="daily_goal" defaultValue={settings.daily_goal}>
            {[5, 10, 15, 30].map((n) => (
              <option key={n} value={n}>
                {n} minutes par jour
              </option>
            ))}
          </select>
        </label>
        <div className="statrow">
          <span>🌐 Langue de l’app</span>
          <b>Français</b>
        </div>
        <div className="statrow">
          <span>Langage d’apprentissage</span>
          <b>JavaScript</b>
        </div>
        <p className="form-help">
          Les autres langues et langages arriveront dans un prochain parcours.
        </p>
        {[
          ["dark_mode", "☾ Mode sombre", settings.dark_mode],
          ["sound", "◖ Son de réussite", settings.sound],
          [
            "leaderboard_visible",
            "🏆 Apparaître au classement",
            settings.leaderboard_visible,
          ],
        ].map(([key, label, on]) => (
          <label className="setting-input-row" key={String(key)}>
            <span>{label}</span>
            <input
              type="checkbox"
              name={String(key)}
              defaultChecked={Boolean(on)}
            />
          </label>
        ))}
        <h2 className="settings-h">Compte</h2>
        <label className="field">
          Nom du profil
          <input
            name="display_name"
            defaultValue={name}
            minLength={1}
            maxLength={40}
            required
            autoComplete="nickname"
          />
        </label>
        <p className="form-help" style={{ marginTop: 12 }}>
          {email}
        </p>
        <button className="primary settings-save" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer les préférences"}
        </button>
        <p className="form-message" role="status">
          {state.message}
        </p>
      </form>
      <form action={passwordAction} className="form-stack">
        <label className="field">
          Nouveau mot de passe
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />
        </label>
        <button className="primary ghost" disabled={passwordPending}>
          {passwordPending ? "Modification…" : "Modifier le mot de passe"}
        </button>
        <p className="form-message" role="status">
          {passwordState.message}
        </p>
      </form>
      <form action={signOut}>
        <button
          className="inline-link text-danger"
          style={{ width: "100%", marginTop: 24 }}
        >
          ↪ Se déconnecter
        </button>
      </form>
    </>
  );
}
