<p align="center">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--light.svg#gh-light-mode-only">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--dark.svg#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) açık kaynaklı bir Firebase alternatifidir. Firebase'in özelliklerini kurumsal düzeyde açık kaynak araçları kullanarak oluşturuyoruz.

- [x] Barındırılan Postgres Veritabanı
- [x] Gerçek zamanlı abonelikler
- [x] Kimlik doğrulama ve yetkilendirme
- [x] Otomatik oluşturulan API'ler
- [x] Gösterge Paneli
- [x] Depolama
- [x] Fonksiyonlar

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## Dokümantasyon

Tam dokümantasyon için, ziyaret et [supabase.com/docs](https://supabase.com/docs)

## Topluluk & Destek

- [Topluluk Forumu](https://github.com/supabase/supabase/discussions). Şunun için en iyisi: yapı ile ilgili yardım, veritabanı için en iyi pratikleri tartışmak.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Şunun için en iyisi: Supabase kullanırken karşılaştığınız problem ve hatalar.
- [Email Desteği](https://supabase.com/docs/support#business-support). Şunun için en iyisi:
  veritabanınız veya altyapınızla ilgili sorunlar.

## Durum

- [x] Alfa: Supabase'i kapalı bir müşteri grubuyla test ediyoruz
- [x] Herkese Açık Alfa: [app.supabase.com](https://app.supabase.com) adresinden herkes kaydolabilir. Ama anlayış gösterin, birkaç karışıklık var.
- [x] Herkese Açık Beta: Kurumsal olmayan çoğu kullanım durumu için yeterince kararlı
- [ ] Herkese açık: Üretime hazır

Şu anda Herkese Açık Beta sürümündeyiz. Önemli güncellemelerden haberdar olmak için bu deponun "sürümlerini" izleyin.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Nasıl Çalışır

Supabase, açık kaynaklı araçların bir kombinasyonudur. Firebase'in özelliklerini kurumsal sınıf, açık kaynaklı ürünler kullanarak oluşturuyoruz. Araçlar ve topluluklar bir MIT, Apache 2 veya eşdeğer bir açık lisansla mevcutsa, bu aracı kullanacak ve destekleyeceğiz. Araç mevcut değilse, onu kendimiz oluşturur ve açarız. Supabase, Firebase'in 1'e 1 eşlemesi değildir. Amacımız, geliştiricilere açık kaynak araçları kullanarak Firebase benzeri bir geliştirici deneyimi sunmaktır.

**Güncel Mimari**

Supabase [barındırılan bir platformdur](https://app.supabase.com). Hiçbir şey yüklemeden Supabase'e kaydolabilir ve kullanmaya başlayabilirsiniz. Hala yerel geliştirme deneyimini yaratıyoruz - bu, artık platform kararlılığı ile birlikte temel odak noktamız.

![Architecture](https://user-images.githubusercontent.com/70828596/187547862-ffa9d058-0c3a-4851-a3e7-92ccfca4b596.png)

- [PostgreSQL](https://www.postgresql.org/) güvenilirlik, özellik sağlamlığı ve performans açısından güçlü bir üne kavuşan 30 yılı aşkın aktif geliştirmeye sahip bir nesne ilişkisel veritabanı sistemidir.
- [Realtime](https://github.com/supabase/realtime) Web soketleri kullanarak PostgreSQL eklerini, güncellemelerini ve silmelerini dinlemenizi sağlayan bir Elixir sunucusudur. Supabase, Postgres'in yerleşik çoğaltma işlevini dinler, çoğaltma bayt akışını JSON'a dönüştürür ve ardından JSON'yi web yuvaları üzerinden yayınlar.
- [PostgREST](http://postgrest.org/) PostgreSQL veritabanınızı doğrudan bir RESTful API'ye dönüştüren bir web sunucusudur.
- [Storage](https://github.com/supabase/storage-api) , izinleri yönetmek için Postgres kullanarak S3'te depolanan Dosyaları yönetmek için RESTful bir arayüz sağlar.
- [postgres-meta](https://github.com/supabase/postgres-meta) Postgres'inizi yönetmeye yarayan RESTful bir API'dir ve tabloları getirmenize, roller eklemenize ve sorgu çalıştırmanıza vb. izin verir.
- [GoTrue](https://github.com/netlify/gotrue) kullanıcıları yönetmek ve SWT belirteçleri vermek için SWT tabanlı bir API'dir.
- [Kong](https://github.com/Kong/kong) bulutta yerel bir API ağ geçididir.

#### İstemci kitaplıkları

Müşteri kitaplığımız modülerdir. Her bir alt kütüphane, tek bir harici sistem için bağımsız bir uygulamadır. Bu, mevcut araçları desteklememizin yollarından biridir.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>Dil</th>
    <th>İstemci</th>
    <th colspan="4">Özellik-İstemciler (Supabase istemcisinde paketlenmiştir)</th>
  </tr>
  <tr>
    <th></th>
    <th>Supabase</th>
    <th><a href="https://github.com/postgrest/postgrest" target="_blank" rel="noopener noreferrer">PostgREST</a></th>
    <th><a href="https://github.com/supabase/gotrue" target="_blank" rel="noopener noreferrer">GoTrue</a></th>
    <th><a href="https://github.com/supabase/realtime" target="_blank" rel="noopener noreferrer">Realtime</a></th>
    <th><a href="https://github.com/supabase/storage-api" target="_blank" rel="noopener noreferrer">Storage</a></th>
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
  <th colspan="6">⚡️ Resmi ⚡️</th>
  <tr>
    <td>JavaScript (TypeScript)</td>
    <td><a href="https://github.com/supabase/supabase-js" target="_blank" rel="noopener noreferrer">supabase-js</a></td>
    <td><a href="https://github.com/supabase/postgrest-js" target="_blank" rel="noopener noreferrer">postgrest-js</a></td>
    <td><a href="https://github.com/supabase/gotrue-js" target="_blank" rel="noopener noreferrer">gotrue-js</a></td>
    <td><a href="https://github.com/supabase/realtime-js" target="_blank" rel="noopener noreferrer">realtime-js</a></td>
    <td><a href="https://github.com/supabase/storage-js" target="_blank" rel="noopener noreferrer">storage-js</a></td>
  </tr>
  <th colspan="6">💚 Topluluk 💚</th>
  <tr>
    <td>C#</td>
    <td><a href="https://github.com/supabase-community/supabase-csharp" target="_blank" rel="noopener noreferrer">supabase-csharp</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-csharp" target="_blank" rel="noopener noreferrer">postgrest-csharp</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-csharp" target="_blank" rel="noopener noreferrer">gotrue-csharp</a></td>
    <td><a href="https://github.com/supabase-community/realtime-csharp" target="_blank" rel="noopener noreferrer">realtime-csharp</a></td>
    <td><a href="https://github.com/supabase-community/storage-csharp" target="_blank" rel="noopener noreferrer">storage-csharp</a></td>
  </tr>
  <tr>
    <td>Flutter</td>
    <td><a href="https://github.com/supabase/supabase-flutter" target="_blank" rel="noopener noreferrer">supabase-dart</a></td>
    <td><a href="https://github.com/supabase/postgrest-dart" target="_blank" rel="noopener noreferrer">postgrest-dart</a></td>
    <td><a href="https://github.com/supabase/gotrue-dart" target="_blank" rel="noopener noreferrer">gotrue-dart</a></td>
    <td><a href="https://github.com/supabase/realtime-dart" target="_blank" rel="noopener noreferrer">realtime-dart</a></td>
    <td><a href="https://github.com/supabase/storage-dart" target="_blank" rel="noopener noreferrer">storage-dart</a></td>
  </tr>
  <tr>
    <td>Go</td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/postgrest-go" target="_blank" rel="noopener noreferrer">postgrest-go</a></td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>Java</td>
    <td>-</td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/gotrue-java" target="_blank" rel="noopener noreferrer">gotrue-java</a></td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>Kotlin</td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/postgrest-kt" target="_blank" rel="noopener noreferrer">postgrest-kt</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-kt" target="_blank" rel="noopener noreferrer">gotrue-kt</a></td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>Python</td>
    <td><a href="https://github.com/supabase-community/supabase-py" target="_blank" rel="noopener noreferrer">supabase-py</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-py" target="_blank" rel="noopener noreferrer">postgrest-py</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-py" target="_blank" rel="noopener noreferrer">gotrue-py</a></td>
    <td><a href="https://github.com/supabase-community/realtime-py" target="_blank" rel="noopener noreferrer">realtime-py</a></td>
    <td>-</td>
  </tr>
  <tr>
    <td>Ruby</td>
    <td><a href="https://github.com/supabase-community/supabase-rb" target="_blank" rel="noopener noreferrer">supabase-rb</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-rb" target="_blank" rel="noopener noreferrer">postgrest-rb</a></td>
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
  </tr>
  <tr>
    <td>Swift</td>
    <td><a href="https://github.com/supabase-community/supabase-swift" target="_blank" rel="noopener noreferrer">supabase-swift</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-swift" target="_blank" rel="noopener noreferrer">postgrest-swift</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-swift" target="_blank" rel="noopener noreferrer">gotrue-swift</a></td>
    <td><a href="https://github.com/supabase-community/realtime-swift" target="_blank" rel="noopener noreferrer">realtime-swift</a></td>
    <td><a href="https://github.com/supabase-community/storage-swift" target="_blank" rel="noopener noreferrer">storage-swift</a></td>
  </tr>
</table>

<!--- Remove this list if you're traslating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## Çeviriler

- [Çeviriler](/i18n/languages.md) <!--- Keep only the this-->

---

## Sponsorlar

[![New Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
