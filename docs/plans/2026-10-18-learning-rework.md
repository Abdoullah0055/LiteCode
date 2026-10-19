# Rework pédagogique LiteCode — plan et matrice des 80 activités

Date : 18 octobre 2026  
Document de référence pour l’implémentation; preuves et état courant dans learning-rework-progress.md.

## Décision pédagogique

Le parcours garde **10 modules de 8 activités** et les identifiants, complétions et XP déjà utilisés. Les textes, exemples, consignes, corrections et indices sont réécrits en français naturel pour une personne débutante d’environ 18 ans. Chaque écran présente une idée à la fois, avec des termes cohérents, des éléments importants en gras, des extraits de code lisibles et des exemples dont le résultat est indiqué. Les analogies servent à expliquer une relation concrète. La difficulté augmente à l’intérieur de chaque module.

Les 30 éditeurs de code libre sont remplacés et les 80 activités sont révisées. Aucune activité ne demande d’écrire une fonction complète ou d’exécuter du code. Les corrections de code se font par sélection d’une ligne et choix d’un remplacement. Les réponses courtes sont permises quand elles portent clairement sur un mot ou un nombre.

Huit familles d’interaction : **choice(single|multiple)** (choix), **matching** (association), **classify** (classement), **ordering** (ordre), **blanks** (trous), **trace** (suivi de valeurs), **debug(selectline+replacement)** (ligne et remplacement), **guided_project(steps)** (projet en étapes réutilisant les autres familles).

Les clés et corrections restent côté serveur. Le client transmet les réponses, jamais les XP. Un projet n’accorde ses XP qu’après une validation finale côté serveur de toutes ses étapes. Chaque activité a une version; une soumission basée sur une version devenue obsolète reçoit un conflit 409 et demande de recharger la version actuelle.

## Principes de contenu et de correction

- Expliquer chaque notion en français simple, puis la montrer dans un exemple court avec son résultat. Définir un terme au premier emploi et reprendre les mêmes termes ensuite.
- Faire progresser l’élève : reconnaître, distinguer, appliquer, tracer, diagnostiquer, puis assembler.
- Donner un critère vérifiable, une erreur fréquente et des indices gradués. Les indices aident à raisonner sans révéler immédiatement la clé.
- Montrer Git comme du texte à interpréter. Aucun shell n’est lancé. Les extraits JavaScript sont des données d’exercice et ne sont jamais exécutés.
- Le serveur corrige les valeurs/structures attendues; il n’envoie pas les clés au client. Il calcule les XP.
- IDs mvp-001 à mvp-080, modules, XP historiques, complétions et tentatives sont préservés. Le contenu est versionné; une version périmée produit 409.
- La migration de contenu est additive. Ne pas modifier la migration initiale, réinitialiser les données ou recalculer les XP existants. Garder les anciennes tentatives lisibles.
- Les attributions restent dans les données. Les mentions de provenance retirées des pages sont regroupées dans « Sources et crédits » des paramètres.

## Plan et checklist

Checklist des huit étapes, actualisée après revue du contrôleur; les preuves sont dans le ledger et les rapports de chaque étape.

### Étape 1 — plan pédagogique

- [x] Lire AGENTS.md, curriculum/original.fr.json, scripts/author-curriculum.py et references/RAPPORT.md.
- [x] Écrire le plan, la matrice de 80 activités et le ledger 1..8.
- [x] Revue du plan par le contrôleur : 80 IDs vérifiés et écarts pédagogiques corrigés.

### Étape 2 — modèle versionné et activité de référence

- [x] Examiner modèles/routes/schémas actuels avant modification.
- [x] Définir le modèle versionné des lectures, huit interactions, projets multi-étapes et réponses de grading.
- [x] Faire de mvp-004 la référence complète : prénom fixe, valeur initiale explicite, score modifié, explication et trace pas à pas, correction privée. Ne pas demander const ou let comme choix unique lorsque les deux seraient valides.
- [x] Valider avec Zod et TypeScript strict; garder la clé côté serveur; détection de version périmée testée. Traduction HTTP409 à l’étape3.

### Étape 3 — moteur et API

