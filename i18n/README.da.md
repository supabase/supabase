<p align="center">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--light.svg#gh-light-mode-only">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--dark.svg#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) er et open source Firebase alternativ. Vi bygger Firebase features ved hjælp af anerkendte open source værktøjer.

- [x] Hosted Postgres Database
- [x] Realtids abonnementer
- [x] Godkendelse og bemyndigelse
- [x] Automatisk genererede APIer
- [x] Instrumentbræt
- [x] Opbevaring af data
- [x] Serverbaserede funktioner

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## Dokumentation

For fuld dokumentation, besøg [supabase.com/docs](https://supabase.com/docs)

## Fælleskab & Support

- [Community Forum](https://github.com/supabase/supabase/discussions). Bedst til: hjælp med at udvikle løsninger og diskussion om god praksis for databaseudvikling.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Bedst til: fejl du oplever i Supabase.
- [Email Support](https://supabase.com/docs/support#business-support). Bedst til: problemer med din database eller infrastruktur.

## Status

- [x] Alpha: Vi tester Supabase med et begrænset antal kunder
- [x] Offentlig alpha: Alle kan tilmelde sig på [app.supabase.com](https://app.supabase.com). Vær opmærksom på, at uhensigtsmæssigheder kan forekomme.
- [x] Offentlig beta: Stabil til de fleste ikke-kommercielle formål
- [ ] Offentlig: Klar til produktion

Vi er i øjeblikket i Offentlig beta. Hold øje med udgivelser på denne side for notifkationer om større opdateringer.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Hold øje med dette repo"/></kbd>

---

## Hvordan virker det

Supabase er en kombination af open source værktøjer. Vi bygger Firebase fuktioner med open source produkter der er egnede til anvendelse i virksomheder. Hvis der allerede eksisterer værktøjer med MIT, Apache 2 eller en tilsvarende open source license, så vil vi anvende og støtte dette værktøj. Hvis sådan et værktøj ikke findes, så bygger vi det og udgiver det som open source. Supabase er ikke en en til en mapning af Firebase. Vores mål er at give udviklere en Firebase-lignende udvikleroplevelse ved hjælp af open source værktøjer.

**Nuværende arkitektur**

Supabase er en [hosted platform](https://app.supabase.com). Du kan skrive dig op og starte med at anvende Supabase uden nogen form for installation. Vi er stadig i gang med at forbedre den lokale udvikleroplevelse - dette er pt vores hovedfokus sammen med platformens generelle stabilitet.

![Arkitektur](https://user-images.githubusercontent.com/70828596/187547862-ffa9d058-0c3a-4851-a3e7-92ccfca4b596.png)

- [PostgreSQL](https://www.postgresql.org/) er en objektorienteret relationel database med mere end 30 års aktiv udvikling der har givet et stærkt omdømme for pålidelighed, funktionel robusthed og ydeevne.
- [Realtime](https://github.com/supabase/realtime) er en Elixir server der giver mulighed for at lytte efter PostgreSQL oprettelser, opdateringer og sletninger ved hjælp af websockets. Supabase lytter efter Postgres' indbyggede replikeringsmekanisme, konverterer replika byte-strømmen til JSON og udsender derefter JSON gennem websockets.
- [PostgREST](http://postgrest.org/) er en web server der konverterer din PostgreSQL database direkte til et REST API
- [Storage-API](https://github.com/supabase/storage-api) giver et REST interface til at administrere filer gemt i Amazon S3. Postgres benyttes til at styre tilladelser til filerne.
- [postgres-meta](https://github.com/supabase/postgres-meta) er et REST API til at administrere din Postgres database. Dette giver dig mulighed for at hente tabeller, tilføje roller, eksekvere forespørgsler mv.
- [GoTrue](https://github.com/netlify/gotrue) er et SWT baseret API til at administrere brugere og til at udstede SWT tokens.
- [Kong](https://github.com/Kong/kong) er en cloud baseret API gateway.

#### Klient biblioteker

Vores klientbibliotek er opbygget modulært. Hvert underbibliotek er en selvstændig implementering af et enkelt eksternt system. Dette er en af måderne hvormed vi understøtter allerede eksisterende produkter.

- **`supabase-{lang}`**: Kombinerer biblioteker og beriger eksistende funktionalitet.
  - `postgrest-{lang}`: Klientbibliotek til at arbejde med [PostgREST](https://github.com/postgrest/postgrest)
  - `realtime-{lang}`: Klientbibliotek til at arbejde med [Realtime](https://github.com/supabase/realtime)
  - `gotrue-{lang}`: Klientbibliotek til at arbejde med [GoTrue](https://github.com/netlify/gotrue)

| Repo                  | Officielt                                        | Fællesskab                                                                                                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Flutter`](https://github.com/supabase/supabase-Flutter) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust` \| [`Ruby`](https://github.com/supabase/supabase-rb)                                           |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) \| [`Ruby`](https://github.com/supabase/postgrest-rb) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust` \| `Ruby`                                                                                            |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust` \| `Ruby`                                                                                                  |

<!--- Remove this list if you're traslating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## Oversættelser

- [Liste med oversættelser](/i18n/languages.md) <!--- Keep only this -->

---

## Sponsorer

[![Nye sposorer](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
