<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

# سوپابیس

[سوپابیس](https://supabase.com) ایک اوپن سورس فائربیس کا متبادل ہے۔ ہم انٹرپرائز گریڈ اوپن سورس ٹولز کا استعمال کرتے ہوئے فائربیس کی خصوصیات بنا رہے ہیں۔

- [x] ہوسٹ کیا گیا پوسٹگریس  ڈیٹا بیس۔ [ہدایت نامہ](https://supabase.com/docs/guides/database)
- [x] تصدیق اور اختیارات۔ [ہدایت نامہ](https://supabase.com/docs/guides/auth) 
- [x] APIs  خود بخود پیدا ہونے والے
  - [x] ریسٹ۔ [ہدایت نامہ](https://supabase.com/docs/guides/api)
  - [x] گراف کیو ایل۔ [ہدایت نامہ](https://supabase.com/docs/guides/graphql)
  - [x] ریل ٹائم سبسکرپشنز۔ [ہدایت نامہ](https://supabase.io/docs)
- [x] فنکشنز۔
  - [x] ڈیٹا بیس فنکشنز۔ [ہدایت نامہ](https://supabase.com/docs/guides/database/functions)
  - [x] ایج فنکشنز۔ [ہدایت نامہ](https://supabase.com/docs/guides/functions)
- [x]  فائل اسٹوریج۔ [ہدایت نامہ](https://supabase.com/docs/guides/storage)
- [x] اے آئی + ویکٹر/اندراج ٹول‌‌‌کٹ [ہدایت نامہ](https://supabase.com/docs/guides/ai)
- [x] ڈیش بورڈ

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

اہم اپ ڈیٹس کی اطلاع حاصل کرنے کے لیے اس ریپو کی "ریلیز" دیکھیں۔

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

## ہدایت نامہ

مکمل ہدایت نامے کے لیے، [supabase.com/docs](supabase.com/docs) پر جائیں۔

شراکت کرنے کے طریقے کو دیکھنے کے لیے، [Getting Started](./DEVELOPERS.md) پر جائیں۔


## کمیونٹی اور حمائیت

- [Community Forum](https://github.com/supabase/supabase/discussions) اس کے لیے بہترین: تعمیر میں مدد، ڈیٹا بیس کے بہترین طریقوں کے بارے میں بحث۔
- [GitHub Issues](https://github.com/supabase/supabase/issues) اس کے لیے بہترین: کیڑے اور غلطیاں جن کا آپ کو سوپا بیس استعمال کرتے ہوئے سامنا کرنا پڑتا ہے۔
- [Email Support](https://supabase.com/docs/support#business-support) اس کے لیے بہترین: آپ کے ڈیٹا بیس یا انفراسٹرکچر کے ساتھ مسائل۔
- [Discord](https://discord.supabase.com) اس کے لیے بہترین: اپنی ایپلیکیشنز کا اشتراک کرنا اور کمیونٹی کے ساتھ ہینگ آؤٹ کرنا۔


## یہ کیسے کام کرتا ہے

سوپا بیس اوپن سورس ٹولز کا مجموعہ ہے۔ ہم انٹرپرائز گریڈ، اوپن سورس پروڈکٹس کا استعمال کرتے ہوئے فائر بیس کی خصوصیات بنا رہے ہیں۔ اگر ٹولز اور کمیونٹیز موجود ہیں، ایم آئی ٹی، اپاچی ٢، یا مساوی اوپن لائسنس کے ساتھ، ہم اس ٹول کو استعمال اور سپورٹ کریں گے۔ اگر ٹول موجود نہیں ہے تو ہم اسے خود بناتے اور کھولتے ہیں۔ سوپا بیس فائر بیس کی 1 سے 1 میپنگ نہیں ہے۔ ہمارا مقصد اوپن سورس ٹولز کا استعمال کرتے ہوئے ڈویلپرز کو فائر بیس جیسا بنانے کا تجربہ فراہم کرنا ہے۔

**فن تعمیر**

سوپا بیس ایک [میزبان پلیٹ فارم](https://supabase.com/dashboard) ہے۔ آپ سائن اپ کر سکتے ہیں اور بغیر کچھ انسٹال کیے سوپا بیس کا استعمال شروع کر سکتے ہیں۔
آپ [خود میزبانی](https://supabase.com/docs/guides/hosting/overview) اور [مقامی طور پر ترقی کریں](https://supabase.com/docs/guides/local-development) بھی کر سکتے ہیں۔

![Architecture](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.png)

- [Postgres](https://www.postgresql.org/) ایک آبجیکٹ-ریلیشنل ڈیٹا بیس سسٹم ہے جس میں 30 سال سے زیادہ فعال ترقی ہے جس نے اسے قابل اعتماد، خصوصیت کی مضبوطی اور کارکردگی کے لیے ایک مضبوط شہرت حاصل کی ہے۔
- [Realtime](https://github.com/supabase/realtime) ایک ایلیکسیر سرور ہے جو آپ کو ویب ساکٹس کا استعمال کرتے ہوئے پوسٹگریس‌کیو ایل کے اندراجات، اپ ڈیٹس اور حذف کرنے کی اجازت دیتا ہے۔ ڈیٹا بیس کی تبدیلیوں کے لیے ریئل ٹائم پولز پوسٹگریس کی بلٹ ان ریپلیکیشن فنکشنیلٹی، تبدیلیوں کو جے سن میں تبدیل کرتی ہے، پھر جے سن کو براڈکاسٹنگ کے لیے ویب ساکٹ پر نشر کرتی ہے۔
- [PostgREST](http://postgrest.org/) ایک ویب سرور ہے جو آپ کے پوسٹگریس‌کیو ایل ڈیٹا بیس کو براہ راست ایک ریسٹفل اے پی آئی میں بدل دیتا ہے۔
- [GoTrue](https://github.com/supabase/gotrue) صارفین کو منظم کرنے اور جے ڈبلیو ٹی ٹوکن جاری کرنے کے لیے ایک جے ڈبلیو ٹی پر مبنی اے پی آئی ہے۔
- [Storage](https://github.com/supabase/storage-api) اجازتوں کا نظم کرنے کے لیے پوسٹگریس کا استعمال کرتے ہوئے، ایس تری میں اسٹور کردہ فائلوں کو منظم کرنے کے لیے ایک آرام دہ انٹرفیس فراہم کرتا ہے۔

- [pg_graphql](http://github.com/supabase/pg_graphql/) پوسٹگر یس کیو ایل ایکسٹینشن جو گراف کیو ایل اے پی آئی کو ظاہر کرتی ہے۔
- [postgres-meta](https://github.com/supabase/postgres-meta) آپ کے پوسٹگریس کو منظم کرنے کے لیے ایک آرام دہ اے پی آئی ہے، جو آپ کو ٹیبلز لانے، کردار شامل کرنے اور سوالات چلانے وغیرہ کی اجازت دیتا ہے۔
- [Kong](https://github.com/Kong/kong) ایک کلاؤڈ مقامی اے پی آئی گیٹ وے ہے۔

#### Client libraries

Our approach for client libraries is modular. Each sub-library is a standalone implementation for a single external system. This is one of the ways we support existing tools.

## کلائنٹ لائبریریاں

کلائنٹ لائبریریوں کے لیے ہمارا نقطہ نظر ماڈیولر ہے۔ ہر ذیلی لائبریری ایک بیرونی نظام کے لیے اکیلے عمل درآمد ہے۔ یہ ان طریقوں میں سے ایک ہے جو ہم موجودہ ٹولز کو سپورٹ کرتے ہیں۔

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>Language</th>
    <th>Client</th>
    <th colspan="5">Feature-Clients (bundled in Supabase client)</th>
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
  <th colspan="7">⚡️ Official ⚡️</th>
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
  <th colspan="7">💚 Community 💚</th>
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

<!--- Remove this list if you're translating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## بیجز

![سوپا بیس کے ساتھ بنایا گیا](./apps/www/public/badge-made-with-supabase.svg)

```md
[![سوپا بیس کے ساتھ بنایا گیا](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img
    width="168"
    height="30"
    src="https://supabase.com/badge-made-with-supabase.svg"
    alt="Made with Supabase"
  />
</a>
```

![سوپا بیس کے ساتھ بنایا گیا (سیاہ)](./apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![سوپا بیس کے ساتھ بنایا گیا)](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img
    width="168"
    height="30"
    src="https://supabase.com/badge-made-with-supabase-dark.svg"
    alt="Made with Supabase"
  />
</a>
```

## Translations

- [Arabic | العربية](/i18n/README.ar.md)
- [Albanian / Shqip](/i18n/README.sq.md)
- [Bangla / বাংলা](/i18n/README.bn.md)
- [Bulgarian / Български](/i18n/README.bg.md)
- [Catalan / Català](/i18n/README.ca.md)
- [Czech / čeština](/i18n/README.cs.md)
- [Danish / Dansk](/i18n/README.da.md)
- [Dutch / Nederlands](/i18n/README.nl.md)
- [English](https://github.com/supabase/supabase)
- [Estonian / eesti keel](/i18n/README.et.md)
- [Finnish / Suomalainen](/i18n/README.fi.md)
- [French / Français](/i18n/README.fr.md)
- [German / Deutsch](/i18n/README.de.md)
- [Greek / Ελληνικά](/i18n/README.el.md)
- [Gujarati / ગુજરાતી](/i18n/README.gu.md)
- [Hebrew / עברית](/i18n/README.he.md)
- [Hindi / हिंदी](/i18n/README.hi.md)
- [Hungarian / Magyar](/i18n/README.hu.md)
- [Nepali / नेपाली](/i18n/README.ne.md)
- [Indonesian / Bahasa Indonesia](/i18n/README.id.md)
- [Italiano / Italian](/i18n/README.it.md)
- [Japanese / 日本語](/i18n/README.jp.md)
- [Korean / 한국어](/i18n/README.ko.md)
- [Lithuanian / lietuvių](/i18n/README.lt.md)
- [Latvian / latviski](/i18n/README.lv.md)
- [Malay / Bahasa Malaysia](/i18n/README.ms.md)
- [Norwegian (Bokmål) / Norsk (Bokmål)](/i18n/README.nb.md)
- [Persian / فارسی](/i18n/README.fa.md)
- [Polish / Polski](/i18n/README.pl.md)
- [Portuguese / Português](/i18n/README.pt.md)
- [Portuguese (Brazilian) / Português Brasileiro](/i18n/README.pt-br.md)
- [Romanian / Română](/i18n/README.ro.md)
- [Russian / Pусский](/i18n/README.ru.md)
- [Serbian / Srpski](/i18n/README.sr.md)
- [Sinhala / සිංහල](/i18n/README.si.md)
- [Slovak / slovenský](/i18n/README.sk.md)
- [Slovenian / Slovenščina](/i18n/README.sl.md)
- [Spanish / Español](/i18n/README.es.md)
- [Simplified Chinese / 简体中文](/i18n/README.zh-cn.md)
- [Swedish / Svenska](/i18n/README.sv.md)
- [Thai / ไทย](/i18n/README.th.md)
- [Traditional Chinese / 繁体中文](/i18n/README.zh-tw.md)
- [Turkish / Türkçe](/i18n/README.tr.md)
- [Ukrainian / Українська](/i18n/README.uk.md)
- [Urdu / اردو](/i18n/README.ur.md)
- [Vietnamese / Tiếng Việt](/i18n/README.vi-vn.md)
- [List of translations](/i18n/languages.md) <!--- Keep only this -->