- [x] Rendre les huit familles de façon accessible et adaptée au mobile.
- [x] Ajouter soumission, grading côté serveur, brouillons de projet et conflit 409.
- [x] Déduire XP de la réussite côté serveur; ne jamais accepter les XP du client.
- [x] Verser les XP d’un projet guidé uniquement après revérification serveur de toutes ses étapes.
- [x] Ne jamais exécuter les extraits d’activité.

### Étape 4 — contenu et migration

- [x] Rédiger les 80 activités selon la matrice; vérifier texte, prérequis, versions, clés privées, correction et indices.
- [x] Ajouter migration de contenu et seed reproductibles, sans toucher à la migration initiale ni réinitialiser l’état.
- [x] Préserver IDs, XP, complétions, tentatives et leur lisibilité.

### Étape 5 — inscription, onboarding et finish

- [x] Inscription avec confirmation de mot de passe et confirmation par courriel si Supabase la demande.
- [x] Ordre : signup, confirmation si requise, objectifs, langues, finish.
- [x] Stocker étape d’onboarding et completed en base; backfill completed pour les comptes existants.
- [x] Connexion habituelle directe à l’accueil; nouvel inscrit reprend l’étape incomplète.
- [x] « Mémoriser cet appareil » coché par défaut : cookie glissant 30 jours; sinon cookie de session. Cohérence avec proxy, callback et déconnexion. Aucun stockage de mot de passe.
- [x] Finish soigné dans le style du robot existant, avec un CTA unique. Recette visuelle complète à l'étape7.

### Étape 6 — retrait du runner

- [x] Retirer des pages et routes d’apprentissage éditeurs libres, exécution et parcours de shell.
- [x] Garder les exercices structurés corrigés côté serveur et la lecture des anciennes tentatives.

### Étape 7 — revue

- [ ] Examiner flux client/API/correction privée, réponses, indices, brouillons et conflits de version.
- [ ] Examiner sécurité, accessibilité clavier, erreurs et affichage mobile.
- [ ] Vérifier IDs, progression et XP avant migration.

### Étape 8 — documentation et rapport

- [ ] Documenter modèle, interactions, onboarding, migration et XP.
- [ ] Produire rapport des changements et limites.
- [ ] Mentionner uniquement les contrôles réellement exécutés et leurs résultats.

## Matrice des 80 activités

Les prérequis sont conceptuels, en plus de l’ordre séquentiel du module. Les critères donnent la règle attendue; les indices avancent du rappel à la piste décisive.

### Module 1 — Premiers gestes en JavaScript

| ID | Objectif débutant | Prérequis conceptuels | Interaction | Critère de correction | Théorie | Erreur fréquente | Indices |
|---|---|---|---|---|---|---|---|
| mvp-001 | Relier JavaScript à une action, comme calculer un total. | Rôle de HTML/CSS; idée d’instruction. | matching | HTML→structure, CSS→apparence, JS→comportement/calcul. | Rôles des outils, sans DOM. | Croire que JS ne fait que décorer. | Cherche ce qui calcule; compare structure, apparence et action. |
| mvp-002 | Classer nombre, texte et booléen. | Valeur, guillemets, vrai/faux. | classify | Ranger chaque valeur dans number, string ou boolean. | Trois types; 42 diffère de '42'. | Prendre texte chiffré pour nombre. | Observe guillemets; true/false répondent oui/non. |
| mvp-003 | Compléter une déclaration selon un changement annoncé. | Variable, valeur initiale, réaffectation. | blanks | let si nouvelle affectation prévue; const si variable fixe dans le scénario. | Déclaration et affectation, sans portée. | Choisir selon le nom plutôt que l’usage. | Lis la suite; la valeur sera-t-elle remplacée ? |
| mvp-004 | Comprendre let/const avec prénom fixe et score modifié. | Déclaration, affectation et ajout. | classify + trace + choice | Intention de réaffecter explicitée; classer les rôles puis tracer un score dont le départ est donné. | const garde la valeur attribuée au nom; let autorise une nouvelle affectation. Aucun objet, référence, fonction ou return. | Choisir sans regarder ce qui change. | Repère ce qui change; pars du score indiqué puis ajoute le bonus. |
| mvp-005 | Associer chaque console.log au message affiché. | Chaînes, calcul simple, ordre. | matching | Associer appels aux sorties dans l’ordre. | log affiche; return transmis au module 4. | Lire 2+5 comme texte. | Guillemets=texte; calcule les autres expressions. |
| mvp-006 | Suivre les affectations d’une variable. | Déclaration, ordre, = et +=. | trace | Donner dernière valeur après chaque étape. | État de variable, pas à pas. | Lire += comme remplacement. | Note le départ; += ajoute à la valeur précédente. |
| mvp-007 | Repérer les noms distincts par la casse. | Identifiants et majuscules/minuscules. | choice(single) | Choisir l’identifiant écrit exactement comme sa déclaration. | Sensibilité à la casse; conversions reportées M2. | Lire score et Score comme identiques. | Compare chaque lettre, surtout la première. |
| mvp-008 | Assembler un profil joueur à partir d’un prénom et score en texte. | Chaînes, nombres; aucun objet/fonction. | guided_project (blanks → matching → ordering → choice) | Construire les sorties textuelles et un total par étapes, sans objet. | Profil en deux sorties; pas de fonction ni boucle. | Oublier un espace ou le bonus. | Message a un espace après Salut; total ajoute le bonus. |

