# Étape 2 — Contrat versionné et exemple pédagogique mvp-004

## Contraintes

Lire AGENTS.md, le plan accepté et les sources existantes. Travailler dans ce checkout, sans worktree, Docker, secret affiché, push ou déploiement. Ne pas déléguer ni committer : le contrôleur vérifie et committe. Lire les guides Next locaux pertinents avant toute modification Next. Les étapes suivantes consommeront les interfaces créées ici.

## Livrables

1. Créer un modèle Zod/TypeScript public de théorie structurée et d'interactions et un modèle auteur séparant strictement public et correction. Blocs : heading, paragraph avec segments text/strong/code, code avec langage et sortie facultative, liste, note. Aucun HTML arbitraire. Familles : choice (single/multiple), matching, classify, ordering, blanks (options ou petite réponse nombre/mot), trace (cellules ciblées), debug (ligne + remplacement). Un projet compose des étapes de ces interactions, pas un runtime spécifique.
2. Créer un correcteur pur partagé côté serveur : vérifier définitions, IDs autorisés, champs requis, unicité/cardinalité et taille des réponses; comparer aux clés privées. Pas eval/Function/QuickJS/shell ni exécution de code. Accepter explicitement les variantes autorisées (ordres équivalents, réponses courtes), jamais un faux positif sur réponse manquante ou IDs inconnus. Tests Vitest positifs/négatifs pour chacune des sept familles; les projets composent ces familles.
3. Créer un rendu TheoryContent réutilisable, sûr et accessible avec hiérarchie/strong/inline-code/code-output, responsive et dans le style existant. Ne pas modifier encore tout le routage : étape3 intégrera le moteur.
4. Fournir un pilote original mvp-004 dans curriculum/pilot-mvp-004.json : expliquer variables, nom/valeur, const prénom sans réaffectation, let score évolutif; exemples top-level simples et résultat; mots expliqués; choix contextualisés + trace courte; ne pas introduire objets, références, fonctions ou return. La syntaxe const vs let ne doit pas être une question ambiguë : préciser l'intention de réaffecter. Cette fixture sera remplacée par le corpus complet à l'étape4.
5. Préparer une NOUVELLE migration additive de modèle, sans toucher à l'initiale ni aux utilisateurs distants : versions liées à lessons, définitions publiques des interactions, clés privées sans SELECT authenticated/anon, brouillon structuré versionné dans user_progress, version de contenu sur les tentatives. Préserver anciennes tentatives/XP/completions et les colonnes historiques nécessaires. Les fonctions actuelles restent compatibles jusqu'à étape3. Chaque nouvelle table doit avoir RLS et droits explicites, corrections service_role seulement. Prévoir projets et étapes côté DB : pas de XP pour validation d'une étape. L'activation finale/RPC sera étape3. Ne pas répliquer des clés privées dans un JSON de leçon public.
6. Ajouter tests modèle/pilote/grading et tests PGlite ciblés de migration/RLS/préservation avec l'infrastructure locale existante. Les tests existants doivent rester fonctionnels; pas de contact Supabase hébergé.

## Choix d'intégration

- lessons reste l'identité stable; lesson_versions contient les blocs publics d'une version; les définitions de questions et leurs corrections sont rattachées à la version. Le seed des80 sera étape4.
- Les réponses d'API seront answers par questionID + version. L'étape3 adaptera les routes; fournir des types sans réponses correctes dans le DTO public.
- Une version périmée doit pouvoir être détectée avant création de tentative et répondre409 à l'étape3.
- Conserver les migrations historiques : aucun DROP d'historique, reset ou renumérotation d'IDs.
- Ne pas retirer encore runner/dépendances (étape6).

## Rapport

Écrire docs/plans/step-02-report.md avec fichiers touchés, interfaces exactes pour l'étape3, commandes/tests exécutés et résultats réels, limites éventuelles. Retourner un résumé court. Ne pas marquer les autres étapes terminées.
