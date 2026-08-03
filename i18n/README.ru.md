<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) — это платформа для разработки на Postgres. Мы воспроизводим возможности Firebase на инструментах с открытым исходным кодом корпоративного уровня.

- [x] Управляемая база данных Postgres. [Docs](https://supabase.com/docs/guides/database)
- [x] Аутентификация и авторизация. [Docs](https://supabase.com/docs/guides/auth)
- [x] Автоматически генерируемые API.
  - [x] REST. [Docs](https://supabase.com/docs/guides/api)
  - [x] GraphQL. [Docs](https://supabase.com/docs/guides/graphql)
  - [x] Подписки в реальном времени. [Docs](https://supabase.com/docs/guides/realtime)
- [x] Функции.
  - [x] Функции базы данных. [Docs](https://supabase.com/docs/guides/database/functions)
  - [x] Edge Functions [Docs](https://supabase.com/docs/guides/functions)
- [x] Файловое хранилище. [Docs](https://supabase.com/docs/guides/storage)
- [x] Набор инструментов для ИИ: векторы и эмбеддинги. [Docs](https://supabase.com/docs/guides/ai)
- [x] Дашборд

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Следите за разделом «releases» этого репозитория, чтобы получать уведомления о крупных обновлениях.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

## Документация

Полная документация доступна на [supabase.com/docs](https://supabase.com/docs)

О том, как внести свой вклад, читайте в [Getting Started](../DEVELOPERS.md)

## Сообщество и поддержка

- [Community Forum](https://github.com/supabase/supabase/discussions). Лучше всего подходит для: помощи в разработке, обсуждения практик работы с базами данных.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Лучше всего подходит для: багов и ошибок, с которыми вы столкнулись при использовании Supabase.
- [Email Support](https://supabase.com/docs/support#business-support). Лучше всего подходит для: проблем с вашей базой данных или инфраструктурой.
- [Discord](https://discord.supabase.com). Лучше всего подходит для: рассказов о ваших приложениях и общения с сообществом.

---

## Как это работает

Supabase — это набор инструментов с открытым исходным кодом. Мы воспроизводим возможности Firebase на продуктах корпоративного уровня с открытым исходным кодом. Если нужный инструмент и сообщество вокруг него уже существуют, а лицензия открытая — MIT, Apache 2 или аналогичная, — мы берём этот инструмент и поддерживаем его. Если такого инструмента нет, мы разрабатываем его сами и открываем исходный код. Supabase не копирует Firebase один в один. Наша цель — дать разработчикам привычный по Firebase опыт, но на инструментах с открытым исходным кодом.

### Архитектура

Supabase — это [облачная платформа](https://supabase.com/dashboard). Вы можете зарегистрироваться и начать работу, ничего не устанавливая.
Кроме того, платформу можно [развернуть на своих серверах](https://supabase.com/docs/guides/hosting/overview) и [разрабатывать локально](https://supabase.com/docs/guides/local-development).

![Архитектура](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.svg)

- [Postgres](https://www.postgresql.org/) — объектно-реляционная система управления базами данных, которую активно развивают уже более 30 лет; за это время она заслужила репутацию надёжной, функционально богатой и производительной.
- [Realtime](https://github.com/supabase/realtime) — сервер на Elixir, который позволяет отслеживать вставки, обновления и удаления в PostgreSQL через веб-сокеты. Realtime опрашивает встроенный механизм репликации Postgres на предмет изменений в базе данных, преобразует изменения в JSON и рассылает их по веб-сокетам авторизованным клиентам.
- [PostgREST](http://postgrest.org/) — веб-сервер, который превращает вашу базу данных PostgreSQL напрямую в RESTful API.
- [GoTrue](https://github.com/supabase/gotrue) — API аутентификации на основе JWT, который упрощает регистрацию, вход и управление сессиями пользователей в ваших приложениях.
- [Storage](https://github.com/supabase/storage-api) — RESTful API для управления файлами в S3; за права доступа при этом отвечает Postgres.
- [pg_graphql](http://github.com/supabase/pg_graphql/) — расширение PostgreSQL, которое предоставляет GraphQL API.
- [postgres-meta](https://github.com/supabase/postgres-meta) — RESTful API для управления Postgres: получать список таблиц, добавлять роли, выполнять запросы и так далее.
- [Envoy](https://github.com/envoyproxy/envoy) — производительный edge- и сервисный прокси, спроектированный для облачной среды.

#### Клиентские библиотеки

Наш подход к клиентским библиотекам — модульный. Каждая под-библиотека представляет собой самостоятельную реализацию для одной внешней системы. Это один из способов поддержки существующих инструментов.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>Язык</th>
    <th>Клиент</th>
    <th colspan="5">Feature-Clients (поставляются в составе клиента Supabase)</th>
  </tr>
  <!-- notranslate -->
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
  <th colspan="7">⚡️ Официальные ⚡️</th>
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
  <th colspan="7">💚 Сообщество 💚</th>
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

## Переводы

- [Арабский | العربية](/i18n/README.ar.md)
- [Албанский / Shqip](/i18n/README.sq.md)
- [Бенгальский / বাংলা](/i18n/README.bn.md)
- [Болгарский / Български](/i18n/README.bg.md)
- [Каталанский / Català](/i18n/README.ca.md)
- [Хорватский / Hrvatski](/i18n/README.hr.md)
- [Чешский / Čeština](/i18n/README.cs.md)
- [Датский / Dansk](/i18n/README.da.md)
- [Нидерландский / Nederlands](/i18n/README.nl.md)
- [English](https://github.com/supabase/supabase)
- [Эстонский / Eesti keel](/i18n/README.et.md)
- [Финский / Suomi](/i18n/README.fi.md)
- [Французский / Français](/i18n/README.fr.md)
- [Немецкий / Deutsch](/i18n/README.de.md)
- [Греческий / Ελληνικά](/i18n/README.el.md)
- [Гуджарати / ગુજરાતી](/i18n/README.gu.md)
- [Иврит / עברית](/i18n/README.he.md)
- [Хинди / हिंदी](/i18n/README.hi.md)
- [Венгерский / Magyar](/i18n/README.hu.md)
- [Непальский / नेपाली](/i18n/README.ne.md)
- [Индонезийский / Bahasa Indonesia](/i18n/README.id.md)
- [Итальянский / Italiano](/i18n/README.it.md)
- [Японский / 日本語](/i18n/README.jp.md)
- [Корейский / 한국어](/i18n/README.ko.md)
- [Литовский / Lietuvių](/i18n/README.lt.md)
- [Латышский / Latviski](/i18n/README.lv.md)
- [Малайский / Bahasa Malaysia](/i18n/README.ms.md)
- [Норвежский (Букмол) / Norsk (Bokmål)](/i18n/README.nb.md)
- [Персидский / فارسی](/i18n/README.fa.md)
- [Польский / Polski](/i18n/README.pl.md)
- [Португальский / Português](/i18n/README.pt.md)
- [Португальский (Бразильский) / Português Brasileiro](/i18n/README.pt-br.md)
- [Румынский / Română](/i18n/README.ro.md)
- [Русский / Русский](/i18n/README.ru.md)
- [Сербский / Srpski](/i18n/README.sr.md)
- [Сингальский / සිංහල](/i18n/README.si.md)
- [Словацкий / Slovenský](/i18n/README.sk.md)
- [Словенский / Slovenščina](/i18n/README.sl.md)
- [Испанский / Español](/i18n/README.es.md)
- [Китайский упрощённый / 简体中文](/i18n/README.zh-cn.md)
- [Шведский / Svenska](/i18n/README.sv.md)
- [Тайский / ไทย](/i18n/README.th.md)
- [Китайский традиционный / 繁體中文](/i18n/README.zh-tw.md)
- [Турецкий / Türkçe](/i18n/README.tr.md)
- [Украинский / Українська](/i18n/README.uk.md)
- [Вьетнамский / Tiếng Việt](/i18n/README.vi-vn.md)
- [Список переводов](/i18n/languages.md) <!--- Keep only this -->
