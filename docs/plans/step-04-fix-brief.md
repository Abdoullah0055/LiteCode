# Étape 4 — Correctifs après revue du contrôleur

Lire AGENTS.md, step-04-report.md et les sources concernées. Travail dans ce checkout uniquement, sans délégation, commit, push, Docker, déploiement, accès distant ni lecture/modification des secrets. Ne pas toucher aux briefs06/07 : modifications du contrôleur en cours.

## Défauts vérifiés à corriger

- mvp-064 présente `[] → null` comme JavaScript. Le marquer texte, puis ajouter un test qui analyse la syntaxe de tous les blocs de théorie annoncés JavaScript avec `new Script(code)` de node:vm, SANS exécuter ces scripts. Le contrôleur a confirmé que ce bloc est le seul qui échoue actuellement à cette analyse.
- mvp-026 et027 ont chacune deux sections supplémentaires presque identiques, avec exactement le même exemple répété (module-04.ts + depth.ts). Fusionner proprement : un seul approfondissement utile, exemple unique. Conserver distinction paramètre/argument et affichage/return, sans remplissage.
- mvp-056 depth.ts introduit un opérateur ternaire `? :` jamais enseigné. Remplacer par if déjà appris et accolades explicites; corriger aussi `has(lune)` en `has("lune")` dans la prose puisque lune n’est pas une variable. Le débutant doit pouvoir lire l’exemple avec les notions déjà acquises.
- mvp-012 annonce String ET Number mais ne montre que Number. Ajouter un exemple String avec effet visible (type texte / concaténation), expliquer la différence. Corriger le détail qui appelle `18` du texte sans guillemets : utiliser `"18"`. Évaluer les deux conversions (seconde interaction courte ou question à trous), afin de vérifier la compréhension des deux sens, sans code libre. Adapter comptes110 et tests/rapport si nécessaire, jamais les rendre vides.
- mvp-036 approfondissement parle de copie superficielle et d’objets imbriqués avant leur enseignement. Garder explication concrète des tableaux de nombres/textes et éviter cette digression pour débutant. Dire clairement la portée de l’exemple.
- mvp-029 consigne dit «endroit accessible», catégories classent le lieu de déclaration. Aligner consigne sur le lieu de déclaration pour éviter l’ambiguïté (une variable extérieure reste accessible dans fonction).

## Vérification supplémentaire

- Compléter tests PGlite de l’immuabilité : version archivée garde ses clés et contenu immuables; déplacement d’une définition publiée vers un brouillon refusé; suppression de version publiée refusée. Le générateur comporte déjà ces gardes : vérifier les appels réels plutôt que seulement lire le SQL. Ne pas modifier les migrations antérieures; le contenu v2 de cette étape n’a jamais été déployé, sa migration générée peut être régénérée.
- Modifier les sources auteur, régénérer JSON canonique puis seed/migration via npm run curriculum:author et npm run curriculum:build. Ne pas corriger seulement le JSON généré.
- Vérifier que les commandes de génération sont déterministes (mêmes octets après seconde exécution).
- Lancer tests pertinents, typecheck, lint. En cas EPERM au spawn esbuild/Vitest, utiliser require_escalated avec justification. Aucun remplacement de validation par cast any ou suppression d’assertions.
- Écrire docs/plans/step-04-fix-report.md, signaler résultats exacts et limites. Cesser les écritures une fois livré; le contrôleur prendra la revue et le commit.
