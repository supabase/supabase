<p align="center">
<img width="300" src="https://gitcdn.xyz/repo/supabase/supabase/master/web/static/supabase-light.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io)是一个开源的 Firebase 替代品。我们正在使用企业级开源工具构建 Firebase 的特性

- [x] 主持 Postgres 数据库
- [x] 实时订阅
- [x] 身份验证和授权
- [x] 自动生成的 api
- [x] 指示板
- [x] 存储
- [ ] 函数(开发中)

## 文档

如果你想看看我们的文档，请到 supabase.io/docs

## 社群与支援

社区论坛。最适合: 帮助构建和讨论数据库最佳实践。
Github Issues: 电子邮件支持。最适合: 报告使用 Supabase 时遇到的问题。
电子邮件支持。最适合:使用数据库或基础设施时遇到的问题。

## 发展现状

- [x] Alpha: 我们正在对有限的一批客户进行 Supabase 测试
- [x] Public Alpha: 任何人都可以在[app.supabase.io](https://app.supabase.io)上进行注册。
- [x] Public Beta: 稳定,可以支持大多数非企业用例
- [ ] Public: 生产就绪软件

我们目前处于公开测试阶段。访问这个存储库的发布页面以获得关于主要更新的通知。

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## 系统的运行

Supabase は、オープンソースのツールを組み合わせてできています。私たちは Firebase の機能を、エンタープライズグレードのオープンソース製品を使って構築しています。ツールやコミュニティが存在し、MIT、Apache 2、または同等のオープンライセンスであれば、私たちはそのツールを使用し、サポートします。ツールが存在しない場合は、自分たちで構築してオープンソース化します。Supabase は Firebase を 1 対 1 でマッピングしたものではありません。Supabase の目的は、オープンソースのツールを使って、Firebase のような開発体験を提供することです。

**当前的体系结构**

Supabase は[ホスティングされたプラットフォーム](https://app.supabase.io)です。登録するだけで、何もインストールせずに使い始めることができます。
更に現在ローカルでの開発環境を整えており、これはプラットフォームの安定性と並んで今最優先で進めているプロジェクトになります。

![アーキテクチャー](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/)は、30 年以上にわたって開発・改善されてきたオブジェクトリレーショナルデータベースシステムで、信頼性、機能の堅牢性、パフォーマンスの面で高い評価を得ています。
- [Realtime](https://github.com/supabase/realtime)は、PostgreSQL の insert、update、delete の情報を Websocket リアルタイムで受信することができる Elixir サーバです。Supabase は Postgres に組み込まれたレプリケーション機能に対してリッスンし、レプリケーションのバイトストリームを JSON に変換し、その JSON を Websocket でブロードキャストします。
- [PostgREST](http://postgrest.org/)は、PostgreSQL データベースを RESTful API に直接変換するウェブサーバです。
- [Storage](https://github.com/supabase/storage-api)は、S3 に保存されたファイルを管理するための RESTful なインターフェイスで、パーミッションの管理には Postgres を使用しています。
- [postgres-meta](https://github.com/supabase/postgres-meta) は、Postgres を管理するための RESTful API で、テーブルの取得、role の追加、クエリの実行などを行うことができます。
- [GoTrue](https://github.com/netlify/gotrue) は、SWT をベースにしたユーザー管理と SWT トークンの発行のための API です。
- [Kong](https://github.com/Kong/kong) は、クラウドネイティブな API ゲートウェイです。

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

## 赞助商

[![新赞助商](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
