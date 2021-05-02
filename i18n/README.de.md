<p align="center">
<img width="300" src="https://gitcdn.xyz/repo/supabase/supabase/master/web/static/supabase-light-with-background.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io) ist eine Open-Source Alternative zu Firebase. Wir bauen die Features von Firebase mithilfe von Enterprise-tauglichen Open-Source Tools.

- [x] Gehostete Postgres Datenbak
- [x] Echtzeit Subscriptions
- [x] Authentifizierung und Authorisierung
- [x] Automatisch generierte APIs
- [x] Dashboard
- [x] Speicher
- [ ] Funktionen (kommt demnächst)

## Documentation

Um die gesamte Dokumentation einzusehen, besuche [supabase.io/docs](https://supabase.io/docs)

## Community & Support

- [Community Forum](https://github.com/supabase/supabase/discussions). Am Besten für: Hilfe bei der Implementierung/Integration, Diskussionen über Datenbank Best-Practices.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Am Besten für: Bugs und Fehler die dir beim Nutzen von Supabase auffallen.
- [Email Support](https://supabase.io/docs/support#business-support). Am Besten für: Probleme mit deiner Datenbank oder Infrastruktur.

## Status

- [x] Alpha: Supabase with mit einer eingeschränkten Anzahl an Kunden getestet
- [x] Public Alpha: Jeder kann sich bei [app.supabase.io](https://app.supabase.io) anmelden. Der Feinschliff fehlt noch.
- [x] Public Beta: Stabil genug für die meisten Use-Cases außerhalb des Enterprise-Bereiches
- [ ] Public: Bereit für Produktion

Aktuell befinden wir ins in der Public Beta. Beobachte "Releases" in diesem Repository um über größere Neuigkeiten benachrichtigt zu werden.

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## So funktionierts

Supabase ist eine Kombination aus Open-Source Tools.
Wir bauen die Features von Firebase mithilfe von Enterprise-tauglichen Open-Source Tools.
Wenn es Tools und Communities mit MIT/Apache 2 oder ähnlicher Lizenz gibt, nutzen und unterstützen wir diese Tools.
Wenn es das Tool nicht gibt, bauen wir es selbst als Open-Source Tool.
Supabase bietet nicht 1:1 die Funktionalität von Firebase.
Unser Ziel ist es, den Entwicklern eine Firebase-ähnliche Developer Experience zu geben, mit Open-Source Tools.

**Aktuelle Architektur**

Supabase ist eine [gehostete Plattform](https://app.supabase.io).
Du kannst dich bei Supabase anmelden und sofort loslegen, ohne etwas zu installieren.
Wir sind noch dabei, die lokalen Entwicklungsmöglichkeiten zu verbessern - darauf liegt aktuell unser größter Fokus, neben der Stabilität der Plattform.

![Architektur](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/) ist ein objekt-relationales Datenbanksystem mit über 30 Jahren aktiver Entwicklung, welches ein starkes Ansehen für die Verlässlichkeit, Robustheit der Features und die Performance genießt.
- [Realtime](https://github.com/supabase/realtime) ist ein Elixir Server, der es dir erlaubt, auf PostgreSQL Inserts, Updates, und Deletes mithilfe von Websockets zu lauschen. Supabase lauscht auf Postgres eingebauter Replikationsfunktion, konvertiert das Ganze in JSON, und verteilt das JSON via Websockets.
- [PostgREST](http://postgrest.org/) ist ein Web-Server der deine PostgreSQL Datenbank in eine RESTful API verwandelt.
- [Storage](https://github.com/supabase/storage-api) bietet ein RESTful Interface zum Verwalten von Dateien die in S3 gespeichert sind. Postgres verwaltet die Zugriffsrechte.
- [postgres-meta](https://github.com/supabase/postgres-meta) ist eine RESTful API zur Verwaltung von Postgres, mit der man Tabellen abfragen, Rollen hinzufügen, Queries ausführen, etc kann
- [GoTrue](https://github.com/netlify/gotrue) ist eine SWT basierte API zum Verwalten von Nutzern und Ausstellen von SWT Tokens.
- [Kong](https://github.com/Kong/kong) ist ein Cloud-Native API Gateway.

#### Client Libraries

Unsere Client-Library ist modular. Jede Sub-Library ist eine eigenständige Implementierung für ein einziges externes System.
Das ist einer der Wege, wie wir unsere existierenden Tools unterstützen.

- **`supabase-{lang}`**: Kombiniert Libraries und reichert noch ein wenig an
  - `postgrest-{lang}`: Client-Library zur Integration von [PostgREST](https://github.com/postgrest/postgrest)
  - `realtime-{lang}`: Client-Library zur Integration von [Realtime](https://github.com/supabase/realtime)
  - `gotrue-{lang}`: Client-Library zur Integration von [GoTrue](https://github.com/netlify/gotrue)

| Repo                  | Offiziell                                        | Community                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust`                                                |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust`                                                |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust`                                                      |

## Übersetzungen

- [Englisch](https://github.com/supabase/supabase)
- [Japanisch](https://github.com/supabase/supabase/blob/master/i18n/README.jp.md)

---

## Sponsoren

[![Neuer Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
