<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

# Supabase

[Supabase](https://supabase.com) हे Postgres विकास प्लॅटफॉर्म आहे. आम्ही एंटरप्राइझ-ग्रेड ओपन सोर्स साधनांचा वापर करून Firebase ची वैशिष्ट्ये तयार करत आहोत.

- [x] होस्टेड Postgres डेटाबेस. [दस्तऐवज](https://supabase.com/docs/guides/database)
- [x] प्रमाणीकरण आणि अधिकृतता. [दस्तऐवज](https://supabase.com/docs/guides/auth)
- [x] स्वयं-निर्मित APIs.
  - [x] REST. [दस्तऐवज](https://supabase.com/docs/guides/api)
  - [x] GraphQL. [दस्तऐवज](https://supabase.com/docs/guides/graphql)
  - [x] रिअलटाइम सबस्क्रिप्शन्स. [दस्तऐवज](https://supabase.com/docs/guides/realtime)
- [x] फंक्शन्स.
  - [x] डेटाबेस फंक्शन्स. [दस्तऐवज](https://supabase.com/docs/guides/database/functions)
  - [x] एज फंक्शन्स [दस्तऐवज](https://supabase.com/docs/guides/functions)
- [x] फाइल स्टोरेज. [दस्तऐवज](https://supabase.com/docs/guides/storage)
- [x] AI + Vector/Embeddings टूलकिट. [दस्तऐवज](https://supabase.com/docs/guides/ai)
- [x] डॅशबोर्ड

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

मुख्य अपडेट्सच्या सूचना मिळविण्यासाठी या रेपोच्या "releases" ला वॉच करा.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

## दस्तऐवजीकरण

संपूर्ण दस्तऐवजीकरणासाठी, [supabase.com/docs](https://supabase.com/docs) ला भेट द्या

योगदान कसे द्यावे हे पाहण्यासाठी, [Getting Started](./DEVELOPERS.md) ला भेट द्या

## समुदाय आणि समर्थन

- [समुदाय मंच](https://github.com/supabase/supabase/discussions). सर्वोत्तम यासाठी: निर्माणात मदत, डेटाबेस सर्वोत्तम पद्धतींबद्दल चर्चा.
- [GitHub Issues](https://github.com/supabase/supabase/issues). सर्वोत्तम यासाठी: Supabase वापरताना आलेल्या बग्स आणि त्रुटी.
- [ईमेल समर्थन](https://supabase.com/docs/support#business-support). सर्वोत्तम यासाठी: तुमच्या डेटाबेस किंवा इन्फ्रास्ट्रक्चरच्या समस्या.
- [Discord](https://discord.supabase.com). सर्वोत्तम यासाठी: तुमचे ऍप्लिकेशन्स शेअर करणे आणि समुदायासोबत संवाद साधणे.

## हे कसे कार्य करते

Supabase ओपन सोर्स साधनांचे संयोजन आहे. आम्ही एंटरप्राइझ-ग्रेड, ओपन सोर्स उत्पादनांचा वापर करून Firebase ची वैशिष्ट्ये तयार करत आहोत. जर साधने आणि समुदाय अस्तित्वात असतील, MIT, Apache 2, किंवा समतुल्य ओपन लायसन्ससह, तर आम्ही त्या साधनाचा वापर करू आणि समर्थन करू. जर साधन अस्तित्वात नसेल, तर आम्ही ते स्वतः तयार करतो आणि ओपन सोर्स करतो. Supabase हा Firebase चा 1-to-1 मॅपिंग नाही. आमचे उद्दिष्ट विकसकांना ओपन सोर्स साधनांचा वापर करून Firebase सारखा विकसक अनुभव देणे आहे.

**आर्किटेक्चर**

Supabase एक [होस्टेड प्लॅटफॉर्म](https://supabase.com/dashboard) आहे. तुम्ही काहीही इंस्टॉल न करता साइन अप करू शकता आणि Supabase वापरणे सुरू करू शकता.
तुम्ही [स्वतः-होस्ट](https://supabase.com/docs/guides/hosting/overview) आणि [स्थानिक विकास](https://supabase.com/docs/guides/local-development) देखील करू शकता.

![Architecture](apps/docs/public/img/supabase-architecture.svg)

- [Postgres](https://www.postgresql.org/) एक ऑब्जेक्ट-रिलेशनल डेटाबेस सिस्टीम आहे ज्याला 30 वर्षांपेक्षा जास्त सक्रिय विकासाचा अनुभव आहे ज्याने विश्वसनीयता, वैशिष्ट्य मजबूती आणि कार्यक्षमतेसाठी मजबूत प्रतिष्ठा मिळवली आहे.
- [Realtime](https://github.com/supabase/realtime) एक Elixir सर्व्हर आहे जो तुम्हाला websockets वापरून PostgreSQL inserts, updates आणि deletes ऐकण्याची परवानगी देतो. Realtime डेटाबेस बदलांसाठी Postgres च्या अंतर्निहित प्रतिकृती कार्यक्षमतेची मतदान करते, बदलांना JSON मध्ये रूपांतरित करते, नंतर अधिकृत क्लायंट्सना websockets वर JSON प्रसारित करते.
- [PostgREST](http://postgrest.org/) एक वेब सर्व्हर आहे जो तुमच्या PostgreSQL डेटाबेसला थेट RESTful API मध्ये बदलतो.
- [GoTrue](https://github.com/supabase/gotrue) एक JWT-आधारित प्रमाणीकरण API आहे जो तुमच्या ऍप्लिकेशन्समध्ये वापरकर्ता साइन-अप्स, लॉगिन्स आणि सत्र व्यवस्थापन सुलभ करतो.
- [Storage](https://github.com/supabase/storage-api) S3 मध्ये फाइल्स व्यवस्थापित करण्यासाठी एक RESTful API आहे, ज्यामध्ये Postgres परवानग्या हाताळतो.
- [pg_graphql](http://github.com/supabase/pg_graphql/) एक PostgreSQL विस्तार आहे जो GraphQL API उघड करतो.
- [postgres-meta](https://github.com/supabase/postgres-meta) तुमचा Postgres व्यवस्थापित करण्यासाठी एक RESTful API आहे, जो तुम्हाला टेबल्स आणणे, भूमिका जोडणे आणि क्वेरी चालवणे इत्यादी करण्याची परवानगी देतो.
- [Kong](https://github.com/Kong/kong) एक क्लाउड-नेटिव्ह API गेटवे आहे.

#### क्लायंट लायब्ररी

क्लायंट लायब्ररीसाठी आमचा दृष्टिकोन मॉड्यूलर आहे. प्रत्येक उप-लायब्ररी एकाच बाह्य प्रणालीसाठी स्वतंत्र अंमलबजावणी आहे. हा विद्यमान साधनांना आम्ही समर्थन देण्याच्या मार्गांपैकी एक आहे.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>भाषा</th>
    <th>क्लायंट</th>
    <th colspan="5">वैशिष्ट्य-क्लायंट्स (Supabase क्लायंटमध्ये एकत्रित)</th>
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
  <th colspan="7">⚡️ अधिकृत ⚡️</th>
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
    <td><a href="https://github.com/supabase/postgrest-dart" target="_blank" rel="noopener noreferrer">postgrest-dart</a></td>
    <td><a href="https://github.com/supabase/gotrue-dart" target="_blank" rel="noopener noreferrer">gotrue-dart</a></td>
    <td><a href="https://github.com/supabase/realtime-dart" target="_blank" rel="noopener noreferrer">realtime-dart</a></td>
    <td><a href="https://github.com/supabase/storage-dart" target="_blank" rel="noopener noreferrer">storage-dart</a></td>
    <td><a href="https://github.com/supabase/functions-dart" target="_blank" rel="noopener noreferrer">functions-dart</a></td>
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
  <th colspan="7">💚 समुदाय 💚</th>
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
</table>

## भाषांतर

- [भाषांतरांची यादी](/i18n/languages.md) <!--- Keep only this -->

---

## आमचे प्रायोजक

[![New Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)