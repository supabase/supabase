<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

# سوپابیس

[سوپابیس](https://supabase.com) د فايربيس غه یو اوپن سورس بدل دی. 
موږ د فايربيس د اینٹرپرائز گریڈ غه اوپن سورس ټولزونو جوړو 

- [x] .هوسټيډ پوسټګريس ډاتابيس [اسناد](https://supabase.com/docs/guides/database)
- [x] .تصدیق او واک ورکول [اسناد](https://supabase.com/docs/guides/auth)
- [x] .په اتومات ډول تولید شويای-پي-آئيز
  - [x] .ریسټ [اسناد](https://supabase.com/docs/guides/api)
  - [x] .ګراف کیو ایل [اسناد](https://supabase.com/docs/guides/graphql)
  - [x] .ريل ټايم سبسکرپشنز [اسناد](https://supabase.com/docs/guides/realtime)
- [x] .فانکشنز
  - [x] .ډاتابیس فانکشنز [اسناد](https://supabase.com/docs/guides/database/functions)
  - [x] .ایج فانکشنز [اسناد](https://supabase.com/docs/guides/functions)
- [x] .فایل سټوریج [اسناد](https://supabase.com/docs/guides/storage)
- [x] اې آئی + وېکټر/امبیډنګ ټولکټ [اسناد](https://supabase.com/docs/guides/ai)
- [x] ډشبورډ

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

د دې ریپو "ریلیز" وګورئ ترڅو د لوی تازه معلوماتو خبرتیا ترلاسه کړئ.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

## اسناد

د بشپړ اسنادو لپاره، لیدنه وکړئ [supabase.com/docs](https://supabase.com/docs)

د دې لپاره چې وګورو څنګه مرسته وکړو، لیدنه وکړئ [Getting Started](./DEVELOPERS.md)

## ټولنه او ملاتړ

- [Community Forum](https://github.com/supabase/supabase/discussions). د دې لپاره غوره: د جوړولو سره مرسته، د ډیټابیس غوره کړنو په اړه بحث.
- [GitHub Issues](https://github.com/supabase/supabase/issues). د دې لپاره غوره: بګونه او غلطۍ چې تاسو د سوپابیس په کارولو سره ورسره مخ یاست.
- [Email Support](https://supabase.com/docs/support#business-support). د دې لپاره غوره: ستاسو د ډیټابیس یا د اینفراسترکټیورا ستونزې.
- [Discord](https://discord.supabase.com). د دې لپاره غوره: خپل غوښتنلیکونه شریک کړئ او د ټولنې سره ځړول.

## څنګه کار کوي

سوپابیس د اوپن سورس وسیلو ترکیب دی. موږ د تصدۍ درجې ، اوپن سورس محصولاتو په کارولو سره د فايربيس ځانګړتیاوې رامینځته کوو. که وسیلې او ټولنې شتون ولري، د MIT، Apache 2، یا مساوي اوپن لائسنس سره، موږ به دا وسیله وکاروو او ملاتړ یې وکړو. که دا وسیله شتون ونلري، موږ یې پخپله جوړوو او اوپن سورس جوړوو. سوپابیس د فايربيس له 1 څخه تر 1 پورې نقشه نه ده. زموږ هدف د اوپن سورس وسیلو په کارولو سره پراختیا کونکو ته د فايربيس په څیر پراختیا کونکي تجربه ورکول دي.

**معمارۍ**

سوپابیس یو [هوسټ شوی پلټفارم](https://supabase.com/dashboard) دی. تاسو سائن اپ کولی شئ او پرته له  نصبولو د سوپابیس کارول پیل کړئ.

تاسو هم [خودهوسټ](https://supabase.com/docs/guides/hosting/overview) کولی شئ او [لوکلي جوړ کړئ](https://supabase.com/docs/guides/local-development).

![معمارۍ](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.png)

- [Postgres](https://www.postgresql.org/) د اوبجیکټ روابطي ډیټابیس سیسټم دی. د 30 کلونو فعال پرمختګ سره چې دا یې د اعتبار، ځانګړتیا پیاوړتیا، او فعالیت لپاره قوي شهرت ترلاسه کړی

- [Realtime](https://github.com/supabase/realtime) دا یو ایلیکسیر سرور دی چې تاسو ته اجازه درکوي د ویب ساکټونو په کارولو سره د پوستګریس کو ایل داخلولو ، تازه کولو او حذف کولو ته غوږ شئ. ریل ټایم د ډیټابیس بدلونونو لپاره د پوسټګریس جوړ شوي نقل فعالیت نظر ورکوي ، JSON ته بدلونونه بدلوي ، بیا د مجاز پیرودونکو ته د ویب ساکټونو له لارې JSON خپروي.

- [PostgREST](http://postgrest.org/) یو ویب سرور دی چې ستاسو د پوستګریس کو ایل ډیټابیس مستقیم په ریسټفل اې‌پی‌آئی بدلوي.

- [GoTrue](https://github.com/supabase/gotrue) د JWT پر بنسټ API دی چې د کاروونکو اداره کولو او د JWT ټوکنونو صادرولو لپاره دی.

- [Storage](https://github.com/supabase/storage-api)
ریسټفل اېس‌پی‌آئی پ ایس ۳ کې ذخیره شوي فایلونو اداره کولو لپاره د پوسټگریس په کارولو سره د اجازې اداره کول.

- [pg_graphql](http://github.com/supabase/pg_graphql/) دا د پوستګریس کو ایل توسیع دی چې ګراف کو ایل اې‌پی‌آئی افشا کوي

- [postgres-meta](https://github.com/supabase/postgres-meta) ستاسو د پوسټګریس اداره کولو لپاره یو Restful API دی، تاسو ته اجازه درکوي  ترلاسه کړئ، رولونه اضافه کړئ، او پوښتنې پرمخ وړئ، او داسې نور.

- [Kong](https://github.com/Kong/kong) د کلاډ نیټوئئو اې‌پی‌آئی گیټوۍ ده

#### د مراجعینو کتابتونونه

د مراجعینو کتابتونونو لپاره زموږ چلند ماډلر دی. هر فرعي کتابتون د یو واحد بهرني سیسټم لپاره یو واحد تطبیق دی. دا یو له هغو لارو څخه دی چې موږ د موجوده وسیلو ملاتړ کوو.

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

## بیجونه

![د سوپابیس سره جوړ شوی](./apps/www/public/badge-made-with-supabase.svg)

```md
[![د سوپابیس سره جوړ شوی](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
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

![د سوپابیس سره جوړ شوی (تور)](./apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![د سوپابیس سره جوړ شوی](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
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

## ژباړې

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
- [Pashto / پښتو](/i18n/README.ps.md)
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
- [Vietnamese / Tiếng Việt](/i18n/README.vi-vn.md)
- [List of translations](/i18n/languages.md) <!--- Keep only this -->