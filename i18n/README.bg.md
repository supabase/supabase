<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) е алтернатива с отворен код на Firebase. Ние изграждаме функционалността на Firebase, използвайки инструменти от корпоративен клас с отворен код.

**Основни функции:**

- [x] **Управлявана база данни Postgres:** [Документация](https://supabase.com/docs/guides/database)
- [x] **Удостоверяване и оторизация:** [Документация](https://supabase.com/docs/guides/auth)
- [x] **Автоматично генерирани API:**
    - [x] REST: [Документация](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Документация](https://supabase.com/docs/guides/graphql)
    - [x] Абонаменти в реално време: [Документация](https://supabase.com/docs/guides/realtime)
- [x] **Функции:**
    - [x] Функции на базата данни: [Документация](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (функции в периферията на мрежата): [Документация](https://supabase.com/docs/guides/functions)
- [x] **Съхранение на файлове:** [Документация](https://supabase.com/docs/guides/storage)
- [x] **AI, вектори и вграждания (embeddings) инструменти:** [Документация](https://supabase.com/docs/guides/ai)
- [x] **Табло за управление**

![Табло за управление на Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Абонирайте се за "releases" на това хранилище, за да получавате известия за важни актуализации. Това ще ви позволи да сте в крак с най-новите промени и подобрения.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Следене на хранилището"/></kbd>

## Документация

Пълната документация е достъпна на [supabase.com/docs](https://supabase.com/docs). Там ще намерите всички необходими ръководства и справочни материали.

Ако искате да допринесете за развитието на проекта, вижте раздела [Първи стъпки](./../DEVELOPERS.md).

## Общност и поддръжка

*   **Форум на общността:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Идеален за получаване на помощ при разработката и обсъждане на най-добрите практики за работа с бази данни.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Използвайте за докладване на грешки и проблеми, с които се сблъсквате при използването на Supabase.
*   **Имейл поддръжка:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). Най-добрият вариант за решаване на проблеми с вашата база данни или инфраструктура.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Чудесно място за споделяне на вашите приложения и общуване с общността.

## Принцип на работа

Supabase обединява няколко инструмента с отворен код. Ние изграждаме функции, подобни на Firebase, използвайки доказани продукти от корпоративен клас. Ако инструмент или общност съществува и има лиценз MIT, Apache 2 или подобен отворен лиценз, ние ще използваме и поддържаме този инструмент. Ако такъв инструмент не съществува, ние ще го създадем сами и ще отворим кода му. Supabase не е точно копие на Firebase. Нашата цел е да предоставим на разработчиците удобство, сравнимо с Firebase, но с използване на инструменти с отворен код.

**Архитектура**

Supabase е [управлявана платформа](https://supabase.com/dashboard). Можете да се регистрирате и веднага да започнете да използвате Supabase, без да инсталирате нищо. Можете също така да [разгърнете собствена инфраструктура](https://supabase.com/docs/guides/hosting/overview) и да [разработвате локално](https://supabase.com/docs/guides/local-development).

![Архитектура](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Обектно-релационна система за управление на бази данни с повече от 30-годишна история на активна разработка. Тя е известна със своята надеждност, функционалност и производителност.
*   **Realtime:** Сървър на Elixir, който ви позволява да слушате за промени в PostgreSQL (вмъквания, актуализации и изтривания) чрез уеб сокети. Realtime използва вградената функционалност за репликация на Postgres, преобразува промените в JSON и ги предава на оторизирани клиенти.
*   **PostgREST:** Уеб сървър, който превръща вашата база данни PostgreSQL в RESTful API.
*   **GoTrue:** API, базиран на JWT, за управление на потребители и издаване на JWT токени.
*   **Storage:** Предоставя RESTful интерфейс за управление на файлове, съхранявани в S3, използвайки Postgres за управление на разрешенията.
*   **pg_graphql:** Разширение за PostgreSQL, което предоставя GraphQL API.
*   **postgres-meta:** RESTful API за управление на вашия Postgres, позволяващ ви да получавате таблици, да добавяте роли, да изпълнявате заявки и т.н.
*   **Kong:** Облачен API шлюз.

#### Клиентски библиотеки

Използваме модулен подход към клиентските библиотеки. Всяка под-библиотека е предназначена за работа с една външна система. Това е един от начините за поддръжка на съществуващите инструменти.

(Таблица с клиентски библиотеки, както в оригинала, но с български имена и пояснения, където е необходимо).

| Език                       | Клиент Supabase                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Официални⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Поддържани от общността💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Значки (Badges)

Можете да използвате тези значки, за да покажете, че вашето приложение е създадено с помощта на Supabase:

**Светъл:**

![Създадено със Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Създадено със Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Създадено със Supabase" />
</a>
```

**Тъмен:**

![Създадено със Supabase (тъмна версия)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Създадено със Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Създадено със Supabase" />
</a>
```

## Преводи

[Списък с преводи](./languages.md)
