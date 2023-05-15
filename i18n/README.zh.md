<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase]（https://supabase.com）是一个开源的Firebase替代品。我们正在使用企业级的开源工具构建Firebase的功能。

- [x] 托管的Postgres数据库。[文档](https://supabase.com/docs/guides/database)
- [x] 认证和授权。[文档](https://supabase.com/docs/guides/auth)
- [x] 自动生成的API。
  - [x] REST.[文档](https://supabase.com/docs/guides/database/api#rest-api)
  - [x] GraphQL。[文件](https://supabase.com/docs/guides/database/api#graphql-api)
  - [x] 实时订阅。[文档](https://supabase.com/docs/guides/database/api#realtime-api)
- [x] 函数。
  - [x] 数据库函数。[文件](https://supabase.com/docs/guides/database/functions)
  - [x] 边缘功能 [文档](https://supabase.com/docs/guides/functions)
- [x] 文件存储。[文件](https://supabase.com/docs/guides/storage)
- [x] 仪表板

! [Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## 文档

有关完整的文档，请访问[supabase.com/docs](https://supabase.com/docs)

要了解如何贡献，请访问[入门](./DEVELOPERS.md)

## 社区与支持

- [社区论坛](https://github.com/supabase/supabase/discussions)。最适合：帮助构建，讨论数据库的最佳实践。
- [GitHub问题](https://github.com/supabase/supabase/issues)。最适合：你在使用Supabase时遇到的bug和错误。
- [电子邮件支持](https://supabase.com/docs/support#business-support)。最适合：你的数据库或基础设施的问题。
- [Discord](https://discord.supabase.com)。最适合：分享你的应用程序并与社区一起玩耍。

## 状态

- [x] 阿尔法：我们正在与一组封闭的客户测试Supabase。
- [x] 公开阿尔法：任何人都可以在[app.supabase.com]（https://app.supabase.com）上注册。但请对我们宽容一些，有一些小问题。
- [x] 公开测试版：足够稳定，适合大多数非企业使用的情况。
- [] 公开：普遍可用 [[状态](https://supabase.com/docs/guides/getting-started/features#feature-status)]

我们目前正处于公开测试阶段。请关注本软件库的 "发布"，以获得重大更新的通知。

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="观看此版本"/></kbd>。

---

## 它是如何工作的

Supabase是一个开源工具的组合。我们正在使用企业级的开源产品来构建Firebase的功能。如果这些工具和社区存在，并且有MIT、Apache 2或同等的开放许可，我们将使用并支持该工具。如果该工具不存在，我们就自己建立并开放源代码。Supabase不是Firebase的1对1映射。我们的目标是使用开源工具为开发者提供类似Firebase的开发者体验。

**架构**

Supabase是一个[托管平台]（https://app.supabase.com）。你可以注册并开始使用Supabase，无需安装任何东西。
你也可以[自我托管](https://supabase.com/docs/guides/hosting/overview)和[本地开发](https://supabase.com/docs/guides/local-development)。

! [架构](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.png)

- [PostgreSQL](https://www.postgresql.org/)是一个对象关系型数据库系统，经过30多年的积极开发，它在可靠性、功能稳健性和性能方面赢得了良好的声誉。
- [Realtime](https://github.com/supabase/realtime)是一个Elixir服务器，允许你使用websockets监听PostgreSQL的插入、更新和删除。Realtime对Postgres的内置复制功能进行调查，了解数据库的变化，将变化转换为JSON，然后通过websockets将JSON广播给授权客户。
- [PostgREST](http://postgrest.org/)是一个网络服务器，它把你的PostgreSQL数据库直接变成一个RESTful API。
- [pg_graphql](http://github.com/supabase/pg_graphql/)是一个PostgreSQL的扩展，暴露了一个GraphQL API。
- [Storage](https://github.com/supabase/storage-api) 提供了一个RESTful接口来管理存储在S3中的文件，使用Postgres来管理权限。
- [postgres-meta](https://github.com/supabase/postgres-meta) 是一个用于管理你的Postgres的RESTful API，允许你获取表、添加角色和运行查询等。
- [GoTrue](https://github.com/netlify/gotrue) 是一个基于SWT的API，用于管理用户和发行SWT令牌。
- [Kong](https://github.com/Kong/kong)是一个云原生API网关。

#### 客户端库

我们对客户端库的做法是模块化的。每一个子库都是一个独立的实现，用于单一的外部系统。这是我们支持现有工具的方法之一。

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>语言</th>
    <th>客户端</th>
    <th colspan="5">功能-客户端（捆绑在Supabase客户端）</th>
  </tr>
  <tr>
    <th></th>
    <th>Supabase</th>
    <th><a href="https://github.com/postgrest/postgrest" target="_blank" rel="noopener noreferrer">PostgREST</a></th>。
    <th><a href="https://github.com/supabase/gotrue" target="_blank" rel="noopener noreferrer">GoTrue</a></th>。
    <th><a href="https://github.com/supabase/realtime" target="_blank" rel="noopener noreferrer">Realtime</a></th>。
    <th><a href="https://github.com/supabase/storage-api" target="_blank" rel="noopener noreferrer">存储</a></th>。
    <th>功能</th>。
  </tr>
  <!-- 新行的模板 -->
  <！-- 开始行
  <tr>
    <td>lang</td>
    <td><a href="https://github.com/supabase-community/supabase-lang" target="_blank" rel="noopener noreferrer">supabase-lang</a></td>。
    <td><a href="https://github.com/supabase-community/postgrest-lang" target="_blank" rel="noopener noreferrer">postgrest-lang</a></td>。
    <td><a href="https://github.com/supabase-community/gotrue-lang" target="_blank" rel="noopener noreferrer">gotrue-lang</a></td>
    <td><a href="https://github.com/supabase-community/realtime-lang" target="_blank" rel="noopener noreferrer">realtime-lang</a></td>
    <td><a href="https://github.com/supabase-community/storage-lang" target="_blank" rel="noopener noreferrer">存储-lang</a></td>。
  </tr>
  END ROW -->
  <th colspan="7">⚡️ Official ⚡️</th>
  <tr>
    <td>JavaScript (TypeScript)</td>
    <td><a href="https://github.com/supabase/supabase-js" target="_blank" rel="noopener noreferrer">supabase-js</a></td>。
    <td><a href="https://github.com/supabase/postgrest-js" target="_blank" rel="noopener noreferrer">postgrest-js</a></td>。
    <td><a href="https://github.com/supabase/gotrue-js" target="_blank" rel="noopener noreferrer">gotrue-js</a></td>
    <td><a href="https://github.com/supabase/realtime-js" target="_blank" rel="noopener noreferrer">realtime-js</a></td>
    <td><a href="https://github.com/supabase/storage-js" target="_blank" rel="noopener noreferrer">存储-js</a></td>。
    <td><a href="https://github.com/supabase/functions-js" target="_blank" rel="noopener noreferrer">functions-js</a></td>。
  </tr>
    <tr>
    <td>Flutter</td>
    <td><a href="https://github.com/supabase/supabase-flutter" target="_blank" rel="noopener noreferrer">supabase-flutter</a></td>。
    <td><a href="https://github.com/supabase/postgrest-dart" target="_blank" rel="noopener noreferrer">postgrest-dart</a></td>。
    <td><a href="https://github.com/supabase/gotrue-dart" target="_blank" rel="noopener noreferrer">gotrue-dart</a></td>
    <td><a href="https://github.com/supabase/realtime-dart" target="_blank" rel="noopener noreferrer">实时飞镖</a></td>。
    <td><a href="https://github.com/supabase/storage-dart" target="_blank" rel="noopener noreferrer">存储-镖客</a></td>
    <td><a href="https://github.com/supabase/functions-dart" target="_blank" rel="noopener noreferrer">功能-飞镖</a></td>。
  </tr>
  <th colspan="7">💚社区 💚</th>
  <tr>
    <td>C#</td>
    <td><a href="https://github.com/supabase-community/supabase-csharp" target="_blank" rel="noopener noreferrer">supabase-csharp</a></td>。
    <td><a href="https://github.com/supabase-community/postgrest-csharp" target="_blank" rel="noopener noreferrer">postgrest-csharp</a></td>。
    <td><a href="https://github.com/supabase-community/gotrue-csharp" target="_blank" rel="noopener noreferrer">gotrue-csharp</a></td>
    <td><a href="https://github.com/supabase-community/realtime-csharp" target="_blank" rel="noopener noreferrer">realtime-csharp</a></td>
    <td><a href="https://github.com/supabase-community/storage-csharp" target="_blank" rel="noopener noreferrer">存储-csharp</a></td>。
    <td><a href="https://github.com/supabase-community/functions-csharp" target="_blank" rel="noopener noreferrer">functions-csharp</a></td>
  </tr>
  <tr>
    
    <td>-</td>
    <td><a href="https://github.com/supabase-community/postgrest-go" target="_blank" rel="noopener noreferrer">postgrest-go</a></td>。
    <td><a href="https://github.com/supabase-community/gotrue-go" target="_blank" rel="noopener noreferrer">gotrue-go</a></td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/storage-go" target="_blank" rel="noopener noreferrer">存储-去</a></td>
    <td><a href="https://github.com/supabase-community/functions-go" target="_blank" rel="noopener noreferrer">functions-go</a></td>。
  </tr>
  <tr>
    <td>Java</td>
    <td>-</td> </table></td>
    <td>-</td> </table></td>
    <td><a href="https://github.com/supabase-community/gotrue-java" target="_blank" rel="noopener noreferrer">gotrue-java</a></td>。
    <td>-</td>
    <td><a href="https://github.com/supabase-community/storage-java" target="_blank" rel="noopener noreferrer">存储-java</a></td>。
    
  
  <br /> <br /><br /><br /><br /><br />
    <td>Kotlin</td> </table></td>
    <td><a href="https://github.com/supabase-community/supabase-kt" target="_blank" rel="noopener noreferrer">supabase-kt</a></td>。
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Postgrest" target="_blank" rel="noopener noreferrer">postgrest-kt</a></td>。
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/GoTrue" target="_blank" rel="noopener noreferrer">gotrue-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Realtime" target="_blank" rel="noopener noreferrer">realtime-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Storage" target="_blank" rel="noopener noreferrer">存储-kt/a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Functions" target="_blank" rel="noopener noreferrer">functions-kt</a></td>
  </tr>
  <tr>
    <td>Python</td>
    <td><a href="https://github.com/supabase-community/supabase-py" target="_blank" rel="noopener noreferrer">supabase-py</a></td>。
    <td><a href="https://github.com/supabase-community/postgrest-py" target="_blank" rel="noopener noreferrer">postgrest-py</a></td>。
    <td><a href="https://github.com/supabase-community/gotrue-py" target="_blank" rel="noopener noreferrer">gotrue-py</a></td>。
    <td><a href="https://github.com/supabase-community/realtime-py" target="_blank" rel="noopener noreferrer">realtime-py</a></td>
    <td><a href="https://github.com/supabase-community/storage-py" target="_blank" rel="noopener noreferrer">存储-py</a></td>。
    <td><a href="https://github.com/supabase-community/functions-py" target="_blank" rel="noopener noreferrer">functions-py</a></td>。
  </tr>
  <tr>
    <td>Ruby</td>
    <td><a href="https://github.com/supabase-community/supabase-rb" target="_blank" rel="noopener noreferrer">supabase-rb</a></td>。
    <td><a href="https://github.com/supabase-community/postgrest-rb" target="_blank" rel="noopener noreferrer">postgrest-rb</a></td>。
    <td>-</td>
    <td>-</td> </table></td>
    </td> </tr><tr> <td>-</td>
    </td> </tr><tr> <td>-</td> <td>-</td>
  
  <br /> <br /><br /><br /><br /><br />
    </td> </tr><tr> <td>锈迹斑斑</td>
    <td>-</td> </table></td>
    <td><a href="https://github.com/supabase-community/postgrest-rs" target="_blank" rel="noopener noreferrer">postgrest-rs</a></td>。
    <td>-</td> </table></td>
    <td>-</td> </table></td>
    
    </td> </tr><tr> <td>-</td> <td>-</td>
  
  <br /> <br /><br /><br /><br /><br />
    
    <td><a href="https://github.com/supabase-community/supabase-swift" target="_blank" rel="noopener noreferrer">supabase-swift</a></td>。
    <td><a href="https://github.com/supabase-community/postgrest-swift" target="_blank" rel="noopener noreferrer">postgrest-swift</a></td>。
    <td><a href="https://github.com/supabase-community/gotrue-swift" target="_blank" rel="noopener noreferrer">gotrue-swift</a></td>。
    <td><a href="https://github.com/supabase-community/realtime-swift" target="_blank" rel="noopener noreferrer">retime-swift</a></td>。
    <td><a href="https://github.com/supabase-community/storage-swift" target="_blank" rel="noopener noreferrer">存储空间转换</a></td>。
    <td><a href="https://github.com/supabase-community/functions-swift" target="_blank" rel="noopener noreferrer">functions-swift</a></td>。
  </tr>
  <tr>
    <td>Godot引擎（GDScript）</td>。
    <td><a href="https://github.com/supabase-community/godot-engine.supabase" target="_blank" rel="noopener noreferrer">supabase-gdscript</a></td>。
    <td><a href="https://github.com/supabase-community/postgrest-gdscript" target="_blank" rel="noopener noreferrer">postgrest-gdscript</a></td>。
    <td><a href="https://github.com/supabase-community/gotrue-gdscript" target="_blank" rel="noopener noreferrer">gotrue-gdscript</a> </td>
    <td><a href="https://github.com/supabase-community/realtime-gdscript" target="_blank" rel="noopener noreferrer">realime-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/storage-gdscript" target="_blank" rel="noopener noreferrer">存储-gdscript</a></td><
    <td><a href="https://github.com/supabase-community/functions-gdscript" target="_blank" rel="noopener noreferrer">functions-gdscript</a></td>。
  </tr>
</table>

<！------如果你要翻译成另一种语言，请删除这个列表，它很难在多个文件中保持更新---->


## 翻译

- [阿拉伯语| العربية](/i18n/README.ar.md)
- [Albanian / Shqip](/i18n/README.sq.md)
- [Bangla / বাংল](/i18n/README.bn.md)
- [Bulgarian / Български](/i18n/README.bg.md)
- [Catalan / Català](/i18n/README.ca.md)
- [Danish / Dansk](/i18n/README.da.md)
- [荷兰语 / Nederlands](/i18n/README.nl.md)
- [英语](https://github.com/supabase/supabase)
- [芬兰语/Suomalainen](/i18n/README.fi.md)
- [法语/Français](/i18n/README.fr.md)
- [德语/Deutsch](/i18n/README.de.md)
- [希腊语 / Ελληνικά](/i18n/README.gr.md)
- [Hebrew / עברית](/i18n/README.he.md)
- [Hindi / हिंद](/i18n/README.hi.md)
- [匈牙利语/马扎尔语](/i18n/README.hu.md)
- [尼泊尔语 / नेपाली](/i18n/README.ne.md)
- [印尼语/印度尼西亚语](/i18n/README.id.md)
- [意大利语/Italiano](/i18n/README.it.md)
- [日语 / 日本语](/i18n/README.jp.md)
- [韩语 / 한국어](/i18n/README.ko.md)
- [Malay / Bahasa Malaysia](/i18n/README.ms.md)
- [Norwegian (Bokmål) / Norsk (Bokmål)](/i18n/README.nb-no.md)
- [Persian / فارسی](/i18n/README.fa.md)
- [Polish / Polski](/i18n/README.pl.md)
- [葡萄牙语 / Português](/i18n/README.pt.md)
- [葡萄牙语（巴西）/Português Brasileiro](/i18n/README.pt-br.md)
- [Romanian / Română] (/i18n/README.ro.md)
- [俄语 / Pусский](/i18n/README.ru.md)
- [塞尔维亚语 / Srpski] (/i18n/README.sr.md)
- [Sinhala / සිංහල](/i18n/README.si.md)
- [西班牙语 / Español](/i18n/README.es.md)
- [Simplified Chinese / 简体中文](/i18n/README.zh-cn.md)
- [瑞典语 / Svenska](/i18n/README.sv.md)
- [泰文 / ไทย](/i18n/README.th.md)
- [Traditional Chinese / 繁体中文](/i18n/README.zh-tw.md)
- [土耳其语 / Türkçe](/i18n/README.tr.md)
- [乌克兰语 / Українська](/i18n/README.uk.md)
- [越南语/Tiếng Việt](/i18n/README.vi-vn.md)
- 

---

## 赞助商

[！[新赞助商](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)