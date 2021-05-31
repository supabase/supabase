<p align="center">
  <img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/web/static/supabase-light-rounded-corner-background.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io) ist eine Open-Source Alternative zu Firebase. Wir bauen die Features von Firebase mithilfe von Enterprise-tauglichen Open-Source Tools.

- [x] Gehostete Postgres Datenbank
- [x] Echtzeit Subscriptions
- [x] Authentifizierung und Authorisierung
- [x] Automatisch generierte APIs
- [x] Dashboard
- [x] Speicher
- [ ] Funktionen (kommt demnächst)

## Dokumentation

Um die gesamte Dokumentation einzusehen, schaue auf [supabase.io/docs](https://supabase.io/docs) vorbei.

## Community & Support

- [Community Forum](https://github.com/supabase/supabase/discussions). Am Besten für: Hilfe bei der Implementierung/Integration, Diskussionen über Datenbank Best-Practices.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Am Besten für: Bugs und Fehler die dir beim Nutzen von Supabase auffallen.
- [Email Support](https://supabase.io/docs/support#business-support). Am Besten für: Probleme mit deiner Datenbank oder Infrastruktur.

## Status

- [x] Alpha: Wir testen Supabase mit einer eingeschränkten Anzahl an Kunden.
- [x] Public Alpha: Jeder kann sich bei [app.supabase.io](https://app.supabase.io) anmelden.Aber sei gnädig, der Feinschliff fehlt noch.
- [x] Public Beta: Stabil genug für die meisten Use-Cases außerhalb des Enterprise-Bereiches.
- [ ] Public: Bereit für Produktion

Aktuell befinden wir uns in der Public Beta. Beobachte "Releases" in diesem Repository um über größere Neuigkeiten benachrichtigt zu werden.

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Watche dieses Repo"/></kbd>

---

## So funktionierts

Supabase ist eine Kombination von Open-Source Tools. Wir bauen die Features von Firebase mithilfe von enterprise-tauglichen Open-Source Tools. Alle Tools und Communities mit MIT/Apache 2 oder ähnlicher Lizenz werden von uns genutzt und unterstützt. Wenn es ein Tool nicht gibt, bauen wir es selbst als Open-Source Tool nach. Supabase ist keine 1:1 Kopie von Firebase. Unser Ziel ist es den Entwicklern, mit Open-Source Tools, eine Firebase-ähnliche Developer Experience zu geben.

**Aktuelle Architektur**

Supabase ist eine [gehostete Plattform](https://app.supabase.io).
Du kannst dich bei Supabase anmelden und sofort loslegen, ohne etwas zu installieren.
Wir sind noch dabei, die lokalen Entwicklungsmöglichkeiten zu verbessern - darauf liegt aktuell unser größter Fokus, neben der Stabilität der Plattform.

![Architektur](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/) ist ein objektrelationales Datenbanksystem, das seit über 30 Jahren aktiv entwickelt wird und für Zuverlässigkeit, Robustheit der Funktionen und Leistung geschätzt wird.
- [Realtime](https://github.com/supabase/realtime) ist ein Elixir-Server, mit dem du auf PostgreSQL-Inserts, -Updates und -Deletes über Websockets hören kannst. Supabase hört auf die eingebaute Replikationsfunktionalität von Postgres, konvertiert den Replikations-Byte-Stream in JSON und sendet das JSON dann über Websockets.
- [PostgREST](http://postgrest.org/) ist ein Web-Server, der deine PostgreSQL Datenbank in eine RESTful API verwandelt.
- [Storage](https://github.com/supabase/storage-api) bietet eine RESTful-Schnittstelle für die Verwaltung von in S3 gespeicherten Dateien, wobei Postgres für die Verwaltung von Berechtigungen verwendet wird.
- [postgres-meta](https://github.com/supabase/postgres-meta) ist eine RESTful-API zur Verwaltung von Postgres, mit der du Tabellen abrufen, Rollen hinzufügen und Abfragen usw. ausführen kannst
- [GoTrue](https://github.com/netlify/gotrue) ist eine SWT basierte API zum Verwalten von Nutzern und zum Ausstellen von SWT Tokens.
- [Kong](https://github.com/Kong/kong) ist ein cloud-natives API Gateway.

#### Client Libraries

Unsere Client-Bibliothek ist modular aufgebaut. Jede Teilbibliothek ist eine eigenständige Implementierung für ein einzelnes externes System. Dies ist eine der Möglichkeiten, wie wir bestehende Tools unterstützen.

- **`supabase-{lang}`**: Kombiniert Libraries und fügt Erweiterungen hinzu.
  - `postgrest-{lang}`: Client-Library zur Integration mit [PostgREST](https://github.com/postgrest/postgrest).
  - `realtime-{lang}`: Client-Library zur Integration mit [Realtime](https://github.com/supabase/realtime).
  - `gotrue-{lang}`: Client-Library zur Integration mit [GoTrue](https://github.com/netlify/gotrue).

| Repo                  | Offiziell                                        | Gemeinschaft                                                                                                                                                                                                               |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust`                                                |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust`                                                |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust`                                                      |

## Übersetzungen

- [Liste der Übersetzungen](/i18n/languages.md) <!--- Keep only the this-->

---

## Sponsoren

[![Neuer Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
