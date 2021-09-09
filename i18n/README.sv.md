<p align="center">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/web/static/supabase-light-rounded-corner-background.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io) är ett open source-alternativ till Firebase. Vi bygger Firebase funktioner med hjälp av verktyg i företagsklass med öppen källkod.

- [x] Hostad Postgres-databas
- [x] Realtids-prenumerationer
- [x] Autentisering och auktorisering
- [x] Auto-genererade APIer
- [x] Kontrollpanel
- [x] Lagring
- [ ] Funktioner (kommer snart)

## Dokumentation

För fullständig dokumentation, besök [supabase.io/docs](https://supabase.io/docs)

## Community & Support

- [Community-forum](https://github.com/supabase/supabase/discussions). Bäst för: Hjälp med att utveckla lösningar och diskussioner om bästa praxis vid databasutveckling.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Bäst för: Buggar och fel du stöter på när du använder Supabase.
- [E-post-support](https://supabase.io/docs/support#business-support). Bäst för: Problem med din databas eller infrastruktur.

## Status

- [x] Alpha: Vi testar Supabase med ett begränsat antal kunder
- [x] Offentlig alpha: Vem som helst kan anmäla sig på [app.supabase.io](https://app.supabase.io). Observera att vissa fel och problem kan uppstå.
- [x] Offentlig beta: Stabil nog för de flesta icke-Enterprise-ändamål
- [ ] Offentlig: Redo för produktion

Vi är för närvarande i offentlig beta. Bevaka "releases" i detta repo för att få notifikationer vid större uppdateringar.

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Bevaka detta repo"/></kbd>

---

## Hur det fungerar

Supabase är en samling verktyg med öppen källkod. Vi bygger funktionerna som finns i Firebase med hjälp av produkter i företagsklass, med öppen källkod. Om verktygen och communityn finns, med en MIT, Apache 2 eller motsvarande öppen licens, kommer vi att använda och stödja det verktyget. Om verktyget inte finns, bygger vi det själva och släpper det fritt med öppen källkod. Supabase är inte en 1-till-1-mappning av Firebase. Vårt mål är att ge utvecklare en Firebase-liknande utvecklarupplevelse med hjälp av verktyg med öppen källkod.

**Nuvarande arkitektur**

Supabase är en [hostad plattform](https://app.supabase.io). Du kan registrera dig och börja använda Supabase utan att installera någonting. Vi håller fortfarande på att förbättra den lokala utvecklarupplevelsen - detta är för närvarande vårt huvudfokus, tillsammans med plattformens övergripande stabilitet.

![Arkitektur](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/) är en objektrelationsdatabas med över 30 års aktiv utveckling , vilket har gett den ett gott rykte som pålitlig, robust och högpresterande.
- [Realtime](https://github.com/supabase/realtime) är en Elexir-server som låter dig lyssna på skapande, uppdateringar och borttagningar i PostgreSQL med hjälp av websockets. Supabase lyssnar på PostgreSQL´s inbyggda replikeringsfunktionalitet, konverterar replikerings-byte-strömmen till JSON och sänder sedan JSON via websockets.
- [PostgREST](http://postgrest.org/) är en webbserver som omvandlar din PostgreSQL-databas direkt till ett REST-API.
- [Storage](https://github.com/supabase/storage-api) tillhandahåller ett REST-API för att administrera filer sparade i Amazon S3. Postgres används för att hantera filrättigheterna.
- [postgres-meta](https://github.com/supabase/postgres-meta) är ett REST-API för att administrera din Postgres-databas. Detta ger dig möjlighet att hämta tabeller, lägga till roller, utföra frågor etc.
- [GoTrue](https://github.com/netlify/gotrue) är ett SWT-baserat API för att hantera användare och utfärda SWT-tokens.
- [Kong](https://github.com/Kong/kong) är en moln-baserad API-gateway.

#### Klientbibliotek

Vårt klientbibliotek är modulärt. Varje underbibliotek är en fristående implementering för ett specifikt externt system. Detta är ett av de sätt vi stödjer befintliga verktyg på.

- **`supabase-{lang}`**: Kombinerar bibliotek och och berikar existerande funktionalitet.
  - `postgrest-{lang}`: Klientbibliotek för att arbeta med [PostgREST](https://github.com/postgrest/postgrest)
  - `realtime-{lang}`: Klientbibliotek för att arbeta med [Realtime](https://github.com/supabase/realtime)
  - `gotrue-{lang}`: Klientbibliotek för att arbeta med [GoTrue](https://github.com/netlify/gotrue)

| Repo                  | Officiellt                                       | Community                                                                                                                                                                                                                                                                        |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust` \| [`Ruby`](https://github.com/supabase/supabase-rb)                                                 |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) \| [`Ruby`](https://github.com/supabase/postgrest-rb) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust` \| `Ruby`                                                                                            |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust` \| `Ruby`                                                                                                  |

<!--- Remove this list if you're traslating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## Översättningar

- [Lista med översättningar](/i18n/languages.md) <!--- Keep only this -->

---

## Sponsorer

[![Nya sponsorer](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
