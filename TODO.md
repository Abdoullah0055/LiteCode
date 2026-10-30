# TODO — LiteCode

Mis à jour : 30 octobre 2026.

Ce fichier regroupe le travail restant autour de trois sujets : la fiabilité des
comptes et des courriels, le test de positionnement à l’inscription, puis
l’optimisation des requêtes et du rendu. Les cases `[x]` décrivent un travail
fait localement mais pas nécessairement déployé ni vérifié sur le projet
Supabase hébergé.

## Légende

- `[ ]` à faire
- `[~]` en cours
- `[x]` fait localement
- `[!]` dépend d’une action externe (tableau de bord Supabase, DNS, Vercel)

## 1. Priorité 0 — Création de compte et courriels

### 1.1 Correctif applicatif

- [x] Gérer le cas où Supabase réécrit l’URL de redirection vers le Site URL :
      les jetons arrivent alors dans le fragment `#access_token=...`. Un
      composant client les envoie à `/api/auth/session`, qui crée la session
      avec la politique de cookies existante.
- [x] Accepter aussi `?code=` et `?token_hash=` arrivés à la racine et les
      transmettre à `/auth/confirm`.
- [x] Détecter un compte déjà confirmé (`identities.length === 0`) et afficher
      un message utile au lieu de promettre un courriel qui n’a pas été envoyé.
- [x] Ajouter « Renvoyer le courriel de confirmation » sur l’écran de
      confirmation, avec gestion de la limite d’envoi.
- [x] Mapper les erreurs d’inscription courantes (adresse invalide, inscription
      fermée, mot de passe faible, limite d’envoi).
- [x] Tester le parseur de fragment, la route de session et les actions
      d’inscription/renvoi.
- [ ] Vérifier le parcours complet sur le projet hébergé avec un compte de test
      dédié, puis supprimer ce compte.
- [ ] Vérifier le parcours de récupération de mot de passe : le lien doit
      ouvrir `/settings` avec une session valide.
- [ ] Vérifier le comportement dans un second navigateur : un lien token hash
      doit fonctionner, un lien PKCE peut échouer si le vérificateur de code
      n’est pas présent.
- [ ] Vérifier le rendu du bouton de renvoi à 375 px et en mode sombre.

### Constat de diagnostic (30 octobre 2026)

Un lien de confirmation généré pour le projet hébergé demandait
`/auth/confirm?next=onboarding`, mais Supabase l’a réécrit vers
`https://litecode-mu.vercel.app` (le Site URL) et a renvoyé les jetons dans le
fragment `#access_token=...&refresh_token=...&type=signup`. Le serveur ne voyait
donc jamais la confirmation et l’apprenant restait déconnecté. La cause est
l’absence de `/auth/confirm` dans les Redirect URLs autorisées; le correctif
applicatif rattrape ce cas, mais la configuration reste à corriger.

### 1.2 Configuration hébergée `[!]`

- [ ] Dans **Authentication → URL Configuration**, définir le Site URL canonique
      de production, sans chemin.
- [ ] Ajouter les Redirect URLs exactes :
      - `https://TON_DOMAINE/auth/confirm`
      - `http://127.0.0.1:3000/auth/confirm`
      - `http://127.0.0.1:3107/auth/confirm`
      - `http://127.0.0.1:3108/auth/confirm` si ce port est utilisé
- [ ] Configurer les modèles de confirmation et de récupération pour pointer
      vers `/auth/confirm` avec `token_hash` et `type`, sans dépendre du
      fragment.
- [ ] Configurer un SMTP de production (Resend, Brevo, Postmark, etc.) et
      vérifier le domaine expéditeur, SPF et DKIM.
- [ ] Remplacer le SMTP intégré de Supabase, limité à environ deux courriels
      par heure, avant toute mise en service publique.
- [ ] Vérifier la réception réelle dans Gmail, Outlook et un client mobile.
- [ ] Documenter la procédure de rotation de la clé service role.
- [ ] Une fois les Redirect URLs et les modèles token hash configurés, limiter
      ou retirer le rattrapage du fragment `#access_token`. Le flux implicite
      est vulnérable au session fixation : un lien malveillant pourrait
      connecter la victime au compte de l’attaquant. Le flux PKCE ou token hash
      est préférable.

