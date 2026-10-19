# Rapport d’implémentation LiteCode

Date : 19 octobre 2026. Ce rapport décrit le rework pédagogique et l’application dans son état local à la fin des huit étapes, après revue du contrôleur. Le build et les contrôles locaux ne signifient pas que Supabase, les courriels ou l’application ont été mis en service.

## Livré

- Parcours en français de 10 modules et 80 activités; IDs, XP historiques, prérequis et données de progression conservés.
- Théorie réorganisée avec titres, exemples lisibles et résultats affichés. Les mentions de provenance répétées au bas des activités ont été retirées; les crédits et URL sources restent dans les données et la page « Sources et crédits ».
- Sept interactions structurées et 10 projets guidés à étapes. Les clés restent privées; le serveur corrige les réponses et calcule les récompenses. Le code de l’apprenant n’est jamais exécuté.
- Sauvegarde et reprise des brouillons versionnés. Une version périmée est rejetée avec HTTP 409. La finalisation d’un projet revalide toutes les étapes; les sauvegardes intermédiaires ne donnent pas de XP et une activité réussie ne récompense qu’une fois.
- Inscription avec confirmation du mot de passe, confirmation par courriel lorsque Supabase l’exige, onboarding persistant et finish illustré. Reprise des étapes incomplètes, migration de complétion des comptes existants, préférence de cookies de session jusqu’à 30 jours et déconnexion locale.
- Retrait du runner et des anciens éditeurs d’apprentissage. Les résultats historiques restent lisibles depuis leur instantané.
- Corpus source, génération de migration additive et seed reproductible; documentation des interactions, provenance, Auth et préparation de la base.

## Vérifications locales consignées à l’étape 7

- `npm test` : **64 tests dans 16 fichiers réussis**.
- `npm run test:db` : **45 contrôles PostgreSQL réussis avec PGlite**; les scripts exécutent réellement les migrations et le seed dans PostgreSQL embarqué.
- Harness UI : **20/20 réussis** sous Chromium, avec les vrais composants, des réponses de fixture et les largeurs 375, 390, 430 et 1440 px.
- `npm run test:e2e` : build réussi, **19 E2E publics réussis et 5 ignorés**. Les cinq ignorés sont les trois tests Auth/Supabase live et deux captures du prototype à 375 et 430 px; la capture à 390 px a réussi.
- `npm run typecheck`, `npm run lint` et `npm run build` : réussis.
- Les captures accueil/prototype, interactions, théorie 004 et finish à 390 px ont été ouvertes et inspectées.

Le harness UI répond à des endpoints fictifs locaux : il vérifie les interactions du navigateur, pas Auth ni la persistance Supabase. Les contrôles PGlite portent sur PostgreSQL et les migrations locales, pas sur une instance distante. La recette mobile utilise Chromium avec émulation tactile; elle ne remplace pas Safari sur appareil physique. Les résultats détaillés et correctifs sont consignés dans [les rapports d’étape 2 à 7](docs/plans/).

## Non exécuté et dépendances de mise en service

- Aucun test Supabase hébergé ni compte distant n’a été utilisé; les tests live ont été ignorés par leur garde.
- La livraison effective des courriels, SMTP, Site URL, URL de redirection et modèles de confirmation/récupération n’a pas été testée.
- Les nouvelles migrations, y compris la migration du curriculum et celle d’onboarding, n’ont pas été appliquées au projet Supabase hébergé.
- Aucun déploiement ni contrôle de l’application en production n’a été effectué.
- Safari/iPhone physique n’a pas été testé.
- `.env.local` n’a pas été lu ni modifié. Les quatre valeurs de `.env.example` sont vides; ce fait ne permet pas de conclure sur le contenu d’un fichier local ignoré.

Avant la mise en service, le propriétaire doit sélectionner et lier le bon projet Supabase, examiner le dry-run documenté dans le README, appliquer les migrations revues qui contiennent déjà le curriculum, configurer le fournisseur Email/Password, les callbacks autorisés, les modèles qui préservent `RedirectTo`, le SMTP et les quatre variables documentées dans `.env.example`. Il faut ensuite reconstruire après configuration des variables publiques, déployer par le processus du projet et valider Auth avec un compte de test dédié. Ces opérations distantes restent hors de ce rework.

## Historique

`IMPLEMENTATION_PLAN.md` est conservé comme archive du plan initial de l’application; ses cases et preuves ne décrivent pas le rework courant. Le plan, la checklist active et les preuves par étape se trouvent dans [`docs/plans/2026-10-18-learning-rework.md`](docs/plans/2026-10-18-learning-rework.md), le ledger et les rapports datés. L’étape 8 consigne la mise à jour documentaire relue par le contrôleur.
