# LiteCode

LiteCode est une application web en français pour apprendre JavaScript par étapes. Le parcours comprend 10 modules et 80 activités : des leçons, des exercices structurés et 10 projets guidés. Next.js fournit l’interface et les routes serveur; Supabase hébergé stocke les comptes et la progression. Les réponses structurées sont corrigées de façon déterministe côté serveur; aucun code de l’apprenant n’est exécuté.

L’implémentation locale et ses contrôles sont décrits dans [IMPLEMENTATION_REPORT.md](IMPLEMENTATION_REPORT.md). La connexion à un projet Supabase, la livraison réelle des courriels et le déploiement de production restent à préparer.

## Prérequis et démarrage

Utiliser Node.js 22.12 ou plus récent (Node 24 recommandé), npm et un projet Supabase hébergé. Dans PowerShell :

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Ouvrir <http://127.0.0.1:3000>. Si ce port est occupé, démarrer avec `npm run dev -- --port 3108` et autoriser aussi ce callback local dans Supabase. L’accueil public ne nécessite pas de compte; les pages privées demandent une configuration Supabase. Aucun compte, XP ou classement fictif n’est créé.

Renseigner les quatre variables de `.env.local` avec les valeurs du projet :

| Variable | Usage |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de l’instance Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé publishable, utilisée par le client |
| `NEXT_PUBLIC_SITE_URL` | Origine canonique de l’application pour les courriels Auth; facultative en développement, requise en production |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé serveur réservée aux opérations privilégiées; ne jamais l’exposer au navigateur |

Ne jamais placer la clé service role dans une variable `NEXT_PUBLIC_*`. Redémarrer le serveur après un changement local. Pour une mise en service, définir les variables publiques avant `npm run build`, car Next.js les intègre au build; `NEXT_PUBLIC_SITE_URL` doit être l’origine HTTPS canonique, sans chemin.

## Base Supabase

Le projet suit des migrations versionnées dans `supabase/migrations/`. Une base existante conserve ses données : le CLI applique les migrations manquantes dans l’ordre et la migration du curriculum ajoute la version 2 des activités. Pour une base neuve, le même historique construit le schéma complet depuis la première migration. Les deux procédures commencent par une liaison explicite au projet voulu et une simulation :

```powershell
npx supabase login
npx supabase projects list
npx supabase link --project-ref TON_PROJECT_REF
npx supabase db push --linked --dry-run --skip-vault
```

Examiner la liste des migrations qui seraient appliquées et confirmer que la référence liée est celle attendue. Après cette revue, appliquer les migrations :

```powershell
npx supabase db push --linked --skip-vault
```

