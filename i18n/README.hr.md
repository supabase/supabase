<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) je open source alternativa Firebaseu. Izgrađujemo funkcionalnosti Firebasea koristeći enterprise-grade open source alate.

- [x] Hostana Postgres baza podataka. [Dokumentacija](https://supabase.com/docs/guides/database)
- [x] Autentifikacija i autorizacija. [Dokumentacija](https://supabase.com/docs/guides/auth)
- [x] Automatski generirani API-ji.
  - [x] REST. [Dokumentacija](https://supabase.com/docs/guides/api#rest-api-overview)
  - [x] GraphQL. [Dokumentacija](https://supabase.com/docs/guides/api#graphql-api-overview)
  - [x] Pretplate u realnom vremenu. [Dokumentacija](https://supabase.com/docs/guides/api#realtime-api-overview)
- [x] Funkcije.
  - [x] Funkcije baza podataka. [Dokumentacija](https://supabase.com/docs/guides/database/functions)
  - [x] Edge funkcije [Dokumentacija](https://supabase.com/docs/guides/functions)
- [x] Pohranjivanje datoteka. [Dokumentacija](https://supabase.com/docs/guides/storage)
- [x] Panel

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Pratite "izdanja" ovog repozitorija da bi bili obaviješteni o većim ažuriranjima.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

## Dokumentacija

Za cjelovitu dokumentaciju, posjetite [supabase.com/docs](https://supabase.com/docs)

Za informacije kako doprinijeti razvoju, posjetite [Početak rada](./DEVELOPERS.md)

## Zajednica & Podrška

- [Forum zajednice](https://github.com/supabase/supabase/discussions). Najbolje služi za: pomoć pri izgradnji, diskusiji o najboljoj praksi oko baza podataka.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Najbolje služi za: bugove i greške na koje ste naišli koristeći Supabase.
- [Email potpora](https://supabase.com/docs/support#business-support). Najbolje služi za: probleme oko vaše baze podataka ili oko infrastrukture.
- [Discord](https://discord.supabase.com). Najbolje služi za: pokazati vaše aplikacije i druženje sa ostatkom zajednice.

## Kako funkcionira

Supabase je kombinacija alata otvorenog koda. Izgrađujemo funkcionalnosti Firebasea koristeći enterprise-grade open source alate. Ako postoje alati i zajednice, sa MIT, Apache 2, ili ekvivalentnim otvorenim licencama, koristit ćemo i podržati taj alat. Ako alat ne postoji, mi ga izgrađujemo i otvaramo taj kod javno. Supabase nije preslika Firebasea. Naš cilj je razvijateljima dati osjećaj kao da koriste Firebase ali sa alatima otvorenog koda.

**Arhitektura**

Supabase je [hostana platforma](https://supabase.com/dashboard). Možete se registrirati i odmah počet koristiti Supabase bez ikakvih instalacija.
Također možete ju [samostalno hostati](https://supabase.com/docs/guides/hosting/overview) i [razvijati lokalno](https://supabase.com/docs/guides/local-development).

![Arhitektura](apps/docs/public/img/supabase-architecture.svg)

- [Postgres](https://www.postgresql.org/) je objektno-relacijska baza podataka koja je aktivno u razvoju preko 30 godina i na glasu je kao jako pouzdana, robusna i performantna.
- [Realtime](https://github.com/supabase/realtime) je Elixir server koji vam dopušta da prisluškujete unose, ažuriranja i brisanja u PostgreSQL bazi koristeći websockete. Realtime prati Postgres-ovu funkcionalnost repliciranja i osluškuje promjene u bazi podataka, te iste upakira u JSON, na kraju emitira taj JSON preko websocketa do autoriziranih klijenata.
- [PostgREST](http://postgrest.org/) je web server koji pretvara vašu PostgreSQL bazu podataka u RESTful API.
- [GoTrue](https://github.com/supabase/gotrue) je API koji koristi JWT za upravaljanje korisnika i izdavanje JWT tokena.
- [Storage](https://github.com/supabase/storage-api) pruža RESTful sučelje za upravljanje datoteka spremljenih u S3, koristeći Postgres za upravljanje dozvola.
- [pg_graphql](http://github.com/supabase/pg_graphql/) je PostgreSQL ekstenzija koja pruža Graphql API.
- [postgres-meta](https://github.com/supabase/postgres-meta) je RESTful API za upravljanje vaše Postgres baze podatake, dopuštajući vam da dohvatite tablice, dodate uloge, i izvršite upite prema bazi, itd.
- [Kong](https://github.com/Kong/kong) je cloud-native API gateway.

#### Klijentske knjižnice

Naš pristup za klijentske knjižnice je modularan. Svaka pod-knjižnica je samostalna implementacija za svaki vanjski sistem. Ovo je jedan od načina kako podržavamo postojeće alate.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>Jezik</th>
    <th>Klijent</th>
    <th colspan="5">Feature-Clients (upakirani u Supabase klijent)</th>
  </tr>
  <!-- notranslate -->
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
  <!-- /notranslate -->
  <th colspan="7">⚡️ Službeno ⚡️</th>
  <!-- notranslate -->
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
  <tr>
    <td>Swift</td>
    <td><a href="https://github.com/supabase/supabase-swift" target="_blank" rel="noopener noreferrer">supabase-swift</a></td>
    <td><a href="https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST" target="_blank" rel="noopener noreferrer">postgrest-swift</a></td>
    <td><a href="https://github.com/supabase/supabase-swift/tree/main/Sources/Auth" target="_blank" rel="noopener noreferrer">auth-swift</a></td>
    <td><a href="https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime" target="_blank" rel="noopener noreferrer">realtime-swift</a></td>
    <td><a href="https://github.com/supabase/supabase-swift/tree/main/Sources/Storage" target="_blank" rel="noopener noreferrer">storage-swift</a></td>
    <td><a href="https://github.com/supabase/supabase-swift/tree/main/Sources/Functions" target="_blank" rel="noopener noreferrer">functions-swift</a></td>
  </tr>
  <tr>
    <td>Python</td>
    <td><a href="https://github.com/supabase/supabase-py" target="_blank" rel="noopener noreferrer">supabase-py</a></td>
    <td><a href="https://github.com/supabase/postgrest-py" target="_blank" rel="noopener noreferrer">postgrest-py</a></td>
    <td><a href="https://github.com/supabase/gotrue-py" target="_blank" rel="noopener noreferrer">gotrue-py</a></td>
    <td><a href="https://github.com/supabase/realtime-py" target="_blank" rel="noopener noreferrer">realtime-py</a></td>
    <td><a href="https://github.com/supabase/storage-py" target="_blank" rel="noopener noreferrer">storage-py</a></td>
    <td><a href="https://github.com/supabase/functions-py" target="_blank" rel="noopener noreferrer">functions-py</a></td>
  </tr>
  <!-- /notranslate -->
  <th colspan="7">💚 Zajednica 💚</th>
  <!-- notranslate -->
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
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Auth" target="_blank" rel="noopener noreferrer">auth-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Realtime" target="_blank" rel="noopener noreferrer">realtime-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Storage" target="_blank" rel="noopener noreferrer">storage-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Functions" target="_blank" rel="noopener noreferrer">functions-kt</a></td>
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
    <td>Godot Engine (GDScript)</td>
    <td><a href="https://github.com/supabase-community/godot-engine.supabase" target="_blank" rel="noopener noreferrer">supabase-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-gdscript" target="_blank" rel="noopener noreferrer">postgrest-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-gdscript" target="_blank" rel="noopener noreferrer">gotrue-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/realtime-gdscript" target="_blank" rel="noopener noreferrer">realtime-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/storage-gdscript" target="_blank" rel="noopener noreferrer">storage-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/functions-gdscript" target="_blank" rel="noopener noreferrer">functions-gdscript</a></td>
  </tr>
  <!-- /notranslate -->
</table>

<!--- Remove this list if you're translating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## Značke

![Made with Supabase](./apps/www/public/badge-made-with-supabase.svg)

```md
[![Made with Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img
    width="168"
    height="30"
    src="https://supabase.com/badge-made-with-supabase.svg"
    alt="Made with Supabase"
  />
</a>
```

![Made with Supabase (dark)](./apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Made with Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img
    width="168"
    height="30"
    src="https://supabase.com/badge-made-with-supabase-dark.svg"
    alt="Made with Supabase"
  />
</a>
```

## Prijevodi

- [Arapski | العربية](/i18n/README.ar.md)
- [Albanski / Shqip](/i18n/README.sq.md)
- [Bengalski / বাংলা](/i18n/README.bn.md)
- [Bugarski / Български](/i18n/README.bg.md)
- [Katalonski / Català](/i18n/README.ca.md)
- [Hrvatski](/i18n/README.ca.md)
- [Češki / čeština](/i18n/README.cs.md)
- [Danski / Dansk](/i18n/README.da.md)
- [Nizozemski / Nederlands](/i18n/README.nl.md)
- [Engleski](https://github.com/supabase/supabase)
- [Estonski / eesti keel](/i18n/README.et.md)
- [Finski / Suomalainen](/i18n/README.fi.md)
- [Francuski / Français](/i18n/README.fr.md)
- [Njemački / Deutsch](/i18n/README.de.md)
- [Grčki / Ελληνικά](/i18n/README.el.md)
- [Gudžaratski / ગુજરાતી](/i18n/README.gu.md)
- [Hebrejski / עברית](/i18n/README.he.md)
- [Hindski / हिंदी](/i18n/README.hi.md)
- [Mađarski / Magyar](/i18n/README.hu.md)
- [Nepalski / नेपाली](/i18n/README.ne.md)
- [Indonezijski / Bahasa Indonezija](/i18n/README.id.md)
- [Talijanski / Italian](/i18n/README.it.md)
- [Japanski / 日本語](/i18n/README.jp.md)
- [korejski / 한국어](/i18n/README.ko.md)
- [Litavski / lietuvių](/i18n/README.lt.md)
- [Latvijski / latviski](/i18n/README.lv.md)
- [Malajski / Bahasa Malaysia](/i18n/README.ms.md)
- [Norveški (Bokmål) / Norsk (Bokmål)](/i18n/README.nb.md)
- [Perzijski / فارسی](/i18n/README.fa.md)
- [Poljski / Polski](/i18n/README.pl.md)
- [Portugalski / Português](/i18n/README.pt.md)
- [Portugalski (Brazilski) / Português Brasileiro](/i18n/README.pt-br.md)
- [Rumunjski / Română](/i18n/README.ro.md)
- [Ruski / Pусский](/i18n/README.ru.md)
- [Srpski / Srpski](/i18n/README.sr.md)
- [Singalski / සිංහල](/i18n/README.si.md)
- [Slovački / slovenský](/i18n/README.sk.md)
- [Slovenski / Slovenščina](/i18n/README.sl.md)
- [Španjolski / Español](/i18n/README.es.md)
- [Pojednostavljeni kineski / 简体中文](/i18n/README.zh-cn.md)
- [Švedski / Svenska](/i18n/README.sv.md)
- [Tajski / ไทย](/i18n/README.th.md)
- [Tradicionalni kineski / 繁體中文](/i18n/README.zh-tw.md)
- [Turski / Türkçe](/i18n/README.tr.md)
- [Ukrajinski / Українська](/i18n/README.uk.md)
- [Vijetnamski / Tiếng Việt](/i18n/README.vi-vn.md)
- [Popis prijevoda](/i18n/languages.md) <!--- Keep only this -->
