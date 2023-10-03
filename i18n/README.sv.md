<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) är ett alternativ till Firebase med öppen källkod. Vi bygger upp Firebase-funktionerna med hjälp av verktyg för öppen källkod i företagsklass.

- [x] Hosted Postgres-databas. [Docs](https://supabase.com/docs/guides/database)
- [x] Autentisering och auktorisering. [Docs](https://supabase.com/docs/guides/auth)
- [x] Automatiskt genererade API:er.
  - [x] REST. [Docs](https://supabase.com/docs/guides/api#rest-api-overview)
  - [x] GraphQL. [Docs](https://supabase.com/docs/guides/api#graphql-api-overview)
  - [x] Prenumerationer i realtid. [Dokument](https://supabase.com/docs/guides/api#realtime-api-overview)
- [x] Funktioner.
  - [x] Databasfunktioner. [Dokument](https://supabase.com/docs/guides/database/functions)
  - [x] Edge-funktioner [Docs](https://supabase.com/docs/guides/functions)
- [x] Lagring av filer. [Docs](https://supabase.com/docs/guides/storage)
- [x] Kontrollpanel

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## Dokumentation

Fullständig dokumentation finns på [supabase.com/docs](https://supabase.com/docs)

För att se hur man bidrar, besök [Getting Started](../DEVELOPERS.md)

## Gemenskap och stöd

- [Community Forum](https://github.com/supabase/supabase/discussions). Bäst för: hjälp med att bygga, diskussion om bästa praxis för databaser.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Bäst för: buggar och fel som du stöter på när du använder Supabase.
- [E-postsupport](https://supabase.com/docs/support#business-support). Bäst för: problem med din databas eller infrastruktur.
- [Discord](https://discord.supabase.com). Bäst för: att dela med dig av dina applikationer och umgås med gemenskapen.

## Status

- [Alpha: Vi testar Supabase med en sluten grupp av kunder
- [x] Public Alpha: Vem som helst kan registrera sig på [supabase.com/dashboard](https://supabase.com/dashboard). Men var försiktig med oss, det finns några problem
- [x] Public Beta: Stabil nog för de flesta användningsområden som inte är företag
- [ ] Public: Allmän tillgänglighet [[status](https://supabase.com/docs/guides/getting-started/features#feature-status)]]

Vi befinner oss för närvarande i Public Beta. Bevaka "releases" i denna repo för att få information om större uppdateringar.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Hur det fungerar

Supabase är en kombination av verktyg med öppen källkod. Vi bygger funktionerna i Firebase med hjälp av öppna källkodsprodukter i företagsklass. Om verktygen och gemenskaperna finns med en MIT-, Apache 2- eller motsvarande öppen licens kommer vi att använda och stödja det verktyget. Om verktyget inte finns, bygger vi det själv och använder öppen källkod. Supabase är inte en 1-till-1-mappning av Firebase. Vårt mål är att ge utvecklare en Firebase-liknande utvecklarupplevelse med hjälp av verktyg med öppen källkod.

**Arkitektur**

Supabase är en [värdplattform](https://supabase.com/dashboard). Du kan registrera dig och börja använda Supabase utan att installera något.
Du kan också [självhosta](https://supabase.com/docs/guides/hosting/overview) och [utveckla lokalt](https://supabase.com/docs/guides/local-development).

![Arkitektur](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.png)

- [PostgreSQL](https://www.postgresql.org/) är ett objektrelationellt databassystem med över 30 års aktiv utveckling som har gett det ett gott rykte när det gäller tillförlitlighet, robusthet och prestanda.
- [Realtime](https://github.com/supabase/realtime) är en Elixir-server som låter dig lyssna på PostgreSQL-insättningar, uppdateringar och borttagningar med hjälp av websockets. Realtime söker Postgres inbyggda replikeringsfunktionalitet efter databasändringar, omvandlar ändringarna till JSON och sänder sedan JSON via websockets till auktoriserade klienter.
- [PostgREST](http://postgrest.org/) är en webbserver som omvandlar din PostgreSQL-databas direkt till ett RESTful API
- [pg_graphql](http://github.com/supabase/pg_graphql/) är ett PostgreSQL-tillägg som exponerar ett GraphQL API
- [Storage](https://github.com/supabase/storage-api) tillhandahåller ett RESTful-gränssnitt för hantering av filer som lagras i S3, där Postgres används för att hantera behörigheter.
- [postgres-meta](https://github.com/supabase/postgres-meta) är ett RESTful API för hantering av Postgres, så att du kan hämta tabeller, lägga till roller, köra frågor osv.
- [GoTrue](https://github.com/netlify/gotrue) är ett SWT-baserat API för hantering av användare och utfärdande av SWT-tokens.
- [Kong](https://github.com/Kong/kong) är en molnbaserad API-gateway.

#### Klientbibliotek

Vårt tillvägagångssätt för klientbibliotek är modulärt. Varje delbibliotek är en fristående implementering för ett enda externt system. Detta är ett av de sätt på vilka vi stöder befintliga verktyg.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>Språk</th>
    <th>Klient</th>
    <th colspan="5">Feature-Clients (ingår i Supabase-klienten)</th>
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
  
  <th colspan="7">⚡️ Officiell ⚡️</th>
  
  <tr>
    <td>JavaScript (TypeScript)</td>
    <td><a href="https://github.com/supabase/supabase-js" target="_blank" rel="noopener noreferrer">supabase-js</a></td>
    <td><a href="https://github.com/supabase/postgrest-js" target="_blank" rel="noopener noreferrer">postgrest-js</a></td>
    <td><a href="https://github.com/supabase/gotrue-js" target="_blank" rel="noopener noreferrer">gotrue-js</a></td>
    <td><a href="https://github.com/supabase/realtime-js" target="_blank" rel="noopener noreferrer">realtime-js</a></td>
    <td><a href="https://github.com/supabase/storage-js" target="_blank" rel="noopener noreferrer">storage-js</a></td>
    <td><a href="https://github.com/supabase/functions-js" target="_blank" rel="noopener noreferrer">functions-js</a></td>
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
  
  <th colspan="7">💚 Community 💚</th>
  
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

## Översättningar

- [Arabiska | العربية](/i18n/README.ar.md)
- [albanska / Shqip](/i18n/README.sq.md)
- [Bangla / বাংলা](/i18n/README.bn.md)
- [Bulgariska / Български](/i18n/README.bg.md)
- [Katalanska / Català](/i18n/README.ca.md)
- [Danska / Dansk](/i18n/README.da.md)
- [Nederländska / Nederlands](/i18n/README.nl.md)
- [Engelska](https://github.com/supabase/supabase)
- [finska / Suomalainen](/i18n/README.fi.md)
- [Franska / Français](/i18n/README.fr.md)
- [Tyska / Deutsch](/i18n/README.de.md)
- [Grekiska / Ελληνικά](/i18n/README.gr.md)
- [Hebreiska / עברית](/i18n/README.he.md)
- [Hindi / हिंदी](/i18n/README.hi.md)
- [Ungerska / Magyar](/i18n/README.hu.md)
- [Nepali / नेपाली](/i18n/README.ne.md)
- [Indonesiska / Bahasa Indonesia](/i18n/README.id.md)
- [Italienska / Italiano](/i18n/README.it.md)
- [Japanska / 日本語](/i18n/README.jp.md)
- [Koreanska / 한국어](/i18n/README.ko.md)
- [Malay / Bahasa Malaysia](/i18n/README.ms.md)
- [Norsk (Bokmål) / Norsk (Bokmål)](/i18n/README.nb-no.md)
- [Persiska / فارسی](/i18n/README.fa.md)
- [Polska / Polski](/i18n/README.pl.md)
- [Portugisiska / Português](/i18n/README.pt.md)
- [Portugisiska (Brasilien) / Português Brasileiro](/i18n/README.pt-br.md)
- [Rumänska / Română](/i18n/README.ro.md)
- [Ryska / Pусский](/i18n/README.ru.md)
- [Serbiska / Srpski](/i18n/README.sr.md)
- [Sinhala / සිංහල](/i18n/README.si.md)
- [Spanska / Español](/i18n/README.es.md)
- [Förenklad kinesiska / 简体中文](/i18n/README.zh-cn.md)
- [Swedish / Svenska](/i18n/README.sv.md)
- [Thai / ไทย](/i18n/README.th.md)
- [Traditionell kinesiska / 繁体中文](/i18n/README.zh-tw.md)
- [Turkiska / Türkçe](/i18n/README.tr.md)
- [Ukrainska / Українська](/i18n/README.uk.md)
- [Vietnamesiska / Tiếng Việt](/i18n/README.vi-vn.md)
- [Förteckning över översättningar](/i18n/languages.md) <!--- Keep only this -->

---

## Sponsorer

[![Ny sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
