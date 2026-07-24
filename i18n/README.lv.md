<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) ir atvērtā koda Firebase alternatīva. Mēs veidojam Firebase funkcijas, izmantojot uzņēmumu klases atvērtā pirmkoda rīkus.

- [x] Hosted Postgres datubāze. [Dokumenti](https://supabase.com/docs/guides/database)
- [x] Autentifikācija un autorizācija. [Dokumenti](https://supabase.com/docs/guides/auth)
- [x] Automātiski ģenerēti API.
  - [x] REST. [Dokumenti](https://supabase.com/docs/guides/api#rest-api-overview)
  - [x] GraphQL. [Dokumenti](https://supabase.com/docs/guides/api#graphql-api-overview)
  - [x] Reāllaika abonēšana. [Dokumenti](https://supabase.com/docs/guides/api#realtime-api-overview)
- [x] Funkcijas.
  - [x] Datubāzes funkcijas. [Dokumenti](https://supabase.com/docs/guides/database/functions)
  - [x] Edge funkcijas [Dokumenti](https://supabase.com/docs/guides/functions)
- [x] Failu glabāšana. [Dokumenti](https://supabase.com/docs/guides/storage)
- [x] Vadības panelis

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## Dokumentācija

Pilnu dokumentāciju skatīt [supabase.com/docs](https://supabase.com/docs)

Lai uzzinātu, kā veikt iemaksas, apmeklējiet [Getting Started](../DEVELOPERS.md)

## Kopiena un atbalsts

- [Kopienas forums](https://github.com/supabase/supabase/discussions). Vislabāk piemērots: palīdzībai veidošanā, diskusijām par datubāzes paraugpraksi.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Vislabākais: kļūdas un kļūdas, ar kurām jūs sastopaties, izmantojot Supabase.
- [E-pasta atbalsts](https://supabase.com/docs/support#business-support). Vislabāk piemērots: problēmām ar jūsu datu bāzi vai infrastruktūru.
- [Discord](https://discord.supabase.com). Vislabākais: lai dalītos ar savām lietojumprogrammām un komunicētu ar kopienu.

## Status

- [x] Alfa: Mēs testējam Supabase ar slēgtu klientu kopu
- [x] Publiskā alfa versija: [supabase.com/dashboard](https://supabase.com/dashboard). Bet nesteidzieties, ir dažas nepilnības
- [x] Publiskā beta versija: Pietiekami stabila lielākajai daļai ar uzņēmumu nesaistītu lietošanas gadījumu
- [ ] Publisks: Vispārēja pieejamība [[status](https://supabase.com/docs/guides/getting-started/features#feature-status)]]

Pašlaik mēs esam Publiskās beta versijas fāzē. Lai saņemtu paziņojumus par galvenajiem atjauninājumiem, skatiet šīs repozitorija "releases".

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Kā tas darbojas

Supabase ir atvērtā koda rīku kombinācija. Mēs veidojam Firebase funkcijas, izmantojot atvērtā pirmkoda produktus, kas paredzēti uzņēmumiem. Ja pastāv rīki un kopienas ar MIT, Apache 2 vai līdzvērtīgu atvērto licenci, mēs izmantosim un atbalstīsim šo rīku. Ja rīks nepastāv, mēs paši to izveidosim un izveidosim ar atklātā pirmkoda licenci. Supabase nav Firebase kartēšana 1 pret 1. Mūsu mērķis ir nodrošināt izstrādātājiem Firebase līdzīgu izstrādātāja pieredzi, izmantojot atvērtā koda rīkus.

**Arhitektūra**

Supabase ir [izvietota platforms](https://supabase.com/dashboard). Jūs varat reģistrēties un sākt izmantot Supabase, neko neinstalējot.
Jūs varat arī [pašmāju resursus](https://supabase.com/docs/guides/hosting/overview) un [izstrādāt lokāli](https://supabase.com/docs/guides/local-development).

![Arhitektūra](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.svg)

- [PostgreSQL](https://www.postgresql.org/) ir objekt-relatīvo datubāzu sistēma, kas aktīvi tiek attīstīta vairāk nekā 30 gadus, un tā ir ieguvusi labu reputāciju uzticamības, funkciju robustuma un veiktspējas ziņā.
- [Realtime](https://github.com/supabase/realtime) ir Elixir serveris, kas ļauj klausīties PostgreSQL ievadi, atjauninājumi un dzēšana, izmantojot websockets. Realtime aptaujā Postgres iebūvēto replikācijas funkcionalitāti par izmaiņām datubāzē, konvertē izmaiņas JSON un pēc tam pārraida JSON pa websockets autorizētiem klientiem.
- [PostgREST](http://postgrest.org/) ir tīmekļa serveris, kas pārvērš PostgreSQL datubāzi tieši RESTful API
- [pg_graphql](http://github.com/supabase/pg_graphql/) ir PostgreSQL paplašinājums, kas atklāj GraphQL API
- [Storage](https://github.com/supabase/storage-api) nodrošina RESTful saskarni S3 glabātu failu pārvaldībai, izmantojot Postgres atļauju pārvaldībai.
- [postgres-meta](https://github.com/supabase/postgres-meta) ir RESTful API jūsu Postgres pārvaldībai, kas ļauj jums iegūt tabulas, pievienot lomas, veikt pieprasījumus utt.
- [GoTrue](https://github.com/netlify/gotrue) ir uz SWT balstīts API lietotāju pārvaldībai un SWT žetonu izsniegšanai.
- [Kong](https://github.com/Kong/kong) ir mākoņdatošanas API vārtejas.

#### Klienta bibliotēkas

Mūsu pieeja klientu bibliotēkām ir modulāra. Katra apakšbibliotēka ir atsevišķa implementācija vienai ārējai sistēmai. Tas ir viens no veidiem, kā mēs atbalstām esošos rīkus.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>Valoda</th>
    <th>Klients</th>
    <th colspan="5">Funkciju klienti (komplektā ar Supabase klientu)</th>
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
  
  <th colspan="7">⚡️ Oficiālais ⚡️</th>
  
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
  
  <th colspan="7">💚 Kopiena 💚</th>
  
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

## Tulkojumi

- [Arābu valodā | العربية](/i18n/README.ar.md)
- [albāņu / Shqip](/i18n/README.sq.md)
- [Bangla / বাংলা](/i18n/README.bn.md)
- [bulgāru / Български](/i18n/README.bg.md)
- [Kataloniski / Català](/i18n/README.ca.md)
- [Danish / Dansk](/i18n/README.da.md)
- [Dutch / Nederlands](/i18n/README.nl.md)
- [angļu valodā](https://github.com/supabase/supabase)
- [Somu / somu valodā](/i18n/README.fi.md)
- [Franču valodā](/i18n/README.fr.md)
- [Vācu / Deutsch](/i18n/README.de.md)
- [Grieķu valoda / Ελληνικά](/i18n/README.gr.md)
- [ivrits / עברית](/i18n/README.he.md)
- [Hindi / हिंदी](/i18n/README.hi.md)
- [ungāru / magyar](/i18n/README.hu.md)
- [Nepāliešu / नेपाली](/i18n/README.ne.md)
- [Indonēziešu valoda / Bahasa Indonesia](/i18n/README.id.md)
- [Itāļu valoda / Italiano](/i18n/README.it.md)
- [japāņu / 日本語](/i18n/README.jp.md)
- [korejiešu valodā / 한국어](/i18n/README.ko.md)
- [Malajiešu / Bahasa Malaysia](/i18n/README.ms.md)
- [Norvēģu (Bokmål) / Norsk (Bokmål)](/i18n/README.nb-no.md)
- [Persiešu valoda / فارسی](/i18n/README.fa.md)
- [Poļu / Polski](/i18n/README.pl.md)
- [Portugāļu / portugāļu / Português](/i18n/README.pt.md)
- [Portugāļu (Brazīlijas) / Português Brasileiro](/i18n/README.pt-br.md)
- [Rumāņu valoda / Română](/i18n/README.ro.md)
- [Krievu / Pусский](/i18n/README.ru.md)
- [Serbian / Srpski](/i18n/README.sr.md)
- [Sinhala / සිංහල](/i18n/README.si.md)
- [Spanish / Español](/i18n/README.es.md)
- [Vienkāršotā ķīniešu valoda / 简体中文](/i18n/README.zh-cn.md)
- [zviedru valodā / Svenska](/i18n/README.sv.md)
- [Thai / ไทย](/i18n/README.th.md)
- [Tradicionālā ķīniešu valoda / 繁體中文](/i18n/README.zh-tw.md)
- [Turkish / Türkçe](/i18n/README.tr.md)
- [ukraiņu / Українська](/i18n/README.uk.md)
- [Vjetnamiešu / Tiếng Việt](/i18n/README.vi-vn.md)
- [Tulkojumu saraksts](/i18n/languages.md) <!--- Keep only this -->

---

## Sponsori

[![Jauns sponsors](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
