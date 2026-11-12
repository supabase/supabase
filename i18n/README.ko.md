<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com)는 파이어베이스의 오픈소스 대안입니다. 엔터프라이즈급 오픈 소스 도구를 사용하여 Firebase의 기능을 구축하고 있습니다.

- [x] 호스팅된 Postgres 데이터베이스. [문서](https://supabase.com/docs/guides/database)
- [x] 인증 및 권한 부여. [문서](https://supabase.com/docs/guides/auth)
- [x] 자동 생성 API.
  - [x] REST. [문서](https://supabase.com/docs/guides/api#rest-api-overview)
  - [x] GraphQL. [문서](https://supabase.com/docs/guides/api#graphql-api-overview)
  - [x] 실시간 구독. [문서](https://supabase.com/docs/guides/api#realtime-api-overview)
- [x] 함수.
  - [x] 데이터베이스 함수. [Docs](https://supabase.com/docs/guides/database/functions)
  - [x] 엣지 기능 [문서](https://supabase.com/docs/guides/functions)
- [x] 파일 스토리지. [Docs](https://supabase.com/docs/guides/storage)
- [x] AI + 벡터/임베딩스 툴킷. [Docs](https://supabase.com/docs/guides/ai)
- [x] 대시보드

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

주요 업데이트에 대한 알림을 받으려면 이 리포지토리의 "릴리즈"를 살펴보세요.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

## 문서

전체 문서는 [supabase.com/docs](https://supabase.com/docs)에서 확인하실 수 있습니다

기여 방법을 확인하려면 [시작하기](../DEVELOPERS.md)를 방문하세요

## 커뮤니티 및 지원

- [커뮤니티 포럼](https://github.com/supabase/supabase/discussions). 가장 적합한 대상: 구축에 대한 도움말, 데이터베이스 모범 사례에 대한 토론.
- [깃허브 이슈](https://github.com/supabase/supabase/issues). 최상의 용도: Supabase 사용 중 발생하는 버그 및 오류.
- [이메일 지원](https://supabase.com/docs/support#business-support). 최상의 대상: 데이터베이스 또는 인프라 문제.
- [디스코드](https://discord.supabase.com). 최고의 용도: 애플리케이션 공유 및 커뮤니티와의 교류.

---

## 작동 방식

Supabase는 오픈 소스 도구의 조합입니다. 저희는 엔터프라이즈급 오픈 소스 제품을 사용하여 Firebase의 기능을 구축하고 있습니다. MIT, Apache 2 또는 이에 상응하는 오픈 라이선스가 있는 도구와 커뮤니티가 존재하는 경우, 해당 도구를 사용하고 지원합니다. 도구가 존재하지 않는 경우에는 직접 빌드하여 오픈소스로 제공합니다. Supabase는 Firebase를 1:1로 매핑하지 않습니다. 우리의 목표는 개발자에게 오픈 소스 도구를 사용하여 Firebase와 같은 개발자 환경을 제공하는 것입니다.

**아키텍처**

Supabase는 [호스팅 플랫폼](https://supabase.com/dashboard)입니다. 가입만 하면 아무것도 설치하지 않고 Supabase를 사용할 수 있습니다.
[자체 호스팅](https://supabase.com/docs/guides/hosting/overview) 및 [로컬 개발](https://supabase.com/docs/guides/local-development)도 가능합니다.

![아키텍처](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.svg)

- [PostgreSQL](https://www.postgresql.org/)은 30년 이상 활발하게 개발되어 안정성, 기능 견고성 및 성능에 대한 높은 평판을 얻고 있는 객체 관계형 데이터베이스 시스템입니다.
- [Realtime](https://github.com/supabase/realtime)은 웹소켓을 사용하여 PostgreSQL 삽입, 업데이트, 삭제를 수신할 수 있는 Elixir 서버입니다. Realtime은 데이터베이스 변경 사항에 대해 Postgres의 기본 제공 복제 기능을 폴링하고, 변경 사항을 JSON으로 변환한 다음, 웹 소켓을 통해 승인된 클라이언트에 JSON을 브로드캐스트합니다.
- [PostgREST](http://postgrest.org/)는 PostgreSQL 데이터베이스를 RESTful API로 직접 전환하는 웹 서버입니다.
- [GoTrue](https://github.com/supabase/gotrue)는 사용자를 관리하고 JWT 토큰을 발행하기 위한 JWT 기반 API입니다.
- [스토리지](https://github.com/supabase/storage-api)는 Postgres를 사용하여 권한을 관리하고 S3에 저장된 파일을 관리하기 위한 RESTful 인터페이스를 제공합니다.
- [pg_graphql](http://github.com/supabase/pg_graphql/)은 GraphQL API를 노출하는 PostgreSQL 확장입니다.
- [postgres-meta](https://github.com/supabase/postgres-meta)는 테이블 가져오기, 역할 추가, 쿼리 실행 등을 할 수 있는 Postgres 관리용 RESTful API입니다.
- [콩](https://github.com/Kong/kong)은 클라우드 네이티브 API 게이트웨이입니다.

#### 클라이언트 라이브러리

클라이언트 라이브러리에 대한 접근 방식은 모듈식입니다. 각 하위 라이브러리는 단일 외부 시스템을 위한 독립형 구현입니다. 이는 기존 도구를 지원하는 방식 중 하나입니다.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>언어</th>
    <th>클라이언트</th>
    <th colspan="5">기능 클라이언트(Supabase 클라이언트에 번들로 제공)</th>
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
  
  <th colspan="7">⚡️ 공식 ⚡️</th>
  
  <tr>
    <td>JavaScript (TypeScript)</td>
    <td><a href="https://github.com/supabase/supabase-js" target="_blank" rel="noopener noreferrer">supabase-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/postgrest-js" target="_blank" rel="noopener noreferrer">postgrest-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/auth-js" target="_blank" rel="noopener noreferrer">auth-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/realtime-js" target="_blank" rel="noopener noreferrer">realtime-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/storage-js" target="_blank" rel="noopener noreferrer">storage-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/functions-js" target="_blank" rel="noopener noreferrer">functions-js</a></td>
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
  <tr>
    <td>Swift</td>
    <td><a href="https://github.com/supabase/supabase-swift" target="_blank" rel="noopener noreferrer">supabase-swift</a></td>
    <td><a href="https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST" target="_blank" rel="noopener noreferrer">postgrest-swift</a></td>
    <td><a href="https://github.com/supabase/supabase-swift/tree/main/Sources/Auth" target="_blank" rel="noopener noreferrer">auth-swift</a></td>
    <td><a href="https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime" target="_blank" rel="noopener noreferrer">realtime-swift</a></td>
    <td><a href="https://github.com/supabase/supabase-swift/tree/main/Sources/Storage" target="_blank" rel="noopener noreferrer">storage-swift</a></td>
    <td><a href="https://github.com/supabase/supabase-swift/tree/main/Sources/Functions" target="_blank" rel="noopener noreferrer">functions-swift</a></td>
  </tr>
  <tr>
    <td>Python</td>
    <td><a href="https://github.com/supabase/supabase-py" target="_blank" rel="noopener noreferrer">supabase-py</a></td>
    <td><a href="https://github.com/supabase/postgrest-py" target="_blank" rel="noopener noreferrer">postgrest-py</a></td>
    <td><a href="https://github.com/supabase/gotrue-py" target="_blank" rel="noopener noreferrer">gotrue-py</a></td>
    <td><a href="https://github.com/supabase/realtime-py" target="_blank" rel="noopener noreferrer">realtime-py</a></td>
    <td><a href="https://github.com/supabase/storage-py" target="_blank" rel="noopener noreferrer">storage-py</a></td>
    <td><a href="https://github.com/supabase/functions-py" target="_blank" rel="noopener noreferrer">functions-py</a></td>
  </tr>
  
  <th colspan="7">💚 커뮤니티 💚</th>
  
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
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Auth" target="_blank" rel="noopener noreferrer">auth-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Realtime" target="_blank" rel="noopener noreferrer">realtime-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Storage" target="_blank" rel="noopener noreferrer">storage-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Functions" target="_blank" rel="noopener noreferrer">functions-kt</a></td>
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

## Badges (배지)

![Made with Supabase](../apps/www/public/badge-made-with-supabase.svg)

```md
[![Made with Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img
    width="168"
    height="30"
    src="https://supabase.com/badge-made-with-supabase.svg"
    alt="Made with Supabase"
  />
</a>
```

![Made with Supabase (dark)](../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Made with Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img
    width="168"
    height="30"
    src="https://supabase.com/badge-made-with-supabase-dark.svg"
    alt="Made with Supabase"
  />
</a>
```

## 번역

- [아랍어 | العربية](/i18n/README.ar.md)
- [알바니아어 / Shqip](/i18n/README.sq.md)
- [방글라데시어 / বাংলা](/i18n/README.bn.md)
- [불가리아어 / Български](/i18n/README.bg.md)
- [카탈루냐어 / Català](/i18n/README.ca.md)
- [체코어 / čeština](/i18n/README.cs.md)
- [덴마크어 / Dansk](/i18n/README.da.md)
- [네덜란드어 / Nederlands](/i18n/README.nl.md)
- [영어 / English](https://github.com/supabase/supabase)
- [에스토니아어 / eesti keel](/i18n/README.et.md)
- [핀란드어 / Suomalainen](/i18n/README.fi.md)
- [프랑스어 / Français](/i18n/README.fr.md)
- [독일어 / Deutsch](/i18n/README.de.md)
- [그리스어 / Ελληνικά](/i18n/README.el.md)
- [구자라트어 / ગુજરાતી](/i18n/README.gu.md)
- [히브리어 / עברית](/i18n/README.he.md)
- [힌디어 / हिंदी](/i18n/README.hi.md)
- [헝가리어 / Magyar](/i18n/README.hu.md)
- [네팔어 / नेपाली](/i18n/README.ne.md)
- [인도네시아어 / Bahasa Indonesia](/i18n/README.id.md)
- [이탈리아어 / Italian](/i18n/README.it.md)
- [일본어 / 日本語](/i18n/README.jp.md)
- [한국어](/i18n/README.ko.md)
- [리투아니아어 / lietuvių](/i18n/README.lt.md)
- [라트비아어 / latviski](/i18n/README.lv.md)
- [말레이어 / Bahasa Malaysia](/i18n/README.ms.md)
- [노르웨이어(복말) / Norsk (Bokmål)](/i18n/README.nb.md)
- [페르시아어 / فارسی](/i18n/README.fa.md)
- [폴란드어 / Polski](/i18n/README.pl.md)
- [포르투갈어 / Português](/i18n/README.pt.md)
- [포르투갈어(브라질) / Português Brasileiro](/i18n/README.pt-br.md)
- [루마니아어 / Română](/i18n/README.ro.md)
- [러시아어 / Pусский](/i18n/README.ru.md)
- [세르비아어 / Srpski](/i18n/README.sr.md)
- [신할라어 / සිංහල](/i18n/README.si.md)
- [슬로바키아어 / slovenský](/i18n/README.sk.md)
- [슬로베니아어 / Slovenščina](/i18n/README.sl.md)
- [스페인어 / Español](/i18n/README.es.md)
- [중국어 간체 / 简体中文](/i18n/README.zh-cn.md)
- [스웨덴어 / Svenska](/i18n/README.sv.md)
- [태국어 / ไทย](/i18n/README.th.md)
- [중국어 번체 / 繁體中文](/i18n/README.zh-tw.md)
- [터키어 / Türkçe](/i18n/README.tr.md)
- [우크라이나어 / Українська](/i18n/README.uk.md)
- [베트남어 / Tiếng Việt](/i18n/README.vi-vn.md)
- [번역 목록](/i18n/languages.md) <!--- Keep only this -->
