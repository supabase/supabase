<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) ist eine Open-Source-Alternative zu Firebase. Wir bauen die Funktionen von Firebase mit Open-Source-Tools für Unternehmen auf.

- [x] Gehostete Postgres-Datenbank. [Docs](https://supabase.com/docs/guides/database)
- [x] Authentifizierung und Autorisierung. [Docs](https://supabase.com/docs/guides/auth)
- [x] Auto-generierte APIs.
  - [x] REST. [Docs](https://supabase.com/docs/guides/api#rest-api-overview)
  - [x] GraphQL. [Docs](https://supabase.com/docs/guides/api#graphql-api-overview)
  - [x] Echtzeit-Abonnements. [Docs](https://supabase.com/docs/guides/api#realtime-api-overview)
- [x] Funktionen.
  - [x] Datenbank-Funktionen. [Docs](https://supabase.com/docs/guides/database/functions)
  - [x] Edge-Funktionen [Docs](https://supabase.com/docs/guides/functions)
- [x] Dateispeicher. [Docs](https://supabase.com/docs/guides/storage)
- [x] Dashboard

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## Dokumentation

Die vollständige Dokumentation finden Sie under [supabase.com/docs](https://supabase.com/docs)

Wie Sie einen Beitrag leisten können, erfahren Sie under [Erste Schritte](../DEVELOPERS.md)

## Gemeinschaft &amp; Unterstützung

- [Gemeinschaftsforum](https://github.com/supabase/supabase/discussions). Am besten geeignet für: Hilfe bei der Erstellung, Diskussion über bewährte Datenbankverfahren.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Am besten geeignet für: Bugs und Fehler, auf die Sie bei der Verwendung von Supabase stoßen.
- [E-Mail-Support](https://supabase.com/docs/support#business-support). Am besten für: Problem mit Ihrer Datenbank oder Infrastruktur.
- [Discord](https://discord.supabase.com). Am besten geeignet für: Austausch von Anwendungen und Austausch mit der Community.

## Status

- [x] Alpha: Wir testen Supabase mit einer geschlossenen Gruppe von Kunden
- [x] Öffentliche Alpha: Jeder kann sich under [supabase.com/dashboard](https://supabase.com/dashboard) anmelden. Aber seien Sie nachsichtig mit uns, es gibt noch ein paar Macken
- [x] Öffentliche Beta: Stabil genug für die meisten nicht-unternehmerischen Anwendungsfälle
- [Öffentlich: Allgemeine Verfügbarkeit [[status](https://supabase.com/docs/guides/getting-started/features#feature-status)]

Wir befinden uns derzeit in der Public Beta. Beobachten Sie "releases" dieses Repos, um über größere Updates informiert zu werden.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Wie es funktioniert

Supabase ist eine Kombination aus Open-Source-Tools. Wir entwickeln die Funktionen von Firebase under Verwendung von Open-Source-Produkten in Unternehmensqualität. Wenn die Tools und Communities mit einer MIT-, Apache-2- oder einer vergleichbaren offenen Lizenz existieren, verwenden und unterstützen wir dieses Tool. Wenn es das Tool nicht gibt, entwickeln wir es selbst und stellen es also Open Source zur Verfügung. Supabase ist keine 1:1-Abbildung von Firebase. Unser Ziel ist es, Entwicklern eine Firebase-ähnliche Entwicklungserfahrung mit Open-Source-Tools zu bieten.

**Architektur**

Supabase ist eine [gehostete Platform](https://supabase.com/dashboard). Sie können sich anmelden und Supabase verwenden, ohne etwas zu installieren.
Sie können auch [selbst hosten](https://supabase.com/docs/guides/hosting/overview) und [local entwickeln](https://supabase.com/docs/guides/local-development).

![Architektur](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.svg)

- [PostgreSQL](https://www.postgresql.org/) ist ein objektrelationales Datenbanksystem, das seit über 30 Jahren aktiv entwickelt wird und sich einen guten Ruf in Bezug auf Zuverlässigkeit, Robustheit der Funktionen und Leistung erworben hat.
- [Realtime](https://github.com/supabase/realtime) ist ein Elixir-Server, mit dem Sie PostgreSQL-Einsätze, -Updates und -Löschvorgänge über Websockets abhören können. Realtime fragt die in Postgres eingebaute Replikationsfunktionalität nach Datenbankänderungen ab, konvertiert die Änderungen in JSON und sendet dann das JSON über Websockets an autorisierte Clients.
- [PostgREST](http://postgrest.org/) ist ein Webserver, der Ihre PostgreSQL-Datenbank direkt in eine RESTful API verwandelt
- [pg_graphql](http://github.com/supabase/pg_graphql/) ist eine PostgreSQL-Erweiterung, die eine GraphQL-API bereitstellt
- [Storage](https://github.com/supabase/storage-api) bietet eine RESTful-Schnittstelle für die Verwaltung von Dateien, die in S3 gespeichert sind, und nutzt Postgres für die Verwaltung von Berechtigungen.
- [postgres-meta](https://github.com/supabase/postgres-meta) ist eine RESTful-API für die Verwaltung von Postgres, mit der Sie Tabellen abrufen, Rollen hinzufügen, Abfragen ausführen können usw.
- [GoTrue](https://github.com/netlify/gotrue) ist eine SWT-basierte API für die Verwaltung von Benutzern und die Ausgabe von SWT-Tokens.
- [Kong](https://github.com/Kong/kong) ist ein Cloud-natives API-Gateway.

#### Client-Bibliotheken

Unser Ansatz für Client-Bibliotheken ist modular. Jede Unterbibliothek ist eine eigenständige Implementierung für ein einzelnes externes System. Dies ist eine der Möglichkeiten, wie wir bestehende Tools unterstützen.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>Sprache</th>
    <th>Client</th>
    <th colspan="5">Feature-Clients (gebündelt im Supabase-Client)</th>
  </tr>
  
  <tr>
    <th></th>
    <th>Supabase</th>
    <th><a href="https://github.com/postgrest/postgrest" target="_blank" rel="noopener noreferrer">PostgREST</a></th>
    <th><a href="https://github.com/supabase/gotrue" target="_blank" rel="noopener noreferrer">GoTrue</a></th>
    <th><a href="https://github.com/supabase/realtime" target="_blank" rel="noopener noreferrer">Realtime</a></th>
    <th><a href="https://github.com/supabase/storage-api" target="_blank" rel="noopener noreferrer">Storage</a></th>
    <th>Functions</th>
  </tr>
  <!-- TEMPLATE FOR NEW ROW -->
  <!-- START ROW
  <tr>
    <td>lang</td>
    <td><a href="https://github.com/supabase-community/supabase-lang" target="_blank" rel="noopener noreferrer">supabase-lang</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-lang" target="_blank" rel="noopener noreferrer">postgrest-lang</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-lang" target="_blank" rel="noopener noreferrer">gotrue-lang</a></td>
    <td><a href="https://github.com/supabase-community/realtime-lang" target="_blank" rel="noopener noreferrer">realtime-lang</a></td>
    <td><a href="https://github.com/supabase-community/storage-lang" target="_blank" rel="noopener noreferrer">storage-lang</a></td>
  </tr>
  END ROW -->
  
  <th colspan="7">⚡️ Offiziell ⚡️</th>
  
  <tr>
    <td>JavaScript (TypeScript)</td>
    <td><a href="https://github.com/supabase/supabase-js" target="_blank" rel="noopener noreferrer">supabase-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/postgrest-js" target="_blank" rel="noopener noreferrer">postgrest-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/auth-js" target="_blank" rel="noopener noreferrer">auth-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/realtime-js" target="_blank" rel="noopener noreferrer">realtime-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/storage-js" target="_blank" rel="noopener noreferrer">storage-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/functions-js" target="_blank" rel="noopener noreferrer">functions-js</a></td>
  </tr>
    <tr>
    <td>Flutter</td>
    <td><a href="https://github.com/supabase/supabase-flutter" target="_blank" rel="noopener noreferrer">supabase-flutter</a></td>
    <td><a href="https://github.com/supabase/postgrest-dart" target="_blank" rel="noopener noreferrer">postgrest-dart</a></td>
    <td><a href="https://github.com/supabase/gotrue-dart" target="_blank" rel="noopener noreferrer">gotrue-dart</a></td>
    <td><a href="https://github.com/supabase/realtime-dart" target="_blank" rel="noopener noreferrer">realtime-dart</a></td>
    <td><a href="https://github.com/supabase/storage-dart" target="_blank" rel="noopener noreferrer">storage-dart</a></td>
    <td><a href="https://github.com/supabase/functions-dart" target="_blank" rel="noopener noreferrer">functions-dart</a></td>
  </tr>
  
  <th colspan="7">💚 Gemeinschaft 💚</th>
  
  <tr>
    <td>C#</td>
    <td><a href="https://github.com/supabase-community/supabase-csharp" target="_blank" rel="noopener noreferrer">supabase-csharp</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-csharp" target="_blank" rel="noopener noreferrer">postgrest-csharp</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-csharp" target="_blank" rel="noopener noreferrer">gotrue-csharp</a></td>
    <td><a href="https://github.com/supabase-community/realtime-csharp" target="_blank" rel="noopener noreferrer">realtime-csharp</a></td>
    <td><a href="https://github.com/supabase-community/storage-csharp" target="_blank" rel="noopener noreferrer">storage-csharp</a></td>
    <td><a href="https://github.com/supabase-community/functions-csharp" target="_blank" rel="noopener noreferrer">functions-csharp</a></td>
  </tr>
  <tr>
    <td>Go</td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/postgrest-go" target="_blank" rel="noopener noreferrer">postgrest-go</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-go" target="_blank" rel="noopener noreferrer">gotrue-go</a></td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/storage-go" target="_blank" rel="noopener noreferrer">storage-go</a></td>
    <td><a href="https://github.com/supabase-community/functions-go" target="_blank" rel="noopener noreferrer">functions-go</a></td>
  </tr>
  <tr>
    <td>Java</td>
    <td>-</td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/gotrue-java" target="_blank" rel="noopener noreferrer">gotrue-java</a></td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/storage-java" target="_blank" rel="noopener noreferrer">storage-java</a></td>
    <td>-</td>
  </tr>
  <tr>
    <td>Kotlin</td>
    <td><a href="https://github.com/supabase-community/supabase-kt" target="_blank" rel="noopener noreferrer">supabase-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Postgrest" target="_blank" rel="noopener noreferrer">postgrest-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/GoTrue" target="_blank" rel="noopener noreferrer">gotrue-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Realtime" target="_blank" rel="noopener noreferrer">realtime-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Storage" target="_blank" rel="noopener noreferrer">storage-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Functions" target="_blank" rel="noopener noreferrer">functions-kt</a></td>
  </tr>
  <tr>
    <td>Python</td>
    <td><a href="https://github.com/supabase-community/supabase-py" target="_blank" rel="noopener noreferrer">supabase-py</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-py" target="_blank" rel="noopener noreferrer">postgrest-py</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-py" target="_blank" rel="noopener noreferrer">gotrue-py</a></td>
    <td><a href="https://github.com/supabase-community/realtime-py" target="_blank" rel="noopener noreferrer">realtime-py</a></td>
    <td><a href="https://github.com/supabase-community/storage-py" target="_blank" rel="noopener noreferrer">storage-py</a></td>
    <td><a href="https://github.com/supabase-community/functions-py" target="_blank" rel="noopener noreferrer">functions-py</a></td>
  </tr>
  <tr>
    <td>Ruby</td>
    <td><a href="https://github.com/supabase-community/supabase-rb" target="_blank" rel="noopener noreferrer">supabase-rb</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-rb" target="_blank" rel="noopener noreferrer">postgrest-rb</a></td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>Rust</td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/postgrest-rs" target="_blank" rel="noopener noreferrer">postgrest-rs</a></td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>Swift</td>
    <td><a href="https://github.com/supabase-community/supabase-swift" target="_blank" rel="noopener noreferrer">supabase-swift</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-swift" target="_blank" rel="noopener noreferrer">postgrest-swift</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-swift" target="_blank" rel="noopener noreferrer">gotrue-swift</a></td>
    <td><a href="https://github.com/supabase-community/realtime-swift" target="_blank" rel="noopener noreferrer">realtime-swift</a></td>
    <td><a href="https://github.com/supabase-community/storage-swift" target="_blank" rel="noopener noreferrer">storage-swift</a></td>
    <td><a href="https://github.com/supabase-community/functions-swift" target="_blank" rel="noopener noreferrer">functions-swift</a></td>
  </tr>
  <tr>
    <td>Godot Engine (GDScript)</td>
    <td><a href="https://github.com/supabase-community/godot-engine.supabase" target="_blank" rel="noopener noreferrer">supabase-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-gdscript" target="_blank" rel="noopener noreferrer">postgrest-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-gdscript" target="_blank" rel="noopener noreferrer">gotrue-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/realtime-gdscript" target="_blank" rel="noopener noreferrer">realtime-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/storage-gdscript" target="_blank" rel="noopener noreferrer">storage-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/functions-gdscript" target="_blank" rel="noopener noreferrer">functions-gdscript</a></td>
  </tr>
  
</table>

<!--- Remove this list if you're translating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## Übersetzungen

- [Arabisch | العربية](/i18n/README.ar.md)
- [Albanisch / Shqip](/i18n/README.sq.md)
- [Bangla / বাংলা](/i18n/README.bn.md)
- [Bulgarisch / Български](/i18n/README.bg.md)
- [Katalanisch / Català](/i18n/README.ca.md)
- [Dänisch / Dansk](/i18n/README.da.md)
- [Niederländisch / Nederlands](/i18n/README.nl.md)
- [Englisch](https://github.com/supabase/supabase)
- [Finnisch / Suomalainen](/i18n/README.fi.md)
- [Französisch / Français](/i18n/README.fr.md)
- [Deutsch / Deutsch](/i18n/README.de.md)
- [Griechisch / Ελληνικά](/i18n/README.gr.md)
- [Hebräisch / עברית](/i18n/README.he.md)
- [Hindi / हिंदी](/i18n/README.hi.md)
- [Ungarisch / Magyar](/i18n/README.hu.md)
- [Nepali / नेपाली](/i18n/README.ne.md)
- [Indonesisch / Bahasa Indonesia](/i18n/README.id.md)
- [Italienisch / Italiano](/i18n/README.it.md)
- [Japanisch / 日本語](/i18n/README.jp.md)
- [Koreanisch / 한국어](/i18n/README.ko.md)
- [Malaiisch / Bahasa Malaysia](/i18n/README.ms.md)
- [Norwegisch (Bokmål) / Norsk (Bokmål)](/i18n/README.nb-no.md)
- [Persisch / فارسی](/i18n/README.fa.md)
- [Polnisch / Polski](/i18n/README.pl.md)
- [Portugiesisch / Português](/i18n/README.pt.md)
- [Portugiesisch (Brasilianisch) / Português Brasileiro](/i18n/README.pt-br.md)
- [Rumänisch / Română](/i18n/README.ro.md)
- [Russisch / Pусский](/i18n/README.ru.md)
- [Serbisch / Srpski](/i18n/README.sr.md)
- [Singhalesisch / සිංහල](/i18n/README.si.md)
- [Spanisch / Español](/i18n/README.es.md)
- [Vereinfachtes Chinesisch / 简体中文](/i18n/README.zh-cn.md)
- [Schwedisch / Svenska](/i18n/README.sv.md)
- [Thai / ไทย](/i18n/README.th.md)
- [Traditionelles Chinesisch / 繁體中文](/i18n/README.zh-tw.md)
- [Türkisch / Türkçe](/i18n/README.tr.md)
- [Ukrainisch / Українська](/i18n/README.uk.md)
- [Vietnamesisch / Tiếng Việt](/i18n/README.vi-vn.md)
- [Liste der Übersetzungen](/i18n/languages.md) <!--- Keep only this -->

---

## Förderer

[![Neuer Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