### Module 2 — Textes, caractères et nombres

| ID | Objectif débutant | Prérequis conceptuels | Interaction | Critère de correction | Théorie | Erreur fréquente | Indices |
|---|---|---|---|---|---|---|---|
| mvp-009 | Trouver longueur d’une chaîne. | Texte et caractères. | matching | Associer chaîne simple au nombre de caractères. | length; guillemets non comptés. | Compter les guillemets. | Compte l’intérieur; espace et ponctuation comptent. |
| mvp-010 | Lire un caractère à son index. | Chaîne et index zéro. | trace | Choisir le caractère à la position donnée. | Index 0,1,…; texte inchangé. | Commencer à 1. | Écris positions sous les caractères, dès 0. |
| mvp-011 | Réunir deux textes avec +. | Chaînes et opérateur +. | blanks | Insérer + et garder l’espace demandé. | Concaténation; aucun séparateur automatique. | Oublier l’espace ou utiliser *. | + réunit; espace doit être dans une chaîne. |
| mvp-012 | Distinguer conversion nombre→texte et texte→nombre. | Types number/string. | choice(single) | Choisir l’expression de conversion attendue et le type obtenu. | String/Number illustrés, sans fonction écrite par élève. | Confondre affichage et type. | Guillemets indiquent texte; vérifie le sens demandé. |
| mvp-013 | Calculer une expression avec priorités. | Opérations arithmétiques. | trace | Parenthèses d’abord, puis */ avant +-. | Priorités usuelles. | Calculer gauche à droite. | Commence par parenthèses; multiplication avant addition. |
| mvp-014 | Réparer parenthèses dans une moyenne. | Opérateurs et priorité. | debug(selectline+replacement) | Remplacer a+b/2 par (a+b)/2. | Syntaxe correcte peut cacher erreur logique. | Diviser seulement b. | Additionne avant division; encadre la somme. |
| mvp-015 | Convertir un prix texte avant le calcul. | String, number, conversion explicite. | choice(single) | Choisir expression donnant nombre attendu. | Number avant addition; distinguer concaténation. | Obtenir '102' au lieu de 12. | Convertis avant le calcul; vérifie type et résultat. |
| mvp-016 | Construire une phrase exacte par gabarit. | Chaînes et interpolation. | guided_project (blanks → ordering → choice) | Placer nom, nombre, espaces et ponctuation correctement. | Gabarit; aucun code libre. | Oublier espace ou point final. | Compare l’ordre des morceaux; relis caractère par caractère. |

### Module 3 — Conditions et booléens

