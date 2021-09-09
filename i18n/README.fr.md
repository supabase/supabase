<p align="center">
  <img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/web/static/supabase-light-rounded-corner-background.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io) est une alternative open source à Firebase. Nous développons les fonctionnalités de Firebase en utilisant des outils open source de qualité professionnelle.

- [x] Base de données Postgres hébergée
- [x] Abonnements en temps réel
- [x] Authentification et autorisation
- [x] API générées automatiquement
- [x] Tableau de bord
- [x] Stockage
- [ ] Fonctions (à venir)

## Documentation

Pour une documentation complète, visitez [supabase.io/docs](https://supabase.io/docs)

## Communauté et Support

- [Forum communautaire](https://github.com/supabase/supabase/discussions). Idéal pour : aide à la construction, discussion sur les meilleures pratiques en matière de bases de données.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Idéal pour : les bugs et les erreurs que vous rencontrez en utilisant Supabase.
- [Support par e-mail](https://supabase.io/docs/support#business-support). Idéal pour : les problèmes avec votre base de données ou votre infrastructure.

## Statut

- [x] Alpha : Nous testons Supabase avec un groupe fermé de clients.
- [x] Alpha publique : Tout le monde peut s'inscrire sur [app.supabase.io](<(https://app.supabase.io)>). Mais allez-y doucement, il y a quelques problèmes.
- [x] Bêta publique : Assez stable pour la plupart des cas d'utilisation hors entreprise
- [ ] Public : Prêt pour la production

Nous sommes actuellement en version bêta publique. Surveillez les "releases" de ce repo pour être informé des mises à jour majeures.

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Comment ça marche

Supabase est une combinaison d'outils open source. Nous développons les fonctionnalités de Firebase en utilisant des produits open source de qualité professionnelle. Si les outils et les communautés existent, avec une licence ouverte MIT, Apache 2 ou équivalente, nous utiliserons et soutiendrons cet outil. Si l'outil n'existe pas, nous le construisons et l'exploitons nous-mêmes. Supabase n'est pas une correspondance 1 à 1 de Firebase. Notre objectif est de donner aux développeurs une expérience similaire à celle de Firebase en utilisant des outils open source.

**Architecture actuelle**

Supabase est une [plateforme hébergée](https://app.supabase.io). Vous pouvez vous inscrire et commencer à utiliser Supabase sans rien installer. Nous sommes toujours en train de créer l'expérience de développement local - c'est maintenant notre objectif principal, ainsi que la stabilité de la plateforme.

![Architecture](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/) est un système de base de données relationnel-objet dont le développement actif depuis plus de 30 ans lui a valu une solide réputation de fiabilité, de robustesse des fonctionnalités et de performance.
- [Realtime](https://github.com/supabase/realtime) est un serveur Elixir qui vous permet d'écouter les insertions, mises à jour et suppressions PostgreSQL à l'aide de websockets. Supabase écoute la fonctionnalité de réplication intégrée de Postgres, convertit le flux d'octets de réplication en JSON, puis diffuse le JSON sur des websockets.
- [PostgREST](http://postgrest.org/) est un serveur web qui transforme votre base de données PostgreSQL en une API RESTful.
- [Storage](https://github.com/supabase/storage-api) fournit une interface RESTful pour gérer les fichiers stockés dans S3, en utilisant Postgres pour gérer les permissions.
- [postgres-meta](https://github.com/supabase/postgres-meta) est une API RESTful pour la gestion de votre Postgres, qui vous permet d'extraire des tables, d'ajouter des rôles, d'exécuter des requêtes, etc.
- [GoTrue](https://github.com/netlify/gotrue) est une API basée sur SWT pour gérer les utilisateurs et émettre des jetons SWT.
- [Kong](https://github.com/Kong/kong) est une passerelle API native cloud.

#### Bibliothèques clients

Notre bibliothèque client est modulaire. Chaque sous-bibliothèque est une implémentation autonome pour un seul système externe. C'est l'une des façons dont nous soutenons les outils existants.

- **`supabase-{lang}`**: Combine les bibliothèques et ajoute des enrichissements.
  - `postgrest-{lang}`: Bibliothèque client pour travailler avec [PostgREST](https://github.com/postgrest/postgrest)
  - `realtime-{lang}`: Bibliothèque client pour travailler avec [Realtime](https://github.com/supabase/realtime)
  - `gotrue-{lang}`: Bibliothèque client pour travailler avec [GoTrue](https://github.com/netlify/gotrue)

| Repo                  | Officiel                                         | Communauté                                                                                                                                                                                                                 |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust`                                                |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust`                                                |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust`                                                      |

<!--- Remove this list if you're traslating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## Traductions

- [Liste des traductions](/i18n/languages.md) <!--- Keep only the this-->

---

## Sponsors

[![New Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
