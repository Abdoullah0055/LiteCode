# Correction et progression des activités

## Parcours de réponse

Le curriculum actif contient 80 activités versionnées. Le navigateur reçoit le texte, les exemples et la définition publique de chaque interaction. Il envoie les identifiants des réponses et la version affichée. Les clés attendues restent privées et ne sont pas envoyées avec l’activité. Après la correction serveur, l’API retourne le résultat, l’explication, le feedback applicable et les XP attribués.

Les interactions évaluées sont le choix simple ou multiple, l’association, le classement, la remise en ordre, les textes à trous, la trace de valeurs et le débogage par sélection d’une ligne et d’un remplacement proposé. Les 10 projets guidés assemblent plusieurs de ces mêmes interactions en étapes ordonnées. Le projet reste un seul élément de progression.

À la soumission d’un exercice, le serveur vérifie la session, les prérequis, les champs attendus et la version active, puis corrige les réponses avec les clés privées. Le résultat et les XP viennent du serveur; le client ne peut pas déclarer une activité réussie ou choisir une récompense. Une version obsolète reçoit HTTP 409 afin que l’activité soit rechargée.

Aucun code rédigé par l’apprenant n’est exécuté. Le code de cours est du contenu affiché. Les exercices Git, HTTP et réseau demandent d’interpréter des données ou des exemples; ils ne lancent ni shell ni requête réseau fournie par l’utilisateur.

## Projets, brouillons et versions

Chaque étape de projet est soumise et corrigée séparément. Sa sauvegarde enregistre la réponse et le résultat, mais ne crée pas de tentative terminée et ne verse pas de XP. Le serveur interdit de sauter une étape. Une modification invalide l’autorisation finale et les réponses dépendantes qui ne sont plus valides.

Le brouillon est associé au compte, à l’activité et à sa version. Il peut contenir des réponses partielles et l’étape courante; l’interface fusionne les étapes déjà enregistrées avec ce brouillon à la reprise. Une réponse modifiée invalide cette étape et les suivantes. Un brouillon d’une ancienne version n’est pas soumis comme s’il correspondait au contenu actuel.

À la finalisation du projet, le serveur recharge et regrade toutes les étapes contre les clés privées actuelles. Il termine le projet seulement si toutes les étapes sont valides et correctes. La récompense n’est accordée qu’à cette réussite finale. Les tentatives rejouées restent possibles, mais une activité déjà récompensée ne rapporte pas une seconde fois ses XP. Les changements sont protégés contre les doublons concurrents par les contraintes et RPC PostgreSQL.

## XP, série et badges

Les XP d’une activité ne sont versés qu’une fois par compte et activité. Une nouvelle réussite de la même activité rapporte donc 0 XP additionnel. Toute activité réussie, y compris une reprise sans nouvelle récompense, met à jour la série : une réussite pendant chaque journée UTC consécutive l’entretient; une journée sans réussite remet la série à 1 lors de la prochaine réussite.

Les badges sont attribués d’après le nombre d’activités distinctes terminées, avec les seuils 1, 8, 20 et 80. Les sauvegardes d’étapes d’un projet ne comptent pas comme une complétion; seule sa finalisation réussie termine l’activité.

Les versions publiées sont immuables. Un changement de contenu se fait dans une nouvelle version; une tentative historique garde son résultat sauvegardé et n’est pas réévaluée avec les nouvelles clés. La migration de contenu v2 ajoute le corpus et active ses versions sans remettre à zéro les données historiques. Les migrations locales de LiteCode sont testées avec PGlite; elles n’ont pas été appliquées au projet Supabase hébergé.

## Portée de l’évaluation

La correction déterministe mesure si une réponse correspond aux options attendues pour cette activité. Une réussite confirme les réponses évaluées dans ce format; elle ne prouve pas la maîtrise générale de JavaScript, la capacité à écrire un programme complet, une solution libre équivalente ou une compétence professionnelle. La correction n’évalue pas le style de code et ne remplace pas un projet de programmation exécuté.

Les exemples, indices et corrections guident la compréhension. Les clés ne sont pas envoyées au navigateur. Les anciennes tentatives restent consultables depuis leur instantané de résultat. Une version v2 manquante ou illisible nécessite la mise à jour des migrations et du contenu; LiteCode n’active pas un ancien éditeur ou un ancien mécanisme d’exécution comme solution de repli.

Pour la source et la structure des 80 activités, voir [CONTENT.md](CONTENT.md). Pour les commandes de préparation de la base et les preuves de vérification, voir [README.md](../README.md) et [IMPLEMENTATION_REPORT.md](../IMPLEMENTATION_REPORT.md).
