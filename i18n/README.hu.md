<p align="center">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/web/static/supabase-light-rounded-corner-background.svg"/>
</p>

---

# Supabase

A [Supabase](https://supabase.io) egy nyílt forráskódú Firebase alternatíva. A Firebase funkcióit építjük vállalati szintű nyílt forráskódú eszközökkel.

- [x] Hosztolt Postgres Adatbázis
- [x] Valós idejű feliratkozások
- [x] Hitelesítés és engedélyezés
- [x] Automatikusan generált API-ok
- [x] Kezelőfelület
- [x] Tárhely
- [ ] Funkciók (hamarosan)

## Dokumentáció

A teljes dokumentációért látogasson el a [supabase.io/docs](https://supabase.io/docs) oldalra.

## Közösség & Támogatás

- [Közösségi Fórum](https://github.com/supabase/supabase/discussions). Segítség az építésben, beszélgetés az adatbázis legjobb gyakorlatairól.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Ha bugokat vagy hibákat észlelsz a Supabase használata közben.
- [Emailes Támogatás](https://supabase.io/docs/support#business-support). Adatbázis és infrastruktúra hibáinak emailes megoldása.
- [Discord](https://discord.supabase.com). Programok megosztása és kikapcsolódés a közösséggel.

## Állapot

- [x] Alfa: Teszteljük a Supabase-t egy zárt körű felhasználóbázissal
- [x] Publikus Alfa: Bárki feliratkozhat a [app.supabase.io](https://app.supabase.io) oldalon. De lehet lesz pár hiba
- [x] Publikus Béta: Elég stabil a nem vállalati felhasználásra
- [ ] Publikus: Gyártás kész

Jelenleg a Publikus Béta állapotban vagyunk. Nézze a repo "releases" fülét hogy értesüljön a nagy frissítésekről.

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Hogyan működik

A Supabase nyílt forráskódú eszközök kombinációja.A Firebase funkcióit építjük vállalati szintű eszközökkel. Ha az eszközök és közösségek léteznek, MIT, Apache 2, vagy más nyitott licenszel, használjuk, és támogatjuk az eszközt. Ha az eszköz nem létezik, megépítjük, és nyílt forráskódúvá tesszük. A Supabase nem egy teljes mása a Firebase-nek. Célunk Firebase szerű felhasználóélményt nyújtani a fejlesztőknek nyílt forráskódú eszközökkel.

**Jelenlegi architektúra**

Supabase egy [hosztolt platform](https://app.supabase.io). Regisztrálással letöltés nélkül is elkezdheted használni.
De [hosztolhatod magadnak](https://supabase.io/docs/guides/self-hosting) és akár [fejlesztheted helyileg](https://supabase.io/docs/guides/local-development).

![Architektúra](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/) egy objektum-kapcsolati adatbázis rendszer több mint 30 évnyi aktív fejlesztéssel ezalatt hírnevvet szerzett megbízhatóságáról, robosztus felépítéséről, és teljesítményéről.
- [Valós idő](https://github.com/supabase/realtime) egy Elixir szerver ami lehetővé teszi hogy figyeld a PostgreSQL beillesztéseket, frissítéseket, és törléseket websocket-ek felhasználásával. Supabase figyeli a Postgres belső replikációs funkcióját, átalakítja a replikációs bájtokat egy JSON-be, majd a JSON-t elküldi a websocket kapcsolaton.
- [PostgREST](http://postgrest.org/) egy web szerver ami a PostgreSQL adatbázisodat átalakítja közvetlenül egy RESTful adatbázissá.
- [Tárhely](https://github.com/supabase/storage-api) egy RESTful felületet biztosít az S3-ban tárolt fájlok kezeléséhez, Postgres-t használva az engedélyek kezeléséhez.
- [postgres-meta](https://github.com/supabase/postgres-meta) egy RESTful API a Postgres adatbázisod kezeléséhez, ami engedi hogy lekérd a táblákat, engedélyeket állíts, szűrőket futtass és még sok mást.
- [GoTrue](https://github.com/netlify/gotrue) egy SWT alapú API felhasznáéók kezeléséhez és SWT tokenek kiadásáért.
- [Kong](https://github.com/Kong/kong) egy cloud-native API-átjáró.

#### Kliens könyvtárak

A Kliens könyvtáraink modulárisak. Mindegyik alkönyvtár egy kivitelezés egy külső rendszerhez. Ez az egyik módja hogyan támogatunk már meglévő eszközöket.

- **`supabase-{lang}`**: Könyvtárak konbinációja és hozzáadott finomítások.
  - `postgrest-{lang}`: Kliens könyvtár [PostgREST](https://github.com/postgrest/postgrest) használatához
  - `realtime-{lang}`: Kliens könyvtár [Realtime](https://github.com/supabase/realtime) használatához
  - `gotrue-{lang}`: Kliens könyvtár [GoTrue](https://github.com/netlify/gotrue) használatához

| Repo                  | Hivatalos                                        | Közösség                                                                                                                                                                                                                                                                                                                             |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust` \| [`Ruby`](https://github.com/supabase/supabase-rb) \| `Go`                                                                                             |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) \| [`Ruby`](https://github.com/supabase/postgrest-rb) \| [`Go`](https://github.com/supabase/postgrest-go) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust` \| `Ruby` \| `Go`                                                                                                                                        |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust` \| `Ruby` \| `Go`                                                                                                                                              |

<!--- Remove this list if you're traslating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## Fordítások

- [Fordítások listája](/i18n/languages.md) <!--- Keep only this -->

---

## Támogatók

[![New Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
