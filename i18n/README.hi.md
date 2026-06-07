<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[सुपाबेस](https://supabase.com) एक ओपन सोर्स फ़ाायरबेस विकल्प है। हम एंटरप्राइज़-गुणवत्ता ओपन सोर्स सॉफ़्टवेयर उपकरण का उपयोग करके फ़ाायरबेस की सुविधाओं का निर्माण कर रहे हैं।

- [x] होस्टेड पोस्टग्रेज डेटाबेस। [प्रलेखन](https://supabase.com/docs/guides/database)
- [x] प्रमाणीकरण और प्राधिकरण। [प्रलेखन](https://supabase.com/docs/guides/auth)
- [x] उत्पन्न एपीआईस।
  - [x] रेस्ट। [प्रलेखन](https://supabase.com/docs/guides/api#rest-api-overview)
  - [x] रीयलटाइम सदस्यता। [प्रलेखन](https://supabase.com/docs/guides/api#realtime-api-overview)
  - [x] ग्राफ़क्यूएल (प्रयोगात्मक)। [प्रलेखन](https://supabase.com/docs/guides/api#graphql-api-overview)
- [x] फ़ंक्शंस।
  - [x] डेटाबेस फ़ंक्शंस। [प्रलेखन](https://supabase.com/docs/guides/database/functions)
  - [x] एज फ़ंक्शंस। [प्रलेखन](https://supabase.com/docs/guides/functions)
- [x] भंडारण। [प्रलेखन](https://supabase.com/docs/guides/storage)
- [x] AI + वेक्टर/एम्बेडिंग टूलकिट। [प्रलेखन](https://supabase.com/docs/guides/ai)
- [x] डैशबोर्ड।

![सुपाबेस का डैशबोर्ड।](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

ज़रूरी अपडेट्स की जानकारी पाने के लिए इस रिपो के "releases" देखें।

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="इस रेपो को देखें"/></kbd>

## प्रलेखन

पूर्ण प्रलेखन के लिए, [supabase.com/docs](https://supabase.com/docs) पर जाएँ

योगदान करने के लिए, [गेट्टिंग स्टार्टेड](../DEVELOPERS.md) पेज पर जाएँ

## समुदाय तथा समर्थन

- [सामुदायिक मंच](https://github.com/supabase/supabase/discussions)। निर्माण में मदद और डेटाबेस की सर्वोत्तम प्रथाओं के बारे में चर्चा के लिए उचित है।
- [गिटहब इश्यूस](https://github.com/supabase/supabase/issues)। सुपाबेस का उपयोग करते समय बग्स​ और त्रुटियां के लिए उचित है।
- [ई-मेल समर्थन](https://supabase.com/docs/support#business-support)। आपके डेटाबेस और इंफ़्रास्ट्रक्चर के साथ समस्याएं के लिए उचित है।
- [डिस्कॉर्ड](https://discord.supabase.com/)। अपने प्रोजेक्ट्स शेयर करने के लिए और हमारी सुपाबेस समुदाय के साथ बातचीत करने के लिए उचित है।

## यह किस प्रकार काम करता है

सुपाबेस ओपन सोर्स टूल्स का एक संयोजन है। हम एंटरप्राइज़-ग्रेड, ओपन सोर्स उत्पादों का उपयोग करके फायरबेस की सुविधाओं का निर्माण कर रहे हैं। यदि उपकरण और समुदाय मौजूद हैं, तो MIT, Apache 2 या समकक्ष ओपन लाइसेंस के साथ, हम उस टूल का उपयोग और समर्थन करेंगे। यदि उपकरण मौजूद नहीं है, तो हम इसे स्वयं बनाते हैं और स्रोत खोलते हैं। सुपाबेस फ़ायरबेस की १ से १ मैपिंग नहीं है। हमारा उद्देश्य डेवलपर्स को ओपन सोर्स टूल्स का उपयोग करके फायरबेस जैसा डेवलपर अनुभव देना है।

**वर्तमान वास्तुकला**

Supabase एक [होस्टेड प्लेटफ़ॉर्म](https://supabase.com/dashboard) है। आप बिना कुछ इंस्टॉल किए साइन अप करके Supabase का इस्तेमाल शुरू कर सकते हैं।
आप इसे [सेल्फ़-होस्ट](https://supabase.com/docs/guides/hosting/overview) भी कर सकते हैं और [लोकल तौर पर डेवलप](https://supabase.com/docs/guides/local-development) भी कर सकते हैं।

![आर्किटेक्चर](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.svg)

- [Postgres](https://www.postgresql.org/) यह एक ऑब्जेक्ट-रिलेशनल डेटाबेस सिस्टम है, जिस पर 30 से ज़्यादा सालों से लगातार काम हो रहा है। इसी वजह से इसे भरोसेमंद होने, बेहतरीन फ़ीचर्स और शानदार परफ़ॉर्मेंस के लिए बहुत अच्छी पहचान मिली है।
- [Realtime](https://github.com/supabase/realtime) एक एलिक्जिर सर्वर है जो आपको पोस्टग्रॉसीक्यूएल आवेषण, अपडेट्स को सुनने की अनुमति देता है और वेबसोकेट का उपयोग करके हटाता है। सुपाबेस पोस्टग्रेज की अंतर्निहित प्रतिकृति कार्यक्षमता को सुनता है, प्रतिकृति बाइट स्ट्रीम को JSON में परिवर्तित करता है, फिर JSON को वेबस्कॉक पर प्रसारित करता है।
- [PostgREST](http://postgrest.org/) एक वेब सर्वर है जो आपके पोस्टग्रेससीक्यूएल डेटाबेस को सीधे RESTful एपीआई में बदल देता है
- [GoTrue](https://github.com/supabase/gotrue) यह एक JWT-आधारित ऑथेंटिकेशन API है जो आपके एप्लिकेशन में यूज़र साइन-अप, लॉगिन और सेशन मैनेजमेंट को आसान बनाता है।
- [Storage](https://github.com/supabase/storage-api) अनुमतियाँ प्रबंधित करने के लिए पोस्टग्रेस का उपयोग करके S3 में संग्रहीत फ़ाइलों के प्रबंधन के लिए एक RESTful इंटरफ़ेस प्रदान करता है।
- [pg_graphql](http://github.com/supabase/pg_graphql/) एक PostgreSQL एक्सटेंशन जो GraphQL API उपलब्ध कराता है।
- [postgres-meta](https://github.com/supabase/postgres-meta) यह आपके Postgres को मैनेज करने के लिए एक RESTful API है, जिससे आप टेबल फ़ेच कर सकते हैं, रोल जोड़ सकते हैं और क्वेरी चला सकते हैं, वगैरह।
- [Kong](https://github.com/Kong/kong) एक क्लाउड-नेटिव एपीआई गेटवे है।

#### मुवक्किल लाइब्रेरीज़

हमारी सारी क्लाइंट लिब्ररियाँ मॉड्यूलर है। प्रत्येक उप-पुस्तकालय एक बाहरी प्रणाली के लिए एक स्टैंडअलोन कार्यान्वयन है। यह उन तरीकों में से एक है जिससे हम मौजूदा सॉफ़्टवेयर उपकारों का समर्थन करते हैं।

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>प्रोग्रामिंग भाषा</th>
    <th>क्लाइंट</th>
    <th colspan="5">फ़ीचर क्लाइंट (सुपाबेस क्लाइंट में बंडल)</th>
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
  <th colspan="7">⚡️ ऑफ़िशियल ⚡️</th>
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
  <!-- /notranslate -->
</table>

## Badges (बिल्ला/बैज)

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

## अनुवाद

- [अनुवादों की सूची](/i18n/languages.md) <!--- Keep only this -->

---

## हमारे प्रायोजक

[![New Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
