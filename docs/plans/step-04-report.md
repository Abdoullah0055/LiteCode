# Rapport — Étape 4 : curriculum v2

Le corpus canonique `curriculum/original.fr.json` contient maintenant 80 activités originales en français, réparties en 10 modules de 8. Les 80 IDs, leur ordre et leurs XP historiques sont conservés. Il y a 70 exercices et 10 projets (008, 016, 024, 032, 040, 048, 056, 064, 072 et 080). Le pilote 004 a été intégré comme activité normale, puis sa fixture isolée a été retirée.

Les activités contiennent 110 interactions évaluées côté serveur : 22 choix, 19 associations, 14 classements, 9 textes à trous, 22 traces, 18 mises en ordre et 6 corrections de code. Chaque activité a deux indices progressifs rédigés pour son sujet. Les explications et exemples sont écrits par module; des blocs d’approfondissement sont ajoutés pour les sujets plus délicats. Le contenu Git/HTTP reste interprétatif : aucun shell ni appel réseau arbitraire n’est demandé.

## Génération et déploiement de données

`curriculum/authoring/` est la source auteur. `curriculum/original.fr.json` est la source canonique versionnée 2. Pour la régénérer et produire les deux artefacts SQL déterministes :

```powershell
npm run curriculum:author
npm run curriculum:build
```

Le générateur écrit `supabase/seed.sql` et `supabase/migrations/20261019022914_learning_curriculum_v2.sql`. Appliquer toutes les migrations dans leur ordre, puis le seed pour une nouvelle base. Sur une base existante, appliquer la migration de contenu après les migrations précédentes; le seed peut ensuite être rejoué. Ne pas appliquer le seed avant les migrations. Le SQL restaure aussi les quatre badges historiques.

La version publique 2 et ses définitions, corrigés privés et étapes de projet sont insérés sous IDs normalisés; l’activation se fait après leur insertion. Le seed est idempotent si le contenu est identique. Le générateur refuse une différence de contenu, de définition ou de corrigé sous la version 2. Des gardes SQL rendent les versions publiées immuables, même après archivage, et empêchent aussi de déplacer une définition publiée vers une version brouillon.

## Vérifications exécutées

- `npm run curriculum:author` : 80 activités compilées.
- `npm run curriculum:build` : 80 activités et 110 interactions; seed et migration produits.
- `npx tsc --noEmit` : réussi.
- `npm test` : 12 fichiers et 44 tests réussis, dont le grading correct/incorrect des 110 interactions.
- `npm run lint` : réussi.
- `npm run test:db` : 34 checks PostgreSQL réussis sous PGlite, dont seed frais, upgrade depuis la fixture SQL v1, préservation progression/XP/complétions/tentatives, RLS public/privé, rejeu seed et immutabilité publiée.

La fixture `tests/fixtures/seed-v1.sql` est volontairement limitée à la simulation des anciennes données; le seed v2 ne sert pas de faux point de départ pour les tests d’upgrade. Les tests PGlite ne valident ni Supabase Auth hébergé ni une migration sur une base distante. Auth, onboarding, runner et revue étape 5+ ne sont pas déclarés terminés ici.
