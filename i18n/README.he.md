<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) הוא אלטרנטיבה בקוד פתוח ל-Firebase. אנו בונים את התכונות של Firebase באמצעות כלים בקוד פתוח ברמה ארגונית.

**תכונות עיקריות:**

- [x] **מסד נתונים Postgres מנוהל:** [תיעוד](https://supabase.com/docs/guides/database)
- [x] **אימות והרשאה:** [תיעוד](https://supabase.com/docs/guides/auth)
- [x] **ממשקי API שנוצרים אוטומטית:**
    - [x] REST: [תיעוד](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [תיעוד](https://supabase.com/docs/guides/graphql)
    - [x] מנויים בזמן אמת: [תיעוד](https://supabase.com/docs/guides/realtime)
- [x] **פונקציות:**
    - [x] פונקציות מסד נתונים: [תיעוד](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (פונקציות בקצה הרשת): [תיעוד](https://supabase.com/docs/guides/functions)
- [x] **אחסון קבצים:** [תיעוד](https://supabase.com/docs/guides/storage)
- [x] **כלי AI, וקטורים והטמעות (Embeddings):** [תיעוד](https://supabase.com/docs/guides/ai)
- [x] **לוח מחוונים**

![לוח מחוונים של Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

הירשמו ל-"releases" של מאגר זה כדי לקבל התראות על עדכונים חשובים. זה יאפשר לכם להישאר מעודכנים בשינויים ובשיפורים האחרונים.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="עקוב אחר המאגר"/></kbd>

## תיעוד

התיעוד המלא זמין בכתובת [supabase.com/docs](https://supabase.com/docs). שם תמצאו את כל המדריכים וחומרי העזר הדרושים.

אם אתם רוצים לתרום לפיתוח הפרויקט, עיינו בסעיף [תחילת העבודה](./../DEVELOPERS.md).

## קהילה ותמיכה

*   **פורום קהילה:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). אידיאלי לקבלת עזרה בפיתוח ולדיון בשיטות עבודה מומלצות לעבודה עם מסדי נתונים.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). השתמשו כדי לדווח על באגים ושגיאות שאתם נתקלים בהם בעת השימוש ב-Supabase.
*   **תמיכה בדוא"ל:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). האפשרות הטובה ביותר לפתרון בעיות במסד הנתונים או בתשתית שלכם.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). מקום נהדר לשתף את האפליקציות שלכם ולתקשר עם הקהילה.

## עקרון הפעולה

Supabase משלב מספר כלים בקוד פתוח. אנו בונים פונקציונליות דומה ל-Firebase באמצעות מוצרים מוכחים ברמה ארגונית. אם כלי או קהילה קיימים ויש להם רישיון MIT, Apache 2 או רישיון פתוח דומה, אנו נשתמש ונתמוך בכלי זה. אם כלי כזה לא קיים, ניצור אותו בעצמנו ונפתח את קוד המקור שלו. Supabase אינו העתק מדויק של Firebase. המטרה שלנו היא לספק למפתחים נוחות דומה ל-Firebase, אך תוך שימוש בכלים בקוד פתוח.

**ארכיטקטורה**

Supabase היא [פלטפורמה מנוהלת](https://supabase.com/dashboard). ניתן להירשם ולהתחיל להשתמש ב-Supabase באופן מיידי, מבלי להתקין דבר. ניתן גם [לפרוס תשתית משלכם](https://supabase.com/docs/guides/hosting/overview) ו[לפתח באופן מקומי](https://supabase.com/docs/guides/local-development).

![ארכיטקטורה](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** מערכת ניהול מסדי נתונים יחסיים-אובייקטים עם יותר מ-30 שנות היסטוריה של פיתוח פעיל. היא ידועה באמינות, בפונקציונליות ובביצועים שלה.
*   **Realtime:** שרת Elixir המאפשר לכם להאזין לשינויים ב-PostgreSQL (הוספות, עדכונים ומחיקות) דרך WebSockets. Realtime משתמש בפונקציונליות השכפול המובנית של Postgres, ממיר שינויים ל-JSON ומשדר אותם ללקוחות מורשים.
*   **PostgREST:** שרת אינטרנט שהופך את מסד הנתונים PostgreSQL שלכם ל-API RESTful.
*   **GoTrue:** ממשק API מבוסס JWT לניהול משתמשים והנפקת אסימוני JWT.
*   **Storage:** מספק ממשק RESTful לניהול קבצים המאוחסנים ב-S3, תוך שימוש ב-Postgres לניהול הרשאות.
*   **pg_graphql:** הרחבת PostgreSQL המספקת API GraphQL.
*   **postgres-meta:** ממשק API RESTful לניהול Postgres שלכם, המאפשר לכם לאחזר טבלאות, להוסיף תפקידים, לבצע שאילתות וכו'.
*   **Kong:** שער API מקורי בענן.

#### ספריות לקוח

אנו משתמשים בגישה מודולרית לספריות לקוח. כל ספריית משנה מיועדת לעבודה עם מערכת חיצונית אחת. זוהי אחת הדרכים לתמוך בכלים קיימים.

(טבלה עם ספריות לקוח, כמו במקור, אך עם שמות בעברית והסברים, במידת הצורך).

| שפה                       | לקוח Supabase                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️רשמיות⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚נתמכות על ידי הקהילה💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## תגים (Badges)

ניתן להשתמש בתגים אלה כדי להראות שהאפליקציה שלכם נבנתה באמצעות Supabase:

**בהיר:**

![נבנה עם Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![נבנה עם Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="נבנה עם Supabase" />
</a>
```

**כהה:**

![נבנה עם Supabase (גרסה כהה)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![נבנה עם Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="נבנה עם Supabase" />
</a>
```

## תרגומים

[רשימת תרגומים](./languages.md)
