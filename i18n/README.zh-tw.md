<p align="center">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--light.svg#gh-light-mode-only">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--dark.svg#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) 是 Firebase 的開放原始碼替代方案。我們以企業等級的開放原始碼工具，打造 Firebase 的功能。

- [x] Postgres 資料庫託管 [Docs](https://supabase.com/docs/guides/database)
- [x] 認證與授權 [Docs](https://supabase.com/docs/guides/auth)
- [x] 自動產生的 API
  - [x] REST. [Docs](https://supabase.com/docs/guides/api#rest-api)
  - [x] 實時訂閱. [Docs](https://supabase.com/docs/guides/api#realtime-api)
  - [x] GraphQL (Beta). [Docs](https://supabase.com/docs/guides/api#graphql-api)
- [x] Functions
  - [x] 數據庫 Functions. [Docs](https://supabase.com/docs/guides/database/functions)
  - [x] 邊緣 Functions [Docs](https://supabase.com/docs/guides/functions)
- [x] 儀表版

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## 說明文件

完整的說明文件請見：[supabase.com/docs](https://supabase.com/docs)

如何貢獻請見：[Getting Started](./DEVELOPERS.md)

## 社群與支援

- [社群論壇](https://github.com/supabase/supabase/discussions)。適合：打造、討論資料庫最佳作法的協助。
- [GitHub Issues](https://github.com/supabase/supabase/issues)。適合：在使用 Supabase 的時候遇到臭蟲和錯誤。
- [電子郵件支援](https://supabase.com/docs/support#business-support)。適合：資料庫或基礎建設遇到的問題。
- [Discord](https://discord.supabase.com)。適合：分享你的應用程式並與社群互動。

## 狀態

- [x] Alpha：與少部分特定客戶測試 Supabase。
- [x] 公開 Alpha：任何人都可以在 [app.supabase.com](https://app.supabase.com) 報名。只是務必手下留情，還有一些糾結的地方。
- [x] 公開 Beta：已能夠穩定在大多數非企業情境使用
- [ ] 公開：可以在正式環境使用

我們現在是公開 Beta。追蹤 "Releases" 就可以收到此 Repo 的主要更新通知。

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## 運作方法

Supabase 是一套開放原始碼工具的組合包。我們以企業等級的開放原始碼產品，打造 Firebase 的功能。如果是既有的工具和社群，且具有 MIT、Apache 2 或相等的開放授權，就會採用並支援該工具。如果是不存在的工具，則自行打造並開放原始碼。Supabase 並非 1-1 對應 Firebase 功能。我們的目標是讓開發者以開放原始碼工具，獲得類似 Firebase 的開發體驗。

**目前架構**

Supabase 是[託管平台](https://app.supabase.com)。只要註冊，不必安裝任何東西，就可以開始使用 Supabase。你也可以[自託管](https://supabase.com/docs/guides/hosting/overview)和[本地端開發](https://supabase.com/docs/guides/local-development)。

![架構](https://user-images.githubusercontent.com/70828596/187547862-ffa9d058-0c3a-4851-a3e7-92ccfca4b596.png)

- [PostgreSQL](https://www.postgresql.org/) 是經歷 30 年活躍開發的關聯物件資料庫系統，因此擁有可靠度、功能細緻度與效能著稱。
- [Realtime](https://github.com/supabase/realtime) 是利用 Websocket 監聽 PostgreSQL 的 insert、update 和 delete 的 Elixir 伺服器。Supabase 監聽 Postgres 內建的複寫 (Replication) 功能，將複寫的 byte stream 轉換為 JSON 格式，接著透過 Websocket 將 JSON 進行廣播。
- [PostgREST](http://postgrest.org/) 是直接把 PostgreSQL 轉變成 RESTful API 的網頁伺服器
- [Storage](https://github.com/supabase/storage-api) 提供管理放置在 S3 檔案的 RESTful 介面，使用 Postgres 管理權限。
- [postgres-meta](https://github.com/supabase/postgres-meta) 是管理 Postgres 的 RESTful API，可以 fetch 資料表、新增角色以及執行查詢…等。
- [GoTrue](https://github.com/netlify/gotrue) 是基於 SWT 的 API，用來管理使用者，以及發送 SWT token。
- [Kong](https://github.com/Kong/kong) 是雲端原生的 API Gateway。

#### 客戶端 Library

客戶端 Library 是模組化的。每個子 Library 都是單一外部系統的獨立實作。這是支援既有工具的方法之一。

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>語言</th>
    <th>客戶端</th>
    <th colspan="5">精選客戶端（包含在 Supabase 客戶端）</th>
  </tr>
  <tr>
    <th></th>
    <th>Supabase</th>
    <th><a href="https://github.com/postgrest/postgrest" target="_blank" rel="noopener noreferrer">PostgREST</a></th>
    <th><a href="https://github.com/supabase/gotrue" target="_blank" rel="noopener noreferrer">GoTrue</a></th>
    <th><a href="https://github.com/supabase/realtime" target="_blank" rel="noopener noreferrer">Realtime</a></th>
    <th><a href="https://github.com/supabase/storage-api" target="_blank" rel="noopener noreferrer">Storage</a></th>
    <th>Functions</th>
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
  <th colspan="7">⚡️ 官方 ⚡️</th>
  <tr>
    <td>JavaScript (TypeScript)</td>
    <td><a href="https://github.com/supabase/supabase-js" target="_blank" rel="noopener noreferrer">supabase-js</a></td>
    <td><a href="https://github.com/supabase/postgrest-js" target="_blank" rel="noopener noreferrer">postgrest-js</a></td>
    <td><a href="https://github.com/supabase/gotrue-js" target="_blank" rel="noopener noreferrer">gotrue-js</a></td>
    <td><a href="https://github.com/supabase/realtime-js" target="_blank" rel="noopener noreferrer">realtime-js</a></td>
    <td><a href="https://github.com/supabase/storage-js" target="_blank" rel="noopener noreferrer">storage-js</a></td>
    <td><a href="https://github.com/supabase/functions-js" target="_blank" rel="noopener noreferrer">functions-js</a></td>
  </tr>
    <tr>
    <td>Flutter</td>
    <td><a href="https://github.com/supabase/supabase-flutter" target="_blank" rel="noopener noreferrer">supabase-flutter</a></td>
    <td><a href="https://github.com/supabase/postgrest-dart" target="_blank" rel="noopener noreferrer">postgrest-dart</a></td>
    <td><a href="https://github.com/supabase/gotrue-dart" target="_blank" rel="noopener noreferrer">gotrue-dart</a></td>
    <td><a href="https://github.com/supabase/realtime-dart" target="_blank" rel="noopener noreferrer">realtime-dart</a></td>
    <td><a href="https://github.com/supabase/storage-dart" target="_blank" rel="noopener noreferrer">storage-dart</a></td>
    <td><a href="https://github.com/supabase/functions-dart" target="_blank" rel="noopener noreferrer">functions-dart</a></td>
  </tr>
  <th colspan="7">💚 社群 💚</th>
  <tr>
    <td>C#</td>
    <td><a href="https://github.com/supabase-community/supabase-csharp" target="_blank" rel="noopener noreferrer">supabase-csharp</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-csharp" target="_blank" rel="noopener noreferrer">postgrest-csharp</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-csharp" target="_blank" rel="noopener noreferrer">gotrue-csharp</a></td>
    <td><a href="https://github.com/supabase-community/realtime-csharp" target="_blank" rel="noopener noreferrer">realtime-csharp</a></td>
    <td><a href="https://github.com/supabase-community/storage-csharp" target="_blank" rel="noopener noreferrer">storage-csharp</a></td>
    <td><a href="https://github.com/supabase-community/functions-csharp" target="_blank" rel="noopener noreferrer">functions-csharp</a></td>
  </tr>
  <tr>
    <td>Go</td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/postgrest-go" target="_blank" rel="noopener noreferrer">postgrest-go</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-go" target="_blank" rel="noopener noreferrer">gotrue-go</a></td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/storage-go" target="_blank" rel="noopener noreferrer">storage-go</a></td>
    <td><a href="https://github.com/supabase-community/functions-go" target="_blank" rel="noopener noreferrer">functions-go</a></td>
  </tr>
  <tr>
    <td>Java</td>
    <td>-</td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/gotrue-java" target="_blank" rel="noopener noreferrer">gotrue-java</a></td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/storage-java" target="_blank" rel="noopener noreferrer">storage-java</a></td>
    <td>-</td>
  </tr>
  <tr>
    <td>Kotlin</td>
    <td><a href="https://github.com/supabase-community/supabase-kt" target="_blank" rel="noopener noreferrer">supabase-kt</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-kt" target="_blank" rel="noopener noreferrer">postgrest-kt</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-kt" target="_blank" rel="noopener noreferrer">gotrue-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Realtime" target="_blank" rel="noopener noreferrer">realtime-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Storage" target="_blank" rel="noopener noreferrer">storage-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Functions" target="_blank" rel="noopener noreferrer">functions-kt</a></td>
  </tr>
  <tr>
    <td>Python</td>
    <td><a href="https://github.com/supabase-community/supabase-py" target="_blank" rel="noopener noreferrer">supabase-py</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-py" target="_blank" rel="noopener noreferrer">postgrest-py</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-py" target="_blank" rel="noopener noreferrer">gotrue-py</a></td>
    <td><a href="https://github.com/supabase-community/realtime-py" target="_blank" rel="noopener noreferrer">realtime-py</a></td>
    <td><a href="https://github.com/supabase-community/storage-py" target="_blank" rel="noopener noreferrer">storage-py</a></td>
    <td><a href="https://github.com/supabase-community/functions-py" target="_blank" rel="noopener noreferrer">functions-py</a></td>
  </tr>
  <tr>
    <td>Ruby</td>
    <td><a href="https://github.com/supabase-community/supabase-rb" target="_blank" rel="noopener noreferrer">supabase-rb</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-rb" target="_blank" rel="noopener noreferrer">postgrest-rb</a></td>
    <td>-</td>
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
    <td>-</td>
  </tr>
  <tr>
    <td>Swift</td>
    <td><a href="https://github.com/supabase-community/supabase-swift" target="_blank" rel="noopener noreferrer">supabase-swift</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-swift" target="_blank" rel="noopener noreferrer">postgrest-swift</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-swift" target="_blank" rel="noopener noreferrer">gotrue-swift</a></td>
    <td><a href="https://github.com/supabase-community/realtime-swift" target="_blank" rel="noopener noreferrer">realtime-swift</a></td>
    <td><a href="https://github.com/supabase-community/storage-swift" target="_blank" rel="noopener noreferrer">storage-swift</a></td>
    <td><a href="https://github.com/supabase-community/functions-swift" target="_blank" rel="noopener noreferrer">functions-swift</a></td>
  </tr>
  <tr>
    <td>Godot Engine (GDScript)</td>
    <td><a href="https://github.com/supabase-community/godot-engine.supabase" target="_blank" rel="noopener noreferrer">supabase-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-gdscript" target="_blank" rel="noopener noreferrer">postgrest-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-gdscript" target="_blank" rel="noopener noreferrer">gotrue-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/realtime-gdscript" target="_blank" rel="noopener noreferrer">realtime-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/storage-gdscript" target="_blank" rel="noopener noreferrer">storage-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/functions-gdscript" target="_blank" rel="noopener noreferrer">functions-gdscript</a></td>
  </tr>
</table>
<!--- Remove this list if you're traslating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## 翻譯

- [翻譯](/i18n/languages.md) <!--- Keep only the this-->

---

## 贊助

[![加入贊助](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
