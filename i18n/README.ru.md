<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) — это альтернатива Firebase с открытым исходным кодом. Мы создаем аналогичные Firebase возможности, используя инструменты корпоративного уровня с открытым кодом.

**Ключевые возможности:**

- [x] **Управляемая база данных Postgres:** [Документация](https://supabase.com/docs/guides/database)
- [x] **Аутентификация и авторизация:** [Документация](https://supabase.com/docs/guides/auth)
- [x] **Автоматически генерируемые API:**
    - [x] REST: [Документация](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Документация](https://supabase.com/docs/guides/graphql)
    - [x] Подписки в реальном времени: [Документация](https://supabase.com/docs/guides/realtime)
- [x] **Функции:**
    - [x] Функции базы данных: [Документация](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (функции на границе сети): [Документация](https://supabase.com/docs/guides/functions)
- [x] **Хранилище файлов:** [Документация](https://supabase.com/docs/guides/storage)
- [x] **Инструменты для работы с ИИ, векторами и эмбеддингами:** [Документация](https://supabase.com/docs/guides/ai)
- [x] **Панель управления**

![Панель управления Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Подпишитесь на "releases" этого репозитория, чтобы получать уведомления о важных обновлениях.  Это позволит вам быть в курсе последних изменений и улучшений.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Следить за репозиторием"/></kbd>

## Документация

Полная документация доступна на [supabase.com/docs](https://supabase.com/docs).  Там вы найдете все необходимые руководства и справочные материалы.

Если вы хотите внести свой вклад в развитие проекта, ознакомьтесь с разделом [Начало работы](./../DEVELOPERS.md).

## Сообщество и поддержка

*   **Форум сообщества:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions).  Идеально подходит для получения помощи в разработке и обсуждения лучших практик работы с базами данных.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues).  Используйте для сообщения о багах и ошибках, с которыми вы сталкиваетесь при использовании Supabase.
*   **Поддержка по email:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support).  Лучший вариант для решения проблем с вашей базой данных или инфраструктурой.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com).  Отличное место для обмена вашими приложениями и общения с сообществом.

## Принцип работы

Supabase объединяет несколько инструментов с открытым исходным кодом.  Мы создаем функции, аналогичные Firebase, используя проверенные продукты корпоративного уровня.  Если инструмент или сообщество существует и имеет лицензию MIT, Apache 2 или аналогичную открытую лицензию, мы будем использовать и поддерживать этот инструмент. Если такого инструмента нет, мы создадим его сами и откроем исходный код. Supabase — это не точная копия Firebase. Наша цель – предоставить разработчикам удобство, сравнимое с Firebase, но с использованием инструментов с открытым исходным кодом.

**Архитектура**

Supabase – это [управляемая платформа](https://supabase.com/dashboard). Вы можете зарегистрироваться и сразу начать использовать Supabase, ничего не устанавливая.  Вы также можете [развернуть собственную инфраструктуру](https://supabase.com/docs/guides/hosting/overview) и [вести разработку локально](https://supabase.com/docs/guides/local-development).

![Архитектура](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Объектно-реляционная система баз данных с более чем 30-летней историей активной разработки. Она известна своей надежностью, функциональностью и производительностью.
*   **Realtime:** Сервер на Elixir, который позволяет прослушивать изменения в PostgreSQL (вставки, обновления и удаления) через веб-сокеты. Realtime использует встроенную функциональность репликации Postgres, преобразует изменения в JSON и передает их авторизованным клиентам.
*   **PostgREST:** Веб-сервер, который превращает вашу базу данных PostgreSQL в RESTful API.
*   **GoTrue:** API на основе JWT для управления пользователями и выдачи токенов JWT.
*   **Storage:** Предоставляет RESTful интерфейс для управления файлами, хранящимися в S3, используя Postgres для управления разрешениями.
*   **pg_graphql:** Расширение PostgreSQL, которое предоставляет GraphQL API.
*   **postgres-meta:** RESTful API для управления вашим Postgres, позволяющий получать таблицы, добавлять роли, выполнять запросы и т.д.
*   **Kong:** Облачный API-шлюз.

#### Клиентские библиотеки

Мы используем модульный подход к клиентским библиотекам. Каждая под-библиотека предназначена для работы с одной внешней системой. Это один из способов поддержки существующих инструментов.

(Таблица с клиентскими библиотеками, как в оригинале, но с русскими названиями и пояснениями, где необходимо).

| Язык                       | Клиент Supabase                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Официальные⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Поддерживаемые сообществом💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Значки (Badges)

Вы можете использовать эти значки, чтобы показать, что ваше приложение создано с помощью Supabase:

**Светлый:**

![Сделано с Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Сделано с Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Сделано с Supabase" />
</a>
```

**Темный:**

![Сделано с Supabase (тёмная версия)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Сделано с Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Сделано с Supabase" />
</a>
```
## Переводы

[Список переводов](./languages.md)