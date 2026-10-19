# Étape 3 — rapport

## Interfaces livrées

- `GET /api/learning/[id]/draft` restaure seulement un brouillon du compte et de la version active. `PUT` valide un schéma de brouillon distinct, incomplet mais borné, puis sauvegarde via RPC; les états `passed` et les clés ne sont jamais acceptés du client.
- `POST /api/learning/[id]/attempt` reçoit `{ version, answers }`, compare la version active avant de créer une tentative, corrige sur le serveur et termine l’essai avec le résultat/XP calculés côté serveur. Une version périmée répond 409.
- `POST /api/learning/[id]/steps/[stepId]` valide une étape isolée et persiste sa soumission/résultat sans terminer d’essai ni attribuer d’XP. `POST /api/learning/[id]/project/finish` recharge les réponses d’étape, les regrade toutes contre les clés privées actuelles et n’autorise `finish_attempt` qu’après réussite complète.
- Les RPC de `20261019013608_learning_runtime.sql` verrouillent le profil pour sérialiser sauvegarde/édition/autorisation/finalisation, interdisent le saut d’étapes, invalident les étapes dépendantes et l’autorisation finale après une modification, et protègent les RPC avec des grants explicites `service_role`. Le garde legacy refuse le bypass de soumission et de finition pour une leçon v2. Migration additive; les migrations précédentes sont intactes.
- `LearningExercise` utilise les widgets choice, matching, classify, ordering, blanks, trace et debug. Les associations et classements sont manipulables au clavier/tactile; l’ordre affiché respecte l’ordre public auteur. Les brouillons sont sérialisés. La théorie est repliable, la langue du code est respectée, les retours de correction sont affichés et le mode sombre est stylé. La page de résultat normalise les résultats legacy, versionnés et projet. La page « Sources et crédits » lit les données dynamiques; son accès est dans les paramètres, sans provenance répétée en bas des leçons v2.

## Fichiers principaux

- Backend et modèle : `src/lib/learning-model.ts`, `src/lib/learning-grading.ts`, `src/lib/learning-runtime.ts`, `src/lib/learning-workflow.ts`, `src/lib/learning-result.ts`, `src/lib/types.ts`.
- Routes : `src/app/api/learning/[id]/attempt/route.ts`, `draft/route.ts`, `steps/[stepId]/route.ts`, `project/finish/route.ts`.
- Interface : `src/components/learning-exercise.tsx`, `src/components/learning/*`, `src/components/code-block.tsx`, pages leçon/exercice/résultat et sources, `src/app/globals.css`, `src/components/settings-form.tsx`.
- Données et tests : `supabase/migrations/20261019013608_learning_runtime.sql`, `tests/learning-migration.test.ts`, `tests/learning-model.test.ts`, `tests/learning-result.test.ts`.

## Vérification réellement exécutée

- `npm run typecheck` : réussi.
- `npm run lint` : réussi après correction des usages de refs/effets dans les widgets et suppression d’un import inutilisé.
- `npm test` : 39 tests, 11 fichiers réussis. Les tests PGlite vérifient notamment conflit de version sans tentative créée, refus du chemin legacy, étapes sans récompense, prérequis, édition/invalidation puis revalidation, RLS propriétaire, autorisation finale invalidée et XP idempotente.
- `npm run build` : réussi; compilation, TypeScript et génération des routes/pages terminés. L’escalade locale a été nécessaire après `spawn EPERM` en sandbox.
- Aucun navigateur/E2E ni Supabase hébergé utilisé. Les données pilotes ne sont pas activées par cette étape.

## Suite

Étape 4 fournira le corpus auteur et l’activation des versions; l’étape 3 conserve volontairement le chargement versionné en préparation. Revoir le parcours rendu sur mobile et desktop quand le corpus sera disponible.

Retraits v1 à effectuer à l’étape 6, après conversion et vérification de parité de toutes les leçons :

- `src/components/exercise.tsx`;
- `src/app/api/lessons/[id]/attempt/route.ts` et `src/app/api/lessons/[id]/draft/route.ts`;
- la branche de repli legacy de `src/app/(learn)/exercise/[id]/page.tsx`;
- la branche legacy de contenu/provenance dans `src/app/(learn)/lesson/[id]/page.tsx`.

## Revue et correctifs du contrôleur

- Projet terminé rejouable : retirer le blocage completed des sauvegardes, sans effacer la complétion et sans second XP. Test de régression constaté rouge puis vert; nouvelle tentative réelle récompensée0XP.
- Brouillon périmé : HTTP409 avant écriture au lieu de400. Test du handler réel constaté rouge puis vert.
- Ajouter tests de handlers avec stockage/auth doublés isolément :401 sans utilisateur,403 origine étrangère,400 XP/pass forgés,409 version périmée, correction et récompense serveur sans clés exposées. Ce ne sont pas des tests Supabase Auth live.
- Dépendances React de sauvegarde explicites sans suppression ESLint; index des autorisations par utilisateur/version.
- Après correctifs :45tests/12fichiers passés; typecheck, lint et build Next réussis. Le glisser-déposer tactile des blocs complète les boutons lors de la recetteétape7.
