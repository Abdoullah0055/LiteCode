# Rapport d'analyse — contenu pédagogique pour application mobile

**Inspection :** 16 octobre 2026, révision source `2557ee7935f64d90dd72bf53837fb05cd928f136` (branche `main`).  
**Objectif :** catalogue de programmation pour étudiants en Software Engineering, avec progression originale, pas de copie visuelle ni de marque freeCodeCamp.

## 1. Périmètre et observations vérifiées

Le dépôt contient `curriculum/structure/curriculum.json`, `curriculum/structure/superblocks/*.json`, `curriculum/structure/blocks/*.json`, `curriculum/challenges/english/certifications/*.yml` et `curriculum/challenges/english/blocks/<nom>/*.md`.

- `curriculum.json` répertorie les superblocks et certifications (ordre global).
- `superblocks/javascript-v9.json` contient chapitres, modules et blocs JavaScript. `superblocks/python-v9.json` fait de même pour Python. `superblocks/back-end-development-and-apis-v9.json` détaille Node, HTTP, Express, etc.
- `superblocks/full-stack-developer-v9.json` comporte un chapitre d'examen `comingSoon: true` : ce n'est **pas** un cours à importer pour un MVP.
- Les anciens parcours `javascript-algorithms-and-data-structures` et `javascript-algorithms-and-data-structures-22` restent présents. Le fichier `superblocks/javascript-algorithms-and-data-structures-v8.json` **n'existe pas** dans la structure actuelle, même si le YAML de **certification** v8 existe.
- `structure/blocks/<nom>.json` fournit `challengeOrder` avec IDs et titres ; les fichiers Markdown correspondants peuvent s'appeler `<id>.md` **ou** `<slug>-video.md`. Il ne faut pas supposer `<id>.md` pour les vidéos.
- `client/i18n/locales/english/intro.json` décrit titres de navigation et introductions ; ce contenu a été identifié mais non intégré par défaut.

### Six fichiers de certifications étudiés

