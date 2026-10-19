# Étape 3 — Moteur d’interactions et parcours connecté

## Sources et limites

Lire AGENTS.md, step-02-report.md, learning-model.ts et les fichiers existants avant de coder. Respecter le modèle testé de l’étape2; modifier les interfaces seulement si l’UI ou la sécurité l’exige, avec tests. Next16 : lire les guides locaux pertinents. Pas de sous-agent, commit, push, déploiement, Docker, secrets imprimés, mutation Supabase distante ou worktree.

## Interface mobile

- Remplacer le composant monolithique d’exercice par un conteneur de parcours et de petits composants par famille : choice, matching, classify, ordering, blanks, trace, debug. guided_project compose ces familles dans des étapes.
- Pour les choix : sélection simple/multiple claire, aria appropriés, état sélectionné et validation indisponible tant que réponse incomplète.
- Associations/classement : interaction tactile par sélection puis destination, sélecteurs explicites ou boutons; ne jamais exiger un geste de glisser-déposer. L’utilisateur doit comprendre ce qu’il lui reste à associer.
- Ordre des blocs : permettre de déplacer les éléments par boutons monter/descendre et glisser-déposer tactile si correctement supporté. L’ordre initial ne doit pas révéler systématiquement la solution. Des boutons accessibles permettent toutes les opérations.
- Trous et traces : espaces contextualisés, libellés compréhensibles, options quand appropriées; saisie courte bornée pour nombres/mots, clavier adapté. Aucun textarea de code libre.
- Debug : extraits lisibles avec lignes numérotées, choix de ligne puis remplacement, aperçu de la correction sélectionnée.
- Réutiliser TheoryContent dans les pages de leçon. Retirer les mentions de provenance répétées; créer Sources et crédits, lien depuis paramètres, données de provenance conservées. Garder version et clé hors de l’interface de l’élève.
- Chaque écran garde la navigation, les indices, les états chargement/erreur/lecture seule historique, et le style LiteCode. Actions accessibles sans masquer les réponses, pas de débordement à375px. Réduction des mouvements respectée.

## Backend et persistance

- Contenu récupéré dynamiquement dans Supabase; aucun import de correction/corpus auteur dans un Client Component. Séparer explicitement DTO public et clés privées.
- Soumission : version + réponses par identifiant d’interaction. Lire identité utilisateur depuis auth.getUser, prérequis serveur, version active. Rejeter code libre, XP, passed et champs inconnus. Version périmée :409 avant toute création de tentative ou perte de cœur.
- Le correcteur utilise les définitions et clés de la version épinglée, jamais une clé issue du client. Réponse : tentative, correction par question, réussite et XP calculés côté serveur.
- Projets : endpoint ou scope d’étape distinct, dérivé/validé serveur. Persister réponse et résultat de l’étape après correction, sans XP, streak, badge ou complétion de leçon. Interdire les étapes hors projet ou sautant des prérequis. Validation finale relit/revérifie toutes les étapes de la version avant finish_attempt; le client ne soumet aucun booléen de réussite.
- Conserver la protection anti-double récompense existante, y compris soumissions concurrentes et rejeu d’étape. Le RPC ne peut pas confondre étape et activité finale. Les erreurs d’étape ne doivent pas compter plusieurs fois comme échec final dans les cœurs; adapter les requêtes de statistiques si un scope est ajouté.
- Brouillons versionnés structurés pour tous les formats. Sérialiser les sauvegardes pour éviter écrasement/revert par une requête retardée, réutiliser le principe de save-queue. Brouillon privé au compte; restaurer réponses et étape; un brouillonv1 n’est jamais interprété comme réponsesv2. Ne jamais sauvegarder dans un brouillon des états de réussite fournis par client.
- Nouvelle migration additive pour adapter RPC/projet si nécessaire, ancienne migration intacte. Anciennes tentatives restent consultables. Pas d’activation massive du contenu : étape4 génère80activités et migration de contenu.
- La transition peut conserver le cheminv1 jusqu’à conversion complète, mais documenter précisément les restes pour suppression étape6. Aucun faux résultat ni XP simulé.

## Validation et rapport

Tests significatifs : format API, stale409, refuschampsforgés, clésnonexposées, étape sans XP ni complétion, finalprojetrevérification, RLS propriétaire, sauvegarde/reprise, réponse invalide et double XP. Réutiliser PGlite et tests purs; ne pas utiliser le cloud. Lint/typecheck/tests couvrant modifications. Écrire docs/plans/step-03-report.md avec fichiers, contrats API/RPC, tests réels, points restant étape4/6/7. Retour bref.
