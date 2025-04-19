<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) ir atvērtā koda Firebase alternatīva. Mēs veidojam Firebase funkcijas, izmantojot uzņēmuma līmeņa atvērtā koda rīkus.

**Galvenās funkcijas:**

- [x] **Pārvaldīta Postgres datubāze:** [Dokumentācija](https://supabase.com/docs/guides/database)
- [x] **Autentifikācija un autorizācija:** [Dokumentācija](https://supabase.com/docs/guides/auth)
- [x] **Automātiski ģenerētas API:**
    - [x] REST: [Dokumentācija](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Dokumentācija](https://supabase.com/docs/guides/graphql)
    - [x] Reāllaika abonementi: [Dokumentācija](https://supabase.com/docs/guides/realtime)
- [x] **Funkcijas:**
    - [x] Datubāzes funkcijas: [Dokumentācija](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (funkcijas tīkla malā): [Dokumentācija](https://supabase.com/docs/guides/functions)
- [x] **Failu krātuve:** [Dokumentācija](https://supabase.com/docs/guides/storage)
- [x] **AI, vektoru un iegulšanas rīki:** [Dokumentācija](https://supabase.com/docs/guides/ai)
- [x] **Vadības panelis**

![Supabase vadības panelis](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Abonējiet šīs repozitorijas "laidienus" (releases), lai saņemtu paziņojumus par svarīgiem atjauninājumiem. Tas ļaus jums sekot līdzi jaunākajām izmaiņām un uzlabojumiem.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Skatīties repozitoriju"/></kbd>

## Dokumentācija

Pilna dokumentācija ir pieejama vietnē [supabase.com/docs](https://supabase.com/docs). Tur jūs atradīsiet visas nepieciešamās rokasgrāmatas un atsauces materiālus.

Ja vēlaties dot savu ieguldījumu projektā, skatiet sadaļu [Darba sākšana](./../DEVELOPERS.md).

## Kopiena un atbalsts

*   **Kopienas forums:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Ideāli piemērots, lai saņemtu palīdzību izstrādē un apspriestu labākās datubāzes prakses.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Izmantojiet, lai ziņotu par kļūdām un problēmām, ar kurām saskaraties, izmantojot Supabase.
*   **Atbalsts pa e-pastu:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). Labākais variants problēmām ar jūsu datubāzi vai infrastruktūru.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Lieliska vieta, lai dalītos ar savām lietojumprogrammām un sazinātos ar kopienu.

## Kā tas darbojas

Supabase apvieno vairākus atvērtā koda rīkus. Mēs veidojam Firebase funkcijas, izmantojot pārbaudītus uzņēmuma līmeņa produktus. Ja rīks vai kopiena pastāv un tai ir MIT, Apache 2 vai līdzīga atvērtā licence, mēs izmantosim un atbalstīsim šo rīku. Ja šāda rīka nav, mēs to izveidosim paši un atvērsim tā kodu. Supabase nav precīza Firebase kopija. Mūsu mērķis ir nodrošināt izstrādātājiem ērtības, kas ir salīdzināmas ar Firebase, bet izmantojot atvērtā koda rīkus.

**Arhitektūra**

Supabase ir [pārvaldīta platforma](https://supabase.com/dashboard). Jūs varat reģistrēties un nekavējoties sākt lietot Supabase, neko neinstalējot. Varat arī [izvietot savu infrastruktūru](https://supabase.com/docs/guides/hosting/overview) un [izstrādāt lokāli](https://supabase.com/docs/guides/local-development).

![Arhitektūra](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Objektu-relāciju datubāzes sistēma ar vairāk nekā 30 gadu aktīvas izstrādes vēsturi. Tā ir pazīstama ar savu uzticamību, funkcionalitāti un veiktspēju.
*   **Realtime:** Elixir serveris, kas ļauj klausīties PostgreSQL izmaiņas (ievietošanu, atjaunināšanu un dzēšanu), izmantojot websockets. Realtime izmanto Postgres iebūvēto replikācijas funkcionalitāti, pārvērš izmaiņas JSON formātā un pārsūta tās autorizētiem klientiem.
*   **PostgREST:** Tīmekļa serveris, kas pārvērš jūsu PostgreSQL datubāzi par RESTful API.
*   **GoTrue:** Uz JWT balstīta API lietotāju pārvaldībai un JWT piekļuves pilnvaru izsniegšanai.
*   **Storage:** Nodrošina RESTful saskarni failu pārvaldībai, kas tiek glabāti S3, izmantojot Postgres atļauju pārvaldībai.
*   **pg_graphql:** PostgreSQL paplašinājums, kas nodrošina GraphQL API.
*   **postgres-meta:** RESTful API jūsu Postgres pārvaldībai, ļaujot ielādēt tabulas, pievienot lomas, izpildīt vaicājumus utt.
*   **Kong:** Mākoņa API vārteja.

#### Klientu bibliotēkas

Klientu bibliotēkām mēs izmantojam modulāru pieeju. Katra apakšbibliotēka ir paredzēta darbam ar vienu ārēju sistēmu. Tas ir viens no veidiem, kā atbalstīt esošos rīkus.

(Tabula ar klientu bibliotēkām, kā oriģinālā, bet ar latviešu nosaukumiem un paskaidrojumiem, kur nepieciešams).

| Valoda                       | Supabase klients                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Oficiālās⚡️**          |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Kopienas atbalstītās💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Ženkliņi (Badges)

Varat izmantot šos ženkliņus, lai parādītu, ka jūsu lietojumprogramma ir izveidota, izmantojot Supabase:

**Gaišs:**

![Izgatavots ar Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Izgatavots ar Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Izgatavots ar Supabase" />
</a>
```

**Tumšs:**

![Izgatavots ar Supabase (tumšā versija)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Izgatavots ar Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Izgatavots ar Supabase" />
</a>
```

## Tulkojumi

[Tulkojumu saraksts](./languages.md)
