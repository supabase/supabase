<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) este o alternativă open-source la Firebase. Construim funcționalitățile Firebase folosind instrumente open-source de nivel enterprise.

**Caracteristici cheie:**

- [x] **Bază de date Postgres gestionată:** [Documentație](https://supabase.com/docs/guides/database)
- [x] **Autentificare și autorizare:** [Documentație](https://supabase.com/docs/guides/auth)
- [x] **API-uri generate automat:**
    - [x] REST: [Documentație](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Documentație](https://supabase.com/docs/guides/graphql)
    - [x] Abonamente în timp real: [Documentație](https://supabase.com/docs/guides/realtime)
- [x] **Funcții:**
    - [x] Funcții de bază de date: [Documentație](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (funcții la marginea rețelei): [Documentație](https://supabase.com/docs/guides/functions)
- [x] **Stocare fișiere:** [Documentație](https://supabase.com/docs/guides/storage)
- [x] **Instrumente AI, Vectori și Embedding-uri:** [Documentație](https://supabase.com/docs/guides/ai)
- [x] **Panou de control (Dashboard)**

![Panou de control Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Abonează-te la "releases" (versiuni) ale acestui depozit pentru a primi notificări despre actualizări importante. Acest lucru îți va permite să fii la curent cu cele mai recente modificări și îmbunătățiri.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Urmărește depozitul"/></kbd>

## Documentație

Documentația completă este disponibilă la [supabase.com/docs](https://supabase.com/docs). Acolo vei găsi toate ghidurile și materialele de referință necesare.

Dacă dorești să contribui la proiect, consultă secțiunea [Începe](./../DEVELOPERS.md).

## Comunitate și suport

*   **Forumul comunității:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Ideal pentru a obține ajutor cu dezvoltarea și pentru a discuta cele mai bune practici pentru baze de date.
*   **Probleme GitHub (GitHub Issues):** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Folosește-l pentru a raporta bug-uri și erori pe care le întâmpini în timp ce utilizezi Supabase.
*   **Suport prin e-mail:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). Cea mai bună opțiune pentru probleme cu baza de date sau infrastructura ta.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Un loc minunat pentru a-ți partaja aplicațiile și a te conecta cu comunitatea.

## Cum funcționează

Supabase combină mai multe instrumente open-source. Construim funcționalități similare cu Firebase folosind produse dovedite de nivel enterprise. Dacă un instrument sau o comunitate există și are o licență MIT, Apache 2 sau o licență deschisă similară, vom folosi și vom sprijini acel instrument. Dacă instrumentul nu există, îl vom construi noi înșine și vom deschide codul sursă. Supabase nu este o replică exactă a Firebase. Scopul nostru este de a oferi dezvoltatorilor o experiență similară cu Firebase, dar folosind instrumente open-source.

**Arhitectură**

Supabase este o [platformă gestionată](https://supabase.com/dashboard). Te poți înscrie și începe să utilizezi Supabase imediat, fără a instala nimic. De asemenea, poți [să-ți implementezi propria infrastructură](https://supabase.com/docs/guides/hosting/overview) și [să dezvolți local](https://supabase.com/docs/guides/local-development).

![Arhitectură](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Un sistem de baze de date obiect-relațional cu peste 30 de ani de istorie de dezvoltare activă. Este cunoscut pentru fiabilitatea, funcționalitatea și performanța sa.
*   **Realtime:** Un server Elixir care îți permite să asculți modificările PostgreSQL (inserări, actualizări și ștergeri) prin websockets. Realtime utilizează funcționalitatea de replicare încorporată a Postgres, convertește modificările în JSON și le transmite clienților autorizați.
*   **PostgREST:** Un server web care transformă baza ta de date PostgreSQL într-un API RESTful.
*   **GoTrue:** Un API bazat pe JWT pentru gestionarea utilizatorilor și emiterea de token-uri JWT.
*   **Storage:** Oferă o interfață RESTful pentru gestionarea fișierelor stocate în S3, folosind Postgres pentru gestionarea permisiunilor.
*   **pg_graphql:** O extensie PostgreSQL care oferă un API GraphQL.
*   **postgres-meta:** Un API RESTful pentru gestionarea Postgres-ului tău, permițându-ți să preiei tabele, să adaugi roluri, să execuți interogări etc.
*   **Kong:** Un gateway API nativ cloud.

#### Biblioteci client

Folosim o abordare modulară pentru bibliotecile client. Fiecare sub-bibliotecă este concepută pentru a funcționa cu un singur sistem extern. Acesta este unul dintre modurile în care sprijinim instrumentele existente.

(Tabel cu bibliotecile client, ca în original, dar cu numele în română și explicații acolo unde este necesar).

| Limbă                       | Client Supabase                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Oficiale⚡️**          |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Suportate de comunitate💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Insigne (Badges)

Poți utiliza aceste insigne pentru a arăta că aplicația ta este construită cu Supabase:

**Deschis:**

![Construit cu Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Construit cu Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Construit cu Supabase" />
</a>
```

**Închis:**

![Construit cu Supabase (versiune închisă)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Construit cu Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Construit cu Supabase" />
</a>
```

## Traduceri

[Lista traducerilor](./languages.md)
