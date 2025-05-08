<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) yra atvirojo kodo „Firebase“ alternatyva. Kuriame „Firebase“ funkcijas naudodami įmonės lygio atvirojo kodo įrankius.

**Pagrindinės funkcijos:**

- [x] **Valdoma Postgres duomenų bazė:** [Dokumentacija](https://supabase.com/docs/guides/database)
- [x] **Autentifikavimas ir autorizacija:** [Dokumentacija](https://supabase.com/docs/guides/auth)
- [x] **Automatiškai generuojamos API:**
    - [x] REST: [Dokumentacija](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Dokumentacija](https://supabase.com/docs/guides/graphql)
    - [x] Realaus laiko prenumeratos: [Dokumentacija](https://supabase.com/docs/guides/realtime)
- [x] **Funkcijos:**
    - [x] Duomenų bazės funkcijos: [Dokumentacija](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (funkcijos tinkle): [Dokumentacija](https://supabase.com/docs/guides/functions)
- [x] **Failų saugykla:** [Dokumentacija](https://supabase.com/docs/guides/storage)
- [x] **AI, vektorių ir įdėjimų įrankiai:** [Dokumentacija](https://supabase.com/docs/guides/ai)
- [x] **Valdymo skydelis**

![Supabase valdymo skydelis](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Prenumeruokite šio saugyklos „leidimus“ (releases), kad gautumėte pranešimus apie svarbius atnaujinimus. Tai leis jums sekti naujausius pakeitimus ir patobulinimus.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Stebėti saugyklą"/></kbd>

## Dokumentacija

Išsamią dokumentaciją rasite [supabase.com/docs](https://supabase.com/docs). Ten rasite visas reikalingas instrukcijas ir nuorodas.

Jei norite prisidėti prie projekto, peržiūrėkite skyrių [Darbo pradžia](./../DEVELOPERS.md).

## Bendruomenė ir palaikymas

*   **Bendruomenės forumas:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions).  Idealiai tinka pagalbai kuriant ir diskutuojant apie geriausias duomenų bazių praktikas.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues).  Naudokite pranešdami apie klaidas ir triktis, su kuriomis susiduriate naudodami „Supabase“.
*   **Palaikymas el. paštu:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support).  Geriausias pasirinkimas sprendžiant problemas, susijusias su jūsų duomenų baze ar infrastruktūra.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Puiki vieta dalytis savo programomis ir bendrauti su bendruomene.

## Kaip tai veikia

„Supabase“ sujungia kelis atvirojo kodo įrankius. Kuriame „Firebase“ funkcijas naudodami patikrintus įmonės lygio produktus. Jei įrankis ar bendruomenė egzistuoja ir turi MIT, Apache 2 ar panašią atvirą licenciją, mes naudosime ir palaikysime tą įrankį. Jei tokio įrankio nėra, mes jį sukursime patys ir atversime kodą. „Supabase“ nėra tiksli „Firebase“ kopija. Mūsų tikslas – suteikti kūrėjams patogumą, panašų į „Firebase“, bet naudojant atvirojo kodo įrankius.

**Architektūra**

„Supabase“ yra [valdoma platforma](https://supabase.com/dashboard). Galite užsiregistruoti ir iš karto pradėti naudoti „Supabase“ nieko neįdiegę. Taip pat galite [įdiegti savo infrastruktūrą](https://supabase.com/docs/guides/hosting/overview) ir [kurti lokaliai](https://supabase.com/docs/guides/local-development).

![Architektūra](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Objektų-reliacinė duomenų bazių sistema, turinti daugiau nei 30 metų aktyvaus kūrimo istoriją. Ji žinoma dėl savo patikimumo, funkcionalumo ir našumo.
*   **Realtime:** „Elixir“ serveris, leidžiantis per „websockets“ klausytis „PostgreSQL“ pakeitimų (įterpimų, atnaujinimų ir ištrynimų). „Realtime“ naudoja integruotą „Postgres“ replikavimo funkciją, konvertuoja pakeitimus į JSON ir perduoda juos įgaliotiems klientams.
*   **PostgREST:** Žiniatinklio serveris, paverčiantis jūsų „PostgreSQL“ duomenų bazę į RESTful API.
*   **GoTrue:** JWT pagrindu veikianti API, skirta valdyti vartotojus ir išduoti JWT prieigos raktus.
*   **Storage:** Suteikia RESTful sąsają failams, saugomiems S3, valdyti, naudojant „Postgres“ leidimams valdyti.
*   **pg_graphql:** „PostgreSQL“ plėtinys, teikiantis „GraphQL“ API.
*   **postgres-meta:** RESTful API, skirta valdyti jūsų „Postgres“, leidžianti gauti lenteles, pridėti vaidmenis, vykdyti užklausas ir kt.
*   **Kong:** Debesijos pagrindu veikianti API šliuzas (gateway).

#### Klientų bibliotekos

Klientų bibliotekoms naudojame modulinį požiūrį. Kiekviena antrinė biblioteka yra skirta dirbti su viena išorine sistema. Tai vienas iš būdų palaikyti esamus įrankius.

(Lentelė su klientų bibliotekomis, kaip originale, bet su lietuviškais pavadinimais ir paaiškinimais, kur reikia).

| Kalba                       | Supabase klientas                                                   | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :----------------------------------------------------------------- | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Oficialios⚡️**         |                                                                    |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)              | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)    | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)         | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)              | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Bendruomenės palaikomos💚** |                                                                    |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                  | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                  | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)      | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)     |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                 |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Ženkliukai (Badges)

Galite naudoti šiuos ženkliukus, norėdami parodyti, kad jūsų programa sukurta naudojant „Supabase“:

**Šviesus:**

![Sukurta su Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Sukurta su Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Sukurta su Supabase" />
</a>
```

**Tamsus:**

![Sukurta su Supabase (tamsi versija)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Sukurta su Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Sukurta su Supabase" />
</a>
```

## Vertimai

[Vertimų sąrašas](./languages.md)
