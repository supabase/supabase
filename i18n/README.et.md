<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) on avatud lähtekoodiga alternatiiv Firebase'ile. Me ehitame Firebase'i funktsioone, kasutades ettevõtte tasemel avatud lähtekoodiga tööriistu.

**Põhifunktsioonid:**

- [x] **Hallatud Postgresi andmebaas:** [Dokumentatsioon](https://supabase.com/docs/guides/database)
- [x] **Autentimine ja autoriseerimine:** [Dokumentatsioon](https://supabase.com/docs/guides/auth)
- [x] **Automaatselt genereeritud API-d:**
    - [x] REST: [Dokumentatsioon](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Dokumentatsioon](https://supabase.com/docs/guides/graphql)
    - [x] Reaalajas tellimused: [Dokumentatsioon](https://supabase.com/docs/guides/realtime)
- [x] **Funktsioonid:**
    - [x] Andmebaasi funktsioonid: [Dokumentatsioon](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (funktsioonid võrgu serval): [Dokumentatsioon](https://supabase.com/docs/guides/functions)
- [x] **Failide salvestusruum:** [Dokumentatsioon](https://supabase.com/docs/guides/storage)
- [x] **AI, vektorid ja manustused (embeddings) tööriistad:** [Dokumentatsioon](https://supabase.com/docs/guides/ai)
- [x] **Juhtpaneel**

![Supabase'i juhtpaneel](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Tellige selle hoidla "releases" (väljalasked), et saada teateid oluliste värskenduste kohta. See võimaldab teil olla kursis viimaste muudatuste ja täiustustega.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Jälgi hoidlat"/></kbd>

## Dokumentatsioon

Täielik dokumentatsioon on saadaval aadressil [supabase.com/docs](https://supabase.com/docs). Sealt leiate kõik vajalikud juhendid ja viitematerjalid.

Kui soovite projekti arendusse panustada, vaadake jaotist [Alustamine](./../DEVELOPERS.md).

## Kogukond ja tugi

*   **Kogukonna foorum:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Ideaalne arendusabi saamiseks ja andmebaasidega töötamise parimate tavade arutamiseks.
*   **GitHubi probleemid (Issues):** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Kasutage Supabase'i kasutamisel esinevate vigade ja probleemide teatamiseks.
*   **E-posti tugi:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). Parim valik andmebaasi või infrastruktuuriga seotud probleemide lahendamiseks.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Suurepärane koht oma rakenduste jagamiseks ja kogukonnaga suhtlemiseks.

## Tööpõhimõte

Supabase ühendab mitmeid avatud lähtekoodiga tööriistu. Me ehitame Firebase'iga sarnaseid funktsioone, kasutades tõestatud ettevõtte tasemel tooteid. Kui tööriist või kogukond on olemas ja sellel on MIT, Apache 2 või sarnane avatud litsents, siis me kasutame ja toetame seda tööriista. Kui sellist tööriista pole, loome selle ise ja avame selle lähtekoodi. Supabase ei ole Firebase'i täpne koopia. Meie eesmärk on pakkuda arendajatele Firebase'iga võrreldavat mugavust, kuid avatud lähtekoodiga tööriistade abil.

**Arhitektuur**

Supabase on [hallatud platvorm](https://supabase.com/dashboard). Saate registreeruda ja kohe Supabase'i kasutama hakata, ilma et peaksite midagi installima. Samuti saate [paigaldada oma infrastruktuuri](https://supabase.com/docs/guides/hosting/overview) ja [arendada kohalikult](https://supabase.com/docs/guides/local-development).

![Arhitektuur](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Objekt-relatsiooniline andmebaasisüsteem, millel on rohkem kui 30 aastat aktiivset arendust. See on tuntud oma usaldusväärsuse, funktsionaalsuse ja jõudluse poolest.
*   **Realtime:** Elixiri server, mis võimaldab teil kuulata PostgreSQL-i muudatusi (sisestamised, värskendused ja kustutamised) veebisoklite kaudu. Realtime kasutab Postgresi sisseehitatud replikatsioonifunktsiooni, teisendab muudatused JSON-iks ja edastab need volitatud klientidele.
*   **PostgREST:** Veebiserver, mis muudab teie PostgreSQL-i andmebaasi RESTful API-ks.
*   **GoTrue:** JWT-põhine API kasutajate haldamiseks ja JWT-tõendite väljastamiseks.
*   **Storage:** Pakub RESTful liidest S3-s salvestatud failide haldamiseks, kasutades Postgresi lubade haldamiseks.
*   **pg_graphql:** PostgreSQL-i laiendus, mis pakub GraphQL API-d.
*   **postgres-meta:** RESTful API teie Postgresi haldamiseks, mis võimaldab teil hankida tabeleid, lisada rolle, käivitada päringuid jne.
*   **Kong:** Pilvepõhine API lüüs.

#### Kliendiraamatukogud

Kasutame kliendiraamatukogude puhul modulaarset lähenemist. Iga alamraamatukogu on mõeldud töötama ühe välise süsteemiga. See on üks viis olemasolevate tööriistade toetamiseks.

(Tabel kliendiraamatukogudega, nagu originaalis, kuid eesti nimede ja selgitustega, kus vaja).

| Keel                       | Supabase'i klient                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Ametlikud⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Kogukonna poolt toetatud💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Märgid (Badges)

Saate kasutada neid märke, et näidata, et teie rakendus on loodud Supabase'i abil:

**Hele:**

![Loodud Supabase'iga](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Loodud Supabase'iga](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Loodud Supabase'iga" />
</a>
```

**Tume:**

![Loodud Supabase'iga (tume versioon)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Loodud Supabase'iga](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Loodud Supabase'iga" />
</a>
```

## Tõlked

[Tõlgete loend](./languages.md)
