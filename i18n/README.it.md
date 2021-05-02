<p align="center">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/web/static/supabase-light-with-background.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io) è una alternativa a Firebase open source. Stiamo sviluppando le funzionalità offerte da Firebase utilizzando strumenti open source a livello professionale. 

- [x] Database Postgres ospitato
- [x] Sottoscrizioni in tempo reale
- [x] Autenticazione e autorizzazioni
- [x] API generate automaticamente
- [x] Dashboard
- [x] Archiviazione
- [ ] Funzioni (in arrivo)

## Documentazione

Per ottenere la documentazione completa, visitare il sito [supabase.io/docs](https://supabase.io/docs)

## Comunità e Supporto

- [Forum della Community](https://github.com/supabase/supabase/discussions). Ottimo per: supporto per lo sviluppo, discussioni sulle buone pratiche nell'utilizzo dei database.
- [Issues su GitHub](https://github.com/supabase/supabase/issues). Ottimo per: bug ed errori che potrebbero insorgere nell'utilizzo di Firebase.
- [Email di Supporto](https://supabase.io/docs/support#business-support). Ottimo per: problemi che potrebbero insorgere con i database o l'infrastruttura.

## Stato

- [x] Alfa: Stiamo testando Supabase con uno stretto numero di utenti
- [x] Alfa Pubblica: Chiunque puó iscriversi a [app.supabase.io](https://app.supabase.io). Ma andateci piano, ci potrebbero essere dei problemini.
- [x] Beta Pubblica: Abbastanza stabile per i casi d'uso a livello non professionale
- [ ] Pubblico: Pronto per la produzione

Attualmente siamo in Beta Publbica. Tenete d'occhio (cliccando sul bottone "Watch") le "release" di questa repository per essere notificati sui nostri aggiornamenti piú importanti.

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Come funziona

Supabase è l'insieme di strumenti open source. Stiamo sviluppando le funzionalità offerte da Firebase utilizzando strumenti open source, a livello professionale. Finché esisteranno strumenti e comunità, con licenze MIT, Apache 2, o equivalenti, noi utilizzeremo e supporteremo questi strumenti. Se lo strumento non dovesse esistere, ne svilupperemo una versione open source noi stessi. Supabase non è una riproduzione 1-a-1 di Firebase. Il nostro obiettivo è quello di dare agli sviluppatori un'esperienza di sviluppo simile a quella offerta da Firebase, utilizzando strumenti open source.

**Architettura attuale**

Supabase è una [piattaforma ospitata](https://app.supabase.io). Ci si può iscrivere ed iniziare ad utilizzare Supabase senza la necessità di installare qualcosa. Ci impegnamo nel creare un'esperienza di sviluppo in locale - attualmente é il nostro obiettivo primario, così come la stabilità della piattaforma stessa.

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

| Repository                  | Ufficiale                                         | Comunità                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust`                                                |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust`                                                |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust`                                                      |

<!--- Remove this list if you're traslating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->
## Traduzioni

- [Inglese / English](https://github.com/supabase/supabase)
- [Francese / Français](/i18n/README.fr.md)
- [Italiano](/i18n/README.it.md)
- [Tedesco / Deutsche](/i18n/README.de.md)
- [Hindi / हिंदी](/i18n/README.hi.md)
- [Giapponese / 日本語](/i18n/README.jp.md)
- [Portoghese Brasiliano / Português Brasileiro](/i18n/README.pt-br.md)
- [Portoghese / Portuguese](/i18n/README.pt.md)
- [Russo / Pусский](/i18n/README.ru.md)
- [Spagnolo / Español](/i18n/README.es.md)
- [Cinese Tradizionale / 繁体中文](/i18n/README.zh-tw.md)
- [Turco / Türkçe](/i18n/README.tr.md)
- [Lista delle Traduzioni](/i18n/languages.md) <!--- Keep only the this-->

---

## I nostri Sponsor

[![Nuovo Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
