<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) je odprtokodna alternativa Firebase. Gradimo funkcionalnosti Firebase z uporabo odprtokodnih orodij za podjetja.

**Ključne lastnosti:**

- [x] **Gostujoča Postgres baza podatkov:** [Dokumentacija](https://supabase.com/docs/guides/database)
- [x] **Avtentikacija in avtorizacija:** [Dokumentacija](https://supabase.com/docs/guides/auth)
- [x] **Samodejno generirani API-ji:**
    - [x] REST: [Dokumentacija](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Dokumentacija](https://supabase.com/docs/guides/graphql)
    - [x] Naročnine v realnem času: [Dokumentacija](https://supabase.com/docs/guides/realtime)
- [x] **Funkcije:**
    - [x] Funkcije baze podatkov: [Dokumentacija](https://supabase.com/docs/guides/database/functions)
    - [x] Edge funkcije (funkcije na robu omrežja): [Dokumentacija](https://supabase.com/docs/guides/functions)
- [x] **Shramba datotek:** [Dokumentacija](https://supabase.com/docs/guides/storage)
- [x] **Orodja za delo z UI, vektorji in embeddingi:** [Dokumentacija](https://supabase.com/docs/guides/ai)
- [x] **Nadzorna plošča**

![Supabase nadzorna plošča](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Naročite se na "releases" tega repozitorija, da boste obveščeni o pomembnih posodobitvah. To vam bo omogočilo, da boste na tekočem z najnovejšimi spremembami in izboljšavami.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Spremljaj repozitorij"/></kbd>

## Dokumentacija

Celotna dokumentacija je na voljo na [supabase.com/docs](https://supabase.com/docs). Tam boste našli vse potrebne priročnike in referenčne materiale.

Če želite prispevati k razvoju projekta, si oglejte razdelek [Začetek](./../DEVELOPERS.md).

## Skupnost in podpora

*   **Forum skupnosti:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Idealno za pomoč pri razvoju in razpravljanje o najboljših praksah dela z bazami podatkov.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Uporabite za poročanje o hroščih in napakah, s katerimi se srečujete pri uporabi Supabase.
*   **Podpora po e-pošti:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). Najboljša možnost za reševanje težav z vašo bazo podatkov ali infrastrukturo.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Odlično mesto za izmenjavo vaših aplikacij in druženje s skupnostjo.

## Kako deluje

Supabase združuje več odprtokodnih orodij. Gradimo funkcije, podobne Firebase, z uporabo preverjenih izdelkov za podjetja. Če orodje ali skupnost obstaja in ima licenco MIT, Apache 2 ali podobno odprto licenco, bomo to orodje uporabili in podprli. Če takega orodja ni, ga bomo ustvarili sami in odprli izvorno kodo. Supabase ni natančna kopija Firebase. Naš cilj je razvijalcem zagotoviti udobje, primerljivo s Firebase, vendar z uporabo odprtokodnih orodij.

**Arhitektura**

Supabase je [gostujoča platforma](https://supabase.com/dashboard). Lahko se registrirate in takoj začnete uporabljati Supabase, ne da bi morali karkoli namestiti. Prav tako lahko [postavite lastno infrastrukturo](https://supabase.com/docs/guides/hosting/overview) in [razvijate lokalno](https://supabase.com/docs/guides/local-development).

![Arhitektura](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Objektno-relacijski sistem baz podatkov z več kot 30-letno zgodovino aktivnega razvoja. Znan je po svoji zanesljivosti, funkcionalnosti in zmogljivosti.
*   **Realtime:** Strežnik na Elixirju, ki omogoča poslušanje sprememb v PostgreSQL (vstavljanja, posodobitve in brisanja) prek spletnih vtičnic. Realtime uporablja vgrajeno funkcionalnost replikacije Postgres, pretvori spremembe v JSON in jih posreduje avtoriziranim odjemalcem.
*   **PostgREST:** Spletni strežnik, ki vašo bazo podatkov PostgreSQL spremeni v RESTful API.
*   **GoTrue:** API na osnovi JWT za upravljanje uporabnikov in izdajanje žetonov JWT.
*   **Storage:** Ponuja RESTful vmesnik za upravljanje datotek, shranjenih v S3, z uporabo Postgres za upravljanje dovoljenj.
*   **pg_graphql:** Razširitev PostgreSQL, ki ponuja GraphQL API.
*   **postgres-meta:** RESTful API za upravljanje vašega Postgres, ki omogoča pridobivanje tabel, dodajanje vlog, izvajanje poizvedb itd.
*   **Kong:** Oblakovni API prehod.

#### Odjemalske knjižnice

Za odjemalske knjižnice uporabljamo modularen pristop. Vsaka podknjižnica je namenjena delu z enim zunanjim sistemom. To je eden od načinov podpore obstoječim orodjem.

(Tabela s odjemalskimi knjižnicami, kot v originalu, vendar s slovenskimi imeni in pojasnili, kjer je potrebno).

| Jezik                       | Odjemalec Supabase                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Uradne⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Podprto s strani skupnosti💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Značke (Badges)

Uporabite lahko te značke, da pokažete, da je vaša aplikacija narejena s Supabase:

**Svetla:**

![Narejeno s Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Narejeno s Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Narejeno s Supabase" />
</a>
```

**Temna:**

![Narejeno s Supabase (temna različica)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Narejeno s Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Narejeno s Supabase" />
</a>
```

## Prevodi

[Seznam prevodov](./languages.md)
