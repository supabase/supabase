<p align="center">
  <img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/web/static/supabase-light-rounded-corner-background.svg"/>
</p>

---

# Supabase

[सुपबेस](https://supabase.io) एक खुला स्रोत फायरबेस विकल्प है। हम एंटरप्राइज़-ग्रेड ओपन सोर्स टूल का उपयोग करके फायरबेस की सुविधाओं का निर्माण कर रहे हैं।

- [x] होस्टेड पोस्टग्रेज डेटाबेस
- [x] रीयलटाइम सदस्यता
- [x] सत्यापन और प्राधिकरण
- [x] स्वतः जनरेट किए गए API
- [x] डैशबोर्ड
- [x] भंडारण
- [ ] कार्यों (जल्द आ रहा है)

## प्रलेखन

पूर्ण प्रलेखन के लिए, [supabase.io/docs](https://supabase.io/docs) पर जाएँ

## सामुदायिक तथा सहयोग

- [सामुदायिक मंच](https://github.com/supabase/supabase/discussions). सर्वोत्कृष्ट: निर्माण करने में मदद, डेटाबेस सर्वोत्तम प्रथाओं के बारे में चर्चा।
- [गिटहब मुद्दे](https://github.com/supabase/supabase/issues). सर्वोत्कृष्ट: दोष और त्रुटियां जो आप का सामना कर रहे हैं Supabase।
- [ई-मेल समर्थन](https://supabase.io/docs/support#business-support). सर्वोत्कृष्ट: आपके डेटाबेस या आधारिक संरचना के साथ समस्याएं।

## स्थिति

- [x] अल्फा: हम चुनिंदा ग्राहकों के साथ सुपरबास का परीक्षण कर रहे हैं
- [x] सार्वजनिक अल्फा: कोई भी [app.supabase.io](https://app.supabase.io) के जरिए शामिल हो सकता है। लेकिन हम पर आसान हो जाओ, कुछ मोड़ हैं।
- [x] सार्वजनिक बीटा: अधिकांश गैर-एंटरप्राइज़ उपयोग-मामलों के लिए पर्याप्त स्थिर
- [ ] सार्वजनिक: उत्पादन-तैयार

हम इस समय सार्वजनिक बीटा में हैं। प्रमुख अद्यतन की सूचना पाने के लिए इस रेपो का "रिलीज़" देखें।

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="इस रेपो को देखें"/></kbd>

---

## यह किस प्रकार काम करता है

सुपबेस ओपन सोर्स टूल्स का एक संयोजन है। हम एंटरप्राइज़-ग्रेड, ओपन सोर्स उत्पादों का उपयोग करके फायरबेस की सुविधाओं का निर्माण कर रहे हैं। यदि उपकरण और समुदाय मौजूद हैं, तो MIT, Apache 2 या समकक्ष ओपन लाइसेंस के साथ, हम उस टूल का उपयोग और समर्थन करेंगे। यदि उपकरण मौजूद नहीं है, तो हम इसे स्वयं बनाते हैं और स्रोत खोलते हैं। सुपबेस फायरबेस की 1 से 1 मैपिंग नहीं है। हमारा उद्देश्य डेवलपर्स को ओपन सोर्स टूल्स का उपयोग करके फायरबेस जैसा डेवलपर अनुभव देना है।

**वर्तमान वास्तुकला**

सुपबेस [होस्टेड प्लेटफार्म](https://app.supabase.io). आप साइन अप कर सकते हैं और कुछ भी स्थापित किए बिना सुपबेस का उपयोग करना शुरू कर सकते हैं। हम अभी भी स्थानीय विकास का अनुभव पैदा कर रहे हैं - यह अब मंच स्थिरता के साथ-साथ हमारा मुख्य फोकस है।

![आर्किटेक्चर](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/) 30 से अधिक वर्षों के सक्रिय विकास के साथ एक वस्तु-संबंधपरक डेटाबेस प्रणाली है जिसने इसे विश्वसनीयता, सुविधा मजबूती और प्रदर्शन के लिए एक मजबूत प्रतिष्ठा अर्जित की है।
- [Realtime](https://github.com/supabase/realtime) एक एलिक्जिर सर्वर है जो आपको पोस्टग्रॉसीक्यूएल आवेषण, अपडेट्स को सुनने की अनुमति देता है और वेबसोकेट का उपयोग करके हटाता है। सुपबेस पोस्टग्रेज की अंतर्निहित प्रतिकृति कार्यक्षमता को सुनता है, प्रतिकृति बाइट स्ट्रीम को JSON में परिवर्तित करता है, फिर JSON को वेबस्कॉक पर प्रसारित करता है।
- [PostgREST](http://postgrest.org/) एक वेब सर्वर है जो आपके पोस्टग्रेससीक्यूएल डेटाबेस को सीधे RESTful एपीआई में बदल देता है
- [Storage](https://github.com/supabase/storage-api) अनुमतियाँ प्रबंधित करने के लिए पोस्टग्रेस का उपयोग करके S3 में संग्रहीत फ़ाइलों के प्रबंधन के लिए एक RESTful इंटरफ़ेस प्रदान करता है।
- [postgres-meta](https://github.com/supabase/postgres-meta) आपके पोस्टग्रेज के प्रबंधन के लिए एक RESTful एपीआई है, जिससे आप टेबल प्राप्त कर सकते हैं, भूमिकाएँ जोड़ सकते हैं और क्वेरीज़ आदि चला सकते हैं।
- [GoTrue](https://github.com/netlify/gotrue) उपयोगकर्ताओं को प्रबंधित करने और SWT टोकन जारी करने के लिए एक SWT आधारित एपीआई है।
- [Kong](https://github.com/Kong/kong) एक क्लाउड-नेटिव एपीआई गेटवे है।

#### ग्राहक पुस्तकालय

हमारे ग्राहक पुस्तकालय मॉड्यूलर है। प्रत्येक उप-पुस्तकालय एकल बाह्य प्रणाली के लिए एक स्टैंडअलोन कार्यान्वयन है। यह उन तरीकों में से एक है जो हम मौजूदा उपकरणों का समर्थन करते हैं।

- **`supabase-{lang}`**: पुस्तकालयों को जोड़ता है और संवर्धन को जोड़ता है।
  - `postgrest-{lang}`: ग्राहक पुस्तकालय के साथ काम करने के लिए [PostgREST](https://github.com/postgrest/postgrest)
  - `realtime-{lang}`: ग्राहक पुस्तकालय के साथ काम करने के लिए [Realtime](https://github.com/supabase/realtime)
  - `gotrue-{lang}`: ग्राहक पुस्तकालय के साथ काम करने के लिए [GoTrue](https://github.com/netlify/gotrue)

| Repo                  | आधिकारिक                                         | समुदाय                                                                                                                                                                                                                     |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust`                                                |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust`                                                |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust`                                                      |

<!--- Remove this list if you're traslating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## अनुवाद

- [अनुवाद की सूची](/i18n/languages.md) <!--- Keep only the this-->

---

## प्रायोजकों

[![नया प्रायोजक](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
