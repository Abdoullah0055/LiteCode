# Étape 7 — Tests, recette mobile et correction des régressions

Lire plan, rapports2à6, AGENTS.md et code réel. Ne pas déléguer, committer, pousser, déployer ou modifier les secrets. Aucun Docker. Ne pas activer de test écrivant sur Supabase hébergé sans garde de projet dédié; ne pas contourner la garde existante. Le contrôleur relira et vérifie tes résultats.

## Revue fonctionnelle ciblée

- Vérifier parcours welcome→signup→onboarding unique→home, connexion habituelle, confirmationmotdepasse, récupération, remember-device/proxy/callback/logout.
- Vérifier les sept familles d’interaction, projets séquentiels, navigation leçon/exercice/résultat/reprise, erreurs, indices, progression et refus de triche XP.
- Projets : changer une réponse déjà validée invalide sa validation, final regrade les réponses courantes, étape seule sans XP/badge/streak/completion. Anciennes tentatives et acquis préservés; aucun code libre ne reste.
- Vérifier tout le corpus (80activités) par son correcteur, avec bonnes ET mauvaises réponses valides. Revoir contradictions entre consignes et clés. Théories : hiérarchie, emphase, vocabulaire expliqué et résultat des exemples.
- Le test de syntaxe des exemples doit également vérifier qu'il existe au moins un exemple avec résultat pour chaque activité, afin qu'une suppression des blocs ne produise pas un succès sur zéro exemple. Les captures du prototype limitées à390px doivent être comptées comme telles, sans annoncer des comparaisons non effectuées sur les autres largeurs.
- Clarifier le format des traces : mots sans guillemets quand c'est attendu (par exemple050), booléens true/false et listes séparées par virgules. Pour048/063, vérifier les variantes usuelles d'espaces/crochets acceptées ou annoncer le format exact; ne pas faire échouer une compréhension correcte pour une ambiguïté de consigne.
- Compléter tests API réels de handlers si manquants, avec doubles stricts des accès Supabase et assertions sur les appels RPC/absence de clés publiques. PGlite couvre le SQL réel. Ne pas présenter les doubles comme Supabase Auth live.

## Playwright et visuel

- Tester375/390/430px en tactile et un viewportdesktop. Couvrir les familles d’interactions, théorie004 et finish illustré. Vérifier overflow, boutons44px, focus/clavier, modales d’indices, actions non masquées, darkmode et reducedmotion.
- Compléter l’ordre des blocs avec un geste de glisser-déposer (poignée tactile/Pointer Events), en conservant les boutons monter/descendre. Le geste ne doit pas empêcher de faire défiler la page hors de sa poignée. Vérifier le déplacement au navigateur, pas seulement un attribut draggable.
- Plusieurs interactions peuvent avoir des champs portant le même identifiant métier : donner aux IDs DOM des préfixes uniques (useId), puis vérifier qu’un label cible toujours son propre champ, notamment dans les traces et les textes à trous.
- Certaines consignes, corrections et indices contiennent des termes entre accents graves. Les afficher en code inline accessible et échappé plutôt que montrer les délimiteurs Markdown bruts; utiliser un petit renderer réutilisable sans HTML arbitraire ni nouvelle dépendance lourde. La théorie structurée dispose déjà de ses segments.
- Les tests publics Next peuvent être exécutés sans config Supabase en passant des variables VIDES au sous-processus webServer; ne pas renommer/écraser .env.local. Éviter le bug historique où le test croit l’envvide alors que Next lit .env.local.
- Pour tester les composants protégés sans comptes cloud : si aucun projettestdédié n’est disponible, créer un harness navigateur ISOLÉ sous tests/fixtures (hors app/routes de production), avec définitions publiques des activités et callbacks de test. Utiliser Vite déjà installé par Vitest pour servir le harness, wrappers/shims minimum pour next/image ou navigation seulement si requis. Aucun bypass d’auth dans l’application ni route de démo dans le buildproduction. Choisir ce chemin uniquement si nécessaire pour avoir des tests mobiles des nouveaux écrans.
- Les captures du harness servent à vérifier UI/interaction; elles ne prouvent pas la persistance/authentification cloud. Le rapport fait cette distinction.
- Ouvrir les captures produites pour inspection visuelle, comparer à docs/screenshots/welcome-iphone-390.png et au prototypeHTML (univers vert/robot/cartes arrondies). Des captures enregistrées sans inspection ne constituent pas une revue visuelle.
- Maintenir E2Elive opt-in avec LITECODE_E2E_LIVE=1 + refprojettestexact. Si indisponible, marquer skipped et compter séparément des tests réussis.

## Commandes et rapport

- Lancer npm run curriculum:build, npm run lint, npm run typecheck, npm test, npm run test:db, npm run build et Playwright pertinent. En cas spawnEPERM/esbuild/browser : require_escalated pour la commande requise, ne pas supprimer les tests.
- Les builds modifient next-env.d.ts automatiquement entre dev/types et types; conserver un état cohérent sans effacer d’autres changements. Pas de suppression globale des caches ou processus d’autres tâches.
- Corriger les problèmes trouvés dans cette étape et tester les changements. Aucun green obtenu par désactivation injustifiée d’assertions, suppression de validations ou promesses de tests non exécutés.
- Rapport docs/plans/step-07-report.md : commandes et résultats exacts, tests passés/skipped, captures réellement examinées, défauts corrigés, limites (notamment ChromiumémuléiPhone vs Safari réel, SupabaseAuthlive non exécuté lecaséchéant). Un problème important non résolu est explicitement signalé au contrôleur.
