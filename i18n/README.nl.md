<p align="center">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--light.svg#gh-light-mode-only">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--dark.svg#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) is een open-source Firebase-alternatief. Wij bouwen de functionaliteiten van Firebase en gebruiken daarvoor open-source-producten van hoge kwaliteit.

- [x] Hosted Postgres Database
- [x] Realtime subscriptions
- [x] Authenticatie en autorisatie
- [x] Automatisch gegenereerde APIs
- [x] Dashboard
- [x] Opslag
- [x] Functions

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## Documentatie

Kijk voor de volledige documentatie op [supabase.com/docs](https://supabase.com/docs).

## Community & Hulp

- [Community Forum](https://github.com/supabase/supabase/discussions). Geschikt voor: hulp met bouwen, vragen over hoe je jouw databases correct gebruikt.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Geschikt voor: bugs en foutmeldingen in Supabase.
- [Email Support](https://supabase.com/docs/support#business-support). Geschikt voor: problemen met je database of infrastructuur.

## Status

- [x] Alpha: We testen Supabase met een kleine groep gebruikers.
- [x] Open Alpha: Iedereen kan een account openen op [app.supabase.com](https://app.supabase.com). Pas op, er kunnen namelijk wel wat dingen mislopen.
- [x] Open Beta: Stabiel genoeg voor hobbyprojecten
- [ ] Open: Klaar voor productie

Momenteel bevinden we ons in een publieke bèta. Bezoek de "releases" van deze repo om op de hoogte te blijven van de laatste updates.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Volg deze repo"/></kbd>

---

## Hoe werkt het

Supabase is een combinatie van open-source software. Wij bouwen de functionaliteiten van Firebase en gebruiken daarvoor open-source-producten van de hoogste kwaliteit. Als er een product of community bestaat met een MIT, Apache 2 of gelijkaardige licentie dan maken wij er gebruik van en steunen we dit product. Als een product nog niet bestaat dan maken we het gewoon zelf. Helemaal open-source natuurlijk. Supabase is geen exacte kopie van Firebase; we willen gebruikers de mogelijkheid geven om een product te gebruiken dat gelijkaardig is aan Firebase, maar dan volledig open-source.

**Huidige architectuur**

Supabase is een [aangeboden platform](https://app.supabase.com). Je kan een account openen en er meteen gebruik van maken. Je hoeft niets extra's te installeren. Momenteel werken we ook aan een manier om Supabase lokaal te kunnen draaien. Onze focus ligt dus op deze mogelijkheid en ook op het verbeteren van de stabliteit van het platform.

![Architectuur](https://user-images.githubusercontent.com/70828596/187547862-ffa9d058-0c3a-4851-a3e7-92ccfca4b596.png)

- [PostgreSQL](https://www.postgresql.org/) is een object-relation database-systeem dat al meer dan 30 jaar ervaring achter zich heeft. Dankzij deze ervaring heeft het een sterke reputatie die bekend staat om betrouwbaarheid, robuustheid en snelheid.
- [Realtime](https://github.com/supabase/realtime) is een Elixir-server die ervoor zorgt dat je kunt luisteren naar PostgreSQL _inserts_, _updates_ en _deletes_ met websockets. Supabase luistert naar de ingebouwde _replication_-mogelijkheden van Postgres, en zet de _replication byte_ stroom om in JSON. Daarna sturen we de JSON met een _broadcast_ over de websockets.
- [PostgREST](http://postgrest.org/) is een webserver die PostgreSQL meteen omzet in een Restful API.
- [Opslag](https://github.com/supabase/storage-api) biedt een RESTful interface aan die het mogelijk maakt om bestanden opgeslagen in S3 te beheren met Postgres-rechten.
- [postgres-meta](https://github.com/supabase/postgres-meta) is een RESTful API voor het beheren van Postgres. Het maakt het mogelijk om tabellen op te halen, rollen toe te voegen, queries uit te voeren en meer.
- [GoTrue](https://github.com/netlify/gotrue) is een API gebaseerd op SWT voor het beheren van gebruikers en het uitdelen van Secure Web Tokens.
- [Kong](https://github.com/Kong/kong) is een cloud-native API gateway.

#### Libraries voor gebruikers

Onze libraries zijn modulair. Elke sub-library is een implementatie die op zichzelf kan werken. Dit is één van de manieren waarop we bestaande tools ondersteunen.

- **`supabase-{lang}`**: Combineert libraries en voegt extras toe.
  - `postgrest-{lang}`: Library voor gebruikers om te werken met [PostgREST](https://github.com/postgrest/postgrest)
  - `realtime-{lang}`: Library voor gebruikers om te werken met [Realtime](https://github.com/supabase/realtime)
  - `gotrue-{lang}`: Library voor gebruikers om te werken met [GoTrue](https://github.com/netlify/gotrue)

| Repo                  | Officieel                                        | Community                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Flutter`](https://github.com/supabase/supabase-flutter) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust`                                          |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust`                                                |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust`                                                      |

## Vertalingen

- [Lijst met vertalingen](/i18n/languages.md)

---

## Sponsors

[![Nieuwe sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
