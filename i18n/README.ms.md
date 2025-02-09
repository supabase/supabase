<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) adalah alternatif sumber terbuka kepada Firebase. Kami sedang membina ciri-ciri Firebase menggunakan alat sumber terbuka gred perusahaan.

**Ciri-ciri Utama:**

- [x] **Pangkalan Data Postgres Terurus:** [Dokumentasi](https://supabase.com/docs/guides/database)
- [x] **Pengesahan dan Kebenaran:** [Dokumentasi](https://supabase.com/docs/guides/auth)
- [x] **API Dijana Secara Automatik:**
    - [x] REST: [Dokumentasi](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Dokumentasi](https://supabase.com/docs/guides/graphql)
    - [x] Langganan Masa Nyata: [Dokumentasi](https://supabase.com/docs/guides/realtime)
- [x] **Fungsi:**
    - [x] Fungsi Pangkalan Data: [Dokumentasi](https://supabase.com/docs/guides/database/functions)
    - [x] Fungsi Sempadan (Edge Functions): [Dokumentasi](https://supabase.com/docs/guides/functions)
- [x] **Storan Fail:** [Dokumentasi](https://supabase.com/docs/guides/storage)
- [x] **Alat AI, Vektor dan Pembenaman:** [Dokumentasi](https://supabase.com/docs/guides/ai)
- [x] **Papan Pemuka**

![Papan Pemuka Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Langgan "keluaran" (releases) repositori ini untuk mendapatkan pemberitahuan tentang kemas kini utama. Ini akan membolehkan anda sentiasa mengetahui perubahan dan penambahbaikan terkini.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Tonton repositori"/></kbd>

## Dokumentasi

Dokumentasi lengkap boleh didapati di [supabase.com/docs](https://supabase.com/docs). Anda akan menemui semua panduan dan bahan rujukan yang diperlukan di sana.

Jika anda ingin menyumbang kepada projek ini, sila rujuk bahagian [Bermula](./../DEVELOPERS.md).

## Komuniti & Sokongan

*   **Forum Komuniti:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Sesuai untuk mendapatkan bantuan dengan pembangunan dan membincangkan amalan terbaik pangkalan data.
*   **Isu GitHub:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Gunakan untuk melaporkan pepijat dan ralat yang anda hadapi semasa menggunakan Supabase.
*   **Sokongan E-mel:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). Pilihan terbaik untuk masalah dengan pangkalan data atau infrastruktur anda.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Tempat yang bagus untuk berkongsi aplikasi anda dan berhubung dengan komuniti.

## Cara Ia Berfungsi

Supabase menggabungkan beberapa alat sumber terbuka. Kami sedang membina ciri-ciri yang serupa dengan Firebase menggunakan produk gred perusahaan yang terbukti. Jika alat atau komuniti wujud dan mempunyai lesen MIT, Apache 2 atau lesen terbuka yang setara, kami akan menggunakan dan menyokong alat tersebut. Jika alat tersebut tidak wujud, kami akan membinanya sendiri dan membuka sumbernya. Supabase bukanlah replika tepat Firebase. Matlamat kami adalah untuk memberikan pembangun kemudahan yang setanding dengan Firebase tetapi menggunakan alat sumber terbuka.

**Seni Bina**

Supabase ialah [platform terurus](https://supabase.com/dashboard). Anda boleh mendaftar dan mula menggunakan Supabase serta-merta tanpa memasang apa-apa. Anda juga boleh [menggunakan infrastruktur anda sendiri](https://supabase.com/docs/guides/hosting/overview) dan [membangun secara tempatan](https://supabase.com/docs/guides/local-development).

![Seni Bina](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Sistem pangkalan data objek-relasi dengan lebih daripada 30 tahun sejarah pembangunan aktif. Ia terkenal dengan kebolehpercayaan, kefungsian dan prestasinya.
*   **Realtime:** Pelayan Elixir yang membolehkan anda mendengar perubahan PostgreSQL (sisipan, kemas kini dan pemadaman) melalui websockets. Realtime menggunakan fungsi replikasi terbina dalam Postgres, menukar perubahan kepada JSON dan menghantarnya kepada pelanggan yang dibenarkan.
*   **PostgREST:** Pelayan web yang menukarkan pangkalan data PostgreSQL anda kepada API RESTful.
*   **GoTrue:** API berasaskan JWT untuk mengurus pengguna dan mengeluarkan token JWT.
*   **Storage:** Menyediakan antara muka RESTful untuk mengurus fail yang disimpan dalam S3, menggunakan Postgres untuk mengurus kebenaran.
*   **pg_graphql:** Sambungan PostgreSQL yang menyediakan API GraphQL.
*   **postgres-meta:** API RESTful untuk mengurus Postgres anda, membolehkan anda mendapatkan jadual, menambah peranan, menjalankan pertanyaan, dsb.
*   **Kong:** Gerbang API natif awan.

#### Pustaka Pelanggan

Kami menggunakan pendekatan modular untuk pustaka pelanggan. Setiap sub-pustaka direka untuk berfungsi dengan satu sistem luaran. Ini adalah salah satu cara untuk menyokong alat sedia ada.

(Jadual dengan pustaka pelanggan, seperti yang asal, tetapi dengan nama Bahasa Melayu dan penjelasan jika perlu).

| Bahasa                       | Pelanggan Supabase                                                  | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Rasmi⚡️**             |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Disokong Komuniti💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Lencana (Badges)

Anda boleh menggunakan lencana ini untuk menunjukkan bahawa aplikasi anda dibina dengan Supabase:

**Cerah:**

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

[Senarai terjemahan](./languages.md)
