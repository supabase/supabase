<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) è un'alternativa open source a Firebase. Stiamo costruendo le funzionalità di Firebase utilizzando strumenti open source di livello enterprise.

- Database Postgres ospitato. [Documentazione](https://supabase.com/docs/guides/database)
- [x] Autenticazione e autorizzazione. [Documentazione](https://supabase.com/docs/guides/auth)
- [x] API generate automaticamente.
  - [x] REST. [Documentazione](https://supabase.com/docs/guides/api#rest-api-overview)
  - [x] GraphQL. [Documentazione](https://supabase.com/docs/guides/api#graphql-api-overview)
  - [x] Sottoscrizioni in tempo reale. [Documentazione](https://supabase.com/docs/guides/api#realtime-api-overview)
- [x] Funzioni.
  - [x] Funzioni di database. [Documentazione](https://supabase.com/docs/guides/database/functions)
  - [x] Funzioni Edge. [Documentazione](https://supabase.com/docs/guides/functions)
- [x] Memorizzazione dei file. [Documentazione](https://supabase.com/docs/guides/storage)
- [x] Cruscotto

![Cruscotto Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## Documentazione

Per la documentazione completa, visitate [supabase.com/docs](https://supabase.com/docs)

Per vedere come contribuire, visitate [Iniziare](../DEVELOPERS.md)

## Comunità e supporto

- [Forum della comunità](https://github.com/supabase/supabase/discussions). Ideale per: aiuto nella costruzione, discussioni sulle migliori pratiche per i database.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Ideale per: bug ed errori riscontrati nell'uso di Supabase.
- [Supporto via e-mail](https://supabase.com/docs/support#business-support). Ideale per: problemi con il database o l'infrastruttura.
- [Discord](https://discord.supabase.com). Ideale per: condividere le proprie applicazioni e stare insieme alla comunità.

## Stato

- [x] Alfa: Stiamo testando Supabase con un gruppo chiuso di clienti.
- [x] Alfa pubblica: Chiunque può iscriversi all'indirizzo [supabase.com/dashboard](https://supabase.com/dashboard). Ma andateci piano, ci sono alcuni problemi.
- [x] Beta pubblica: Abbastanza stabile per la maggior parte degli usi non aziendali.
- [ ] Pubblico: Disponibilità generale [[stato](https://supabase.com/docs/guides/getting-started/features#feature-status)].

Siamo attualmente in Beta pubblica. Guardate i "rilasci" di questo repo per essere avvisati dei principali aggiornamenti.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Come funziona

Supabase è una combinazione di strumenti open source. Stiamo costruendo le funzionalità di Firebase utilizzando prodotti open source di livello enterprise. Se gli strumenti e le comunità esistono, con una licenza MIT, Apache 2 o equivalente, li utilizzeremo e li supporteremo. Se lo strumento non esiste, lo costruiamo e lo rendiamo open source noi stessi. Supabase non è una mappatura 1 a 1 di Firebase. Il nostro obiettivo è offrire agli sviluppatori un'esperienza di sviluppo simile a quella di Firebase utilizzando strumenti open source.

**Architettura**

Supabase è una [piattaforma hosted](https://supabase.com/dashboard). È possibile registrarsi e iniziare a usare Supabase senza installare nulla. È anche possibile fare [self-hosting](https://supabase.com/docs/guides/hosting/overview) e [sviluppare localmente](https://supabase.com/docs/guides/local-development).

![Architettura](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.svg)

- [PostgreSQL](https://www.postgresql.org/) è un sistema di database relazionale a oggetti con oltre 30 anni di sviluppo attivo con una solida reputazione in termini di affidabilità, robustezza e prestazioni.
- [Realtime](https://github.com/supabase/realtime) è un server Elixir che consente di ascoltare gli inserimenti, gli aggiornamenti e le cancellazioni di PostgreSQL tramite websocket. Realtime controlla la funzionalità di replica integrata di Postgres per le modifiche al database, converte le modifiche in JSON e trasmette il JSON tramite websocket ai client autorizzati.
- [PostgREST](http://postgrest.org/) è un server web che trasforma il database PostgreSQL direttamente in un'API REST.
- [pg_graphql](http://github.com/supabase/pg_graphql/) è un'estensione di PostgreSQL che espone un'API GraphQL.
- [Storage](https://github.com/supabase/storage-api) fornisce un'interfaccia RESTful per la gestione dei file memorizzati in S3, utilizzando Postgres per gestire i permessi.
- [postgres-meta](https://github.com/supabase/postgres-meta) è un'API RESTful per la gestione di Postgres, che consente di recuperare tabelle, aggiungere ruoli, eseguire query, ecc.
- [GoTrue](https://github.com/netlify/gotrue) è un'API basata su SWT per la gestione degli utenti e l'emissione di token SWT.
- [Kong](https://github.com/Kong/kong) è un gateway API cloud-native.

#### Librerie client

Il nostro approccio alle librerie client è modulare. Ogni sotto-libreria è un'implementazione indipendente per un singolo sistema esterno. Questo è uno dei modi in cui supportiamo gli strumenti esistenti.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>Lingua</th>
    <th>Cliente</th>
    <th colspan="5">Feature-Clients (in bundle con il client Supabase)</th>
  </tr>
  
  <tr>
    <th></th>
    <th>Supabase</th>
    <th><a href="https://github.com/postgrest/postgrest" target="_blank" rel="noopener noreferrer">PostgREST</a></th>
    <th><a href="https://github.com/supabase/gotrue" target="_blank" rel="noopener noreferrer">GoTrue</a></th>
    <th><a href="https://github.com/supabase/realtime" target="_blank" rel="noopener noreferrer">Realtime</a></th>
    <th><a href="https://github.com/supabase/storage-api" target="_blank" rel="noopener noreferrer">Storage</a></th>
    <th>Functions</th>
  </tr>
  <!-- TEMPLATE FOR NEW ROW -->
  <!-- START ROW
  <tr>
    <td>lang</td>
    <td><a href="https://github.com/supabase-community/supabase-lang" target="_blank" rel="noopener noreferrer">supabase-lang</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-lang" target="_blank" rel="noopener noreferrer">postgrest-lang</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-lang" target="_blank" rel="noopener noreferrer">gotrue-lang</a></td>
    <td><a href="https://github.com/supabase-community/realtime-lang" target="_blank" rel="noopener noreferrer">realtime-lang</a></td>
    <td><a href="https://github.com/supabase-community/storage-lang" target="_blank" rel="noopener noreferrer">storage-lang</a></td>
  </tr>
  END ROW -->
  
  <th colspan="7">⚡️ Ufficiale ⚡️</th>
  
  <tr>
    <td>JavaScript (TypeScript)</td>
    <td><a href="https://github.com/supabase/supabase-js" target="_blank" rel="noopener noreferrer">supabase-js</a></td>
    <td><a href="https://github.com/supabase/postgrest-js" target="_blank" rel="noopener noreferrer">postgrest-js</a></td>
    <td><a href="https://github.com/supabase/gotrue-js" target="_blank" rel="noopener noreferrer">gotrue-js</a></td>
    <td><a href="https://github.com/supabase/realtime-js" target="_blank" rel="noopener noreferrer">realtime-js</a></td>
    <td><a href="https://github.com/supabase/storage-js" target="_blank" rel="noopener noreferrer">storage-js</a></td>
    <td><a href="https://github.com/supabase/functions-js" target="_blank" rel="noopener noreferrer">functions-js</a></td>
  </tr>
    <tr>
    <td>Flutter</td>
    <td><a href="https://github.com/supabase/supabase-flutter" target="_blank" rel="noopener noreferrer">supabase-flutter</a></td>
    <td><a href="https://github.com/supabase/postgrest-dart" target="_blank" rel="noopener noreferrer">postgrest-dart</a></td>
    <td><a href="https://github.com/supabase/gotrue-dart" target="_blank" rel="noopener noreferrer">gotrue-dart</a></td>
    <td><a href="https://github.com/supabase/realtime-dart" target="_blank" rel="noopener noreferrer">realtime-dart</a></td>
    <td><a href="https://github.com/supabase/storage-dart" target="_blank" rel="noopener noreferrer">storage-dart</a></td>
    <td><a href="https://github.com/supabase/functions-dart" target="_blank" rel="noopener noreferrer">functions-dart</a></td>
  </tr>
  
  <th colspan="7">💚 Comunità 💚</th>
  
  <tr>
    <td>C#</td>
    <td><a href="https://github.com/supabase-community/supabase-csharp" target="_blank" rel="noopener noreferrer">supabase-csharp</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-csharp" target="_blank" rel="noopener noreferrer">postgrest-csharp</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-csharp" target="_blank" rel="noopener noreferrer">gotrue-csharp</a></td>
    <td><a href="https://github.com/supabase-community/realtime-csharp" target="_blank" rel="noopener noreferrer">realtime-csharp</a></td>
    <td><a href="https://github.com/supabase-community/storage-csharp" target="_blank" rel="noopener noreferrer">storage-csharp</a></td>
    <td><a href="https://github.com/supabase-community/functions-csharp" target="_blank" rel="noopener noreferrer">functions-csharp</a></td>
  </tr>
  <tr>
    <td>Go</td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/postgrest-go" target="_blank" rel="noopener noreferrer">postgrest-go</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-go" target="_blank" rel="noopener noreferrer">gotrue-go</a></td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/storage-go" target="_blank" rel="noopener noreferrer">storage-go</a></td>
    <td><a href="https://github.com/supabase-community/functions-go" target="_blank" rel="noopener noreferrer">functions-go</a></td>
  </tr>
  <tr>
    <td>Java</td>
    <td>-</td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/gotrue-java" target="_blank" rel="noopener noreferrer">gotrue-java</a></td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/storage-java" target="_blank" rel="noopener noreferrer">storage-java</a></td>
    <td>-</td>
  </tr>
  <tr>
    <td>Kotlin</td>
    <td><a href="https://github.com/supabase-community/supabase-kt" target="_blank" rel="noopener noreferrer">supabase-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Postgrest" target="_blank" rel="noopener noreferrer">postgrest-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/GoTrue" target="_blank" rel="noopener noreferrer">gotrue-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Realtime" target="_blank" rel="noopener noreferrer">realtime-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Storage" target="_blank" rel="noopener noreferrer">storage-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Functions" target="_blank" rel="noopener noreferrer">functions-kt</a></td>
  </tr>
  <tr>
    <td>Python</td>
    <td><a href="https://github.com/supabase-community/supabase-py" target="_blank" rel="noopener noreferrer">supabase-py</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-py" target="_blank" rel="noopener noreferrer">postgrest-py</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-py" target="_blank" rel="noopener noreferrer">gotrue-py</a></td>
    <td><a href="https://github.com/supabase-community/realtime-py" target="_blank" rel="noopener noreferrer">realtime-py</a></td>
    <td><a href="https://github.com/supabase-community/storage-py" target="_blank" rel="noopener noreferrer">storage-py</a></td>
    <td><a href="https://github.com/supabase-community/functions-py" target="_blank" rel="noopener noreferrer">functions-py</a></td>
  </tr>
  <tr>
    <td>Ruby</td>
    <td><a href="https://github.com/supabase-community/supabase-rb" target="_blank" rel="noopener noreferrer">supabase-rb</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-rb" target="_blank" rel="noopener noreferrer">postgrest-rb</a></td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
</table>
