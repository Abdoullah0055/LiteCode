"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="page-content">
      <h1 className="page-title">Connexion interrompue</h1>
      <p className="intro">
        Nous n’avons pas pu charger tes données. Vérifie la connexion, les
        migrations et la configuration Supabase.
      </p>
      <button className="primary" onClick={reset}>
        Réessayer
      </button>
      <Link className="primary ghost" href="/">
        Revenir à l’accueil
      </Link>
    </div>
  );
}
