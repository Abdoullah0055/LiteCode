# Étape 4 — Auteur des 80 activités et publication reproductible

## Autorité

Lire AGENTS.md, la matrice corrigée dans 2026-10-18-learning-rework.md et les rapports02/03. Utiliser les modèles et contrats déjà implémentés, sans inventer un second moteur. Lire corpus/source et script actuels avant modification. Pas de délégation, commit, push, déploiement, Docker ou mutation de Supabase distant. Garder references/ inchangé et aucun texte/media freeCodeCamp repris.

## Contenu original : 80 activités réellement écrites

- Remplacer la source canonique curriculum/original.fr.json par les80activitésv2 et leurs métadonnées; conserver IDs, ordre10×8 et XP historiques exacts. Adapter le validateur de corpus et le générateur de seed. Supprimer le pilote isolé quand son contenu est intégré; les tests le lisent ensuite depuis le corpus. Un ancien script auteur ne doit pas pouvoir régénérer silencieusement lev1 : le mettre à jour ou le retirer.
- Respecter chaque sujet/interactivité de la matrice. Les projets sont uniquement008/016/024/032/040/048/056/064/072/080;004 est activité normale à plusieurs questions. 049objets;050lecture/mutationobjet;051pileETfile;063réduireintervallebinaire. 007noms/casse;040panier3prixsansboucle.
- Écrire chaque explication comme un enseignant pour18ansdébutant : titres utiles, paragraphes courts, termes définis, passagesstrong/inline-code, exemples très simples et sortie/trace annotée. Pas de paragraphegrisunique, pas de remplissage générique ou de templates textuels identiques pour les80concepts. Les helpers de sérialisation sont permis, le contenu pédagogique est spécifique à chaque activité.
- Adapter profondeur à difficulté : bref rappel pour exercice de consolidation, plus de développement pour concept nouveau ou subtil. Variables : nom, valeur, déclaration, affectation avant let/const; pas 'référence' en004. Fonctions/return enseignésàpartir025; bouclesàpartir041; objets049;consttableaumodifiable035 expliquéconcrètement sansintroduirejargonréférences.
- Enseigner dans la théorie tout outil nécessaire à sa question : interpolation016, copiearray036, paramètres026, accumulateur044, Map053/056, JSONparse077, origines079. Ne pas supposer que l’étudiant connaît spread, méthode, sentinelle, coercition, propriété ou API parce que le mot apparaît dans un code.
- Au moins un exemple avec résultat pour chaque concept enseigné; exemples supplémentaires/trace avant-après pour les concepts complexes. Pas d’exemple arbitrairement difficile ni Unicode inutile à060(ASCIIici).
- Questions non ambiguës, situations concrètes et distracteurs correspondant à erreurs plausibles. Ne pas donner systématiquement la bonne réponse à la même position ou laisser un ordering déjà correct par défaut. Traces : indiquer le code initial et le format attendu, permettre variantes raisonnables explicitement; casse sensible quand programmation l’exige. Réponses courtes mots/nombres bornés, jamais fonction complète.
- Chaque question a correction privée expliquant la règle et la cause probable d’erreur; chaque activité a indices progressifs et non une copie immédiate de la clé. Ne jamais conditionner l’achèvement à une simple auto-déclaration.
- Projets : étapes cohérentes qui appliquent compétences du module, critères concrets et validation serveur finale; pas seulement3QCM indépendants sans fil conducteur. Git et HTTP sont des scénarios d’interprétation explicitement sans shell ou requête réseau arbitraire.
- Conserver sourceURL/provenance/licence/modificationnotes mais pas leur bavardage dans les pages de pratique.

## Migration et seed

- Une nouvelle migration de CONTENU inclut les80activités, versions publiques et clés privées et active la version2 après insertions. Ajouter les cours/modules si base neuve et mettre à jour titres/concepts révisés. Ne pas modifier les migrations précédentes, ni les tables utilisateurs pour effacer/recalculer leurs acquis.
- Génération déterministe de supabase/seed.sql pour installation neuve et réapplication idempotente. Le même artefact de données doit produire migration et seed cohérents; documenter la commande. Supprimer les anciennes définitions publiques actives ou les laisser archivées avec version explicite, jamais deux sources actives contradictoires.
- Une version déjà publiée ne doit pas être remplacée silencieusement par un contenu ou des clés différents sous le même numéro : la réapplication identique passe, une modification requiert une nouvelle version. Prévoir cette garantie dans le générateur/SQL et un test, pour que409 et les tentatives épinglées gardent un sens.
- Vérifier progression/prérequis, absence de cycle, 8activitésparmodule, unicité, types publics ne contenant pas de clés; validateurs couvrent toutes les données nécessaires au moteur. Anciennes tentatives conservées/lisibles; XP/completionsidentiques aprèsmigrationetreseed.

## Vérification

- Tests de corpus80IDs,10modules8activités,projetsattendus,schémasversionnés,prérequis cohérents.
- Pour CHAQUE interaction des80activités, sa réponse correcte passe et une réponse incorrecte plausible, utilisant les IDs autorisés quand possible, échoue. Ne pas laisser un ancien test JS boucler sur zérocas et annoncer succès.
- Tests PGlite installationfresh + passagev1→v2avecutlisateurcomplétionsXPbrouillonhistorique + réapplicationseed. Vérifier le nombre de versions/activités privéespubliques et RLS.
- Lancer curriculum build, tests, typecheck/lint utiles. Si des tests runner historiques sont devenus obsolètes, adapter tests de curriculum maintenant et signaler les dépendances à retirerétape6.
- Rapport docs/plans/step-04-report.md : contenu, répartitionformats, tailles/profondeurs, tests, migrations/seedcommandes, limites. Ne pas prétendre avoir vérifié un déploiement ou Supabase Auth réel.
