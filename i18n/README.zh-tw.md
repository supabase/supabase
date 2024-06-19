<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com)是一個開源的 Firebase 替代品。我們正在使用企業級的開源工具構建 Firebase 的功能。

- [x] 托管的 Postgres 資料庫。[文檔](https://supabase.com/docs/guides/database)
- [x] 認證和授權。[文檔](https://supabase.com/docs/guides/auth)
- [x] 自動生成的 API。
  - [x] REST.[文檔](https://supabase.com/docs/guides/api#rest-api-overview)
  - [x] GraphQL。[文件](https://supabase.com/docs/guides/api#graphql-api-overview)
  - [x] 實時訂閱。[文檔](https://supabase.com/docs/guides/api#realtime-api-overview)
- [x] 函數。
  - [x] 資料庫函數。[文件](https://supabase.com/docs/guides/database/functions)
  - [x] 邊缘功能 [文檔](https://supabase.com/docs/guides/functions)
- [x] 文件存儲。[文件](https://supabase.com/docs/guides/storage)
- [x] 儀表板

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## 文檔

有關完整的文檔，請訪問[supabase.com/docs](https://supabase.com/docs)

要了解如何貢獻，請訪問[入門](../DEVELOPERS.md)

## 社群與支持

- [社群論壇](https://github.com/supabase/supabase/discussions)。最適合：幫助構建，討論資料庫的數佳實踐。
- [GitHub 問题](https://github.com/supabase/supabase/issues)。最適合：你在使用 Supabase 时遇到的 bug 和错误。
- [電子郵件支持](https://supabase.com/docs/support#business-support)。最適合：你的資料庫或數據基礎設施的問題。
- [Discord](https://discord.supabase.com)。最適合：分享你的應用程式並與社群一起玩耍。

## 狀態

- [x] Alpha：我們正在與一组封閉的客户測試 Supabase。
- [x] 公開 Alpha：任何人都可以在[supabase.com/dashboard](https://supabase.com/dashboard)上註冊。但請對我們寬容一些，有一些小問題。
- [x] 公開測試版：足夠穩定，適合大多數非企業使用的情况。
- [ ] 公開：普遍可用 [狀態](https://supabase.com/docs/guides/getting-started/features#feature-status)

我們目前正處於公開測試階段。請關注此軟體的 "發布"，以獲得重大更新的通知。

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

### 它是如何運作的

Supabase 是一個開源工具的组合。我們正在使用企業級的開源產品來構建 Firebase 的功能。如果這些工具和社群存在，並且有 MIT、Apache 2 或同等的開放許可，我們將使用並支持該工具。如果該工具不存在，我們就自己建立並開放原始碼。Supabase 不是 Firebase 的 1 對 1 映射。我們的目標是使用開源工具為開發者提供類似 Firebase 的開發者體驗。

**架構**

Supabase 是一個[托管平台](https://supabase.com/dashboard)。你可以註冊並開始使用 Supabase，無需安裝任何東西。
你也可以[自行托管](https://supabase.com/docs/guides/hosting/overview)和[本地開發](https://supabase.com/docs/guides/local-development)。

![架構](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.svg)

- [PostgreSQL](https://www.postgresql.org/)是一個物件關係型資料庫系統，經過 30 多年的積極開發，它在可靠性、功能穩健性和性能方面赢得了良好的聲譽。
- [Realtime](https://github.com/supabase/realtime)是一個 Elixir 服務器，允許你使用 websockets 監聽 PostgreSQL 的插入、更新和刪除。Realtime 對 Postgres 内置的複製功能進行投票，以了解資料庫的數位化，將變化轉换為 JSON，然后通過 websockets 將 JSON 廣播邊授權客户。
- [PostgREST](http://postgrest.org/)是一個網路服務器，它把你的 PostgreSQL 資料庫直接變成一個 RESTful API。
- [pg_graphql](http://github.com/supabase/pg_graphql/)是一個 PostgreSQL 邊擴展，暴露了一個 GraphQL API。
- [Storage](https://github.com/supabase/storage-api) 提供了一個 RESTful 接口來管理存儲在 S3 中的文件，使用 Postgres 來管理權限。
- [postgres-meta](https://github.com/supabase/postgres-meta) 是一個用於管理你的 Postgres 的 RESTful API，允許你獲取表、添加角色和運行查詢等。
- [GoTrue](https://github.com/netlify/gotrue) 是一個基於 SWT 的 API，用於管理用户和發行 SWT 令牌。
- [Kong](https://github.com/Kong/kong)是一個雲原生 API 網關。

#### 客户端庫

我們對客户端庫的做法是模塊化的。每一個子庫都是一個獨立的實現，用於單一的外部系统。這是我們支持現有工具的方法之一。

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>語言</th>
    <th>客户端</th>
    <th colspan="5">特徵-客户端(捆绑在Supabase客户端中)</th>
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
  
  <th colspan="7">⚡️ 官方⚡️</th>
  
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
  
  <th colspan="7">💚社群 💚</th>
  
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
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Postgrest" target="_blank" rel="noopener noreferrer">postgrest-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/GoTrue" target="_blank" rel="noopener noreferrer">gotrue-kt</a></td>
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

<!--- Remove this list if you're translating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## 翻譯

- [阿拉伯語| العربية](/i18n/README.ar.md)
- [Albanian / Shqip](/i18n/README.sq.md)
- [Bangla / বাংল](/i18n/README.bn.md)
- [Bulgarian / Български](/i18n/README.bg.md)
- [Catalan / Català](/i18n/README.ca.md)
- [Danish / Dansk](/i18n/README.da.md)
- [荷蘭語 / Nederlands](/i18n/README.nl.md)
- [英語](https://github.com/supabase/supabase)
- [芬蘭語/Suomalainen](/i18n/README.fi.md)
- [法語/Français](/i18n/README.fr.md)
- [德語/Deutsch](/i18n/README.de.md)
- [希臘語 / Ελληνικά](/i18n/README.gr.md)
- [Hebrew / עברית](/i18n/README.he.md)
- [Hindi / हिंद](/i18n/README.hi.md)
- [匈牙利語/馬扎爾語](/i18n/README.hu.md)
- [尼泊爾語 / नेपाली](/i18n/README.ne.md)
- [印尼語/印度尼西亞語](/i18n/README.id.md)
- [意大利語/Italiano](/i18n/README.it.md)
- [日語 / 日本語](/i18n/README.jp.md)
- [韓語 / 한국어](/i18n/README.ko.md)
- [Malay / Bahasa Malaysia](/i18n/README.ms.md)
- [Norwegian (Bokmål) / Norsk (Bokmål)](/i18n/README.nb-no.md)
- [Persian / فارسی](/i18n/README.fa.md)
- [Polish / Polski](/i18n/README.pl.md)
- [葡萄牙語 / Português](/i18n/README.pt.md)
- [葡萄牙語(巴西)/Português Brasileiro](/i18n/README.pt-br.md)
- [Romanian / Română](/i18n/README.ro.md)
- [俄語 / Pусский](/i18n/README.ru.md)
- [塞爾維亞語 / Srpski](/i18n/README.sr.md)
- [Sinhala / සිංහල](/i18n/README.si.md)
- [西班牙語 / Español](/i18n/README.es.md)
- [Simplified Chinese / 簡體中文](/i18n/README.zh-cn.md)
- [瑞典語 / Svenska](/i18n/README.sv.md)
- [泰文 / ไทย](/i18n/README.th.md)
- [Traditional Chinese / 繁體中文](/i18n/README.zh-tw.md)
- [土耳其語 / Türkçe](/i18n/README.tr.md)
- [烏克蘭語 / Українська](/i18n/README.uk.md)
- [越南語/Tiếng Việt](/i18n/README.vi-vn.md)
- [翻譯列表](/i18n/languages.md)<!--- Keep only this -->

---

## 贊助商

[![新贊助商](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