### Critères d’acceptation

- Une inscription avec confirmation active reçoit un courriel.
- Le lien du courriel ouvre LiteCode avec une session, puis l’onboarding.
- Un lien expiré affiche un message clair et permet de renvoyer le courriel.
- Une adresse déjà utilisée ne produit pas de faux message « vérifie ton
  courriel ».
- Aucun jeton n’est journalisé, persisté en clair ou exposé dans une URL après
  la création de la session.

## 2. Test de positionnement après la création de compte

### 2.1 Objectif

Après la confirmation du courriel et avant ou juste après l’onboarding,
proposer un test court qui estime le niveau JavaScript de l’apprenant. Les
activités plus faciles que son niveau sont marquées comme terminées pour
éviter de lui faire recommencer les bases, sans gonfler artificiellement les XP,
la série ou les badges.

### 2.2 Parcours utilisateur

- [ ] Ajouter une étape « Évalue ton niveau » entre `finish` et `complete`, ou
      une entrée « Je connais déjà les bases » sur l’écran de fin d’onboarding.
- [ ] Proposer « Je débute » pour ignorer le test et commencer au module 1.
- [ ] Afficher 6 à 8 questions courtes, une par écran, avec progression et
      possibilité d’abandonner.
- [ ] Mélanger les formats déjà corrigés côté serveur : choix, association,
      texte à trous, trace de valeurs.
- [ ] Rendre le test adaptatif : commencer au palier intermédiaire, monter ou
      descendre selon les réponses, avec un maximum de questions.
- [ ] Afficher un résultat lisible : « Tu peux commencer au module 4 » avec un
      bouton pour revoir le parcours et un bouton pour repasser le test.
- [ ] Ne jamais déverrouiller un module sans avoir appliqué le résultat côté
      serveur.

### 2.3 Barème et niveaux proposés

| Palier | Modules | Niveau | Décision |
|---|---|---|---|
| 0 | 1–2 | Débutant | tout garder à faire |
| 1 | 3–4 | Bases solides | modules 1–2 marqués terminés |
| 2 | 5–6 | Intermédiaire | modules 1–4 marqués terminés |
| 3 | 7–8 | Avancé | modules 1–6 marqués terminés |
| 4 | 9–10 | Expert | modules 1–8 marqués terminés |

- [ ] Valider le seuil de réussite par palier (par exemple 3 bonnes réponses
      consécutives) avec des données réelles, pas seulement à l’intuition.
- [ ] Prévoir un niveau maximal : ne jamais marquer le module 9 ou 10 comme
      terminé automatiquement.
- [ ] Garder le module 10 et les projets finaux à faire dans tous les cas.

### 2.4 Données et migration

- [ ] Ajouter une migration additive :
      - `user_settings.placement_level integer`
      - `user_settings.placement_score integer`
      - `user_settings.placement_completed_at timestamptz`
      - `user_settings.placement_answers jsonb`
- [ ] Ajouter `user_progress.completion_source text` avec
      `check (completion_source in ('exercise', 'project', 'placement'))`.
- [ ] Créer une RPC `apply_placement(p_user, p_level, p_answers)` :
      - verrouiller la ligne du profil ;
      - refuser un second appel si `placement_completed_at` est déjà rempli ;
      - vérifier que le niveau est dans la plage autorisée ;
      - insérer les lignes `user_progress` manquantes avec
        `completed_at = now()` et `completion_source = 'placement'` ;
      - ne pas insérer de `user_xp_events` ;
      - ne pas toucher à `user_streaks` ni à `user_achievements` ;
      - retourner le nombre d’activités marquées et la destination.
- [ ] Ajouter les index nécessaires :
      `user_progress(user_id, completion_source)`,
      `user_progress(user_id, completed_at)`.
- [ ] Rendre la RPC idempotente et service-role uniquement, avec un contrôle
      d’origine côté route serveur.
- [ ] Adapter `finish_attempt` et le calcul des badges pour exclure
      `completion_source = 'placement'` si les activités sautées ne doivent pas
      compter dans les seuils.
