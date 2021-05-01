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

## 社群与支援

## 发展现状

- [x] Alpha: 限られたユーザーで Supabase をテストしています。
- [x] Public Alpha: 誰でも[app.supabase.io](https://app.supabase.io)から登録ができます。ただし、バグなどがある可能性がありますので、ご容赦ください。
- [x] Public Beta: 企業以外のほとんどのユースケースに耐えうる十分な安定性を確保。
- [ ] Public: 実用的な用途に対応

現在、Public Beta を実施しています。このリポジトリの"release"にてメジャーアップデートに関する情報を発信しています。

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## How it works

Supabase は、オープンソースのツールを組み合わせてできています。私たちは Firebase の機能を、エンタープライズグレードのオープンソース製品を使って構築しています。ツールやコミュニティが存在し、MIT、Apache 2、または同等のオープンライセンスであれば、私たちはそのツールを使用し、サポートします。ツールが存在しない場合は、自分たちで構築してオープンソース化します。Supabase は Firebase を 1 対 1 でマッピングしたものではありません。Supabase の目的は、オープンソースのツールを使って、Firebase のような開発体験を提供することです。

**Current Architecture**

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

#### Client Libraries

Supabase クライアント・ライブラリはモジュール化されています。それぞれのサブライブラリが、一つの外部システムのための独立した実装となっています。こうすることで、既存のツールをサポートしています。

- **`supabase-{lang}`**: 下記全てのライブラリを内包したクライアントライブラリ
  - `postgrest-{lang}`: [PostgREST](https://github.com/postgrest/postgrest)用のクライアントライブラリ
  - `realtime-{lang}`: [Realtime](https://github.com/supabase/realtime)用のクライアントライブラリ
  - `gotrue-{lang}`: [GoTrue](https://github.com/netlify/gotrue)用のクライアントライブラリ

| レポジトリ            | 公式                                             | コミュニティ                                                                                                                                                                                                               |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust`                                                |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust`                                                |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust`                                                      |

---

## 赞助商

[![新赞助商](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
