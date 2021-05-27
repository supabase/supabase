<p align="center">
    <img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/web/static/supabase-light-rounded-corner-background.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io) є альтернативою Firebase з відкритим кодом. Ми створюємо функціонал Firebase, використовуючи відкрите програмне забезпечення enterprise рівня.

- [x] Хмарна база даних Postgres
- [x] Підписка на оновлення в режимі реального часу
- [x] Аутентифікація та авторизація
- [x] Автоматично згенероване API
- [x] Панель керування
- [x] Сховище
- [ ] Функції (незабаром)

## Документація

Для отримання повної документації, перейдіть на [supabase.io/docs](https://supabase.io/docs)

## Спільнота та Підтримка

- [Форум спільноти](https://github.com/supabase/supabase/discussions). Найкраще допоможе у створенні та обговоренні кращих практик використання.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Найкраще для помилок при використанні Supabase.
- [Підтримка поштою](https://supabase.io/docs/support#business-support). Найкраще в разі проблем з вашою БД чи інфраструктурою.

## Статус

- [x] Альфа: Тестування Supabase з закритим списком користувачів.
- [x] Публічна Альфа: Кожен може зареєструватись на [app.supabase.io](https://app.supabase.io). Але будьте до нас поблажливішими, можуть зустрічатися недоліки у роботі.
- [x] Публічна Бета: Досить стабільна версія для більшості випадків, але не enterprise рівня.
- [ ] Публічний реліз: Повністю готово для використання у Production середовищі.

Наразі, ми знаходимося в публічній беті. Слідкуйте за розділом “релізи” в цьому репозитарії, щоб бути в курсі основних оновлень.

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Як це працює

Supabase – це поєднання відкритого програмного забезпечення. Ми створюємо функціонал Firebase, поєднуючи інструменти enterprise рівня з відкритим кодом. Якщо вже існує інструмент з живою спільнотою та з ліцензіями MIT, Apache 2 або аналогічними, ми будемо його використовувати та підтримувати. Якщо такого немає тоді, ми самі його створюємо. Supabase не є точною копією Firebase. Наша ціль – надати розробникам досвід Firebase, використовуючи відкрите програмне забезпечення.

**Поточна архітектура**

Supabase – це [хмарна платформа](https://app.supabase.io). Ви можете зареєструватися і почати використовувати її, нічого не встановлюючи. Ми досі продовжуємо покращувати зручність локальної розробки – це наш основний пріоритет, одночасно зі стабільністю платформи.

![Architecture](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/) – це об'єктно-реляційна система керування базами даних з більш ніж 30 роками активної розробки, котра завоювали міцну репутацію завдяки надійності та продуктивності.
- [Realtime](https://github.com/supabase/realtime) являє собою Elixir сервер який дозволяє слухати зміни в PostgreSQL за допомогою веб-сокетів. Supabase використовує вбудований функціонал реплікації Postgres, перетворюючи бінарний протокол реплікації в JSON та передаючи по веб-сокетам.
- [PostgREST](http://postgrest.org/) є веб-сервером, який перетворює вашу базу даних PostgreSQL прямо у RESTful API.
- [Storage](https://github.com/supabase/storage-api) надає RESTful інтерфейс для керування файлами, котрі знаходяться на Amazon S3, використовуючи Postgres для управління дозволами.
- [postgres-meta](https://github.com/supabase/postgres-meta) – це RESTful API для керування Postgres, котрий дозволяє отримувати таблиці, додавати ролі, виконувати запити та т.д.
- [GoTrue](https://github.com/netlify/gotrue) – це API на базі SWT для керування користувачами та видачі SWT-токенів.
- [Kong](https://github.com/Kong/kong) є нативно-хмарним API-шлюзом.

#### Клієнтські бібліотеки

Наша клієнтська бібліотека модульна. Кожна підбібліотека є окремою реалізацією для однієї зовнішньої системи. Це один зі способів, за допомогою якого ми підтримуємо наявні інструменти.

- **`supabase-{lang}`**: Об'єднує бібліотеки та збільшує функціонал.
  - `postgrest-{lang}`: Клієнтська бібліотека для роботи з [PostgREST](https://github.com/postgrest/postgrest)
  - `realtime-{lang}`: Клієнтська бібліотека для роботи з [Realtime](https://github.com/supabase/realtime)
  - `gotrue-{lang}`: Клієнтська бібліотека для роботи з [GoTrue](https://github.com/netlify/gotrue)

| Repo                  | Офіційні                                         | Спільноти                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust`                                                |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust`                                                |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust`                                                      |

<!--- Remove this list if you're traslating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## Переклади

- [Переклади](/i18n/languages.md) <!--- Keep only the this-->

---

## Спонсори

[![Стати спонсором](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
