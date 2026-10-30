import Link from "next/link";
import Image from "next/image";
import { ButtonLink } from "@/components/ui";
import { configured, supabase } from "@/lib/supabase/server";
import { postAuthDestination } from "@/lib/data";
import { redirect } from "next/navigation";
export default async function Welcome({
  searchParams,
}: {
  searchParams: Promise<{
    code?: string;
    token_hash?: string;
    type?: string;
    next?: string;
  }>;
}) {
  const params = await searchParams;
  // When the requested redirect URL is not allow-listed in Supabase, the
  // confirmation link falls back to the Site URL root with `?code=` or
  // `?token_hash=` parameters. Forward them to the real callback route.
  if (configured() && (params.code || (params.token_hash && params.type))) {
    const query = new URLSearchParams();
    for (const key of ["code", "token_hash", "type", "next"] as const) {
      const value = params[key];
      if (value) query.set(key, value);
    }
    redirect(`/auth/confirm?${query.toString()}`);
  }
  if (configured()) {
    const db = await supabase();
    const { data: { user } } = await db.auth.getUser();
    if (user) redirect(await postAuthDestination(db, user.id));
  }
  return (
    <div className="app-shell">
      <main className="welcome screen-page">
        <span className="cloud a" />
        <span className="cloud b" />
        <div className="hill" />
        <div className="hill2" />
        <div className="welcome-copy">
          <span className="welcome-brand">{"{ }"} LiteCode</span>
          <h1>
            Le code
            <br />
            change tout ! ✨
          </h1>
          <p>
            Apprends à coder pas à pas
            <br />
            avec des leçons courtes,
            <br />
            des exercices pratiques
            <br />
            et des projets amusants.
          </p>
        </div>
        <div className="hero-art">
          <Image
            src="/mascot.svg"
            alt="Un petit robot souriant qui programme"
            width={340}
            height={360}
            priority
            className="bot-svg"
          />
          <span className="spark s1">✦</span>
          <span className="spark s2">{"</>"}</span>
          <span className="spark s3">✷</span>
        </div>
        <div className="bottom">
          <ButtonLink href="/auth?mode=signup">Commencer</ButtonLink>
          <p className="login-note">
            Déjà un compte ? <Link href="/auth">Se connecter</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
