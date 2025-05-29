<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) — це open-source альтернатива Firebase. Ми створюємо функціональні можливості Firebase, використовуючи інструменти корпоративного рівня з відкритим вихідним кодом.

**Ключові можливості:**

- [x] **Керована база даних Postgres:** [Документація](https://supabase.com/docs/guides/database)
- [x] **Аутентифікація та авторизація:** [Документація](https://supabase.com/docs/guides/auth)
- [x] **Автоматично генеровані API:**
    - [x] REST: [Документація](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Документація](https://supabase.com/docs/guides/graphql)
    - [x] Підписки в реальному часі: [Документація](https://supabase.com/docs/guides/realtime)
- [x] **Функції:**
    - [x] Функції бази даних: [Документація](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (функції на кордоні мережі): [Документація](https://supabase.com/docs/guides/functions)
- [x] **Сховище файлів:** [Документація](https://supabase.com/docs/guides/storage)
- [x] **Інструменти для роботи зі ШІ, векторами та вбудовуваннями (embeddings):** [Документація](https://supabase.com/docs/guides/ai)
- [x] **Панель управління**

![Панель управління Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Підпишіться на "releases" цього репозиторію, щоб отримувати сповіщення про важливі оновлення. Це дозволить вам бути в курсі останніх змін та покращень.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Слідкувати за репозиторієм"/></kbd>

## Документація

Повна документація доступна на [supabase.com/docs](https://supabase.com/docs). Там ви знайдете всі необхідні керівництва та довідкові матеріали.

Якщо ви хочете зробити свій внесок у розвиток проєкту, ознайомтеся з розділом [Початок роботи](./../DEVELOPERS.md).

## Спільнота та підтримка

*   **Форум спільноти:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Ідеально підходить для отримання допомоги в розробці та обговорення найкращих практик роботи з базами даних.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Використовуйте для повідомлення про помилки та баги, з якими ви стикаєтеся при використанні Supabase.
*   **Підтримка електронною поштою:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). Найкращий варіант для вирішення проблем з вашою базою даних або інфраструктурою.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Відмінне місце для обміну вашими додатками та спілкування зі спільнотою.

## Принцип роботи

Supabase об'єднує декілька інструментів з відкритим вихідним кодом. Ми створюємо функції, аналогічні Firebase, використовуючи перевірені продукти корпоративного рівня. Якщо інструмент або спільнота існує і має ліцензію MIT, Apache 2 або аналогічну відкриту ліцензію, ми будемо використовувати і підтримувати цей інструмент. Якщо такого інструменту немає, ми створимо його самі і відкриємо вихідний код. Supabase — це не точна копія Firebase. Наша мета – надати розробникам зручність, порівнянну з Firebase, але з використанням інструментів з відкритим вихідним кодом.

**Архітектура**

Supabase – це [керована платформа](https://supabase.com/dashboard). Ви можете зареєструватися і відразу почати використовувати Supabase, нічого не встановлюючи. Ви також можете [розгорнути власну інфраструктуру](https://supabase.com/docs/guides/hosting/overview) і [вести розробку локально](https://supabase.com/docs/guides/local-development).

![Архітектура](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Об'єктно-реляційна система баз даних з більш ніж 30-річною історією активної розробки. Вона відома своєю надійністю, функціональністю та продуктивністю.
*   **Realtime:** Сервер на Elixir, який дозволяє прослуховувати зміни в PostgreSQL (вставки, оновлення та видалення) через веб-сокети. Realtime використовує вбудовану функціональність реплікації Postgres, перетворює зміни в JSON і передає їх авторизованим клієнтам.
*   **PostgREST:** Веб-сервер, який перетворює вашу базу даних PostgreSQL в RESTful API.
*   **GoTrue:** API на основі JWT для управління користувачами та видачі токенів JWT.
*   **Storage:** Надає RESTful інтерфейс для управління файлами, що зберігаються в S3, використовуючи Postgres для управління дозволами.
*   **pg_graphql:** Розширення PostgreSQL, яке надає GraphQL API.
*   **postgres-meta:** RESTful API для управління вашим Postgres, що дозволяє отримувати таблиці, додавати ролі, виконувати запити і т.д.
*   **Kong:** Хмарний API-шлюз.

#### Клієнтські бібліотеки

Ми використовуємо модульний підхід до клієнтських бібліотек. Кожна під-бібліотека призначена для роботи з однією зовнішньою системою. Це один із способів підтримки існуючих інструментів.

(Таблиця з клієнтськими бібліотеками, як в оригіналі, але з українськими назвами та поясненнями, де необхідно).

| Мова                       | Клієнт Supabase                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Офіційні⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Підтримувані спільнотою💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Значки (Badges)

Ви можете використовувати ці значки, щоб показати, що ваш додаток створено за допомогою Supabase:

**Світлий:**

![Зроблено з Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Зроблено з Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Зроблено з Supabase" />
</a>
```

**Темний:**

![Зроблено з Supabase (темна версія)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Зроблено з Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Зроблено з Supabase" />
</a>
```

## Переклади

[Список перекладів](./languages.md)
