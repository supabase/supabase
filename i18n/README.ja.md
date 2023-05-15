<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# スーパーベース

[Supabase](https://supabase.com) は、オープンソースのFirebaseの代替品です。エンタープライズグレードのオープンソースツールを使って、Firebaseの機能を構築しています。

- [x] ホスティングされたPostgresデータベースです。[ドックス](https://supabase.com/docs/guides/database)
- [x] 認証と認可。[ドキュメント](https://supabase.com/docs/guides/auth)
- [x] 自動生成されるAPI。
  - [x] REST。[ドキュメント](https://supabase.com/docs/guides/database/api#rest-api)
  - [x] GraphQL。[Docs](https://supabase.com/docs/guides/database/api#graphql-api)
  - [x] リアルタイムサブスクリプション。[ドキュメント](https://supabase.com/docs/guides/database/api#realtime-api)
- [x] 関数。
  - [x] データベースファンクション。[Docs](https://supabase.com/docs/guides/database/functions)
  - [x] エッジ機能 [Docs](https://supabase.com/docs/guides/functions)
- [x] ファイルストレージ。[Docs](https://supabase.com/docs/guides/storage)
- [x] ダッシュボード

![スーパーベースダッシュボード](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## ドキュメンテーション

完全なドキュメントは、[supabase.com/docs](https://supabase.com/docs)を参照してください。

貢献の仕方については、[Getting Started](./DEVELOPERS.md) を参照してください。

## コミュニティとサポート

- [コミュニティ・フォーラム](https://github.com/supabase/supabase/discussions)。最適な場所：ビルドに関するヘルプ、データベースのベストプラクティスに関する議論。
- [GitHub Issues](https://github.com/supabase/supabase/issues).Supabaseを使用していて遭遇したバグやエラーに対処する。
- [メールサポート](https://supabase.com/docs/support#business-support).あなたのデータベースやインフラに関する問題。
- [Discord】(https://discord.supabase.com).アプリケーションを共有したり、コミュニティと交流するのに適しています。

## ステータス

- [x] アルファ：Supabaseをクローズドな顧客セットでテストしています。
- [x] Public Alpha：誰でも [app.supabase.com](https://app.supabase.com) でサインアップすることができます。しかし、いくつかの問題がありますので、ご容赦ください。
- [x] パブリックベータ版：企業以外のほとんどのユースケースで十分に安定している。
- [ ] パブリック：一般公開 [[ステータス](https://supabase.com/docs/guides/getting-started/features#feature-status)]。

現在、パブリックベータ版です。メジャーアップデートの通知を受けるには、このレポの "releases" を見てください。

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="このレポを見る"/></kbd>。

---

## 仕組み

Supabaseは、オープンソースツールの組み合わせです。私たちは、エンタープライズグレードのオープンソース製品を使ってFirebaseの機能を構築しています。ツールやコミュニティが存在し、MIT、Apache 2、または同等のオープンライセンスがあれば、そのツールを使用しサポートします。ツールが存在しない場合は、私たち自身で構築し、オープンソース化します。Supabaseは、Firebaseの1対1マッピングではありません。私たちの目的は、オープンソースツールを使ってFirebaseのような開発者体験を開発者に提供することです。

**アーキテクチャー

Supabaseは[hosted platform](https://app.supabase.com)です。サインアップすれば、何もインストールすることなくSupabaseを使い始めることができます。
また、[セルフホスト](https://supabase.com/docs/guides/hosting/overview)や[ローカル開発](https://supabase.com/docs/guides/local-development)も可能です。

![アーキテクチャ](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.png)

- [PostgreSQL](https://www.postgresql.org/)は、オブジェクトリレーショナルデータベースシステムで、30年以上の活発な開発により、信頼性、機能の堅牢性、パフォーマンスで高い評価を受けています。
- [Realtime](https://github.com/supabase/realtime) はElixirサーバーで、PostgreSQLの挿入、更新、削除をwebsocketを使ってリッスンすることが可能です。Realtimeは、Postgresの組み込みレプリケーション機能でデータベースの変更をポーリングし、変更をJSONに変換し、JSONをwebsocketで認可されたクライアントにブロードキャストします。
- [PostgREST](http://postgrest.org/) は、PostgreSQLデータベースを直接RESTful APIに変換するウェブサーバです。
- [pg_graphql](http://github.com/supabase/pg_graphql/) GraphQL APIを公開するPostgreSQL拡張です。
- [Storage](https://github.com/supabase/storage-api)は、S3に保存されたファイルを管理するためのRESTfulインターフェースを提供し、Postgresを使用してパーミッションを管理する。
- [Postgres-meta](https://github.com/supabase/postgres-meta) は、Postgresを管理するためのRESTful APIで、テーブルの取得、ロールの追加、クエリの実行などを行うことができます。
- [GoTrue](https://github.com/netlify/gotrue)は、ユーザーを管理し、SWTトークンを発行するためのSWTベースのAPIです。
- [Kong](https://github.com/Kong/kong)は、クラウドネイティブなAPIゲートウェイです。

#### クライアントライブラリ

クライアントライブラリのアプローチはモジュール化されています。各サブライブラリは、1つの外部システムに対するスタンドアロンな実装です。これは、私たちが既存のツールをサポートする方法の1つです。

<table style="table-layout:fixed; white-space: nowrap;">（テーブルレイアウト：固定）。
  <tr>
    <th>言語</th></th
    <th>クライアント</th></th
    <th colspan="5">Feature-Clients (Supabaseクライアントにバンドル)</th></th>。
  </tr>
  
    <th></th>
    <th>スーパーベース</th></td
    <th><a href="https://github.com/postgrest/postgrest" target="_blank" rel="noopener noreferrer">PostgREST</a></th>。
    <th><a href="https://github.com/supabase/gotrue" target="_blank" rel="noopener noreferrer">GoTrue</a></th></th>。
    <th><a href="https://github.com/supabase/realtime" target="_blank" rel="noopener noreferrer">リアルタイム</a></th></th>。
    <th><a href="https://github.com/supabase/storage-api" target="_blank" rel="noopener noreferrer">ストレージ</a></th></th>。
    <th>ファンクション</th></th
  </tr>
  <!-- 新しい行のテンプレート -->
  <!-- START ROW
  
    <td>lang</td>
    <td><a href="https://github.com/supabase-community/supabase-lang" target="_blank" rel="noopener noreferrer">supabase-lang</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-lang" target="_blank" rel="noopener noreferrer">postgrest-lang</a></td></td>。
    <td><a href="https://github.com/supabase-community/gotrue-lang" target="_blank" rel="noopener noreferrer">gotrue-lang</a></td></td>。
    <td><a href="https://github.com/supabase-community/realtime-lang" target="_blank" rel="noopener noreferrer">realtime-lang</a></td>
    <td><a href="https://github.com/supabase-community/storage-lang" target="_blank" rel="noopener noreferrer">ストレージ関連</a></td></a></td>。
  </tr>
  行を終了します。
  <th colspan="7">⚡️ 公式 ⚡️</th>
  
    <td>JavaScript（TypeScript）</td>。
    <td><a href="https://github.com/supabase/supabase-js" target="_blank" rel="noopener noreferrer">supabase-js</a></td>
    <td><a href="https://github.com/supabase/postgrest-js" target="_blank" rel="noopener noreferrer">postgrest-js</a></td>。
    <td><a href="https://github.com/supabase/gotrue-js" target="_blank" rel="noopener noreferrer">gotrue-js</a></td>。
    <td><a href="https://github.com/supabase/realtime-js" target="_blank" rel="noopener noreferrer">realtime-js</a></td>
    <td><a href="https://github.com/supabase/storage-js" target="_blank" rel="noopener noreferrer">storage-js</a></td>。
    <td><a href="https://github.com/supabase/functions-js" target="_blank" rel="noopener noreferrer">functions-js</a></td>。
  </td> </tr> </table
    
    <td>フラッター</td
    <td><a href="https://github.com/supabase/supabase-flutter" target="_blank" rel="noopener noreferrer">supabase-flutter</a></td>
    <td><a href="https://github.com/supabase/postgrest-dart" target="_blank" rel="noopener noreferrer">postgrest-dart</a></td>
    <td><a href="https://github.com/supabase/gotrue-dart" target="_blank" rel="noopener noreferrer">ゴトルエダーツ</a></td></td
    <td><a href="https://github.com/supabase/realtime-dart" target="_blank" rel="noopener noreferrer">realtime-dart</a></td>
    <td><a href="https://github.com/supabase/storage-dart" target="_blank" rel="noopener noreferrer">storage-dart</a></td>
    <td><a href="https://github.com/supabase/functions-dart" target="_blank" rel="noopener noreferrer">functions-dart</a></td> <td><a href="https://github.com/supabase/functions-dart" target="_blank" rel="noopener noreferrer">functions-dart</a></td>
  </td> </tr> <td
  <th colspan="7">💚コミュニティ💚</th></td
  
    <td>C#</td>
    <td><a href="https://github.com/supabase-community/supabase-csharp" target="_blank" rel="noopener noreferrer">supabase-charp</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-csharp" target="_blank" rel="noopener noreferrer">postgrest-csharp</a></td></td>。
    <td><a href="https://github.com/supabase-community/gotrue-csharp" target="_blank" rel="noopener noreferrer">ゴトクシャープ</a></td></td
    <td><a href="https://github.com/supabase-community/realtime-csharp" target="_blank" rel="noopener noreferrer">realtime-csharp</a></td>
    <td><a href="https://github.com/supabase-community/storage-csharp" target="_blank" rel="noopener noreferrer">ストレージ-シャープ</a></td>。
    <td><a href="https://github.com/supabase-community/functions-csharp" target="_blank" rel="noopener noreferrer">functions-csharp</a></td> <td><a href="https://github.com/supabase-community/functions-csharp" target="_blank" rel="noopener noreferrer">functions-csharp</a></td>
  </td> </tr> </table
  </td> </tr> <td>Go
    <td>ゴー</td></td></td></td></td></td></td
    <td>-</td> <td>-</td>
    <td><a href="https://github.com/supabase-community/postgrest-go" target="_blank" rel="noopener noreferrer">postgrest-go</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-go" target="_blank" rel="noopener noreferrer">ゴットル号</a></td></td
    <td>-</td>
    <td><a href="https://github.com/supabase-community/storage-go" target="_blank" rel="noopener noreferrer">ストレージ-go</a></td></td
    <td><a href="https://github.com/supabase-community/functions-go" target="_blank" rel="noopener noreferrer">functions-go</a></td> <td><a href="https://github.com/supabase-community/functions-go" target="_blank" rel="noopener noreferrer">functions-go</a></td>
  </td> </tr> </table
  
    <td>Java</td>の場合
    <td>-</td> <td>-</td>
    <td>-</td> <td>-</td> <td>-</td
    <td><a href="https://github.com/supabase-community/gotrue-java" target="_blank" rel="noopener noreferrer">gotrue-java</a></td>.
    <td>-</td>
    <td><a href="https://github.com/supabase-community/storage-java" target="_blank" rel="noopener noreferrer">storage-java</a></td>。
    <td>-</td> <td>-</td> <td>-</td
  </td> </tr> </table
  
    <td>Kotlin(コトリン)</td></td
    <td><a href="https://github.com/supabase-community/supabase-kt" target="_blank" rel="noopener noreferrer">supabase-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Postgrest" target="_blank" rel="noopener noreferrer">postgrest-kt</a></td></td>。
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/GoTrue" target="_blank" rel="noopener noreferrer">ゴトルエ-kt</a></td>。
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Realtime" target="_blank" rel="noopener noreferrer">realtime-kt</a></td> <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Realtime" target="_blank" rel="noopener noreferrer">realtime-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Storage" target="_blank" rel="noopener noreferrer">ストレージ-kt</a></td></td>。
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Functions" target="_blank" rel="noopener noreferrer">functions-kt</a></td>
  </td> </tr> </table
  </tr> <td>Python
    <td>Python</td>（パイソン）</td>。
    <td><a href="https://github.com/supabase-community/supabase-py" target="_blank" rel="noopener noreferrer">supabase-py</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-py" target="_blank" rel="noopener noreferrer">postgrest-py</a></td>。
    <td><a href="https://github.com/supabase-community/gotrue-py" target="_blank" rel="noopener noreferrer">gotrue-py</a></td>。
    <td><a href="https://github.com/supabase-community/realtime-py" target="_blank" rel="noopener noreferrer">リアルタイムのパイ</a></td>。
    <td><a href="https://github.com/supabase-community/storage-py" target="_blank" rel="noopener noreferrer">storage-py</a></td>。
    <td><a href="https://github.com/supabase-community/functions-py" target="_blank" rel="noopener noreferrer">functions-py</a></td>。
  </tr>
  </td> </tr> <td>Ruby
    <td>Ruby</td>（ルビー）</td
    <td><a href="https://github.com/supabase-community/supabase-rb" target="_blank" rel="noopener noreferrer">supabase-rb</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-rb" target="_blank" rel="noopener noreferrer">postgrest-rb</a></td>。
    <td>-</td> <td>-</td> <td>-</td
    <td>-</td> <td>-</td> <td>-</td> <td>-</td
    <td>-</td> <td>-</td> <td>-</td> <td>-</td
    <td>-</td> <td>-</td> <td>-</td> <td>-</td
  </td> </tr><tr
  
    <td>ラスト</td
    <td>-</td> </tr> <td>-</td
    <td><a href="https://github.com/supabase-community/postgrest-rs" target="_blank" rel="noopener noreferrer">postgrest-rs</a></td>
    <td>-</td> <td>-</td> <td>-</td
    <td>-</td> <td>-</td> <td>-</td> <td>-</td
    <td>-</td> <td>-</td> <td>-</td> <td>-</td
    <td>-</td> <td>-</td> <td>-</td> <td>-</td
  </td> </tr><tr
  
    <td>スウィフト</td></td
    <td><a href="https://github.com/supabase-community/supabase-swift" target="_blank" rel="noopener noreferrer">supabase-swift</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-swift" target="_blank" rel="noopener noreferrer">postgrest-swift</a></td>。
    <td><a href="https://github.com/supabase-community/gotrue-swift" target="_blank" rel="noopener noreferrer">ゴットルースイフト</a></td></td
    <td><a href="https://github.com/supabase-community/realtime-swift" target="_blank" rel="noopener noreferrer">リアルタイムシフト</a></td></td
    <td><a href="https://github.com/supabase-community/storage-swift" target="_blank" rel="noopener noreferrer">storage-swift</a></td>。
    <td><a href="https://github.com/supabase-community/functions-swift" target="_blank" rel="noopener noreferrer">functions-swift</a></td>。
  </td> </tr> </table
  
    <td>Godotエンジン（GDScript）</td
    <td><a href="https://github.com/supabase-community/godot-engine.supabase" target="_blank" rel="noopener noreferrer">supabase-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-gdscript" target="_blank" rel="noopener noreferrer">postgrest-gdscript</a></td></td>。
    <td><a href="https://github.com/supabase-community/gotrue-gdscript" target="_blank" rel="noopener noreferrer">gotrue-gdscript</a></td>。
    <td><a href="https://github.com/supabase-community/realtime-gdscript" target="_blank" rel="noopener noreferrer">realtime-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/storage-gdscript" target="_blank" rel="noopener noreferrer">storage-gdscript</a></td></td>。
    <td><a href="https://github.com/supabase-community/functions-gdscript" target="_blank" rel="noopener noreferrer">functions-gdscript</a></td>。
  </td> </tr>
</td> </tr> </table

<!--- 他の言語に翻訳する場合は、このリストを削除してください、複数のファイルで更新し続けるのは大変です-->。
<!--- 翻訳ファイルのリストへのリンクだけは残しておく-->。

## 翻訳

- [アラビア語 | العربية](/i18n/README.ar.md)
- [アルバニア語｜Shqip](/i18n/README.sq.md)
- [バングラ / বাংলা](/i18n/README.bn.md)
- [ブルガリア語 / Български](/i18n/README.bg.md)
- [カタルーニャ語 / Català](/i18n/README.ca.md)
- [デンマーク語 / Dansk】(/i18n/README.da.md)
- [オランダ語 / ネーデルランド語](/i18n/README.nl.md)
- [英語](https://github.com/supabase/supabase)
- [フィンランド語 / Suomalainen](/i18n/README.fi.md)
- [フランス語 / フランセ](/i18n/README.fr.md)
- [German / Deutsch](/i18n/README.de.md)
- [ギリシャ語 / Ελληνικά】(/i18n/README.gr.md)
- [ヘブライ語／עברית](/i18n/README.he.md)
- [ヒンディー語 / हिंदी】(/i18n/README.hi.md)
- [ハンガリー語 / マジャール語](/i18n/README.hu.md)
- [ネパール語 / नेपाली】(/i18n/README.ne.md)
- [インドネシア語 / バハサ・インドネシア](/i18n/README.id.md)
- [イタリア語 / イタリア語](/i18n/README.it.md)
- [日本語 / 日本語](/i18n/README.jp.md)
- [韓国語/한국어](/i18n/README.ko.md)
- [マレー語 / バハサ・マレーシア](/i18n/README.ms.md)
- [ノルウェー語（ブークモール） / Norsk (Bokmål)](/i18n/README.nb-no.md)
- [ペルシア語 / فارسی](/i18n/README.fa.md)
- [ポーランド語 / ポーランド語](/i18n/README.pl.md)
- [ポルトガル語 / Português](/i18n/README.pt.md)
- [ポルトガル語 (ブラジル) / Português Brasileiro](/i18n/README.pt-br.md)
- [ルーマニア語 / Română](/i18n/README.ro.md)
- [ロシア語 / Pусский](/i18n/README.ru.md)
- [セルビア語 / Srpski](/i18n/README.sr.md)
- [シンハラ語 / සි퓥퓥](/i18n/README.si.md)
- [スペイン語／Español](/i18n/README.es.md)
- [簡体字中国語 / 简体中文](/i18n/README.zh-cn.md)
- [スウェーデン語 / Svenska](/i18n/README.sv.md)
- [タイ語 / ไทย](/i18n/README.th.md)
- [中国語 / 繁体中文](/i18n/README.zh-tw.md)
- [トルコ語 / Türkçe](/i18n/README.tr.md)
- [ウクライナ語/Українська](/i18n/README.uk.md)
- [ベトナム語 / Tiếng Việt](/i18n/README.vi-vn.md)
- [翻訳一覧](/i18n/languages.md) <!--- これだけは残しておいてください -->。

---

## スポンサー

[[新スポンサー](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)