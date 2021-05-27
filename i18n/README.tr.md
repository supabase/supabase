<p align="center">
  <img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/web/static/supabase-light-rounded-corner-background.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io) açık kaynaklı bir Firebase alternatifidir. Firebase'in özelliklerini kurumsal düzeyde açık kaynak araçları kullanarak oluşturuyoruz.

- [x] Barındırılan Postgres Veritabanı
- [x] Gerçek zamanlı abonelikler
- [x] Kimlik doğrulama ve yetkilendirme
- [x] Otomatik oluşturulan API'ler
- [x] Gösterge Paneli
- [x] Depolama
- [ ] Fonksiyonlar (Çok yakında)

## Dokümantasyon

Tam dokümantasyon için, ziyaret et [supabase.io/docs](https://supabase.io/docs)

## Topluluk & Destek

- [Topluluk Forumu](https://github.com/supabase/supabase/discussions). Şunun için en iyisi: yapı ile ilgili yardım, veritabanı için en iyi pratikleri tartışmak.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Şunun için en iyisi: Supabase kullanırken karşılaştığınız problem ve hatalar.
- [Email Desteği](https://supabase.io/docs/support#business-support). Şunun için en iyisi:
  veritabanınız veya altyapınızla ilgili sorunlar.

## Durum

- [x] Alfa: Supabase'i kapalı bir müşteri grubuyla test ediyoruz
- [x] Herkese Açık Alfa: [app.supabase.io](https://app.supabase.io) adresinden herkes kaydolabilir. Ama anlayış gösterin, birkaç karışıklık var.
- [x] Herkese Açık Beta: Kurumsal olmayan çoğu kullanım durumu için yeterince kararlı
- [ ] Herkese açık: Üretime hazır

Şu anda Herkese Açık Beta sürümündeyiz. Önemli güncellemelerden haberdar olmak için bu deponun "sürümlerini" izleyin.

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Nasıl Çalışır

Supabase, açık kaynaklı araçların bir kombinasyonudur. Firebase'in özelliklerini kurumsal sınıf, açık kaynaklı ürünler kullanarak oluşturuyoruz. Araçlar ve topluluklar bir MIT, Apache 2 veya eşdeğer bir açık lisansla mevcutsa, bu aracı kullanacak ve destekleyeceğiz. Araç mevcut değilse, onu kendimiz oluşturur ve açarız. Supabase, Firebase'in 1'e 1 eşlemesi değildir. Amacımız, geliştiricilere açık kaynak araçları kullanarak Firebase benzeri bir geliştirici deneyimi sunmaktır.

**Güncel Mimari**

Supabase [barındırılan bir platformdur](https://app.supabase.io). Hiçbir şey yüklemeden Supabase'e kaydolabilir ve kullanmaya başlayabilirsiniz. Hala yerel geliştirme deneyimini yaratıyoruz - bu, artık platform kararlılığı ile birlikte temel odak noktamız.

![Architecture](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/) güvenilirlik, özellik sağlamlığı ve performans açısından güçlü bir üne kavuşan 30 yılı aşkın aktif geliştirmeye sahip bir nesne ilişkisel veritabanı sistemidir.
- [Realtime](https://github.com/supabase/realtime) Web soketleri kullanarak PostgreSQL eklerini, güncellemelerini ve silmelerini dinlemenizi sağlayan bir Elixir sunucusudur. Supabase, Postgres'in yerleşik çoğaltma işlevini dinler, çoğaltma bayt akışını JSON'a dönüştürür ve ardından JSON'yi web yuvaları üzerinden yayınlar.
- [PostgREST](http://postgrest.org/) PostgreSQL veritabanınızı doğrudan bir RESTful API'ye dönüştüren bir web sunucusudur.
- [Storage](https://github.com/supabase/storage-api) , izinleri yönetmek için Postgres kullanarak S3'te depolanan Dosyaları yönetmek için RESTful bir arayüz sağlar.
- [postgres-meta](https://github.com/supabase/postgres-meta) Postgres'inizi yönetmeye yarayan RESTful bir API'dir ve tabloları getirmenize, roller eklemenize ve sorgu çalıştırmanıza vb. izin verir.
- [GoTrue](https://github.com/netlify/gotrue) kullanıcıları yönetmek ve SWT belirteçleri vermek için SWT tabanlı bir API'dir.
- [Kong](https://github.com/Kong/kong) bulutta yerel bir API ağ geçididir.

#### İstemci kitaplıkları

Müşteri kitaplığımız modülerdir. Her bir alt kütüphane, tek bir harici sistem için bağımsız bir uygulamadır. Bu, mevcut araçları desteklememizin yollarından biridir.

- **`supabase-{lang}`**: Kitaplıkları birleştirir ve zenginleştirmeler ekler.
  - `postgrest-{lang}`: [PostgREST](https://github.com/postgrest/postgrest) ile çalışmak için istemci kitaplığı
  - `realtime-{lang}`: [Realtime](https://github.com/supabase/realtime) ile çalışmak için istemci kitaplığı
  - `gotrue-{lang}`: [GoTrue](https://github.com/netlify/gotrue) ile çalışmak için istemci kitaplığı

| Depo                  | Resmi                                            | Topluluk                                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust`                                                |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust`                                                |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust`                                                      |

<!--- Remove this list if you're traslating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## Çeviriler

- [Çeviriler](/i18n/languages.md) <!--- Keep only the this-->

---

## Sponsorlar

[![New Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
