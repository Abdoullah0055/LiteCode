# Rapport — Étape 6 : retrait du runner

## Changements

- Retiré le service `runner/`, `src/lib/execution.ts`, l’éditeur v1, les routes v1 de tentative et de brouillon, leurs anciens types et tests, ainsi que le script npm associé.
- Supprimé `quickjs-emscripten` et `react-simple-code-editor` de `package.json` et du lockfile, sans mise à niveau des autres dépendances. Prism et `CodeBlock` restent pour afficher les exemples.
- Toutes les activités utilisent les types `lesson`, `exercise` et `project`; les pages, icônes, liens et libellés distinguent maintenant les exercices interactifs des projets guidés.
- Une version v2 absente ou illisible affiche « Mise à jour nécessaire »; aucun éditeur ou succès v1 n’est réactivé. `/setup?error=onboarding` signale la migration manquante et ne prétend pas que les variables sont vides.
- La recette E2E live envoie des réponses v2 et conserve ses gardes `LITECODE_E2E_LIVE` et référence exacte du projet Supabase de test.
- Réécrit `docs/EXECUTION.md`, mis à jour README, AGENTS et le plan d’implémentation initial clairement marqué comme archive.

Les tables et colonnes historiques, les tentatives et leurs résultats sauvegardés restent en place; aucune migration ni donnée Supabase distante n’a été modifiée. Les résultats historiques sont toujours affichés depuis leur snapshot sans réévaluation. L’API d’indices et les sauvegardes structurées restent actives.

Fichiers supprimés : `runner/evaluate.d.mts`, `runner/evaluate.mjs`, `runner/server.mjs`, `runner/worker.mjs`, `src/lib/execution.ts`, `src/components/exercise.tsx`, `src/app/api/lessons/[id]/attempt/route.ts`, `src/app/api/lessons/[id]/draft/route.ts`, `tests/runner.test.ts` et `tests/runner-http.test.ts`. Le dossier `runner/` est supprimé.

## Vérifications

- `npm install --package-lock-only --ignore-scripts --no-audit --no-fund` — lockfile mis à jour; versions restantes inchangées.
- `npx next typegen` puis `npm run typecheck` — réussis. Les types générés sous `.next/dev/types` contenaient les anciennes routes supprimées; après leur régénération/nettoyage, le contrôle passe.
- `npm test` — **58 tests dans 15 fichiers réussis**. Le premier essai en bac à sable a échoué sur `spawn EPERM`; relancé avec l’escalade prévue.
- `npm run test:db` — **45 contrôles PGlite réussis**.
- `npm run lint` — réussi.
- `npm run test:e2e` — build Next.js réussi; **21 E2E réussis, 3 tests live ignorés** par leur garde. Cela inclut les routes protégées, le refus de l’ancienne route de tentative et le message de migration.
- `git diff --check` — réussi.
- Recherche dans le code actif : aucun import, script, variable d’environnement, dépendance ou runtime d’exécution runner restant. Les références historiques dans les pièces fournies, fixtures v1, rapports et migrations sont conservées.

## Limites

La recette Supabase live n’a pas été exécutée; les trois variantes restent désactivées tant que `LITECODE_E2E_LIVE` n’est pas explicitement activé avec un projet de test dédié. Les contrôles locaux n’attestent pas d’une migration hébergée. `.env.local` n’a pas été ouvert ni modifié; `NEXT_PUBLIC_SITE_URL` reste présent et vide dans `.env.example`.

## Revue du contrôleur

Imports, dépendances, anciennes routes et suppressions relus. Aucun usage actif de RUNNER_*, executeCode, eval, new Function ou localStorage dans src; seul le paquet de test @vitest/runner reste dans le lockfile. Les tests d'origine et d'autorisation ont été adaptés aux routes v2 sans affaiblissement. Le contrôleur a corrigé deux formulations de documentation, puis confirmé58tests/15fichiers,45contrôlesPGlite,lint et build production. La recette mobile complète sera refaite à l'étape7.
