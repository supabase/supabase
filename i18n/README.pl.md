<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) to alternatywa dla Firebase o otwartym kodzie źródłowym. Tworzymy funkcje Firebase przy użyciu narzędzi open source klasy korporacyjnej.

- [x] hostowana baza danych Postgres [x]. [Dokumenty](https://supabase.com/docs/guides/database)
- [x] uwierzytelnianie i autoryzacja [x]. [Dokumenty](https://supabase.com/docs/guides/auth)
- [x] Automatycznie generowane interfejsy API.
  - [x] REST. [Docs](https://supabase.com/docs/guides/api#rest-api-overview)
  - [x] GraphQL. [Docs](https://supabase.com/docs/guides/api#graphql-api-overview)
  - [x] Subskrypcje w czasie rzeczywistym. [Docs](https://supabase.com/docs/guides/api#realtime-api-overview)
- [x] Funkcje.
  - [x] Funkcje bazy danych. [Docs](https://supabase.com/docs/guides/database/functions)
  - [x] Funkcje brzegowe [Docs](https://supabase.com/docs/guides/functions)
- przechowywanie plików [x]. [Docs](https://supabase.com/docs/guides/storage)
- [Pulpit nawigacyjny

![Pulpit nawigacyjny Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## Dokumentacja

Pełna dokumentacja znajduje się na stronie [supabase.com/docs](https://supabase.com/docs)

Aby zobaczyć, jak wnieść swój wkład, odwiedź [Getting Started](../DEVELOPERS.md)

## Społeczność i wsparcie

- [Forum społeczności](https://github.com/supabase/supabase/discussions). Najlepsze do: pomocy w budowaniu, dyskusji o najlepszych praktykach dotyczących baz danych.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Najlepszy do: błędów i błędów napotkanych podczas korzystania z Supabase.
- [Email Support](https://supabase.com/docs/support#business-support). Najlepsze w przypadku: problemów z bazą danych lub infrastrukturą.
- [Discord](https://discord.supabase.com). Najlepszy do: dzielenia się aplikacjami i spędzania czasu ze społecznością.

## Status

- [x] Alpha: Testujemy Supabase z zamkniętą grupą klientów
- [x] Publiczna wersja alfa: Każdy może zarejestrować się na stronie [supabase.com/dashboard](https://supabase.com/dashboard). Ale spokojnie, jest kilka niedociągnięć
- [x] Publiczna beta: Wystarczająco stabilna dla większości przypadków użycia innych niż korporacyjne
- [] Public: Ogólna dostępność [[status](https://supabase.com/docs/guides/getting-started/features#feature-status)]

Obecnie jesteśmy w Publicznej Becie. Obserwuj "wydania" tego repozytorium, aby otrzymywać powiadomienia o ważniejszych aktualizacjach.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Jak to działa

Supabase to połączenie narzędzi open source. Tworzymy funkcje Firebase przy użyciu produktów open source klasy korporacyjnej. Jeśli narzędzia i społeczności istnieją, z licencją MIT, Apache 2 lub równoważną otwartą licencją, będziemy używać i wspierać to narzędzie. Jeśli narzędzie nie istnieje, sami je tworzymy i otwieramy. Supabase nie jest odwzorowaniem Firebase 1 do 1. Naszym celem jest zapewnienie programistom doświadczenia podobnego do Firebase przy użyciu narzędzi open source.

**Architektura**

Supabase jest [platformą hostowaną](https://supabase.com/dashboard). Możesz zarejestrować się i zacząć korzystać z Supabase bez instalowania czegokolwiek.
Możesz także [self-host](https://supabase.com/docs/guides/hosting/overview) i [rozwijać lokalnie](https://supabase.com/docs/guides/local-development).

![Architektura](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.svg)

- [PostgreSQL](https://www.postgresql.org/) to system obiektowo-relacyjnych baz danych z ponad 30-letnim aktywnym rozwojem, który przyniósł mu silną reputację niezawodności, solidności funkcji i wydajności.
- [Realtime](https://github.com/supabase/realtime) to serwer Elixir, który umożliwia nasłuchiwanie wstawek, aktualizacji i usuwania PostgreSQL za pomocą websockets. Realtime sonduje wbudowaną funkcję replikacji Postgres pod kątem zmian w bazie danych, konwertuje zmiany na JSON, a następnie transmituje JSON przez websockets do autoryzowanych klientów.
- [PostgREST](http://postgrest.org/) to serwer sieciowy, który zamienia bazę danych PostgreSQL bezpośrednio w interfejs API RESTful
- [pg_graphql](http://github.com/supabase/pg_graphql/) rozszerzenie PostgreSQL, które udostępnia GraphQL API
- [Storage](https://github.com/supabase/storage-api) zapewnia interfejs RESTful do zarządzania plikami przechowywanymi w S3, wykorzystując Postgres do zarządzania uprawnieniami.
- [postgres-meta](https://github.com/supabase/postgres-meta) to interfejs API RESTful do zarządzania Postgres, umożliwiający pobieranie table, dodawanie ról, uruchamianie zapytań itp.
- [GoTrue](https://github.com/netlify/gotrue) to oparte na SWT API do zarządzania użytkownikami i wydawania tokenów SWT.
- [Kong](https://github.com/Kong/kong) to natywna dla chmury brama API.

#### Biblioteki klienckie

Nasze podejście do bibliotek klienckich jest modułowe. Każda pod-biblioteka jest samodzielną implementacją dla pojedynczego systemu zewnętrznego. Jest to jeden ze sposobów, w jaki wspieramy istniejące narzędzia.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>Język</th>
    <th>Klient</th>
    <th colspan="5">Klienty funkcji (dołączone do klienta Supabase)</th>
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
  
  <th colspan="7">⚡️ Oficjalny ⚡️</th>
  
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
  
  <th colspan="7">społeczność 💚</th>
  
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

## Tłumaczenia

- [Arabski | العربية](/i18n/README.ar.md)
- [Albański / Shqip](/i18n/README.sq.md)
- [Bangla / বাংলা](/i18n/README.bn.md)
- [Bułgarski / Български](/i18n/README.bg.md)
- [Kataloński / Català](/i18n/README.ca.md)
- [Duński / Dansk](/i18n/README.da.md)
- [Holenderski / Nederlands](/i18n/README.nl.md)
- [angielski](https://github.com/supabase/supabase)
- [Fiński / Suomalainen](/i18n/README.fi.md)
- [Francuski / Français](/i18n/README.fr.md)
- [Niemiecki / Deutsch](/i18n/README.de.md)
- [Grecki / Ελληνικά](/i18n/README.gr.md)
- [Hebrajski / עברית](/i18n/README.he.md)
- [Hindi / हिंदी](/i18n/README.hi.md)
- [Węgierski / Magyar](/i18n/README.hu.md)
- [Nepalski / नेपाली](/i18n/README.ne.md)
- [Indonezyjski / Bahasa Indonesia](/i18n/README.id.md)
- [Włoski / Italiano](/i18n/README.it.md)
- [Japoński / 日本語](/i18n/README.jp.md)
- [Koreański / 한국어](/i18n/README.ko.md)
- [Malajski / Bahasa Malaysia](/i18n/README.ms.md)
- [Norweski (Bokmål) / Norsk (Bokmål)](/i18n/README.nb-no.md)
- [Perski / فارسی](/i18n/README.fa.md)
- [Polski / Polish](/i18n/README.pl.md)
- [Portugalski / Português](/i18n/README.pt.md)
- [Portugalski (brazylijski) / Português Brasileiro](/i18n/README.pt-br.md)
- [Rumuński / Română](/i18n/README.ro.md)
- [Rosyjski /усский](/i18n/README.ru.md)
- [Serbski / Srpski](/i18n/README.sr.md)
- [Sinhala / සිංහල](/i18n/README.si.md)
- [Hiszpański / Español](/i18n/README.es.md)
- [Chiński uproszczony / 简体中文](/i18n/README.zh-cn.md)
- [Szwedzki / Svenska](/i18n/README.sv.md)
- [Tajski / ไทย](/i18n/README.th.md)
- [Chiński tradycyjny / 繁體中文](/i18n/README.zh-tw.md)
- [Turecki /ürkçe](/i18n/README.tr.md)
- [Ukraiński / Українська](/i18n/README.uk.md)
- [Wietnamski / Tiếng Việt](/i18n/README.vi-vn.md)
- [Lista tłumaczeń](/i18n/languages.md) <!--- Keep only this -->

---

## Sponsorzy

[![Nowy sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
