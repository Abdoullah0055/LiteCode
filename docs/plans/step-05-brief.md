# Étape 5 — Authentification, onboarding unique et accueil illustré

Lire AGENTS.md, le plan/ledger et le code actuel avant modification. Next16 : consulter guides locaux de cookies, Server Actions et redirection. Ne pas déléguer, committer, pousser, déployer, écrire dans Supabase distant, afficher/modifier les secrets ou introduire Docker. Reprendre les tests existants et ceux des étapes2à4.

## Auth

- Accueil non connecté : Commencer→/auth?mode=signup. Inscription d’abord, puis confirmationemail sirequise, puis objectifs→langage→finish. Connexion habituelle→/home.
- Confirmationmotdepasse à l’inscription, contrôles clientETserveur, erreurs de champs accessibles. Ne pas imposer confirmation à la connexion ou récupération. Validation discriminée signup/login/reset; retirer fauxmotdepassecachépourreset.
- Ajouter user_settings.onboarding_step et onboarding_completed_at dans une NOUVELLE migration. Les comptes existants sont backfillcompleted (progrès conservés); les comptes créés ensuite ont completednull/étapeobjectives. Triggerprovisioning reste compatible, defaultsDBsuffisent. Migrationenregistrée et testsPGlitefresh+upgrade, pasappliquéeaucloud.
- Centraliser destinationpostauth, utiliséeparlogin/signupimmédiat/callbackemail/accueil/authdéjàconnecté. Un nouveaucompteinterrompureprendétapemanquante; unancien/completednereçoitplusonboarding. Pagesobjectives/languages/finish protégées et completed→home. Ne pas créer de boucle de redirection ni bloquer récupérationmotdepasse danssettings.
- Sauvegarder objectif/étape et langage côtéserveur à chaque transition; languages JavaScript actif, autresbientôt. Finish marque completedseulementaprèsCTAavecsuccès. Supprimer dépendance à localStorage global litecode-goal. Boutonsretourmodifientuniquementétapespermises; pasbesoinderefaireinscription. Échec sauvegarde ne faitpasavancerl’étape.

## Se souvenir de cet appareil

- Checkbox login/signup cochéepardéfaut : 'Se souvenir de cet appareil pendant 30 jours'. Préférence par navigateur, pasun paramètre partagé entre appareils dans la DB.
- Une fonction commune applique politique aux cookiesSupabase dans actions, callback et proxy : coché→maxAge30joursglissant; décoché→session sans maxAge/expires. La préférence est un cookieHttpOnly; tokenscookiesHttpOnly possibles car appserveronly (vérifier usages actuels). SameSiteLax, path/, SecureenHTTPS.
- Attention @supabase/ssr réécrit maxAgepardéfaut400jours : réappliquerpolitique dans setAll APRÈS optionslibrairie. Conserver maxAge0 pour suppressions/chunksPKCE; ne pas convertir suppressionen30jours. Aucunpassword/token localStorage.
- Déconnexion de cet appareil : signOut({ scope: 'local' }), puis effacer session locale et préférence. Ne pas révoquer les autres appareils. Callback sans préférence sur un autre navigateur : cookie de session; ne pas copier une préférence depuis user_metadata.
- Tests purs depolitique : persistant, session, suppression, chunks, Secure; testsactions/routing avecmocks ciblés et callbacks sanssuccèssimuléprésentécommelive. Browserrestore peut restaurer sessioncookie : documenterlimite sanspromettredéconnexionforcéeàfermeture.

## Finish illustré

- Refaire page 'C’est parti' dans univers exactwelcomepublic : robot existant public/mascot.svg, bleuclair/vert, nuages/chemin/décorcompositionCSSoriginale, titres forts et cartes arrondies. Pas besoinnouveaumédia externe ni générateurimage.
- Hero accueillant, phrasepersonnaliséeobjectif, cartevraipremiermodule et CTAunique 'Commencer mon parcours'. Si infos curriculum indisponibles, état clair plutôt que données XP inventées. Privilégier image assezgrande pourpagebienremplie sansécraserCTA sur375px.
- Extraire présentation pure réutilisable/testable siutile, actionsserveur restent séparées. Respecter375/390/430, safearea, mouvementsréduits et tactile44pxmin.
- Forme visuelledepagepasrépétéelorsconnexionshabituelles. Préférences restentéditablesdanssettings.

## Preuves

Documentation vérifiée par le contrôleur : https://supabase.com/docs/guides/auth/server-side/advanced-guide . L'application a @supabase/ssr0.8.0 : conserver explicitement Cache-Control private,no-store (les mécanismes supplémentaires décrits pour0.10 ne sont pas disponibles ici). Les cookies HttpOnly conviennent seulement tant qu'aucun client Supabase navigateur n'a besoin d'accéder aux tokens. Aucun changement de version de dépendance n'est demandé.

Testsunitaires+DB couvrantpasswordconfirm, destinationpostauth, onboardingpersistance/backfill, cookiesrefresh/logout. Lint,typecheck,tests pertinents. Les E2E publics doivent désormais attendre signup AVANTobjectives; adaptertestsdebase, les screenshots/authliveglobauxserontrevusétape7. Pas de testcloud sans gardeprojettestdédié. Rapport docs/plans/step-05-report.md aveccontrats, migrations, testsréellementlancés et limites.
