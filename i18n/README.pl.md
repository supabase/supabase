<p align="center">
  <img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/web/static/supabase-light-rounded-corner-background.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io) jest open source alternatywą dla Firebase. Budujemy funkcjonalności Firebase używając narzędzi open source klasy korporacyjnej.

- [x] Hostowana baza danych Postgres
- [x] Subskrypcje w czasie rzeczywistym
- [x] Uwierzytelnienie i autoryzacja
- [x] Automatycznie generowany interfejs API
- [x] Panel zarządzania
- [x] Przechowywanie danych
- [ ] Funkcje (dostępne w krótce)

## Dokumentacja

Po pełną dokumentację, odwiedź [supabase.io/docs](https://supabase.io/docs)

## Społeczność & Wsparcie

- [Forum społeczności](https://github.com/supabase/supabase/discussions). Najlepsze dla: pomoc przy budowaniu, dyskusje na temat najlepszych praktyk dotyczących bazy danych.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Najlepsze dla: bugi i błędy napotkane podczas używania Supabase.
- [Wsparcie email](https://supabase.io/docs/support#business-support). Najlepsze dla: problemy z bazą danych i infrastrukturą.

## Status

- [x] Alpha: Testujemy Supabase z zamkniętą listą klientów.
- [x] Publiczna Alpha: Każdy może zapisać się do testów na [app.supabase.io](https://app.supabase.io). Nie bądźcie dla nas zbyt surowi, jest kilka problemów.
- [x] Publiczna Beta: Wystarczająco stabilna do użytku poza przedsiębiorstwami.
- [ ] Publiczna: Gotowa wersja do użytku produkcyjnego.

Jesteśmy aktualnie w fazie Publicznej Bety. Subskrybuj powiadomienia "releases" tego repozytorium aby dostawać powiadomienia o kluczowych aktualizacjach.

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Jak to działa

Supabase jest połączeniem narzędzi open source. Budujemy funkcjonalności Firebase używając narzędzi open source klasy korporacyjnej. Jeśli istnieją narzędzia i społeczność, z licencją MIT, Apache 2, lub porównywalnie otwartą licencją, użyjemy i będziemy wspierać to narzędzie. Jeśli narzędzie nie istnieje, zbudujemy je i udostępnimy je open source. Supabase nie jest 1 do 1 kopią Firebase. Naszym celem jest udostępnienie deweloperom środowiska programistycznego podobnego do Firebase, korzystając z narzędzie open source.

**Aktualna architektura**

Supabase jest [hostowaną platformą](https://app.supabase.io). Możesz się zarejestrować i zacząć używać Supabase bez potrzeby instalacji dodatkowych narzędzi. Cały czas tworzymy lokalne środowisko deweloperskie - jest to teraz nasz priorytet, razem ze stabilnością platformy.

![Architektura](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/) jest obiektowo-relacyjnym system baz danych z ponad 30 letnim aktywnym rozwojem dzięki któremu zyskał dobrą reputacje dzięki niezawodności, solidności funkcji i wydajności.
- [Realtime](https://github.com/supabase/realtime) jest serwerem Elixir który umożliwia nasłuchiwanie na wsady PostgreSQL, aktualizacje, i usunięcia używając websocketów. Supabase nasłuchuje na budowane w Postgres' funkcje replikacji, konwertuje replikacje transmisji bitów do struktury JSON przez websockety.
- [PostgREST](http://postgrest.org/) jest serwerem webowym który przekształca twoją bazę danych PostgreSQL bezpośrednio w interfejs REST API.
- [Storage](https://github.com/supabase/storage-api) dostarcza interfejs REST do zarządzania plikami trzymanymi na serwerze S3, używając Postgres do zarządzania uprawnieniami.
- [postgres-meta](https://github.com/supabase/postgres-meta) jest interfejsem REST API do zarządzania Postgres, pozwala na pobieranie tabel, dodawanie ról, i uruchamianiem zapytań, itd.
- [GoTrue](https://github.com/netlify/gotrue) jest to podstawowy interfejs API SWT do zarządzanie użytkownikami i przypisywaniu SWT tokenów.
- [Kong](https://github.com/Kong/kong) jest natywną-chmurową bramą interfejsów API.

#### Biblioteki klienckie

Nasza biblioteka kliencka jest modularna. Każda pod biblioteka jest osobną implementacją dla pojedynczego zewnętrznego systemu. To jedna z możliwości dlaczego wspieramy istniejące narzędzia.

- **`supabase-{język}`**: Łączy biblioteki i dodaje wzbogacenia.
  - `postgrest-{język}`: Biblioteka kliencka do działania z [PostgREST](https://github.com/postgrest/postgrest)
  - `realtime-{język}`: Biblioteka kliencka do działania z [Realtime](https://github.com/supabase/realtime)
  - `gotrue-{język}`: Biblioteka kliencka do działania z [GoTrue](https://github.com/netlify/gotrue)

| Repozytorium           | Oficjalne                                        | Społeczność                                                                                                                                                                                                                |
| ---------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{język}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust`                                                |
| `postgrest-{język}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) |
| `realtime-{język}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust`                                                |
| `gotrue-{język}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust`                                                      |

## Tłumaczenia

- [Tłumaczenia](/i18n/languages.md) <!--- Keep only the this-->

---

## Sponsorzy

[![Nowy sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
