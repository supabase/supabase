<p align="center">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/web/static/supabase-light-rounded-corner-background.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io) adalah sumber terbuka alternatif kepada Firebase. Kami sedang membina ciri-ciri Firebase menggunakan alat sumber terbuka kelas perusahaan.

- [x] Hosting Pangkalan Data untuk Postgres
- [x] Langganan Waktu Nyata (Realtime)
- [x] Pengesahan (Authentication) dan Kebenaran (Authorization)
- [x] API dihasilkan secara automatik
- [x] Papan Pemuka
- [x] Storan
- [ ] Fungsi-fungsi (akan datang)

## Dokumentasi

Untuk dokumentasi lengkap, layari [supabase.io/docs](https://supabase.io/docs)

## Komuniti & Sokongan

- [Forum Komuniti](https://github.com/supabase/supabase/discussions). Terbaik untuk: membantu pembinaan and perbincangan mengenai cara terbaik pangkalan data.
- [Isu GitHub](https://github.com/supabase/supabase/issues). Terbaik untuk: pepijat dan ralat yang anda hadapi menggunakan Supabase.
- [Sokongan E-mel](https://supabase.io/docs/support#business-support). Terbaik untuk: masalah dengan pangkalan data atau infrastruktur.

## Status

- [x] Alpha: Kami menguji Supabase dengan sejumlah pelanggan secara tertutup
- [x] Public Alpha: Sesiapa sahaja boleh mendaftar di [app.supabase.io](https://app.supabase.io). Tetapi, mohon bersabar kerana mungkin ada masalah
- [x] Public Beta: Cukup stabil untuk kebanyakan kes penggunaan bukan perusahaan
- [ ] Public: Bersedia untuk pengeluaran

Kami kini berada di Public Beta. Tonton "siaran" repo ini untuk diberitahu mengenai kemas kini utama.

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Tonton repo ini"/></kbd>

---

## Bagaimana ia berfungsi

Supabase adalah gabungan alat sumber terbuka. Kami membina ciri Firebase menggunakan produk sumber terbuka kelas perusahaan. Sekiranya alat dan komuniti itu ada, dengan MIT, Apache 2, atau lesen terbuka yang lain, kami akan menggunakan dan menyokong alat itu. Jika tiada, kita akan membina sumber terbuka sendiri. Supabase bukanlah sama seperti Firebase. Tujuan kami adalah untuk memberi pengalaman kepada pembangun seperti Firebase menggunakan alat sumber terbuka.

**Seni bina semasa**

Supabase ialah [platform yang dihoskan](https://app.supabase.io). Anda boleh mendaftar dan mula menggunakan Supabase tanpa memasang apa-apa.
Anda juga boleh [host sendiri](https://supabase.io/docs/guides/self-hosting) dan [lokal](https://supabase.io/docs/guides/local-development).

![Seni bina](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/) adalah sistem pangkalan data objek-relasional dengan pengembangan aktif lebih dari 30 tahun yang menjadikannya reputasi yang kuat untuk kebolehpercayaan, ketahanan ciri, dan prestasi.
- [Realtime](https://github.com/supabase/realtime) adalah pelayan Elixir yang membolehkan anda mendengar sisipan, kemas kini dan pemadaman PostgreSQL menggunakan soket web. Supabase mendengar fungsi replikasi terbina dalam Postgres, menukar aliran bait(byte) replikasi menjadi JSON, kemudian menyiarkan JSON melalui soket web.
- [PostgREST](http://postgrest.org/) adalah pelayan web yang mengubah pangkalan data PostgreSQL anda secara langsung menjadi API RESTful
- [Storage](https://github.com/supabase/storage-api) menyediakan antara muka RESTful untuk menguruskan Fail yang disimpan di S3, menggunakan Postgres untuk menguruskan kebenaran akses.
- [postgres-meta](https://github.com/supabase/postgres-meta) adalah API RESTful untuk menguruskan Postgres anda, yang membolehkan anda mengambil jadual, menambah peranan, dan menjalankan query dan lain-lain.
- [GoTrue](https://github.com/netlify/gotrue) adalah API berasaskan SWT untuk mengurus pengguna dan mengeluarkan token SWT.
- [Kong](https://github.com/Kong/kong) adalah gerbang API cloud-native.

#### Librari Klien

Librari klien kami adalah modular. Setiap sub-librari adalah pelaksanaan standalone untuk satu sistem luaran. Ini adalah salah satu cara kami menyokong alat yang ada.

- **`supabase-{lang}`**: Menggabungkan librari dan menambahkan pengayaan.
  - `postgrest-{lang}`: Librari klien untuk bekerjasama [PostgREST](https://github.com/postgrest/postgrest)
  - `realtime-{lang}`: Librari klien untuk bekerjasama [Realtime](https://github.com/supabase/realtime)
  - `gotrue-{lang}`: Librari klien untuk bekerjasama [GoTrue](https://github.com/netlify/gotrue)

| Repo                  | Rasmi                                            | Komuniti                                                                                                                                                                                                                                                                                                                             |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust` \| [`Ruby`](https://github.com/supabase/supabase-rb) \| `Go`                                                                                             |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) \| [`Ruby`](https://github.com/supabase/postgrest-rb) \| [`Go`](https://github.com/supabase/postgrest-go) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust` \| `Ruby` \| `Go`                                                                                                                                        |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust` \| `Ruby` \| `Go`                                                                                                                                              |

## Terjemahan

- [Daftar terjemahan](/i18n/languages.md)

## Penaja

[![Menjadi penaja](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