| ID | Objectif débutant | Prérequis conceptuels | Interaction | Critère de correction | Théorie | Erreur fréquente | Indices |
|---|---|---|---|---|---|---|---|
| mvp-017 | Classer comparaisons vrai/faux. | Nombres et comparaisons. | classify | Ranger chaque expression dans true/false. | Booléen, < et >=. | Inverser le symbole. | Lis < comme « plus petit que ». |
| mvp-018 | Comparer deux valeurs de même type. | Nombre et égalité stricte. | trace | Choisir true/false exact. | === compare valeur et type. | Croire que comparaison retourne une opérande. | Elle répond vrai/faux; vérifie les types. |
| mvp-019 | Choisir == ou === selon la règle de type. | Types et égalité. | choice(single) | Choisir === si les types doivent correspondre. | Coercition de == mentionnée brièvement. | Croire que '4' et 4 sont identiques. | Trois signes ne convertissent pas la chaîne. |
| mvp-020 | Assembler les étapes d’un if sans return. | Condition et blocs. | ordering | Placer test, chemin vrai et chemin faux dans l’ordre. | Branche conditionnelle, résultats en étiquettes. | Introduire return avant M4 ou exécuter les deux chemins. | Le test vient avant; un seul chemin est pris. |
| mvp-021 | Identifier le chemin else quand condition échoue. | if et comparaison. | trace | Valeur sous seuil→else. | Deux chemins exclusifs. | Croire if et else exécutés ensemble. | Évalue la condition d’abord. |
| mvp-022 | Classer les règles avec && ou \|\|. | Comparaisons booléennes. | classify | « Toutes requises »→&&; « une suffit »→\|\|. | Logique à deux conditions. | Utiliser OU pour deux critères. | Et exige les deux; ou accepte l’une. |
| mvp-023 | Corriger affectation à la place de comparaison. | = et ===. | debug(selectline+replacement) | Remplacer = par === dans le test. | Affecter change; comparer vérifie. | N’écrire qu’un signe. | Le scénario demande-t-il changement ou vérification ? |
| mvp-024 | Assembler une admissibilité à deux seuils. | Comparaison, &&, seuil inclusif. | guided_project (classify → choice → trace) | Classer critères, combiner, vérifier bornes et valeurs juste dessous. | Deux comparaisons; sans fonction/return. | Oublier critère ou = de >=. | « Au moins » inclut la borne; deux règles obligatoires. |

### Module 4 — Fonctions et résultats

| ID | Objectif débutant | Prérequis conceptuels | Interaction | Critère de correction | Théorie | Erreur fréquente | Indices |
|---|---|---|---|---|---|---|---|
| mvp-025 | Associer déclaration, appel et résultat. | Nom, parenthèses, valeur calculée. | matching | Relier les trois éléments correspondants. | Fonction nomme des instructions réutilisables. | Confondre nom et appel. | Parenthèses avec argument déclenchent l’appel. |
| mvp-026 | Distinguer paramètre et argument. | Déclaration et appel. | trace | Associer valeur d’appel au paramètre local. | Paramètre=place; argument=valeur fournie. | Donner résultat plutôt que valeur reçue. | Observe la valeur entre parenthèses à l’appel. |
| mvp-027 | Compléter le mot qui transmet un résultat. | Fonction et expression. | blanks | Répondre return et associer valeur produite. | return termine/transmet; sinon undefined. | Utiliser console.log comme retour. | L’appelant doit recevoir le résultat. |
| mvp-028 | Réutiliser un appel dans un calcul composé. | Paramètres et retours. | ordering | Ordonner appels imbriqués et tracer de l’intérieur. | Composition de fonctions. | Appliquer le calcul une seule fois. | Résous l’appel intérieur; deux doubles font ×4. |
| mvp-029 | Classer une variable selon la portée du bloc. | Fonction, variable et accolades. | classify | Ranger chaque variable dans ses blocs accessibles. | Portée locale, sans hoisting. | Croire variable locale globale. | Suis les accolades autour de la déclaration. |
| mvp-030 | Réparer un calcul qui n’est pas retourné. | Expression et return. | debug(selectline+replacement) | Remplacer expression seule par return suivi de l’expression. | Calculer ≠ transmettre. | Croire dernière expression renvoyée automatiquement. | Calcul correct; mot de retour manquant. |
| mvp-031 | Classer affichage, retour et absence de retour. | console.log, return, undefined. | classify | Attribuer à chaque fragment son effet. | Pas de return explicite→undefined. | Croire somme affichée devient réponse. | Test lit retour; log affiche seulement. |
| mvp-032 | Assembler un convertisseur guidé. | Fonction, formule et valeurs repères. | guided_project (matching → ordering → trace → choice) | Associer formule, ordonner calcul, tracer 0°C, choisir résultat. | C×9/5+32, sans arrondi. | Ajouter 32 au mauvais moment. | Point de congélation=32°F; respecte l’ordre. |

