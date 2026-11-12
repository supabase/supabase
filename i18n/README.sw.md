<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

# Supabase

[Supabase](https://supabase.com) ni jukwaa la maendeleo linalotumia Postgres. Tunajenga vipengele vinavyofanana na Firebase kwa kutumia zana za chanzo wazi za kiwango cha kibiashara.

- [x] Hifadhidata ya Postgres iliyohifadhiwa. [Docs](https://supabase.com/docs/guides/database)
- [x] Uthibitishaji na Uidhinishaji. [Docs](https://supabase.com/docs/guides/auth)
- [x] API zinazozalishwa kiotomatiki.
  - [x] REST. [Docs](https://supabase.com/docs/guides/api)
  - [x] GraphQL. [Docs](https://supabase.com/docs/guides/graphql)
  - [x] Usajili wa muda halisi. [Docs](https://supabase.com/docs/guides/realtime)
- [x] Kazi (Functions).
  - [x] Kazi za hifadhidata (Database Functions). [Docs](https://supabase.com/docs/guides/database/functions)
  - [x] Kazi za mipakani mwa mtandao (Edge Functions). [Docs](https://supabase.com/docs/guides/functions)
- [x] Hifadhi ya Faili. [Docs](https://supabase.com/docs/guides/storage)
- [x] Akili mnemba + Vector/Embeddings Toolkit. [Docs](https://supabase.com/docs/guides/ai)
- [x] Dashibodi

![Dashibodi ya Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Fuatilia "matoleo" ya hifadhi (repo) hii ili kupata taarifa za masasisho makuu.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Fuatilia hifadhi (repo) hii"/></kbd>

## Nyaraka

Kwa nyaraka kamili, tembelea [supabase.com/docs](https://supabase.com/docs)

Ili kuona jinsi ya kuchangia, tembelea [Kuanza](../DEVELOPERS.md)

## Jamii & Msaada 

* [Jukwaa la jamii](https://github.com/supabase/supabase/discussions). Bora kwa: msaada wa kujenga miradi na majadiliano kuhusu mbinu bora za kutumia hifadhidata.
* [GitHub Issues](https://github.com/supabase/supabase/issues). Bora kwa: kuripoti hitilafu na makosa unayokutana nayo ukitumia Supabase.
* [Msaada wa Barua pepe](https://supabase.com/docs/support#business-support). Bora kwa: matatizo yanayohusiana na hifadhidata au miundombinu yako.
* [Discord](https://discord.supabase.com). Bora kwa: kushiriki programu zako na kujumuika na jamii.

## Jinsi inavyofanya kazi

Supabase ni mchanganyiko wa zana za open source. Tunajenga vipengele vya Firebase kwa kutumia bidhaa za open source za kiwango cha biashara. Ikiwa zana na jamii tayari zipo, zenye leseni ya MIT, Apache 2, au leseni nyingine ya wazi inayolingana, tutazitumia na kuziunga mkono. Ikiwa zana haipo, tunaijenga sisi wenyewe na kuifanya kuwa open source. Supabase si ulinganifu wa moja kwa moja (1-to-1 mapping) wa Firebase. Lengo letu ni kuwapa watengenezaji uzoefu wa uendelezaji unaofanana na Firebase kwa kutumia zana za open source.

**Usanifu**

Supabase ni [jukwaa lililohifadhiwa mtandaoni](https://supabase.com/dashboard). Unaweza kujiandikisha na kuanza kutumia Supabase bila kusakinisha chochote.
Pia unaweza [kuji-host mwenyewe](https://supabase.com/docs/guides/hosting/overview) na [kuendeleza mfumo wako ndani ya mazingira ya ndani](https://supabase.com/docs/guides/local-development).

![Usanifu](../apps/docs/public/img/supabase-architecture.svg)

- [Postgres](https://www.postgresql.org/) ni mfumo wa hifadhidata wa object-relational wenye zaidi ya miaka 30 ya uendelezaji amilifu ambao umejipatia sifa kubwa ya kuaminika, vipengele thabiti, na utendaji wa hali ya juu.
- [Realtime](https://github.com/supabase/realtime) ni seva ya Elixir inayokuruhusu kusikiliza mabadiliko ya PostgreSQL (inserts, updates, na deletes) kwa kutumia websockets. Realtime huchunguza uwezo wa Postgres wa replication uliojengwa ndani kwa ajili ya mabadiliko ya hifadhidata, inabadilisha mabadiliko hayo kuwa JSON, kisha inasambaza JSON hiyo kupitia websockets kwa wateja walioidhinishwa.
- [PostgREST](http://postgrest.org/) ni seva ya wavuti inayobadilisha database yako ya PostgreSQL kuwa API ya REST.
- [GoTrue](https://github.com/supabase/gotrue) ni API ya uthibitishaji inayotumia JWT ambayo hurahisisha usajili wa watumiaji, login na usimamizi wa session.
- [Storage](https://github.com/supabase/storage-api) ni API ya REST ya kusimamia faili kwenye S3 huku Postgres ikisimamia ruhusa.
- [pg_graphql](http://github.com/supabase/pg_graphql/) ni kiongezo (extension) cha PostgreSQL kinachotoa GraphQL API.
- [postgres-meta](https://github.com/supabase/postgres-meta) ni API ya REST kwa ajili ya kusimamia Postgres yako, inayokuruhusu kuchukua majedwali (tables), kuongeza majukumu (roles), na kuendesha maswali (queries), n.k.
- [Kong](https://github.com/Kong/kong) ni lango la API (API gateway) la cloud-native.

#### Maktaba za Wateja

Mbinu yetu kwa maktaba za wateja ni ya modular. Kila maktaba ndogo (sub-library) ni utekelezaji huru kwa mfumo mmoja wa nje. Hii ni moja ya njia tunazotumia kuunga mkono zana zilizopo.

<table style="table-layout:fixed; white-space: nowrap;">
  <!-- notranslate -->
  <tr>
    <th>Language</th>
    <th>Client</th>
    <th colspan="5">Feature-Clients (bundled in Supabase client)</th>
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
  <!-- /notranslate -->
  <th colspan="7">⚡️ Official ⚡️</th>
  <!-- notranslate -->
  <tr>
    <td>JavaScript (TypeScript)</td>
    <td><a href="https://github.com/supabase/supabase-js" target="_blank" rel="noopener noreferrer">supabase-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/postgrest-js" target="_blank" rel="noopener noreferrer">postgrest-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/auth-js" target="_blank" rel="noopener noreferrer">auth-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/realtime-js" target="_blank" rel="noopener noreferrer">realtime-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/storage-js" target="_blank" rel="noopener noreferrer">storage-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/functions-js" target="_blank" rel="noopener noreferrer">functions-js</a></td>
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
  <tr>
    <td>Swift</td>
    <td><a href="https://github.com/supabase/supabase-swift" target="_blank" rel="noopener noreferrer">supabase-swift</a></td>
    <td><a href="https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST" target="_blank" rel="noopener noreferrer">postgrest-swift</a></td>
    <td><a href="https://github.com/supabase/supabase-swift/tree/main/Sources/Auth" target="_blank" rel="noopener noreferrer">auth-swift</a></td>
    <td><a href="https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime" target="_blank" rel="noopener noreferrer">realtime-swift</a></td>
    <td><a href="https://github.com/supabase/supabase-swift/tree/main/Sources/Storage" target="_blank" rel="noopener noreferrer">storage-swift</a></td>
    <td><a href="https://github.com/supabase/supabase-swift/tree/main/Sources/Functions" target="_blank" rel="noopener noreferrer">functions-swift</a></td>
  </tr>
  <tr>
    <td>Python</td>
    <td><a href="https://github.com/supabase/supabase-py" target="_blank" rel="noopener noreferrer">supabase-py</a></td>
    <td><a href="https://github.com/supabase/postgrest-py" target="_blank" rel="noopener noreferrer">postgrest-py</a></td>
    <td><a href="https://github.com/supabase/gotrue-py" target="_blank" rel="noopener noreferrer">gotrue-py</a></td>
    <td><a href="https://github.com/supabase/realtime-py" target="_blank" rel="noopener noreferrer">realtime-py</a></td>
    <td><a href="https://github.com/supabase/storage-py" target="_blank" rel="noopener noreferrer">storage-py</a></td>
    <td><a href="https://github.com/supabase/functions-py" target="_blank" rel="noopener noreferrer">functions-py</a></td>
  </tr>
  <!-- /notranslate -->
  <th colspan="7">💚 Community 💚</th>
  <!-- notranslate -->
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
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Auth" target="_blank" rel="noopener noreferrer">auth-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Realtime" target="_blank" rel="noopener noreferrer">realtime-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Storage" target="_blank" rel="noopener noreferrer">storage-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Functions" target="_blank" rel="noopener noreferrer">functions-kt</a></td>
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
  <tr>
    <td>Rust</td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/postgrest-rs" target="_blank" rel="noopener noreferrer">postgrest-rs</a></td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>Godot Engine (GDScript)</td>
    <td><a href="https://github.com/supabase-community/godot-engine.supabase" target="_blank" rel="noopener noreferrer">supabase-gdscript</a></td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <!-- /notranslate -->
</table>

<!--- Remove this list if you're translating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## Beji

![Imetengenezwa kwa kutumia Supabase](../apps/www/public/badge-made-with-supabase.svg)

```md
[![Imetengenezwa kwa kutumia Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img
    width="168"
    height="30"
    src="https://supabase.com/badge-made-with-supabase.svg"
    alt="Imetengenezwa kwa kutumia Supabase"
  />
</a>
```

![Imetengenezwa kwa kutumia Supabase (giza)](../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Imetengenezwa kwa kutumia Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img
    width="168"
    height="30"
    src="https://supabase.com/badge-made-with-supabase-dark.svg"
    alt="Imetengenezwa kwa kutumia Supabase"
  />
</a>
```

## Tafsiri

- [Orodha ya Tafsiri](/i18n/languages.md) 

---

## Wadhamini

[![Kuwa Mdhamini](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
