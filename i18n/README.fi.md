<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) on avoimen lähdekoodin vaihtoehto Firebase:lle. Rakennamme Firebase:n ominaisuuksia käyttäen yritystason avoimen lähdekoodin työkaluja.

**Tärkeimmät ominaisuudet:**

- [x] **Hallittu Postgres-tietokanta:** [Dokumentaatio](https://supabase.com/docs/guides/database)
- [x] **Todennus ja valtuutus:** [Dokumentaatio](https://supabase.com/docs/guides/auth)
- [x] **Automaattisesti luodut API:t:**
    - [x] REST: [Dokumentaatio](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Dokumentaatio](https://supabase.com/docs/guides/graphql)
    - [x] Reaaliaikaiset tilaukset: [Dokumentaatio](https://supabase.com/docs/guides/realtime)
- [x] **Funktiot:**
    - [x] Tietokantafunktiot: [Dokumentaatio](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (reunatoiminnot): [Dokumentaatio](https://supabase.com/docs/guides/functions)
- [x] **Tiedostojen tallennustila:** [Dokumentaatio](https://supabase.com/docs/guides/storage)
- [x] **Tekoäly-, vektori- ja upotus-(embeddings) työkalut:** [Dokumentaatio](https://supabase.com/docs/guides/ai)
- [x] **Hallintapaneeli**

![Supabasen hallintapaneeli](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Tilaa tämän arkiston "julkaisut" (releases), jotta saat ilmoituksia tärkeistä päivityksistä. Näin pysyt ajan tasalla viimeisimmistä muutoksista ja parannuksista.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Seuraa arkistoa"/></kbd>

## Dokumentaatio

Täydellinen dokumentaatio on saatavilla osoitteessa [supabase.com/docs](https://supabase.com/docs). Sieltä löydät kaikki tarvittavat oppaat ja viitemateriaalit.

Jos haluat osallistua projektin kehittämiseen, katso [Aloittaminen](./../DEVELOPERS.md) -osio.

## Yhteisö ja tuki

*   **Yhteisöfoorumi:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Ihanteellinen paikka saada apua kehitykseen ja keskustella parhaista käytännöistä tietokantojen kanssa työskentelyssä.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Käytä ilmoittaaksesi virheistä ja ongelmista, joita kohtaat Supabasea käyttäessäsi.
*   **Sähköpostituki:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). Paras vaihtoehto tietokantaan tai infrastruktuuriin liittyvien ongelmien ratkaisemiseen.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Loistava paikka jakaa sovelluksiasi ja kommunikoida yhteisön kanssa.

## Toimintaperiaate

Supabase yhdistää useita avoimen lähdekoodin työkaluja. Rakennamme Firebase:n kaltaisia ominaisuuksia käyttäen hyväksi havaittuja yritystason tuotteita. Jos työkalu tai yhteisö on olemassa ja sillä on MIT-, Apache 2- tai vastaava avoin lisenssi, käytämme ja tuemme tätä työkalua. Jos tällaista työkalua ei ole, luomme sen itse ja avaamme sen lähdekoodin. Supabase ei ole tarkka kopio Firebase:stä. Tavoitteenamme on tarjota kehittäjille Firebase:n kaltainen mukavuus, mutta avoimen lähdekoodin työkaluilla.

**Arkkitehtuuri**

Supabase on [hallittu alusta](https://supabase.com/dashboard). Voit rekisteröityä ja aloittaa Supabasen käytön heti ilman asennuksia. Voit myös [käyttöönottaa oman infrastruktuurisi](https://supabase.com/docs/guides/hosting/overview) ja [kehittää paikallisesti](https://supabase.com/docs/guides/local-development).

![Arkkitehtuuri](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Objekti-relaatiotietokantajärjestelmä, jolla on yli 30 vuoden aktiivinen kehityshistoria. Se on tunnettu luotettavuudestaan, toiminnallisuudestaan ja suorituskyvystään.
*   **Realtime:** Elixir-palvelin, jonka avulla voit kuunnella PostgreSQL:n muutoksia (lisäyksiä, päivityksiä ja poistoja) websocketien kautta. Realtime käyttää Postgresin sisäänrakennettua replikointitoimintoa, muuntaa muutokset JSON-muotoon ja välittää ne valtuutetuille asiakkaille.
*   **PostgREST:** Web-palvelin, joka muuttaa PostgreSQL-tietokantasi RESTful-rajapinnaksi.
*   **GoTrue:** JWT-pohjainen rajapinta käyttäjien hallintaan ja JWT-tunnisteiden myöntämiseen.
*   **Storage:** Tarjoaa RESTful-rajapinnan S3:een tallennettujen tiedostojen hallintaan käyttäen Postgresia käyttöoikeuksien hallintaan.
*   **pg_graphql:** PostgreSQL-laajennus, joka tarjoaa GraphQL-rajapinnan.
*   **postgres-meta:** RESTful-rajapinta Postgresin hallintaan, jonka avulla voit hakea taulukoita, lisätä rooleja, suorittaa kyselyitä jne.
*   **Kong:** Pilvipohjainen API-yhdyskäytävä.

#### Asiakaskirjastot

Käytämme modulaarista lähestymistapaa asiakaskirjastoihin. Jokainen alikirjasto on suunniteltu toimimaan yhden ulkoisen järjestelmän kanssa. Tämä on yksi tapa tukea olemassa olevia työkaluja.

(Taulukko asiakaskirjastoista, kuten alkuperäisessä, mutta suomenkielisillä nimillä ja selityksillä tarvittaessa).

| Kieli                       | Supabase-asiakaskirjasto                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Viralliset⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Yhteisön ylläpitämät💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Merkit (Badges)

Voit käyttää näitä merkkejä osoittaaksesi, että sovelluksesi on rakennettu Supabasella:

**Vaalea:**

![Tehty Supabasella](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Tehty Supabasella](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Tehty Supabasella" />
</a>
```

**Tumma:**

![Tehty Supabasella (tumma versio)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Tehty Supabasella](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Tehty Supabasella" />
</a>
```

## Käännökset

[Käännösten luettelo](./languages.md)
