<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) هي بديل مفتوح المصدر لـ Firebase.  نحن نبني ميزات Firebase باستخدام أدوات مفتوحة المصدر على مستوى المؤسسات.

**الميزات الرئيسية:**

- [x] **قاعدة بيانات Postgres مُدارة:** [التوثيق](https://supabase.com/docs/guides/database)
- [x] **المصادقة والتفويض:** [التوثيق](https://supabase.com/docs/guides/auth)
- [x] **واجهات برمجة التطبيقات (APIs) التي يتم إنشاؤها تلقائيًا:**
    - [x] REST: [التوثيق](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [التوثيق](https://supabase.com/docs/guides/graphql)
    - [x] الاشتراكات في الوقت الفعلي: [التوثيق](https://supabase.com/docs/guides/realtime)
- [x] **الوظائف:**
    - [x]  وظائف قاعدة البيانات: [التوثيق](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (وظائف على حافة الشبكة): [التوثيق](https://supabase.com/docs/guides/functions)
- [x] **تخزين الملفات:** [التوثيق](https://supabase.com/docs/guides/storage)
- [x] **أدوات الذكاء الاصطناعي, المتجهات, والتضمينات (Vectors & Embeddings):** [التوثيق](https://supabase.com/docs/guides/ai)
- [x] **لوحة التحكم**

![لوحة تحكم Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

اشترك في "الإصدارات" (releases) لهذا المستودع لتلقي إشعارات بالتحديثات الرئيسية.  سيسمح لك هذا بالبقاء على اطلاع بأحدث التغييرات والتحسينات.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="مراقبة المستودع"/></kbd>

## التوثيق

التوثيق الكامل متاح على [supabase.com/docs](https://supabase.com/docs).  ستجد هناك جميع الأدلة والمواد المرجعية اللازمة.

إذا كنت ترغب في المساهمة في تطوير المشروع، فراجع قسم [البدء](./../DEVELOPERS.md).

## المجتمع والدعم

*   **منتدى المجتمع:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions).  مثالي للحصول على المساعدة في التطوير ومناقشة أفضل ممارسات العمل مع قواعد البيانات.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues).  استخدمه للإبلاغ عن الأخطاء والمشاكل التي تواجهها عند استخدام Supabase.
*   **دعم البريد الإلكتروني:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support).  أفضل خيار لحل المشكلات المتعلقة بقاعدة البيانات أو البنية التحتية.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com).  مكان رائع لمشاركة تطبيقاتك والتواصل مع المجتمع.

## مبدأ العمل

تجمع Supabase بين العديد من الأدوات مفتوحة المصدر.  نحن نبني ميزات مماثلة لـ Firebase باستخدام منتجات مجربة على مستوى المؤسسات.  إذا كانت الأداة أو المجتمع موجودًا ولديه ترخيص MIT أو Apache 2 أو ترخيص مفتوح مماثل، فسنستخدم هذه الأداة وندعمها.  إذا لم تكن هذه الأداة موجودة، فسننشئها بأنفسنا ونفتح مصدرها.  Supabase ليست نسخة طبق الأصل من Firebase.  هدفنا هو تزويد المطورين بتجربة مريحة مماثلة لـ Firebase، ولكن باستخدام أدوات مفتوحة المصدر.

**البنية**

Supabase هي [منصة مُدارة](https://supabase.com/dashboard). يمكنك التسجيل والبدء في استخدام Supabase على الفور، دون الحاجة إلى تثبيت أي شيء.  يمكنك أيضًا [نشر بنيتك التحتية الخاصة](https://supabase.com/docs/guides/hosting/overview) و[التطوير محليًا](https://supabase.com/docs/guides/local-development).

![البنية](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** نظام إدارة قواعد بيانات علائقية كائنية (Object-Relational Database) مع أكثر من 30 عامًا من التطوير النشط.  وهي معروفة بموثوقيتها ووظائفها وأدائها.
*   **Realtime:** خادم Elixir الذي يسمح لك بالاستماع إلى تغييرات PostgreSQL (الإدراجات والتحديثات والحذف) عبر WebSockets.  يستخدم Realtime وظيفة النسخ المتماثل المضمنة في Postgres، ويحول التغييرات إلى JSON، وينقلها إلى العملاء المصرح لهم.
*   **PostgREST:** خادم ويب يحول قاعدة بيانات PostgreSQL الخاصة بك إلى واجهة برمجة تطبيقات RESTful.
*   **GoTrue:** واجهة برمجة تطبيقات قائمة على JWT لإدارة المستخدمين وإصدار رموز JWT.
*   **Storage:** يوفر واجهة RESTful لإدارة الملفات المخزنة في S3، باستخدام Postgres لإدارة الأذونات.
*   **pg_graphql:** امتداد PostgreSQL يوفر واجهة برمجة تطبيقات GraphQL.
*   **postgres-meta:** واجهة برمجة تطبيقات RESTful لإدارة Postgres الخاص بك، مما يسمح لك بالحصول على الجداول وإضافة الأدوار وتنفيذ الاستعلامات وما إلى ذلك.
*   **Kong:** بوابة واجهة برمجة تطبيقات سحابية (Cloud API gateway).

#### مكتبات العميل (Client Libraries)

نحن نستخدم نهجًا معياريًا لمكتبات العميل.  تم تصميم كل مكتبة فرعية للعمل مع نظام خارجي واحد.  هذه إحدى طرق دعم الأدوات الحالية.

(جدول بمكتبات العميل، كما في الأصل، ولكن بأسماء عربية وتوضيحات عند الضرورة).

| اللغة                       | العميل Supabase                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️رسمية⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚مدعومة من المجتمع💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## الشارات (Badges)

يمكنك استخدام هذه الشارات لإظهار أن تطبيقك قد تم إنشاؤه باستخدام Supabase:

**فاتح:**

![تم إنشاؤه باستخدام Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![تم إنشاؤه باستخدام Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="تم إنشاؤه باستخدام Supabase" />
</a>
```

**داكن:**

![تم إنشاؤه باستخدام Supabase (إصدار داكن)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![تم إنشاؤه باستخدام Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="تم إنشاؤه باستخدام Supabase" />
</a>
```

## الترجمات

[قائمة الترجمات](./languages.md)
