<p align="center">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/web/static/supabase-light-with-background.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io) adalah sumber terbuka alternatif Firebase. Kita mengembangkan fitur Firebase menggunakan alat sumber terbuka kelas perusahaan.

- [x] Menggunakan database Postgres yang di host
- [x] Langganan waktu sebenarnya
- [x] Otentikasi dan otorisasi
- [x] API yang dibuat secara otomatis
- [x] Dashboard
- [x] Penyimpanan
- [ ] Functions (segera hadir)

## Dokumentasi

Untuk dokumentasi lengkap, kunjungi [supabase.io/docs](https://supabase.io/docs)

## Komunitas & Bantuan

- [Forum Komunitas](https://github.com/supabase/supabase/discussions). Terbaik utnuk: membantu dengan mengembangkan, diskusi tentang praktik terbaik database.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Terbaik untuk: bug dan kesalahan yang kamu temui saat menggunakan Supabase.
- [Email Support](https://supabase.io/docs/support#business-support). Terbaik untuk: masalah - masalah dengan database atau infrastrukturkamu

## Status

- [x] Alpha: Kita test Supabase dengan sejumlah pelanggan tertutup.
- [x] Public Alpha: Siapa saja bisa daftar di [app.supabase.io](https://app.supabase.io). Tapi santai saja pada kami, ada beberapa masalah.
- [x] Public Beta: Cukup stabil untuk sebagian besar kasus pengguna non-perusahaan
- [ ] Public: Siap Produksi

Kita sekarang sedang di Public Beta. Watch "rilis" dari repo ini untuk mendapatkan pembaruan besar.

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Bagaimana ini berkerja

Supabase adalah kombinasi dari alat - alat sumber terbuka. Kita mengembangkan fitur Firebase menggunakan produk sumber terbuka kelas perusahaan. Jika alat - alat dan komunias - komunitas ada, dengan MIT, Apache 2, atau yag sama dengan open license, kita akan menggunakan dan dukung alat itu. Jika alat itu tidak ada, kita buat dan kita akan membuka kode itu. Supabase tidak 1 untuk 1 pemetaan Firebase. Tujuan kami adalah untuk memberi pengembang sebuah pengalaman seperti Firebase pengembang menggunakan alat -alat sumber terbuka.

**Arsitektur saat ini**

Supabase adalah sebuah [platform yang dihosting](https://app.supabase.io). Kamu bisa daftar dan mulai menggunakan Supabase tanpa menginstall apapun. Kita tetap membuat pengalaman mengembakan di lokal - ini sekarang tujuan utama kita, selama dengan platform yang stabil.

![Arsitektur](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/) adalah obejct relational database sistem dengan pengembangan aktif lebih dari 30 tahun yang membuatnya memiliki reputasi yang kuat untuk keandalan, fitur ketahanan dan kinerja.
- [Realtime](https://github.com/supabase/realtime) adalah server Elixir yang mengizinkan kamu untuk memperhatikan PostgreSQL inserts, updates, dan deletes menggunakan websockets. Supabase memperhatikan kepada Postgres' fungsionalitas replikasi bawaan, mengkover replikasi byte stream ke JSON, yang kemudian menyiarkan JSON melalui websockets.
- [PostgREST](http://postgrest.org/) adalah web server yang mengubah PsotgreSQL langsung ke sebuah RESTful API
- [Storage](https://github.com/supabase/storage-api) menyediakan sebuah tampilang RESTful untuk mengelola Penyimpanan file di S3, menggunakan Postgres untuk mengelola izin.
- [postgres-meta](https://github.com/supabase/postgres-meta) adalah RESTfull API untuk mengelola Postgres kamu, mengizinkan kamu untuk mengambil tabel, menambah peran, dan menjalankan kueri dll.
- [GoTrue](https://github.com/netlify/gotrue) adalah sebuah SWT berbasis API untuk mengelola pengguna - pengguna dan mengeluarkan token SWT.
- [Kong](https://github.com/Kong/kong) adalah sebuah cloud-native API gateway.

#### Perpustakaan klien

Perpustakaan klien kami adalah modular. Setiap sub-perpustakaan adalah implementasi mandiri dengan sebuah sistem tunggal eksternal. Ini salah satu alat yang kami dukung.

- **`supabase-{lang}`**: Menggabungkan perpustakaan dan menambahkan enrichments.
  - `postgrest-{lang}`: Perpustakaan klien untuk berkeja dengan [PostgREST](https://github.com/postgrest/postgrest)
  - `realtime-{lang}`: Perpustakaan klien untuk berkeja dengan [Realtime](https://github.com/supabase/realtime)
  - `gotrue-{lang}`: Perpustakaan klien untuk berkeja dengan [GoTrue](https://github.com/netlify/gotrue)

| Repo                  | Resmi                                            | Komunitas                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust`                                                |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust`                                                |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust`                                                      |

## Terjemahan

- [English](https://github.com/supabase/supabase)
- [French](https://github.com/supabase/supabase/blob/master/i18n/README.fr.md)
- [German](https://github.com/supabase/supabase/blob/master/i18n/README.de.md)
- [Japanese](https://github.com/supabase/supabase/blob/master/i18n/README.jp.md)
- [Turkish](https://github.com/supabase/supabase/blob/master/i18n/README.tr.md)
- [Traditional Chinese](https://github.com/supabase/supabase/blob/master/i18n/README.zh-tw.md)
- [Spanish](https://github.com/supabase/supabase/blob/master/i18n/README.es.md)
- [Indonesia](https://github.com/supabase/supabase/blob/master/i18n/README.id.md)

---

## Sponsor

[![Sponsor Baru](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
