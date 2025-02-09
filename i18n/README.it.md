<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) è un'alternativa open source a Firebase. Stiamo costruendo le funzionalità di Firebase utilizzando strumenti open source di livello enterprise.

**Caratteristiche principali:**

- [x] **Database Postgres gestito:** [Documentazione](https://supabase.com/docs/guides/database)
- [x] **Autenticazione e autorizzazione:** [Documentazione](https://supabase.com/docs/guides/auth)
- [x] **API generate automaticamente:**
    - [x] REST: [Documentazione](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Documentazione](https://supabase.com/docs/guides/graphql)
    - [x] Sottoscrizioni in tempo reale: [Documentazione](https://supabase.com/docs/guides/realtime)
- [x] **Funzioni:**
    - [x] Funzioni di database: [Documentazione](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (funzioni al margine della rete): [Documentazione](https://supabase.com/docs/guides/functions)
- [x] **Archiviazione file:** [Documentazione](https://supabase.com/docs/guides/storage)
- [x] **Strumenti AI, vettori e incorporamenti (embeddings):** [Documentazione](https://supabase.com/docs/guides/ai)
- [x] **Dashboard**

![Dashboard di Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Iscriviti alle "release" di questo repository per ricevere notifiche sugli aggiornamenti importanti. Questo ti permetterà di rimanere aggiornato sulle ultime modifiche e miglioramenti.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Osserva il repository"/></kbd>

## Documentazione

La documentazione completa è disponibile su [supabase.com/docs](https://supabase.com/docs). Lì troverai tutte le guide e i materiali di riferimento necessari.

Se vuoi contribuire allo sviluppo del progetto, consulta la sezione [Per iniziare](./../DEVELOPERS.md).

## Community e supporto

*   **Forum della community:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Ideale per ottenere aiuto con lo sviluppo e discutere le migliori pratiche per lavorare con i database.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Utilizzalo per segnalare bug ed errori che incontri durante l'utilizzo di Supabase.
*   **Supporto via email:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). L'opzione migliore per risolvere problemi con il tuo database o la tua infrastruttura.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Un ottimo posto per condividere le tue applicazioni e comunicare con la community.

## Principio di funzionamento

Supabase combina diversi strumenti open source. Stiamo costruendo funzionalità simili a Firebase utilizzando prodotti collaudati di livello enterprise. Se uno strumento o una community esiste e ha una licenza MIT, Apache 2 o una licenza aperta simile, useremo e supporteremo quello strumento. Se tale strumento non esiste, lo creeremo noi stessi e ne apriremo il codice sorgente. Supabase non è una replica esatta di Firebase. Il nostro obiettivo è fornire agli sviluppatori una comodità paragonabile a Firebase, ma utilizzando strumenti open source.

**Architettura**

Supabase è una [piattaforma gestita](https://supabase.com/dashboard). Puoi registrarti e iniziare subito a utilizzare Supabase, senza installare nulla. Puoi anche [distribuire la tua infrastruttura](https://supabase.com/docs/guides/hosting/overview) e [sviluppare localmente](https://supabase.com/docs/guides/local-development).

![Architettura](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Un sistema di gestione di database relazionali a oggetti con oltre 30 anni di storia di sviluppo attivo. È noto per la sua affidabilità, funzionalità e prestazioni.
*   **Realtime:** Un server Elixir che ti permette di ascoltare le modifiche in PostgreSQL (inserimenti, aggiornamenti ed eliminazioni) tramite websocket. Realtime utilizza la funzionalità di replica integrata di Postgres, converte le modifiche in JSON e le trasmette ai client autorizzati.
*   **PostgREST:** Un server web che trasforma il tuo database PostgreSQL in un'API RESTful.
*   **GoTrue:** Un'API basata su JWT per la gestione degli utenti e l'emissione di token JWT.
*   **Storage:** Fornisce un'interfaccia RESTful per la gestione dei file archiviati in S3, utilizzando Postgres per gestire le autorizzazioni.
*   **pg_graphql:** Un'estensione PostgreSQL che fornisce un'API GraphQL.
*   **postgres-meta:** Un'API RESTful per la gestione del tuo Postgres, che ti consente di ottenere tabelle, aggiungere ruoli, eseguire query, ecc.
*   **Kong:** Un gateway API nativo del cloud.

#### Librerie client

Utilizziamo un approccio modulare per le librerie client. Ogni sotto-libreria è progettata per funzionare con un singolo sistema esterno. Questo è uno dei modi per supportare gli strumenti esistenti.

(Tabella con le librerie client, come nell'originale, ma con nomi in italiano e spiegazioni, dove necessario).

| Lingua                       | Client Supabase                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Ufficiali⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Supportate dalla community💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Badge

Puoi usare questi badge per mostrare che la tua applicazione è costruita con Supabase:

**Chiaro:**

![Costruito con Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Costruito con Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Costruito con Supabase" />
</a>
```

**Scuro:**

![Costruito con Supabase (versione scura)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Costruito con Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Costruito con Supabase" />
</a>
```

## Traduzioni

[Elenco delle traduzioni](./languages.md)