Le dry-run affiche les migrations prévues; la seconde commande les applique au projet lié. Ces opérations n’ont pas été exécutées pendant le rework. `--skip-vault` évite toute synchronisation des secrets Vault, inutile ici. Le CLI applique les migrations manquantes dans l’ordre, aussi bien à une base existante qu’à une base neuve. La migration `20261019022914_learning_curriculum_v2.sql` contient le corpus nécessaire aux 80 activités; le seed généré à côté est reproductible et rejouable lorsque le contenu est identique. Si un environnement **de développement ou de staging** doit aussi exécuter le seed après ses migrations, utiliser `--include-seed` après avoir vérifié le dry-run. Le seed séparé est inutile pour cette mise à jour en production; ne pas utiliser `db reset` sur une base hébergée. Voir la [référence CLI Supabase pour db push](https://supabase.com/docs/reference/cli/supabase-db-push).

Pour modifier le curriculum, éditer les sources dans `curriculum/authoring/`, puis produire les fichiers dérivés :

```powershell
npm run curriculum:author
npm run curriculum:build
```

`npm run curriculum:author` compile les sources auteur et écrit `curriculum/original.fr.json`. Ensuite, `npm run curriculum:build` lit ce JSON et produit `supabase/seed.sql` et la migration de contenu. Revoir ces diff ensemble avant de proposer une migration. Les commandes n’appliquent rien à Supabase.

## Authentification et courriels

Dans **Supabase → Authentication → URL Configuration**, définir le Site URL au domaine HTTPS canonique de production et autoriser les callbacks de l’application. Les URL demandées par le code sont :

- confirmation après inscription : `https://TON_DOMAINE/auth/confirm?next=onboarding`;
- récupération de mot de passe : `https://TON_DOMAINE/auth/confirm?next=settings`.

Pour le développement, autoriser les mêmes chemins sur `http://127.0.0.1:3000`; ajouter le port choisi, notamment `3107` pour la suite E2E publique ou `3108` si le serveur de développement a été déplacé. En production, autoriser les deux callbacks HTTPS sur le domaine exact. Supabase doit accepter ces URL de redirection; voir la [documentation des URL de redirection Supabase](https://supabase.com/docs/guides/auth/redirect-urls).

Les modèles de courriel doivent préserver l’URL `RedirectTo` générée par l’application et y ajouter les paramètres de vérification. Comme `RedirectTo` contient déjà `?next=onboarding` ou `?next=settings`, les modèles token hash ajoutent `&token_hash={{ .TokenHash }}&type=email` pour une confirmation et `&token_hash={{ .TokenHash }}&type=recovery` pour une récupération. Supabase doit rediriger vers `/auth/confirm` avec ces paramètres. Pour PKCE, le callback accepte `code` et l’échange contre une session. Les paramètres de requête peuvent être dans un ordre différent. Configurer un SMTP de production et vérifier les modèles dans le tableau de bord; les tests locaux ne prouvent pas que les courriels hébergés sont effectivement livrés.

L’inscription mène à l’onboarding seulement après la création du compte et la confirmation si Supabase l’exige. Une connexion reprend l’étape non terminée; les comptes présents avant la migration d’onboarding sont marqués comme déjà terminés. « Se souvenir de cet appareil » est sélectionné par défaut : les cookies de session sont prolongés jusqu’à 30 jours, sinon ce sont des cookies de session. La déconnexion locale supprime les cookies d’authentification de LiteCode et la préférence de cet appareil. Certains navigateurs peuvent restaurer les cookies de session après fermeture; cette préférence ne force donc pas une déconnexion.

## Activités et provenance

Les interactions évaluées sont le choix, l’association, le classement, l’ordre, les textes à trous, la trace de valeurs et le débogage guidé. Les projets composent ces interactions en étapes sauvegardées. Le serveur garde les clés, vérifie les prérequis et la version du contenu, et calcule les XP. Les corrections ne lancent jamais JavaScript ou des commandes shell. Les règles et limites figurent dans [docs/EXECUTION.md](docs/EXECUTION.md).

Les XP sont uniques par compte et activité. Une activité réussie chaque jour UTC entretient la série; une reprise réussie peut compter pour la série sans rapporter de XP additionnel. Les badges suivent les seuils de 1, 8, 20 et 80 activités distinctes terminées.

Le curriculum est original et conservé dans `curriculum/`; les fichiers fournis à l’origine restent dans `references/`. Les sources thématiques, crédits, attribution et modifications sont suivis dans les données et regroupés dans « Sources et crédits » des paramètres. Aucun corps de leçon, test ou solution freeCodeCamp n’a été repris. Voir [docs/CONTENT.md](docs/CONTENT.md).

## Vérifications locales

```powershell
npm run typecheck
npm run lint
npm test
npm run test:db
npx playwright install chromium
npm run test:e2e:mobile
npm run test:e2e
npm run build
```

`npm run test:db` utilise PostgreSQL embarqué PGlite pour exécuter les migrations et vérifier notamment le schéma, les droits, les prérequis et les récompenses. Cela ne teste pas Supabase Auth hébergé. `npm run test:e2e:mobile` utilise les vrais composants avec des fixtures de réponses locales aux largeurs 375, 390, 430 et 1440 px. `npm run test:e2e` construit la production avec les variables Supabase explicitement vides puis lance les E2E publics; ce script désactive toujours les tests live.

Une recette Supabase live n’est permise que sur un projet de test dédié et explicitement identifié. Dans PowerShell, fournir les variables de ce projet puis construire et lancer uniquement le test live :

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL = 'URL_HTTPS_DU_PROJET_DE_TEST'
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'CLE_PUBLISHABLE_DU_PROJET_DE_TEST'
$env:SUPABASE_SERVICE_ROLE_KEY = 'CLE_SERVICE_ROLE_DU_PROJET_DE_TEST'
$env:NEXT_PUBLIC_SITE_URL = 'http://127.0.0.1:3107'
$env:LITECODE_E2E_LIVE = '1'
$env:LITECODE_E2E_TEST_PROJECT_REF = 'REFERENCE_EXACTE_DU_PROJET_DE_TEST'
npm run build
npx playwright test tests/e2e/live.spec.ts
```

Le garde exige `LITECODE_E2E_LIVE=1` et vérifie que l’URL correspond exactement à la référence du projet de test. Cette recette crée puis supprime son propre compte de test; ne pas la lancer contre la production. Le script `npm run test:e2e` vide toujours ces variables et ne peut pas servir à la recette live. Celle-ci n’a pas été exécutée pour ce rework.

## Préparation de production

Avant la mise en service, préparer le projet Supabase, appliquer les migrations revues, configurer le fournisseur Email/Password, les URL et modèles Auth, un SMTP de production, puis les variables de déploiement. Après leur configuration, reconstruire l’application et vérifier le parcours avec un compte de test dédié. La présence d’un build réussi ne signifie pas que l’application est déployée ou opérationnelle. Le déploiement et toute mutation de la base hébergée sont hors du périmètre du présent rework.
