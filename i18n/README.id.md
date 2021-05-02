<p align="center">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/web/static/supabase-light-with-background.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io) adalah alternatif open source dari Firebase. Kami membangun fitur dari Firebase menggunakan alat open source tingkat perusahaan.

- [x] Basis Data (Daring) Postgres
- [x] Langganan Langsung
- [x] Autentikasi dan Otorisasi
- [x] API yang diciptakan secara otomatis
- [x] Dashbor
- [x] Penyimpanan
- [ ] Fungsi-fungsi (akan datang)

## Dokumentasi

Untuk dokumentasi secara keseluruhan, kunjungi [supabase.io/docs](https://supabase.io/docs)

## Komunitas & Dukungan

- [Forum Komunitas](https://github.com/supabase/supabase/discussions). Berguna untuk: bantuan dalam proses pengembangan, diskusi praktik terbaik mengenai basis data.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Berguna untuk: bug dan eror yang ditemui dalam menggunakan Supabase.
- [Dukungan Email](https://supabase.io/docs/support#business-support). Berguna untuk: masalah mengenai basis data dan infrastruktur.

## Status

- [x] Alpha: Kami menguji coba Supabase dengan kumpulan kecil pelanggan
- [x] Public Alpha: Siapapun bisa mendaftar di [app.supabase.io](https://app.supabase.io). Tapi mohon kesabarannya, masih ada beberapa kendala.
- [x] Public Beta: Cukup stabil untuk penggunaan di level non-perusahaan
- [ ] Public: Siap untuk tahap production

Saat ini kami ada di status Public Beta. Lihat "releases" pada repo ini untuk mendapatkan notifikasi mengenai perubahan yang akan datang.

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Bagaimana cara kerjanya

Supabase adalah kombinasi dari alat-alat open source. Kami membangun fitur-fitur dari Firebase menggunakan produk-produk open source level perusahaan. Jika alat dan komunitas ada, dengan sebuah MIT, Apache 2, atau lisensi terbuka yang setara, kita akan menggunakan dan mendukung produk tersebut. Jika produknya tidak tersedia, kita akan membuat dan meng-open source-kan produk itu sendiri. Supabase bukanlah tiruan dari Firebase. Tujuan kami ialah memberikan para pengembang sebuah pengalaman menggunakan produk open source seperti Firebase.

**Arsitektur saat ini**

Supabase merupakan sebuah [sarana daring](https://app.supabase.io). Kalian bisa daftar dan mulai menggunakan Supabase tanpa perlu memasang apapun. Kami masih membuat pengalaman pengembangan lokal - untuk saat ini, hal ini merupakan fokus utama kita, bersamaan dengan stabilitas sarana yang kita sediakan.

![Arsitektur](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/) adalah sistem basis data objek-relasional dengan pengembangan aktif lebih dari 30 tahun yang membuatnya memiliki reputasi yang baik untuk keandalan, ketahanan fitur, dan kinerja.
- [Realtime](https://github.com/supabase/realtime) adalah server Elixir yang memungkinkan Anda menggunakan metode penyisipan, pembaruan, dan penghapusan PostgreSQL menggunakan websockets. Supabase menggunakan fungsionalitas replikasi bawaan Postgres, dan mengubah aliran byte replikasi ke dalam JSON, lalu mengirimkan JSON melalui websockets.
- [PostgREST](http://postgrest.org/) adalah server web yang mengubah basis data PostgreSQL Anda langsung menjadi RESTful API
- [Storage](https://github.com/supabase/storage-api) menyediakan sebuah antarmuka RESTful untuk mengelola file yang disimpan di dalam S3, menggunakan Postgres untuk mengelola perizinan.
- [postgres-meta](https://github.com/supabase/postgres-meta) merupakan sebuah RESTful API untuk mengelola Postgres kalian, menyediakan fasilitas bagi Anda untuk mengambil tabel, menambahkan wewenang, dan menjalankan kueri, dsb.
- [GoTrue](https://github.com/netlify/gotrue) merupakan sebuah API berbasis SWT untuk mengelola pengguna dan mengeluarkan token SWT.
- [Kong](https://github.com/Kong/kong) merupakan sebuah gerbang API berbasis cloud-native.

#### Pustaka Klien

Pustaka klien kami bersifat modular. Setiap sub-pustaka merupakan sebuah implementasi tersendiri untuk sebuah sistem eksternal. Ini merupakan salah satu cara kita untuk mendukung produk-produk yang sudah tersedia.

- **`supabase-{lang}`**: Menggabungkan pustaka dan menambahkan pengayaan.
  - `postgrest-{lang}`: Pustaka klien untuk digunakan dengan [PostgREST](https://github.com/postgrest/postgrest)
  - `realtime-{lang}`: Pustaka klien untuk digunakan dengan [Realtime](https://github.com/supabase/realtime)
  - `gotrue-{lang}`: Pustaka klien untuk digunakan dengan [GoTrue](https://github.com/netlify/gotrue)

| Repo                  | Resmi                                         | Komunitas                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust`                                                |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust`                                                |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust`                                                      |

## Translations

- [Inggris](https://github.com/supabase/supabase)
- [Perancis](https://github.com/supabase/supabase/blob/master/i18n/README.fr.md)
- [Jerman](https://github.com/supabase/supabase/blob/master/i18n/README.de.md)
- [Jepang](https://github.com/supabase/supabase/blob/master/i18n/README.jp.md)
- [Turki](https://github.com/supabase/supabase/blob/master/i18n/README.tr.md)
- [Mandarin Tradisional](https://github.com/supabase/supabase/blob/master/i18n/README.zh-tw.md)
- [Spanyol](https://github.com/supabase/supabase/blob/master/i18n/README.es.md)

---

## Sponsor

[![New Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
