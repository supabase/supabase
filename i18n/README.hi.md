<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) Firebase का एक ओपन-सोर्स विकल्प है। हम एंटरप्राइज़-ग्रेड ओपन-सोर्स टूल का उपयोग करके Firebase की सुविधाएं बना रहे हैं।

**मुख्य विशेषताएं:**

- [x] **प्रबंधित Postgres डेटाबेस:** [दस्तावेज़ीकरण](https://supabase.com/docs/guides/database)
- [x] **प्रमाणीकरण और प्राधिकरण:** [दस्तावेज़ीकरण](https://supabase.com/docs/guides/auth)
- [x] **स्वचालित रूप से जेनरेट किए गए API:**
    - [x] REST: [दस्तावेज़ीकरण](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [दस्तावेज़ीकरण](https://supabase.com/docs/guides/graphql)
    - [x] रीयलटाइम सदस्यताएँ: [दस्तावेज़ीकरण](https://supabase.com/docs/guides/realtime)
- [x] **कार्य:**
    - [x] डेटाबेस फ़ंक्शन: [दस्तावेज़ीकरण](https://supabase.com/docs/guides/database/functions)
    - [x] एज फ़ंक्शंस (नेटवर्क के किनारे पर कार्य): [दस्तावेज़ीकरण](https://supabase.com/docs/guides/functions)
- [x] **फ़ाइल संग्रहण:** [दस्तावेज़ीकरण](https://supabase.com/docs/guides/storage)
- [x] **AI, वेक्टर और एम्बेडिंग (embeddings) उपकरण:** [दस्तावेज़ीकरण](https://supabase.com/docs/guides/ai)
- [x] **डैशबोर्ड**

![Supabase डैशबोर्ड](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

महत्वपूर्ण अपडेट के बारे में सूचनाएं प्राप्त करने के लिए इस रिपॉजिटरी के "रिलीज़" की सदस्यता लें। यह आपको नवीनतम परिवर्तनों और सुधारों के बारे में सूचित रहने की अनुमति देगा।

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="रिपॉजिटरी देखें"/></kbd>

## दस्तावेज़ीकरण

पूर्ण दस्तावेज़ीकरण [supabase.com/docs](https://supabase.com/docs) पर उपलब्ध है। वहां आपको सभी आवश्यक गाइड और संदर्भ सामग्री मिलेगी।

यदि आप परियोजना के विकास में योगदान करना चाहते हैं, तो [आरंभ करना](./../DEVELOPERS.md) अनुभाग देखें।

## समुदाय और समर्थन

*   **सामुदायिक मंच:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). विकास में सहायता प्राप्त करने और डेटाबेस के साथ काम करने के सर्वोत्तम तरीकों पर चर्चा करने के लिए आदर्श।
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Supabase का उपयोग करते समय आपके सामने आने वाली त्रुटियों और समस्याओं की रिपोर्ट करने के लिए उपयोग करें।
*   **ईमेल समर्थन:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). आपके डेटाबेस या बुनियादी ढांचे की समस्याओं को हल करने के लिए सबसे अच्छा विकल्प।
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). अपने एप्लिकेशन साझा करने और समुदाय के साथ संवाद करने के लिए एक शानदार जगह।

## कार्य सिद्धांत

Supabase कई ओपन-सोर्स टूल्स को जोड़ता है। हम एंटरप्राइज़-ग्रेड, सिद्ध उत्पादों का उपयोग करके Firebase के समान सुविधाएँ बना रहे हैं। यदि कोई उपकरण या समुदाय मौजूद है और उसके पास MIT, Apache 2 या समान ओपन लाइसेंस है, तो हम उस उपकरण का उपयोग करेंगे और उसका समर्थन करेंगे। यदि ऐसा कोई उपकरण मौजूद नहीं है, तो हम उसे स्वयं बनाएंगे और उसका कोड ओपन सोर्स करेंगे। Supabase Firebase की सटीक प्रतिकृति नहीं है। हमारा लक्ष्य डेवलपर्स को ओपन-सोर्स टूल्स का उपयोग करके Firebase के समान सुविधा प्रदान करना है।

**आर्किटेक्चर**

Supabase एक [प्रबंधित प्लेटफ़ॉर्म](https://supabase.com/dashboard) है। आप साइन अप कर सकते हैं और बिना कुछ इंस्टॉल किए तुरंत Supabase का उपयोग शुरू कर सकते हैं। आप [अपने स्वयं के बुनियादी ढांचे को तैनात कर सकते हैं](https://supabase.com/docs/guides/hosting/overview) और [स्थानीय रूप से विकास कर सकते हैं](https://supabase.com/docs/guides/local-development)।

![आर्किटेक्चर](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** 30 से अधिक वर्षों के सक्रिय विकास के इतिहास के साथ एक ऑब्जेक्ट-रिलेशनल डेटाबेस सिस्टम। यह अपनी विश्वसनीयता, कार्यक्षमता और प्रदर्शन के लिए जाना जाता है।
*   **Realtime:** एक Elixir सर्वर जो आपको वेबसॉकेट्स के माध्यम से PostgreSQL में परिवर्तन (सम्मिलन, अपडेट और डिलीट) सुनने की अनुमति देता है। Realtime Postgres की बिल्ट-इन रेप्लिकेशन कार्यक्षमता का उपयोग करता है, परिवर्तनों को JSON में परिवर्तित करता है, और उन्हें अधिकृत क्लाइंट को भेजता है।
*   **PostgREST:** एक वेब सर्वर जो आपके PostgreSQL डेटाबेस को RESTful API में बदल देता है।
*   **GoTrue:** उपयोगकर्ताओं को प्रबंधित करने और JWT टोकन जारी करने के लिए JWT-आधारित API।
*   **Storage:** S3 में संग्रहीत फ़ाइलों के प्रबंधन के लिए एक RESTful इंटरफ़ेस प्रदान करता है, अनुमतियों के प्रबंधन के लिए Postgres का उपयोग करता है।
*   **pg_graphql:** PostgreSQL एक्सटेंशन जो GraphQL API प्रदान करता है।
*   **postgres-meta:** आपके Postgres को प्रबंधित करने के लिए एक RESTful API, जो आपको टेबल प्राप्त करने, भूमिकाएँ जोड़ने, क्वेरी चलाने आदि की अनुमति देता है।
*   **Kong:** एक क्लाउड-नेटिव API गेटवे।

#### क्लाइंट लाइब्रेरी

हम क्लाइंट लाइब्रेरी के लिए एक मॉड्यूलर दृष्टिकोण का उपयोग करते हैं। प्रत्येक उप-लाइब्रेरी को एक एकल बाहरी प्रणाली के साथ काम करने के लिए डिज़ाइन किया गया है। यह मौजूदा उपकरणों का समर्थन करने के तरीकों में से एक है।

(मूल तालिका जैसी क्लाइंट लाइब्रेरी वाली तालिका, लेकिन हिंदी नामों और आवश्यक स्पष्टीकरणों के साथ)।

| भाषा                       | क्लाइंट Supabase                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️आधिकारिक⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚समुदाय द्वारा समर्थित💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## बैज (Badges)

आप इन बैज का उपयोग यह दिखाने के लिए कर सकते हैं कि आपका एप्लिकेशन Supabase के साथ बनाया गया है:

**हल्का:**

![Supabase के साथ बनाया गया](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Supabase के साथ बनाया गया](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Supabase के साथ बनाया गया" />
</a>
```

**गहरा:**

![Supabase के साथ बनाया गया (गहरा संस्करण)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Supabase के साथ बनाया गया](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Supabase के साथ बनाया गया" />
</a>
```

## अनुवाद

[अनुवादों की सूची](./languages.md)
