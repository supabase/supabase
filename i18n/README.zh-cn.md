<p align="center">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/web/static/supabase-light-rounded-corner-background.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io) 是一个开源的 Firebase 替代品。我们正在使用企业级的开源工具构建 Firebase 的功能。

- [x] Postgres 数据库托管
- [x] 实时订阅
- [x] 身份验证和授权
- [x] 自动生成的 API
- [x] 仪表盘
- [x] 存储
- [ ] 函数（即将推出）

## 文档

完整的文档，请访问 [supabase.io/docs](https://supabase.io/docs)

## 社区与支持

- [社区论坛](https://github.com/supabase/supabase/discussions)。适用于：帮助建立和讨论数据库的最佳实践。
- [GitHub Issues](https://github.com/supabase/supabase/issues)。适用于：你在使用 Supabase 时遇到的 bug 和错误。
- [电子邮件支持](https://supabase.io/docs/support#business-support)。适用于：你的数据库或基础设施的问题。

## 状态

- [x] Alpha：我们正在与一组封闭的客户测试 Supabase
- [x] Public Alpha：任何人都可以在 [app.supabase.io]（https://app.supabase.io）上注册。只是务必手下留情，还有一些纠结的地方。
- [x] Public Beta：足够稳定，适合大多数非企业使用场景
- [ ] Public：生产就绪

我们目前正处于 Public Beta 阶段。关注这个存储库的 "Releases" 以获得关于重大更新的通知。

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="关注这个存储库"/></kbd>

---

## 工作方式

Supabase 是一个开源工具的组合。我们正在使用企业级的开源产品构建 Firebase 的功能。如果存在相应的工具和社区，并且有 MIT、Apache 2 或同等的开放许可，我们将使用并支持该工具。如果该工具不存在，我们就自己开发并开放源代码。Supabase 不是 Firebase 的一对一映射。我们的目标是使用开源工具为开发者提供类似 Firebase 的开发者体验。

**当前架构**

Supabase 是一个[托管平台](https://app.supabase.io)。你可以注册并开始使用 Supabase，而无需安装任何软件。我们仍在优化本地开发体验，这和平台稳定性一起作为我们当前的核心目标。

![架构](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/) 是一个对象关系型数据库系统，经过 30 多年的积极开发，它在可靠性、功能健壮性和性能方面赢得了很好的声誉。
- [Realtime](https://github.com/supabase/realtime) 是一个 Elixir 服务器，允许你使用 WebSocket 监听 PostgreSQL 的插入、更新和删除。Supabase 监听 Postgres 的内置复制功能，将复制的字节流转换为 JSON，然后通过 WebSocket 广播 JSON。
- [PostgREST](http://postgrest.org/) 是一个 Web 服务器，可以将你的 PostgreSQL 数据库直接生成 RESTful API
- [Storage](https://github.com/supabase/storage-api) 提供了一个 RESTful 接口，用于管理存储在 S3 中的文件，使用 Postgres 来管理权限。
- [postgres-meta](https://github.com/supabase/postgres-meta) 是一个 RESTful API，用于管理你的 Postgres，允许你获取表、添加角色和运行查询等。
- [GoTrue](https://github.com/netlify/gotrue) 是一个基于 SWT 的 API，用于管理用户和发布 SWT 令牌。
- [Kong](https://github.com/Kong/kong) 是一个云原生 API 网关。

#### 客户端库

我们的客户库是模块化的。每一个子库都是一个独立的实现，用于一个单一的外部系统。这是我们支持现有工具的方式之一。

- **`supabase-{lang}`**：组合客户端库并对其进行增强。
  - `postgrest-{lang}`：与 [PostgREST](https://github.com/postgrest/postgrest) 交互的客户端库
  - `realtime-{lang}`：与 [Realtime](https://github.com/supabase/realtime) 交互的客户端库
  - `gotrue-{lang}`：与 [GoTrue](https://github.com/netlify/gotrue) 交互的客户端库

| 代码存储库            | 官方                                             | 社区                                                                                                                                                                                                                                                                                                                                 |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust` \| [`Ruby`](https://github.com/supabase/supabase-rb) \| `Go`                                                                                             |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) \| [`Ruby`](https://github.com/supabase/postgrest-rb) \| [`Go`](https://github.com/supabase/postgrest-go) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust` \| `Ruby` \| `Go`                                                                                                                                        |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust` \| `Ruby` \| `Go`                                                                                                                                              |

## 翻译

- [翻译列表](/i18n/languages.md)

---

## 赞助

[![加入赞助](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
