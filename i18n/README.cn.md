<p align="center">
  <img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/web/static/supabase-light-rounded-corner-background.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io)是一个开源的 Firebase 替代品。我们正在使用企业级开源工具构建 Firebase 的特性

- [x] Postgres 数据库托管
- [x] 实时订阅
- [x] 身份验证和授权
- [x] 自动生成的 api
- [x] 仪表盘
- [x] 存储
- [ ] 函数(开发中)

## 文档

完整文档[supabase.io/docs](supabase.io/docs)

## 社群与支援

社区论坛。适用于: 帮助构建和讨论数据库最佳实践。
Github Issues: 适用于: 报告使用 Supabase 时遇到的问题。
电子邮件支持。适用于: 使用数据库或基础设施时遇到的问题。

## 发展现状

- [x] Alpha: 我们正在对有限的一批客户进行 Supabase 测试
- [x] Public Alpha: 任何人都可以在[app.supabase.io](https://app.supabase.io)上进行注册。
- [x] Public Beta: 稳定,可以支持大多数非企业用例
- [ ] Public: 生产就绪软件

我们目前处于 Public Beta 阶段。关注 "Releases" 以获得关于重大更新的通知。

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## 工作方式

Supabase 是一个开源工具的组合。我们使用企业级的开源产品来构建 Firebase 的特性。 如果存在相应的工具和社区，并且有 MIT、Apache 2 或同等的开放许可，我们将使用并支持该工具。如果这个工具不存在，我们将自己开发和开源它。Supabase 不是 Firebase 的一对一映射。我们的目标是让开发人员使用开源工具获得类似 firebase 的开发体验。

**当前架构**

Supabase 是一个[托管平台](https://app.supabase.io)。您可以注册并开始使用 Supabase，而无需安装任何软件。我们仍在优化本地开发体验，这和平台稳定性一起作为我们当前的核心目标。

![软件架构图](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/)是一个对象关系数据库系统，经过了超过 30 年的积极开发，在可靠性、特性健壮性和性能方面赢得了声誉。
- [Realtime](https://github.com/supabase/realtime)是一个 Elixir 服务器，允许你监听 PostgreSQL 插入，更新和删除使用 websockets。Supabase 监听 Postgres 内置的复制功能，将复制字节流转换成 JSON，然后通过 websocket 广播 JSON。
- [PostgREST](http://postgrest.org/)是一个 web 服务器，把你的 PostgreSQL 数据库直接生成 RESTful API。
- [Storage](https://github.com/supabase/storage-api)提供一个 RESTful 接口来管理存储在 S3 中的文件，使用 Postgres 管理权限。

- [postgres-meta](https://github.com/supabase/postgres-meta) 是一个用于管理 Postgres 的 RESTful API，允许你获取表，添加角色，运行查询等。
- [GoTrue](https://github.com/netlify/gotrue)这是一个基于 SWT 的 API，用于管理用户和发布 SWT 令牌。
- [Kong](https://github.com/Kong/kong) 是一个原生云 API 网关。

#### 客户端库

Supabase 的客户端库由模块组成，每个模块的功能独立。通过这个结构，我们可以帮助支持现有的工具。

- **`supabase-{lang}`**: 组合客户端库并对其进行增强
  - `postgrest-{lang}`: [PostgREST](https://github.com/postgrest/postgrest)与 postgres 交互的客户端库
  - `realtime-{lang}`: [Realtime](https://github.com/supabase/realtime)与 Realtime 交互的客户端库
  - `gotrue-{lang}`: [GoTrue](https://github.com/netlify/gotrue)与 GoTrue 交互的客户端库

| 代码存储库            | 正式版                                           | 社区版                                                                                                                                                                                                                     |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust`                                                |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust`                                                |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust`                                                      |

---

## 赞助

[![加入赞助](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
