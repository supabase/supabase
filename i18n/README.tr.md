<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com), Firebase'e açık kaynaklı bir alternatiftir. Kurumsal düzeyde açık kaynaklı araçlar kullanarak Firebase'in özelliklerini inşa ediyoruz.

**Temel Özellikler:**

- [x] **Yönetilen Postgres Veritabanı:** [Belgeler](https://supabase.com/docs/guides/database)
- [x] **Kimlik Doğrulama ve Yetkilendirme:** [Belgeler](https://supabase.com/docs/guides/auth)
- [x] **Otomatik Oluşturulan API'ler:**
    - [x] REST: [Belgeler](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Belgeler](https://supabase.com/docs/guides/graphql)
    - [x] Gerçek Zamanlı Abonelikler: [Belgeler](https://supabase.com/docs/guides/realtime)
- [x] **Fonksiyonlar:**
    - [x] Veritabanı Fonksiyonları: [Belgeler](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Fonksiyonları (Ağın ucundaki fonksiyonlar): [Belgeler](https://supabase.com/docs/guides/functions)
- [x] **Dosya Depolama:** [Belgeler](https://supabase.com/docs/guides/storage)
- [x] **Yapay Zeka, Vektörler ve Gömme İşlemleri (Embeddings) ile Çalışmak için Araçlar:** [Belgeler](https://supabase.com/docs/guides/ai)
- [x] **Kontrol Paneli**

![Supabase Kontrol Paneli](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Önemli güncellemelerden haberdar olmak için bu deponun "releases" (yayınlar) bölümüne abone olun. Bu, en son değişiklikler ve iyileştirmeler hakkında bilgi sahibi olmanızı sağlar.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Depoyu takip et"/></kbd>

## Belgeler

Tüm belgeler [supabase.com/docs](https://supabase.com/docs) adresinde mevcuttur. Orada gerekli tüm kılavuzları ve referans materyallerini bulabilirsiniz.

Projenin gelişimine katkıda bulunmak isterseniz, [Başlarken](./../DEVELOPERS.md) bölümüne bakın.

## Topluluk ve Destek

*   **Topluluk Forumu:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Geliştirme konusunda yardım almak ve veritabanlarıyla çalışmanın en iyi uygulamalarını tartışmak için idealdir.
*   **GitHub Sorunları:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Supabase kullanırken karşılaştığınız hataları ve sorunları bildirmek için kullanın.
*   **E-posta Desteği:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). Veritabanınız veya altyapınızla ilgili sorunları çözmek için en iyi seçenektir.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Uygulamalarınızı paylaşmak ve toplulukla sosyalleşmek için harika bir yer.

## Nasıl Çalışır

Supabase, birkaç açık kaynaklı aracı bir araya getirir. Kanıtlanmış, kurumsal düzeyde ürünler kullanarak Firebase'e benzer özellikler inşa ediyoruz. Araç veya topluluk mevcutsa ve MIT, Apache 2 veya benzeri bir açık lisansa sahipse, o aracı kullanacak ve destekleyeceğiz. Böyle bir araç yoksa, kendimiz oluşturacak ve kaynak kodunu açacağız. Supabase, Firebase'in tam bir kopyası değildir. Amacımız, geliştiricilere Firebase ile karşılaştırılabilir bir rahatlık sağlamak, ancak açık kaynaklı araçlar kullanmaktır.

**Mimari**

Supabase [yönetilen bir platformdur](https://supabase.com/dashboard). Herhangi bir şey yüklemenize gerek kalmadan kaydolabilir ve Supabase'i hemen kullanmaya başlayabilirsiniz. Ayrıca [kendi altyapınızı kurabilir](https://supabase.com/docs/guides/hosting/overview) ve [yerel olarak geliştirebilirsiniz](https://supabase.com/docs/guides/local-development).

![Mimari](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** 30 yılı aşkın aktif geliştirme geçmişine sahip bir nesne-ilişkisel veritabanı sistemi. Güvenilirliği, işlevselliği ve performansıyla bilinir.
*   **Realtime:** Web soketleri aracılığıyla PostgreSQL'deki değişiklikleri (eklemeler, güncellemeler ve silmeler) dinlemenizi sağlayan Elixir üzerinde bir sunucu. Realtime, Postgres'in yerleşik çoğaltma işlevini kullanır, değişiklikleri JSON'a dönüştürür ve yetkilendirilmiş istemcilere iletir.
*   **PostgREST:** PostgreSQL veritabanınızı bir RESTful API'ye dönüştüren bir web sunucusu.
*   **GoTrue:** Kullanıcıları yönetmek ve JWT belirteçleri vermek için JWT tabanlı bir API.
*   **Storage:** İzinleri yönetmek için Postgres'i kullanarak S3'te depolanan dosyaları yönetmek için bir RESTful arayüz sağlar.
*   **pg_graphql:** Bir GraphQL API'si sağlayan bir PostgreSQL uzantısı.
*   **postgres-meta:** Postgres'inizi yönetmek için bir RESTful API, tabloları almanıza, rol eklemenize, sorguları çalıştırmanıza vb. olanak tanır.
*   **Kong:** Bulut tabanlı bir API ağ geçidi.

#### İstemci Kitaplıkları

İstemci kitaplıklarına modüler bir yaklaşım kullanıyoruz. Her alt kitaplık, tek bir harici sistemle çalışmak üzere tasarlanmıştır. Bu, mevcut araçları desteklemenin yollarından biridir.

(İstemci kitaplıkları ile tablo, orijinaldeki gibi, ancak Türkçe adlar ve açıklamalarla, gerektiği yerlerde.)

| Dil                         | Supabase İstemcisi                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Resmi⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Topluluk Tarafından Desteklenen💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Rozetler (Badges)

Uygulamanızın Supabase ile oluşturulduğunu göstermek için bu rozetleri kullanabilirsiniz:

**Açık:**

![Supabase ile Yapıldı](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Supabase ile Yapıldı](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Supabase ile Yapıldı" />
</a>
```

**Koyu:**

![Supabase ile Yapıldı (koyu versiyon)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Supabase ile Yapıldı](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Supabase ile Yapıldı" />
</a>
```

## Çeviriler

[Çeviri listesi](./languages.md)
