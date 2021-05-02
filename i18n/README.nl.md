<p align="center">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/web/static/supabase-light-with-background.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io) is een open source Firebase alternatief. We bouwen de eigenschappen van Firebase en gebruiken open source producten van hoge kwaliteit.

- [x] Hosted Postgres Database
- [x] Realtime subscriptions
- [x] Authenticatie en autorisatie
- [x] Automatisch gegenereerde APIs
- [x] Dashboard
- [x] Opslag
- [ ] Functions (nog niet beschikbaar)

## Documentatie

Voor volledige documentatie, bezoek [supabase.io/docs](https://supabase.io/docs)

## Community & Hulp

- [Community Forum](https://github.com/supabase/supabase/discussions). Geschikt voor: hulp met bouwen, vragen over hoe je database correct gebruiken.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Geschikt voor: bugs en errors in Supabase.
- [Email Support](https://supabase.io/docs/support#business-support). Geschikt voor: problemen met je database of infrastructuur.

## Status

- [x] Alpha: We testen Supabase met een kleine groep gebruikers.
- [x] Open Alpha: Iedereen kan een account openen op [app.supabase.io](https://app.supabase.io). Pas op, er kunnen namelijk wel wat dingen mislopen.
- [x] Open Beta: Stabiel genoeg voor hobby projecten
- [ ] Open: Klaar voor productie

Momenteel bevinden we ons in Open Beta. Bezoek de "releases" van deze repo om op de hoogte te blijven van de laatste updates.

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Volg deze repo"/></kbd>

---

## Hoe werkt het

Supabase is een combinatie van open source software. We bouwen de eigenschappen van Firebase en maken gebruik van open source producten van de hoogste kwaliteit. Als er een product of community bestaat met een MIT, Apache 2, of gelijkaardige licentie dan maken we er gebruik van en steunen we dit product. Als een product nog niet bestaat dan maken we het gewoon zelf, helemaal open source natuurlijk. Supabase is geen exacte kopie van Firebase, we willen gebruikers de mogelijkheid geven om een product te gebruiken dat gelijkaardig is aan Firebase maar dan volledig open source.

**Huidige architectuur**

Supabase is een [aangeboden platform](https://app.supabase.io). Je kan een account openen en er meteen gebruik maken. Je hoeft niets extra te installeren. Momenteel werken we ook aan een manier om Supabase lokaal te kunnen opstarten. Onze focus ligt op deze mogelijkheid en ook de stabliteit van het platform verbeteren.

![Architectuur](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/) is een object-relation database systeem met al meer dan 30 jaar ervaring achter zich. Dankzij deze ervaring heeft het een sterke reputatie die gekend staat om betrouwbaarheid, robuustheid en snelheid.
- [Realtime](https://github.com/supabase/realtime) is een Elixir server die ervoor zorgt dat je kan luisteren naar PostgreSQL inserts, updates en deletes met websockets. Supabase luistert naar de ingebouwde replication mogelijkheden van Postgres, en zet de replaction byte stroom om in JSON. Daarna sturen we de JSON met een broadcast over de websockets.
- [PostgREST](http://postgrest.org/) is een web server die PostgreSQL meteen omzet in een Restful API.
- [Opslag](https://github.com/supabase/storage-api) biedt een RESTful interface aan die het mogelijk maakt om bestanden opgeslagen in S3 te beheren met Postgres rechten.
- [postgres-meta](https://github.com/supabase/postgres-meta) is een RESTful API voor het beheren van Postgres. Het maakt het mogelijk om tabellen op te halen, rollen toe te voegen, queries uit te voeren en meer.
- [GoTrue](https://github.com/netlify/gotrue) is een op SWT gebaseerde API voor het beheren van gebruikers en het uitdelen van SWT tokens.
- [Kong](https://github.com/Kong/kong) is een cloud-native API gateway.

#### Libraries voor gebruikers

Onze libraries zijn modulair. Elke sub-library is een implementatie die op zichzelf kan werken. Dit is één van de manieren waarop we bestaande tools ondersteunen.

- **`supabase-{lang}`**: Combineert libraries en voegt extras toe.
  - `postgrest-{lang}`: Library voor gebruikers om te werken met [PostgREST](https://github.com/postgrest/postgrest)
  - `realtime-{lang}`: Library voor gebruikers om te werken met [Realtime](https://github.com/supabase/realtime)
  - `gotrue-{lang}`: Library voor gebruikers om te werken met [GoTrue](https://github.com/netlify/gotrue)

| Repo                  | Officieel                                        | Community                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust`                                                |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust`                                                |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust`                                                      |

## Vertalingen

- [Lijst met vertalingen](/i18n/languages.md)

---

## Sponsors

[![Nieuwe sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
