<p align="center">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--light.svg#gh-light-mode-only">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--dark.svg#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) este o alternativă open source la Firebase. Construim trăsăturile Firebase folosind instrumente open source de calitate.

- [x] Bază de date Postgres găzduită
- [x] Abonamente Realtime
- [x] Autentificare și autorizare
- [x] API-uri generate automat
- [x] Panou de control
- [x] Depozitare
- [x] Funcții

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## Documentație

Pentru documentația completă vizitați [supabase.com/docs](https://supabase.com/docs)

## Comunitate și suport

- [Forumul comunității](https://github.com/supabase/supabase/discussions). Cel mai bun pentru: ajutor în construire, discuție despre cele mai bune practici pentru bazele de date.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Cel mai bun pentru: bug-uri și erori întâlnite în timpul utilizării Supabase.
- [Suport prin email](https://supabase.com/docs/support#business-support). Cel mai bun pentru: probleme cu baza dumneavostră de date sau de infrastructură.

## Status

- [x] Alpha: Testăm Supabase cu o listă restrânsă de clienți
- [x] Alpha public: Oricine poate să se înscrie la [app.supabase.com](https://app.supabase.com). Fiți îngăduitori cu noi, există câteva imperfecțiuni.
- [x] Beta public: Suficient de stabil pentru majoritatea proiectelor mici sau medii.
- [ ] Public: Pregătit pentru producție

La ora actuală ne aflăm în Beta public. Urmăriți „lansările” acestui repository pentru a putea fi notificat la actualizările majore.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Urmăriți acest repository"/></kbd>

---

## Cum funcționează

Supabase este o combinație de unelte open source. Construim trăsăturile din Firebase folosind produse open source de calitate. Dacă aceste instrumente și comunități există cu o licență MIT, Apache 2 sau un echivalent open source, vom folosi și susține acel instrument. Dacă instrumentul nu există, îl construim și îl facem open source noi înșine. Supabase nu este o clonă Firebase. Obiectivul nostru este de a oferi o experiență similară cu cea din Firebase folosind unelte open source.

**Arhitectura actuală**

Supabase este o [platformă găzduită](https://app.supabase.com). Puteți să vă înscrieți și să începeți să folosiți Supabase fără a instala orice. Experiența de developare locală încă mai este în dezvoltare, acesta fiind lucrul la care ne concentrăm cel mai mult, împreună cu stabilitatea platformei.

![Arhitectură](https://user-images.githubusercontent.com/70828596/187547862-ffa9d058-0c3a-4851-a3e7-92ccfca4b596.png)

- [PostgreSQL](https://www.postgresql.org/) este o bază de date de obiecte relațională cu peste 30 de ani de dezvoltare și o reputație pentru fiabilitate și performanță.
- [Realtime](https://github.com/supabase/realtime) este un server Elixir care permite ascultarea inserțiilor, actualizărilor și ștergerilor bazei de date PostgreSQL prin intermediul websocket-urilor. Supabase ascultă funcționalitatea de replicare integrată PostgreSQL, convertește fluxul de octeți al replicării în JSON, apoi emite JSON-ul prin intermediul websocket-urilor.
- [PostgREST](http://postgrest.org/) este un server web care transformă baza de date PostgreSQL direct într-un API de tip REST.
- [Storage](https://github.com/supabase/storage-api) oferă o interfață REST pentru administrarea fișierelor stocate în S3, folosind PostgreSQL pentru a administra permisiuni.
- [postgres-meta](https://github.com/supabase/postgres-meta) este un API de tip REST pentru administrarea bazei dumneavoastră de date PostgreSQL, permițând obținerea tabelurilor, adăugarea rolurilor, executarea query-urilor etc.
- [GoTrue](https://github.com/netlify/gotrue) este un API bazat pe SWT pentru administrarea utilizatorilor și eliberarea tokenurilor SWT.
- [Kong](https://github.com/Kong/kong) este un gateway pentru API-uri, nativ cloud-ului.

#### Librării pentru clienți

Librăria noastră pentru clienți este modulară. Fiecare sub-librărie este o implementare independentă pentru un singur sistem extern. Acesta este unul dintre modurile în care sprijinim uneltele existente.

- **`supabase-{limbă}`**: Combină librării și adaugă atribute.
  - `postgrest-{limbă}`: Librărie pentru clienți pentru a lucra cu [PostgREST](https://github.com/postgrest/postgrest)
  - `realtime-{limbă}`: Librărie pentru clienți pentru a lucra cu [Realtime](https://github.com/supabase/realtime)
  - `gotrue-{limbă}`: Librărie pentru clienți pentru a lucra cu [GoTrue](https://github.com/netlify/gotrue)

| Repo                  | Oficial                                          | Comunitate                                                                                                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Flutter`](https://github.com/supabase/supabase-flutter) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust` \| [`Ruby`](https://github.com/supabase/supabase-rb)                                           |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) \| [`Ruby`](https://github.com/supabase/postgrest-rb) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust` \| `Ruby`                                                                                            |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust` \| `Ruby`                                                                                                  |

<!--- Remove this list if you're traslating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## Traduceri

- [Listă de traduceri](/i18n/languages.md) <!--- Keep only this -->

---

## Sponsori

[![Devino un sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
