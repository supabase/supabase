<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) is een open-source alternatief voor Firebase. We bouwen de functionaliteiten van Firebase met behulp van enterprise-grade open-source tools.

**Belangrijkste kenmerken:**

- [x] **Beheerde Postgres-database:** [Documentatie](https://supabase.com/docs/guides/database)
- [x] **Authenticatie en autorisatie:** [Documentatie](https://supabase.com/docs/guides/auth)
- [x] **Automatisch gegenereerde API's:**
    - [x] REST: [Documentatie](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Documentatie](https://supabase.com/docs/guides/graphql)
    - [x] Realtime-abonnementen: [Documentatie](https://supabase.com/docs/guides/realtime)
- [x] **Functies:**
    - [x] Databasefuncties: [Documentatie](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (functies aan de rand van het netwerk): [Documentatie](https://supabase.com/docs/guides/functions)
- [x] **Bestandsopslag:** [Documentatie](https://supabase.com/docs/guides/storage)
- [x] **AI, Vector en Embedding tools:** [Documentatie](https://supabase.com/docs/guides/ai)
- [x] **Dashboard**

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Abonneer je op de "releases" van deze repository om meldingen te ontvangen over belangrijke updates. Zo blijf je op de hoogte van de laatste wijzigingen en verbeteringen.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Repository volgen"/></kbd>

## Documentatie

De volledige documentatie is beschikbaar op [supabase.com/docs](https://supabase.com/docs). Daar vind je alle benodigde handleidingen en referentiemateriaal.

Als je wilt bijdragen aan het project, bekijk dan de sectie [Aan de slag](./../DEVELOPERS.md).

## Community en ondersteuning

*   **Communityforum:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Ideaal voor het krijgen van hulp bij de ontwikkeling en het bespreken van best practices voor databases.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Gebruik dit om bugs en fouten te melden die je tegenkomt bij het gebruik van Supabase.
*   **E-mailondersteuning:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). De beste optie voor problemen met je database of infrastructuur.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Een geweldige plek om je applicaties te delen en in contact te komen met de community.

## Hoe het werkt

Supabase combineert verschillende open-source tools. We bouwen functies die vergelijkbaar zijn met Firebase, met behulp van beproefde producten van enterprise-niveau. Als een tool of community bestaat en een MIT-, Apache 2- of vergelijkbare open licentie heeft, zullen we die tool gebruiken en ondersteunen. Als de tool niet bestaat, bouwen we deze zelf en maken we de broncode openbaar. Supabase is geen exacte kopie van Firebase. Ons doel is om ontwikkelaars een ervaring te bieden die vergelijkbaar is met Firebase, maar dan met behulp van open-source tools.

**Architectuur**

Supabase is een [beheerd platform](https://supabase.com/dashboard). Je kunt je aanmelden en Supabase direct gebruiken zonder iets te installeren. Je kunt ook [je eigen infrastructuur uitrollen](https://supabase.com/docs/guides/hosting/overview) en [lokaal ontwikkelen](https://supabase.com/docs/guides/local-development).

![Architectuur](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Een object-relationeel databasesysteem met meer dan 30 jaar actieve ontwikkeling. Het staat bekend om zijn betrouwbaarheid, functionaliteit en prestaties.
*   **Realtime:** Een Elixir-server waarmee je via websockets kunt luisteren naar PostgreSQL-wijzigingen (inserts, updates en deletes). Realtime gebruikt de ingebouwde replicatiefunctionaliteit van Postgres, converteert de wijzigingen naar JSON en stuurt deze naar geautoriseerde clients.
*   **PostgREST:** Een webserver die je PostgreSQL-database omzet in een RESTful API.
*   **GoTrue:** Een op JWT gebaseerde API voor het beheren van gebruikers en het uitgeven van JWT-tokens.
*   **Storage:** Biedt een RESTful interface voor het beheren van bestanden die zijn opgeslagen in S3, met behulp van Postgres voor het beheren van machtigingen.
*   **pg_graphql:** Een PostgreSQL-extensie die een GraphQL API biedt.
*   **postgres-meta:** Een RESTful API voor het beheren van je Postgres, waarmee je tabellen kunt ophalen, rollen kunt toevoegen, query's kunt uitvoeren, enz.
*   **Kong:** Een cloud-native API-gateway.

#### Clientbibliotheken

We gebruiken een modulaire aanpak voor de clientbibliotheken. Elke subbibliotheek is ontworpen om met één extern systeem te werken. Dit is een van de manieren waarop we bestaande tools ondersteunen.

(Tabel met clientbibliotheken, zoals in het origineel, maar met Nederlandse namen en uitleg waar nodig).

| Taal                       | Supabase-client                                                    | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Officieel⚡️**          |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Community-ondersteund💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Badges

Je kunt deze badges gebruiken om aan te geven dat je applicatie is gebouwd met Supabase:

**Licht:**

![Gemaakt met Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Gemaakt met Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Gemaakt met Supabase" />
</a>
```

**Donker:**

![Gemaakt met Supabase (donkere versie)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Gemaakt met Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Gemaakt met Supabase" />
</a>
```
## Vertalingen

[Lijst van vertalingen](./languages.md)
