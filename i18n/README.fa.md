<div style="direction: rtl;" dir="rtl">

<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

<h1 dir="rtl">Supabase</h1>

<p dir="rtl">
<a href="https://supabase.com">Supabase</a> یک جایگزین اپن‌سورس برای Firebase است. ما در حال ساخت امکانات Firebase با استفاده ابزارهای اپن‌سورس و کلاس تجاری هستیم.
</p>

- [x] ‫دیتابیس Postgres میزبانی‌شده. [مستندات](https://supabase.com/docs/guides/database)
- [x] احراز هویت و کنترل سطح دسترسی. [مستندات](https://supabase.com/docs/guides/auth)
- [x] ‫ساختن خودکار APIها.
  - [x] ‫REST. [مستندات](https://supabase.com/docs/guides/api)
  - [x] ‫GraphQL. [مستندات](https://supabase.com/docs/guides/graphql)
  - [x] اتصال و ارتباط بلادرنگ. [مستندات](https://supabase.com/docs/guides/realtime)
- [x] توابع.
  - [x] توابع دیتابیس. [مستندات](https://supabase.com/docs/guides/database/functions)
  - [x] ‫توابع Edge. [مستندات](https://supabase.com/docs/guides/functions)
- [x] ذخیره‌سازی فایل. [مستندات](https://supabase.com/docs/guides/storage)
- [x] کیت‌ابزار هوش مصنوعی + بردار/تعبیه. [مستندات](https://supabase.com/docs/guides/ai)
- [x] پنل کاربری

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

<p dir="rtl">
"releases" این مخزن را دنبال کنید تا در جریان به‌روزسانی‌ها قرار بگیرید.
<p>

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="این مخزن را دنبال کنید."/></kbd>

<h2 dir="rtl">مستندات</h2>

<p dir="rtl">
برای مستندات کامل به <a href="https://supabase.com/docs">supabase.com/docs</a> مراجعه کنید.
</p>

<p dir="rtl">
برای چگونگی مشارکت کردن به <a href="./DEVELOPERS.md">Getting Started</a> مراجعه کنید.
</p>


<h2 dir="rtl">جامعه و پشتیبانی</h2>

<ul dir="rtl">
  <li>
  <a href="https://github.com/supabase/supabase/discussions">Community Forum</a>. گزینه مناسب برای راهنمایی گرفتن در مورد توسعه و روش مناسب استفاده از دیتابیس می‌باشد.
  </li>
  <li>
  <a href="https://github.com/supabase/supabase/issues">GitHub Issues</a>. گزینه مناسب برای خطاها و باگ‌هایی که در استفاده از Supabase برمی‌خوردید.
  </li>
  <li>
  <a href="https://supabase.com/docs/support#business-support">Email Support</a>. بهترین گزینه برای مشکلات مرتبط با دیتابیس و زیرساخت است.
  <li>
  <a href="https://discord.supabase.com">Discord</a>. بهترین گزینه برای به اشتراک گذاشتن برنامه‌های خود و با جامعه معاشرت کردن.

  </li>
</ul>


<h2 dir="rtl">چطور کار میکند</h2>

<p dir="rtl">
Supabase ترکیبی از ابزارهای اپن‌سورس است. ما امکانات Firebase را با استفاده از محصولات اپن‌سورس و کلاس تجاری می‌سازیم. اگر ابزار و جامعه‌ی آن وجود داشته باشد، با استفاده از گواهینامه MIT, Apache 2 یا هر گواهینامه‌ی معادلی، ما از آن ابزار استفاده و پشتیبانی می‌کنیم. اگر ابزاری وجود نداشته باشد، ما خودمان آن را می‌سازیم و اپن‌سورس می‌کنیم. Supabase یک محصول دقیقا شبیه و معادل یک‌به‌یک Firebase نیست. ما سعی داریم با استفاده از ابزارهای اپن‌سورس تجربه شبیه به Firebase به توسعه‌دهندگان ارائه دهیم.
</p>

<strong dir="rtl">معماری</strong>

<p dir="rtl">
Supabase یک <a href="https://supabase.com/dashboard">پلتفرم میزبانی‌شده</a>
 است. شما می‌توانید بدون نصب چیزی، ثبت‌نام و شروع به استفاده از Supabase کنید.
شما همچنین می‌توانید به‌صورت <a href="https://supabase.com/docs/guides/hosting/overview">خود میزبانی</a> و <a href="https://supabase.com/docs/guides/local-development">محلی توسعه دهید</a>.
</p>

![معماری](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.svg)

<ul dir="rtl">
  <li>
    <a href="https://www.postgresql.org/">Postgres</a> یک سیستم دیتابیس object-relational با بیش از ۳۰سال سابقه توسعه می‌باشد که اعتبار زیادی بابت اتکاپذیری، امکانات قوی و سرعت کسب کرده است.
  </li>
  <li>
    <a href="https://github.com/supabase/realtime">Realtime</a> یک سرور Elixir است که اجازه می‌دهد به اضافه کردن، به‌روز کردن و حذف کردن‌های PostgreSQL با استفاده از websockets گوش دهید. Supabase به عملکرد داخلی PostgreSQL برای replication گوش می‌دهد، replication byte stream را به JSON تبدیل می‌کند و JSON را از طریق websock به خارج broadcast می‌کند.
  </li>
  <li>
    <a href="http://postgrest.org/">PostgREST</a> یک وب سرور است که دیتابیس PostgreSQL را به صورت مستقیم به RESTful API تبدیل می‌کند.
  </li>
  <li>
    <a href="https://github.com/netlify/gotrue">GoTrue</a> یک API بر پایه‌ی JWT برای مدیریت کاربران و صدور توکن احراز هویت است.
  </li>
  <li>
    <a href="https://github.com/supabase/storage-api">Storage</a> یک رابط RESTful برای مدیریت فایل‌های ذخیره شده در S3 با استفاده از Postgres برای مدیریت دسترسی‌ها فراهم می‌کند.
  </li>
  <li>
    <a href="http://github.com/supabase/pg_graphql/">pg_graphql</a> یک افزونه PostgreSQL که یک GraphQL API را در معرض نمایش قرار می‌دهد
  </li>
  <li>
    <a href="https://github.com/supabase/postgres-meta">postgres-meta</a> یک RESTful API برای مدیریت Postgres، دریافت جدول‌های داده، اضافه کردن roleها و اجرای queryها و غیره می‌باشد.
  </li>
  <li>
    <a href="https://github.com/Kong/kong">Kong</a> یک gateway ابری-بومی می‌باشد.
  </li>
</ul>


<h4 dir="rtl">کتابخانه‌های کلاینت</h4>

<p dir="rtl">
کتابخانه‌ی کلاینت ما چند-تیکه است. هر زیر-کتابخانه یک پیاده‌سازی جداگانه برای یک سیستم خارجی واحد دارد. این یکی از روش‌های ما برای پشتیانی از ابزارهای موجود است.
</p>

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>زبان</th>
    <th>کلاینت</th>
    <th colspan="5">‫ویژگی‌های کلاینت (به همراه کلاینت Supabase)</th>
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
  <th colspan="7">⚡️ رسمی ⚡️</th>
  <!-- notranslate -->
  <tr>
    <td>JavaScript (TypeScript)</td>
    <td><a href="https://github.com/supabase/supabase-js" target="_blank" rel="noopener noreferrer">supabase-js</a></td>
    <td><a href="https://github.com/supabase/postgrest-js" target="_blank" rel="noopener noreferrer">postgrest-js</a></td>
    <td><a href="https://github.com/supabase/gotrue-js" target="_blank" rel="noopener noreferrer">gotrue-js</a></td>
    <td><a href="https://github.com/supabase/realtime-js" target="_blank" rel="noopener noreferrer">realtime-js</a></td>
    <td><a href="https://github.com/supabase/storage-js" target="_blank" rel="noopener noreferrer">storage-js</a></td>
    <td><a href="https://github.com/supabase/functions-js" target="_blank" rel="noopener noreferrer">functions-js</a></td>
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
  <!-- /notranslate -->
  <th colspan="7">💚 جامعه 💚</th>
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
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/GoTrue" target="_blank" rel="noopener noreferrer">gotrue-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Realtime" target="_blank" rel="noopener noreferrer">realtime-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Storage" target="_blank" rel="noopener noreferrer">storage-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Functions" target="_blank" rel="noopener noreferrer">functions-kt</a></td>
  </tr>
  <tr>
    <td>Python</td>
    <td><a href="https://github.com/supabase-community/supabase-py" target="_blank" rel="noopener noreferrer">supabase-py</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-py" target="_blank" rel="noopener noreferrer">postgrest-py</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-py" target="_blank" rel="noopener noreferrer">gotrue-py</a></td>
    <td><a href="https://github.com/supabase-community/realtime-py" target="_blank" rel="noopener noreferrer">realtime-py</a></td>
    <td><a href="https://github.com/supabase-community/storage-py" target="_blank" rel="noopener noreferrer">storage-py</a></td>
    <td><a href="https://github.com/supabase-community/functions-py" target="_blank" rel="noopener noreferrer">functions-py</a></td>
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
    <td>Swift</td>
    <td><a href="https://github.com/supabase-community/supabase-swift" target="_blank" rel="noopener noreferrer">supabase-swift</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-swift" target="_blank" rel="noopener noreferrer">postgrest-swift</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-swift" target="_blank" rel="noopener noreferrer">gotrue-swift</a></td>
    <td><a href="https://github.com/supabase-community/realtime-swift" target="_blank" rel="noopener noreferrer">realtime-swift</a></td>
    <td><a href="https://github.com/supabase-community/storage-swift" target="_blank" rel="noopener noreferrer">storage-swift</a></td>
    <td><a href="https://github.com/supabase-community/functions-swift" target="_blank" rel="noopener noreferrer">functions-swift</a></td>
  </tr>
  <tr>
    <td>Godot Engine (GDScript)</td>
    <td><a href="https://github.com/supabase-community/godot-engine.supabase" target="_blank" rel="noopener noreferrer">supabase-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-gdscript" target="_blank" rel="noopener noreferrer">postgrest-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-gdscript" target="_blank" rel="noopener noreferrer">gotrue-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/realtime-gdscript" target="_blank" rel="noopener noreferrer">realtime-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/storage-gdscript" target="_blank" rel="noopener noreferrer">storage-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/functions-gdscript" target="_blank" rel="noopener noreferrer">functions-gdscript</a></td>
  </tr>
  <!-- /notranslate -->
</table>

<h2 dir="rtl">ترجمه‌ها</h2>

<ul dir="rtl">
  <li><a href="/i18n/languages.md">لیست ترجمه‌ها</a></li>
</ul>

</div>
