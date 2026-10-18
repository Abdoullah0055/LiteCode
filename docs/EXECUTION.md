# Exécution et autorité de validation

## Chemin de confiance

1. Le navigateur envoie un code JavaScript ou des réponses à Next.js.
2. Next.js vérifie la session auprès de Supabase, les données avec Zod et les prérequis.
3. `begin_attempt` réserve une tentative (12/minute/utilisateur maximum) avant l’exécution.
4. Les QCM sont comparés aux clés privées. Le code est envoyé au service HTTP privé.
5. Le service lance un worker et un runtime QuickJS WASM neuf pour chaque cas.
6. La valeur retournée est extraite de la VM et comparée au résultat attendu **dans le
   processus hôte**, jamais par une assertion exposée au code de l’apprenant. Les cas
   qui exigent une copie vérifient aussi la préservation des arguments et l’identité
   de la référence retournée.
7. Next.js valide le format de la réponse, puis finalise la tentative et la récompense
   dans une transaction PostgreSQL. La contrainte unique empêche les XP doubles.

Le service n’accepte aucune connexion navigateur publique : secret Bearer de 32 caractères
minimum, pas de CORS. Le secret reste dans les processus Next.js et runner. Utiliser HTTPS
ou un réseau privé entre machines. Ne pas faire transiter ce secret sur Internet en HTTP.

## Limites appliquées

| Ressource | Limite |
|---|---|
| Code | 20 000 caractères |
| Corps HTTP du runner | 128 Ko |
| Nombre de cas par tentative | 12 |
| Heap QuickJS par cas | 16 Mio |
| Pile QuickJS | 256 Kio |
| Budget par cas | 200 ms, contrôlés par interruption QuickJS |
| Worker total | 5 secondes, puis terminaison |
| Heap V8 du worker | 96 Mio old generation + 16 Mio young generation |
| Résultat par cas | 16 000 caractères JSON |
| Concurrence service | 4 workers, puis HTTP 429 |
| Appel Next.js → service | 8 secondes |

Les erreurs de syntaxe, de calcul ou de limites deviennent des tests échoués. Une panne du
service devient une tentative `unavailable`, sans XP. Les erreurs réseau ne consomment pas
de cœur. Seules les tentatives `failed` sont comptées dans le budget quotidien.

## Ce qui est isolé

Le code de l’apprenant tourne dans un moteur JavaScript compilé en WebAssembly, sans
binding vers Node, le système de fichiers, le réseau, le DOM ou l’environnement du serveur.
`process`, `require` et `fetch` n’y existent pas. Aucun code apprenant n’est évalué dans le
processus Next.js ou PostgreSQL. Les tests privés ne sont pas concaténés au programme :
seuls les arguments sont transmis à `solve`, et les valeurs attendues restent côté hôte.

Le runtime est synchrone. Les projets sont des fonctions ou transformations JavaScript
guidées ; ils ne créent pas un serveur Node, un navigateur DOM ou un dépôt Git réel.
Python, SQL et les environnements serveur ne sont pas proposés comme exécutables.

## Limites de sécurité à connaître

WASM et QuickJS constituent la frontière d’exécution ; un worker apporte une limite de
durée et de heap, **pas une sandbox système à lui seul**. Le runner doit rester séparé
de Next.js, sans secrets Supabase, sous un compte système dédié et sans accès aux
fichiers sensibles. L’hôte doit limiter mémoire, CPU, processus et sorties réseau du
service. Maintenir Node et QuickJS à jour. Une vulnérabilité du moteur ou de WASM
reste un risque résiduel ; aucun moteur n’est une preuve d’absence de vulnérabilité.

Les tests déterministes vérifient une solution sur leurs cas, pas sa correction
mathématique pour toutes les entrées. Le MVP n’est pas une plateforme de certification
ou une compétition avec anti-triche avancée. Ne pas utiliser ses résultats comme preuve
formelle de compétence. Le service vérifie des valeurs ; il ne note pas le style du code.

## Lancement direct avec Node.js

Depuis la racine du projet :

```powershell
# Définir RUNNER_API_KEY dans l’environnement, puis :
npm ci
npm run runner
```

`RUNNER_API_KEY` doit correspondre au secret configuré côté Next.js. Par défaut, le
service écoute sur `127.0.0.1:4001`. Sur un hôte Node.js distant, lancer
`node runner/server.mjs` avec `RUNNER_HOST=0.0.0.0` et le `PORT` attribué par l’hôte.
Exposer une entrée HTTPS authentifiée et définir son adresse dans `RUNNER_URL` sur Vercel.
L’hébergement doit assurer les restrictions système et la supervision du processus.
Le lancement distant et ces restrictions restent à vérifier sur l’hôte choisi.

## Preuves disponibles

`tests/runner.test.ts` vérifie les succès, erreurs, types, boucles infinies, mémoire,
taille de sortie et absence d’APIs hôte. `tests/runner-http.test.ts` lance réellement le
service dans un autre processus et vérifie l’authentification et l’évaluation HTTP.
`tests/curriculum.test.ts` exécute tous les corrigés originaux contre tous leurs cas,
puis confirme qu’une implémentation vide ne réussit pas ces exercices.
