<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) on avatud lähtekoodiga Firebase'i alternatiiv. Me ehitame Firebase'i funktsioonid, kasutades ettevõtlusklassi avatud lähtekoodiga tööriistu.

- [x] Hostitud Postgres andmebaas. [Dokumendid](https://supabase.com/docs/guides/database)
- [x] Autentimine ja autoriseerimine. [Dokumendid](https://supabase.com/docs/guides/auth)
- [x] Automaatselt genereeritud APId.
  - [x] REST. [Dokumendid](https://supabase.com/docs/guides/api#rest-api-overview)
  - [x] GraphQL. [Dokumendid](https://supabase.com/docs/guides/api#graphql-api-overview)
  - [x] Reaalajas toimivad tellimused. [Dokumendid](https://supabase.com/docs/guides/api#realtime-api-overview)
- [x] Funktsioonid.
  - [x] Andmebaasi funktsioonid. [Dokumendid](https://supabase.com/docs/guides/database/functions)
  - [x] Edge Functions [Docs](https://supabase.com/docs/guides/functions)
- [x] Faili salvestamine. [Dokumendid](https://supabase.com/docs/guides/storage)
- [x] Armatuurlaud

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## Dokumentatsioon

Täieliku dokumentatsiooni saamiseks külastage [supabase.com/docs](https://supabase.com/docs)

Et näha, kuidas panustada, külastage [Getting Started](../DEVELOPERS.md)

## Kogukond ja tugi

- [Ühenduse foorum](https://github.com/supabase/supabase/discussions). Parim: abi ehitamisel, arutelu andmebaasi parimate tavade üle.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Parim lahendus: vead ja vead, millega Supabase'i kasutades kokku puutute.
- [E-posti tugi](https://supabase.com/docs/support#business-support). Parim lahendus: probleemid andmebaasi või infrastruktuuriga.
- [Discord](https://discord.supabase.com). Parim: oma rakenduste jagamiseks ja kogukonnaga suhtlemiseks.

## Staatus

- [x] Alpha: Me testime Supabase'i suletud kliendikogumiga
- [x] Avalik Alpha: Igaüks saab registreeruda aadressil [supabase.com/dashboard](https://supabase.com/dashboard). Kuid olge meiega ettevaatlikud, seal on mõned veidrused
- [x] Avalik beeta: Piisavalt stabiilne enamiku mitte-ettevõtluskasutuse jaoks
- [ ] Avalik: Üldine kättesaadavus [[status](https://supabase.com/docs/guides/getting-started/features#feature-status)]

Oleme praegu Public Beta versioonis. Jälgige selle repo "releases", et saada teateid suuremate uuenduste kohta.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Kuidas see töötab

Supabase on avatud lähtekoodiga tööriistade kombinatsioon. Me ehitame Firebase'i funktsioonid üles, kasutades ettevõtte kvaliteediga avatud lähtekoodiga tooteid. Kui tööriistad ja kogukonnad on olemas MIT, Apache 2 või samaväärse avatud litsentsiga, kasutame ja toetame seda tööriista. Kui tööriista ei ole olemas, siis ehitame selle ise ja kasutame avatud lähtekoodi. Supabase ei ole Firebase'i 1:1 kaardistus. Meie eesmärk on pakkuda arendajatele Firebase'ile sarnast arenduskogemust, kasutades avatud lähtekoodiga tööriistu.

**Arhitektuur**

Supabase on [hostitud platvorm](https://supabase.com/dashboard). Võite registreeruda ja alustada Supabase'i kasutamist ilma midagi installimata.
Võite ka [ise hostida](https://supabase.com/docs/guides/hosting/overview) ja [arendada lokaalselt](https://supabase.com/docs/guides/local-development).

![Arhitektuur](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.svg)

- [PostgreSQL](https://www.postgresql.org/) on objekt-relatsiooniline andmebaasisüsteem, mille aktiivne arendamine on kestnud üle 30 aasta ja mis on saavutanud hea maine usaldusväärsuse, funktsioonide töökindluse ja jõudluse poolest.
- [Realtime](https://github.com/supabase/realtime) on Elixir server, mis võimaldab kuulata PostgreSQL-i sisestusi, uuendusi ja kustutusi veebisokkide abil. Realtime küsib Postgres'i sisseehitatud replikatsioonifunktsioone andmebaasi muudatuste kohta, konverteerib muudatused JSON-iks ja edastab seejärel JSON-i üle websocketi volitatud klientidele.
- [PostgREST](http://postgrest.org/) on veebiserver, mis muudab teie PostgreSQL andmebaasi otse RESTful API-ks
- [pg_graphql](http://github.com/supabase/pg_graphql/) on PostgreSQLi laiendus, mis avab GraphQL API
- [Storage](https://github.com/supabase/storage-api) pakub RESTful liidest S3-s salvestatud failide haldamiseks, kasutades Postgres'i õiguste haldamiseks.
- [postgres-meta](https://github.com/supabase/postgres-meta) on RESTful API oma Postgres'i haldamiseks, mis võimaldab tabelite hankimist, rollide lisamist ja päringute käivitamist jne.
- [GoTrue](https://github.com/netlify/gotrue) on SWT-põhine API kasutajate haldamiseks ja SWT-tokenite väljastamiseks.
- [Kong](https://github.com/Kong/kong) on pilvepõhine API-värav.

#### Klientide raamatukogud

Meie lähenemine kliendiraamatukogudele on modulaarne. Iga alamraamatukogu on iseseisev implementatsioon ühe välissüsteemi jaoks. See on üks viis, kuidas me toetame olemasolevaid vahendeid.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>Keel</th>
    <th>Klient</th>
    <th colspan="5">Funktsioon-kliendid (komplekteeritud Supabase'i kliendiga)</th>
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
  
  <th colspan="7">⚡️ Ametlik ⚡️</th>
  
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
  
  <th colspan="7">💚 Kogukond 💚</th>
  
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

## Tõlked

- [araabia | العربية](/i18n/README.ar.md)
- [Albaania / Shqip](/i18n/README.sq.md)
- [Bangla / বাংলা](/i18n/README.bn.md)
- [bulgaaria / Български](/i18n/README.bg.md)
- [katalaani / Català](/i18n/README.ca.md)
- [Taani / Dansk](/i18n/README.da.md)
- [Hollandi keel / Nederlands](/i18n/README.nl.md)
- [inglise keel](https://github.com/supabase/supabase)
- [Soome / Suomalainen](/i18n/README.fi.md)
- [Prantsuse / Français](/i18n/README.fr.md)
- [Saksa / Deutsch](/i18n/README.de.md)
- [Kreeka / Ελληνικά](/i18n/README.gr.md)
- [heebrea / עברית](/i18n/README.he.md)
- [Hindi / हिंदी](/i18n/README.hi.md)
- [Ungari / Magyar](/i18n/README.hu.md)
- [Nepali / नेपाली](/i18n/README.ne.md)
- [Indoneesia / Bahasa Indonesia](/i18n/README.id.md)
- [Itaalia keel / Italiano](/i18n/README.it.md)
- [Jaapani / 日本語](/i18n/README.jp.md)
- [Korea / 한국어](/i18n/README.ko.md)
- [Malai / Bahasa Malaysia](/i18n/README.ms.md)
- [Norra keel (Bokmål) / Norsk (Bokmål)](/i18n/README.nb-no.md)
- [Pärsia keel / فارسی](/i18n/README.fa.md)
- [Poola / Polski](/i18n/README.pl.md)
- [Portugali / Português](/i18n/README.pt.md)
- [Portugali (Brasiilia) / Português Brasileiro](/i18n/README.pt-br.md)
- [Rumeenia / Română](/i18n/README.ro.md)
- [Vene / Pусский](/i18n/README.ru.md)
- [Serbia / Srpski](/i18n/README.sr.md)
- [singhala / සිංහල](/i18n/README.si.md)
- [Hispaania / Español](/i18n/README.es.md)
- [Lihtsustatud hiina keel / 简体中文](/i18n/README.zh-cn.md)
- [Rootsi / Svenska](/i18n/README.sv.md)
- [Tai / ไทย](/i18n/README.th.md)
- [Traditsiooniline hiina keel / 繁體中文](/i18n/README.zh-tw.md)
- [Turkish / Türkçe](/i18n/README.tr.md)
- [Ukraina / Українська](/i18n/README.uk.md)
- [Vietnami keel / Tiếng Việt](/i18n/README.vi-vn.md)
- [Tõlgete loetelu](/i18n/languages.md) <!--- Keep only this -->

---

## Sponsorid

[![Uus sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
