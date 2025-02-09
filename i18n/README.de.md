<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) ist eine Open-Source-Alternative zu Firebase. Wir entwickeln die Funktionen von Firebase mit Open-Source-Tools der Enterprise-Klasse.

**Hauptmerkmale:**

- [x] **Verwaltete Postgres-Datenbank:** [Dokumentation](https://supabase.com/docs/guides/database)
- [x] **Authentifizierung und Autorisierung:** [Dokumentation](https://supabase.com/docs/guides/auth)
- [x] **Automatisch generierte APIs:**
    - [x] REST: [Dokumentation](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Dokumentation](https://supabase.com/docs/guides/graphql)
    - [x] Echtzeit-Abonnements: [Dokumentation](https://supabase.com/docs/guides/realtime)
- [x] **Funktionen:**
    - [x] Datenbankfunktionen: [Dokumentation](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (Funktionen am Netzwerkrand): [Dokumentation](https://supabase.com/docs/guides/functions)
- [x] **Dateispeicher:** [Dokumentation](https://supabase.com/docs/guides/storage)
- [x] **KI, Vektoren und Einbettungen (Embeddings) Tools:** [Dokumentation](https://supabase.com/docs/guides/ai)
- [x] **Dashboard**

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Abonnieren Sie die "Releases" dieses Repositorys, um Benachrichtigungen über wichtige Updates zu erhalten. So bleiben Sie über die neuesten Änderungen und Verbesserungen auf dem Laufenden.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Repository beobachten"/></kbd>

## Dokumentation

Die vollständige Dokumentation finden Sie unter [supabase.com/docs](https://supabase.com/docs). Dort finden Sie alle notwendigen Anleitungen und Referenzmaterialien.

Wenn Sie zur Entwicklung des Projekts beitragen möchten, lesen Sie den Abschnitt [Erste Schritte](./../DEVELOPERS.md).

## Community und Support

*   **Community-Forum:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Ideal, um Hilfe bei der Entwicklung zu erhalten und Best Practices für die Arbeit mit Datenbanken zu diskutieren.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Verwenden Sie diese Option, um Fehler und Probleme zu melden, die bei der Verwendung von Supabase auftreten.
*   **E-Mail-Support:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). Die beste Option zur Lösung von Problemen mit Ihrer Datenbank oder Infrastruktur.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Ein großartiger Ort, um Ihre Anwendungen zu teilen und mit der Community zu kommunizieren.

## Funktionsweise

Supabase kombiniert mehrere Open-Source-Tools. Wir entwickeln Funktionen, die Firebase ähneln, mit bewährten Produkten der Enterprise-Klasse. Wenn ein Tool oder eine Community existiert und eine MIT-, Apache 2- oder eine ähnliche offene Lizenz hat, werden wir dieses Tool verwenden und unterstützen. Wenn ein solches Tool nicht existiert, erstellen wir es selbst und öffnen den Quellcode. Supabase ist keine exakte Kopie von Firebase. Unser Ziel ist es, Entwicklern eine Benutzerfreundlichkeit zu bieten, die mit Firebase vergleichbar ist, jedoch unter Verwendung von Open-Source-Tools.

**Architektur**

Supabase ist eine [verwaltete Plattform](https://supabase.com/dashboard). Sie können sich registrieren und Supabase sofort nutzen, ohne etwas installieren zu müssen. Sie können auch [Ihre eigene Infrastruktur bereitstellen](https://supabase.com/docs/guides/hosting/overview) und [lokal entwickeln](https://supabase.com/docs/guides/local-development).

![Architektur](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Ein objektrelationales Datenbanksystem mit mehr als 30 Jahren aktiver Entwicklungsgeschichte. Es ist bekannt für seine Zuverlässigkeit, Funktionalität und Leistung.
*   **Realtime:** Ein Elixir-Server, mit dem Sie Änderungen in PostgreSQL (Einfügungen, Aktualisierungen und Löschungen) über Websockets abhören können. Realtime verwendet die integrierte Replikationsfunktionalität von Postgres, wandelt Änderungen in JSON um und überträgt sie an autorisierte Clients.
*   **PostgREST:** Ein Webserver, der Ihre PostgreSQL-Datenbank in eine RESTful-API verwandelt.
*   **GoTrue:** Eine JWT-basierte API zur Verwaltung von Benutzern und zur Ausstellung von JWT-Token.
*   **Storage:** Bietet eine RESTful-Schnittstelle zur Verwaltung von Dateien, die in S3 gespeichert sind, wobei Postgres zur Verwaltung von Berechtigungen verwendet wird.
*   **pg_graphql:** Eine PostgreSQL-Erweiterung, die eine GraphQL-API bereitstellt.
*   **postgres-meta:** Eine RESTful-API zur Verwaltung Ihres Postgres, mit der Sie Tabellen abrufen, Rollen hinzufügen, Abfragen ausführen usw. können.
*   **Kong:** Ein Cloud-natives API-Gateway.

#### Client-Bibliotheken

Wir verwenden einen modularen Ansatz für Client-Bibliotheken. Jede Unterbibliothek ist für die Arbeit mit einem einzelnen externen System konzipiert. Dies ist eine der Möglichkeiten, bestehende Tools zu unterstützen.

(Tabelle mit Client-Bibliotheken, wie im Original, aber mit deutschen Namen und Erklärungen, wo nötig).

| Sprache                       | Client Supabase                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Offiziell⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Community-gepflegt💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Badges

Sie können diese Badges verwenden, um zu zeigen, dass Ihre Anwendung mit Supabase erstellt wurde:

**Hell:**

![Erstellt mit Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Erstellt mit Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Erstellt mit Supabase" />
</a>
```

**Dunkel:**

![Erstellt mit Supabase (dunkle Version)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Erstellt mit Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Erstellt mit Supabase" />
</a>
```

## Übersetzungen

[Liste der Übersetzungen](./languages.md)
