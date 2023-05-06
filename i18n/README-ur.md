<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# سپابیس(Supabase) 

سپابیس  ایک کھلے سورس فائربیس کا متبادل ہے۔ ہم فائربیس کی خصوصیات کو اینٹرپرائز گریڈ کھلے سورس ٹولز کی مدد سے تعمیر کر رہے ہیں۔

- [x] [Docs](https://supabase.com/docs/guides/database) میزبان پوسٹگریس ڈیٹابیس.
- [x] [Docs](https://supabase.com/docs/guides/auth) توثیق اور اختیارات.
- [x] خودکار تشکیل شدہ API۔
  - [x] REST. [Docs](https://supabase.com/docs/guides/database/api#rest-api)
  - [x] GraphQL. [Docs](https://supabase.com/docs/guides/database/api#graphql-api)
  - [x] [Docs](https://supabase.com/docs/guides/database/api#realtime-api) ریل ٹائم سبسکرپشنز
- [x] فنکشنز.
  - [x] [Docs](https://supabase.com/docs/guides/database/functions) ڈیٹابیس فنکشنز
  - [x] [Docs](https://supabase.com/docs/guides/functions) ایج فنکشنز
- [x] [Docs](https://supabase.com/docs/guides/storage) فائل ذخیرہ 
- [x] ڈیش بورڈ

![سپابیس ڈیش بورڈ](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## تحریریات

مکمل دستاویزات کے لئے، دیکھیں: [supabase.com/docs](https://supabase.com/docs)

مشارکت کیسے کرنی ہے، دیکھنے کے لئے، دیکھیں: [Getting Started](./DEVELOPERS.md)

## کمیونٹی اور حمایت

- [Community Forum](https://github.com/supabase/supabase/discussions). بہترین ہے: تعمیر کے ساتھ مدد، ڈیٹابیس کے بہترین اصولوں پر گفتگو۔
- [GitHub Issues](https://github.com/supabase/supabase/issues). بہترین چیز: سپابیس استعمال کرتے ہوئے بگز اور خرابیوں کے لئے۔
- [Email Support](https://supabase.com/docs/support#business-support). بہترین چیز: آپ کے ڈیٹابیس یا زیرساخت کے مسائل کے لئے۔
- [Discord](https://discord.supabase.com). بہترین چیز: اپنے اطلاقات کو شیئر کرنے اور کمیونٹی کے ساتھ وقت گزارنے کے لئے۔

## حالت 

- [x] آلفا: ہم سپابیس کو ایک محدود تعداد کے گاہکوں کے ساتھ ٹیسٹ کر رہے ہیں۔
- [x] عوامی بیٹا: زیادہ تر غیر اینٹرپرائز استعمال کی صورت میں کافی مستحکم
- [x] عوامی آلفا: [app.supabase.com](https://app.supabase.com).
- [ ] عمومی دستیابی [[status](https://supabase.com/docs/guides/getting-started/features#feature-status)]

ہم فی الحال عوامی بیٹا میں ہیں۔ "ریپوزیٹری کی ریلیزز" کا مشاہدہ کریں تاکہ آپ کو بڑی تازہ ترین اپ ڈیٹس کی اطلاع مل سکے۔


<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## کام کرنے کا طریقہ عمل

Supabase ایک کھلے سورس ٹولز کا مجموعہ ہے۔ ہم فائربیس کی خصوصیات کو اینٹرپرائز گریڈ، کھلے سورس مصنوعات کی مدد سے تعمیر کر رہے ہیں۔ اگر ٹولز اور کمیونٹی موجود ہوں اور ان کا MIT، Apache 2 یا مماثل کھلے لائسنس ہو، تو ہم وہی ٹول استعمال کریں گے اور اسے حمایت بھی کریں گے۔ اگر ٹول موجود نہ ہو، تو ہم خود اسے تعمیر کریں گے اور کھلے سورس کریں گے۔ Supabase فائربیس کی ایک سے ایک میپنگ نہیں ہے۔ ہمارا مقصد ڈویلپرز کو کھلے سورس ٹولز کی استعمال سے فائربیس جیسی ڈویلپر تجربہ فراہم کرنا ہے۔

**معماری**

Supabase ایک میزبان پلیٹفارم ہے۔ آپ سائن اپ کرکے اور کچھ بھی انسٹال کیے بغیر Supabase کا استعمال شروع کرسکتے ہیں۔
آپ بھی [خود میزبانی](https://supabase.com/docs/guides/hosting/overview) اور [مقامی طور پر ترقی کریں](https://supabase.com/docs/guides/local-development).

![Architecture](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.png)

- ایک اشیائی-تعلقی ڈیٹابیس سسٹم ہے جس کی کارکردگی کو تجربہ کے لیے 30 سال سے زیادہ کا وقت ہوا ہے۔ یہ مستحکمی، مکمل خصوصیتوں کا مضبوط ہونا اور کارکردگی کی بابت مضبوط عہدے کی حاصلی کی وجہ سے مشہوری حاصل کر چکا ہے۔ [PostgreSQL](https://www.postgresql.org/)
- ایک الکسیر سرور ہے جو آپ کو ویب سوکٹس کی استعمال سے پوسٹگریسکیوال کے انسرٹس، اپ ڈیٹس اور ڈیلیٹس پر سننے کی اجازت دیتا ہے۔ ریل ٹائم پولز پوسٹگریس کی تشکیل شدہ تکراری کارکردگی کو ڈیٹابیس تبدیلیوں کے لئے استعمال کرتا ہے، تبدیلیوں کو JSON میں تبدیل کرتا ہے اور پھر تصدیق شدہ کلائنٹس کو JSON کو ویب سوکٹس پر براڈکاسٹ کرتا ہے۔ [Realtime](https://github.com/supabase/realtime) 
- [PostgREST](http://postgrest.org/) یہ ایک ویب سرور ہے جو آپ کے پوسٹگریسکیوال ڈیٹابیس کو براہِ راست ایک ریسٹفل API میں تبدیل کرتا ہے۔
- [pg_graphql](http://github.com/supabase/pg_graphql/) یہ ایک پوسٹگریسکیوال ایکسٹینشن ہے جو ایک GraphQL API کو ظاہر کرتا ہے۔
- [Storage](https://github.com/supabase/storage-api) یہ S3 میں محفوظ کیے گئے فائلوں کو منظم کرنے کے لئے ایک RESTful انٹرفیس فراہم کرتا ہے، جبکہ اجازتوں کو منظم کرنے کے لئے پوسٹگریس استعمال کی جاتی ہے۔
- [postgres-meta](https://github.com/supabase/postgres-meta) یہ آپ کے پوسٹگریس کو منظم کرنے کے لئے ایک RESTful API ہے، جس کے ذریعے آپ تاکیدوں کو حاصل کر سکتے ہیں، رولز شامل کر سکتے ہیں اور کوئریز چلا سکتے ہیں وغیرہ۔
- [GoTrue](https://github.com/netlify/gotrue) یہ ایک SWT بیسڈ API ہے جو صارفین کو منظم کرنے اور SWT ٹوکنز جاری کرنے کے لئے استعمال ہوتا ہے۔ (Urdu)
- [Kong](https://github.com/Kong/kong)یہ ایک کلاؤڈ-نیٹو API گیٹ وے ہے۔ (Urdu)

#### کلائنٹ لائبریریز

ہمارا تعامل کلائنٹ لائبریریز کے لئے ماڈیولر ہے۔ ہر ذیلی لائبریری ایک مستقل نظام کے لئے ایک الگ انداز کارکردگی کی پیشکش ہے۔ یہ ایک ترکیب ہے جس کے ذریعے ہم موجودہ آلات کی حمایت کرتے ہیں۔

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>Language</th>
    <th>Client</th>
    <th colspan="5">Feature-Clients (bundled in Supabase client)</th>
  </tr>
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
  <th colspan="7">⚡️ Official ⚡️</th>
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
  <th colspan="7">💚 Community 💚</th>
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
    <td><a href="https://github.com/supabase-community/postgrest-kt" target="_blank" rel="noopener noreferrer">postgrest-kt</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-kt" target="_blank" rel="noopener noreferrer">gotrue-kt</a></td>
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
</table>

<!--- Remove this list if you're translating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->


---

## سپانسرز 

[![نئے سپانسر](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)