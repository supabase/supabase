<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) és una alternativa de codi obert a Firebase. Construïm les funcionalitats de Firebase utilitzant eines de codi obert de nivell empresarial.

**Característiques principals:**

- [x] **Base de dades Postgres gestionada:** [Documentació](https://supabase.com/docs/guides/database)
- [x] **Autenticació i autorització:** [Documentació](https://supabase.com/docs/guides/auth)
- [x] **API generades automàticament:**
    - [x] REST: [Documentació](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Documentació](https://supabase.com/docs/guides/graphql)
    - [x] Subscripcions en temps real: [Documentació](https://supabase.com/docs/guides/realtime)
- [x] **Funcions:**
    - [x] Funcions de base de dades: [Documentació](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (funcions al límit de la xarxa): [Documentació](https://supabase.com/docs/guides/functions)
- [x] **Emmagatzematge de fitxers:** [Documentació](https://supabase.com/docs/guides/storage)
- [x] **Eines d'IA, vectors i incrustacions (embeddings):** [Documentació](https://supabase.com/docs/guides/ai)
- [x] **Tauler de control**

![Tauler de control de Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Subscriviu-vos a "releases" d'aquest repositori per rebre notificacions sobre actualitzacions importants. Això us permetrà estar al dia de les últimes modificacions i millores.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Seguir el repositori"/></kbd>

## Documentació

La documentació completa està disponible a [supabase.com/docs](https://supabase.com/docs). Allà hi trobareu totes les guies i materials de referència necessaris.

Si voleu contribuir al desenvolupament del projecte, consulteu la secció [Començant](./../DEVELOPERS.md).

## Comunitat i suport

*   **Fòrum de la comunitat:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Ideal per obtenir ajuda amb el desenvolupament i discutir les millors pràctiques per treballar amb bases de dades.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Utilitzeu-lo per informar d'errors i problemes que trobeu en utilitzar Supabase.
*   **Suport per correu electrònic:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). La millor opció per resoldre problemes amb la vostra base de dades o infraestructura.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Un lloc fantàstic per compartir les vostres aplicacions i comunicar-vos amb la comunitat.

## Funcionament

Supabase combina diverses eines de codi obert. Construïm funcionalitats similars a Firebase utilitzant productes provats de nivell empresarial. Si una eina o comunitat existeix i té una llicència MIT, Apache 2 o una llicència oberta similar, utilitzarem i donarem suport a aquesta eina. Si aquesta eina no existeix, la crearem nosaltres mateixos i obrirem el seu codi. Supabase no és una rèplica exacta de Firebase. El nostre objectiu és proporcionar als desenvolupadors una experiència còmoda, comparable a Firebase, però utilitzant eines de codi obert.

**Arquitectura**

Supabase és una [plataforma gestionada](https://supabase.com/dashboard). Podeu registrar-vos i començar a utilitzar Supabase immediatament, sense instal·lar res. També podeu [desplegar la vostra pròpia infraestructura](https://supabase.com/docs/guides/hosting/overview) i [desenvolupar localment](https://supabase.com/docs/guides/local-development).

![Arquitectura](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Un sistema de gestió de bases de dades relacional d'objectes amb més de 30 anys d'història de desenvolupament actiu. És conegut per la seva fiabilitat, funcionalitat i rendiment.
*   **Realtime:** Un servidor Elixir que us permet escoltar els canvis a PostgreSQL (insercions, actualitzacions i supressions) mitjançant websockets. Realtime utilitza la funcionalitat de replicació integrada de Postgres, converteix els canvis a JSON i els transmet als clients autoritzats.
*   **PostgREST:** Un servidor web que converteix la vostra base de dades PostgreSQL en una API RESTful.
*   **GoTrue:** Una API basada en JWT per gestionar usuaris i emetre tokens JWT.
*   **Storage:** Proporciona una interfície RESTful per gestionar fitxers emmagatzemats a S3, utilitzant Postgres per gestionar els permisos.
*   **pg_graphql:** Una extensió de PostgreSQL que proporciona una API GraphQL.
*   **postgres-meta:** Una API RESTful per gestionar el vostre Postgres, que us permet obtenir taules, afegir rols, executar consultes, etc.
*   **Kong:** Una passarel·la d'API nativa del núvol.

#### Biblioteques de client

Utilitzem un enfocament modular per a les biblioteques de client. Cada sub-biblioteca està dissenyada per treballar amb un únic sistema extern. Aquesta és una de les maneres de donar suport a les eines existents.

(Taula amb biblioteques de client, com a l'original, però amb noms en català i explicacions, on sigui necessari).

| Llenguatge                       | Client Supabase                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Oficials⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Mantingudes per la comunitat💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Insígnies (Badges)

Podeu utilitzar aquestes insígnies per mostrar que la vostra aplicació està creada amb Supabase:

**Clar:**

![Fet amb Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Fet amb Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Fet amb Supabase" />
</a>
```

**Fosc:**

![Fet amb Supabase (versió fosca)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Fet amb Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Fet amb Supabase" />
</a>
```

## Traduccions

[Llista de traduccions](./languages.md)
