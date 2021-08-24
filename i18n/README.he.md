<div style="direction: rtl;">

<p align="center">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/web/static/supabase-light-rounded-corner-background.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io) Supabase הוא חלופה בקוד פתוח של Firebase. אנו מפתחים את התכונות של Firebase באמצעות כלי קוד פתוח ברמת גימור ארגונית.

- [x] מאגר נתונים מסוג פוסטגרס (Postgres)
- [x] מנויים בזמן אמת
- [x] מנגנון אימות והרשאות
- [x] ממשקי API אוטומטיים
- [x] דשבורד
- [x] אחסון
- [ ] פונקציות (בקרוב)

## תיעוד

לתיעוד המלא, בקר\י ב[supabase.io/docs](https://supabase.io/docs)

## קהילה & תמיכה

- [פורום הקהילה](https://github.com/supabase/supabase/discussions). נועד עבור: עזרה בבנייה, דיון אודות שיטות עבודה מומלצות מול מאגר הנתונים.
- [GitHub Issues](https://github.com/supabase/supabase/issues). נועד עבור: דיווח על באגים ושגיאות בזמן שימוש בSupabase
- [אימייל תמיכה](https://supabase.io/docs/support#business-support). נועד עבור: תקלות במסד הנתונים או בתשתית שלך.

## סטטוס

- [x] אלפא: בוחנים את המערכת מול מאגר סגור של לקוחות
- [x] אלפא פומבית: כל אחד יכול להרשם ב[app.supabase.io](https://app.supabase.io). אבל תהיו עדינים, יהיו בעיות.
- [x] בטא פומבית: יציב מספיק לרוב הלקוחות הלא-ארגוניים.
- [ ] יציב: מתאים לשימוש הכלל.

אנחנו כרגע בשלב "בטא פומבית". עקבו אחר השחוררים שלנו בGithub בכדי לקבל התראות על שחרורים נוספים.

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## איך זה עובד

Supabase הוא שילוב של כלי קוד פתוח. אנו בונים את התכונות של Firebase באמצעות מוצרי קוד פתוח ארגוניים. אם הכלים והקהילות קיימים, עם רישיון MIT, Apache 2 או רישיון קוד פתוח דומה, נשתמש ונתמוך בכלי זה. אם הכלי לא קיים, אנו בונים אותו בקוד פתוח בעצמנו. Supabase אינו העתק 1 ל -1 של Firebase. מטרתנו היא לתת למפתחים חוויית פיתוח דומה לFirebase באמצעות כלים בקוד פתוח.

**ארכיטקטורה נוכחית**

Supabase היא [תשתית ענן](https://app.supabase.io)
. את\ה יכול\ה להירשם ולהתחיל להשתמש ב- Supabase מבלי להתקין שום דבר. אנו עדיין עובדים על לייצר את חוויית הפיתוח המקומית - בזה אנחנו מתמקדים, יחד עם יציבות המערכת.

![Architecture](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [פוסטגרס (PostgreSQL)](https://www.postgresql.org/) זהו מסד נתונים רלציוני עם למעלה מ -30 שנות פיתוח פעיל שזכתה למוניטין של אמינות, עמידות וביצועים.
- [Realtime](https://github.com/supabase/realtime) הוא שרת Elixir המאפשר להאזין לתוספות, עדכונים ומחיקות ב-PostgreSQL באמצעות websockets. Supabase מאזין לפונקציונליות ההעתק המובנית של Postgres, ממיר את המידע ל- JSON ואז משדר את ה- JSON מעל websockets.
- [PostgREST](http://postgrest.org/) הוא שרת שהופך את מסד הנתונים PostgreSQL שלך ישירות ל- RESTful API.
- [אחסון](https://github.com/supabase/storage-api) מספק ממשק RESTful לניהול קבצים המאוחסנים ב- S3, ניהול ההרשאות מתצבע באמצעות Postgres.
- [postgres-meta](https://github.com/supabase/postgres-meta) הוא ממשק RESTful API לניהול הPostgres שלך, המאפשר לך לגשת לטבלאות, לערוך הרשאות להריץ שאילתות וכו '.
- [GoTrue](https://github.com/netlify/gotrue) הוא ממשק API מבוסס SWT לניהול משתמשים ויצירת SWT Tokens.
- [Kong](https://github.com/Kong/kong) הוא API gateway מבוסס ענן.

#### ספריות לקוח (Client)

ספריות צד הלקוח שלנו הן מודולריות. כל ספרייה מממשת בעצמה תקשורת למערכת חיצונית אחת. זו אחת הדרכים בהן אנו תומכים בכלים קיימים.

- **`supabase-{lang}`**: משלב ספריות ומעשיר אותן.
  - `postgrest-{lang}`: ספריה צד לקוח לעבודה מול [PostgREST](https://github.com/postgrest/postgrest)
  - `realtime-{lang}`: ספריה צד לקוח לעבודה מול [Realtime](https://github.com/supabase/realtime)
  - `gotrue-{lang}`: ספריה צד לקוח לעבודה מול [GoTrue](https://github.com/netlify/gotrue)

| Repo                  | תמיכה רשמית                                      | תמיכת הקהילה                                                                                                                                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust` \| [`Ruby`](https://github.com/supabase/supabase-rb) \| `Go`                                                                                             |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) \| [`Ruby`](https://github.com/supabase/postgrest-rb) \| [`Go`](https://github.com/supabase/postgrest-go) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust` \| `Ruby` \| `Go`                                                                                                                                        |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust` \| `Ruby` \| `Go`                                                                                                                                              |

<!--- Remove this list if you're traslating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## תרגומים

- [List of translations](/i18n/languages.md) <!--- Keep only this -->

---

## תומכים

[![New Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)

</div>
