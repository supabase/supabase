<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

# Supabase

[Supabase](https://supabase.com) is the Postgres development platform. We're building the features of Firebase using enterprise-grade open source tools.

- [x] Hosted Postgres Database. [Docs](https://supabase.com/docs/guides/database)
- [x] Authentication and Authorization. [Docs](https://supabase.com/docs/guides/auth)
- [x] Auto-generated APIs.
  - [x] REST. [Docs](https://supabase.com/docs/guides/api)
  - [x] GraphQL. [Docs](https://supabase.com/docs/guides/graphql)
  - [x] Realtime subscriptions. [Docs](https://supabase.com/docs/guides/realtime)
- [x] Functions.
  - [x] Database Functions. [Docs](https://supabase.com/docs/guides/database/functions)
  - [x] Edge Functions [Docs](https://supabase.com/docs/guides/functions)
- [x] File Storage. [Docs](https://supabase.com/docs/guides/storage)
- [x] AI + Vector/Embeddings Toolkit. [Docs](https://supabase.com/docs/guides/ai)
- [x] Dashboard

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Watch "releases" of this repo to get notified of major updates.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

## Documentation

For full documentation, visit [supabase.com/docs](https://supabase.com/docs)

To see how to Contribute, visit [Getting Started](./DEVELOPERS.md)

## Community & Support

- [Community Forum](https://github.com/supabase/supabase/discussions). Best for: help with building, discussion about database best practices.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Best for: bugs and errors you encounter using Supabase.
- [Email Support](https://supabase.com/docs/support#business-support). Best for: problems with your database or infrastructure.
- [Discord](https://discord.supabase.com). Best for: sharing your applications and hanging out with the community.

## How it works

Supabase is a combination of open source tools. We’re building the features of Firebase using enterprise-grade, open source products. If the tools and communities exist, with an MIT, Apache 2, or equivalent open license, we will use and support that tool. If the tool doesn't exist, we build and open source it ourselves. Supabase is not a 1-to-1 mapping of Firebase. Our aim is to give developers a Firebase-like developer experience using open source tools.

**Architecture**

Supabase is a [hosted platform](https://supabase.com/dashboard). You can sign up and start using Supabase without installing anything.
You can also [self-host](https://supabase.com/docs/guides/hosting/overview) and [develop locally](https://supabase.com/docs/guides/local-development).

![Architecture](apps/docs/public/img/supabase-architecture.svg)

- [Postgres](https://www.postgresql.org/) is an object-relational database system with over 30 years of active development that has earned it a strong reputation for reliability, feature robustness, and performance.
- [Realtime](https://github.com/supabase/realtime) is an Elixir server that allows you to listen to PostgreSQL inserts, updates, and deletes using websockets. Realtime polls Postgres' built-in replication functionality for database changes, converts changes to JSON, then broadcasts the JSON over websockets to authorized clients.
- [PostgREST](http://postgrest.org/) is a web server that turns your PostgreSQL database directly into a RESTful API.
- [GoTrue](https://github.com/supabase/gotrue) is a JWT-based authentication API that simplifies user sign-ups, logins, and session management in your applications.
- [Storage](https://github.com/supabase/storage-api) a RESTful API for managing files in S3, with Postgres handling permissions.
- [pg_graphql](http://github.com/supabase/pg_graphql/) a PostgreSQL extension that exposes a GraphQL API.
- [postgres-meta](https://github.com/supabase/postgres-meta) is a RESTful API for managing your Postgres, allowing you to fetch tables, add roles, and run queries, etc.
- [Envoy](https://github.com/envoyproxy/envoy) is a cloud-native, high-performance edge and service proxy.

#### Client libraries

Our approach for client libraries is modular. Each sub-library is a standalone implementation for a single external system. This is one of the ways we support existing tools.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>Language</th>
    <th>Client</th>
    <th colspan="5">Feature-Clients (bundled in Supabase client)</th>
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
  <th colspan="7">⚡️ Official ⚡️</th>
  <!-- notranslate -->
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
  <th colspan="7">💚 Community 💚</th>
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
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <!-- /notranslate -->
</table>

<!--- Remove this list if you're translating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## Badges

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
- [English](https://github.com/supabase/supabase)
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


## 🌐 Web Resources & Interactive Index
- [MAHJONG TOUR](https://ilearnworlds.web.app/mahjong-tour.html)
- [CATEGORY MATCH 3](https://quizverses.github.io/category-match-3.html)
- [SCREW NUTS BOLTS WOOD SOLVE](https://thelearnquesters.pages.dev/screw-nuts-bolts-wood-solve.html)
- [QUEEN OF MAHJONG](https://quizverses-9d2f2.web.app/queen-of-mahjong.html)
- [CATEGORY OBBY](https://thelearnquesters.pages.dev/category-obby.html)
- [POTION MERGE WITCH](https://thequizzone.pages.dev/potion-merge-witch.html)
- [MAHJONG 3D MATCH](https://thelearnquesters.pages.dev/mahjong-3d-match.html)
- [CATEGORY DIRT BIKE](https://thelearnquesters.pages.dev/category-dirt-bike.html)
- [LOL FUNNY DANCE](https://themindzone.pages.dev/lol-funny-dance.html)
- [BRIDGE FIGHT](https://quizverses-9d2f2.web.app/bridge-fight.html)
- [SHIP CONTROL 3D](https://studyplayings.pages.dev/ship-control-3d.html)
- [CATEGORY FPS 3](https://thelearnquesters.pages.dev/category-fps-3.html)
- [CATEGORY BRAIN261](https://themindzone.pages.dev/category-brain261.html)
- [BUBBLE SHOOTER HD 3](https://quizverses.pages.dev/bubble-shooter-hd-3.html)
- [CATEGORY HORROR](https://quizverses.pages.dev/category-horror.html)
- [BUS COLOR JAM](https://thequizzone.pages.dev/bus-color-jam.html)
- [CATEGORY CASUAL](https://quizverses.github.io/category-casual.html)
- [CATEGORY SURVIVAL365](https://themindzone.pages.dev/category-survival365.html)
- [CATEGORY FIGHTING124](https://thelearnquesters.pages.dev/category-fighting124.html)
- [SNAKE IO](https://quizverses.github.io/snake-io.html)
- [CATEGORY FIGHTING](https://quizverses.pages.dev/category-fighting.html)
- [KIOMET COM](https://themindzone.pages.dev/kiomet-com.html)
- [BATTLE ARENA](https://quizverses.pages.dev/battle-arena.html)
- [HUNGRY NOOB CAFE SIMULATOR](https://thequizzone.pages.dev/hungry-noob-cafe-simulator.html)
- [CATEGORY MERGE224](https://thelearnquesters.pages.dev/category-merge224.html)
- [STICK FIGHT THE CHAOS](https://thequizzone.pages.dev/stick-fight-the-chaos.html)
- [JEWELS BLITZ LEGENDS](https://quizverses-9d2f2.web.app/jewels-blitz-legends.html)
- [CATEGORY CARE](https://themindzone.pages.dev/category-care.html)
- [CATEGORY UPGRADE GAMES](https://quizverses.github.io/category-upgrade-games.html)
- [CATEGORY PREMIUM PERKS71](https://quizverses.pages.dev/category-premium-perks71.html)
- [CATEGORY MAHJONG](https://thelearnquesters.pages.dev/category-mahjong.html)
- [CATEGORY RAGDOLL57](https://thelearnquesters.pages.dev/category-ragdoll57.html)
- [CATEGORY MAHJONG 3](https://thelearnquesters.pages.dev/category-mahjong-3.html)
- [YOUTUBER MCRAFT 2PLAYER](https://themindzone.pages.dev/youtuber-mcraft-2player.html)
- [CATEGORY ROBOT49](https://thelearnquesters.pages.dev/category-robot49.html)
- [CATEGORY PUZZLE 5](https://themindzone.pages.dev/category-puzzle-5.html)
- [DELTA FORCE AIRBORNE](https://themindzone.pages.dev/delta-force-airborne.html)
- [TERMS](https://cryptotify.pages.dev/terms.html)
- [CATEGORY TETRIS36](https://themindzone.pages.dev/category-tetris36.html)
- [PIN PUZZLE LOVE STORY](https://themindzone.pages.dev/pin-puzzle-love-story.html)
- [CATEGORY MERGE](https://thelearnquesters.pages.dev/category-merge.html)
- [HAWAII MATCH 5](https://quizverses.github.io/hawaii-match-5.html)
- [MINI GAMES PUZZLE COLLECTION](https://thequizzone.pages.dev/mini-games-puzzle-collection.html)
- [CATEGORY POOL17](https://quizverses.github.io/category-pool17.html)
- [DRUNK MAN 3D](https://thelearnquesters.pages.dev/drunk-man-3d.html)
- [CATEGORY BLOCK91](https://thelearnquesters.pages.dev/category-block91.html)
- [THE SORT AGENCY](https://thequizzone.pages.dev/the-sort-agency.html)
- [TOY MATCH 3](https://themindzone.pages.dev/toy-match-3.html)
- [MR LONG HAND](https://quizverses-9d2f2.web.app/mr-long-hand.html)
- [FOOD JAM](https://thelearnquesters.pages.dev/food-jam.html)
- [CATEGORY RACING DRIVING](https://themindzone.pages.dev/category-racing-driving.html)
- [CATEGORY TOWER DEFENSE 2](https://themindzone.pages.dev/category-tower-defense-2.html)
- [CATEGORY SPACE](https://quizverses-9d2f2.web.app/category-space.html)
- [GUN CLONE](https://quizverses.github.io/gun-clone.html)
- [CATEGORY COOKING46](https://quizverses.pages.dev/category-cooking46.html)
- [CATEGORY MAKEUP51](https://quizverses.github.io/category-makeup51.html)
- [CATEGORY MINECRAFT](https://quizverses.pages.dev/category-minecraft.html)
- [BRAINROT BOING BOING MERGE](https://studyquests.github.io/brainrot-boing-boing-merge.html)
- [CATEGORY SPORTS](https://studyquesthub.web.app/category-sports.html)
- [WORLD WARS TANKS](https://studyquests.github.io/world-wars-tanks.html)
- [GOON BALL](https://thelearnquesters.pages.dev/goon-ball.html)
- [CATEGORY DRAGON22](https://thelearnquesters.pages.dev/category-dragon22.html)
- [NO PAIN NO GAIN RAGDOLL SANDBOX](https://quizverses.pages.dev/no-pain-no-gain-ragdoll-sandbox.html)
- [DADDY CACTUS](https://thelearnquesters.pages.dev/daddy-cactus.html)
- [CATEGORY DRAWING GAME](https://themindzone.pages.dev/category-drawing-game.html)
- [DRAW ONE PART BRAIN PUZZLE](https://thelearnquesters.pages.dev/draw-one-part-brain-puzzle.html)
- [COLOR 3D BUMP IT UP](https://thelearnquesters.pages.dev/color-3d-bump-it-up.html)
- [PRIVACY](https://brainquests-fb2c5.web.app/privacy.html)
- [WINTER MAZE](https://themindzone.pages.dev/winter-maze.html)
- [ANTS PARTY](https://studyquests.github.io/ants-party.html)
- [FIX DA BRAINROT](https://quizverses.pages.dev/fix-da-brainrot.html)
- [WORD SEARCH UNIVERSE](https://thequizzone.pages.dev/word-search-universe.html)
- [CATEGORY FARMING87](https://thelearnquesters.pages.dev/category-farming87.html)
- [SAVE HER TOUR](https://themindzone.pages.dev/save-her-tour.html)
- [DOP PUZZLE ERASE MASTER](https://thelearnquesters.pages.dev/dop-puzzle-erase-master.html)
- [STICKMAN GUYS DEFENSE](https://themindzone.pages.dev/stickman-guys-defense.html)
- [OVERPROTECTIVE BOYFRIEND](https://thelearnquesters.pages.dev/overprotective-boyfriend.html)
- [BFFS LUXURY LOUNGEWEAR](https://thelearnquesters.pages.dev/bffs-luxury-loungewear.html)
- [GOODELUXE](https://studyquests.github.io/goodeluxe.html)
- [CATEGORY ESCAPE](https://quizverses.pages.dev/category-escape.html)
- [NITRO SPEED 2 UNDERGROUND](https://studyquests.github.io/nitro-speed-2-underground.html)
- [CATEGORY MOUSE1 707](https://thelearnquesters.pages.dev/category-mouse1-707.html)
- [DINOSAURS VS ASTEROIDS](https://studyquests.github.io/dinosaurs-vs-asteroids.html)
- [SOFT GIRLS WINTER AESTHETICS](https://quizverses.pages.dev/soft-girls-winter-aesthetics.html)
- [4 COLORS CARD MANIA](https://studyquests.github.io/4-colors-card-mania.html)
- [KNIFE MADNESS](https://studyquests.github.io/knife-madness.html)
- [ESCAPE FROM TUNG TUNG SAHUR](https://thequizzone.pages.dev/escape-from-tung-tung-sahur.html)
- [MY HAPPY FARM](https://quizverses.pages.dev/my-happy-farm.html)
- [HIDDEN OBJECT FARM ADVENTURE](https://thelearnquesters.pages.dev/hidden-object-farm-adventure.html)
- [ANIMATION COLORING ALPHABET LORE](https://thequizzone.pages.dev/animation-coloring-alphabet-lore.html)
- [DRAGON DRAW JOUST](https://thelearnquesters.pages.dev/dragon-draw-joust.html)
- [ROBYBOX SPACE STATION WAREHOUSE](https://quizverses.github.io/robybox-space-station-warehouse.html)
- [CATEGORY SOCCER 3](https://quizverses.github.io/category-soccer-3.html)
- [OBBY YARD SALE](https://thequizzone.pages.dev/obby-yard-sale.html)
- [GT CHAMPIONSHIP ARCADE](https://studyquests.github.io/gt-championship-arcade.html)
- [CATEGORY FREE](https://quizverses.pages.dev/category-free.html)
- [CATEGORY LOGIC538](https://iskillquest.pages.dev/category-logic538.html)
- [BELL MADNESS](https://studyquests.github.io/bell-madness.html)
- [STICKMAN FOOTBALL](https://iskillquest.pages.dev/stickman-football.html)
- [WOODS OF NEVIA FOREST SURVIVAL](https://studyquests.github.io/woods-of-nevia-forest-survival.html)
- [CATEGORY SIDE SCROLLING184](https://themindplay.pages.dev/category-side-scrolling184.html)
- [CUBES 2048IO](https://quizverses.github.io/cubes-2048io.html)
- [GEOMETRY PLATFORMER](https://quizverses.pages.dev/geometry-platformer.html)
- [GANGSTA ISLAND CRIME CITY](https://quizverses.pages.dev/gangsta-island-crime-city.html)
- [GIRLY PUZZLE](https://thelearnquesters.pages.dev/girly-puzzle.html)
- [CATEGORY CAR 3](https://themindplay.pages.dev/category-car-3.html)
- [2048 PUZZLE CONNECT THE BALLS](https://themindplay.github.io/2048-puzzle-connect-the-balls.html)
- [FASHION WEEK 2025](https://thequizzone.pages.dev/fashion-week-2025.html)
- [WOODY TAP BLOCK](https://themindplay.pages.dev/woody-tap-block.html)
- [CATEGORY MAHJONG CONNECT](https://quizverses.github.io/category-mahjong-connect.html)
- [HEXA PUZZLE](https://themindplay.pages.dev/hexa-puzzle.html)
- [JELLY BELLY MAKE THE ELEPHANT](https://quizverses.github.io/jelly-belly-make-the-elephant.html)
- [MONSTER COLLECT RUN](https://themindzone.pages.dev/monster-collect-run.html)
- [CUTE ANIMAL WORLD](https://studyquests.github.io/cute-animal-world.html)
- [SNAKE PUZZLE SLITHER TO EAT](https://themindplay.pages.dev/snake-puzzle-slither-to-eat.html)
- [INDEX21](https://studyquesthub.web.app/index21.html)
- [PAINT POP 3D](https://themindplay.pages.dev/paint-pop-3d.html)
- [CHRISTMAS SORTING](https://quizverses.pages.dev/christmas-sorting.html)
- [SUPER TANK HERO](https://quizverses.github.io/super-tank-hero.html)
- [QUACKVENTURE](https://studyquests.github.io/quackventure.html)
- [MAGIC FINGER](https://themindplay.pages.dev/magic-finger.html)
- [CATEGORY CASUAL 13](https://themindzone.pages.dev/category-casual-13.html)
- [PURRFECT SCOOPS](https://thelearnquesters.pages.dev/purrfect-scoops.html)
- [CRAFT MAN VS GIANT TNT](https://quizverses-9d2f2.web.app/craft-man-vs-giant-tnt.html)
- [HIDDEN KITTY](https://quizverses.github.io/hidden-kitty.html)
- [BATTLE OF TANK STEEL](https://thelearnquesters.pages.dev/battle-of-tank-steel.html)
- [POP ADVENTURE](https://themindplay.pages.dev/pop-adventure.html)
- [HIDDEN OBJECTS VACATION IN BRAZIL](https://quizverses.pages.dev/hidden-objects-vacation-in-brazil.html)
- [PAPER DOLL DIARY CHIBI DOLLS](https://iskillquest.pages.dev/paper-doll-diary-chibi-dolls.html)
- [RACING BALL ADVENTURE](https://quizverses-9d2f2.web.app/racing-ball-adventure.html)
