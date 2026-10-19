import { example as code, paragraph as p, type AuthorInput } from "./helpers";
import { authoredActivitySchema } from "../../src/lib/learning-model";
import { reviewedPilot } from "./reinforced-004";

const pilot = authoredActivitySchema.parse(reviewedPilot);
export const module01: AuthorInput[] = [
  {
    public: { id: "mvp-001", version: 2, title: "À quoi sert JavaScript ?", theory: [
      { type: "heading", level: 2, text: "Trois outils, trois rôles" },
      p("Une page web peut utiliser plusieurs langages. **HTML** décrit ce qui existe, par exemple un titre ou un bouton. **CSS** règle leur apparence, comme la couleur ou l’espacement. **JavaScript** ajoute des actions et des calculs."),
      code("console.log(4 * 3);", "12"),
      p("`console.log(...)` affiche le résultat entre ses parenthèses. Le navigateur calcule ici `4 * 3`, puis montre `12`. JavaScript peut aussi réagir à un clic ou afficher une réponse; HTML et CSS ont les deux autres rôles décrits plus haut."),
    ], interactions: [{ id: "roles", prompt: "Relie chaque besoin au rôle qui le prend en charge.", definition: { kind: "matching", left: [{ id: "structure", label: "Ajouter un bouton à la page" }, { id: "appearance", label: "Rendre le bouton bleu" }, { id: "behavior", label: "Calculer le total après un clic" }], right: [{ id: "html", label: "HTML" }, { id: "css", label: "CSS" }, { id: "js", label: "JavaScript" }] } }] },
    grading: [{ interactionId: "roles", key: { kind: "matching", accepted: [[{ leftId: "structure", rightId: "html" }, { leftId: "appearance", rightId: "css" }, { leftId: "behavior", rightId: "js" }]] }, explanation: "HTML place les éléments, CSS règle leur apparence et JavaScript réalise le calcul demandé.", feedback: { incorrect: "Repère si le besoin concerne le contenu, le style ou une action." } }], xp: 0,
  },
  {
    public: { id: "mvp-002", version: 2, title: "Choisir un type de donnée", theory: [
      { type: "heading", level: 2, text: "La forme d’une valeur compte" },
      p("JavaScript distingue les nombres, les textes et les booléens. Un **number** sert aux calculs. Une **string** est une suite de caractères écrite entre guillemets. Un **boolean** vaut seulement `true` ou `false` et exprime un oui ou un non."),
      code('console.log(3);\nconsole.log("Maya");\nconsole.log(false);', "3 puis Maya puis false"),
      p("Les guillemets changent le type : `42` sans guillemets est un nombre, tandis que `\"42\"` est du texte. Deux valeurs qui se ressemblent à l’écran ne sont donc pas forcément utilisables de la même façon."),
    ], interactions: [{ id: "types", prompt: "Classe chaque valeur dans son type JavaScript.", definition: { kind: "classify", items: [{ id: "score", label: "18" }, { id: "code", label: '"18"' }, { id: "actif", label: "true" }, { id: "pseudo", label: '"Noé"' }], categories: [{ id: "number", label: "number : nombre" }, { id: "string", label: "string : texte" }, { id: "boolean", label: "boolean : vrai ou faux" }] } }] },
    grading: [{ interactionId: "types", key: { kind: "classify", accepted: [{ score: "number", code: "string", actif: "boolean", pseudo: "string" }] }, explanation: "Les guillemets indiquent un texte. `true` est un booléen; 18 sans guillemets est un nombre.", feedback: { incorrect: "Vérifie d’abord les guillemets, puis repère `true` et `false`." } }], xp: 0,
  },
  {
    public: { id: "mvp-003", version: 2, title: "Déclarer une variable", theory: [
      { type: "heading", level: 2, text: "Donner un nom à une valeur" },
      p("Une **variable** associe un nom à une valeur pour qu’on puisse la réutiliser. `let` et `const` déclarent ce nom. Utilise `let` si le programme doit lui attribuer une autre valeur plus tard; utilise `const` si aucune nouvelle affectation n’est prévue."),
      code("let niveau = 1;\nniveau = 2;\nconst pseudo = \"Sam\";", "État : niveau = 2; pseudo = Sam."),
      p("Le signe `=` attribue la valeur de droite au nom de gauche. Dans cet exemple, `niveau` change; `pseudo` garde son texte. Le bon choix dépend de ce que le programme fera ensuite, pas du nom choisi."),
    ], interactions: [{ id: "declaration", prompt: "Pour chaque ligne à compléter, choisis le mot qui correspond à la suite annoncée.", definition: { kind: "blanks", blanks: [{ id: "points", label: "Le total de points reçoit un bonus après son départ à 0.", mode: "options", options: [{ id: "let", label: "let" }, { id: "const", label: "const" }] }, { id: "date", label: "La date de naissance est lue puis gardée telle quelle.", mode: "options", options: [{ id: "const", label: "const" }, { id: "let", label: "let" }] }] } }] },
    grading: [{ interactionId: "declaration", key: { kind: "blanks", accepted: { points: ["let"], date: ["const"] } }, explanation: "Le total reçoit une nouvelle valeur après le bonus, donc `let`. La date ne change pas, donc `const` convient.", feedback: { incorrect: "Lis la suite du scénario avant de choisir le mot." } }], xp: 0,
  },
  { ...pilot, public: { ...pilot.public, version: 2 } },
  {
    public: { id: "mvp-005", version: 2, title: "Lire console.log", theory: [
      { type: "heading", level: 2, text: "Afficher une valeur pour la lire" },
      p("`console.log(...)` affiche ce qui se trouve entre ses parenthèses. Il est utile pour vérifier un calcul ou voir une valeur pendant l’apprentissage. Un nombre entre guillemets reste du texte; sans guillemets, l’opérateur `+` peut additionner."),
      code('console.log(2 + 5);\nconsole.log("2" + "5");', "7 puis 25"),
      p("Dans le premier appel, JavaScript additionne deux nombres. Dans le second, il réunit deux textes. Chaque appel affiche son propre résultat, dans le même ordre que les lignes."),
    ], interactions: [{ id: "sorties", prompt: "Associe chaque appel à ce qu’il affiche.", definition: { kind: "matching", left: [{ id: "sum", label: "console.log(2 + 5)" }, { id: "join", label: 'console.log("2" + "5")' }], right: [{ id: "seven", label: "7" }, { id: "twentyfive", label: "25" }] } }] },
    grading: [{ interactionId: "sorties", key: { kind: "matching", accepted: [[{ leftId: "sum", rightId: "seven" }, { leftId: "join", rightId: "twentyfive" }]] }, explanation: "Les nombres s’additionnent; deux chaînes sont réunies caractère après caractère.", feedback: { incorrect: "Vérifie si les valeurs ont des guillemets avant d’interpréter `+`." } }], xp: 0,
  },
  {
    public: { id: "mvp-006", version: 2, title: "Suivre les affectations", theory: [
      { type: "heading", level: 2, text: "La valeur évolue ligne après ligne" },
      p("Une variable garde sa valeur jusqu’à la prochaine affectation. `score += 2` signifie qu’on prend le score actuel, qu’on ajoute 2, puis qu’on range le nouveau résultat dans `score`. L’ordre des instructions détermine donc le résultat."),
      code("let score = 4;\nscore += 2;\nscore = score - 1;", "4 → 6 → 5"),
      p("Pour suivre le programme, note la valeur après chaque ligne qui change le nom. La dernière ligne remplace 6 par 5; elle ne retire pas 1 à la valeur de départ."),
    ], interactions: [{ id: "score", prompt: "Écris la valeur de score après chaque ligne. Réponds avec des nombres, dans les cases indiquées.", code: { language: "javascript", code: "let score = 4;\nscore += 2;\nscore = score - 1;" }, definition: { kind: "trace", cells: [{ id: "depart", label: "Après la première ligne" }, { id: "bonus", label: "Après score += 2" }, { id: "retrait", label: "Après score = score - 1" }] } }] },
    grading: [{ interactionId: "score", key: { kind: "trace", accepted: { depart: ["4"], bonus: ["6"], retrait: ["5"] } }, explanation: "Le score part de 4, devient 6 après le bonus, puis 5 après le retrait d’un point.", feedback: { incorrect: "Repars de la valeur précédente à chaque ligne." } }], xp: 0,
  },
  {
    public: { id: "mvp-007", version: 2, title: "Respecter les majuscules", theory: [
      { type: "heading", level: 2, text: "Les noms distinguent les majuscules" },
      p("JavaScript est sensible à la **casse** : une majuscule et une minuscule ne sont pas interchangeables dans un nom. `score`, `Score` et `SCORE` désignent trois identifiants différents. Il faut réutiliser exactement l’écriture choisie à la déclaration."),
      code("const score = 8;\nconsole.log(score);", "8"),
      p("Si l’appel affichait `Score` avec une majuscule, il ne retrouverait pas le nom `score` déclaré ici. Avant de lire une ligne, compare toutes les lettres, pas seulement le sens du mot."),
    ], interactions: [{ id: "casse", prompt: "Un programme déclare `const score = 8`. Quel identifiant reprend exactement le même nom ?", code: { language: "javascript", code: "const score = 8;" }, definition: { kind: "choice", mode: "single", options: [{ id: "upper-first", label: "Score" }, { id: "score", label: "score" }, { id: "upper-all", label: "SCORE" }] } }] },
    grading: [{ interactionId: "casse", key: { kind: "choice", accepted: [["score"]] }, explanation: "Seule l’option `score` reprend les mêmes lettres et la même casse que la déclaration.", feedback: { incorrect: "Compare la première lettre, puis les autres, en respectant majuscules et minuscules." } }], xp: 0,
  },
  {
    public: { id: "mvp-008", version: 2, title: "Ton premier profil de joueur", theory: [
      { type: "heading", level: 2, text: "Un prénom et un score" },
      p("Un profil peut être affiché à partir de valeurs simples. On garde le prénom dans une chaîne et le score dans un nombre. `+` additionne deux nombres; `console.log` affiche la valeur placée entre ses parenthèses."),
      code('const prenom = "Lina";\nlet score = 6;\nscore += 2;\nconsole.log(prenom);\nconsole.log(score);', "Lina puis 8"),
      p("Le projet suit un seul profil : on vérifie le bonus, le prénom affiché et le score final. Les étapes se rapportent aux mêmes deux valeurs."),
    ], interactions: [
      { id: "bonus", prompt: "Le score commence à 6 et reçoit 2 points. Quelle expression complète son affectation ?", definition: { kind: "blanks", blanks: [{ id: "expression", label: "score = score + ___", mode: "options", options: [{ id: "two", label: "2" }, { id: "six", label: "6" }, { id: "eight", label: "8" }] }] } },
      { id: "message", prompt: "Associe chaque donnée à l’appel console.log qui l’affiche.", definition: { kind: "matching", left: [{ id: "lina", label: "Lina" }, { id: "huit", label: "8" }], right: [{ id: "prenom", label: "console.log(prenom)" }, { id: "total", label: "console.log(score)" }] } },
      { id: "affichage", prompt: "Place les deux appels console.log dans l’ordre où le code les exécute.", definition: { kind: "ordering", items: [{ id: "score", label: "Afficher le score final" }, { id: "prenom", label: "Afficher le prénom" }] } },
      { id: "sortie", prompt: "Quel score est affiché après le bonus ?", definition: { kind: "choice", mode: "single", options: [{ id: "six", label: "6" }, { id: "eight", label: "8" }, { id: "sixtytwo", label: "62" }] } },
    ], project: { steps: ["bonus", "message", "affichage", "sortie"] } },
    grading: [
      { interactionId: "bonus", key: { kind: "blanks", accepted: { expression: ["two"] } }, explanation: "Le bonus ajoute 2 au score actuel, qui vaut 6.", feedback: { incorrect: "La valeur à droite est le bonus, pas le score complet." } },
      { interactionId: "message", key: { kind: "matching", accepted: [[{ leftId: "lina", rightId: "prenom" }, { leftId: "huit", rightId: "total" }]] }, explanation: "`console.log(prenom)` affiche Lina; `console.log(score)` affiche le score après le bonus.", feedback: { incorrect: "Associe le nom de variable à l’appel qui l’affiche." } },
      { interactionId: "affichage", key: { kind: "ordering", accepted: [["prenom", "score"]] }, explanation: "Le code appelle d’abord `console.log(prenom)`, puis `console.log(score)`.", feedback: { incorrect: "Suis les appels de haut en bas." } },
      { interactionId: "sortie", key: { kind: "choice", accepted: [["eight"]] }, explanation: "Le score final est 6 + 2, soit 8.", feedback: { incorrect: "Ajoute le bonus au score initial." } },
    ], xp: 0,
  },
];
