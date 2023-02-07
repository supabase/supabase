<p align="center">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--light.svg#gh-light-mode-only">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--dark.svg#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) е проект с отворен код, който предлага алтернатива на Firebase. Ние изграждаме функциите на Firebase като използваме инструменти базирани на отворен код за корпоративния клас.

- [x] Хоствана Postgres база данни. [Docs](https://supabase.com/docs/guides/database)
- [x] Автентикация и оторизация [Docs](https://supabase.com/docs/guides/auth)
- [x] Автоматично генерирани APIs (Приложно-програмен интерфейс).
  - [x] REST. [Docs](https://supabase.com/docs/guides/api#rest-api)
  - [x] Абониране в реално време. [Docs](https://supabase.com/docs/guides/api#realtime-api)
  - [x] GraphQL (Beta). [Docs](https://supabase.com/docs/guides/api#graphql-api)
- [x] Функции.
  - [x] Функции за база данни. [Docs](https://supabase.com/docs/guides/database/functions)
  - [x] Edge Functions [Docs](https://supabase.com/docs/guides/functions)
- [x] Съхранение на файлове. [Docs](https://supabase.com/docs/guides/storage)
- [x] Интерфейсно табло

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## Документация

За пълната документация посетете [supabase.com/docs](https://supabase.com/docs)

За да видите как да допринасяте, посетете [Getting Started](../DEVELOPERS.md)

## Общност & поддръжка

- [Community Forum](https://github.com/supabase/supabase/discussions). Най-добър за: помощ при изграждането, дискусии за най-добри практики за бази данни, и прочие въпроси.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Най-добър за: бъгове и грешки, които срещате при използване на Supabase.
- [Email Support](https://supabase.com/docs/support#business-support). Най-добър за: проблеми с базата ви данни или инфраструктурата.
- [Discord](https://discord.supabase.com). Най-добър за: споделяне на вашите приложения и общуване с общността.

## Статус

- [x] Затворена Alpha версия: Тестваме Supabase с избран набор от клиенти.
- [x] Публична Alpha версия: Всеки може да се регистрира на [app.supabase.com](https://app.supabase.com). Но молим по-леко, тъй като все още съществуват някои проблеми.
- [x] Публична Beta версия: Достатъчно стабилна за повечето некорпоративни случаи на употреба (non-enterprise).
- [ ] Публична версия: Готова версия за публично използване.

В момента сме в публична Beta версия. Вижте "releases" на това "repository", за да бъдете уведомени за всички нови версии.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Как работи

Supabase е комбинация на инструменти с отворен код. Ние изграждаме функционалността на Firebase, като използваме продукти от корпоративен клас с отворен код. Ако инструментите и общността съществуват с лиценз на MIT, Apache 2 или подобен отворен лиценз (open license), ще го използваме и поддържаме. Ако инструментът не съществува, ние ще го създадем и публикуваме с отворен код. Supabase не е еквивалентен едно-към-едно с Firebase. Нашата цел е да предоставим на програмистите съвместимост с Firebase, използвайки инструменти с отворен код.

**Архитектурата**

Supabase е [хоствана платформа](https://app.supabase.com). Можете да се регистрирате и да използвате Supabase без да инсталирате нищо.
Можете също да използвате [самостоятелен хостинг](https://supabase.com/docs/guides/hosting/overview) и да го [използвате локално](https://supabase.com/docs/guides/local-development).

![Архитектура](https://user-images.githubusercontent.com/70828596/187547862-ffa9d058-0c3a-4851-a3e7-92ccfca4b596.png)

- [PostgreSQL](https://www.postgresql.org/) е обектно-релативна база данни с повече от 30 години активно развитие, което е създало висока репутация за съвместимост, функционалност и производителност.
- [Realtime](https://github.com/supabase/realtime) е сървър на Elixir, който позволява да проследявате всички въвеждания, актуализации и изтривания на данни в PostgreSQL чрез уеб-сокети (websockets). Realtime проверява въвеждането на данни на PostgreSQL и конвертира в JSON записи, като после ги праща по уеб-сокети на оторизирани клиенти.
- [PostgREST](http://postgrest.org/) е уеб сървър, който превръща вашата PostgreSQL база данни директно в RESTful API.
- [Storage](https://github.com/supabase/storage-api) предлага RESTful интерфейс за управление на файловете, съхранени в S3, като използва Postgres за управление на правата.
- [postgres-meta](https://github.com/supabase/postgres-meta) е RESTful API за управление на Postgres, което ви позволява да извлечете таблици, да добавите роли, да изпълните запитвания, и други.
- [GoTrue](https://github.com/netlify/gotrue) е SWT базиран API за управление на потребители и издаване на SWT токени.
- [Kong](https://github.com/Kong/kong) e нативен за облака API Gateway.

#### Клиентски библиотеки

Нашият подход към клиентските библиотеки е модуларен. Всяка подбиблиотека е отделен проект за единична външна система. Това е един от нашите начини за поддръжка на съществуващите инструменти.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>Езици</th>
    <th>Клиенти</th>
    <th colspan="4">Функционални клиенти (включени в Supabase клиента)</th>
  </tr>
  <tr>
    <th></th>
    <th>Supabase</th>
    <th><a href="https://github.com/postgrest/postgrest" target="_blank" rel="noopener noreferrer">PostgREST</a></th>
    <th><a href="https://github.com/supabase/gotrue" target="_blank" rel="noopener noreferrer">GoTrue</a></th>
    <th><a href="https://github.com/supabase/realtime" target="_blank" rel="noopener noreferrer">Realtime</a></th>
    <th><a href="https://github.com/supabase/storage-api" target="_blank" rel="noopener noreferrer">Storage</a></th>
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
  <th colspan="6">⚡️ Официални ⚡️</th>
  <tr>
    <td>JavaScript (TypeScript)</td>
    <td><a href="https://github.com/supabase/supabase-js" target="_blank" rel="noopener noreferrer">supabase-js</a></td>
    <td><a href="https://github.com/supabase/postgrest-js" target="_blank" rel="noopener noreferrer">postgrest-js</a></td>
    <td><a href="https://github.com/supabase/gotrue-js" target="_blank" rel="noopener noreferrer">gotrue-js</a></td>
    <td><a href="https://github.com/supabase/realtime-js" target="_blank" rel="noopener noreferrer">realtime-js</a></td>
    <td><a href="https://github.com/supabase/storage-js" target="_blank" rel="noopener noreferrer">storage-js</a></td>
  </tr>
  <th colspan="6">💚 Изградени от общността 💚</th>
  <tr>
    <td>C#</td>
    <td><a href="https://github.com/supabase-community/supabase-csharp" target="_blank" rel="noopener noreferrer">supabase-csharp</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-csharp" target="_blank" rel="noopener noreferrer">postgrest-csharp</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-csharp" target="_blank" rel="noopener noreferrer">gotrue-csharp</a></td>
    <td><a href="https://github.com/supabase-community/realtime-csharp" target="_blank" rel="noopener noreferrer">realtime-csharp</a></td>
    <td><a href="https://github.com/supabase-community/storage-csharp" target="_blank" rel="noopener noreferrer">storage-csharp</a></td>
  </tr>
  <tr>
    <td>Flutter</td>
    <td><a href="https://github.com/supabase/supabase-flutter" target="_blank" rel="noopener noreferrer">supabase-dart</a></td>
    <td><a href="https://github.com/supabase/postgrest-dart" target="_blank" rel="noopener noreferrer">postgrest-dart</a></td>
    <td><a href="https://github.com/supabase/gotrue-dart" target="_blank" rel="noopener noreferrer">gotrue-dart</a></td>
    <td><a href="https://github.com/supabase/realtime-dart" target="_blank" rel="noopener noreferrer">realtime-dart</a></td>
    <td><a href="https://github.com/supabase/storage-dart" target="_blank" rel="noopener noreferrer">storage-dart</a></td>
  </tr>
  <tr>
    <td>Go</td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/postgrest-go" target="_blank" rel="noopener noreferrer">postgrest-go</a></td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>Java</td>
    <td>-</td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/gotrue-java" target="_blank" rel="noopener noreferrer">gotrue-java</a></td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>Kotlin</td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/postgrest-kt" target="_blank" rel="noopener noreferrer">postgrest-kt</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-kt" target="_blank" rel="noopener noreferrer">gotrue-kt</a></td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>Python</td>
    <td><a href="https://github.com/supabase-community/supabase-py" target="_blank" rel="noopener noreferrer">supabase-py</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-py" target="_blank" rel="noopener noreferrer">postgrest-py</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-py" target="_blank" rel="noopener noreferrer">gotrue-py</a></td>
    <td><a href="https://github.com/supabase-community/realtime-py" target="_blank" rel="noopener noreferrer">realtime-py</a></td>
    <td>-</td>
  </tr>
  <tr>
    <td>Ruby</td>
    <td><a href="https://github.com/supabase-community/supabase-rb" target="_blank" rel="noopener noreferrer">supabase-rb</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-rb" target="_blank" rel="noopener noreferrer">postgrest-rb</a></td>
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
  </tr>
  <tr>
    <td>Swift</td>
    <td><a href="https://github.com/supabase-community/supabase-swift" target="_blank" rel="noopener noreferrer">supabase-swift</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-swift" target="_blank" rel="noopener noreferrer">postgrest-swift</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-swift" target="_blank" rel="noopener noreferrer">gotrue-swift</a></td>
    <td><a href="https://github.com/supabase-community/realtime-swift" target="_blank" rel="noopener noreferrer">realtime-swift</a></td>
    <td><a href="https://github.com/supabase-community/storage-swift" target="_blank" rel="noopener noreferrer">storage-swift</a></td>
  </tr>
</table>

<!--- Remove this list if you're translating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## Преводи

- [Списък с преводи](/i18n/languages.md)

---

## Спонсори

[![New Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
