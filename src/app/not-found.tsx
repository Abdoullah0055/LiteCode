import { ButtonLink } from "@/components/ui";
export default function NotFound() {
  return (
    <div className="app-shell">
      <main className="page-content">
        <h1 className="page-title">Cette étape n’existe pas.</h1>
        <p className="intro">Retrouve le bon chemin depuis ton parcours.</p>
        <ButtonLink href="/path">Mon parcours</ButtonLink>
      </main>
    </div>
  );
}
