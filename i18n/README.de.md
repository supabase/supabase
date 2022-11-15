<p align="center">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--light.svg#gh-light-mode-only">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--dark.svg#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) ist eine Open-Source Alternative zu Firebase. Wir bauen die Features von Firebase mithilfe von Enterprise-tauglichen Open-Source Tools.

- [x] Gehostete Postgres Datenbank
- [x] Echtzeit Subscriptions
- [x] Authentifizierung und Authorisierung
- [x] Automatisch generierte APIs
- [x] Dashboard
- [x] Speicher
- [x] Funktionen

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## Dokumentation

Um die gesamte Dokumentation einzusehen, schaue auf [supabase.com/docs](https://supabase.com/docs) vorbei.

## Community & Support

- [Community Forum](https://github.com/supabase/supabase/discussions). Am Besten für: Hilfe bei der Implementierung/Integration, Diskussionen über Datenbank Best-Practices.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Am Besten für: Bugs und Fehler die dir beim Nutzen von Supabase auffallen.
- [Email Support](https://supabase.com/docs/support#business-support). Am Besten für: Probleme mit deiner Datenbank oder Infrastruktur.
- [Discord](https://discord.supabase.com/). Am besten für: Anwendungen teilen und mit der Community abhängen.

## Status

- [x] Alpha: Wir testen Supabase mit einer eingeschränkten Anzahl an Kunden.
- [x] Public Alpha: Jeder kann sich bei [app.supabase.com](https://app.supabase.com) anmelden. Aber sei gnädig, der Feinschliff fehlt noch.
- [x] Public Beta: Stabil genug für die meisten Use-Cases außerhalb des Enterprise-Bereiches.
- [ ] Public: Bereit für Produktion

Aktuell befinden wir uns in der öffentlichen Beta. Beobachte "Releases" in diesem Repository um über größere Neuigkeiten benachrichtigt zu werden.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watche dieses Repo"/></kbd>

---

## So funktionierts

Supabase ist eine Kombination von Open-Source Tools. Wir bauen die Features von Firebase mithilfe von enterprise-tauglichen Open-Source Tools. Alle Tools und Communities mit MIT/Apache 2 oder ähnlicher Lizenz werden von uns genutzt und unterstützt. Wenn es ein Tool nicht gibt, bauen wir es selbst als Open-Source Tool nach. Supabase ist keine 1:1 Kopie von Firebase. Unser Ziel ist es den Entwicklern, mit Open-Source Tools, eine Firebase-ähnliche Entwicklererfahrung zu bieten.

**Aktuelle Architektur**

Supabase ist eine [gehostete Plattform](https://app.supabase.com).
Du kannst dich bei Supabase anmelden und sofort loslegen, ohne etwas zu installieren.
Du kannst Supabase auch selbst hosten und lokal entwickeln.

![Architektur](https://user-images.githubusercontent.com/70828596/187547862-ffa9d058-0c3a-4851-a3e7-92ccfca4b596.png)

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

| Repo                  | Offiziell                                        | Gemeinschaft                                                                                                                                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Flutter`](https://github.com/supabase/supabase-flutter) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust` \| [`Ruby`](https://github.com/supabase/supabase-rb) \| `Go`                                                                                       |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) \| [`Ruby`](https://github.com/supabase/postgrest-rb) \| [`Go`](https://github.com/supabase/postgrest-go) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust` \| `Ruby` \| `Go`                                                                                                                                        |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust` \| `Ruby` \| `Go`                                                                                                                                              |

## Übersetzungen

- [Liste der Übersetzungen](/i18n/languages.md) <!--- Keep only the this-->

---

## Sponsoren

[![Neuer Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
