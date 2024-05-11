<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) is een open source Firebase alternatief. We bouwen de functies van Firebase met behulp van enterprise-grade open source tools.

- [x]Gehoste Postgres Database. [Docs](https://supabase.com/docs/guides/database)
- [x] Authenticatie en Autorisatie. [Docs](https://supabase.com/docs/guides/auth)
- [x] Automatisch gegenereerde API's.
  - [x] REST. [Docs](https://supabase.com/docs/guides/api#rest-api-overview)
  - [x] GraphQL. [Docs](https://supabase.com/docs/guides/api#graphql-api-overview)
  - [x] Realtime abonnementen. [Docs](https://supabase.com/docs/guides/api#realtime-api-overview)
- [x] Functies.
  - [x] Database functies. [Docs](https://supabase.com/docs/guides/database/functions)
  - [x] Randfuncties. [Docs](https://supabase.com/docs/guides/functions)
- [x] Bestandsopslag. [Docs](https://supabase.com/docs/guides/storage)
- [x] Dashboard

[Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## Documentatie

Voor volledige documentatie, bezoek [supabase.com/docs](https://supabase.com/docs)

Om te zien hoe u kunt bijdragen, bezoek [Aan de slag](../DEVELOPERS.md)

## Gemeenschap en ondersteuning

- [Community Forum](https://github.com/supabase/supabase/discussions). Het beste voor: hulp bij het bouwen, discussie over database best practices.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Het beste voor: bugs en fouten die u tegenkomt bij het gebruik van Supabase.
- [Ondersteuning per e-mail](https://supabase.com/docs/support#business-support). Meest geschikt voor: problemen met uw database of infrastructuur.
- [Discord](https://discord.supabase.com). Het beste voor: het delen van uw applicaties en omgang met de gemeenschap.

## Status

- [Alpha: We testen Supabase met een gesloten groep klanten
- [x] Publieke Alpha: Iedereen kan zich aanmelden op [supabase.com/dashboard](https://supabase.com/dashboard). Maar doe het rustig aan, er zijn een paar kinken
- [Publieke Beta: Stabiel genoeg voor de meeste niet-bedrijfsmatige toepassingen
- [Publiek: General Availability [[status](https://supabase.com/docs/guides/getting-started/features#feature-status)]

We zijn momenteel in Openbare Beta. Bekijk "releases" van deze repo om op de hoogte te blijven van belangrijke updates.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Hoe het werkt

Supabase is een combinatie van open source tools. We bouwen de functies van Firebase met behulp van enterprise-grade, open source producten. Als de tools en communities bestaan, met een MIT, Apache 2, of gelijkwaardige open licentie, zullen we die tool gebruiken en ondersteunen. Als de tool niet bestaat, bouwen en openen we hem zelf. Supabase is geen 1-op-1 mapping van Firebase. Ons doel is om ontwikkelaars een Firebase-achtige ontwikkelaarservaring te geven met behulp van open source tools.

**Architectuur**

Supabase is een [gehost platform](https://supabase.com/dashboard). U kunt zich aanmelden en Supabase gebruiken zonder iets te installeren.
U kunt ook [zelf hosten](https://supabase.com/docs/guides/hosting/overview) en [lokaal ontwikkelen](https://supabase.com/docs/guides/local-development).

![architectuur](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.svg)

- [PostgreSQL](https://www.postgresql.org/) is een object-relationeel database systeem met meer dan 30 jaar actieve ontwikkeling die het een sterke reputatie heeft opgeleverd voor betrouwbaarheid, robuustheid en prestaties.
- [Realtime](https://github.com/supabase/realtime) is een Elixir server waarmee je kunt luisteren naar PostgreSQL inserts, updates en deletes met behulp van websockets. Realtime peilt de ingebouwde replicatiefunctionaliteit van Postgres voor database wijzigingen, converteert wijzigingen naar JSON, en zendt vervolgens de JSON over websockets uit naar geautoriseerde clients.
- [PostgREST](http://postgrest.org/) is een webserver die uw PostgreSQL database direct in een RESTful API verandert
- [pg_graphql](http://github.com/supabase/pg_graphql/) een PostgreSQL uitbreiding die een GraphQL API blootstelt
- [Storage](https://github.com/supabase/storage-api) biedt een RESTful interface voor het beheren van bestanden opgeslagen in S3, met behulp van Postgres om machtigingen te beheren.
- [postgres-meta](https://github.com/supabase/postgres-meta) is een RESTful API voor het beheer van uw Postgres, waarmee u tabellen kunt ophalen, rollen kunt toevoegen, en queries kunt uitvoeren, enz.
- [GoTrue](https://github.com/netlify/gotrue) is een SWT gebaseerde API voor het beheren van gebruikers en het uitgeven van SWT tokens.
- [Kong](https://github.com/Kong/kong) is een cloud-native API gateway.

#### Client bibliotheken

Onze aanpak voor client libraries is modulair. Elke sub-bibliotheek is een op zichzelf staande implementatie voor een enkel extern systeem. Dit is een van de manieren waarop wij bestaande tools ondersteunen.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>Taal</th>
    <th>Client</th>
    <th colspan="5">Feature-Clients (gebundeld in Supabase client)</th>
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
  
  <th colspan="7">⚡️ Officieel ⚡️</th>
  
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
  
  <th colspan="7">💚 gemeenschap 💚</th>
  
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

## Vertalingen

- [Arabisch | العربية](/i18n/README.ar.md)
- [Albanees / Shqip](/i18n/README.sq.md)
- [Bangla / বাংলা](/i18n/README.bn.md)
- [Bulgaars / Български](/i18n/README.bg.md)
- [Catalaans / Català](/i18n/README.ca.md)
- [Deens / Dansk](/i18n/README.da.md)
- [Nederlands / Nederlands](/i18n/README.nl.md)
- [Engels](https://github.com/supabase/supabase)
- [Fins / Suomalainen](/i18n/README.fi.md)
- [Frans / Français](/i18n/README.fr.md)
- [Duits / Deutsch](/i18n/README.de.md)
- [Grieks / Ελληνικά](/i18n/README.gr.md)
- [Hebreeuws / עברית](/i18n/README.he.md)
- [Hindi / हिंदी](/i18n/README.hi.md)
- [Hongaars / Magyar](/i18n/README.hu.md)
- [Nepali / नेपाली](/i18n/README.ne.md)
- [Indonesisch / Bahasa Indonesia](/i18n/README.id.md)
- [Italiaans / Italiano](/i18n/README.it.md)
- [Japans / 日本語](/i18n/README.jp.md)
- [Koreaans / 한어](/i18n/README.ko.md)
- [Maleis / Bahasa Malaysia](/i18n/README.ms.md)
- [Noors (Bokmål) / Norsk (Bokmål)](/i18n/README.nb-no.md)
- [Perzisch / فارسی](/i18n/README.fa.md)
- [Pools / Polski](/i18n/README.pl.md)
- [Portugees / Português](/i18n/README.pt.md)
- [Portugees (Braziliaans) / Português Brasileiro](/i18n/README.pt-br.md)
- [Roemeens / Română](/i18n/README.ro.md)
- [Russisch / Pусский](/i18n/README.ru.md)
- [Servisch / Srpski](/i18n/README.sr.md)
- [Sinhala / සිංහල](/i18n/README.si.md)
- [Spaans / Español](/i18n/README.es.md)
- [Vereenvoudigd Chinees / 简体中文](/i18n/README.zh-cn.md)
- [Zweeds / Svenska](/i18n/README.sv.md)
- [Thai / ไทย](/i18n/README.th.md)
- [Traditioneel Chinees / 繁體中文](/i18n/README.zh-tw.md)
- [Turks / Türkçe](/i18n/README.tr.md)
- [Oekraïens / Українська](/i18n/README.uk.md)
- [Vietnamees / Tiếng Việt](/i18n/README.vi-vn.md)
- [Lijst van vertalingen](/i18n/talen.md) <!--- Keep only this -->

---

## Sponsors

[![Nieuwe Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
