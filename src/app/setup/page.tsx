import { Back, ButtonLink } from "@/components/ui";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const onboardingError = params.error === "onboarding";
  return (
    <div className="app-shell">
      <main className="page-content">
        <Back href="/" />
        <p className="eyebrow">Configuration</p>
        <h1 className="page-title">{onboardingError ? "Une migration est nécessaire" : "Le parcours attend sa connexion 🌱"}</h1>
        {onboardingError ? (
          <p className="error-notice" role="alert">Ta session est active, mais la progression d’accueil ne peut pas être chargée. Applique les migrations Supabase manquantes, puis reconnecte-toi.</p>
        ) : (
          <>
            <p className="intro">Pour utiliser les comptes, le programme et la progression :</p>
            <ol className="lesson-copy" style={{ paddingLeft: 20 }}>
              <li>Copie .env.example vers .env.local.</li>
              <li>Renseigne l’URL, la clé publique et la clé serveur Supabase.</li>
              <li>Applique les migrations et le seed.</li>
              <li>Relance Next.js.</li>
            </ol>
          </>
        )}
        <div className="tipbox">
          <h2 className="sec-title">Le guide est dans README.md</h2>
          <p>
            Aucun résultat ni classement n’est inventé pendant la configuration.
          </p>
        </div>
        <ButtonLink href="/auth">Vers la connexion</ButtonLink>
      </main>
    </div>
  );
}
