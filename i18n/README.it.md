<p align="center">
  <img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/web/static/supabase-light-rounded-corner-background.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io) è una alternativa a Firebase con codice sorgente aperto. Stiamo sviluppando le funzionalità offerte da Firebase utilizzando strumenti con sorgente aperto a livello professionale.

- [x] Database Postgres ospitato
- [x] Sottoscrizioni in tempo reale
- [x] Autenticazione e autorizzazioni
- [x] API generate automaticamente
- [x] Cruscotto
- [x] Archiviazione
- [ ] Funzioni (in arrivo)

## Documentazione

Per ottenere la documentazione completa, visitare il sito [supabase.io/docs](https://supabase.io/docs).

## Comunità e Supporto

- [Forum della Comunità](https://github.com/supabase/supabase/discussions). Indicato per: supporto allo sviluppo, discussioni sulle buone pratiche nell'utilizzo dei database.
- [Issues su GitHub](https://github.com/supabase/supabase/issues). Indicato per: bug ed errori che potrebbero insorgere nell'utilizzo di Supabase.
- [Email di Supporto](https://supabase.io/docs/support#business-support). Indicato per: problemi che potrebbero insorgere con i database o l'infrastruttura.

## Stato

- [x] Alfa: Stiamo testando Supabase con una ristretta cerchia di utenti
- [x] Alfa Pubblica: Chiunque puó iscriversi a [app.supabase.io](https://app.supabase.io). Ma andateci piano, ci potrebbero essere degli inconvenienti.
- [x] Beta Pubblica: Abbastanza stabile per i casi d'uso a livello non professionale
- [ ] Pubblico: Pronto per la produzione

Attualmente siamo in Beta Pubblica. Tenete d'occhio (cliccando sul bottone "Watch") le "release" di questa repository per essere notificati sui nostri aggiornamenti piú importanti.

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Come funziona

Supabase è un insieme di strumenti con sorgente aperto. Stiamo sviluppando le funzionalità offerte da Firebase utilizzando strumenti con sorgente aperto, a livello professionale. Finché esisteranno strumenti e comunità, con licenze MIT, Apache 2, o equivalenti, noi utilizzeremo e supporteremo questi strumenti. Se lo strumento non dovesse esistere, ne svilupperemo una versione con sorgente aperto noi stessi. Supabase non è una riproduzione uno-a-uno di Firebase. Il nostro obiettivo è quello di dare agli sviluppatori un'esperienza di sviluppo simile a quella offerta da Firebase, utilizzando solo strumenti con sorgente aperto.

**Architettura attuale**

Supabase è una [piattaforma ospitata](https://app.supabase.io). Ci si può iscrivere ed iniziare ad utilizzare Supabase senza la necessità di installare qualcosa. Ci impegnamo nel creare un'esperienza di sviluppo interamente in locale - attualmente é il nostro obiettivo primario, così come lo è la stabilità della piattaforma stessa.

![Architettura](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/) è un sistema di database relazionali ad oggetti, con oltre 30 anni di sviluppo all'attivo che gli hanno permesso di ottenere una ottima reputazione in termini di affidabilità, robustezza delle funzionalità e prestazioni.
- [Realtime](https://github.com/supabase/realtime) è un server Elixir che consente di ascoltare eventi PostreSQL quali inserimento, aggiornamenti e rimozioni utilizzando i websocket. Supabase rimane in ascolto della funzionalità incorporata di replicazione di Postgres, convertendo il flusso di byte replicato in JSON, dopodichè diffondendo il JSON attraverso i websocket.
- [PostgREST](http://postgrest.org/) è un web server che trasforma il database PostreSQL direttamente in API di tipo RESTful.
- [Storage](https://github.com/supabase/storage-api) fornisce un'interfaccia RESTful per gestire i File archiviati in S3, utilizzando Postgres per la gestione dei permessi.
- [postgres-meta](https://github.com/supabase/postgres-meta) è una API RESTful per gestire Postgres, permettendo di recuperare tabelle, aggiungere ruoli, lanciare interrogazioni ecc.
- [GoTrue](https://github.com/netlify/gotrue) è una API basata su SWT per la gestione delle utenze e per generare token SWT.
- [Kong](https://github.com/Kong/kong) è una porta per le API nativa del cloud.

#### Librerie utente

La nostra libreria utente è modulare. Ogni sotto-libreria è una implementazione indipendente per un singolo sistema esterno. Questo è uno dei modi con cui supportiamo gli strumenti già esistenti.

- **`supabase-{lang}`**: Combina le librerie e le arricchisce.
  - `postgrest-{lang}`: Libreria utente per lavorare con [PostgREST](https://github.com/postgrest/postgrest)
  - `realtime-{lang}`: Libreria utente per lavorare con [Realtime](https://github.com/supabase/realtime)
  - `gotrue-{lang}`: Libreria utente per lavorare con [GoTrue](https://github.com/netlify/gotrue)

| Repository            | Ufficiale                                        | Comunità                                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust`                                                |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust`                                                |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust`                                                      |

- [Lista delle Traduzioni](/i18n/languages.md)

---

## I nostri Sponsor

[![Nuovo Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
