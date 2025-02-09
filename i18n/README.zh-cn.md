<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) 是 Firebase 的开源替代品。我们正在使用企业级开源工具构建 Firebase 的功能。

**主要功能：**

- [x] **托管的 Postgres 数据库：** [文档](https://supabase.com/docs/guides/database)
- [x] **身份验证和授权：** [文档](https://supabase.com/docs/guides/auth)
- [x] **自动生成的 API：**
    - [x] REST: [文档](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [文档](https://supabase.com/docs/guides/graphql)
    - [x] 实时订阅： [文档](https://supabase.com/docs/guides/realtime)
- [x] **函数：**
    - [x] 数据库函数： [文档](https://supabase.com/docs/guides/database/functions)
    - [x] 边缘函数（网络边缘的函数）： [文档](https://supabase.com/docs/guides/functions)
- [x] **文件存储：** [文档](https://supabase.com/docs/guides/storage)
- [x] **用于处理 AI、向量和嵌入 (embeddings) 的工具：** [文档](https://supabase.com/docs/guides/ai)
- [x] **控制面板**

![Supabase 控制面板](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

订阅此存储库的“releases”，以获取有关重大更新的通知。这将使您了解最新的更改和改进。

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="关注存储库"/></kbd>

## 文档

完整的文档可在 [supabase.com/docs](https://supabase.com/docs) 上找到。您将在那里找到所有必要的指南和参考资料。

如果您想为项目的开发做出贡献，请参阅[入门](./../DEVELOPERS.md)部分。

## 社区和支持

*   **社区论坛：** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)。非常适合在开发中获得帮助并讨论使用数据库的最佳实践。
*   **GitHub Issues：** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues)。用于报告您在使用 Supabase 时遇到的错误和 bug。
*   **电子邮件支持：** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support)。解决数据库或基础架构问题的最佳选择。
*   **Discord：** [https://discord.supabase.com](https://discord.supabase.com)。分享您的应用程序并与社区交流的好地方。

## 工作原理

Supabase 结合了多个开源工具。我们正在使用经过验证的企业级产品构建类似于 Firebase 的功能。如果工具或社区存在并且具有 MIT、Apache 2 或类似的开放许可证，我们将使用并支持该工具。如果不存在此类工具，我们将自行创建并开源。Supabase 不是 Firebase 的精确副本。我们的目标是为开发人员提供与 Firebase 相当的便利，但使用开源工具。

**架构**

Supabase 是一个[托管平台](https://supabase.com/dashboard)。您可以注册并立即开始使用 Supabase，而无需安装任何东西。您还可以[部署自己的基础设施](https://supabase.com/docs/guides/hosting/overview)并在[本地进行开发](https://supabase.com/docs/guides/local-development)。

![架构](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL：** 一个具有 30 多年积极开发历史的对象关系数据库系统。它以其可靠性、功能性和性能而闻名。
*   **Realtime：** Elixir 上的一个服务器，允许您通过 WebSockets 监听 PostgreSQL 中的更改（插入、更新和删除）。Realtime 使用 Postgres 的内置复制功能，将更改转换为 JSON 并将其传输给授权客户端。
*   **PostgREST：** 一个将您的 PostgreSQL 数据库转换为 RESTful API 的 Web 服务器。
*   **GoTrue：** 一个基于 JWT 的 API，用于管理用户和颁发 JWT 令牌。
*   **Storage：** 提供一个 RESTful 接口来管理存储在 S3 中的文件，使用 Postgres 来管理权限。
*   **pg_graphql：** 一个提供 GraphQL API 的 PostgreSQL 扩展。
*   **postgres-meta：** 一个用于管理您的 Postgres 的 RESTful API，允许您获取表、添加角色、运行查询等。
*   **Kong：** 一个云原生 API 网关。

#### 客户端库

我们对客户端库采用模块化方法。每个子库都设计用于与单个外部系统一起工作。这是我们支持现有工具的方法之一。

（与客户端库的表格，与原文相同，但使用中文名称和解释，在需要的地方。）

| 语言                       | Supabase 客户端                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️官方⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚社区支持💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## 徽章 (Badges)

您可以使用这些徽章来表明您的应用程序是使用 Supabase 构建的：

**浅色：**

![使用 Supabase 构建](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![使用 Supabase 构建](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="使用 Supabase 构建" />
</a>
```

**深色：**

![使用 Supabase 构建（深色版本）](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![使用 Supabase 构建](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="使用 Supabase 构建" />
</a>
```

## 翻译

[翻译列表](./languages.md)
