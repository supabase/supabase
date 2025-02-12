<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) është një alternativë me burim të hapur ndaj Firebase. Ne po ndërtojmë veçoritë e Firebase duke përdorur mjete me burim të hapur të nivelit të ndërmarrjes.

**Karakteristikat kryesore:**

- [x] **Bazë të dhënash Postgres e menaxhuar:** [Dokumentacioni](https://supabase.com/docs/guides/database)
- [x] **Autentifikimi dhe autorizimi:** [Dokumentacioni](https://supabase.com/docs/guides/auth)
- [x] **API të gjeneruara automatikisht:**
    - [x] REST: [Dokumentacioni](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Dokumentacioni](https://supabase.com/docs/guides/graphql)
    - [x] Abonime në kohë reale: [Dokumentacioni](https://supabase.com/docs/guides/realtime)
- [x] **Funksionet:**
    - [x] Funksionet e bazës së të dhënave: [Dokumentacioni](https://supabase.com/docs/guides/database/functions)
    - [x] Funksionet Edge (funksionet në skajin e rrjetit): [Dokumentacioni](https://supabase.com/docs/guides/functions)
- [x] **Ruajtja e skedarëve:** [Dokumentacioni](https://supabase.com/docs/guides/storage)
- [x] **Mjetet për punë me AI, vektorë dhe ngulitje (embeddings):** [Dokumentacioni](https://supabase.com/docs/guides/ai)
- [x] **Paneli i kontrollit**

![Paneli i kontrollit Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Abonohuni në "releases" të kësaj depoje për t'u njoftuar për përditësimet e mëdha. Kjo do t'ju lejojë të jeni në dijeni të ndryshimeve dhe përmirësimeve më të fundit.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Ndiq depon"/></kbd>

## Dokumentacioni

Dokumentacioni i plotë është i disponueshëm në [supabase.com/docs](https://supabase.com/docs). Aty do të gjeni të gjitha udhëzimet dhe materialet e referencës të nevojshme.

Nëse dëshironi të kontribuoni në zhvillimin e projektit, shikoni seksionin [Fillimi](./../DEVELOPERS.md).

## Komuniteti dhe mbështetja

*   **Forumi i komunitetit:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Ideal për të marrë ndihmë në zhvillim dhe për të diskutuar praktikat më të mira të punës me bazat e të dhënave.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Përdoreni për të raportuar gabimet dhe defektet që hasni gjatë përdorimit të Supabase.
*   **Mbështetja me email:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). Opsioni më i mirë për të zgjidhur problemet me bazën tuaj të të dhënave ose infrastrukturën.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Një vend i shkëlqyeshëm për të shkëmbyer aplikacionet tuaja dhe për t'u shoqëruar me komunitetin.

## Si funksionon

Supabase bashkon disa mjete me burim të hapur. Ne po ndërtojmë veçori të ngjashme me Firebase duke përdorur produkte të provuara të nivelit të ndërmarrjes. Nëse mjeti ose komuniteti ekziston dhe ka një licencë MIT, Apache 2 ose një licencë të ngjashme të hapur, ne do ta përdorim dhe mbështesim atë mjet. Nëse një mjet i tillë nuk ekziston, ne do ta krijojmë vetë dhe do ta hapim kodin burimor. Supabase nuk është një kopje e saktë e Firebase. Qëllimi ynë është t'u ofrojmë zhvilluesve një komoditet të krahasueshëm me Firebase, por duke përdorur mjete me burim të hapur.

**Arkitektura**

Supabase është një [platformë e menaxhuar](https://supabase.com/dashboard). Ju mund të regjistroheni dhe të filloni menjëherë përdorimin e Supabase, pa pasur nevojë të instaloni asgjë. Ju gjithashtu mund të [vendosni infrastrukturën tuaj](https://supabase.com/docs/guides/hosting/overview) dhe [të zhvilloni lokalisht](https://supabase.com/docs/guides/local-development).

![Arkitektura](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Një sistem bazash të dhënash objekt-relacional me më shumë se 30 vjet histori të zhvillimit aktiv. Ai njihet për besueshmërinë, funksionalitetin dhe performancën e tij.
*   **Realtime:** Një server në Elixir që ju lejon të dëgjoni ndryshimet në PostgreSQL (futjet, përditësimet dhe fshirjet) përmes prizave të uebit (websockets). Realtime përdor funksionalitetin e integruar të replikimit të Postgres, konverton ndryshimet në JSON dhe i transmeton ato te klientët e autorizuar.
*   **PostgREST:** Një server uebi që e shndërron bazën tuaj të të dhënave PostgreSQL në një API RESTful.
*   **GoTrue:** Një API i bazuar në JWT për menaxhimin e përdoruesve dhe lëshimin e shenjave JWT.
*   **Storage:** Ofron një ndërfaqe RESTful për menaxhimin e skedarëve të ruajtur në S3, duke përdorur Postgres për menaxhimin e lejeve.
*   **pg_graphql:** Një zgjerim PostgreSQL që ofron një API GraphQL.
*   **postgres-meta:** Një API RESTful për të menaxhuar Postgres tuaj, duke ju lejuar të merrni tabela, të shtoni role, të ekzekutoni pyetje, etj.
*   **Kong:** Një portë API cloud.

#### Libraritë e klientit

Ne përdorim një qasje modulare ndaj librarive të klientit. Çdo nën-librari është projektuar për të punuar me një sistem të vetëm të jashtëm. Ky është një nga mënyrat për të mbështetur mjetet ekzistuese.

(Tabela me libraritë e klientit, si në origjinal, por me emrat shqip dhe shpjegimet, ku është e nevojshme).

| Gjuha                       | Klienti Supabase                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Zyrtare⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Të mbështetura nga komuniteti💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Distinktivët (Badges)

Ju mund të përdorni këto distinktivë për të treguar se aplikacioni juaj është krijuar me Supabase:

**E ndritshme:**

![Bërë me Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Bërë me Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Bërë me Supabase" />
</a>
```

**E errët:**

![Bërë me Supabase (versioni i errët)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Bërë me Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Bërë me Supabase" />
</a>
```

## Përkthimet

[Lista e përkthimeve](./languages.md)
