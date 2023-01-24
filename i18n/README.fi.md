<p align="center">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--light.svg#gh-light-mode-only">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--dark.svg#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) on avoimen lähdekoodin Firebase-vaihtoehto. Rakennamme Firebasen ominaisuuksia yritystason avoimen lähdekoodin työkaluilla.

- [x] Isännöity Postgres-tietokanta [Docs](https://supabase.com/docs/guides/database)
- [x] Autentikointi ja valtuutus [Docs](https://supabase.com/docs/guides/auth)
- [x] Automaattisesti luodut rajapinnat
  - [x] REST [Docs](https://supabase.com/docs/guides/api#rest-api)
  - [x] Reaaliaikaiset tilaukset [Docs](https://supabase.com/docs/guides/api#realtime-api)
  - [x] GraphQL (Beta) [Docs](https://supabase.com/docs/guides/api#graphql-api)
- [x] Funktiot
  - [x] Tietokantatoiminnot [Docs](https://supabase.com/docs/guides/database/functions)
  - [x] Reunatoiminnot [Docs](https://supabase.com/docs/guides/functions)
- [x] Tiedostojen säilytys [Docs](https://supabase.com/docs/guides/storage)
- [x] Dashboard

![Supabase hallintapaneeli](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## Dokumentaatio

Katso täydelliset dokumentaatiot osoitteesta [supabase.com/docs](https://supabase.com/docs)

Katso ohjeet osallistumiseen vierailemalla [Aloitus](../DEVELOPERS.md)

## Yhteisö ja tuki

- [Yhteisön keskustelufoorumi](https://github.com/supabase/supabase/discussions): Apua rakentamisessa, keskustelu tietokannan parhaista käytännöistä.
- [GitHub ongelmat](https://github.com/supabase/supabase/issues): Bugit ja virheet, joita kohtaat Supabasea käytettäessä.
- [Email Support](https://supabase.com/docs/support#business-support): Tietokantaan tai infrastruktuuriin liittyvät ongelmat.
- [Discord](https://discord.supabase.com): Jaa sovelluksiasi ja vietä aikaa yhteisön kanssa.

## Status

- [x] Alpha: Testaamme Supabasea suljetun asiakasjoukon kanssa
- [x] Julkinen alfa: Kuka tahansa voi rekisteröityä osoitteessa [app.supabase.com](https://app.supabase.com). Mutta rauhassa, siinä on muutamia mutkia
- [x] Julkinen beta: Riittävän vakaa useimpiin ei-yrityskäyttötapauksiin
- [ ] Julkinen: Valmistettu tuotantoon

Olemme tällä hetkellä julkisessa betaversiossa. Katso tämän repon "julkaisut", niin saat ilmoituksen tärkeimmistä päivityksistä.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Katso tämä repo"/></kbd>

---

## Kuinka se toimii

Supabase on yhdistelmä avoimen lähdekoodin työkaluja. Rakennamme Firebasen ominaisuuksia käyttämällä yritystason avoimen lähdekoodin tuotteita. Jos työkalut ja yhteisöt ovat olemassa, ja niillä on MIT, Apache 2 tai vastaava avoin lisenssi, käytämme ja tuemme kyseistä työkalua. Jos työkalua ei ole olemassa, rakennamme ja avaamme sen itse. Supabase ei ole Firebasen 1-1-kartoitus. Tavoitteemme on tarjota kehittäjille Firebasen kaltainen kehittäjäkokemus käyttämällä avoimen lähdekoodin työkaluja.

**Arkkitehtuuri**

Supabase on [isännöity alusta](https://app.supabase.com). Voit rekisteröityä ja aloittaa Supabasen käytön asentamatta mitään.
Voit myös [isännöidä itse](https://supabase.com/docs/guides/hosting/overview) ja [kehittää paikallisesti](https://supabase.com/docs/guides/local-development).

![Arkkitehtuuri](https://user-images.githubusercontent.com/70828596/187547862-ffa9d058-0c3a-4851-a3e7-92ccfca4b596.png)

- [PostgreSQL](https://www.postgresql.org/) on oliorelaatiotietokantajärjestelmä, jota on kehitetty aktiivisesti yli 30 vuoden ajan ja joka on ansainnut sille vahvan maineen luotettavuudestaan, ominaisuuksien kestävyydestään ja suorituskyvystään.
- [Realtime](https://github.com/supabase/realtime) on Elixir-palvelin, jonka avulla voit kuunnella PostgreSQL-lisäyksiä, päivityksiä ja poistoja websockettien avulla. Reaaliaikaiset kyselyt Postgresin sisäänrakennetuista replikointitoiminnoista tietokannan muutoksille, muuntaa muutokset JSON-muotoon ja lähettää sitten JSONin verkkoliitäntöjen kautta valtuutetuille asiakkaille.
- [PostgREST](http://postgrest.org/) on verkkopalvelin, joka muuttaa PostgreSQL-tietokantaasi suoraan RESTful API:ksi
- [Storage](https://github.com/supabase/storage-api) tarjoaa RESTful-käyttöliittymän S3:een tallennettujen tiedostojen hallintaan käyttämällä Postgresia käyttöoikeuksien hallintaan.
- [postgres-meta](https://github.com/supabase/postgres-meta) on RESTful-sovellusliittymä Postgresin hallintaan. Sen avulla voit noutaa taulukoita, lisätä rooleja ja suorittaa kyselyitä jne.
- [GoTrue](https://github.com/netlify/gotrue) on SWT-pohjainen sovellusliittymä käyttäjien hallintaan ja SWT-tunnuksien myöntämiseen.
- [Kong](https://github.com/Kong/kong) on ​​pilvipohjainen API-yhdyskäytävä.

#### Asiakaskirjastot

Lähestymistapamme asiakaskirjastoissa on modulaarinen. Jokainen alikirjasto on erillinen toteutus yhdelle ulkoiselle järjestelmälle. Tämä on yksi tavoista tukea olemassa olevia työkaluja.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>Kieli</th>
    <th>Client</th>
    <th colspan="5">Feature-Clients (yhdistettynä Supabase-asiakkaaseen)</th>
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
  <!-- MALLI UUDELLE RIVILLE -->
  <!-- ALOITA NYT
  <tr>
    <td>lang</td>
    <td><a href="https://github.com/supabase-community/supabase-lang" target="_blank" rel="noopener noreferrer">supabase-lang</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-lang" target="_blank" rel="noopener noreferrer">postgrest-lang</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-lang" target="_blank" rel="noopener noreferrer">gotrue-lang</a></td>
    <td><a href="https://github.com/supabase-community/realtime-lang" target="_blank" rel="noopener noreferrer">realtime-lang</a></td>
    <td><a href="https://github.com/supabase-community/storage-lang" target="_blank" rel="noopener noreferrer">storage-lang</a></td>
  </tr>
  LOPETA RIVI -->
  <th colspan="7">⚡️ Virallinen ⚡️</th>
  <tr>
    <td>JavaScript (TypeScript)</td>
    <td><a href="https://github.com/supabase/supabase-js" target="_blank" rel="noopener noreferrer">supabase-js</a></td>
    <td><a href="https://github.com/supabase/postgrest-js" target="_blank" rel="noopener noreferrer">postgrest-js</a></td>
    <td><a href="https://github.com/supabase/gotrue-js" target="_blank" rel="noopener noreferrer">gotrue-js</a></td>
    <td><a href="https://github.com/supabase/realtime-js" target="_blank" rel="noopener noreferrer">realtime-js</a></td>
    <td><a href="https://github.com/supabase/storage-js" target="_blank" rel="noopener noreferrer">storage-js</a></td>
    <td><a href="https://github.com/supabase/functions-js" target="_blank" rel="noopener noreferrer">functions-js</a></td>
  </tr>
  <th colspan="7">💚 Yhteisö 💚</th>
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
    <td>Flutter</td>
    <td><a href="https://github.com/supabase/supabase-flutter" target="_blank" rel="noopener noreferrer">supabase-dart</a></td>
    <td><a href="https://github.com/supabase/postgrest-dart" target="_blank" rel="noopener noreferrer">postgrest-dart</a></td>
    <td><a href="https://github.com/supabase/gotrue-dart" target="_blank" rel="noopener noreferrer">gotrue-dart</a></td>
    <td><a href="https://github.com/supabase/realtime-dart" target="_blank" rel="noopener noreferrer">realtime-dart</a></td>
    <td><a href="https://github.com/supabase/storage-dart" target="_blank" rel="noopener noreferrer">storage-dart</a></td>
    <td><a href="https://github.com/supabase-community/functions-dart" target="_blank" rel="noopener noreferrer">functions-dart</a></td>
  </tr>
  <tr>
    <td>Go</td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/postgrest-go" target="_blank" rel="noopener noreferrer">postgrest-go</a></td>
    <td>-</td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/storage-go" target="_blank" rel="noopener noreferrer">storage-go</a></td>
    <td>-</td>
  </tr>
  <tr>
    <td>Java</td>
    <td>-</td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/gotrue-java" target="_blank" rel="noopener noreferrer">gotrue-java</a></td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>Kotlin</td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/postgrest-kt" target="_blank" rel="noopener noreferrer">postgrest-kt</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-kt" target="_blank" rel="noopener noreferrer">gotrue-kt</a></td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
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
    <td>-</td>
  </tr>
</table>

<!--- Poista tämä luettelo, jos käännät toiselle kielelle, sillä useiden tiedostojen päivitys on vaikeaa-->
<!--- Säilytä vain linkki käännöstiedostojen luetteloon-->

## Käännökset

- [Arabic | العربية](/i18n/README.ar.md)
- [Albanian / Shqip](/i18n/README.sq.md)
- [Bangla / বাংলা](/i18n/README.bn.md)
- [Catalan / Català](/i18n/README.ca.md)
- [Danish / Dansk](/i18n/README.da.md)
- [Dutch / Nederlands](/i18n/README.nl.md)
- [English](https://github.com/supabase/supabase)
- [Finnish / Suomi](/i18n/README.fi.md)
- [French / Français](/i18n/README.fr.md)
- [German / Deutsch](/i18n/README.de.md)
- [Greek / Ελληνικά](/i18n/README.gr.md)
- [Hebrew / עברית](/i18n/README.he.md)
- [Hindi / हिंदी](/i18n/README.hi.md)
- [Hungarian / Magyar](/i18n/README.hu.md)
- [Nepali / नेपाली](/i18n/README.ne.md)
- [Indonesian / Bahasa Indonesia](/i18n/README.id.md)
- [Italian / Italiano](/i18n/README.it.md)
- [Japanese / 日本語](/i18n/README.jp.md)
- [Korean / 한국어](/i18n/README.ko.md)
- [Malay / Bahasa Malaysia](/i18n/README.ms.md)
- [Norwegian (Bokmål) / Norsk (Bokmål)](/i18n/README.nb-no.md)
- [Persian / فارسی](/i18n/README.fa.md)
- [Polish / Polski](/i18n/README.pl.md)
- [Portuguese / Portuguese](/i18n/README.pt.md)
- [Portuguese (Brazilian) / Português Brasileiro](/i18n/README.pt-br.md)
- [Romanian / Română](/i18n/README.ro.md)
- [Russian / Pусский](/i18n/README.ru.md)
- [Sinhala / සිංහල](/i18n/README.si.md)
- [Spanish / Español](/i18n/README.es.md)
- [Simplified Chinese / 简体中文](/i18n/README.zh-cn.md)
- [Swedish / Svenska](/i18n/README.sv.md)
- [Thai / ไทย](/i18n/README.th.md)
- [Traditional Chinese / 繁体中文](/i18n/README.zh-tw.md)
- [Turkish / Türkçe](/i18n/README.tr.md)
- [Ukrainian / Українська](/i18n/README.uk.md)
- [Vietnamese / Tiếng Việt](/i18n/README.vi-vn.md)
- [List of translations](/i18n/languages.md) <!--- Keep only this -->

---

## Sponsorit

[![Uudet sponsorit](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