### Module 5 — Tableaux

| ID | Objectif débutant | Prérequis conceptuels | Interaction | Critère de correction | Théorie | Erreur fréquente | Indices |
|---|---|---|---|---|---|---|---|
| mvp-033 | Assembler une déclaration de tableau. | Valeurs, crochets, virgules. | ordering | Ordonner nom, = et éléments entre crochets. | Collection ordonnée. | Utiliser accolades. | Les tableaux utilisent crochets carrés. |
| mvp-034 | Lire une valeur à l’index demandé. | Ordre et index zéro. | trace | Associer index à élément. | Index 0…length-1. | Lire index comme rang dès 1. | Premier élément est à 0. |
| mvp-035 | Modifier un élément d’un tableau const. | Tableau et affectation indexée. | blanks | Choisir case; reconnaître que référence reste la même. | Éléments modifiables malgré const; exception voulue. | Croire const interdit toute mutation. | On ne remplace pas le tableau; on change une case. |
| mvp-036 | Ordonner copie et ajout sans modifier l’entrée. | Tableau, push et copie. | ordering | Copie→ajout final→retour copie; entrée préservée. | Mutation de push et copie distincte. | Modifier le tableau reçu. | Copie d’abord; ajoute ensuite à la copie. |
| mvp-037 | Tracer pop et shift. | Début, fin et tableau. | trace | pop→dernier; shift→premier; valeur exacte. | Méthodes mutantes. | Croire pop retire au début. | pop en bout; shift au début. |
| mvp-038 | Trouver dernier élément et traiter vide. | length, index et cas vide. | choice(single) | Choisir length-1 et null si vide. | Dernier index=longueur-1. | Lire items[length]. | Soustrais 1 à la longueur. |
| mvp-039 | Classer index valides/hors limites. | Longueur et index. | classify | Valide si 0≤index<length. | Absent→undefined dans cas simple. | Prendre length pour dernier index. | Pour trois valeurs : 0, 1, 2. |
| mvp-040 | Manipuler un panier de trois prix. | Tableau, index, ajout, retrait et addition. | guided_project (blanks → ordering → trace) | Lire les trois prix et calculer le total, sans boucle. | Liste de taille connue et somme des trois éléments. | Oublier un article ou confondre total et moyenne. | Relis les trois positions; additionne leurs prix. |

### Module 6 — Boucles

| ID | Objectif débutant | Prérequis conceptuels | Interaction | Critère de correction | Théorie | Erreur fréquente | Indices |
|---|---|---|---|---|---|---|---|
| mvp-041 | Ordonner les étapes d’une boucle. | Initialisation, condition, mise à jour. | ordering | Initialiser→tester→corps→mise à jour→recommencer. | Test avant chaque tour. | Mettre à jour avant premier tour. | Condition décide si le tour commence. |
| mvp-042 | Relier parties de for à leurs rôles. | Variable et comparaison. | matching | Associer départ, condition, incrément. | Anatomie de for. | Confondre test et départ. | Test répond « encore ? »; incrément avance. |
| mvp-043 | Compléter mise à jour d’un while. | Condition et incrément. | blanks | Choisir ++ pour avancer vers arrêt. | while continue tant que condition vraie. | Décrémenter loin du seuil. | Quelle direction rend bientôt la condition fausse ? |
| mvp-044 | Tracer for-of et accumulateur, puis moyenne. | Tableau et addition. | trace | Suivre chaque élément une fois, sommer puis diviser par taille. | État conservé entre tours. | Réinitialiser total à chaque tour. | Note total après chaque élément; il persiste. |
| mvp-045 | Prévoir effet de break. | Ordre, condition et boucle. | trace | Exclure instructions après break et tours suivants. | Arrêt immédiat de boucle. | Inclure action située après break. | La lecture s’arrête à cette ligne. |
| mvp-046 | Diagnostiquer boucle infinie sans l’exécuter. | Condition d’arrêt et progression. | debug(selectline+replacement) | Remplacer mise à jour qui éloigne limite par progression vers elle. | Raisonnement statique seulement. | Lancer boucle ou ignorer direction. | Compare compteur et limite; ils doivent se rapprocher. |
| mvp-047 | Choisir borne sans tour hors tableau. | Index zéro et length. | choice(single) | Choisir i<length. | Limite exclue. | Employer <= et visiter length. | length n’est pas une position valide. |
| mvp-048 | Construire un filtre guidé. | Boucle, condition et ordre. | guided_project (classify → ordering → trace → choice) | Garder nombres strictement positifs dans l’ordre original. | Résultat sans trous; zéro exclu. | Inclure zéro ou trier. | Strictement positif >0; conserve l’ordre. |