- [ ] Distinguer visuellement dans le parcours les activités validées par le
      test (par exemple une coche différente) sans les confondre avec un
      exercice réellement résolu.

### 2.5 Règles de progression à trancher

- [ ] Les activités marquées par le test comptent-elles dans « 80 activités
      terminées » ? Recommandation : oui pour l’affichage du parcours, non pour
      les XP et les badges.
- [ ] Les projets guidés des modules sautés doivent-ils être marqués terminés ?
      Recommandation : oui, avec `completion_source = 'placement'`, car ils
      sont en dessous du niveau détecté.
- [ ] Un apprenant peut-il repasser le test pour monter de niveau ? Oui, mais
      jamais pour redescendre ni pour déverrouiller plus que le niveau calculé.
- [ ] Un apprenant peut-il remettre à zéro son placement ? Oui, via les
      paramètres, avec confirmation explicite.
- [ ] Que se passe-t-il si le test est abandonné ? Aucune progression n’est
      marquée ; l’apprenant reprend au module 1.
- [ ] Les prérequis doivent-ils être recalculés après le placement ? Oui :
      marquer les modules dans l’ordre et vérifier `isUnlocked` sur le module
      suivant.

### 2.6 Sécurité et intégrité

- [ ] Corriger les réponses du test côté serveur, jamais dans le navigateur.
- [ ] Ne pas réutiliser les clés privées des exercices dans le contenu public.
- [ ] Limiter les tentatives (par exemple 3 par heure et par compte).
- [ ] Refuser un niveau fourni directement par le client.
- [ ] Vérifier que la RPC ne peut pas être appelée avec le rôle `authenticated`
      depuis le navigateur.
- [ ] Ajouter un test PGlite qui prouve qu’aucun XP, streak ni badge n’est créé
      par le placement.

### 2.7 Tests

- [ ] Tests unitaires du calcul de niveau et des seuils.
- [ ] Tests de la RPC : premier appel, second appel refusé, niveau invalide,
      prérequis, idempotence.
- [ ] Test d’intégration : un compte neuf passe le test, obtient le bon nombre
      d’activités terminées et peut ouvrir le module suivant.
- [ ] Test E2E : inscription → confirmation → test → parcours.
- [ ] Test d’accessibilité : navigation clavier, annonces de progression,
      contraste, réduction des animations.
- [ ] Test de non-régression : un compte existant avec de la progression garde
      ses données.

### 2.8 Découpage conseillé

1. Migration et RPC, avec tests PGlite.
2. Écran de test et correction serveur.
3. Application du résultat et mise à jour du parcours.
4. Textes, accessibilité et tests E2E.
5. Recette sur un projet Supabase de test.

## 3. Optimisation

### 3.1 Requêtes Supabase

- [ ] `learningData` charge actuellement toutes les colonnes de `lessons`,
      y compris `body`, `example` et `instructions` pour les 80 activités.
      Sélectionner uniquement les métadonnées nécessaires au parcours
      (`id`, `module_id`, `title`, `type`, `position`, `xp`,
      `duration_minutes`) et charger le détail d’une activité à la demande.
- [ ] Créer une vue ou une fonction `curriculum_outline` pour le parcours et la
      page d’accueil.
- [ ] Sur la page d’une activité, éviter `learningData()` complet : charger la
      leçon ciblée, ses prérequis et sa version active en une requête.
- [ ] Remplacer le chargement de tous les `user_xp_events` par une agrégation
      (`sum(amount)`) ou une vue `user_stats`.
- [ ] Utiliser `count: "exact", head: true` pour les compteurs de badges et de
      progression quand seuls les nombres sont utiles.
- [ ] Construire des `Map` d’activités terminées et de prérequis au lieu de
      filtrer les tableaux à chaque module.
- [ ] Mettre en cache la partie curriculum, indépendante de l’utilisateur, avec
      une invalidation explicite après migration ou seed.
- [ ] Vérifier les index existants et ajouter ceux qui manquent :
      `user_progress(user_id, completed_at)`,
      `user_progress(user_id, completion_source)`,
      `lessons(module_id, position)`,
      `learning_project_step_results(user_id, version_id, project_id, position)`.
