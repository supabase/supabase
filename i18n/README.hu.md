<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

A [Supabase](https://supabase.com) a Firebase nyílt forráskódú alternatívája. A Firebase funkcióit vállalati szintű, nyílt forráskódú eszközökkel építjük.

**Főbb jellemzők:**

- [x] **Menedzselt Postgres adatbázis:** [Dokumentáció](https://supabase.com/docs/guides/database)
- [x] **Hitelesítés és engedélyezés:** [Dokumentáció](https://supabase.com/docs/guides/auth)
- [x] **Automatikusan generált API-k:**
    - [x] REST: [Dokumentáció](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Dokumentáció](https://supabase.com/docs/guides/graphql)
    - [x] Valós idejű feliratkozások: [Dokumentáció](https://supabase.com/docs/guides/realtime)
- [x] **Funkciók:**
    - [x] Adatbázis funkciók: [Dokumentáció](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (funkciók a hálózat peremén): [Dokumentáció](https://supabase.com/docs/guides/functions)
- [x] **Fájltárolás:** [Dokumentáció](https://supabase.com/docs/guides/storage)
- [x] **AI, vektorok és beágyazások (embeddings) eszközök:** [Dokumentáció](https://supabase.com/docs/guides/ai)
- [x] **Irányítópult**

![Supabase irányítópult](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Iratkozzon fel a tároló "kiadások" (releases) értesítőjére, hogy értesüljön a fontos frissítésekről. Ez lehetővé teszi, hogy naprakész legyen a legújabb változásokkal és fejlesztésekkel.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Tároló figyelése"/></kbd>

## Dokumentáció

A teljes dokumentáció elérhető a [supabase.com/docs](https://supabase.com/docs) oldalon. Ott megtalálja az összes szükséges útmutatót és referenciaanyagot.

Ha hozzá szeretne járulni a projekt fejlesztéséhez, tekintse meg a [Kezdő lépések](./../DEVELOPERS.md) szakaszt.

## Közösség és támogatás

*   **Közösségi fórum:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Ideális fejlesztési segítség kéréséhez és az adatbázisokkal való munka legjobb gyakorlatainak megvitatásához.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Használja a Supabase használata során tapasztalt hibák és problémák jelentésére.
*   **E-mail támogatás:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). A legjobb megoldás az adatbázissal vagy az infrastruktúrával kapcsolatos problémák megoldására.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Remek hely az alkalmazások megosztására és a közösséggel való kommunikációra.

## Működési elv

A Supabase több nyílt forráskódú eszközt egyesít. A Firebase-hez hasonló funkciókat építünk bevált, vállalati szintű termékekkel. Ha egy eszköz vagy közösség létezik, és MIT, Apache 2 vagy hasonló nyílt licenccel rendelkezik, akkor ezt az eszközt fogjuk használni és támogatni. Ha ilyen eszköz nem létezik, mi magunk hozzuk létre, és megnyitjuk a forráskódját. A Supabase nem a Firebase pontos másolata. Célunk, hogy a fejlesztők számára a Firebase-hez hasonló kényelmet biztosítsunk, de nyílt forráskódú eszközökkel.

**Architektúra**

A Supabase egy [menedzselt platform](https://supabase.com/dashboard). Regisztrálhat, és azonnal elkezdheti használni a Supabase-t, anélkül, hogy bármit is telepítenie kellene. [Saját infrastruktúrát is telepíthet](https://supabase.com/docs/guides/hosting/overview) és [helyben fejleszthet](https://supabase.com/docs/guides/local-development).

![Architektúra](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Objektum-relációs adatbázis-kezelő rendszer, több mint 30 éves aktív fejlesztési múlttal. Megbízhatóságáról, funkcionalitásáról és teljesítményéről ismert.
*   **Realtime:** Egy Elixir szerver, amely lehetővé teszi a PostgreSQL változásainak (beszúrások, frissítések és törlések) figyelését websockets-en keresztül. A Realtime a Postgres beépített replikációs funkcióját használja, a változásokat JSON formátumba konvertálja, és továbbítja az engedélyezett klienseknek.
*   **PostgREST:** Egy webszerver, amely a PostgreSQL adatbázist RESTful API-vá alakítja.
*   **GoTrue:** JWT-alapú API a felhasználók kezeléséhez és a JWT tokenek kiadásához.
*   **Storage:** RESTful felületet biztosít az S3-ban tárolt fájlok kezeléséhez, a Postgres segítségével a jogosultságok kezeléséhez.
*   **pg_graphql:** PostgreSQL kiterjesztés, amely GraphQL API-t biztosít.
*   **postgres-meta:** RESTful API a Postgres kezeléséhez, amely lehetővé teszi táblák lekérését, szerepkörök hozzáadását, lekérdezések futtatását stb.
*   **Kong:** Felhő-natív API átjáró.

#### Kliens könyvtárak

Moduláris megközelítést alkalmazunk a kliens könyvtárakhoz. Minden alkönyvtár egyetlen külső rendszerrel való együttműködésre van tervezve. Ez az egyik módja a meglévő eszközök támogatásának.

(Táblázat a kliens könyvtárakkal, mint az eredetiben, de magyar nevekkel és magyarázatokkal, ahol szükséges).

| Nyelv                       | Supabase kliens                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Hivatalos⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Közösség által támogatott💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Jelvények (Badges)

Ezekkel a jelvényekkel jelezheti, hogy az alkalmazása a Supabase segítségével készült:

**Világos:**

![Supabase-zel készült](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Supabase-zel készült](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Supabase-zel készült" />
</a>
```

**Sötét:**

![Supabase-zel készült (sötét verzió)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Supabase-zel készült](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Supabase-zel készült" />
</a>
```

## Fordítások

[Fordítások listája](./languages.md)