### Module 7 — Objets et structures de données

| ID | Objectif débutant | Prérequis conceptuels | Interaction | Critère de correction | Théorie | Erreur fréquente | Indices |
|---|---|---|---|---|---|---|---|
| mvp-049 | Reconnaître objet et propriétés nommées. | Clé, valeur et collection. | matching | Relier clé à valeur correspondante. | Objet élémentaire. | Confondre clé avec index. | Une clé est nommée, pas position numérique. |
| mvp-050 | Lire et modifier les propriétés d’un objet. | Objet, clé, valeur et affectation. | blanks + trace | Choisir la propriété demandée et sa nouvelle valeur, puis lire l’objet modifié. | Accès par point, mise à jour, différence avec index de tableau. | Confondre nom de propriété et valeur. | Lis le nom situé après le point; suis la modification. |
| mvp-051 | Distinguer pile LIFO et file FIFO. | Ordre, premier et dernier, push/pop/shift. | matching + trace | Associer assiettes→pile et attente→file; prédire les éléments retirés. | Dernier entré premier sorti contre premier entré premier sorti. | Retirer du mauvais côté. | Pile : dessus; file : personne arrivée en premier. |
| mvp-052 | Ordonner création d’un ensemble sans doublons. | Tableau et égalité. | ordering | Set→unicité→conversion; ordre d’apparition conservé. | Set ne trie pas. | Croire que l’ordre change. | Il enlève répétitions, sans tri. |
| mvp-053 | Associer set/get/has à Map. | Clés et valeurs. | matching | set écrit; get lit; has vérifie présence. | Map élémentaire. | Utiliser get pour écrire. | Écrire, lire, vérifier. |
| mvp-054 | Corriger test qui rejette index 0. | indexOf et sentinelle -1. | debug(selectline+replacement) | Remplacer >0 par >=0 ou !==-1. | Zéro valide; -1 absent. | Traiter zéro comme absence. | Seul -1 signifie absent. |
| mvp-055 | Comparer visuellement croissance constante/linéaire. | Taille et parcours. | classify | Classer accès direct et parcours selon croissance du travail. | O(1)/O(n), avec décompte concret des opérations. | Lire Big O comme durée exacte. | Observe le changement quand la liste double. |
| mvp-056 | Assembler compteur de fréquences Map. | Map, valeur existante et incrément. | guided_project (matching → trace → ordering → choice) | Compter mots, garder ordre d’apparition et valider paires. | Fréquences sans code libre. | Réinitialiser compteur ou perdre ordre. | Lis compteur existant ou 0; ajoute 1. |

### Module 8 — Algorithmes

