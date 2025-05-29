<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) は Firebase のオープンソース代替製品です。エンタープライズ グレードのオープンソース ツールを使用して、Firebase の機能を構築しています。

**主な機能:**

- [x] **マネージド Postgres データベース:** [ドキュメント](https://supabase.com/docs/guides/database)
- [x] **認証と認可:** [ドキュメント](https://supabase.com/docs/guides/auth)
- [x] **自動生成 API:**
    - [x] REST: [ドキュメント](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [ドキュメント](https://supabase.com/docs/guides/graphql)
    - [x] リアルタイム サブスクリプション: [ドキュメント](https://supabase.com/docs/guides/realtime)
- [x] **関数:**
    - [x] データベース関数: [ドキュメント](https://supabase.com/docs/guides/database/functions)
    - [x] エッジ関数 (ネットワークのエッジでの関数): [ドキュメント](https://supabase.com/docs/guides/functions)
- [x] **ファイル ストレージ:** [ドキュメント](https://supabase.com/docs/guides/storage)
- [x] **AI、ベクター、埋め込み (embeddings) ツール:** [ドキュメント](https://supabase.com/docs/guides/ai)
- [x] **ダッシュボード**

![Supabase ダッシュボード](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

このリポジトリの "releases" を購読して、重要な更新に関する通知を受け取ってください。これにより、最新の変更や改善について常に把握できます。

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="リポジトリをウォッチ"/></kbd>

## ドキュメント

完全なドキュメントは [supabase.com/docs](https://supabase.com/docs) で入手できます。必要なすべてのガイドとリファレンス資料がそこにあります。

プロジェクトの開発に貢献したい場合は、[はじめに](./../DEVELOPERS.md) セクションを参照してください。

## コミュニティとサポート

*   **コミュニティ フォーラム:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). 開発に関するヘルプを得たり、データベースを操作するためのベスト プラクティスについて議論したりするのに最適です。
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Supabase を使用する際に発生したバグや問題を報告するために使用します。
*   **メール サポート:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). データベースまたはインフラストラクチャの問題を解決するための最良のオプションです。
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). アプリケーションを共有したり、コミュニティとコミュニケーションしたりするのに最適な場所です。

## 動作原理

Supabase は、いくつかのオープンソース ツールを組み合わせています。エンタープライズ グレードの実績のある製品を使用して、Firebase と同様の機能を構築しています。ツールまたはコミュニティが存在し、MIT、Apache 2、または同様のオープン ライセンスがある場合は、そのツールを使用およびサポートします。そのようなツールが存在しない場合は、自分で作成してソース コードを公開します。Supabase は Firebase の正確な複製ではありません。私たちの目標は、開発者に Firebase と同等の利便性を、オープンソース ツールを使用して提供することです。

**アーキテクチャ**

Supabase は [マネージド プラットフォーム](https://supabase.com/dashboard) です。何もインストールせずに、サインアップしてすぐに Supabase を使い始めることができます。[独自のインフラストラクチャをデプロイ](https://supabase.com/docs/guides/hosting/overview) して [ローカルで開発](https://supabase.com/docs/guides/local-development) することもできます。

![アーキテクチャ](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** 30 年以上の活発な開発の歴史を持つオブジェクト リレーショナル データベース システム。信頼性、機能性、パフォーマンスで知られています。
*   **Realtime:** Websocket を介して PostgreSQL の変更 (挿入、更新、削除) をリッスンできる Elixir サーバー。Realtime は Postgres の組み込みレプリケーション機能を使用し、変更を JSON に変換して、認証されたクライアントに送信します。
*   **PostgREST:** PostgreSQL データベースを RESTful API に変換する Web サーバー。
*   **GoTrue:** ユーザーを管理し、JWT トークンを発行するための JWT ベースの API。
*   **Storage:** S3 に保存されたファイルを管理するための RESTful インターフェイスを提供し、Postgres を使用して権限を管理します。
*   **pg_graphql:** GraphQL API を提供する PostgreSQL 拡張機能。
*   **postgres-meta:** Postgres を管理するための RESTful API。テーブルの取得、ロールの追加、クエリの実行などが可能です。
*   **Kong:** クラウドネイティブ API ゲートウェイ。

#### クライアント ライブラリ

クライアント ライブラリにはモジュラー アプローチを使用しています。各サブライブラリは、単一の外部システムと連携するように設計されています。これは、既存のツールをサポートする方法の 1 つです。

(元の表のようなクライアント ライブラリの表ですが、日本語名と必要に応じて説明が追加されています。)

| 言語                       | Supabase クライアント                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️公式⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚コミュニティ サポート💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## バッジ (Badges)

これらのバッジを使用して、アプリケーションが Supabase で構築されていることを示すことができます。

**ライト:**

![Supabase で作成](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Supabase で作成](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Supabase で作成" />
</a>
```

**ダーク:**

![Supabase で作成 (ダーク バージョン)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Supabase で作成](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Supabase で作成" />
</a>
```

## 翻訳

[翻訳リスト](./languages.md)