1. `javascript-v9.yml` : examen de certification JavaScript (une exigence d'examen dans `tests`).
2. `javascript-algorithms-and-data-structures-v8.yml` : **cinq projets** de certification, dont Palindrome Checker, Roman Numeral Converter, Telephone Number Validator, Cash Register et RPG Creature Search App ; ancien parcours à ne pas confondre avec v9.
3. `python-v9.yml` : examen Python.
4. `full-stack-developer-v9.yml` : examen full-stack ; parcours exam en attente dans la structure inspectée.
5. `relational-databases-v9.yml` : examen bases de données.
6. `back-end-development-and-apis-v9.yml` : examen backend/API.

**Ces YAML décrivent surtout les certificats et leurs exigences, pas les leçons ou les questionnaires.** Le contenu détaillé est dans les `blocks` Markdown. Le `manifest` les identifie, mais n'essaie pas d'en déduire une progression pédagogique.

### Les 20 blocs demandés : inventaire réel et décision

| Bloc | Défis/fichiers structurés | Décision | Justification |
|---|---:|---|---|
| `basic-javascript` | 113 | Reporter | Parcours ancien ; préférer leçons v9 |
| `quiz-javascript-fundamentals` | 1 | Retenir | Quiz d'environ 20 questions à convertir en QCM individuels |
| `introduction-to-arrays` | 4 | Retenir | Théorie moderne, fichiers vidéo |
| `data-structures` | 46 | Reporter | Exercices legacy avancés ; besoin moteur JS de tests |
| `basic-algorithm-scripting` | 16 | Reporter pour extension LeetCode | Courts exercices utiles, mais hérités du parcours ancien |
| `intermediate-algorithm-scripting` | 21 | Reporter | Trop avancé pour premières leçons |
| `algorithms` | 10 | Reporter | Algorithmes anciens, adaptation/évaluation à préparer |
| `quiz-data-structures-js` | 1 | Retenir | Questionnaire moderne, Big O, stack, tableaux, etc. |
| `quiz-dynamic-programming-js` | 1 | Retenir tardivement | Sujet avancé, pas en début de parcours |
| `introduction-to-linked-lists` | 5 | Retenir | Sujets transversaux ; vidéos |
| `basic-node-and-express` | 12 | Reporter | Exercices serveur hérités ; moteur de runtime requis |
| `advanced-node-and-express` | 22 | Exclure MVP | Auth, sessions, Passport, trop lourd sur mobile |
| `mongodb-and-mongoose` | 12 | Exclure MVP | Service DB dépendant du backend |
| `quality-assurance-and-testing-with-chai` | 25 | Reporter | Dépendances de test et environnement à isoler |
| `python-setup-first-steps` | 3 | Reporter | Second langage, après validation du MVP JS |
| `core-primitives-in-python` | 5 | Reporter | Second langage |
| `control-flow-and-functions-in-python` | 5 | Reporter | Second langage |
| `object-oriented-programming-with-python` | 5 | Reporter | Second langage, utile ensuite pour classes/POO |
| `lecture-introduction-to-git-and-github` | 9 | Retenir (5) | Versioning, concepts généraux |
| `lecture-working-with-code-reviews-branching-deployment-and-ci-cd` | 7 | Retenir (4) | Code review, déploiement, Git |

Le fichier `inventory.requested.json` contient les **URLs exactes des métadonnées** pour chaque bloc. Les dossiers et décomptes ont été vérifiés dans `structure/blocks/`. Cela **n'affirme pas** que tous les corps Markdown ont été lus intégralement : l'étude a inspecté en profondeur des formats représentatifs.

## 2. Sélection MVP documentée (80 entrées source)

La sélection ajoute les **blocs v9 récents** que l'on trouve dans `javascript-v9.json`, plutôt que de recopier un ancien parcours. Elle retient 24 blocs au total ; voir `manifest.selection.json` (quotas par bloc) et `manifest.selected.snapshot.json` (**80 IDs et chemins sources épinglés à un commit**). Les sources retenues se répartissent principalement entre :

- **JavaScript débutant :** introduction, valeurs/types, chaînes, nombres, conditions, fonctions, tableaux, boucles.
- **Exercices progressifs :** premières étapes des workshops Greeting Bot et String Inspector.
- **Révision :** quiz des variables, des conditions, des fondamentaux, structures de données et programmation dynamique.
- **Informatique générale :** structures de données, arrays et linked lists.
- **Software Engineering :** HTTP, Git, code reviews, CI/CD.

**Attention :** 80 entrées freeCodeCamp ≠ 80 exercices de saisie de code. Une partie sont des leçons théoriques et plusieurs quizzes regroupent 20 QCM en un fichier. Le parcours mobile **distinct**, de 80 micro-activités originales, est fourni dans `mvp_80_lessons.json`.

### Les doublons et le choix de versions

- `basic-javascript` (ancien) et les nouveaux blocs `javascript-v9` enseignent les mêmes fondements. **Choix : v9** pour les premiers modules, car structure par leçons, reviews, quiz et workshops plus adaptée.
- `data-structures` (ancien) et les nouveaux `lecture-working-with-common-data-structures`, `introduction-to-arrays`, `introduction-to-linked-lists` couvrent des concepts proches. **Choix : nouvelles leçons** pour l'explication et les QCM, anciens problèmes comme réserve technique.
- `basic-algorithm-scripting`, `intermediate-algorithm-scripting` et `algorithms` n'ont **pas** tous un équivalent un-pour-un dans v9. Les exclure automatiquement comme « doublons textuels » serait incorrect. Ils nécessitent un audit complémentaire avant intégration LeetCode.
- `javascript-algorithms-and-data-structures-v8.yml` est un **certificat/projets**, pas un remplaçant de `javascript-v9.yml` ; ne pas faire de déduplication aveugle par nom.

Ce classement est une **déduplication par concepts et versions**, pas une comparaison exhaustive de similarité textuelle de chaque `.md`.

## 3. Champs étudiés et règles de transformation

Les défis Markdown comportent un frontmatter (`id`, `title`, `challengeType`, `dashedName`) suivi de sections telles que `# --description--`, `# --instructions--`, `# --hints--`, `# --seed--`, `# --solutions--`, `# --quizzes--` et `# --questions--`.

| Champ source | Destination mobile | Précaution |
|---|---|---|
| `challengeOrder` de `blocks/*.json` | ID, titre, ordre, prérequis séquentiel local | Pas de prérequis sémantiques déduits automatiquement |
| `description` | `lessonContent` | Seulement pour source autorisée |
| `instructions` | `instructions` | Réécriture mobile généralement nécessaire |
| `seed` / `seed-contents` | `starterCode` | S'assurer que le compilateur/runtime du mobile supporte ce code |
| `hints` | `tests[]` dans les défis JS | **Ce sont souvent des assertions, pas des conseils pédagogiques** |
| `quizzes` | `multipleChoice[]` | Parser `text` / `distractors` / `answer`, revoir éditorialement |
| `questions` | signalement à conversion manuelle | QCM de lectures structurés autrement, avec feedback |
| `solutions` | **jamais publiées automatiquement** | Éviter de révéler les réponses |
| vidéos, médias et URL externes | flag `VIDEO_MEDIA_AND_TRANSCRIPT_RIGHTS_REVIEW` ou `EXTERNAL_MEDIA_RIGHTS_REVIEW` | Ne pas copier de fichiers externes automatiquement |
| type, difficulté, durée, XP | métadonnées app | Durée et XP **estimés/créés par nous**, non donnés par FCC |

Le schéma `schemas/lesson.schema.json` couvre `course`, `module`, `lesson`, `coding_challenge`, `multiple_choice`, `quiz`, `fill_in_the_blank`, `debugging_exercise`, `project`, `hint`, `explanation`, `test_case`, `prerequisite`, `difficulty`, `estimated_duration`, `XP`, `tags`, `source_file`, `license`, `attribution`, `modification_notes`. Les types `fill_in_the_blank` et `debugging_exercise` sont **supportés par le schéma**, mais ne sont **pas inventés automatiquement** à partir de textes non adéquats.

## 4. Problèmes et adaptations mobiles

- Les petits ateliers `workshop-*` sont découpés en étapes qui partagent un état de projet. Sur mobile, il faut conserver le code entre étapes et les dépendances de contexte.
- Les projets à fichiers multiples, serveur Node/Express, MongoDB, CSS/browser et projets à environnement complet ne sont pas adaptés à un simple éditeur de code sur téléphone.
- Les tests FCC reposent parfois sur `assert`, `__helpers`, état DOM, backend et autres outils FCC. Ce sont des **chaînes de texte à auditer** : ne jamais les exécuter directement sur l'appareil ni donner accès aux secrets du serveur.
- Les vidéos ont des noms de fichier descriptifs. Deux exemples exigent une table de correspondance vérifiée : `array-search-insert-delete-video.md`, `what-is-linked-list-video.md`.
- Les quizzes modernes `challengeType: 8` sont convertibles en QCM, mais il faut mélanger les réponses et confirmer bonne réponse et feedback ; les lectures `challengeType: 19` utilisent un autre format `--questions--`.
- Il faut revoir les prérequis exacts, la difficulté pédagogique, la durée, les exemples, les droits des ressources tierces et la validité des tests après transformation.
- **L'anglais est la source.** Toute version française doit être étiquetée « traduction/adaptation » et relue par un humain ; l'extracteur ne prétend pas avoir traduit le contenu.

## 5. Licences : point bloquant pour la publication

Le `LICENSE.md` racine vérifié est BSD-3-Clause **pour le code logiciel**. Le README actuel mentionne le copyright de freeCodeCamp sur les ressources `curriculum/`, **sans présenter dans son état inspecté la licence CC BY-SA 4.0 comme licence applicable aux contenus présents**. Le fichier historique `curriculum/LICENSE.md`, précédemment cité sur le forum freeCodeCamp pour CC BY-SA 4.0, est **absent** de l'arborescence actuelle. Les écrits anciens et la communication historique de freeCodeCamp indiquaient bien CC BY-SA 4.0 pour le cursus de l'époque. L'applicabilité à **chaque fichier / version courante** est donc **à confirmer**.

**À vérifier avant toute republication :** licence de la version source précise ; contributions ou sous-licences tierces ; droits des vidéos/images/extraits ; crédit auteurs et liens ; indication des adaptations/traductions ; obligations de repartage CC BY-SA des matériaux adaptés ; interdiction de suggérer une approbation/affiliation ; conditions spécifiques si application payante ; consultation juridique si l'activité devient commerciale.

Chaque entrée porte par défaut `license: UNVERIFIED_CURRICULUM_RIGHTS`, `redistributionApproved: false`, `editorialFlags` et un URL épinglé à un commit. Ne remplacez **pas** cela par `BSD-3-Clause` pour du contenu éducatif. La licence CC BY-SA permet historiquement des usages commerciaux **sous conditions** quand elle s'applique, mais ne résout pas automatiquement le cas du snapshot actuel.

## 6. Proposition technique d'application mobile

- **Client :** React Native + Expo/TypeScript, interface originale, cartes de leçons et sessions courtes (3 à 8 minutes), éditeur limité à quelques lignes de code.
- **Données :** import des métadonnées source dans une table catalogue, contenus originaux validés dans la base de contenu, versions du programme et statuts de licence distincts.
- **Interactions :** QCM, compléter une ligne, prédire la sortie, trouver un bug, écrire une fonction courte, projet court.
- **Évaluation :** quiz et corrections simples hors ligne ; pour les défis de code, serveur d'exécution isolé avec CPU/mémoire/timeout et tests portés **manuellement**, pas d'exécution arbitraire des tests FCC sur le client ou sur le serveur principal.
- **Progression :** prérequis explicites, XP, révisions espacées, feedback rapide, niveaux et profils. Les XP dans les fichiers ne sont que des propositions de l'app.
- **Séparation droits :** conserver une table `content_source` avec SHA, licence, attribution, obligations, review date et transformations ; si le droit n'est pas confirmé, utiliser des **contenus entièrement originaux**.

## 7. Parcours MVP original : 80 activités

Le fichier `mvp_80_lessons.json` décrit 10 modules de 8 activités :

1. Les bases de JavaScript (8)
2. Chaînes de caractères et nombres (8)
3. Conditions et booléens (8)
4. Fonctions (8)
5. Tableaux (8)
6. Boucles et itérations (8)
7. Structures de données (8)
8. Algorithmes et entretiens (8)
9. Git et travail d'équipe (8)
10. Web, HTTP et APIs (8)

Chaque activité contient `id`, `type`, `title`, `difficulty`, `duration`, `xp`, `prerequisites` et une **référence thématique** à un bloc, sans prétendre avoir repris son texte ou son code. Les contenus « CORS » et certains exercices algorithmiques sont **de nouvelles propositions** : aucune équivalence fichier source FCC précise n'a été vérifiée.

## 8. Tests et limites

**9 tests unitaires exécutés et réussis** sur fixtures synthétiques : Markdown/frontmatter, sections, quiz, mapping de vidéos, refus des imports sans droits, extraction de tests comme texte, masquage des solutions, IDs incohérents et import read-only.

**Pas de test réseau de bout en bout** dans ce conteneur (accès Internet non disponible). Les fichiers Markdown des 80 activités sélectionnées n'ont donc **pas été copiés ni traités en masse** ; les **80 IDs et chemins sources** sont fondés sur la lecture connectée des métadonnées GitHub et des listings de dossier. L'importation des corps et l'audit éditorial intégral restent à réaliser *uniquement après validation des licences applicables*.

### Références principales

- Code source : https://github.com/freeCodeCamp/freeCodeCamp
- Commit examiné : https://github.com/freeCodeCamp/freeCodeCamp/commit/2557ee7935f64d90dd72bf53837fb05cd928f136
- README / mentions de licence : https://github.com/freeCodeCamp/freeCodeCamp/blob/main/README.md
- Licence du code : https://github.com/freeCodeCamp/freeCodeCamp/blob/main/LICENSE.md
- Structure curriculum : https://contribute.freecodecamp.org/curriculum-file-structure/
- Explication historique des licences : https://www.freecodecamp.org/news/building-a-data-science-curriculum-with-advanced-math-and-machine-learning
- Discussion historique de licence des cours : https://forum.freecodecamp.org/t/id-like-to-ask-for-permission-to-use-your-materials/503349