| ID | Objectif débutant | Prérequis conceptuels | Interaction | Critère de correction | Théorie | Erreur fréquente | Indices |
|---|---|---|---|---|---|---|---|
| mvp-057 | Distinguer entrée, sortie, règle et cas limite. | Contrat simple. | classify | Catégoriser chaque élément de l’énoncé. | Exemple ne définit pas tout le contrat. | Ignorer liste vide. | Qu’est-ce qui entre, sort, et que devient le cas limite ? |
| mvp-058 | Tracer un algorithme sans l’exécuter. | Affectation, boucle, accumulateur. | trace | Retrouver valeurs intermédiaires et total final. | Simulation papier. | Ajouter deux fois ou sauter tour. | Note total avant/après chaque valeur. |
| mvp-059 | Trouver maximum d’une liste négative. | Comparaison et liste. | trace | Retourner plus grande valeur présente, même négative. | Départ depuis première valeur; vide traité ensuite. | Initialiser à 0. | Le résultat doit appartenir à la liste. |
| mvp-060 | Ordonner inversion d’une chaîne ASCII. | Chaîne, tableau et ordre. | ordering | Découper→inverser→réunir sans séparateur. | Unicode mentionné simplement; exercice ASCII. | Inverser les mots ou ajouter séparateur. | Chaque caractère change de place; réunion sans séparateur. |
| mvp-061 | Détecter doublons par comparaison des tailles. | Longueur et Set. | choice(single) | Set plus petit que tableau signifie répétition. | Cardinalité, pas implémentation. | Croire qu’il faut trier. | Compare éléments totaux aux valeurs uniques. |
| mvp-062 | Déplacer le retour -1 après recherche entière. | Boucle, condition et retour anticipé. | debug(selectline+replacement) | Retour index dans boucle; absence après la boucle. | Recherche linéaire. | Renvoyer -1 au premier différent. | Absence certaine après le dernier élément. |
| mvp-063 | Réduire un intervalle de recherche dans une liste triée. | Comparaison, index, milieu et ordre. | trace | Choisir la moitié à conserver à chaque étape jusqu’à trouver la cible. | Liste triée obligatoire; comparaison au milieu; arrêt si cible trouvée. | Garder la mauvaise moitié ou utiliser une liste non triée. | Compare la cible au milieu avant d’écarter une moitié. |
| mvp-064 | Vérifier maximum avec vide, négatifs et doublons. | Contrat, trace et maximum. | guided_project (classify → trace → matching → choice) | Vide→null; sinon maximum réel. | Cas limites plutôt qu’un seul exemple. | Retourner zéro pour négatifs. | Traite vide d’abord; sinon démarre sur une valeur présente. |

### Module 9 — Git et travail en équipe

| ID | Objectif débutant | Prérequis conceptuels | Interaction | Critère de correction | Théorie | Erreur fréquente | Indices |
|---|---|---|---|---|---|---|---|
| mvp-065 | Relier besoins d’équipe aux fonctions Git. | Fichiers et versions. | matching | Associer historique, comparaison, branches à leurs usages. | Git local; distant partage historique. | Croire Git héberge ou exécute le site. | Git garde versions; distant permet partage. |
| mvp-066 | Ordonner changement, add et commit. | Fichier, index, historique. | ordering | Modification→git add→git commit. | add prépare; commit enregistre. | Confondre préparation et enregistrement. | add prépare; commit crée point d’historique. |
| mvp-067 | Lire lignes + et - d’un diff. | Avant/après. | matching | Associer signe à ajout/retrait et effet. | Contexte de lignes. | Lire diff comme commandes. | Compare ligne nouvelle et retirée avec contexte. |
| mvp-068 | Choisir commande de branche et nom court. | Commit, branche, nom descriptif. | choice(single) | Choisir git switch -c et nom court; rien n’est exécuté. | Branche = nom mobile vers commit. | Penser que l’activité lance shell. | -c crée; nom court décrit le changement. |
| mvp-069 | Ordonner PR, revue, contrôles et fusion. | Branche et diff. | ordering | Proposition→revue/tests→fusion. | Ouvrir PR n’effectue pas la fusion. | Confondre ouverture et intégration. | Revue avant fusion. |
| mvp-070 | Résoudre un conflit en respectant le résultat demandé. | Deux changements concurrents et contexte. | choice(single) | Choisir l’extrait qui conserve les deux changements requis sans aucun marqueur de conflit. | Comprendre chaque version puis construire la version finale. | Enlever les marqueurs en perdant une modification nécessaire. | Relis les deux besoins; la résolution doit satisfaire les deux. |
| mvp-071 | Choisir commentaire de revue précis et respectueux. | Contrat et cas limite. | choice(single) | Garder question vérifiable liée à un risque concret. | Revue du comportement, ton constructif. | Commentaire vague/personnel. | Relie remarque à un cas tel que tableau vide. |
| mvp-072 | Assembler workflow de branche à revue. | Branche, commit, push et PR. | guided_project (ordering → matching → choice) | Ordonner branche→changement→commit→push→PR→revue→fusion et expliquer rôles. | Étapes conceptuelles; aucun shell. | Fusionner avant revue ou oublier push. | PR rend le changement visible à l’équipe. |

