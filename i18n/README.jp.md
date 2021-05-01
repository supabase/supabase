<p align="center">
<img width="300" src="https://gitcdn.xyz/repo/supabase/supabase/master/web/static/supabase-light.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io)は、オープンソースのFirebase代替製品です。エンタープライズグレードのオープンソースツールを使って、Firebaseの機能を構築しています。

- [x] ホスティングされたPostgresデータベース
- [x] リアルタイムサブスクリプション機能
- [x] 認証・認可
- [x] APIを自動生成
- [x] ダッシュボード
- [x] ストレージ
- [ ] ファンクションズ (近日公開)

## ドキュメンテーション

詳しいドキュメントは[supabase.io/docs](https://supabase.io/docs)をご覧ください。

## コミュニティとサポート

- [コミュニティフォーラム](https://github.com/supabase/supabase/discussions) どんな時に使うか：構築の手助け、データベースのベストプラクティスに関する議論など
- [GitHub Issue](https://github.com/supabase/supabase/issues) どんな時に使うか: Supabaseをに関するバグやエラーについて
- [Emailサポート](https://supabase.io/docs/support#business-support) どんな時に使うか: ユーザー自身ののデータベースやインフラに何か問題が発生した場合

## ステータス

- [x] Alpha: 限られたユーザーでSupabaseをテストしています。
- [x] Public Alpha: 誰でも[app.supabase.io](https://app.supabase.io)から登録ができます。ただし、バグなどがある可能性がありますので、ご容赦ください。
- [x] Public Beta: 企業以外のほとんどのユースケースに耐えうる十分な安定性を確保。
- [ ] Public: 実用的な用途に対応

現在、Public Betaを実施しています。このリポジトリの"release"にてメジャーアップデートに関する情報を発信しています。

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Supabaseの仕組み

Supabaseは、オープンソースのツールを組み合わせてできています。私たちはFirebaseの機能を、エンタープライズグレードのオープンソース製品を使って構築しています。ツールやコミュニティが存在し、MIT、Apache 2、または同等のオープンライセンスであれば、私たちはそのツールを使用し、サポートします。ツールが存在しない場合は、自分たちで構築してオープンソース化します。SupabaseはFirebaseを1対1でマッピングしたものではありません。Supabaseの目的は、オープンソースのツールを使って、Firebaseのような開発体験を提供することです。

**現在のアーキテクチャ**

Supabaseは[ホスティングされたプラットフォーム](https://app.supabase.io)です。登録するだけで、何もインストールせずに使い始めることができます。
更に現在ローカルでの開発環境を整えており、これはプラットフォームの安定性と並んで今最優先で進めているプロジェクトになります。

![アーキテクチャー](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/)は、30年以上にわたって開発・改善されてきたオブジェクトリレーショナルデータベースシステムで、信頼性、機能の堅牢性、パフォーマンスの面で高い評価を得ています。
- [Realtime](https://github.com/supabase/realtime)は、PostgreSQLのinsert、update、deleteの情報をWebsocketリアルタイムで受信することができるElixirサーバです。SupabaseはPostgresに組み込まれたレプリケーション機能に対してリッスンし、レプリケーションのバイトストリームをJSONに変換し、そのJSONをWebsocketでブロードキャストします。
- [PostgREST](http://postgrest.org/)は、PostgreSQLデータベースをRESTful APIに直接変換するウェブサーバです。
- [Storage](https://github.com/supabase/storage-api)は、S3に保存されたファイルを管理するためのRESTfulなインターフェイスで、パーミッションの管理にはPostgresを使用しています。
- [postgres-meta](https://github.com/supabase/postgres-meta) は、Postgresを管理するためのRESTful APIで、テーブルの取得、roleの追加、クエリの実行などを行うことができます。
- [GoTrue](https://github.com/netlify/gotrue) は、SWTをベースにしたユーザー管理とSWTトークンの発行のためのAPIです。
- [Kong](https://github.com/Kong/kong) は、クラウドネイティブなAPIゲートウェイです。

#### クライアント・ライブラリ

Supabaseクライアント・ライブラリはモジュール化されています。それぞれのサブライブラリが、一つの外部システムのための独立した実装となっています。こうすることで、既存のツールをサポートしています。

- **`supabase-{lang}`**: 下記全てのライブラリを内包したクライアントライブラリ
  - `postgrest-{lang}`: [PostgREST](https://github.com/postgrest/postgrest)用のクライアントライブラリ
  - `realtime-{lang}`: [Realtime](https://github.com/supabase/realtime)用のクライアントライブラリ
  - `gotrue-{lang}`: [GoTrue](https://github.com/netlify/gotrue)用のクライアントライブラリ

| レポジトリ                  | 公式                                         | コミュニティ                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust`                                                |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust`                                                |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust`                                                      |

---

## スポンサー

[![スポンサーになる](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
