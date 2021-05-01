<p align="center">
<img width="300" src="https://gitcdn.xyz/repo/supabase/supabase/master/web/static/supabase-light.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io) 是 Firebase 的開放原始碼替代方案。我們以企業等級的開放原始碼工具，打造 Firebase 的功能。

- [x] Postgres 資料庫託管
- [x] 即時訂閱
- [x] Authentication and authorization
- [x] 自動產生的 API
- [x] 儀表版
- [x] 儲存空間
- [ ] Functions（即將推出）

## 說明文件

完整的說明文件請見：[supabase.io/docs](https://supabase.io/docs)

## 社群與支援

- [社群論壇](https://github.com/supabase/supabase/discussions)。適合：打造、討論資料庫最佳作法的協助。
- [GitHub Issues](https://github.com/supabase/supabase/issues)。適合：在使用 Supabase 的時候遇到臭蟲和錯誤。
- [電子郵件支援](https://supabase.io/docs/support#business-support)。適合：資料庫或基礎建設遇到的問題。

## 狀態

- [x] Alpha：與少部分特定客戶測試 Supabase。
- [x] 公開 Alpha：任何人都可以在 [app.supabase.io](https://app.supabase.io) 報名。只是務必手下留情，還有一些糾結的地方。
- [x] 公開 Beta：已能夠穩定在大多數非企業情境使用
- [ ] 公開：可以在正式環境使用

我們現在是公開 Beta。請看此 Repo 的 "Releases" 接收主要更新。

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## 運作方法

Supabase 是一套開放原始碼工具的組合包。我們以企業等級的開放原始碼產品，打造 Firebase 的功能。如果是既有的工具和社群，且具有 MIT、Apache 2 或相等的開放授權，就會採用並支援該工具。如果是不存在的工具，則自行打造並開放原始碼。Supabase 並非 1-1 對應 Firebase 功能。我們的目標是讓開發者以開放原始碼工具，獲得類似 Firebase 的開發體驗。

**目前架構**

Supabase 是[託管平台](https://app.supabase.io)。只要註冊，不必安裝任何東西，就可以開始使用 Supabase。目前還在打造本地端開發體驗：連同平台的穩定度，這是我們專注的核心。

![架構](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/) is an object-relational database system with over 30 years of active development that has earned it a strong reputation for reliability, feature robustness, and performance.
- [Realtime](https://github.com/supabase/realtime) is an Elixir server that allows you to listen to PostgreSQL inserts, updates, and deletes using websockets. Supabase listens to Postgres' built-in replication functionality, converts the replication byte stream into JSON, then broadcasts the JSON over websockets.
- [PostgREST](http://postgrest.org/) is a web server that turns your PostgreSQL database directly into a RESTful API
- [Storage](https://github.com/supabase/storage-api) provides a RESTful interface for managing Files stored in S3, using Postgres to manage permissions.
- [postgres-meta](https://github.com/supabase/postgres-meta) is a RESTful API for managing your Postgres, allowing you to fetch tables, add roles, and run queries etc.
- [GoTrue](https://github.com/netlify/gotrue) is an SWT based API for managing users and issuing SWT tokens.
- [Kong](https://github.com/Kong/kong) is a cloud-native API gateway.

#### 客戶端 Library

客戶端 Library 是模組化的。每個子 Library 都是單一外部系統的獨立實作。這是支援既有工具的方法之一。

- **`supabase-{lang}`**: Combines libraries and adds enrichments.
  - `postgrest-{lang}`: 銜接 [PostgREST](https://github.com/postgrest/postgrest) 的客戶端 Library 
  - `realtime-{lang}`: 銜接 [Realtime](https://github.com/supabase/realtime) 的客戶端 Library  
  - `gotrue-{lang}`: 銜接 [GoTrue](https://github.com/netlify/gotrue) 的客戶端 Library 

| Repo                  | 官方                                         | 社群                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust`                                                |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust`                                                |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust`                                                      |

---

## 贊助

[![加入贊助](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
