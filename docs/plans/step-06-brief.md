# Étape 6 — Suppression complète du runner

Après étapes2à5 revues, lire AGENTS.md, les rapports et l’état réel avant modification. Pas de délégation, commit, push, déploiement, Docker, secrets affichés/modifiés ou changement distant. Le contrôleur revoit et committe.

## Nettoyage fonctionnel

- Toutes les80activités utilisent maintenant le moteur structuré; retirer les branches de code libre, executeCode, l’import dynamique du runner, les routes/schémas de soumissionv1 de code et l’ancien éditeur.
- Aligner ActivityType, icônes du parcours, libellés de cours et liens sur les types de publication v2 (`exercise` et `project`) et les familles structurées. Ne pas laisser tous les exercices afficher un ancien libellé « écrire du code ».
- Supprimer les fichiers suivis du dossier runner/ et src/lib/execution.ts. Retirer quickjs-emscripten et react-simple-code-editor, script npm runner, types inutilisés; conserver Prism et CodeBlock nécessaires aux extraits. Mettre package-lock à jour sans mise à niveau des dépendances restantes, avec audit/fund/scripts désactivés pour cette opération.
- Retirer RUNNER_URL/RUNNER_API_KEY de .env.example (garder les trois clés Supabase et NEXT_PUBLIC_SITE_URL vides); ne jamais ouvrir ou modifier .env.local. Les variables distantes ne sont pas touchées. NEXT_PUBLIC_SITE_URL a été ajouté à l'étape5 pour les callbacks Auth : le conserver.
- Mettre à jour AGENTS.md : remplacer l’ancienne consigne Nodepourrunner par gradingdéterministe côtéserveur; conserver sansmodificationla règle jamaisDocker et blocgéréNext.
- Retirer les tests d’exécution historiques devenus horssujet, et les remplacer par couverture des nouveaux contrats si ce n’est déjà fait. E2Elive ne requiert plus de runner et utilise les nouveaux formats; conserver impérativement garde LITECODE_E2E_LIVE + exact projet Supabase dédié.
- Une activité sans contenuv2 dans une base non migrée reçoit un état explicite de mise à jour nécessaire; ne réafficher aucun éditeurv1 ou succès simulé. Les anciennes tentatives restent lisibles à partir de leurs résultats sauvegardés, sans réévaluation. Ne pas supprimer historique, colonnes/tableaux historiques au motif qu’aucun runtime ne les utilise.
- Nettoyer aussi /setup : supprimer l'étape de lancement du service JavaScript. Si error=onboarding, afficher un message de migration manquante plutôt que prétendre que les variables sont vides alors qu'une session existe déjà.
- Anciennes références en references/ et citations historiques dans rapports/migrations ne sont pas des dépendances runtime à effacer. Ne pas modifier les pièces fournies ou l’ancienne migration.

## Docs et vérification

- Réécrire docs/EXECUTION.md autour des interactions structurées, correction serveur, limites de ce qui est évalué, XP et reprise. Retirer procédures de lancement/hébergement de runner dans README/plan d’implémentation actif; garder historique clairement daté si utile au rapport.
- Rechercher imports/dépendances/env/scripts restants. Aucune utilisation de eval, new Function, quickjs ou service externe d’exécution dans le parcours. Ne pas interpréter les exemples de mots 'runner' dans anciens documents comme une dépendance active.
- Tests, typecheck, lint, build selon pertinence après suppression. Vérifier que les80activités ont une définition exploitable et plus aucun cas requérant runtime. Rapport docs/plans/step-06-report.md avec fichiers retirés, commandes et résultats, aucune promesse d’infrastructure gratuite pour toujours.
