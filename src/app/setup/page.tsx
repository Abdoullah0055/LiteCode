import { Back, ButtonLink } from "@/components/ui";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error === "onboarding"
    ? "La progression d’accueil ne peut pas être chargée. Vérifie que toutes les migrations locales sont appliquées."
    : null;
  return (
    <div className="app-shell">
      <main className="page-content">
        <Back href="/" />
        <p className="eyebrow">Configuration</p>
        <h1 className="page-title">Le parcours attend sa connexion 🌱</h1>
        <p className="intro">
          Les variables sont volontairement vides. Pour utiliser les comptes, le
          programme et la progression :
        </p>
        {error && <p className="error-notice" role="alert">{error}</p>}
        <ol className="lesson-copy" style={{ paddingLeft: 20 }}>
          <li>Copie .env.example vers .env.local.</li>
          <li>Renseigne l’URL, la clé publique et la clé serveur Supabase.</li>
          <li>Applique la migration et le seed.</li>
          <li>Démarre le service JavaScript et configure son URL et sa clé.</li>
          <li>Relance Next.js.</li>
        </ol>
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
