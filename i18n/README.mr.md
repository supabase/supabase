<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

# Supabase

[सुपाबेस (Supabase)](https://supabase.com) हे पोस्टग्रेस डेव्हलपमेंट प्लॅटफॉर्म आहे. आम्ही एंटरप्राइझ-दर्जाच्या मुक्त-स्रोत (open source) साधनांचा वापर करून फायरबेसची वैशिष्ट्ये तयार करत आहोत.

- [x] होस्टेड पोस्टग्रेस डेटाबेस. [दस्तऐवजीकरण](https://supabase.com/docs/guides/database)
- [x] प्रमाणीकरण आणि अधिकृतिकरण (Authentication and Authorization). [दस्तऐवजीकरण](https://supabase.com/docs/guides/auth)
- [x] स्वयंचलित व्युत्पन्न एपीआय (Auto-generated APIs).
  - [x] REST. [दस्तऐवजीकरण](https://supabase.com/docs/guides/api)
  - [x] GraphQL. [दस्तऐवजीकरण](https://supabase.com/docs/guides/graphql)
  - [x] रिअलटाइम सबस्क्रिप्शन (Realtime subscriptions). [दस्तऐवजीकरण](https://supabase.com/docs/guides/realtime)
- [x] फंक्शन्स (Functions).
  - [x] डेटाबेस फंक्शन्स. [दस्तऐवजीकरण](https://supabase.com/docs/guides/database/functions)
  - [x] एज फंक्शन्स (Edge Functions). [दस्तऐवजीकरण](https://supabase.com/docs/guides/functions)
- [x] फाइल स्टोरेज. [दस्तऐवजीकरण](https://supabase.com/docs/guides/storage)
- [x] एआय + व्हेक्टर/एम्बेडिंग्ज टूलकिट (AI + Vector/Embeddings Toolkit). [दस्तऐवजीकरण](https://supabase.com/docs/guides/ai)
- [x] डॅशबोर्ड.

![सुपाबेस डॅशबोर्ड](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

महत्त्वाच्या अद्यतनांची सूचना मिळवण्यासाठी या भांडाराच्या (repo) "releases" वर लक्ष ठेवा.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="या भांडारावर लक्ष ठेवा"/></kbd>

## दस्तऐवजीकरण

संपूर्ण दस्तऐवजीकरणासाठी, [supabase.com/docs](https://supabase.com/docs) ला भेट द्या.

योगदान कसे करावे हे जाणून घेण्यासाठी, [सुरुवात करणे (Getting Started)](../DEVELOPERS.md) ला भेट द्या.

## समुदाय आणि सहाय्य

- [सामुदायिक चर्चा (Community Forum)](https://github.com/supabase/supabase/discussions). ॲप्स तयार करण्यात मदत आणि डेटाबेस सर्वोत्तम पद्धतींवरील चर्चेसाठी सर्वोत्तम.
- [गिटहब इश्यूज (GitHub Issues)](https://github.com/supabase/supabase/issues). सुपाबेस वापरताना आढळणाऱ्या त्रुटी (bugs) आणि समस्यांसाठी सर्वोत्तम.
- [ईमेल सहाय्य (Email Support)](https://supabase.com/docs/support#business-support). तुमच्या डेटाबेस किंवा पायाभूत सुविधांच्या समस्यांसाठी सर्वोत्तम.
- [डिस्कॉर्ड (Discord)](https://discord.supabase.com). तुमचे प्रकल्प सामायिक करण्यासाठी आणि सुपाबेस समुदायाशी संवाद साधण्यासाठी सर्वोत्तम.

## हे कसे कार्य करते

सुपाबेस हे मुक्त-स्रोत (open source) साधनांचे एक संयोजन आहे. आम्ही एंटरप्राइझ दर्जाच्या ओपन-सोर्स उत्पादनांचा वापर करून फायरबेसची वैशिष्ट्ये तयार करत आहोत. जर MIT, Apache 2 किंवा समतुल्य ओपन लायसन्स असलेली साधने आणि समुदाय अस्तित्वात असतील, तर आम्ही ते साधन वापरतो आणि त्याचे समर्थन करतो. साधन अस्तित्वात नसल्यास, आम्ही ते स्वतः तयार करतो आणि मुक्त-स्रोत करतो. सुपाबेस हे फायरबेसचे १:१ मॅपिंग नाही. ओपन-सोर्स साधनांचा वापर करून विकासकांना फायरबेससारखा विकासक अनुभव देणे हे आमचे उद्दिष्ट आहे.

**वास्तुशिल्प (Architecture)**

सुपाबेस हे एक [होस्ट केलेले व्यासपीठ (Hosted Platform)](https://supabase.com/dashboard) आहे. तुम्ही कोणतीही स्थापना न करता नोंदणी करू शकता आणि सुपाबेस वापरण्यास सुरुवात करू शकता.
तुम्ही [स्वतः होस्ट (self-host)](https://supabase.com/docs/guides/hosting/overview) करू शकता आणि [स्थानिक पातळीवर विकास (develop locally)](https://supabase.com/docs/guides/local-development) देखील करू शकता.

![वास्तुशिल्प](apps/docs/public/img/supabase-architecture.svg)

- [Postgres](https://www.postgresql.org/) ही ३० वर्षांहून अधिक सक्रिय विकासासह एक ऑब्जेक्ट-रिलेशनल डेटाबेस प्रणाली आहे, ज्याने विश्वसनीयता, वैशिष्ट्यपूर्ण मजबुती आणि कार्यक्षमतेसाठी मजबूत प्रतिष्ठा मिळवली आहे.
- [Realtime](https://github.com/supabase/realtime) हा एक Elixir सर्व्हर आहे जो तुम्हाला वेबसॉकेट्सचा वापर करून PostgreSQL मधील डेटा इन्सर्ट, अपडेट आणि डिलीट ऐकण्याची अनुमती देतो. रिअलटाइम डेटाबेस बदलांसाठी पोस्टग्रेसच्या अंगभूत प्रतिकृती कार्यक्षमतेचा वापर करतो, बदलांचे JSON मध्ये रूपांतर करतो आणि अधिकृत क्लायंट्सना वेबसॉकेट्सद्वारे प्रसारित करतो.
- [PostgREST](http://postgrest.org/) हा एक वेब सर्व्हर आहे जो तुमच्या PostgreSQL डेटाबेसला थेट RESTful API मध्ये रूपांतरित करतो.
- [GoTrue](https://github.com/supabase/gotrue) हे एक JWT-आधारित प्रमाणीकरण एपीआय आहे जे युझर साइन-अप, लॉगिन आणि सेशन व्यवस्थापन सुलभ करते.
- [Storage](https://github.com/supabase/storage-api) हे S3 मधील फाइल्स व्यवस्थापित करण्यासाठी RESTful इंटरफेस प्रदान करते, ज्यामध्ये पोस्टग्रेस परवानग्या हाताळतो.
- [pg_graphql](http://github.com/supabase/pg_graphql/) हा एक पोस्टग्रेस एक्स्टेंशन आहे जो ग्राफक्यूएल एपीआय प्रदान करतो.
- [postgres-meta](https://github.com/supabase/postgres-meta) हे पोस्टग्रेस व्यवस्थापनासाठी RESTful API आहे, जे टेबल्स आणण्यास, भूमिका जोडण्यास आणि क्वेरी चालवण्यास अनुमती देते.
- [Envoy](https://github.com/envoyproxy/envoy) हे एक क्लाउड-नेटिव्ह, उच्च-कार्यक्षमता असलेले एज आणि सर्व्हिस प्रॉक्सी आहे.

#### क्लायंट लायब्ररी (Client libraries)

क्लायंट लायब्ररीसाठी आमचा दृष्टिकोन मॉड्यूलर आहे. प्रत्येक उप-लायब्ररी ही एका बाह्य प्रणालीसाठी स्वतंत्र अंमलबजावणी आहे.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>भाषा</th>
    <th>क्लायंट</th>
    <th colspan="5">फीचर-क्लायंट्स (सुपाबेस क्लायंटमध्ये समाविष्ट)</th>
  </tr>
  <!-- notranslate -->
  <tr>
    <th></th>
    <th>सुपाबेस</th>
    <th><a href="https://github.com/postgrest/postgrest" target="_blank" rel="noopener noreferrer">PostgREST</a></th>
    <th><a href="https://github.com/supabase/gotrue" target="_blank" rel="noopener noreferrer">GoTrue</a></th>
    <th><a href="https://github.com/supabase/realtime" target="_blank" rel="noopener noreferrer">Realtime</a></th>
    <th><a href="https://github.com/supabase/storage-api" target="_blank" rel="noopener noreferrer">Storage</a></th>
    <th>Functions</th>
  </tr>
  <!-- /notranslate -->
  <th colspan="7">⚡️ अधिकृत (Official) ⚡️</th>
  <!-- notranslate -->
  <tr>
    <td>JavaScript (TypeScript)</td>
    <td><a href="https://github.com/supabase/supabase-js" target="_blank" rel="noopener noreferrer">supabase-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/postgrest-js" target="_blank" rel="noopener noreferrer">postgrest-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/auth-js" target="_blank" rel="noopener noreferrer">auth-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/realtime-js" target="_blank" rel="noopener noreferrer">realtime-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/storage-js" target="_blank" rel="noopener noreferrer">storage-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/functions-js" target="_blank" rel="noopener noreferrer">functions-js</a></td>
  </tr>
  <tr>
    <td>Flutter</td>
    <td><a href="https://github.com/supabase/supabase-flutter" target="_blank" rel="noopener noreferrer">supabase-flutter</a></td>
    <td><a href="https://github.com/supabase/supabase-flutter/tree/main/packages/postgrest" target="_blank" rel="noopener noreferrer">postgrest</a></td>
    <td><a href="https://github.com/supabase/supabase-flutter/tree/main/packages/supabase_auth" target="_blank" rel="noopener noreferrer">supabase_auth</a></td>
    <td><a href="https://github.com/supabase/supabase-flutter/tree/main/packages/supabase_realtime" target="_blank" rel="noopener noreferrer">supabase_realtime</a></td>
    <td><a href="https://github.com/supabase/supabase-flutter/tree/main/packages/supabase_storage" target="_blank" rel="noopener noreferrer">supabase_storage</a></td>
    <td><a href="https://github.com/supabase/supabase-flutter/tree/main/packages/supabase_functions" target="_blank" rel="noopener noreferrer">supabase_functions</a></td>
  </tr>
  <tr>
    <td>Swift</td>
    <td><a href="https://github.com/supabase/supabase-swift" target="_blank" rel="noopener noreferrer">supabase-swift</a></td>
    <td><a href="https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST" target="_blank" rel="noopener noreferrer">postgrest-swift</a></td>
    <td><a href="https://github.com/supabase/supabase-swift/tree/main/Sources/Auth" target="_blank" rel="noopener noreferrer">auth-swift</a></td>
    <td><a href="https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime" target="_blank" rel="noopener noreferrer">realtime-swift</a></td>
    <td><a href="https://github.com/supabase/supabase-swift/tree/main/Sources/Storage" target="_blank" rel="noopener noreferrer">storage-swift</a></td>
    <td><a href="https://github.com/supabase/supabase-swift/tree/main/Sources/Functions" target="_blank" rel="noopener noreferrer">functions-swift</a></td>
  </tr>
  <tr>
    <td>Python</td>
    <td><a href="https://github.com/supabase/supabase-py" target="_blank" rel="noopener noreferrer">supabase-py</a></td>
    <td><a href="https://github.com/supabase/postgrest-py" target="_blank" rel="noopener noreferrer">postgrest-py</a></td>
    <td><a href="https://github.com/supabase/gotrue-py" target="_blank" rel="noopener noreferrer">gotrue-py</a></td>
    <td><a href="https://github.com/supabase/realtime-py" target="_blank" rel="noopener noreferrer">realtime-py</a></td>
    <td><a href="https://github.com/supabase/storage-py" target="_blank" rel="noopener noreferrer">storage-py</a></td>
    <td><a href="https://github.com/supabase/functions-py" target="_blank" rel="noopener noreferrer">functions-py</a></td>
  </tr>
  <!-- /notranslate -->
  <th colspan="7">💚 समुदाय (Community) 💚</th>
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
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Auth" target="_blank" rel="noopener noreferrer">auth-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Realtime" target="_blank" rel="noopener noreferrer">realtime-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Storage" target="_blank" rel="noopener noreferrer">storage-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Functions" target="_blank" rel="noopener noreferrer">functions-kt</a></td>
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
    <td>Godot Engine (GDScript)</td>
    <td><a href="https://github.com/supabase-community/godot-engine.supabase" target="_blank" rel="noopener noreferrer">supabase-gdscript</a></td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <!-- /notranslate -->
</table>

## बॅजेस (Badges)

![Made with Supabase](./apps/www/public/badge-made-with-supabase.svg)

```md
[![Made with Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
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

![Made with Supabase (dark)](./apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Made with Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
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

## भाषांतर (Translations)

- [भाषांतरांची यादी](/i18n/languages.md) <!--- Keep only this -->

---

## आमचे प्रायोजक (Sponsors)

[![New Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
