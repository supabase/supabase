<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) je open source alternatíva Firebase. Funkcie Firebase budujeme pomocou open source nástrojov podnikovej triedy.

- [x] hostovaná databáza Postgres. [Dokumenty](https://supabase.com/docs/guides/database)
- [x] Autentifikácia a autorizácia. [Dokumenty](https://supabase.com/docs/guides/auth)
- [x] Automaticky generované rozhrania API.
  - [x] REST. [Dokumenty](https://supabase.com/docs/guides/api#rest-api-overview)
  - [x] GraphQL. [Dokumenty](https://supabase.com/docs/guides/api#graphql-api-overview)
  - [x] Odbery v reálnom čase. [Docs](https://supabase.com/docs/guides/api#realtime-api-overview)
- [x] Funkcie.
  - [x] Databázové funkcie. [Docs](https://supabase.com/docs/guides/database/functions)
  - [x] Okrajové funkcie [Docs](https://supabase.com/docs/guides/functions)
- [x] Ukladanie súborov. [Dokumenty](https://supabase.com/docs/guides/storage)
- [x] Prístrojový panel

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## Dokumentácia

Úplnú dokumentáciu nájdete na stránke [supabase.com/docs](https://supabase.com/docs)

Ak chcete zistiť, ako prispievať, navštívte stránku [Začíname](../DEVELOPERS.md)

## Komunita a podpora

- [Fórum komunity](https://github.com/supabase/supabase/discussions). Najlepšie pre: pomoc pri vytváraní, diskusie o osvedčených postupoch pri práci s databázou.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Najlepšie pre: chyby a omyly, na ktoré narazíte pri používaní databázy Supabase.
- [E-mailová podpora](https://supabase.com/docs/support#business-support). Najlepšie pre: problémy s vašou databázou alebo infraštruktúrou.
- [Discord](https://discord.supabase.com). Najlepšie na: zdieľanie vašich aplikácií a stretávanie sa s komunitou.

## Stav

- [x] Alfa: Testujeme Supabase s uzavretým súborom zákazníkov
- [x] Verejná alfa: [supabase.com/dashboard](https://supabase.com/dashboard). Ale buďte na nás mierni, je tu niekoľko zádrheľov
- [x] Verejná beta verzia: Dostatočne stabilná pre väčšinu prípadov použitia, ktoré nie sú určené pre podniky
- [ ] Verejná: Všeobecná dostupnosť [[status](https://supabase.com/docs/guides/getting-started/features#feature-status)]

Momentálne sme vo verejnej beta verzii. Sledujte "releases" tohto repozitára, aby ste boli upozornení na hlavné aktualizácie.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Ako to funguje

Supabase je kombináciou nástrojov s otvoreným zdrojovým kódom. Funkcie Firebase budujeme pomocou produktov s otvoreným zdrojovým kódom podnikovej úrovne. Ak existujú nástroje a komunity s otvorenou licenciou MIT, Apache 2 alebo ekvivalentnou otvorenou licenciou, budeme tento nástroj používať a podporovať. Ak nástroj neexistuje, vytvoríme ho a použijeme open source sami. Databáza Supabase nie je mapovaním databázy Firebase v pomere 1:1. Naším cieľom je poskytnúť vývojárom vývojársky zážitok podobný Firebase pomocou nástrojov s otvoreným zdrojovým kódom.

**Architektúra**

Supabase je [hostovaná platforms](https://supabase.com/dashboard). Môžete sa zaregistrovať a začať používať Supabase bez toho, aby ste čokoľvek inštalovali.
Môžete tiež [samostatne hosťovať](https://supabase.com/docs/guides/hosting/overview) a [vyvíjať lokálne](https://supabase.com/docs/guides/local-development).

![Architektúra](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.svg)

- [PostgreSQL](https://www.postgresql.org/) je objektovo-relačný databázový systém s viac ako 30 rokmi aktívneho vývoja, ktorý si získal dobrú povesť vďaka spoľahlivosti, robustnosti funkcií a výkonu.
- [Realtime](https://github.com/supabase/realtime) je server Elixir, ktorý umožňuje počúvať vkladanie, aktualizáciu a mazanie údajov PostgreSQL pomocou webových soketov. Realtime vyhľadáva zmeny v databáze pomocou zabudovanej replikačnej funkcie Postgresu, konvertuje zmeny na JSON a potom vysiela JSON cez websockety autorizovaným klientom.
- [PostgREST](http://postgrest.org/) je webový server, ktorý zmení vašu databázu PostgreSQL priamo na RESTful API
- [pg_graphql](http://github.com/supabase/pg_graphql/) je rozšírenie PostgreSQL, ktoré vystavuje GraphQL API
- [Storage](https://github.com/supabase/storage-api) poskytuje RESTful rozhranie na správu súborov uložených v S3, pričom na správu oprávnení používa Postgres.
- [postgres-meta](https://github.com/supabase/postgres-meta) je RESTful API na správu Postgresu, ktoré umožňuje načítavať tabuľky, pridávať roly a spúšťať dotazy atď.
- [GoTrue](https://github.com/netlify/gotrue) je API založené na SWT na správu používateľov a vydávanie tokenov SWT.
- [Kong](https://github.com/Kong/kong) je cloudová brána API.

knižnice #### Client

Náš prístup ku klientskym knižniciam je modulárny. Každá čiastková knižnica je samostatnou implementáciou pre jeden externý systém. Je to jeden zo spôsobov, ako podporujeme existujúce nástroje.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>Jazyk</th>
    <th>Klient</th>
    <th colspan="5">Feature-Clients (v balíku s klientom Supabase)</th>
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
  
  <th colspan="7">⚡️ Oficiálna stránka ⚡️</th>
  
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
  
  <th colspan="7">💚 Komunita 💚</th>
  
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

## Preklady

- [Arabčina | العربية](/i18n/README.ar.md)
- [Albánčina / Shqip](/i18n/README.sq.md)
- [Bangla / বাংলা](/i18n/README.bn.md)
- [Bulharský / Български](/i18n/README.bg.md)
- [Katalánčina / Català](/i18n/README.ca.md)
- [dánsky / Dansk](/i18n/README.da.md)
- [Dutch / Nederlands](/i18n/README.nl.md)
- [Angličtina](https://github.com/supabase/supabase)
- [Fínsky / Suomalainen](/i18n/README.fi.md)
- [Francúzština / Français](/i18n/README.fr.md)
- [Nemčina / Deutsch](/i18n/README.de.md)
- [Gréčtina / Ελληνικά](/i18n/README.gr.md)
- [Hebrejčina / עברית](/i18n/README.he.md)
- [Hindčina / हिंदी](/i18n/README.hi.md)
- [Hungarian / Magyar](/i18n/README.hu.md)
- [Nepálčina / नेपाली](/i18n/README.ne.md)
- [Indonézština / Bahasa Indonesia](/i18n/README.id.md)
- [Taliančina / Italiano](/i18n/README.it.md)
- [Japončina / 日本語](/i18n/README.jp.md)
- [Kórejčina / 한국어](/i18n/README.ko.md)
- [Malajčina / Bahasa Malaysia](/i18n/README.ms.md)
- [Nórčina (Bokmål) / Norsk (Bokmål)](/i18n/README.nb-no.md)
- [Perzština / فارسی](/i18n/README.fa.md)
- [Poľština / Polski](/i18n/README.pl.md)
- [Portugalčina / Português](/i18n/README.pt.md)
- [Portugalčina (brazílčina) / Português Brasileiro](/i18n/README.pt-br.md)
- [Rumunský jazyk / Română](/i18n/README.ro.md)
- [Russian / Pусский](/i18n/README.ru.md)
- [srbský / Srpski](/i18n/README.sr.md)
- [Sinhala / සිංහල](/i18n/README.si.md)
- [Spanish / Español](/i18n/README.es.md)
- [Zjednodušená čínština / 简体中文](/i18n/README.zh-cn.md)
- [Švédčina / Svenska](/i18n/README.sv.md)
- [Thai / ไทย](/i18n/README.th.md)
- [Tradičná čínština / 繁體中文](/i18n/README.zh-tw.md)
- [Turečtina / Türkçe](/i18n/README.tr.md)
- [Ukrajinčina / Українська](/i18n/README.uk.md)
- [Vietnamčina / Tiếng Việt](/i18n/README.vi-vn.md)
- [Zoznam prekladov](/i18n/languages.md) <!--- Keep only this -->

---

## Sponzori

[![Nový sponzor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
