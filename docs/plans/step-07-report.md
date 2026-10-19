# Étape 7 — vérification mobile et parcours

## Changements

- Le classement conserve les boutons Monter/Descendre et accepte un vrai geste Pointer Events sur sa poignée. La capture du pointeur appartient à la liste stable pendant le réordonnancement; seul le contrôle porte `touch-action: none`. Les annonces vocales utilisent le libellé du bloc.
- Les champs de trace et de texte à trous reçoivent des IDs DOM uniques avec `useId`; les labels restent liés à leur champ. Les consignes, corrections et indices rendent le code inline par des nœuds texte échappés, sans HTML arbitraire.
- La reprise fusionne les réponses d’étapes sauvegardées et le brouillon. Une réponse modifiée invalide cette étape et les suivantes; la reprise d’un brouillon partiel conserve les autres réponses sauvegardées. Les énoncés mvp-048/063 acceptent les espaces et crochets usuels. L’exemple JavaScript de mvp-055 montre maintenant le résultat affiché.
- Les tests vérifient chaque interaction des 80 activités avec une réponse correcte et une réponse incorrecte à identifiants valides. Ils vérifient aussi qu’il existe un exemple avec résultat dans chacune des activités et que tout bloc déclaré JavaScript se parse sans exécution. Les handlers d’étape et de finalisation ont quatre tests ciblés avec doubles stricts : ordre, RPC d’étape sans récompense, finalisation incomplète, puis regrade et séquence des RPC de finalisation.
- Un harness Vite sous `tests/fixtures/` utilise les vrais composants, des réponses réseau explicitement fictives et les actifs locaux. Il ne crée aucune route de démonstration en production et ne prouve ni Auth ni persistance Supabase.

## Vérifications

| Commande | Résultat |
|---|---|
| `npm run curriculum:author` | Réussi : 80 activités compilées |
| `npm run curriculum:build` | Réussi : 80 activités, 111 interactions; seed et migration v2 générés |
| `npm test` | Réussi : 64 tests dans 16 fichiers |
| `npm run test:db` | Réussi : 45 contrôles PostgreSQL avec PGlite |
| `npm run lint` | Réussi |
| `npm run typecheck` | Réussi |
| `npm run test:e2e:mobile` | Réussi : 20/20, projets Chromium 375, 390, 430 px et desktop 1440 px |
| `npm run test:e2e` | Build Next réussi; 19 tests E2E réussis, 5 skipped |
| `git diff --check` | Réussi |

La recette mobile manipule choix, association, classement par catégories, ordre, trous, trace et débogage; elle vérifie les données effectivement envoyées au faux endpoint de brouillon. Elle vérifie aussi les labels/id, les indices 0→1→2 après fermeture/réouverture, Escape et retour du focus, le parcours de projet séquentiel, le finish, l’invalidation après modification, la reprise `savedSteps` + brouillon partiel, l’overflow, les contrôles de 44 px, le mode sombre et `prefers-reduced-motion`. Le déplacement premier→dernier et dernier→premier est un vrai geste Chromium CDP (`Input.dispatchTouchEvent`, plusieurs `touchMove`), puis les boutons, le clavier et le scroll ailleurs dans la page sont contrôlés.

Sur la suite publique, les 5 tests skipped sont les 3 tests Supabase live et 2 captures du prototype limitées aux projets 375 et 430 px; la capture prototype à 390 px passe. Le runner `scripts/test-e2e-public.mjs` transmet des variables Supabase explicitement vides au build et au serveur enfant. `LITECODE_E2E_LIVE` et la référence projet sont vides dans cette recette. Aucun Auth live, compte distant, accès cloud ni écriture Supabase n’a été testé. Le fichier `.env.local` n’a pas été lu ni modifié.

## Captures inspectées

J’ai ouvert les captures et comparé l’accueil au prototype 390 px : l’univers vert, le robot, les cartes arrondies et le CTA sont cohérents. La théorie 004 est lisible et hiérarchisée, avec ses blocs JavaScript et leurs sorties; le finish rend son robot, le module et son CTA. La capture des interactions confirme les cartes et actions mobiles sans débordement horizontal.

- Référence fournie : `docs/screenshots/welcome-iphone-390.png`
- Prototype capturé depuis `references/prototype_mobile_16_ecrans.html` : `docs/screenshots/step-07/prototype-welcome-390.png`
- Accueil courant : `docs/screenshots/step-07/welcome-live-390.png`
- Interactions : `docs/screenshots/step-07/widgets-390.png`
- Théorie 004 : `docs/screenshots/step-07/theory-004-390.png`
- Finish : `docs/screenshots/step-07/finish-390.png`

## Limites

Revue indépendante du contrôleur : code et nouveaux tests relus; captures finish, interactions et théorie 004 ouvertes; relances de Vitest (64/64), du harness (20/20), de la recette publique avec build (19 réussis, 5 skipped), de PGlite (45 contrôles), de lint et de TypeScript réussies.

Le geste a été exécuté par Chromium avec émulation tactile et CDP; cela ne remplace pas un essai sur Safari/iPhone physique. Les scénarios projet, indices et finish du harness utilisent des fixtures locales explicites et ne constituent pas une preuve de stockage cloud ou d’Auth réelle. Les captures visuelles ont été inspectées à 390 px; les autres largeurs ont été couvertes par assertions automatisées, sans comparaison visuelle au prototype.
