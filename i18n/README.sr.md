<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) je alternativa Firebase-u otvorenog koda. Gradimo funkcionalnosti Firebase-a koristeći alate otvorenog koda preduzetničkog nivoa.

**Ključne karakteristike:**

- [x] **Upravljana Postgres baza podataka:** [Dokumentacija](https://supabase.com/docs/guides/database)
- [x] **Autentifikacija i autorizacija:** [Dokumentacija](https://supabase.com/docs/guides/auth)
- [x] **Automatski generisani API-ji:**
    - [x] REST: [Dokumentacija](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Dokumentacija](https://supabase.com/docs/guides/graphql)
    - [x] Pretplate u realnom vremenu: [Dokumentacija](https://supabase.com/docs/guides/realtime)
- [x] **Funkcije:**
    - [x] Funkcije baze podataka: [Dokumentacija](https://supabase.com/docs/guides/database/functions)
    - [x] Edge funkcije (funkcije na ivici mreže): [Dokumentacija](https://supabase.com/docs/guides/functions)
- [x] **Skladištenje datoteka:** [Dokumentacija](https://supabase.com/docs/guides/storage)
- [x] **Alati za rad sa veštačkom inteligencijom, vektorima i ugradnjama (embeddings):** [Dokumentacija](https://supabase.com/docs/guides/ai)
- [x] **Kontrolna tabla**

![Supabase kontrolna tabla](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Pretplatite se na "releases" ovog repozitorijuma da biste bili obavešteni o važnim ispravkama. To će vam omogućiti da budete u toku sa najnovijim promenama i poboljšanjima.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Prati repozitorijum"/></kbd>

## Dokumentacija

Kompletna dokumentacija je dostupna na [supabase.com/docs](https://supabase.com/docs). Tamo ćete pronaći sve potrebne vodiče i referentne materijale.

Ako želite da doprinesete razvoju projekta, pogledajte odeljak [Početak](./../DEVELOPERS.md).

## Zajednica i podrška

*   **Forum zajednice:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Idealno za dobijanje pomoći u razvoju i diskusiju o najboljim praksama rada sa bazama podataka.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Koristite za prijavljivanje grešaka i bagova sa kojima se susrećete pri korišćenju Supabase-a.
*   **Podrška putem e-pošte:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). Najbolja opcija za rešavanje problema sa vašom bazom podataka ili infrastrukturom.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Odlično mesto za razmenu vaših aplikacija i druženje sa zajednicom.

## Kako radi

Supabase objedinjuje nekoliko alata otvorenog koda. Gradimo funkcije slične Firebase-u, koristeći proverene proizvode preduzetničkog nivoa. Ako alat ili zajednica postoji i ima licencu MIT, Apache 2 ili sličnu otvorenu licencu, koristićemo i podržati taj alat. Ako takav alat ne postoji, sami ćemo ga kreirati i otvoriti izvorni kod. Supabase nije tačna kopija Firebase-a. Naš cilj je da programerima pružimo udobnost uporedivu sa Firebase-om, ali uz korišćenje alata otvorenog koda.

**Arhitektura**

Supabase je [upravljana platforma](https://supabase.com/dashboard). Možete se registrovati i odmah početi da koristite Supabase, bez potrebe da bilo šta instalirate. Takođe možete [postaviti sopstvenu infrastrukturu](https://supabase.com/docs/guides/hosting/overview) i [razvijati lokalno](https://supabase.com/docs/guides/local-development).

![Arhitektura](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Objektno-relacioni sistem baza podataka sa više od 30 godina istorije aktivnog razvoja. Poznat je po svojoj pouzdanosti, funkcionalnosti i performansama.
*   **Realtime:** Server na Elixir-u koji vam omogućava da slušate promene u PostgreSQL-u (umetanja, ažuriranja i brisanja) putem veb soketa. Realtime koristi ugrađenu funkcionalnost replikacije Postgres-a, konvertuje promene u JSON i prosleđuje ih autorizovanim klijentima.
*   **PostgREST:** Veb server koji vašu PostgreSQL bazu podataka pretvara u RESTful API.
*   **GoTrue:** API zasnovan na JWT-u za upravljanje korisnicima i izdavanje JWT tokena.
*   **Storage:** Pruža RESTful interfejs za upravljanje datotekama sačuvanim u S3, koristeći Postgres za upravljanje dozvolama.
*   **pg_graphql:** PostgreSQL ekstenzija koja pruža GraphQL API.
*   **postgres-meta:** RESTful API za upravljanje vašim Postgres-om, koji vam omogućava da dobijete tabele, dodate uloge, izvršite upite itd.
*   **Kong:** API gateway u oblaku.

#### Klijentske biblioteke

Koristimo modularni pristup klijentskim bibliotekama. Svaka pod-biblioteka je dizajnirana za rad sa jednim spoljnim sistemom. Ovo je jedan od načina podrške postojećim alatima.

(Tabela sa klijentskim bibliotekama, kao u originalu, ali sa srpskim nazivima i objašnjenjima, gde je potrebno).

| Jezik                       | Supabase klijent                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Zvanične⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Podržane od strane zajednice💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Bedževi (Badges)

Možete koristiti ove bedževe da biste pokazali da je vaša aplikacija napravljena sa Supabase-om:

**Svetli:**

![Napravljeno sa Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Napravljeno sa Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Napravljeno sa Supabase" />
</a>
```

**Tamni:**

![Napravljeno sa Supabase (tamna verzija)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Napravljeno sa Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Napravljeno sa Supabase" />
</a>
```

## Prevodi

[Lista prevoda](./languages.md)
