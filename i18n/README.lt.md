<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) yra atvirojo kodo Firebase alternatyva. Kuriame "Firebase" funkcijas naudodami įmonių klasės atvirojo kodo įrankius.

- [x] Prieglobos Postgres duomenų bazė. [Dokumentai](https://supabase.com/docs/guides/database)
- [x] Autentiškumo nustatymas ir autorizavimas. [Dokumentai](https://supabase.com/docs/guides/auth)
- [x] Automatiškai generuojamos API.
  - [x] REST. [Dokumentai](https://supabase.com/docs/guides/api#rest-api-overview)
  - [x] GraphQL. [Dokumentai](https://supabase.com/docs/guides/api#graphql-api-overview)
  - [x] Realaus laiko prenumeratos. [Dokumentai](https://supabase.com/docs/guides/api#realtime-api-overview)
- [x] Funkcijos.
  - [x] Duomenų bazės funkcijos. [Dokumentai](https://supabase.com/docs/guides/database/functions)
  - [x] Kraštų funkcijos [Docs](https://supabase.com/docs/guides/functions)
- [x] Failų saugojimas. [Dokumentai](https://supabase.com/docs/guides/storage)
- [x] Prietaisų skydelis

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## Dokumentacija

Išsamios dokumentacijos rasite [supabase.com/docs](https://supabase.com/docs)

Norėdami sužinoti, kaip prisidėti, apsilankykite [Getting Started](../DEVELOPERS.md)

## Bendruomenė ir palaikymas

- [Bendrijos forumas](https://github.com/supabase/supabase/discussions). Geriausiai tinka: pagalbai kuriant, diskusijoms apie geriausią duomenų bazių praktiką.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Geriausia: klaidos ir klaidos, su kuriomis susiduriate naudodami "Supabase".
- [Pagalba el. paštu](https://supabase.com/docs/support#business-support). Geriausiai tinka: problemoms, susijusioms su jūsų duomenų baze ar infrastruktūra, spręsti.
- [Discord](https://discord.supabase.com). Geriausiai tinka: dalytis savo programomis ir bendrauti su bendruomene.

## Statusas

- [x] Alfa: Bandome "Supabase" su uždaru klientų rinkiniu
- [x] Viešoji Alfa versija: [supabase.com/dashboard](https://supabase.com/dashboard). Tačiau neskubėkite su mumis, yra keletas trūkumų
- [x] Viešoji beta versija: Pakankamai stabili daugeliui ne įmonių naudojimo atvejų
- [ ] Vieša: Bendras prieinamumas [[statusas](https://supabase.com/docs/guides/getting-started/features#feature-status)]

Šiuo metu esame viešojoje beta versijoje. Stebėkite šios repozitorijos "releases", kad gautumėte pranešimus apie svarbius atnaujinimus.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Kaip tai veikia

"Supabase" yra atvirojo kodo įrankių derinys. Kuriame "Firebase" funkcijas naudodami įmonių klasės atvirojo kodo produktus. Jei egzistuoja įrankiai ir bendruomenės, turinčios MIT, "Apache 2" ar lygiavertę atvirąją licenciją, mes naudosime ir palaikysime tą įrankį. Jei įrankis neegzistuoja, mes patys jį sukursime ir naudosime atvirąjį kodą. "Supabase" nėra "Firebase" atvaizdavimas 1:1. Mūsų tikslas - suteikti kūrėjams panašią į "Firebase" kūrėjų patirtį naudojant atvirojo kodo įrankius.

**Architektūra**

Supabase yra [prieglobos platforma](https://supabase.com/dashboard). Galite užsiregistruoti ir pradėti naudotis "Supabase" nieko neįdiegę.
Taip pat galite [savarankiškai talpinti](https://supabase.com/docs/guides/hosting/overview) ir [kurti vietoje](https://supabase.com/docs/guides/local-development).

![Architektūra](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.svg)

- [PostgreSQL](https://www.postgresql.org/) - tai objektinė-reliacinė duomenų bazių sistema, aktyviai plėtojama daugiau kaip 30 metų, todėl ji pelnė gerą reputaciją dėl patikimumo, funkcijų tvirtumo ir našumo.
- [Realtime](https://github.com/supabase/realtime) - tai "Elixir" serveris, leidžiantis klausytis "PostgreSQL" įterpimų, atnaujinimų ir ištrynimų naudojant žiniatinklio lizdus. "Realtime" apklausia "Postgres" integruotą replikavimo funkciją dėl duomenų bazės pakeitimų, konvertuoja pakeitimus į JSON ir transliuoja JSON per žiniatinklio lizdus įgaliotiems klientams.
- [PostgREST](http://postgrest.org/) - tai žiniatinklio serveris, kuris paverčia jūsų "PostgreSQL" duomenų bazę tiesiogiai į RESTful API
- [pg_graphql](http://github.com/supabase/pg_graphql/) - "PostgreSQL" plėtinys, kuris atveria GraphQL API
- [Storage](https://github.com/supabase/storage-api) - tai REST sąsaja, skirta S3 saugomiems failams valdyti, naudojant "Postgres" leidimams valdyti.
- [postgres-meta](https://github.com/supabase/postgres-meta) - tai RESTful API, skirta "Postgres" valdymui, leidžianti gauti lenteles, pridėti vaidmenis, vykdyti užklausas ir t. t.
- [GoTrue](https://github.com/netlify/gotrue) yra SWT pagrįsta API, skirta naudotojams valdyti ir SWT žetonams išduoti.
- [Kong](https://github.com/Kong/kong) - tai debesijos API vartai.

#### Kliento bibliotekos

Mūsų požiūris į klientų bibliotekas yra modulinis. Kiekviena dalinė biblioteka yra atskira vienos išorinės sistemos realizacija. Tai vienas iš būdų, kaip mes palaikome esamas priemones.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>Kalba</th>
    <th>Klientas</th>
    <th colspan="5">Funkcijų klientai (įtraukti į "Supabase" klientą)</th>
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
  
  <th colspan="7">⚡️ Oficialus ⚡️</th>
  
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
  
  <th colspan="7">💚 Bendruomenė 💚</th>
  
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

## Vertimai

- [Arabų kalba | العربية](/i18n/README.ar.md)
- [albanų kalba / Shqip](/i18n/README.sq.md)
- [Bangla / বাংলা](/i18n/README.bn.md)
- [Bulgarian / Български](/i18n/README.bg.md)
- [Katalonų kalba](/i18n/README.ca.md)
- [Danų kalba](/i18n/README.da.md)
- [Dutch / Nederlands](/i18n/README.nl.md)
- [anglų kalba](https://github.com/supabase/supabase)
- [Suomių kalba](/i18n/README.fi.md)
- [Prancūzų kalba](/i18n/README.fr.md)
- [Vokiečių kalba / Deutsch](/i18n/README.de.md)
- [Graikų kalba / Ελληνικά](/i18n/README.gr.md)
- [Hebrajų kalba / עברית](/i18n/README.he.md)
- [Hindi / हिंदी](/i18n/README.hi.md)
- [vengrų kalba](/i18n/README.hu.md)
- [Nepali / नेपाली](/i18n/README.ne.md)
- [Indoneziečių kalba / Bahasa Indonesia](/i18n/README.id.md)
- [Italų kalba](/i18n/README.it.md)
- [Japonų kalba / 日本語](/i18n/README.jp.md)
- [Korėjiečių kalba / 한국어](/i18n/README.ko.md)
- [Malajų kalba / Bahasa Malaysia](/i18n/README.ms.md)
- [Norvegų (Bokmål) / Norsk (Bokmål)](/i18n/README.nb-no.md)
- [Persų kalba / فارسی](/i18n/README.fa.md)
- [lenkų kalba](/i18n/README.pl.md)
- [Portuguese / Português](/i18n/README.pt.md)
- [Portugalų (brazilų) / Português Brasileiro](/i18n/README.pt-br.md)
- [Rumuniškai / Română](/i18n/README.ro.md)
- [Rusų kalba / Pусский](/i18n/README.ru.md)
- [Serbian / Srpski](/i18n/README.sr.md)
- [Sinhalų kalba / සිංහල](/i18n/README.si.md)
- [ispanų kalba](/i18n/README.es.md)
- [Supaprastinta kinų kalba / 简体中文](/i18n/README.zh-cn.md)
- [švedų kalba / Svenska](/i18n/README.sv.md)
- [Thai / ไทย](/i18n/README.th.md)
- [Tradicinė kinų kalba / 繁體中文](/i18n/README.zh-tw.md)
- [Turkų kalba](/i18n/README.tr.md)
- [Ukrainiečių kalba / Українська](/i18n/README.uk.md)
- [Vietnamiečių kalba / Tiếng Việt](/i18n/README.vi-vn.md)
- [Vertimų sąrašas](/i18n/languages.md) <!--- Keep only this -->

---

## Rėmėjai

[![Naujas rėmėjas](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
