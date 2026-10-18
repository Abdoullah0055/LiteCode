# LiteCode — Rapport de livraison

## Statut

**Implémentation locale livrée ; recette Supabase de bout en bout non validée.**
Le MVP ne peut pas être déclaré entièrement terminé au sens de la Definition of Done
tant que les comptes et parcours authentifiés n’ont pas été exécutés sur Supabase.
Les variables de `.env.local` et `.env.example` restent vides, comme demandé.
Aucun projet distant ni dépôt freeCodeCamp n’a été modifié.

## Ce qui est implémenté

| Écran | Route / interaction |
|---|---|
| Bienvenue | `/` |
| Objectifs | `/onboarding/objectives` |
| Langages | `/onboarding/languages` ; JavaScript disponible, autres explicitement à venir |
| Accueil | `/home`, reprise du premier exercice incomplet, XP et série stockés |
| Parcours | `/path`, 10 modules, 80 étapes et prérequis |
| Explication | `/lesson/[id]`, texte original, exemple et consigne |
| Éditeur | `/exercise/[id]`, coloration, brouillon persistant, exécution réelle |
| Résultat | `/result/[id]`, tentative appartenant à l’utilisateur et XP effectivement attribué |
| QCM / quiz | `/exercise/[id]`, questions et options dynamiques, correction serveur |
| Texte à trous | `/exercise/[id]`, sélection et validation côté serveur |
| Debugging | `/exercise/[id]`, code erroné à réparer, tests exécutés |
| Indices | dialogue accessible et `/hints/[id]`, révélation et restauration persistantes |
| Projet guidé | `/projects` puis `/exercise/[id]`, étapes vérifiées par les cas de test |
| Profil | `/profile`, statistiques et badges issus de la base |
| Classement | `/leaderboard`, agrégat SQL réel, semaine UTC ou global, participation facultative |
| Paramètres | `/settings`, objectif, durée cible, thème, son, classement, nom, mot de passe, déconnexion |

Composants React séparés, pages serveur, cookies SSR Supabase, Zod, états vides/erreurs,
zones de sécurité iPhone, actions tactiles et manifeste d’installation avec icônes.
Le style et la mascotte proviennent du prototype fourni ; les valeurs et interactions
simulées du prototype ne servent jamais de données utilisateur.

Les 80 activités ont des explications, consignes, exemples et indices originaux en
français. Les lectures imposent une question de compréhension. Les 30 défis de code,
debugging et projets possèdent des corrigés de référence et au moins trois tests chacun.
Les tests et bonnes réponses sont dans des tables sans accès utilisateur.
Les références thématiques et adaptations sont suivies ; aucun corps freeCodeCamp importé.

Le schéma contient toutes les tables demandées, plus `question_keys` pour séparer les
corrections. Toutes les tables publiques ont RLS. Les RPC de tentative, récompense et
classement sont réservées au service role. Les clés serveur n’entrent pas dans les
composants client. Les écritures sensibles vérifient la session et les prérequis.

L’exécution utilise un service séparé avec QuickJS WASM, sans APIs hôte, et des limites
de heap, pile, temps, taille et concurrence. L’apprenant ne décide jamais de la réussite.
Les XP, progression, série et badges sont traités transactionnellement en PostgreSQL.

## Vérifié localement

| Vérification | Résultat |
|---|---|
| TypeScript strict | Passe |
| ESLint | Passe, sans avertissement de code |
| Vitest | **14 tests passent** |
| PostgreSQL PGlite | **27 vérifications passent**, migration et seed réels |
| Playwright, 375 / 390 / 430 px | **12 passent ; 3 live non exécutés**, configuration requise |
| Build Next.js production | Passe |
| Audit npm | **0 vulnérabilité** au contrôle de livraison |

Les tests Vitest exécutent réellement les solutions de référence contre les tests
des 30 activités de code, puis vérifient qu’une solution vide échoue. Ils couvrent aussi
les types de résultats, les limites, l’absence de réseau/Node, l’authentification HTTP
du service, les prérequis, la correction de réponses et la sérialisation des brouillons.

PostgreSQL vérifie les autorisations anon/authenticated/service_role, l’isolation entre
comptes, l’inaccessibilité des corrections, les refus d’écriture directe, les activités
verrouillées, les reprises sans double XP, la progression persistante, les badges,
les séries UTC, le classement et le maintien des données après réapplication du seed.
PGlite n’est pas un test du service Supabase Auth ou du transport PostgREST.

Les tests navigateur couvrent l’accueil, les deux étapes d’onboarding, les formulaires
d’authentification, la récupération, le manifeste, les icônes, les routes protégées sans
configuration et le refus d’origine étrangère. Les captures accueil/objectifs/langages
ont été inspectées et comparées au HTML fourni. La comparaison des pages authentifiées
avec leurs données réelles reste à faire après configuration.

La revue indépendante a identifié deux défauts corrigés et couverts par régression :
ordre des sauvegardes de code et contrôle de non-mutation des entrées de `mvp-036`.

## Non vérifié / blocages externes

1. **Supabase non configuré** : pas de validation réelle de l’inscription, du courriel,
   de la récupération, du rafraîchissement de session ou de PostgREST. Les tests live
   sont fournis, mais leurs trois déclinaisons iPhone sont explicitement désactivées
   tant que `LITECODE_E2E_LIVE=1`, la référence du projet de test hébergé et les
   variables de connexion ne sont pas configurés.
2. **Runner distant non configuré** : le moteur et le service HTTP ont été exécutés
   et testés en processus séparés sous Node. Le processus Node.js de production et
   les restrictions système restent à vérifier sur l’hôte choisi.
3. **Appareil iOS physique et déploiement** : clavier natif, installation PWA, zones
   de sécurité matérielles et réseau de production non testés. Les tests réalisés
   utilisent Chromium avec dimensions et interactions tactiles mobiles.

Pour lever ces blocages : suivre README.md, appliquer migration et seed sur Supabase,
configurer les cinq variables, lancer le runner, reconstruire Next.js, puis exécuter
la suite live sur un projet Supabase hébergé dédié aux tests. Aucun secret n’est requis dans Git.

## Limites explicites du MVP

- JavaScript synchrone seulement ; aucun environnement Python, SQL, Node ou DOM.
- Projets guidés de fonctions et de données, pas d’application navigateur multi-fichier.
- Pas de notifications push ni de cache hors ligne des données privées.
- Objectif quotidien exprimé en minutes préférées ; pas de faux suivi de temps effectif.
- Les tests établissent une réussite sur leurs cas ; pas de certification formelle ou
  d’anti-triche avancée. Voir docs/EXECUTION.md pour la frontière de sécurité.
- Les droits des contenus freeCodeCamp restent non vérifiés, mais leur republication
  n’est pas nécessaire au fonctionnement : le programme livré est original.