### Module 10 — HTTP, JSON et APIs

| ID | Objectif débutant | Prérequis conceptuels | Interaction | Critère de correction | Théorie | Erreur fréquente | Indices |
|---|---|---|---|---|---|---|---|
| mvp-073 | Relier requête au serveur et réponse au client. | Client, serveur et échange. | matching | Associer acteurs et direction des flèches. | API comme contrat; droits côté serveur. | Croire que client autorise l’accès. | Client demande; serveur traite et répond. |
| mvp-074 | Identifier méthode, chemin, en-têtes et corps. | Ligne HTTP et champs. | classify | Classer chaque fragment dans le bon champ. | Anatomie élémentaire. | Lire chemin comme méthode. | GET vient d’abord et constitue la méthode. |
| mvp-075 | Choisir GET pour lire et POST pour envoyer. | Intention de requête. | choice(single) | Choisir POST pour soumettre une tentative. | Usages courants; autorisation toujours nécessaire. | Utiliser GET pour créer une donnée. | Lecture→GET; nouvelle donnée→POST. |
| mvp-076 | Classer les familles de statuts HTTP. | Entiers et plages. | classify | 2xx succès; 3xx redirection; 4xx requête; 5xx serveur. | Succès HTTP ≠ contenu métier valide. | Croire tout code >200 est succès. | Regarde premier chiffre. |
| mvp-077 | Lire propriété après analyse JSON. | Texte JSON, objet, propriété. | choice(single) | Choisir data.score après parse. | JSON.parse et types JSON de base. | Lire champ sur chaîne. | Après parse, data est un objet. |
| mvp-078 | Ordonner réception, analyse JSON, lecture de name. | Texte, objet et propriétés. | ordering | Texte→parse→accès name. | JSON.parse; texte invalide hors périmètre ici. | Faire json.name sur chaîne. | Propriété apparaît après transformation en objet. |
| mvp-079 | Relier CORS aux origines et en-têtes serveur. | Navigateur et échanges inter-origines. | matching | Origine=protocole+hôte+port; serveur annonce; navigateur applique. | CORS ne remplace pas auth/autorisation. | Croire CORS protège seul les données. | Serveur annonce les origines; navigateur applique. |
| mvp-080 | Diagnostiquer statut et structure d’une réponse par étapes. | 2xx, objets, tableaux, erreurs. | guided_project (classify → matching → ordering → choice) | Vérifier 2xx, vérifier body.items tableau, lire longueur; sinon 0. | Pas de réseau réel; statut et structure. | Lire length sans vérifier type ou ignorer statut. | Vérifie statut d’abord, puis tableau. |

## Décisions et limites

- La matrice remplace les contenus selon les déplacements acceptés. Le JSON source reste point de comparaison; aucun code de produit n’est changé ici.
- mvp-007 porte sur noms/casse; conversions vont en M2. mvp-020 assemble if sans return; fonctions en M4. mvp-049 introduit objets; listes chaînées retirées; lecture des objets en mvp-050; pile et file regroupées en mvp-051.
- Aucune fonction/return avant M4, aucun objet avant M7, aucune boucle avant M6; l’exception voulue est l’explication de mutation d’un tableau const en mvp-035.
- Projets de fin de module : mvp-008, 016, 024, 032, 040, 048, 056, 064, 072, 080. Étapes guidées réutilisent les familles structurées.
- Les corrections et clés exactes restent à définir dans le modèle serveur à l’étape 2. Cette matrice documente l’intention pédagogique.
- Auth, runner, moteur, données, routes et migrations ne sont pas implémentés par ce plan.
