<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) est une alternative open source à Firebase. Nous construisons les fonctionnalités de Firebase en utilisant des outils open source de niveau entreprise.

**Fonctionnalités clés :**

- [x] **Base de données Postgres gérée :** [Documentation](https://supabase.com/docs/guides/database)
- [x] **Authentification et autorisation :** [Documentation](https://supabase.com/docs/guides/auth)
- [x] **API générées automatiquement :**
    - [x] REST : [Documentation](https://supabase.com/docs/guides/api)
    - [x] GraphQL : [Documentation](https://supabase.com/docs/guides/graphql)
    - [x] Abonnements en temps réel : [Documentation](https://supabase.com/docs/guides/realtime)
- [x] **Fonctions :**
    - [x] Fonctions de base de données : [Documentation](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (fonctions à la périphérie du réseau) : [Documentation](https://supabase.com/docs/guides/functions)
- [x] **Stockage de fichiers :** [Documentation](https://supabase.com/docs/guides/storage)
- [x] **Outils d'IA, vecteurs et intégrations (embeddings) :** [Documentation](https://supabase.com/docs/guides/ai)
- [x] **Tableau de bord**

![Tableau de bord Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Abonnez-vous aux "releases" de ce dépôt pour recevoir des notifications sur les mises à jour importantes. Cela vous permettra de rester informé des dernières modifications et améliorations.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Surveiller le dépôt"/></kbd>

## Documentation

La documentation complète est disponible sur [supabase.com/docs](https://supabase.com/docs). Vous y trouverez tous les guides et documents de référence nécessaires.

Si vous souhaitez contribuer au développement du projet, consultez la section [Pour commencer](./../DEVELOPERS.md).

## Communauté et support

*   **Forum de la communauté :** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Idéal pour obtenir de l'aide sur le développement et discuter des meilleures pratiques pour travailler avec des bases de données.
*   **Problèmes GitHub :** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Utilisez-le pour signaler les bogues et les problèmes que vous rencontrez lors de l'utilisation de Supabase.
*   **Support par e-mail :** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). La meilleure option pour résoudre les problèmes liés à votre base de données ou à votre infrastructure.
*   **Discord :** [https://discord.supabase.com](https://discord.supabase.com). Un excellent endroit pour partager vos applications et communiquer avec la communauté.

## Principe de fonctionnement

Supabase combine plusieurs outils open source. Nous construisons des fonctionnalités similaires à Firebase en utilisant des produits éprouvés de niveau entreprise. Si un outil ou une communauté existe et possède une licence MIT, Apache 2 ou une licence ouverte similaire, nous utiliserons et prendrons en charge cet outil. Si un tel outil n'existe pas, nous le créerons nous-mêmes et ouvrirons son code source. Supabase n'est pas une réplique exacte de Firebase. Notre objectif est de fournir aux développeurs une commodité comparable à Firebase, mais en utilisant des outils open source.

**Architecture**

Supabase est une [plateforme gérée](https://supabase.com/dashboard). Vous pouvez vous inscrire et commencer immédiatement à utiliser Supabase, sans rien installer. Vous pouvez également [déployer votre propre infrastructure](https://supabase.com/docs/guides/hosting/overview) et [développer localement](https://supabase.com/docs/guides/local-development).

![Architecture](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL :** Un système de gestion de base de données relationnelle objet avec plus de 30 ans d'histoire de développement actif. Il est connu pour sa fiabilité, ses fonctionnalités et ses performances.
*   **Realtime :** Un serveur Elixir qui vous permet d'écouter les modifications de PostgreSQL (insertions, mises à jour et suppressions) via des websockets. Realtime utilise la fonctionnalité de réplication intégrée de Postgres, convertit les modifications en JSON et les transmet aux clients autorisés.
*   **PostgREST :** Un serveur web qui transforme votre base de données PostgreSQL en une API RESTful.
*   **GoTrue :** Une API basée sur JWT pour gérer les utilisateurs et émettre des jetons JWT.
*   **Storage :** Fournit une interface RESTful pour gérer les fichiers stockés dans S3, en utilisant Postgres pour gérer les autorisations.
*   **pg_graphql :** Une extension PostgreSQL qui fournit une API GraphQL.
*   **postgres-meta :** Une API RESTful pour gérer votre Postgres, vous permettant d'obtenir des tables, d'ajouter des rôles, d'exécuter des requêtes, etc.
*   **Kong :** Une passerelle d'API native du cloud.

#### Bibliothèques clientes

Nous utilisons une approche modulaire pour les bibliothèques clientes. Chaque sous-bibliothèque est conçue pour fonctionner avec un seul système externe. C'est l'une des façons de prendre en charge les outils existants.

(Tableau avec les bibliothèques clientes, comme dans l'original, mais avec des noms en français et des explications, si nécessaire).

| Langue                       | Client Supabase                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Officielles⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Maintenues par la communauté💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Badges

Vous pouvez utiliser ces badges pour montrer que votre application est construite avec Supabase :

**Clair :**

![Fait avec Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Fait avec Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Fait avec Supabase" />
</a>
```

**Sombre :**

![Fait avec Supabase (version sombre)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Fait avec Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Fait avec Supabase" />
</a>
```

## Traductions

[Liste des traductions](./languages.md)
