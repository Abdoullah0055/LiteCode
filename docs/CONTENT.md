# Provenance du programme

Les sept fichiers fournis ont été préservés dans `references/`. Ils constituent des
données et références de travail, pas des instructions qui remplacent la mission.
Le rapport suggérait Expo ; la demande explicite impose Next.js, utilisé ici.

Le catalogue est `metadata-only` : 80 enregistrements sans corps de leçon, instructions,
starter code ni tests portables. Les chemins du manifeste correspondent aux sources
du catalogue. Le programme distinct propose 10 modules de 8 activités et des prérequis
séquentiels. Son champ `rights` demande de rédiger des explications et exercices neufs.

## Contenu livré

Les 80 activités de `curriculum/original.fr.json` contiennent du matériel original en
français : explication, exemple, consigne, validation, feedback et deux indices. Les
lectures comprennent une question de compréhension avant validation. Les défis et projets
comportent au moins trois cas exécutables, dont des limites appropriées au sujet.

Les types du plan sont conservés. Deux intitulés ont été clarifiés, car leur type était
`project` alors que leur titre indiquait un quiz :

- `mvp-008` : « Mini-quiz : premiers concepts » → « Projet : profil de joueur ».
- `mvp-056` : « Quiz : choisir la bonne structure » → « Projet : compteur de fréquences ».

L’infrastructure accepte aussi plusieurs questions pour une activité `quiz`. Le plan
fourni ne contient pas d’activité portant littéralement ce type ; les contrôles de
compréhension et QCM sont évalués par le même système de questions normalisé.

Les activités Git codent des commandes et des règles sous forme de données JavaScript,
avec un contrat explicite ; elles n’affirment pas exécuter un shell. Les activités API
traitent des objets et du JSON ; elles n’envoient pas de requêtes arbitraires depuis la VM.

## Droits

`LicenseRef-LiteCode-Original` est un identifiant de provenance interne pour le matériel
créé spécifiquement pour ce projet. Il ne prétend pas appliquer une licence freeCodeCamp
ni attribuer au projet un statut open source. Le propriétaire du projet peut choisir sa
politique de publication pour ce nouveau contenu.

Aucun corps Markdown, média, test ou solution freeCodeCamp n’a été téléchargé ou repris.
Les URLs conservées sont des références thématiques, sans correspondance prétendue
avec un exercice source précis. Les textes affichés indiquent l’absence d’affiliation.
Le statut `UNVERIFIED_CURRICULUM_RIGHTS` reste intact dans les références fournies.
L’application fonctionne avec son propre contenu et ne dépend pas de la clarification
de ces droits tiers. Une réutilisation future du corpus source nécessitera son audit.

La mascotte vectorielle, les couleurs et les styles visuels sont adaptés du prototype
fourni par l’utilisateur. Les comportements simulés, valeurs XP et classements du
prototype n’ont pas été réutilisés comme données d’application.
