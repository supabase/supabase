<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) er et åpen kildekode-alternativ til Firebase. Vi bygger Firebase-funksjoner ved hjelp av åpen kildekode-verktøy i enterprise-klassen.

**Nøkkelfunksjoner:**

- [x] **Administrert Postgres-database:** [Dokumentasjon](https://supabase.com/docs/guides/database)
- [x] **Autentisering og autorisasjon:** [Dokumentasjon](https://supabase.com/docs/guides/auth)
- [x] **Automatisk genererte API-er:**
    - [x] REST: [Dokumentasjon](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Dokumentasjon](https://supabase.com/docs/guides/graphql)
    - [x] Sanntidsabonnementer: [Dokumentasjon](https://supabase.com/docs/guides/realtime)
- [x] **Funksjoner:**
    - [x] Databasefunksjoner: [Dokumentasjon](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (funksjoner på kanten av nettverket): [Dokumentasjon](https://supabase.com/docs/guides/functions)
- [x] **Fillagring:** [Dokumentasjon](https://supabase.com/docs/guides/storage)
- [x] **AI, Vektor og Embedding verktøy:** [Dokumentasjon](https://supabase.com/docs/guides/ai)
- [x] **Dashbord**

![Supabase Dashbord](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Abonner på "releases" i dette depotet for å motta varsler om viktige oppdateringer. Dette vil tillate deg å holde deg oppdatert på de siste endringene og forbedringene.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Følg depotet"/></kbd>

## Dokumentasjon

Fullstendig dokumentasjon er tilgjengelig på [supabase.com/docs](https://supabase.com/docs). Der finner du alle nødvendige veiledninger og referansemateriale.

Hvis du ønsker å bidra til prosjektet, kan du se [Komme i gang](./../DEVELOPERS.md)-delen.

## Fellesskap og støtte

*   **Fellesskapsforum:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions).  Ideelt for å få hjelp med utvikling og diskutere beste praksis for databaser.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues).  Bruk dette for å rapportere feil du støter på mens du bruker Supabase.
*   **E-poststøtte:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support).  Det beste alternativet for problemer med databasen eller infrastrukturen din.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com).  Et flott sted å dele applikasjonene dine og henge med fellesskapet.

## Hvordan det fungerer

Supabase kombinerer flere åpen kildekode-verktøy.  Vi bygger funksjoner som ligner på Firebase, ved hjelp av utprøvde produkter i enterprise-klassen.  Hvis verktøyet eller fellesskapet eksisterer og har en MIT-, Apache 2- eller tilsvarende åpen lisens, vil vi bruke og støtte det verktøyet. Hvis verktøyet ikke finnes, bygger vi det selv og åpner kildekoden. Supabase er ikke en eksakt kopi av Firebase. Målet vårt er å gi utviklere en brukeropplevelse som kan sammenlignes med Firebase, men ved hjelp av åpen kildekode-verktøy.

**Arkitektur**

Supabase er en [administrert plattform](https://supabase.com/dashboard). Du kan registrere deg og begynne å bruke Supabase umiddelbart uten å installere noe. Du kan også [rulle ut din egen infrastruktur](https://supabase.com/docs/guides/hosting/overview) og [utvikle lokalt](https://supabase.com/docs/guides/local-development).

![Arkitektur](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Et objektrelasjonelt databasesystem med over 30 års aktiv utviklingshistorie. Det er kjent for sin pålitelighet, funksjonalitet og ytelse.
*   **Realtime:** En Elixir-server som lar deg lytte til PostgreSQL-endringer (innsettinger, oppdateringer og slettinger) via websockets. Realtime bruker Postgres' innebygde replikeringsfunksjonalitet, konverterer endringene til JSON og sender dem til autoriserte klienter.
*   **PostgREST:** En webserver som gjør PostgreSQL-databasen din om til et RESTful API.
*   **GoTrue:** En JWT-basert API for å administrere brukere og utstede JWT-tokens.
*   **Storage:** Gir et RESTful-grensesnitt for å administrere filer som er lagret i S3, ved hjelp av Postgres for å administrere tillatelser.
*   **pg_graphql:** En PostgreSQL-utvidelse som tilbyr et GraphQL API.
*   **postgres-meta:** En RESTful API for å administrere Postgres, slik at du kan hente tabeller, legge til roller, kjøre spørringer osv.
*   **Kong:** En skybasert API-gateway.

#### Klientbiblioteker

Vi bruker en modulær tilnærming til klientbibliotekene. Hvert underbibliotek er designet for å fungere med ett enkelt eksternt system. Dette er en av måtene vi støtter eksisterende verktøy på.

(Tabell med klientbiblioteker, som i originalen, men med norske navn og forklaringer der det trengs).

| Språk                       | Supabase-klient                                                    | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Offisielle⚡️**         |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Fellesskapsstøttede💚**|                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Merker (Badges)

Du kan bruke disse merkene for å vise at applikasjonen din er bygget med Supabase:

**Lys:**

![Laget med Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Laget med Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Laget med Supabase" />
</a>
```

**Mørk:**

![Laget med Supabase (mørk versjon)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Laget med Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Laget med Supabase" />
</a>
```
## Oversettelser

[Liste over oversettelser](./languages.md)
