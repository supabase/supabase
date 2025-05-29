<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) er et open source-alternativ til Firebase. Vi bygger Firebase-funktioner ved hjælp af open source-værktøjer i virksomhedsklasse.

**Nøglefunktioner:**

- [x] **Administreret Postgres-database:** [Dokumentation](https://supabase.com/docs/guides/database)
- [x] **Godkendelse og autorisation:** [Dokumentation](https://supabase.com/docs/guides/auth)
- [x] **Automatisk genererede API'er:**
    - [x] REST: [Dokumentation](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Dokumentation](https://supabase.com/docs/guides/graphql)
    - [x] Realtidsabonnementer: [Dokumentation](https://supabase.com/docs/guides/realtime)
- [x] **Funktioner:**
    - [x] Databasefunktioner: [Dokumentation](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (funktioner i udkanten af netværket): [Dokumentation](https://supabase.com/docs/guides/functions)
- [x] **Fillagring:** [Dokumentation](https://supabase.com/docs/guides/storage)
- [x] **AI, vektorer og indlejringer (embeddings) værktøjer:** [Dokumentation](https://supabase.com/docs/guides/ai)
- [x] **Dashboard**

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Abonner på "releases" i dette repository for at modtage notifikationer om vigtige opdateringer. Dette giver dig mulighed for at holde dig ajour med de seneste ændringer og forbedringer.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Overvåg repository"/></kbd>

## Dokumentation

Fuld dokumentation er tilgængelig på [supabase.com/docs](https://supabase.com/docs). Der finder du alle de nødvendige vejledninger og referencematerialer.

Hvis du vil bidrage til udviklingen af projektet, skal du se afsnittet [Kom godt i gang](./../DEVELOPERS.md).

## Fællesskab og support

*   **Fællesskabsforum:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Ideel til at få hjælp til udvikling og diskutere bedste praksis for arbejde med databaser.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Brug til at rapportere fejl og problemer, du støder på, når du bruger Supabase.
*   **E-mail-support:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). Den bedste mulighed for at løse problemer med din database eller infrastruktur.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Et godt sted at dele dine applikationer og kommunikere med fællesskabet.

## Funktionsprincip

Supabase kombinerer flere open source-værktøjer. Vi bygger funktioner, der ligner Firebase, ved hjælp af gennemprøvede produkter i virksomhedsklasse. Hvis et værktøj eller et fællesskab eksisterer og har en MIT-, Apache 2- eller lignende åben licens, vil vi bruge og understøtte dette værktøj. Hvis et sådant værktøj ikke findes, opretter vi det selv og åbner dets kildekode. Supabase er ikke en nøjagtig kopi af Firebase. Vores mål er at give udviklere en bekvemmelighed, der kan sammenlignes med Firebase, men ved hjælp af open source-værktøjer.

**Arkitektur**

Supabase er en [administreret platform](https://supabase.com/dashboard). Du kan tilmelde dig og straks begynde at bruge Supabase uden at installere noget. Du kan også [installere din egen infrastruktur](https://supabase.com/docs/guides/hosting/overview) og [udvikle lokalt](https://supabase.com/docs/guides/local-development).

![Arkitektur](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Et objekt-relationelt databasesystem med mere end 30 års historie med aktiv udvikling. Det er kendt for sin pålidelighed, funktionalitet og ydeevne.
*   **Realtime:** En Elixir-server, der giver dig mulighed for at lytte til ændringer i PostgreSQL (indsættelser, opdateringer og sletninger) via websockets. Realtime bruger Postgres' indbyggede replikeringsfunktionalitet, konverterer ændringer til JSON og sender dem til autoriserede klienter.
*   **PostgREST:** En webserver, der forvandler din PostgreSQL-database til et RESTful API.
*   **GoTrue:** Et JWT-baseret API til administration af brugere og udstedelse af JWT-tokens.
*   **Storage:** Giver en RESTful grænseflade til administration af filer, der er gemt i S3, ved hjælp af Postgres til at administrere tilladelser.
*   **pg_graphql:** En PostgreSQL-udvidelse, der giver et GraphQL API.
*   **postgres-meta:** Et RESTful API til administration af din Postgres, der giver dig mulighed for at hente tabeller, tilføje roller, køre forespørgsler osv.
*   **Kong:** En cloud-native API-gateway.

#### Klientbiblioteker

Vi bruger en modulær tilgang til klientbiblioteker. Hvert underbibliotek er designet til at arbejde med et enkelt eksternt system. Dette er en af måderne at understøtte eksisterende værktøjer på.

(Tabel med klientbiblioteker, som i originalen, men med danske navne og forklaringer, hvor det er nødvendigt).

| Sprog                       | Klient Supabase                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Officielle⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Fællesskabsstøttede💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Badges

Du kan bruge disse badges til at vise, at din applikation er bygget med Supabase:

**Lys:**

![Lavet med Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Lavet med Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Lavet med Supabase" />
</a>
```

**Mørk:**

![Lavet med Supabase (mørk version)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Lavet med Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Lavet med Supabase" />
</a>
```

## Oversættelser

[Liste over oversættelser](./languages.md)
