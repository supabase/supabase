<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) 是 Firebase 的開源替代品。我們正在使用企業級開源工具構建 Firebase 的功能。

**主要功能：**

- [x] **託管的 Postgres 資料庫：** [文件](https://supabase.com/docs/guides/database)
- [x] **身份驗證和授權：** [文件](https://supabase.com/docs/guides/auth)
- [x] **自動生成的 API：**
    - [x] REST: [文件](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [文件](https://supabase.com/docs/guides/graphql)
    - [x] 即時訂閱： [文件](https://supabase.com/docs/guides/realtime)
- [x] **函數：**
    - [x] 資料庫函數： [文件](https://supabase.com/docs/guides/database/functions)
    - [x] 邊緣函數（網路邊緣的函數）： [文件](https://supabase.com/docs/guides/functions)
- [x] **檔案儲存：** [文件](https://supabase.com/docs/guides/storage)
- [x] **用於處理 AI、向量和嵌入 (embeddings) 的工具：** [文件](https://supabase.com/docs/guides/ai)
- [x] **控制面板**

![Supabase 控制面板](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

訂閱此儲存庫的「releases」，以獲取有關重大更新的通知。這將使您了解最新的變更和改進。

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="關注儲存庫"/></kbd>

## 文件

完整的文件可在 [supabase.com/docs](https://supabase.com/docs) 上找到。您將在那裡找到所有必要的指南和參考資料。

如果您想為專案的開發做出貢獻，請參閱[入門](./../DEVELOPERS.md)部分。

## 社群和支援

*   **社群論壇：** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)。非常適合在開發中獲得幫助並討論使用資料庫的最佳實踐。
*   **GitHub Issues：** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues)。用於報告您在使用 Supabase 時遇到的錯誤和 bug。
*   **電子郵件支援：** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support)。解決資料庫或基礎架構問題的最佳選擇。
*   **Discord：** [https://discord.supabase.com](https://discord.supabase.com)。分享您的應用程式並與社群交流的好地方。

## 工作原理

Supabase 結合了多個開源工具。我們正在使用經過驗證的企業級產品構建類似於 Firebase 的功能。如果工具或社群存在並且具有 MIT、Apache 2 或類似的開放授權，我們將使用並支援該工具。如果不存在此類工具，我們將自行建立並開放原始碼。Supabase 不是 Firebase 的精確副本。我們的目標是為開發人員提供與 Firebase 相當的便利，但使用開源工具。

**架構**

Supabase 是一個[託管平台](https://supabase.com/dashboard)。您可以註冊並立即開始使用 Supabase，而無需安裝任何東西。您還可以[部署自己的基礎架構](https://supabase.com/docs/guides/hosting/overview)並在[本地進行開發](https://supabase.com/docs/guides/local-development)。

![架構](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL：** 一個具有 30 多年積極開發歷史的物件關聯式資料庫系統。它以其可靠性、功能性和效能而聞名。
*   **Realtime：** Elixir 上的一個伺服器，允許您通過 WebSockets 監聽 PostgreSQL 中的變更（插入、更新和刪除）。Realtime 使用 Postgres 的內建複製功能，將變更轉換為 JSON 並將其傳輸給授權用戶端。
*   **PostgREST：** 一個將您的 PostgreSQL 資料庫轉換為 RESTful API 的 Web 伺服器。
*   **GoTrue：** 一個基於 JWT 的 API，用於管理使用者和頒發 JWT 權杖。
*   **Storage：** 提供一個 RESTful 介面來管理儲存在 S3 中的檔案，使用 Postgres 來管理權限。
*   **pg_graphql：** 一個提供 GraphQL API 的 PostgreSQL 擴充功能。
*   **postgres-meta：** 一個用於管理您的 Postgres 的 RESTful API，允許您獲取表格、新增角色、執行查詢等。
*   **Kong：** 一個雲端原生 API 閘道。

#### 用戶端函式庫

我們對用戶端函式庫採用模組化方法。每個子函式庫都設計用於與單個外部系統一起工作。這是我們支援現有工具的方法之一。

(表格與客戶端庫，與原文相同，但使用繁體中文名稱和解釋，在需要的地方。)

| 語言                       | Supabase 客戶端                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️官方⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚社群支援💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## 徽章 (Badges)

您可以使用這些徽章來表明您的應用程式是使用 Supabase 構建的：

**淺色：**

![使用 Supabase 構建](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![使用 Supabase 構建](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="使用 Supabase 構建" />
</a>
```

**深色：**

![使用 Supabase 構建（深色版本）](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![使用 Supabase 構建](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="使用 Supabase 構建" />
</a>
```

## 翻譯

[翻譯列表](./languages.md)
