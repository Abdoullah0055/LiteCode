# Étape 5 — Authentification et onboarding

## Livré

- Inscription avec confirmation du mot de passe côté client et serveur, puis consentement de l’appareil mémorisé; réinitialisation avec callback de récupération dédié.
- Callback Supabase PKCE et token hash. Les destinations proviennent de l’état onboarding enregistré; `next` est limité aux routes internes autorisées. L’origine du callback est canonique via `NEXT_PUBLIC_SITE_URL`, sinon dérivée de l’origine et de l’hôte de la requête. Le loopback HTTP reste non sécurisé en exécution locale, y compris avec `NODE_ENV=production`.
- Préférence « mémoriser cet appareil » dans un cookie HttpOnly; sessions glissantes de 30 jours quand activée, cookies de session sinon, y compris lors du renouvellement SSR. Déconnexion locale et suppression des cookies auth et préférence.
- Onboarding en trois étapes persistant l’objectif et les langages. Les changements d’étape sont conditionnels à l’étape courante et à l’absence de date de complétion; les comptes existants sont marqués terminés par migration, les nouveaux commencent à `objectives`.
- Écran final personnalisé avec l’asset robot existant et le premier module réel disponible; aucun XP ou progrès fictif n’est créé.

La migration `supabase/migrations/20261019110547_onboarding_progress.sql` a été testée localement avec PGlite, mais n’a pas été appliquée au projet Supabase hébergé.

## Vérifications exécutées

- `npm run typecheck` — réussi.
- `npm run lint` — réussi.
- `npm test` — 62 tests réussis dans 16 fichiers, incluant tests des actions Auth, callback, proxy, déconnexion limitée au projet et règles de cookies avec mocks SDK.
- `npm run test:db` — 45 vérifications PostgreSQL PGlite réussies, incluant backfill des comptes existants, état initial des nouveaux comptes, progression et protection contre une régression après complétion.
- `npm run test:e2e` — build de production réussi; 18 tests Playwright réussis, 3 tests live ignorés car aucun compte/secret de test Supabase live n’est fourni.
- `git diff --check` — réussi.

Les tests locaux ne valident pas la livraison réelle des courriels, les réglages hébergés Supabase ni une session Auth live.

## Configuration Supabase et suite

Dans **Authentication → URL Configuration**, définir le **Site URL** au domaine canonique de l’application et ajouter les URL de callback autorisées, notamment `http://127.0.0.1:3000/auth/confirm` pour le développement et `https://<domaine>/auth/confirm` en production (ainsi que les ports locaux utilisés). Définir `NEXT_PUBLIC_SITE_URL` sur l’origine HTTPS de production, sans chemin. Les modèles de confirmation et de récupération doivent conserver le `RedirectTo` fourni par l’application et retourner vers `/auth/confirm`; vérifier aussi le fournisseur SMTP et les modèles lors de l’étape 8.

Avant le déploiement, appliquer les migrations via le processus Supabase du projet, puis exécuter l’étape 8 avec un compte de test live : confirmation d’inscription, reprise d’onboarding, récupération de mot de passe et vérification des cookies en HTTP local et HTTPS production.

## Revue du contrôleur

Revue des actions, cookies, callback, migration et composants. Le contrôleur a ajouté trois tests des helpers de routage réels et corrigé le renvoi silencieux vers /home en cas d'état onboarding illisible : toutes les entrées concernées affichent maintenant /setup?error=onboarding. Régression observée avant correction, puis suite finale :65tests/17fichiers,45contrôlesPGlite,lint et build production réussis. Les18E2E ci-dessus sont la recette du sous-agent; la recette mobile complète et l'inspection des captures seront reprises à l'étape7.
