<div style="direction: rtl;" dir="rtl">

<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

‫[Supabase](https://supabase.com) یک جایگزین اپن‌سورس برای Firebase است. ما در حال ساخت امکانات Firebase با استفاده ابزارهای اپن‌سورس و کلاس تجاری هستیم.

- [x] ‫دیتابیس Postgres میزبانی‌شده
- [x] اتصال و ارتباط بلادرنگ
- [x] احراز هویت و کنترل سطح دسترسی
- [x] ‫ساختن خودکار APIها
- [x] پنل کاربری
- [x] فضای ذخیره‌سازی
- [x] توابع

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## مستندات

برای مستندات کامل به‫ [supabase.com/docs](https://supabase.com/docs) مراجعه کنید.

## جامعه و پشتیبانی

- ‫[Community Forum](https://github.com/supabase/supabase/discussions). گزینه مناسب برای راهنمایی گرفتن در مورد توسعه و روش مناسب استفاده از دیتابیس می‌باشد.
- ‫[GitHub Issues](https://github.com/supabase/supabase/issues). گزینه مناسب برای خطاها و باگ‌هایی که در استفاده از Supabase برمی‌خوردید.
- ‫[Email Support](https://supabase.com/docs/support#business-support). بهترین گزینه برای مشکلات مرتبط با دیتابیس و زیرساخت است.

## وضعیت

- [x] ‫آلفا: در حال تست Supabase با گروه محدود از کاربران هستیم.
- [x] ‫آلفای عمومی: همه می‌تواند برای استفاده از طریق [supabase.com/dashboard](https://supabase.com/dashboard) ثبت‌نام کنند. اما سخت نگیرید، ممکن است مشکلات معدودی وجود داشته باشد.
- [x] بتای عمومی: قابل اتکا برای اکثر استفاده‌های غیر-تجاری می‌باشد.
- [ ] عمومی: آماده برای استفاده تجاری.

در حال حاضر در مرحله بتای عمومی هستیم‫. "releases" این مخزن را دنبال کنید تا در جریان به‌روزسانی‌ها قرار بگیرید.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="این مخزن را دنبال کنید."/></kbd>

---

## چطور کار میکند

‫Supabase ترکیبی از ابزارهای اپن‌سورس است. ما امکانات Firebase را با استفاده از محصولات اپن‌سورس و کلاس تجاری می‌سازیم. اگر ابزار و جامعه‌ی آن وجود داشته باشد، با استفاده از گواهینامه MIT, Apache 2 یا هر گواهینامه‌ی معادلی، ما از آن ابزار استفاده و پشتیبانی می‌کنیم. اگر ابزاری وجود نداشته باشد، ما خودمان آن را می‌سازیم و اپن‌سورس می‌کنیم. Supabase یک محصول دقیقا شبیه و معادل یک‌به‌یک Firebase نیست. ما سعی داریم با استفاده از ابزارهای اپن‌سورس تجربه شبیه به Firebase به توسعه‌دهندگان ارائه دهیم.

**معماری فعلی**

‫Supabase یک [پلتفرم میزبانی‌شده](https://supabase.com/dashboard) است. شما می‌توانید بدون نصب چیزی، ثبت‌نام و شروع به استفاده از Supabase کنید. ما هنوز در حال ساختن تجربه‌ی توسعه local هستیم - این تمرکز اصلی فعلی ما علاوه بر اتکاپذیری است.

![معماری](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.svg)

- ‫[PostgreSQL](https://www.postgresql.org/) یک سیستم دیتابیس object-relational با بیش از ۳۰سال سابقه توسعه می‌باشد که اعتبار زیادی بابت اتکاپذیری، امکانات قوی و سرعت کسب کرده است.
- ‫[Realtime](https://github.com/supabase/realtime) یک سرور Elixir است که اجازه می‌دهد به اضافه کردن، به‌روز کردن و حذف کردن‌های PostgreSQL با استفاده از websockets گوش دهید. Supabase به عملکرد داخلی PostgreSQL برای replication گوش می‌دهد، replication byte stream را به JSON تبدیل می‌کند و JSON را از طریق websock به خارج broadcast می‌کند.
- ‫[PostgREST](http://postgrest.org/) یک وب سرور است که دیتابیس PostgreSQL را به صورت مستقیم به RESTful API تبدیل می‌کند.
- ‫[Storage](https://github.com/supabase/storage-api) یک رابط RESTful برای مدیریت فایل‌های ذخیره شده در S3 با استفاده از Postgres برای مدیریت دسترسی‌ها فراهم می‌کند.
- ‫[postgres-meta](https://github.com/supabase/postgres-meta) یک RESTful API برای مدیریت Postgres، دریافت جدول‌های داده، اضافه کردن roleها و اجرای queryها و غیره می‌باشد.
- ‫[GoTrue](https://github.com/netlify/gotrue) یک API بر پایه‌ی SWT برای مدیریت کاربران و صدور توکن احراز هویت است.
- ‫[Kong](https://github.com/Kong/kong) یک gateway ابری-بومی می‌باشد.

#### کتابخانه‌های کلاینت

کتابخانه‌ی کلاینت ما چند-تیکه است. هر زیر-کتابخانه یک پیاده‌سازی جداگانه برای یک سیستم خارجی واحد دارد. این یکی از روش‌های ما برای پشتیانی از ابزارهای موجود است.

- **‫`supabase-{lang}`**: کتابخانه‌ها را ترکیب می‌کند و تکمیل‌تر خواهد بود.
  - ‫`postgrest-{lang}`: کتابخانه کلاینت برای کارکردن با [PostgREST](https://github.com/postgrest/postgrest)
  - ‫`realtime-{lang}`: کتابخانه کلاینت برای کارکردن با [Realtime](https://github.com/supabase/realtime)
  - ‫`gotrue-{lang}`: کتابخانه کلاینت برای کارکردن با [GoTrue](https://github.com/netlify/gotrue)

| مخزن                  | رسمی                                             | جامعه                                                                                                                                                                                                                      |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Flutter`](https://github.com/supabase/supabase-flutter) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust`                                          |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust`                                                |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust`                                                      |

## ترجمه‌ها

- [لیست ترجمه‌ها](/i18n/languages.md)

---

## اسپانسرها

[![New Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)

</p>

</div>
