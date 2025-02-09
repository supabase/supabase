<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) je open-source alternativa k Firebase. Budujeme funkce Firebase pomocí open-source nástrojů podnikové úrovně.

**Klíčové vlastnosti:**

- [x] **Spravovaná databáze Postgres:** [Dokumentace](https://supabase.com/docs/guides/database)
- [x] **Ověřování a autorizace:** [Dokumentace](https://supabase.com/docs/guides/auth)
- [x] **Automaticky generovaná API:**
    - [x] REST: [Dokumentace](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Dokumentace](https://supabase.com/docs/guides/graphql)
    - [x] Předplatné v reálném čase: [Dokumentace](https://supabase.com/docs/guides/realtime)
- [x] **Funkce:**
    - [x] Funkce databáze: [Dokumentace](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (funkce na okraji sítě): [Dokumentace](https://supabase.com/docs/guides/functions)
- [x] **Úložiště souborů:** [Dokumentace](https://supabase.com/docs/guides/storage)
- [x] **Nástroje pro AI, vektory a vkládání (embeddings):** [Dokumentace](https://supabase.com/docs/guides/ai)
- [x] **Řídicí panel**

![Řídicí panel Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Přihlaste se k odběru "releases" tohoto repozitáře, abyste dostávali upozornění na důležité aktualizace. To vám umožní být informováni o nejnovějších změnách a vylepšeních.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Sledovat repozitář"/></kbd>

## Dokumentace

Úplná dokumentace je k dispozici na [supabase.com/docs](https://supabase.com/docs). Tam najdete všechny potřebné průvodce a referenční materiály.

Pokud chcete přispět k vývoji projektu, podívejte se na sekci [Začínáme](./../DEVELOPERS.md).

## Komunita a podpora

*   **Komunitní fórum:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Ideální pro získání pomoci s vývojem a diskuzi o osvědčených postupech práce s databázemi.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Použijte pro hlášení chyb a problémů, se kterými se setkáváte při používání Supabase.
*   **E-mailová podpora:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). Nejlepší volba pro řešení problémů s vaší databází nebo infrastrukturou.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Skvělé místo pro sdílení vašich aplikací a komunikaci s komunitou.

## Princip fungování

Supabase kombinuje několik open-source nástrojů. Budujeme funkce podobné Firebase pomocí prověřených produktů podnikové úrovně. Pokud nástroj nebo komunita existuje a má licenci MIT, Apache 2 nebo podobnou otevřenou licenci, budeme tento nástroj používat a podporovat. Pokud takový nástroj neexistuje, vytvoříme ho sami a otevřeme jeho zdrojový kód. Supabase není přesnou kopií Firebase. Naším cílem je poskytnout vývojářům pohodlí srovnatelné s Firebase, ale s využitím open-source nástrojů.

**Architektura**

Supabase je [spravovaná platforma](https://supabase.com/dashboard). Můžete se zaregistrovat a okamžitě začít používat Supabase, aniž byste cokoli instalovali. Můžete také [nasadit vlastní infrastrukturu](https://supabase.com/docs/guides/hosting/overview) a [vyvíjet lokálně](https://supabase.com/docs/guides/local-development).

![Architektura](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Objektově-relační databázový systém s více než 30letou historií aktivního vývoje. Je známý svou spolehlivostí, funkčností a výkonem.
*   **Realtime:** Server v Elixiru, který vám umožňuje poslouchat změny v PostgreSQL (vkládání, aktualizace a mazání) prostřednictvím websocketů. Realtime využívá vestavěnou funkci replikace Postgres, převádí změny na JSON a přenáší je autorizovaným klientům.
*   **PostgREST:** Webový server, který promění vaši databázi PostgreSQL na RESTful API.
*   **GoTrue:** API založené na JWT pro správu uživatelů a vydávání JWT tokenů.
*   **Storage:** Poskytuje RESTful rozhraní pro správu souborů uložených v S3, přičemž pro správu oprávnění používá Postgres.
*   **pg_graphql:** Rozšíření PostgreSQL, které poskytuje GraphQL API.
*   **postgres-meta:** RESTful API pro správu vašeho Postgres, umožňující získávat tabulky, přidávat role, spouštět dotazy atd.
*   **Kong:** Cloudová API brána.

#### Klientské knihovny

Používáme modulární přístup ke klientským knihovnám. Každá pod-knihovna je určena pro práci s jedním externím systémem. To je jeden ze způsobů podpory existujících nástrojů.

(Tabulka s klientskými knihovnami, jako v originále, ale s českými názvy a vysvětlivkami, kde je to potřeba).

| Jazyk                       | Klient Supabase                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Oficiální⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Podporované komunitou💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Odznaky (Badges)

Můžete použít tyto odznaky, abyste ukázali, že vaše aplikace je vytvořena pomocí Supabase:

**Světlý:**

![Vytvořeno se Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Vytvořeno se Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Vytvořeno se Supabase" />
</a>
```

**Tmavý:**

![Vytvořeno se Supabase (tmavá verze)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Vytvořeno se Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Vytvořeno se Supabase" />
</a>
```

## Překlady

[Seznam překladů](./languages.md)
