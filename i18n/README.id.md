<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) adalah alternatif *open-source* untuk Firebase. Kami membangun fitur-fitur Firebase menggunakan *tool-tool open-source* kelas *enterprise*.

**Fitur Utama:**

- [x] **Database Postgres Terkelola:** [Dokumentasi](https://supabase.com/docs/guides/database)
- [x] **Autentikasi dan Otorisasi:** [Dokumentasi](https://supabase.com/docs/guides/auth)
- [x] **API yang Dihasilkan Secara Otomatis:**
    - [x] REST: [Dokumentasi](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Dokumentasi](https://supabase.com/docs/guides/graphql)
    - [x] Langganan *Realtime*: [Dokumentasi](https://supabase.com/docs/guides/realtime)
- [x] **Fungsi:**
    - [x] Fungsi Database: [Dokumentasi](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (Fungsi di tepi jaringan): [Dokumentasi](https://supabase.com/docs/guides/functions)
- [x] **Penyimpanan File:** [Dokumentasi](https://supabase.com/docs/guides/storage)
- [x] **Tools AI, Vektor, dan Embedding:** [Dokumentasi](https://supabase.com/docs/guides/ai)
- [x] **Dasbor**

![Dasbor Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Berlangganan "rilis" (*releases*) dari repositori ini untuk menerima pemberitahuan tentang pembaruan penting. Ini akan memungkinkan Anda untuk tetap *up-to-date* dengan perubahan dan peningkatan terbaru.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Tonton repositori"/></kbd>

## Dokumentasi

Dokumentasi lengkap tersedia di [supabase.com/docs](https://supabase.com/docs). Di sana Anda akan menemukan semua panduan dan materi referensi yang diperlukan.

Jika Anda ingin berkontribusi pada pengembangan proyek, lihat bagian [Memulai](./../DEVELOPERS.md).

## Komunitas dan Dukungan

*   **Forum Komunitas:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Ideal untuk mendapatkan bantuan dalam pengembangan dan mendiskusikan praktik terbaik bekerja dengan database.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Gunakan untuk melaporkan *bug* dan kesalahan yang Anda temui saat menggunakan Supabase.
*   **Dukungan Email:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). Pilihan terbaik untuk masalah dengan database atau infrastruktur Anda.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Tempat yang tepat untuk berbagi aplikasi Anda dan berkomunikasi dengan komunitas.

## Prinsip Kerja

Supabase menggabungkan beberapa *tool open-source*. Kami membangun fitur yang mirip dengan Firebase menggunakan produk kelas *enterprise* yang telah teruji. Jika sebuah *tool* atau komunitas ada dan memiliki lisensi MIT, Apache 2, atau lisensi terbuka serupa, kami akan menggunakan dan mendukung *tool* tersebut. Jika *tool* tersebut tidak ada, kami akan membuatnya sendiri dan membuka kode sumbernya. Supabase bukanlah replika 1-ke-1 dari Firebase. Tujuan kami adalah untuk memberikan pengembang pengalaman yang nyaman seperti Firebase, tetapi menggunakan *tool open-source*.

**Arsitektur**

Supabase adalah [platform terkelola](https://supabase.com/dashboard). Anda dapat mendaftar dan segera mulai menggunakan Supabase, tanpa menginstal apa pun. Anda juga dapat [menyebarkan infrastruktur Anda sendiri](https://supabase.com/docs/guides/hosting/overview) dan [mengembangkan secara lokal](https://supabase.com/docs/guides/local-development).

![Arsitektur](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Sistem database relasional-objek dengan lebih dari 30 tahun sejarah pengembangan aktif.  Dikenal karena keandalan, fungsionalitas, dan kinerjanya.
*   **Realtime:** Server Elixir yang memungkinkan Anda mendengarkan perubahan PostgreSQL (penyisipan, pembaruan, dan penghapusan) melalui *websockets*. Realtime menggunakan fungsionalitas replikasi bawaan Postgres, mengubah perubahan menjadi JSON, dan mengirimkannya ke klien yang berwenang.
*   **PostgREST:** Server web yang mengubah database PostgreSQL Anda menjadi API RESTful.
*   **GoTrue:** API berbasis JWT untuk mengelola pengguna dan mengeluarkan token JWT.
*   **Storage:** Menyediakan antarmuka RESTful untuk mengelola file yang disimpan di S3, menggunakan Postgres untuk mengelola izin.
*   **pg_graphql:** Ekstensi PostgreSQL yang menyediakan API GraphQL.
*   **postgres-meta:** API RESTful untuk mengelola Postgres Anda, memungkinkan Anda untuk mengambil tabel, menambahkan peran, menjalankan kueri, dll.
*   **Kong:** *Gateway* API *cloud-native*.

#### Pustaka Klien

Kami menggunakan pendekatan modular untuk pustaka klien. Setiap sub-pustaka dirancang untuk bekerja dengan satu sistem eksternal. Ini adalah salah satu cara untuk mendukung *tool* yang ada.

(Tabel dengan pustaka klien, seperti aslinya, tetapi dengan nama Indonesia dan penjelasan, jika perlu).

| Bahasa                       | Klien Supabase                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Resmi⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Didukung Komunitas💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Lencana (Badges)

Anda dapat menggunakan lencana ini untuk menunjukkan bahwa aplikasi Anda dibuat dengan Supabase:

**Terang:**

![Dibuat dengan Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Dibuat dengan Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Dibuat dengan Supabase" />
</a>
```

**Gelap:**

![Dibuat dengan Supabase (versi gelap)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Dibuat dengan Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Dibuat dengan Supabase" />
</a>
```

## Terjemahan

[Daftar terjemahan](./languages.md)