- [ ] Analyser les requêtes lentes avec `EXPLAIN (ANALYZE, BUFFERS)` sur une
      copie de données réaliste.

### 3.2 Réseau et rendu

- [ ] Le proxy appelle `getUser()` sur chaque requête protégée. Mesurer le coût
      et éviter l’appel réseau pour les pages publiques et les assets.
- [ ] Vérifier que les pages publiques peuvent être mises en cache sans cookie
      de session.
- [ ] Charger Prism uniquement sur les pages qui affichent du code, ou
      pré-calculer le HTML sur le serveur.
- [ ] Évaluer une alternative plus légère à Prism si le bundle reste lourd.
- [ ] Utiliser `next/font` si une police locale est ajoutée, avec
      `display: swap` et préchargement maîtrisé.
- [ ] Optimiser les images : `sizes`, formats modernes, éviter `priority` sur
      les images qui ne sont pas le LCP.
- [ ] Ajouter des frontières `Suspense` sur les blocs lents pour afficher le
      contenu utile plus tôt.
- [ ] Mesurer le bundle avec `@next/bundle-analyzer` et documenter les plus
      gros modules.
- [ ] Vérifier le rendu mobile 375/390/430 px après chaque optimisation.

### 3.3 Données et coûts

- [ ] Éviter la duplication entre `lessons` et `lesson_versions` pour les
      colonnes utilisées uniquement par le parcours.
- [ ] Définir une politique de rétention des `exercise_attempts` et des
      résultats de projet.
- [ ] Vérifier les quotas Supabase (lignes, egress, requêtes) et les alertes de
      facturation.
- [ ] Prévoir un mode « données de démonstration » sans écrire en production.

### 3.4 Mesure et garde-fous

- [ ] Ajouter les Web Vitals et un tableau de bord simple (LCP, INP, CLS).
- [ ] Ajouter des budgets de performance dans la CI.
- [ ] Vérifier Lighthouse mobile sur l’accueil, le parcours et une activité.
- [ ] Journaliser les erreurs serveur sans données personnelles.
- [ ] Documenter les requêtes avant/après avec des chiffres, pas seulement des
      impressions.

## 4. Autres chantiers utiles

- [ ] Suppression de compte et export des données (RGPD).
- [ ] Modèles de courriel versionnés dans `supabase/templates/` pour le local.
- [ ] CI qui exécute `typecheck`, `lint`, `test`, `test:db` et le build.
- [ ] Recette E2E live sur un projet de test dédié, avec nettoyage du compte.
- [ ] Audit d’accessibilité (clavier, lecteur d’écran, contraste, mouvement).
- [ ] Vérifier le comportement hors ligne et la reprise des brouillons.
- [ ] Préparer un vrai déploiement Vercel avec les variables publiques définies
      avant le build.
- [ ] Nettoyer les variables `RUNNER_URL` et `RUNNER_API_KEY` obsolètes de
      `.env.local` : le runner a été retiré et `.env.example` ne les déclare
      plus.
- [ ] Relire les textes français et les messages d’erreur avec une personne
      non technique.

## 5. Ordre recommandé

1. Terminer la recette compte/courriel sur le projet hébergé.
2. Appliquer la migration et la RPC du test de positionnement.
3. Construire l’écran de test et le résultat.
4. Optimiser `learningData` et la page d’une activité.
5. Ajouter les mesures de performance et la CI.

## 6. Vérifications locales du 30 octobre 2026

- `npm run typecheck` : réussi.
- `npm test` : 79 tests dans 18 fichiers, réussis.
- `npm run lint` : réussi.
- `npm run build` : réussi; `/api/auth/session` est bien une route dynamique.
- Diagnostic Supabase : lecture seule des utilisateurs et génération de liens
  de test, avec suppression des comptes de diagnostic. Aucun courriel réel n’a
  été envoyé par ces contrôles.
- Non exécuté : recette complète sur le projet hébergé, livraison réelle d’un
  courriel, configuration SMTP et Redirect URLs, déploiement.
