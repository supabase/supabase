<p align="center">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--light.svg#gh-light-mode-only">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--dark.svg#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com)는 오픈 소스 Firebase 대안입니다. 엔터프라이즈급 오픈 소스 도구를 사용하여 Firebase의 기능을 구축하고 있습니다.

- [x] 호스팅 된 Postgres 데이터베이스. [Docs](https://supabase.com/docs/guides/database)
- [x] 사용자 인증 및 권한 부여. [Docs](https://supabase.com/docs/guides/auth)
- [x] 자동생성 API.
  - [x] REST. [Docs](https://supabase.com/docs/guides/api#rest-api)
  - [x] 실시간 구독. [Docs](https://supabase.com/docs/guides/api#realtime-api)
  - [x] GraphQL (Beta). [Docs](https://supabase.com/docs/guides/api#graphql-api)
- [x] 함수.
  - [x] 데이터베이스 함수. [Docs](https://supabase.com/docs/guides/database/functions)
  - [x] 엣지 함수 [Docs](https://supabase.com/docs/guides/functions)
- [x] 파일 스토리지. [Docs](https://supabase.com/docs/guides/storage)
- [x] 대시보드

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## 문서

전체 문서는 [supabase.com/docs](https://supabase.com/docs)를 참조하세요.

## 커뮤니티 및 지원

- [커뮤니티 포럼](https://github.com/supabase/supabase/discussions). 데이터베이스의 모범 사례를 구축하고 토론할 때 가장 적합합니다.
- [깃허브 이슈](https://github.com/supabase/supabase/issues). Supabase 사용 시 발생하는 버그 및 오류를 만났을 때 가장 적합합니다.
- [이메일 지원](https://supabase.com/docs/support#business-support). 여러분의 데이터베이스나 개발 인프라에 문제가 생겼을 때 가장 적합합니다.
- [디스코드](https://discord.supabase.com). 여러분들의 어플리케이션을 공유하거나, 커뮤니티와 함께 어울리고 싶을때 가장 적합합니다.

## 상태

- [x] Alpha: 제한된 사용자를 대상으로 테스트
- [x] Public Alpha: 누구나[app.supabase.com](https://app.supabase.com)에서 등록 할 수 있습니다. 그러나, 버그 등이 있을 수 있으므로 양해 바랍니다.
- [x] Public Beta: 기업을 제외한 대부분의 유스 케이스에 적합할 정도로 안정적
- [ ] Public: 프로덕션 준비 완료

현재 Public Beta를 실시하고 있습니다. 주요 업데이트에 대한 알림을 받으려면 이 저장소의 "releases"를 Watch 해주세요.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Supabase의 구조

Supabase는 오픈 소스 툴들을 조합한 것입니다. 엔터프라이즈 급 오픈 소스 제품을 사용하여 Firebase의 기능을 구축하고 있습니다. MIT, Apache 2 또는 이에 상응하는 오픈 라이선스가 있는 도구 및 커뮤니티가 있는 경우 해당 도구를 사용하고 지원합니다. 도구가 존재하지 않으면 우리가 직접 빌드하고 오픈 소스합니다. Supabase는 Firebase의 일대일 매핑이 아닙니다. 우리의 목표는 개발자에게 오픈 소스 도구를 사용하여 Firebase와 같은 개발자 환경을 제공하는 것입니다.

**현재 아키텍쳐**

Supabase는 [호스팅 플랫폼](https://app.supabase.com)입니다. 아무것도 설치하지 않고 가입하고 Supabase 사용을 시작할 수 있습니다.
또한 현재 로컬 개발 환경을 갖추고 있으며, 이는 플랫폼의 안정성과 함께 지금 최우선으로 진행하고 있는 프로젝트입니다.

![아키텍쳐](https://user-images.githubusercontent.com/70828596/187547862-ffa9d058-0c3a-4851-a3e7-92ccfca4b596.png)

- [PostgreSQL](https://www.postgresql.org/)PostgreSQL 은 30 년 이상 개발 · 개선되어왔다 객체 관계형 데이터베이스 시스템에서의 안정성, 기능의 안정성, 성능면에서 높은 평가를 얻고 있습니다.
- [Realtime](https://github.com/supabase/realtime) 은 웹 소켓을 사용하여 PostgreSQL 삽입, 업데이트 및 삭제를 수신 할 수있는 Elixir 서버입니다. Supabase는 Postgres의 내장 복제 기능을 수신하고 복제 바이트 스트림을 JSON으로 변환 한 다음 웹 소켓을 통해 JSON을 브로드 캐스트합니다.
- [PostgREST](http://postgrest.org/) 는 PostgreSQL 데이터베이스를 RESTful API로 직접 변환하는 웹 서버입니다.
- [Storage](https://github.com/supabase/storage-api) 는 Postgres를 사용하여 권한을 관리하여 S3에 저장된 파일을 관리하기위한 RESTful 인터페이스를 제공합니다.
- [postgres-meta](https://github.com/supabase/postgres-meta) 는 Postgres를 관리하기위한 RESTful API로, 테이블을 가져오고, 역할을 추가하고, 쿼리를 실행할 수 있습니다.
- [GoTrue](https://github.com/netlify/gotrue) 는 사용자 관리 및 SWT 토큰 발급을위한 SWT 기반 API입니다.
- [Kong](https://github.com/Kong/kong) 은 클라우드 네이티브 API 게이트웨이입니다.

#### 클라이언트 라이브러리

Supabase 클라이언트 라이브러리는 모듈식 입니다. 각 하위 라이브러리는 단일 외부 시스템에 대한 독립 실행형 구조입니다. 이는 기존 도구를 지원하는 방법 중 하나입니다.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>언어</th>
    <th>고객</th>
    <th colspan="5">기능 클라이언트(Supabase 클라이언트에 번들)</th>
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
  <th colspan="7">⚡️ 공식적인 ⚡️</th>
  <tr>
    <td>JavaScript (TypeScript)</td>
    <td><a href="https://github.com/supabase/supabase-js" target="_blank" rel="noopener noreferrer">supabase-js</a></td>
    <td><a href="https://github.com/supabase/postgrest-js" target="_blank" rel="noopener noreferrer">postgrest-js</a></td>
    <td><a href="https://github.com/supabase/gotrue-js" target="_blank" rel="noopener noreferrer">gotrue-js</a></td>
    <td><a href="https://github.com/supabase/realtime-js" target="_blank" rel="noopener noreferrer">realtime-js</a></td>
    <td><a href="https://github.com/supabase/storage-js" target="_blank" rel="noopener noreferrer">storage-js</a></td>
    <td><a href="https://github.com/supabase/functions-js" target="_blank" rel="noopener noreferrer">functions-js</a></td>
  </tr>
  <th colspan="7">💚 지역 사회 💚</th>
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
    <td>Flutter</td>
    <td><a href="https://github.com/supabase/supabase-flutter" target="_blank" rel="noopener noreferrer">supabase-flutter</a></td>
    <td><a href="https://github.com/supabase/postgrest-dart" target="_blank" rel="noopener noreferrer">postgrest-dart</a></td>
    <td><a href="https://github.com/supabase/gotrue-dart" target="_blank" rel="noopener noreferrer">gotrue-dart</a></td>
    <td><a href="https://github.com/supabase/realtime-dart" target="_blank" rel="noopener noreferrer">realtime-dart</a></td>
    <td><a href="https://github.com/supabase/storage-dart" target="_blank" rel="noopener noreferrer">storage-dart</a></td>
    <td><a href="https://github.com/supabase-community/functions-dart" target="_blank" rel="noopener noreferrer">functions-dart</a></td>
  </tr>
  <tr>
    <td>Go</td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/postgrest-go" target="_blank" rel="noopener noreferrer">postgrest-go</a></td>
    <td>-</td>
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
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>Kotlin</td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/postgrest-kt" target="_blank" rel="noopener noreferrer">postgrest-kt</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-kt" target="_blank" rel="noopener noreferrer">gotrue-kt</a></td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>Python</td>
    <td><a href="https://github.com/supabase-community/supabase-py" target="_blank" rel="noopener noreferrer">supabase-py</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-py" target="_blank" rel="noopener noreferrer">postgrest-py</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-py" target="_blank" rel="noopener noreferrer">gotrue-py</a></td>
    <td><a href="https://github.com/supabase-community/realtime-py" target="_blank" rel="noopener noreferrer">realtime-py</a></td>
    <td><a href="https://github.com/supabase-community/storage-py" target="_blank" rel="noopener noreferrer">storage-py</a></td>
    <td><a href="https://github.com/supabase-community/functions-py" target="_blank" rel="noopener noreferrer">functions-py</a></td>
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
    <td>Swift</td>
    <td><a href="https://github.com/supabase-community/supabase-swift" target="_blank" rel="noopener noreferrer">supabase-swift</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-swift" target="_blank" rel="noopener noreferrer">postgrest-swift</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-swift" target="_blank" rel="noopener noreferrer">gotrue-swift</a></td>
    <td><a href="https://github.com/supabase-community/realtime-swift" target="_blank" rel="noopener noreferrer">realtime-swift</a></td>
    <td><a href="https://github.com/supabase-community/storage-swift" target="_blank" rel="noopener noreferrer">storage-swift</a></td>
    <td>-</td>
  </tr>
</table>

<!--- Remove this list if you're traslating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## 번역

- [번역](/i18n/languages.md) <!--- Keep only the this-->

---

## 스폰서

[![스폰서가 되다](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
