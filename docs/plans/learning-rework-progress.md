# Ledger du rework pédagogique

Suivi des huit étapes du plan [2026-10-18-learning-rework.md](2026-10-18-learning-rework.md). Le contrôleur met à jour l’état après revue. « En attente » signifie qu’aucune preuve d’achèvement n’est consignée.

| Étape | Livrable | État | Preuve / note |
|---|---|---|---|
| 1. Plan pédagogique | Plan, checklist, matrice 80 activités et revue | Terminée | Revue contrôleur : 80 fiches/IDs uniques, corrections 004/040/050/051/063/070. Produit non encore modifié. |
| 2. Modèle versionné et activité de référence | Modèle, grading privé, mvp-004 de référence, conflits 409 | Terminée | Modèle, grading, pilote, migrationRLS; revue contrôleur corrigée; 35tests, lint et build validés. Voir step-02-report.md. |
| 3. Moteur et API | Huit interactions, soumission serveur, brouillons, XP serveur, 409 | Terminée | Revue contrôleur +2régressions corrigées;45tests, typecheck, lint, build. Voir step-03-report.md. |
| 4. Contenu et migration | 80 activités, seed/migration additive, état existant conservé | En cours | Nouveau sous-agent auteur des80activités; brief step-04-brief.md. |
| 5. Auth et onboarding | Signup/confirmation, objectifs, langues, finish, appareil mémorisé | En attente | À compléter après revue. |
| 6. Retrait du runner | Retrait des éditeurs libres et parcours d’exécution | En attente | À compléter après revue. |
| 7. Revue | Sécurité, comportement, accessibilité, rendu mobile | En attente | À compléter après revue. |
| 8. Documentation et rapport | Documentation et rapport des preuves de validation | En attente | À compléter après revue. |

## Validation de la baseline

Le contrôleur rapporte : typecheck réussi; npm test 20/20 après autorisation d’escalade liée au refus sandbox spawn EPERM; npm run test:db avec 27 contrôles réussis. Ces résultats décrivent la baseline du contrôleur, pas les documents du plan.

## Règles de mise à jour

- Ne marquer une étape terminée qu’après constat du livrable et de sa preuve.
- Employer en cours, en revue, bloquée ou terminée; préciser l’action requise si bloquée.
- Consigner les contrôles réellement lancés; distinguer plan et implémentation.
- Préserver le ledger et ajouter les références de revue/commit lorsqu’elles existent.

## Décisions du contrôleur

- Travail dans le checkout existant conformément à la demande utilisateur; pas de worktree.
- Chaque étape utilise un nouveau gpt-6-luna high; revue par le contrôleur, petits correctifs locaux, nouveau sous-agent si corrections importantes.
- Les sept interactions primitives composent le huitième format, projet guidé. La validation finale recontrôle toutes les étapes et protège les XP.
