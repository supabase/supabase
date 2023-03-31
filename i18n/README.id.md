<p align="center">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--light.svg#gh-light-mode-only">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--dark.svg#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) adalah alternatif sumber terbuka dari Firebase. Kami membangun fitur-fitur Firebase menggunakan alat-alat sumber terbuka tingkat perusahaan.

- [x] Hosting database Postgres
- [x] Langganan waktu nyata (Realtime)
- [x] Otentikasi dan otorisasi
- [x] API-API yang dibuat otomatis
- [x] Dasbor
- [x] Penyimpanan
- [x] Fungsi-fungsi

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## Dokumentasi

Untuk dokumentasi lengkap, kunjungi [supabase.com/docs](https://supabase.com/docs)

## Komunitas & Dukungan

- [Forum Komunitas](https://github.com/supabase/supabase/discussions). Baik untuk: membantu pembangunan, diskusi mengenai praktik terbaik dalam database.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Baik untuk: bugs and kesalahan yang ditemui saat menggunakan Supabase.
- [Email Bantuan](https://supabase.com/docs/support#business-support). Baik untuk: masalah-masalah dengan database atau infrastruktur.

## Status

- [x] Alpha: Kami menguji Supabase dengan sejumlah pelanggan secara tertutup
- [x] Public Alpha: Siapapun dapat mendaftar di [app.supabase.com](https://app.supabase.com). Namun mohon bersabar, ada beberapa masalah.
- [x] Public Beta: Cukup stabil untuk sebagian besar kasus penggunaan non-perusahaan
- [ ] Public: Siap produksi

Kami saat ini dalam Public Beta. Amati "releases" dari repositori ini untuk pemberitahuan mengenai pembaruan-pembaruan besar.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Amati repo ini"/></kbd>

---

## Cara kerjanya

Supabase adalah kombinasi dari alat-alat sumber terbuka. Kami membangun fitur-fitur Firebase menggunakan produk-produk sumber terbuka tingkat perusahaan. Jika ada alat dan komunitas, dengan MIT, Apache 2, atau lisensi terbuka yang setara, kami akan menggunakan dan mendukung alat tersebut. Jika alat tersebut tidak ada, kami akan membuat dan membuka sumbernya sendiri. Supabase bukanlah salinan persis dari Firebase. Tujuan kami adalah memberi pengguna kemampuan untuk menggunakan produk yang mirip dengan Firebase, tetapi sepenuhnya bersumber terbuka.

**Arsitektur saat ini**

Supabase adalah sebuah [platform yang dihosting](https://app.supabase.com). Anda dapat mendaftar dan mulai menggunakan Supabase tanpa memasang apa pun. Kami masih membangun pengalaman pengembangan lokal yang merupakan fokus utama kami saat ini, bersama dengan stabilitas platform.

![Arsitektur](https://user-images.githubusercontent.com/70828596/187547862-ffa9d058-0c3a-4851-a3e7-92ccfca4b596.png)

- [PostgreSQL](https://www.postgresql.org/) adalah sebuah sistem database objek-relasional dengan pengembangan aktif lebih dari 30 tahun sehingga memiliki reputasi yang kuat dalam keandalan, ketahanan fitur, dan kinerja.
- [Realtime](https://github.com/supabase/realtime) adalah sebuah server Elixir yang memungkinkan anda mendengarkan penyisipan, perubahan, dan penghapusan dari PostgreSQL menggunakan WebSocket. Supabase mendengarkan fungsionalitas replikasi bawaan Postgres, mengubah stream byte ke JSON, kemudian JSON tersebut disiarkan melalui WebSocket.
- [PostgREST](http://postgrest.org/) adalah sebuah web server yang mengubah database PostgreSQL anda menjadi sebuah RESTful API secara langsung
- [Storage](https://github.com/supabase/storage-api) menyediakan antarmuka RESTful untuk mengelola file-file yang disimpan di dalam S3, menggunakan Postgres untuk mengelola izin
- [postgres-meta](https://github.com/supabase/postgres-meta) adalah sebuah RESTful API untuk mengelola Postgres anda, memungkinkan ada untuk mengambil tabel, menambah role, menjalankan query, dll.
- [GoTrue](https://github.com/netlify/gotrue) adalah sebuah API berbasis SWT untuk mengelola user dan mengeluarkan token SWT.
- [Kong](https://github.com/Kong/kong) adalah gateway API cloud-native.

#### Library-library klien

Library klien kami bersifat modular. Setiap sub-library adalah sebuah implementasi mandiri untuk satu sistem eksternal. Ini adalah salah satu cara kami mendukung alat-alat yang sudah ada.

- **`supabase-{lang}`**: Menggabungkan library-library dan menambahkan pengayaan.
  - `postgrest-{lang}`: Library klien untuk bekerja dengan [PostgREST](https://github.com/postgrest/postgrest)
  - `realtime-{lang}`: Library klien untuk bekerja dengan [Realtime](https://github.com/supabase/realtime)
  - `gotrue-{lang}`: Library klien untuk bekerja dengan [GoTrue](https://github.com/netlify/gotrue)

| Repo                  | Resmi                                            | Komunitas                                                                                                                                                                                                                                                                        |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Flutter`](https://github.com/supabase/supabase-flutter) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust` \| [`Ruby`](https://github.com/supabase/supabase-rb)                                           |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) \| [`Ruby`](https://github.com/supabase/postgrest-rb) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust` \| `Ruby`                                                                                            |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust` \| `Ruby`                                                                                                  |

## Terjemahan

- [Daftar terjemahan](/i18n/languages.md)

---

## Sponsor

[![Menjadi sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
