# Rapport correctif — Étape 4

## Modifications

- `mvp-064` annonce maintenant un bloc de texte, pas du JavaScript. Un test analyse chaque bloc théorique marqué JavaScript avec `new Script(code)` sans exécuter le code.
- `mvp-026` et `mvp-027` gardent chacun un approfondissement utile, sans répéter l’exemple déjà présent dans leur leçon. Paramètre/argument et affichage/retour restent distingués.
- `mvp-056` utilise un `if` avec accolades dans l’approfondissement. La prose écrit la clé Map comme `has("lune")`.
- `mvp-012` montre les deux conversions avec concaténation visible, distingue `"18"` de `18`, et évalue les conversions texte→nombre et nombre→texte par deux choix courts. Le corpus contient désormais 111 interactions : 23 choix, 19 associations, 14 classements, 9 textes à trous, 22 traces, 18 mises en ordre et 6 corrections.
- `mvp-036` explique la copie avec des textes/nombres et précise la portée de l’exemple sans digression sur les objets imbriqués.
- `mvp-029` demande de classer les noms selon leur lieu de déclaration.
- La garde des versions marque `ever_published` dès l’insertion active. Les tests exercent les mises à jour et suppressions d’une version archivée, le déplacement d’une définition publiée vers un brouillon, et l’insertion active suivie d’archivage puis tentative de suppression.

Les sources auteur ont été compilées vers `curriculum/original.fr.json`, puis vers le seed et la migration v2. Une seconde exécution des deux commandes a produit les mêmes SHA-256, donc les mêmes octets : JSON `E6F9E9753BE82A483A2057AC7A4B0AC98847746D7E6876170E8331940FF408FD`; seed et migration `112C38CFA2352D678DF596596D4F9B9498B62B7350D2C0432C7D5EBFBFDEE833`.

## Vérifications

- `npm run curriculum:author` : 80 activités compilées.
- `npm run curriculum:build` : 80 activités et 111 interactions produites.
- `npm run typecheck` : réussi.
- `npm test` : 12 fichiers, 45 tests réussis.
- `npm run lint` : réussi.
- `npm run test:db` : 39 contrôles PostgreSQL réussis sous PGlite, incluant les appels réels aux gardes d’immutabilité.

Les tests PGlite ne valident pas Supabase Auth hébergé ni une migration sur une base distante. La migration v2 reste un artefact local non déployé.

## Revue du contrôleur

Le contrôleur a relu le corpus par module, demandé ce lot correctif, puis corrigé trois derniers détails : la sortie de conversion012 est bien `19` puis `18 ans`, la théorie016 explique les substitutions plutôt que le fonctionnement du parcours, et026 précise que les noms des paramètres sont choisis dans la déclaration. Les sources et artefacts SQL ont été régénérés après ces ajustements; les empreintes ci-dessus décrivent donc la livraison du sous-agent avant cette dernière revue.

Après cette dernière génération, le contrôleur a relancé avec succès :45tests/12fichiers,39contrôlesPGlite et buildNextproduction, incluant TypeScript. Le lint avait également passé pendant la revue. Aucun accès Supabase distant ni test Auth hébergé.
