# LiteCode

Application d’apprentissage JavaScript, en français, construite avec Next.js App Router,
TypeScript strict, Tailwind et Supabase. 80 activités originales, 10 modules, 16 écrans.

**État : implémentation livrée et vérifications locales effectuées. La recette intégrée
avec Supabase reste à exécuter après configuration.** Les variables sont laissées vides.
Voir [IMPLEMENTATION_REPORT.md](IMPLEMENTATION_REPORT.md) pour la portée des preuves.

## Démarrer

Prérequis : Node.js 22.12+ (Node 24 recommandé), npm et un projet Supabase hébergé.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Ouvrir http://127.0.0.1:3000. Si ce port est occupé : `npm run dev -- --port 3108`.
L’accueil est public ; la création de compte précède l’onboarding, puis l’accueil reprend
la dernière étape enregistrée. Les pages privées affichent la configuration requise si
Supabase est absent. Aucun compte, XP ou classement fictif n’est créé.

Renseigner `.env.local` :

| Variable | Valeur à fournir |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé publique/publishable du projet |
| `NEXT_PUBLIC_SITE_URL` | Origine canonique de l’application pour les courriels Auth (facultatif en développement) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role, exclusivement serveur |

Ne jamais préfixer les deux secrets serveur avec `NEXT_PUBLIC_`. Redémarrer le serveur
après modification. En production, **reconstruire** l’application après configuration
des variables publiques, qui sont intégrées au build Next.js.

## Base de données

Depuis le projet, connecter le CLI au projet Supabase hébergé puis appliquer le schéma
et le contenu initial :

```powershell
npx supabase login
npx supabase projects list
npx supabase link --project-ref TON_PROJECT_REF
npx supabase db push --linked --dry-run --skip-vault
npx supabase db push --linked --include-seed --skip-vault
```

Alternative pour un projet neuf : exécuter tous les fichiers `supabase/migrations/*.sql`
par ordre de nom, puis `supabase/seed.sql`.

Le seed est reproductible et utilise des upserts. La migration initiale ne doit être
appliquée qu’une fois. Activer le fournisseur Email/Password dans Supabase Auth.
Vérifier que le schéma `public` est exposé au Data API ; les grants et RLS sont fournis.
Appliquer la migration avant de créer les comptes : le trigger crée leurs profils.

### Courriels et sessions

Dans Auth → URL Configuration, définir le Site URL et ajouter à Redirect URLs les origines
locale et de production suivies de `/auth/confirm` (par exemple
`http://127.0.0.1:3000/auth/confirm` et `https://ton-domaine/auth/confirm`). En production,
`NEXT_PUBLIC_SITE_URL` doit être l’origine HTTPS canonique, sans chemin. Le callback choisit
la suite depuis l’état enregistré du compte; le paramètre `next` n’accepte que la destination
interne de récupération de mot de passe.

Conserver les modèles de courriel Supabase qui respectent `RedirectTo`, ou les adapter au SSR :

