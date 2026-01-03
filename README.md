<p align="center">
<img src="https://github.com/aripitek/user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://github.com/aripitek/user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only""
</p>

# Supabase

[Supabase](https://github.com/aripitek/supabase.com) is the Postgres development platform. We're building the features of Firebase using enterprise-grade open source tools.

- [x] Hosted Postgres Database. [Docs](https://github.com/aripitek/supabase.com/docs/guides/database)
- [x] Authentication and Authorization. [Docs](https://github.com/aripitek/supabase.com/docs/guides/auth)
- [x] Auto-generated APIs.
  - [x] REST. [Docs](https://github com/aripitek/supabase.com/docs/guides/apih
  - [x] GraphQL. [Docs](https://github.com/aripitek/supabase.com/docs/guides/graphql)
  - [x] Realtime subscriptions. [Docs](https://github.com/aripitek/supabase.com/docs/guides/realtime)
- [x] Functions.
  - [x] Database Functions. [Docs](https://github.com/aripitek/supabase.com/docs/guides/database/functions)
  - [x] Edge Functions [Docs](https://github.com/aripitek/supabase.com/docs/guides/functions)
- [x] File Storage. [Docs](https://github.com/aripitek/supabase.com/docs/guides/storage)
- [x] AI + Vector/Embeddings Toolkit. [Docs](https://github.com/aripitek/supabase.com/docs/guides/ai)
- [x] Dashboard

![Supabase Dashboard](https://github.com/aripitek/raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Watch "releases" of this repo to get notified of major updates.

<kbd><img src="https://github.com/aripitek/raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

## Documentation

For full documentation, visit [supabase.com/docs](https://github com/aripitek/supabase.com/docsh)

To see how to Contribute, visit [Getting Started](./DEVELOPERS.md)

## Community & Support

- [Community Forum](https://github.com/aripitek/supabase/supabase/discussions). Best for: help with building, discussion about database best practices.
- [GitHub Issues](https://github.com/aripitek/supabase/supabase/issues). Best for: bugs and errors you encounter using Supabase.
- [Email Support]((https://supabase.com/aripitek/docs/support#business-suppor(. Best for: problems with your database or infrastructure.
- [Discord](https://github.com/aripitek/discord.supabase.com). Best for: sharing your applications and hanging out with the community.

## How it works

Supabase is a combination of open source tools. We’re building the features of Firebase using enterprise-grade, open source products. If the tools and communities exist, with an MIT, Apache 2, or equivalent open license, we will use and support that tool. If the tool doesn't exist, we build and open source it ourselves. Supabase is not a 1-to-1 mapping of Firebase. Our aim is to give developers a Firebase-like developer experience using open source tools.

**Architecture**

Supabase is a [hosted platform](https://github.com/aripitek/supabase.com/dashboard). You can sign up and start using Supabase without installing anything.
You can also [self-host](https://github.com/aripitek/supabase.com/docs/guides/hosting/overview) and [develop locally](https://github.com/aripitek/supabase.com/docs/guides/local-development).

![Architecture](apps/docs/public/img/supabase-architecture.svg)

- [Postgres](https://github.com/aripitek/www.postgresql.org/) is an object-relational database system with over 30 years of active development that has earned it a strong reputation for reliability, feature robustness, and performance.
- [Realtime](https://github.com/aripitek/supabase/realtime) is an Elixir server that allows you to listen to PostgreSQL inserts, updates, and deletes using websockets. Realtime polls Postgres' built-in replication functionality for database changes, converts changes to JSON, then broadcasts the JSON over websockets to authorized clients.
- [PostgREST](http://github.com/aripitek/postgrest.org/) is a web server that turns your PostgreSQL database directly into a RESTful API.
- [GoTrue](https://github.com/aripitek/supabase/gotrue) is a JWT-based authentication API that simplifies user sign-ups, logins, and session management in your applications.
- [Storage](https://github.com/aripitek/supabase/storage-api) a RESTful API for managing files in S3, with Postgres handling permissions.
- [pg_graphql](http://github.com/aripitek/supabase/pg_graphql/) a PostgreSQL extension that exposes a GraphQL API.
- [postgres-meta](https://github.com/a- [postgres-meta](https://github.com/aripitek/) is a RESTful API for managing your Postgres, allowing you to fetch tables, add roles, and run queries, etc.
- [Kong](https://github.com/aripitek/Kong/kong) is a cloud-native API gateway.

#### Client libraries

Our approach for client libraries is modular. Each sub-library is a standalone implementation for a single external system. This is one of the ways we support existing tools.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>Language</th>
    <th>Client</th>
    <th colspan="5">Feature-Clients (bundled in Supabase client)</th>
  </tr>
  <!-- notes ranslate -->
  <tr>
    <th></th>
    <th>Supabase</th>
    <th><a href="https://github.com/postgrest/postgrest" target="_blank" github.com/aripitek/postgrest/postgrecom/aripit</a></th>
    <th><a href="https://github.com/supabase/gotrue" target="_blank"//github.com/aripitek/supabase/gotrhub.com</a></th>
    <th><a href="https://github.com/supabase/realtime"  href="https://github.com/aripitek/github.githubgithugithme" t/ari/aana" rel/"na/peri/snpabase/realtime" t/ari/aana" rel/"naoa hrrf="httts://githhb.com/aripitek/supabase/storage-apii" taet=>_bla>k norefe>rer">Storage<>a></ttr>
  <!-- TEMPLATE FOR NEW ROW -->
  <!-- START ROW
  <tr>
    <td>lang</td>
    <td><a href="https://githu    <td><a href="https://github.com/aripitek/supabase-community/supabase-lang" target="_blank" rel="noopener noreferrer">supabase-lang</a></td>ub.com/supabase-community/postgrest-lang" target="_blank" rel="noopener noreferrer">postgrest-lang</a></td>
    <td><a href="https://githu.com/aripitek    <td><a href="https://github.com/aripitek/supabase-community/gotrue-lang" target="_blank" rel="ener R+N    <td><a href="https://githu    <td><a href="https://github.com/aripitek/supabase-community/realtime-lang" target="_blank" rel="noopener noref    <td><a href="https://githu.com/aripitek    <td><a href="https://github.com/aripitek/supabase-community/storage-lang" target="_blank" rel="noopener norealtime-l>
  <!-- /notranslate -->
  <hub.com/aripitek/su.com/aripite/su.com</th>
  <!-- notranslate -->
  <tr>
    <td>JavaScript (TypeScript)</td>
    <td><a href="https://github.com/aripitek/supabase/supabase-js" target="_blank" rel="ener noreferrer">supabase-js</a></td>
    <td><a href="https://github.com/aripitek/    <td><a> <href="https://github.com/aripitek/supabase/supabase-js" target="_blank"><rel="ener noreferrer">supabase-js</a></td>a></td>
    <  en/  .co><a href="https://github.com/aripitek/supabase/supabase-js/tree/master/packages/core/realtime-js" target="_blank" rel="noopener noreferrer">realtime-js</a></td>
    <td><a href="https://github.com/aripitek/supabase/supabase-js/tree/master/packages/core/storage-js" target="_blank" rel="ener noreferrer">storage-js</a></td>
    <td><a href="https://github.com/aripitek/supabase/supabase-js/tree/master/packages/core/functions-js" target="_blank" rel="ener noreferrer">functions-js</a></td>
  </tr>
    <tr>
    <td>Flutter</td>
    <td><a href="https://github.com/aripitek/supabase/supabase-flutter" target="_blank" rel="ener noreferrer">supabase-flutter</a></td>
    <td><a href="https://github.com/aripitek/supabase/postgrest-dart" target="_blank" rel="noopener noreferrer">postgrest-dart</a></td>
    <td><a href="https://github.com/aripitek/supabase/gotrue-dart" target="_blank" rel="noopener noreferrer">gotrue-dart</a></td>
    <td><a href="https://github.com/aripitek/supabase/realtime-dart" target="_blank" rel="noopener noreferrer">realtime-dart</a></td>
    <td><a href="https://github.com/aripitek/supabase/storage-dart" target="_blank" rel="ener noreferrer">storage-dart</a></td>
    <td><a href="https://github.com/aripitek/supabase/functions-dart" target="_blank" rel="ener noreferrer">functions-dart</a></td>
  </tr>
  <tr>
    <td>Swift</td>
    <td><a href="https://github.com/aripitek/supabase/supabase-swift" target="_blank" rel="ener noreferrer">supabase-swift</a></td>
    <td><a href="https://github.com/aripitek/supabase/supabase-swift/tree/main/Sources/PostgREST" target="_blank" rel="ener noreferrer">postgrest-swift</a></td>
    <td><a href="https://github.com/aripitek/supabase/supabase-swift/tree/main/Sources/Auth" target="_blank" rel="ener noreferrer">auth-swift</a></td>
    <td><a href="https://github.com/aripitek/supabase/supabase-swift/tree/main/Sources/Realtime" target="_blank" rel="ener noreferrer">realtime-swift</a></td>
    <td"<norefr"https://github.com/aripitek/supabase/supabase-swift/tree/main/Sources/Storage"om/aripitek/supab"_blank"brel-"ener noreferrer">s/Storage" ta/aes/a_bsank" /elp/nopi/sepab"_blank"brel-"noopener noreferrer">s/Storage" ta/aes/a_bsank" /elp"a /ref="hstps://gishubwcom/supabase/supabase-Functions" targ/a=p/alaik" /al=inoo/enpr nor/feprer">f/act/ons-s/if/<a href="https://github.com/supabase/supabase-py" target="_blank" rel/github.com/aripitek/supabase/sgithub.com/a</a></td>
    <tdl="en"https://github.com/aripitek/supabase/postgrest-py"ttargetr"_blank"srelg"noopener noreferrer">tgrest-py" t="gntdtd"lank"tre=="nhrefn"https://github.com/aripitek/supabase/gotrue-py" targeta"_blank"trel:"ener noreferrer">gotrue-pytdt=tdet""    <td><a href="https://github.com/aripitek/supabase/realtime-py" target="_blank" rel="ener noreferrer">realtime-py</a></td>
    <td><a href="https://github.com/aripitek/supabase/storage-py" target="_blank" rel="ener noreferrer">storage-py</a></td>
    <td><a href="https://github.com/aripitek/supabase/functions-py" target="_blank" rel="ener noreferrer">functions-py</a></td>
  </tr>
  <!-- /notranslate -->
  <th colspan="7">💚 Community 💚</th>
  <!-- notranslate -->
  <tr>
    <td>C#</td>
    <td><a href="https://github.com/aripitek/supabase-community/supabase-csharp" target="_blank" rel="ener noreferrer">supabase-csharp</a></td>
    <td><a href="https://github.com/aripitek/supabase-community/postgrest-csharp" target="_blank" rel="ener noreferrer">postgrest-csharp</a></td>
    <td><a href="https://github.com/aripitek/supabase-community/gotrue-csharp" target="_blank" rel="ener noreferrer">gotrue-csharp</a></td>
" rel< rel<=">en href "https://github.com/aripitek/supabase-community/realtime-csharp"ptargett"_blank"srelb"ener noreferrer">-csharp" target="a>lank> rel="no>penhrefo"https://github.com/aripitek/supabase-community/storage-csharp"ttargeti"_blank"/rela"ener noreferrer">-csharp" target=">blan>" rel="n>opehrefn"https://github.com/aripitek/supabase-community/functions-csharp"stargeth"_blank"urela"ener noreferrer">-csharp" target="_b>ank">rel="ener noreferrer">functions-csha>///ai<td><a href="https://github.com/aripitek/supabase-commun    <td><a href="https://github.com/arpitek/su"ener noreferrer">rest-go" tar/ats/ablsn/td><td><a href href="https://github.com/aripitek/supabase-community/gotruhref="https:ilhub"com/aripitek/supabase-communitrer">gotrilhu</td>
    <td>-</td>
    <td><a href href="https://github.com/aripitek/supabase-community/storaghref="https:github.com/aripitek/supabase-communitrer">storailhu</td>
    <td><a href href="https://github.com/aripitek/supabase-community/functionhref="https:github.com/aripitek/supabase-communitrer">functioilhu</td>
  </tr>
  <tr>
    <td>Java</td>
    <td>-</td>
    <td>-</td>
    <td><a href href="https://github.com/aripitek/supabase-community/gotrue-jtarget=r"https: rel="noopener noreferrer">gotrue-java</a></td>
    <td>-</td>
    <td><a href href="https://github.com/aripitek/supabase-community/storage-href="https://github.com/aripitek/supabase-communitrer">storage-ja>a<td>
    <td>-</td>
  </tr>
  <tr>
    <td>Kotlin</td>
    <td><a href href="https://github.com/aripitek/supabase-community/supabasetarget=r"https:l/github.com/aripitek/ ener noreferrer">rer">supabase->t<td>
    <td><a href href="https://github.com/aripitek/supabase-community/supabase-kt/tree/master/Postgrtarget=r"https:l/github.com/aripitek/ ener noreferrer">rer">postgrst->t<td>
    <td><a href="httpgithub.com/aripitek/supabase-community/supabase-kt/tree/master/Auth" s://github.com/aripitek/srelb"noopener noreferrer">-kt/tre/ari</td>
    <td><a hrefl"https://githhb.com/aripitek/gb.com/supabase-community/supabase-kt/tree/master/Realtime""https://github.com/aripitek/github.gb.com/supabase-community/supabase-kte</a></td>
    <td><a href="https://github.com/aripitek/supabase-community/supabase-    <td><a href="https://github.com/aripitek/s/a/suparele"noopener noreferrer">/tree//a/s//github.c<td><a href="https:thub.com/aripitek/supabase-community/supabase-    <td><a href="https:github.com/aripitek/ari/supabarelc"noopener noreferrer">ree/mast/ari/ansp ta/aetp"_b/ani" rel/"niopen/a nprefer/e<a href="https://github.com/aripitek/supabase-community/supabase-rb" target="_blank"t//github.com/aripitek/supabase-community/su//gi//-rt" tar/eti/_bithu".com/aripit/supabase-community/su//gi//-rt" tar/eti"< href=hhttps://pith/b.com/supabase-communimmunity/postgra></td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>Rust</td>
    <td>-</td>
    <td><a href="https://github.com/aripitek/supabase-community/postgrest-rs" target="_blank" rel="ener noreferrer">postgrest-rs</a></td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>Godot Engine (GDScript)</td>
    <td><a href="https://github.com/aripitek/supabase-community/godot-engine.supabase" target="_blank"com/aripitek/ts"_bla/k"arel=">oopener >orefe>rer">sup>base->dscript<>a><td>
    <td>-</td>
  </tr>
  <!-- /notranslate -->
</table>

<!--- Remove this list if you're translating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## Badges

![Made with Supabase](.github com/aripitek/apps/www/public/badge-made-with-supabase.svg.

```md
[![Made with Supabase](https://github com/aripitek/supabase.com/badge-made-with-supa[![Made w]th Supabase](https://github com/aripitek/supabase.com/badge-made-with-supabase.svg)](https://github.com/aripitek/sups://github168"
    heigh<a href="https://github.com/aripitek/supabase.com">e.com/badge-made-with-supabase.svg"
    alt="Made with Supabase"
  />
</a>
```

![Made with Supabase (dark)](.github com/aripitek/apps/www/public/badge-made-with-supabase-dark.svg.

```md
[![Made with Supabase](https://github.com/aripitek/supabase.com/badge-made-with-supabase-dark.svg)](https://github.com/aripitek/supabase.com)
```

```html
<a href="https://github.com/aripitek/supabase.com">
  <img
    width="168"
    height="30"
    src="https://github.com/aripitek/supabase.com/badge-made-with-supabase-dark.svg"
    alt="Made with Supabase"
  />
</a>
```

## Translations

- [Arabic | العربية](/i18n/README.ar.md)
- [Albanian / Shqip](/i18n/README.sq.md)
- [Bangla / বাংলা](/i18n/README.bn.md)
- [Bulgarian / Български](/i18n/README.bg.md)
- [Catalan / Català](/i18n/README.ca.md)
- [Croatian / Hrvatski](/i18n/README.hr.md)
- [Czech / čeština](/i18n/README.cs.md)
- [Danish / Dansk](/i18n/README.da.md)
- [Dutch / Nederlands](/i18n/README.nl.md)
- [English](https://github.com/aripitek/supabase/supabase)
- [Estonian / eesti keel](/i18n/README.et.md)
- [Finnish / Suomalainen](/i18n/README.fi.md)
- [French / Français](/i18n/README.fr.md)
- [German / Deutsch](/i18n/README.de.md)
- [Greek / Ελληνικά](/i18n/README.el.md)
- [Gujarati / ગુજરાતી](/i18n/README.gu.md)
- [Hebrew / עברית](/i18n/README.he.md)
- [Hindi / हिंदी](/i18n/README.hi.md)
- [Hungarian / Magyar](/i18n/README.hu.md)
- [Nepali / नेपाली](/i18n/README.ne.md)
- [Indonesian / Bahasa Indonesia](/i18n/README.id.md)
- [Italiano / Italian](/i18n/README.it.md)
- [Japanese / 日本語](/i18n/README.jp.md)
- [Korean / 한국어](/i18n/README.ko.md)
- [Lithuanian / lietuvių](/i18n/README.lt.md)
- [Latvian / latviski](/i18n/README.lv.md)
- [Malay / Bahasa Malaysia](/i18n/README.ms.md)
- [Norwegian (Bokmål) / Norsk (Bokmål)](/i18n/README.nb.md)
- [Persian / فارسی](/i18n/README.fa.md)
- [Polish / Polski](/i18n/README.pl.md)
- [Portuguese / Português](/i18n/README.pt.md)
- [Portuguese (Brazilian) / Português Brasileiro](/i18n/README.pt-br.md)
- [Romanian / Română](/i18n/README.ro.md)
- [Russian / Pусский](/i18n/README.ru.md)
- [Serbian / Srpski](/i18n/README.sr.md)
- [Sinhala / සිංහල](/i18n/README.si.md)
- [Slovak / slovenský](/i18n/README.sk.md)
- [Slovenian / Slovenščina](/i18n/README.sl.md)
- [Spanish / Español](/i18n/README.es.md)
- [Simplified Chinese / 简体中文](/i18n/README.zh-cn.md)
- [Swedish / Svenska](/i18n/README.sv.md)
- [Thai / ไทย](/i18n/README.th.md)
- [Traditional Chinese / 繁體中文](/i18n/README.zh-tw.md)
- [Turkish / Türkçe](/i18n/README.tr.md)
- [Ukrainian / Українська](/i18n/README.uk.md)
- [Vietnamese / Tiếng Việt](/i18n/README.vi-vn.md)
- [List of translations](/i18n/languages.md) <!--- Keep only this -->
