# Étape 2 — rapport

## Livrables

- `src/lib/learning-model.ts` définit les schémas Zod stricts des blocs de théorie, des sept familles d’interaction, des clés auteur et des réponses versionnées. `PublicActivity` ne contient aucune correction. `VersionedSubmission` contient `{ version, answers }`, avec des réponses indexées par identifiant d’interaction.
- `src/lib/learning-grading.ts` expose `gradeInteraction(definition, key, answer)` et `gradeActivitySubmission(authoredActivity, submission)`. Le correcteur rejette les réponses absentes, les identifiants inconnus, les cardinalités incorrectes, les doublons et les payloads trop grands. Il ne lance aucun code. La réponse agrégée fournit `passed`, les résultats par interaction, une explication privée et, si défini, un retour ciblé. Une version différente donne `error: "version_mismatch"`; aucune XP n’est calculée ici.
- `src/components/theory-content.tsx` expose `<TheoryContent blocks={...} />`. Il rend les titres, paragraphes segmentés, listes, notes, code et résultats sans HTML fourni par l’auteur. `src/app/globals.css` ajoute son style mobile et responsive. Le composant n’est pas encore branché aux routes.
- `curriculum/pilot-mvp-004.json` présente le prénom `const` qui ne sera pas réaffecté, et le score `let` qui change, à travers une explication, un exemple avec résultat, un classement, une trace et un choix contextualisé. Il s’agit d’une activité normale, pas d’un projet.
- `supabase/migrations/20261018193000_learning_versions.sql` ajoute les versions, définitions publiques, clés privées, projets et étapes. Les clés n’ont aucun droit ni politique de lecture pour `anon` ou `authenticated`; les nouvelles tables ont RLS et droits explicites. `user_progress` garde ses champs historiques et reçoit un brouillon JSON versionné; les tentatives reçoivent `content_version_id`. La migration ne modifie pas les fonctions d’activation actuelles.

## Contrats pour l’étape 3

- DTO public : `PublicActivity` = `{ id, version, title, theory, interactions, project? }`; une interaction contient `{ id, prompt, context?, code?, definition }`. Les définitions n’incluent aucune clé de correction.
- Réponse : `VersionedSubmission` = `{ version, answers: Record<interactionId, InteractionAnswer> }`. La réponse porte sa famille (`choice`, `matching`, `classify`, `ordering`, `blanks`, `trace` ou `debug`) et uniquement les champs nécessaires à celle-ci. Le schéma est strict et borné.
- Auteur côté serveur : `AuthoredActivity` = `{ public, grading: [{ interactionId, key, explanation, feedback? }], xp }`. La validation exige une clé par interaction et vérifie IDs, options, cardinalités et variantes permises.
- `gradeActivitySubmission` est le point d’entrée pour corriger une activité complète. La route devra vérifier la version courante avant de créer une tentative et traduire `version_mismatch` en HTTP 409. Elle devra calculer les XP après correction côté serveur; cette étape ne crée ni route ni activation XP.
- Théorie : `TheoryContent` reçoit les blocs `PublicActivity["theory"]`.

## Fichiers touchés

- `curriculum/pilot-mvp-004.json`
- `src/lib/learning-model.ts`
- `src/lib/learning-grading.ts`
- `src/components/theory-content.tsx`
- `src/app/globals.css`
- `supabase/migrations/20261018193000_learning_versions.sql`
- `tests/learning-model.test.ts`
- `tests/learning-migration.test.ts`
- `tests/theory-content.test.ts`
- `docs/plans/step-02-report.md`

## Vérification exécutée

- `npm test` : 34 tests passés, 10 fichiers.
- Le test PGlite de migration, inclus dans Vitest, vérifie l’ajout après le schéma et les données historiques, l’accès aux clés, RLS, les versions, les contraintes de contenu public et la cohérence des étapes de projet.
- `npm run test:db` : 27 contrôles PostgreSQL historiques passés avec PGlite.
- `npm run typecheck` : réussi.
- `npm run lint` : réussi.
- `npm run build` : réussi, code de sortie 0.

## Limites

### Revue du contrôleur

Validation de portée des clés mutualisée entre auteur et correcteur; coloration Prism ajoutée et testée avec échappement HTML. Le pilote explique maintenant séparément nom/valeur, affectation, const et let avec deux exemples et une trace détaillée. La question const demande explicitement d'empêcher une réaffectation. Le test de migration vérifie aussi le brouillon historique et les événements XP inchangés; l'assertion sur une relation inexistante a été retirée.

Après correctifs : suite Vitest 35/35, test de migration ciblé réussi, lint réussi et build Next réussi (exit0). Un oubli de type dans une assertion PGlite a été détecté par le build puis corrigé avant cette validation.

Les routes, l’interface de réponse, les brouillons API, le conflit HTTP 409 et le calcul/versement des XP restent à l’étape 3. La migration n’a pas été appliquée à Supabase hébergé et aucun seed complet des 80 activités n’a été créé; ce contenu appartient à l’étape 4. PGlite valide le SQL localement, pas le comportement de Supabase Auth hébergé.
