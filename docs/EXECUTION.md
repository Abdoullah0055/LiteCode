# Validation des activités structurées

## Parcours de validation

1. Le navigateur envoie une version d’activité et des réponses structurées.
2. Next.js vérifie la session, les prérequis, le format et la version courante.
3. Le serveur charge la définition publique et les clés de correction privées depuis Supabase.
4. Une correction déterministe compare les réponses aux clés. Les formats sont choix,
   associations, classements, remises en ordre, textes à trous, traces et corrections
   de code guidées.
5. Pour un projet, chaque étape est corrigée séparément; la validation finale revérifie
   toutes les étapes enregistrées avant de créer la tentative.
6. Les résultats sont enregistrés dans une transaction PostgreSQL. La contrainte unique
   protège les XP contre les doublons.

Aucun code fourni par l’apprenant n’est exécuté. Les exemples JavaScript du cours sont
affichés comme texte. Git, HTTP et les autres sujets sont étudiés par interprétation et
simulation structurée; aucune commande shell ni requête réseau arbitraire n’est lancée.

## Portée de la correction

Les réponses sont validées contre des clés privées et des définitions versionnées.
Une activité réussie indique que les réponses attendues ont été reconnues; elle ne prouve
pas une compétence générale, une solution libre équivalente ni une maîtrise professionnelle.
La correction n’évalue pas le style ou un programme complet.

La soumission est liée à la version publiée de l’activité. Si le contenu a changé, le
serveur refuse l’ancienne version et demande de recharger. Un brouillon structuré n’est
repris que s’il correspond encore à cette version. L’historique des tentatives garde ses
résultats sauvegardés; les anciennes soumissions ne sont jamais réévaluées.

## Tentatives et progression

Le serveur contrôle l’identité, les prérequis et le nombre de tentatives. Les clés ne sont
pas envoyées avec l’activité; les retours pédagogiques sont affichés après vérification.
Une réussite attribue les XP une seule fois
par activité, même si elle est reprise; les reprises restent possibles sans XP additionnels.
Les projets sauvegardent et valident chaque étape, puis accordent la récompense après une
validation finale complète. La progression et les résultats sont enregistrés dans Supabase.

Une activité sans contenu structuré publié demande une mise à jour de la base : appliquer
les migrations du projet et charger le seed du curriculum v2. L’interface ne réactive pas
l’ancien éditeur ou les anciennes validations dans cet état.
