<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# सुपाबेस

[सुपाबेस](https://supabase.com) एक खुल्ला स्रोत फायरबेस विकल्प हो। हामीले यसमा उद्यम-ग्रेडका खुल्ला स्रोत उपकरणहरू प्रयोग गरेर फायरबेसका सुविधाहरू निर्माण गर्दैछौं।

- [x] होस्ट गरिएको Postgres डाटाबेस
- [x] रियलटाइम सदस्यताहरू
- [x] प्रमाणीकरण र प्राधिकरण
- [x] स्वतः गर्न सकिने API हरु
- [x] ड्यासबोर्ड
- [x] भण्डारण
- [x] प्रकार्यहरू

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## कागजात

पूर्ण कागजातको लागि [supabase.com/docs](https://supabase.com/docs) मा जानुहोस्

## समुदाय र समर्थन सहयोग

- [सामुदायिक फोरम](https://github.com/supabase/supabase/discussions)। सर्वोत्कृष्ट: निर्माणको साथ मद्दत, डाटाबेसको उत्तम अभ्यासहरूको बारेमा छलफलको लागि।
- [गिटहब मुद्दाहरू](https://github.com/supabase/supabase/issues)। सर्वोत्कृष्ट: प्रयोग गर्दा फेला परेका बग र त्रुटिहरूको लागि।
- [ई-मेल समर्थन](https://supabase.com/docs/support#business-support)। सर्वोत्कृष्ट: तपाईंको डाटाबेस वा पूर्वाधारको समस्याहरूको लागि।

## स्थिति

- [x] अल्फा: हामी ग्राहकहरु को एक सानो समूह संग सुपाबेस परीक्षण गर्दैछौं।
- [x] सार्वजनिक अल्फा: सबैले [supabase.com/dashboard](https://supabase.com/dashboard) मा साइनअप गर्न सक्दछन्। तर तपाईं केहि अवरोधहरू प्राप्त गर्न सक्नुहुन्छ।
- [x] सार्वजनिक बीटा: अधिकतर गैर-उद्यम प्रयोगका मामलाहरुका लागि पर्याप्त स्थिर।
- [ ] सार्वजनिक: उत्पादन प्रयोगको लागि तयार।

हामी हाल सार्वजनिक बिटामा छौं। प्रमुख अद्यावधिकहरूको सूचना प्राप्त गर्न यस रेपोको "रिलिजहरू"मा हेर्नुहोस्।

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="यो रिपोलाई हेरौ"/></kbd>

---

## यो कसरी काम गर्दछ

सुपाबेस एक खुल्ला स्रोत उपकरणहरूको संयोजन हो। हामी उद्यम-ग्रेड, खुल्ला स्रोत उत्पादनहरू प्रयोग गरेर फायरबेसको सुविधाहरू निर्माण गर्दैछौं। यदि उपकरण र समुदायहरू एमआईटी, अपाचे २ वा बराबरका खुल्ला लाइसेन्सको साथ अवस्थित छन् भने हामी त्यसको प्रयोग र समर्थन गर्दछौं। यदि उपकरण अवस्थित छैन भने, हामी त्यसलाई आफैं सिर्जना गर्छौं र स्रोत खुल्ला गर्छौ । सुपाबेस फायरबेसको १ देखि १ म्यापि होईन। हाम्रो उद्देश्य भनेको विकासकर्ताहरूलाई खुल्ला-स्रोत उपकरणहरू प्रयोग गरेर फायरबेस जस्तो अनुभव दिने हो।

**वर्तमान योजना**

सुपाबेस एक [होस्ट गरिएको प्लेटफर्म](https://supabase.com/dashboard) हो। तपाई आफै साइन अप गर्न सक्नुहुन्छ र कुनै स्थापना बिना सुपाबेस प्रयोग गर्न सक्नुहुन्छ। हामी अझै स्थानीय विकासको अनुभव सिर्जना गर्दैछौं। यो प्लेटफर्म स्थिरताको साथ हाम्रो मूल फोकस हो।

![आर्किटेक्चर](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.svg)

- [PostgreSQL](https://www.postgresql.org/) एक वस्तु-रिलेशनल डाटाबेस प्रणाली हो जसले ३० बर्ष भन्दा बढी सक्रिय विकासको साथ विश्वसनीयता, सुविधा मजबूती र प्रदर्शनको बलियो प्रतिष्ठा कमाएको छ।
- [Realtime](https://github.com/supabase/realtime) एक Elixer सर्भर हो जसले तपाइँलाई वेबसकेटहरू प्रयोग गरेर PostgreSQL इन्सर्टहरू, अपडेटहरु, र डिलीटहरु सुन्न अनुमति दिन्छ। सुपाबेसले पोष्टग्रेसको भित्र निर्मित प्रतिकृति कार्यक्षमता सुन्दछ, प्रतिकृति बाइट स्ट्रिमलाई JSON मा रूपान्तरण गर्दछ, र त्यसपछि JSON लाई वेबसकेटमा प्रसारण गर्दछ।।
- [PostgREST](http://postgrest.org/) एक वेब सर्वर हो जसले तपाईको PostgreSQL डाटाबेसलाई सीधा एक RESTful एपीआई मा बदल्छ।
- [Storage](https://github.com/supabase/storage-api) ले अनुमतिहरू प्रबन्ध गर्न पोष्टग्रेस प्रयोग गरेर S3 मा भण्डारित फाइलहरू प्रबन्ध गर्नका लागि RESTful ईन्टरफेस प्रदान गर्दछ।
- [postgres-meta](https://github.com/supabase/postgres-meta) तपाईंको Postgres प्रबन्धको लागि RESTful एपीआई हो जसले तपाईंलाई टेबुलहरू प्राप्त गर्न, भूमिकाहरू थप्न र प्रश्नहरू चलाउन र अधिकको लागि अनुमति दिन्छ।
- [GoTrue](https://github.com/netlify/gotrue) प्रयोगकर्ताहरू प्रबन्ध गर्न र JWT टोकनहरू जारी गर्नका लागि एक JWT आधारित एपीआई हो।
- [Kong](https://github.com/Kong/kong) एक क्लाउड नेटिभ एपीआई गेटवे हो।

#### ग्राहक पुस्तकालयहरू

हाम्रो ग्राहक पुस्तकालय मोडुलर छ। प्रत्येक उप-लाइब्रेरी एकल बाह्य प्रणालीको लागि स्ट्यान्डअलोन कार्यान्वयन हो। यो धेरै तरिकाहरू मध्ये एक हो जुन हामी अवस्थित उपकरणहरूलाई समर्थन गर्दछौं।

- **`supabase-{lang}`**: लाइब्रेरी संयोजन र संवर्धन थप गर्दछ।
  - `postgrest-{lang}`: ग्राहक पुस्तकालय [PostgREST](https://github.com/postgrest/postgrest) को साथ काम गर्न
  - `realtime-{lang}`: ग्राहक पुस्तकालय [Realtime](https://github.com/supabase/realtime) को साथ काम गर्न
  - `gotrue-{lang}`: ग्राहक पुस्तकालय [GoTrue](https://github.com/netlify/gotrue) को साथ काम गर्न

| Repo                  | आधिकारिक                                         | समुदाय                                                                                                                                                                                                                     |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Flutter`](https://github.com/supabase/supabase-flutter) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust`                                          |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust`                                                |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust`                                                      |

<!--- Remove this list if you're traslating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## अनुवाद

- [अनुवादहरूको सूची](/i18n/languages.md) <!--- Keep only the this-->

---

## प्रायोजकहरू

[![नयाँ प्रायोजक](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
