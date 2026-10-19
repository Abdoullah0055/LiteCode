# Contenu et provenance

## Corpus actif

Le curriculum actif est la version 2 de `curriculum/original.fr.json` : 80 activités en français, réparties en 10 modules de 8. Les IDs `mvp-001` à `mvp-080`, l’ordre, les prérequis et les XP historiques sont conservés. Le corpus comprend 70 exercices et 10 projets guidés : `mvp-008`, `016`, `024`, `032`, `040`, `048`, `056`, `064`, `072` et `080`.

Les leçons présentent une notion, un exemple et son résultat. Les exercices font reconnaître, appliquer ou tracer une règle. Les projets réutilisent plusieurs interactions sans demander un programme complet. Les sept interactions évaluées sont :

| Interaction | Travail demandé |
|---|---|
| Choix simple ou multiple | Sélectionner une ou plusieurs réponses |
| Association | Relier des éléments de deux listes |
| Classement | Répartir les éléments dans des catégories |
| Ordre | Remettre des étapes dans l’ordre |
| Texte à trous | Compléter des valeurs ou extraits balisés |
| Trace | Suivre les valeurs d’un exemple étape par étape |
| Débogage guidé | Choisir une ligne et un remplacement proposés |

Un projet guidé combine ces interactions en étapes, dans un ordre déterminé. Il ne s’agit pas d’une huitième famille de saisie indépendante. Aucune activité ne demande d’écrire ou lancer du code libre. Les extraits JavaScript sont affichés comme texte. Les notions de Git et HTTP s’étudient par interprétation; aucune commande shell ni requête réseau arbitraire n’est exécutée.

Chaque activité possède deux indices progressifs. Ses définitions publiques sont séparées des clés de correction privées. La version du contenu accompagne les réponses et les brouillons; après publication d’une nouvelle version, une réponse basée sur une ancienne version doit être rechargée. L’historique garde les résultats enregistrés tels quels et ne regrade pas les anciennes tentatives.

Les sources d’auteur vivent sous `curriculum/authoring/`. `curriculum/original.fr.json` est la sortie canonique utilisée pour bâtir `supabase/seed.sql` et `supabase/migrations/20261019022914_learning_curriculum_v2.sql` :

```powershell
npm run curriculum:author
npm run curriculum:build
```

La compilation est déterministe. La migration de contenu est additive et garde les anciennes tentatives, complétions et XP. Pour le déploiement, appliquer d’abord les migrations du schéma dans l’ordre, puis la migration v2; le seed reproductible est appliqué après les migrations. Les validations PGlite locales ne prouvent pas que ces fichiers ont été appliqués à une base hébergée.

## Crédits et changements

Les fichiers transmis comme références initiales sont préservés dans `references/`. Le catalogue fourni sert de repère thématique; il ne fournit pas de corps de leçon, de tests portables ou de solutions à réutiliser. Le code fourni demande un matériel original. Aucun corps de leçon, assertion, vidéo ou solution de freeCodeCamp n’a été importé.

Pour chaque activité, les métadonnées de source et de droits sont conservées dans le curriculum canonique et sa projection en base : licence interne, attribution, URL de référence, prérequis et modifications apportées. Les URL de référence restent aussi dans les données qui soutiennent le classement thématique. Cette licence interne décrit la provenance du contenu écrit pour LiteCode; elle n’accorde pas de licence sur les sources tierces et ne déclare pas le projet open source. Les crédits consultables sont regroupés dans « Sources et crédits » dans les paramètres.

Les modifications au contenu doivent être faites dans les sources d’auteur, pas directement dans le seed généré. Avant de publier un changement, revoir le JSON canonique, le seed et la migration générés, vérifier la version du curriculum et conserver les données historiques. Les versions déjà publiées sont immuables : une évolution du contenu s’enregistre sous une nouvelle version. Le rapport [IMPLEMENTATION_REPORT.md](../IMPLEMENTATION_REPORT.md) distingue les contrôles locaux effectués des opérations de mise en service restantes.