- Confirmation : `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
- Récupération : `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`

Après récupération, la page Paramètres permet de modifier le mot de passe. Le handler
accepte aussi un `code` PKCE. Les sessions utilisent des cookies ; le proxy les rafraîchit
et les accès serveur vérifient `auth.getUser()`. Activer la confirmation de courriel pour
la production. Les tests authentifiés créent leur compte de test déjà confirmé. La préférence
« Se souvenir de cet appareil » est propre au navigateur et prolonge sa session jusqu’à 30 jours;
décochée, ses cookies expirent à la fermeture du navigateur. Les navigateurs peuvent restaurer
des sessions après fermeture, donc cette option ne force pas une déconnexion.

## Activités structurées

Les exercices et projets utilisent des interactions structurées. Le serveur valide
les réponses avec leurs définitions et clés privées; aucun code de l’apprenant n’est
exécuté. Voir [docs/EXECUTION.md](docs/EXECUTION.md) pour les règles de correction,
les limites, les tentatives, les XP et la reprise des brouillons.

## Programme et droits

`curriculum/original.fr.json` contient les textes, exercices, questions, indices et
corrigés originaux. Les corrigés ne sont pas chargés dans l’interface. Pour régénérer :

```powershell
npm run curriculum:author
npm run curriculum:build
```

Les 80 IDs du plan fourni sont conservés. Deux titres ambigus de projets ont été clarifiés.
Les références freeCodeCamp servent au classement thématique ; aucun corps de leçon,
assertion, vidéo ou solution freeCodeCamp n’a été importé. Les originaux fournis restent
dans `references/`. Le script fourni n’est pas exécuté pour télécharger du contenu.
Voir [docs/CONTENT.md](docs/CONTENT.md).

## Tests

```powershell
npm run typecheck
npm run lint
npm test
npm run test:db
npx playwright install chromium
npm run test:e2e
npm audit
```

`test:db` exécute la migration et le seed dans PostgreSQL embarqué PGlite : les RLS,
permissions, prérequis et récompenses sont réellement exercés. Il n’émule pas Supabase Auth.
Vitest vérifie les 80 activités et les interactions structurées, y compris les réponses
correctes et incorrectes, sans exécuter de code fourni par l’apprenant.

Les tests navigateur construisent la production et la démarrent sur le port dédié **3107**.
Ils vérifient 375, 390 et 430 px, les écrans publics, les erreurs de configuration et les
protections. Les captures restent dans `test-results/` (ignoré par Git).

Pour la recette authentifiée sur un **projet Supabase hébergé réservé aux tests**, injecter
les variables requises de `.env.example` dans le processus de test, puis :

```powershell
$env:LITECODE_E2E_LIVE = '1'
$env:LITECODE_E2E_TEST_PROJECT_REF = 'REFERENCE_DU_PROJET_DE_TEST'
npm run test:e2e
```

Le test exige une URL HTTPS correspondant exactement à la référence de test confirmée,
puis crée/supprime uniquement son propre utilisateur. Ne pas viser le projet de production.
Laisser `LITECODE_E2E_LIVE` absent pour la recette publique sans configuration.
Ces tests live n’ont pas été exécutés lors de la livraison, faute d’instance configurée.

## Architecture et règles

- `src/app/` : pages serveur, actions de compte et routes API.
- `src/components/` : composants visuels, navigation, interactions et indices.
- `src/lib/` : accès aux données, validations et règles de correction.
- `supabase/` : schéma normalisé, permissions et contenu de départ.
- `tests/` : règles, contenu, contrats de correction et parcours navigateur.

La base reste la source de vérité. Le navigateur n’envoie ni XP ni état de réussite.
Les réponses correctes et tests sont invisibles au rôle utilisateur. Seul le backend,
après vérification, peut appeler les RPC de tentative et de récompense. Une transaction
verrouille le profil et garantit un événement XP unique par activité et utilisateur.

Une réussite par jour **UTC** entretient la série ; une journée sans réussite la casse.
Les reprises entretiennent la série mais ne redonnent pas de XP. Cinq cœurs représentent
le budget d’erreurs du jour UTC ; à zéro, la pratique reste possible. Les badges récompensent
1, 8, 20 et 80 activités terminées. Le classement hebdomadaire commence lundi à 00:00 UTC.
L’objectif quotidien est une préférence de durée, pas un faux chronomètre d’apprentissage.

## Déploiement

Next.js est déployé sur Vercel : https://litecode-mu.vercel.app.
Configurer Supabase et `NEXT_PUBLIC_SITE_URL` avant `npm run build`, puis `npm run start`.
Configurer les URLs Auth et les modèles de courriel pour le domaine HTTPS final.
Le manifeste, les icônes iOS et les zones de sécurité sont fournis pour l’ajout à l’écran
d’accueil ; l’application nécessite une connexion pour les comptes et les leçons.
Les données privées ne sont pas mises en cache hors ligne.

Les variables Vercel restent à renseigner par le propriétaire, puis le déploiement à reconstruire.
