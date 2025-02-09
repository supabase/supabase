<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) to alternatywa dla Firebase o otwartym kodzie źródłowym. Tworzymy funkcje Firebase, korzystając z narzędzi open-source klasy korporacyjnej.

**Kluczowe cechy:**

- [x] **Zarządzana baza danych Postgres:** [Dokumentacja](https://supabase.com/docs/guides/database)
- [x] **Uwierzytelnianie i autoryzacja:** [Dokumentacja](https://supabase.com/docs/guides/auth)
- [x] **Automatycznie generowane API:**
    - [x] REST: [Dokumentacja](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Dokumentacja](https://supabase.com/docs/guides/graphql)
    - [x] Subskrypcje w czasie rzeczywistym: [Dokumentacja](https://supabase.com/docs/guides/realtime)
- [x] **Funkcje:**
    - [x] Funkcje bazy danych: [Dokumentacja](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (funkcje na brzegu sieci): [Dokumentacja](https://supabase.com/docs/guides/functions)
- [x] **Przechowywanie plików:** [Dokumentacja](https://supabase.com/docs/guides/storage)
- [x] **Narzędzia AI, wektorowe i osadzania:** [Dokumentacja](https://supabase.com/docs/guides/ai)
- [x] **Panel sterowania**

![Panel sterowania Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Subskrybuj "wydania" (releases) tego repozytorium, aby otrzymywać powiadomienia o ważnych aktualizacjach. Pozwoli Ci to być na bieżąco z najnowszymi zmianami i ulepszeniami.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Obserwuj repozytorium"/></kbd>

## Dokumentacja

Pełna dokumentacja jest dostępna na stronie [supabase.com/docs](https://supabase.com/docs). Znajdziesz tam wszystkie niezbędne przewodniki i materiały referencyjne.

Jeśli chcesz wnieść swój wkład w rozwój projektu, zapoznaj się z sekcją [Rozpoczęcie pracy](./../DEVELOPERS.md).

## Społeczność i wsparcie

*   **Forum społeczności:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Idealne do uzyskiwania pomocy w programowaniu i omawiania najlepszych praktyk dotyczących baz danych.
*   **Zgłoszenia błędów (GitHub Issues):** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Użyj tego, aby zgłaszać błędy, na które natrafisz podczas korzystania z Supabase.
*   **Wsparcie e-mail:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). Najlepsza opcja w przypadku problemów z bazą danych lub infrastrukturą.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Doskonałe miejsce do dzielenia się swoimi aplikacjami i nawiązywania kontaktów ze społecznością.

## Jak to działa

Supabase łączy kilka narzędzi open-source. Tworzymy funkcje podobne do Firebase, korzystając ze sprawdzonych produktów klasy korporacyjnej. Jeśli narzędzie lub społeczność istnieje i ma licencję MIT, Apache 2 lub podobną otwartą licencję, będziemy używać i wspierać to narzędzie. Jeśli takie narzędzie nie istnieje, zbudujemy je sami i udostępnimy jego kod źródłowy. Supabase nie jest dokładną kopią Firebase. Naszym celem jest zapewnienie programistom wygody porównywalnej z Firebase, ale przy użyciu narzędzi open-source.

**Architektura**

Supabase to [zarządzana platforma](https://supabase.com/dashboard). Możesz się zarejestrować i od razu zacząć korzystać z Supabase, niczego nie instalując. Możesz także [wdrożyć własną infrastrukturę](https://supabase.com/docs/guides/hosting/overview) i [programować lokalnie](https://supabase.com/docs/guides/local-development).

![Architektura](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Obiektowo-relacyjny system baz danych z ponad 30-letnią historią aktywnego rozwoju. Jest znany ze swojej niezawodności, funkcjonalności i wydajności.
*   **Realtime:** Serwer Elixir, który umożliwia nasłuchiwanie zmian w PostgreSQL (wstawień, aktualizacji i usunięć) za pośrednictwem websockets. Realtime wykorzystuje wbudowaną funkcjonalność replikacji Postgres, konwertuje zmiany na JSON i przesyła je do autoryzowanych klientów.
*   **PostgREST:** Serwer WWW, który przekształca bazę danych PostgreSQL w interfejs API RESTful.
*   **GoTrue:** Interfejs API oparty na JWT do zarządzania użytkownikami i wydawania tokenów JWT.
*   **Storage:** Zapewnia interfejs RESTful do zarządzania plikami przechowywanymi w S3, używając Postgres do zarządzania uprawnieniami.
*   **pg_graphql:** Rozszerzenie PostgreSQL, które udostępnia interfejs API GraphQL.
*   **postgres-meta:** Interfejs API RESTful do zarządzania Postgres, umożliwiający pobieranie tabel, dodawanie ról, wykonywanie zapytań itp.
*   **Kong:** Brama API natywna dla chmury.

#### Biblioteki klienta

Używamy modułowego podejścia do bibliotek klienta. Każda podbiblioteka jest przeznaczona do pracy z jednym zewnętrznym systemem. Jest to jeden ze sposobów, w jaki wspieramy istniejące narzędzia.

(Tabela z bibliotekami klienta, jak w oryginale, ale z polskimi nazwami i wyjaśnieniami, gdzie to konieczne).

| Język                       | Klient Supabase                                                    | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Oficjalne⚡️**          |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Wspierane przez społeczność💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Odznaki (Badges)

Możesz użyć tych odznak, aby pokazać, że Twoja aplikacja została zbudowana za pomocą Supabase:

**Jasny:**

![Stworzone z Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Stworzone z Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Stworzone z Supabase" />
</a>
```

**Ciemny:**

![Stworzone z Supabase (ciemna wersja)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Stworzone z Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Stworzone z Supabase" />
</a>
```

## Tłumaczenia

[Lista tłumaczeń](./languages.md)
