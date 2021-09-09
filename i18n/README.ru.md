<p align="center">
  <img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/web/static/supabase-light-rounded-corner-background.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io) – это альтернатива Firebase с открытым исходным кодом. Мы создаем функционал Firebase, используя инструменты Enterprise уровня с открытым исходным кодом.

- [x] Облачная база данных Postgres
- [x] Подписки в режиме реального времени
- [x] Аутентификация и авторизация
- [x] Автоматически генерируемые API
- [x] Панель управления
- [x] Хранилище
- [ ] Функции (скоро)

## Документация

Для получения полной документации посетите [supabase.io/docs](https://supabase.io/docs)

## Сообщество и Поддержка

- [Форум сообщества](https://github.com/supabase/supabase/discussions). Лучше всего подходит для: помощь в создании, обсуждение лучших практик работы с базами данных.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Лучше всего подходит для: баги и ошибки, с которыми вы столкнулись при использовании Supabase.
- [Поддержка по почте](https://supabase.io/docs/support#business-support). Лучше всего подходит для: проблемы с вашей базой данных или инфраструктурой.

## Статус

- [x] Альфа: Мы тестируем Supabase с закрытым списком клиентов.
- [x] Публичная Альфа: Все желающие могут зарегистрироваться на [app.supabase.io](https://app.supabase.io). Но будьте с нами помягче, есть несколько недоработок.
- [x] Публичная бета: Достаточно стабильна для большинства случаев использования не в Enterprise.
- [ ] Публичный релиз: Готово к Production использованию.

В настоящее время мы находимся в публичной бете. Следите за разделом "Releases" в этом репозитории, чтобы получать уведомления об основных обновлениях.

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Как это работает

Supabase - это сочетание инструментов с открытым исходным кодом. Мы создаем функционал Firebase, используя инструменты Enterprise уровня с открытым исходным кодом. Если инструмент с открытой лицензией MIT, Apache 2 или аналогичной существует, мы будем использовать и поддерживать его. Если такого инструмента не существует, мы создаем и открываем его в публичный доступ сами. Supabase не является точной копией Firebase. Наша цель - предоставить разработчикам опыт работы с Firebase, используя инструменты с открытым исходным кодом.

**Текущая архитектура**

Supabase – это [облачная платформа](https://app.supabase.io). Вы можете зарегистрироваться и начать использовать Supabase, ничего не устанавливая. Мы продолжаем улучшать удобство локальной разработки - сейчас это наш основной фокус, наряду со стабильностью платформы.

![Архитектура](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/) – это объектно-реляционная система баз данных с более чем 30 годами активной разработки, которая завоевала прочную репутацию благодаря надежности, устойчивости функционала и производительности.
- [Realtime](https://github.com/supabase/realtime) – это сервер, написанный на Elixir, который позволяет cледить за вставками, обновлениями и удалениями в базе PostgreSQL с помощью веб-сокета. Supabase использует встроенный функционал репликации Postgres, преобразует поток байтов репликации в JSON, а затем передает JSON через веб-сокеты.
- [PostgREST](http://postgrest.org/) – это веб-сервер, который превращает вашу базу данных PostgreSQL в RESTful API.
- [Storage](https://github.com/supabase/storage-api) предоставляет RESTful интерфейс для управления файлами, хранящимися в S3, используя Postgres для управления разрешениями.
- [postgres-meta](https://github.com/supabase/postgres-meta) – это RESTful API для управления Postgres, позволяющий получать таблицы, добавлять роли, выполнять запросы и т.д.
- [GoTrue](https://github.com/netlify/gotrue) это API на базе SWT для управления пользователями и выпуска SWT-токенов.
- [Kong](https://github.com/Kong/kong) это облачный нативный API-шлюз.

#### Клиентские библиотеки

Наша клиентская библиотека является модульной. Каждая подбиблиотека представляет из себя отдельную реализацию для одной внешней системы. Это один из способов, с помощью которого мы поддерживаем существующие инструменты.

- **`supabase-{lang}`**: Объединяет библиотеки и расширяет их функциональность.
  - `postgrest-{lang}`: Клиентская библиотека для работы с [PostgREST](https://github.com/postgrest/postgrest)
  - `realtime-{lang}`: Клиентская библиотека для работы с [Realtime](https://github.com/supabase/realtime)
  - `gotrue-{lang}`: Клиентская библиотека для работы с [GoTrue](https://github.com/netlify/gotrue)

| Репозиторий           | Официальные                                      | От сообщества                                                                                                                                                                                                              |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust`                                                |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust`                                                |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust`                                                      |

<!--- Remove this list if you're traslating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## Переводы

- [Переводы](/i18n/languages.md) <!--- Keep only the this-->

---

## Спонсоры

[![Стать спонсором](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
