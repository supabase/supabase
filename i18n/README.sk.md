<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) je open-source alternatíva k Firebase. Vytvárame funkcie Firebase pomocou open-source nástrojov podnikovej úrovne.

**Kľúčové vlastnosti:**

- [x] **Spravovaná databáza Postgres:** [Dokumentácia](https://supabase.com/docs/guides/database)
- [x] **Autentifikácia a autorizácia:** [Dokumentácia](https://supabase.com/docs/guides/auth)
- [x] **Automaticky generované API:**
    - [x] REST: [Dokumentácia](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Dokumentácia](https://supabase.com/docs/guides/graphql)
    - [x] Odbery v reálnom čase: [Dokumentácia](https://supabase.com/docs/guides/realtime)
- [x] **Funkcie:**
    - [x] Funkcie databázy: [Dokumentácia](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (funkcie na okraji siete): [Dokumentácia](https://supabase.com/docs/guides/functions)
- [x] **Úložisko súborov:** [Dokumentácia](https://supabase.com/docs/guides/storage)
- [x] **Nástroje AI, vektory a vkladanie (embeddings):** [Dokumentácia](https://supabase.com/docs/guides/ai)
- [x] **Riadiaci panel (Dashboard)**

![Riadiaci panel Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Prihláste sa na odber "vydaní" (releases) tohto úložiska, aby ste dostávali upozornenia o dôležitých aktualizáciách. To vám umožní sledovať najnovšie zmeny a vylepšenia.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Sledovať úložisko"/></kbd>

## Dokumentácia

Kompletná dokumentácia je k dispozícii na [supabase.com/docs](https://supabase.com/docs). Nájdete tam všetky potrebné návody a referenčné materiály.

Ak chcete prispieť k projektu, pozrite si sekciu [Začíname](./../DEVELOPERS.md).

## Komunita a podpora

*   **Komunitné fórum:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Ideálne pre získanie pomoci s vývojom a diskusiu o osvedčených postupoch pre databázy.
*   **Problémy GitHub (GitHub Issues):** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Použite na nahlásenie chýb a problémov, s ktorými sa stretnete pri používaní Supabase.
*   **Podpora e-mailom:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). Najlepšia voľba pre problémy s vašou databázou alebo infraštruktúrou.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Skvelé miesto na zdieľanie vašich aplikácií a komunikáciu s komunitou.

## Ako to funguje

Supabase kombinuje niekoľko open-source nástrojov. Vytvárame funkcie podobné Firebase pomocou osvedčených produktov podnikovej úrovne. Ak nástroj alebo komunita existuje a má licenciu MIT, Apache 2 alebo podobnú otvorenú licenciu, budeme tento nástroj používať a podporovať. Ak nástroj neexistuje, vytvoríme ho sami a otvoríme jeho zdrojový kód. Supabase nie je presnou kópiou Firebase. Naším cieľom je poskytnúť vývojárom pohodlie porovnateľné s Firebase, ale pomocou open-source nástrojov.

**Architektúra**

Supabase je [spravovaná platforma](https://supabase.com/dashboard). Môžete sa zaregistrovať a začať používať Supabase okamžite bez toho, aby ste čokoľvek inštalovali. Môžete tiež [nasadiť vlastnú infraštruktúru](https://supabase.com/docs/guides/hosting/overview) a [vyvíjať lokálne](https://supabase.com/docs/guides/local-development).

![Architektúra](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Objektovo-relačný databázový systém s viac ako 30-ročnou históriou aktívneho vývoja. Je známy svojou spoľahlivosťou, funkčnosťou a výkonom.
*   **Realtime:** Server Elixir, ktorý vám umožňuje počúvať zmeny PostgreSQL (vloženia, aktualizácie a odstránenia) prostredníctvom websockets. Realtime používa vstavanú funkciu replikácie Postgres, konvertuje zmeny na JSON a prenáša ich autorizovaným klientom.
*   **PostgREST:** Webový server, ktorý premení vašu databázu PostgreSQL na RESTful API.
*   **GoTrue:** API založené na JWT na správu používateľov a vydávanie tokenov JWT.
*   **Storage:** Poskytuje RESTful rozhranie na správu súborov uložených v S3, pričom na správu povolení používa Postgres.
*   **pg_graphql:** Rozšírenie PostgreSQL, ktoré poskytuje GraphQL API.
*   **postgres-meta:** RESTful API na správu vášho Postgres, umožňujúce získavať tabuľky, pridávať roly, vykonávať dotazy atď.
*   **Kong:** Brána API natívna pre cloud.

#### Klientske knižnice

Používame modulárny prístup ku klientskym knižniciam. Každá podknižnica je navrhnutá tak, aby fungovala s jedným externým systémom. Toto je jeden zo spôsobov, ako podporujeme existujúce nástroje.

(Tabuľka s klientskymi knižnicami, ako v origináli, ale so slovenskými názvami a vysvetleniami, kde je to potrebné).

| Jazyk                       | Klient Supabase                                                    | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Oficiálne⚡️**         |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Podporované komunitou💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Odznaky (Badges)

Môžete použiť tieto odznaky, aby ste ukázali, že vaša aplikácia je postavená so Supabase:

**Svetlý:**

![Vytvorené so Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Vytvorené so Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Vytvorené so Supabase" />
</a>
```

**Tmavý:**

![Vytvorené so Supabase (tmavá verzia)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Vytvorené so Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Vytvorené so Supabase" />
</a>
```

## Preklady

[Zoznam prekladov](./languages.md)
