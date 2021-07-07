<p align="center">
  <img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/web/static/supabase-light-rounded-corner-background.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io)는 오픈 소스 Firebase 대체 제품입니다. 엔터프라이즈 급 오픈 소스 도구를 사용하여 Firebase 기능을 구축하고 있습니다.

- [x] 호스팅 된 Postgres 데이터베이스
- [x] 실시간 구독
- [x] 인증・승인
- [x] 자동 생성 API
- [x] 대시 보드
- [x] 스토리지
- [ ] 함수 (출시 예정)

## 문서

전체 문서는 [supabase.io/docs](https://supabase.io/docs)를 참조하세요.

## 커뮤니티 및 지원

- [커뮤니티 포럼](https://github.com/supabase/supabase/discussions) 어떤 때 사용하는지：데이터베이스의 모범 사례를 구축하고 토론하는데 도움이 됩니다.
- [GitHub Issue](https://github.com/supabase/supabase/issues) 어떤 때 사용하는지: Supabase에서 사용하면서 발생한 버그와 오류가 발생할 때.
- [Email 지원](https://supabase.io/docs/support#business-support) 어떤 때 사용하는지: 데이터베이스 또는 인프라 문제

## 상태

- [x] Alpha: 제한된 사용자를 대상으로 테스트
- [x] Public Alpha: 누구나[app.supabase.io](https://app.supabase.io)에서 등록 할 수 있습니다. 그러나, 버그 등이 있을 수 있으므로 양해 바랍니다.
- [x] Public Beta: 기업을 제외한 대부분의 유스 케이스에 적합할 정도로 안정적
- [ ] Public: 제품 준비중

현재 Public Beta를 실시하고 있습니다. 주요 업데이트에 대한 알림을 받으려면 이 저장소의 "releases"를 Watch 해주세요.

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Supabase의 구조

Supabase는 오픈 소스 툴들을 조합한 것입니다. 엔터프라이즈 급 오픈 소스 제품을 사용하여 Firebase의 기능을 구축하고 있습니다. MIT, Apache 2 또는 이에 상응하는 오픈 라이선스가 있는 도구 및 커뮤니티가 있는 경우 해당 도구를 사용하고 지원합니다. 도구가 존재하지 않으면 우리가 직접 빌드하고 오픈 소스합니다. Supabase는 Firebase의 일대일 매핑이 아닙니다. 우리의 목표는 개발자에게 오픈 소스 도구를 사용하여 Firebase와 같은 개발자 환경을 제공하는 것입니다.

**현재 아키텍쳐**

Supabase는 [호스팅 플랫폼](https://app.supabase.io)입니다. 아무것도 설치하지 않고 가입하고 Supabase 사용을 시작할 수 있습니다.
또한 현재 로컬 개발 환경을 갖추고 있으며, 이는 플랫폼의 안정성과 함께 지금 최우선으로 진행하고 있는 프로젝트입니다.

![아키텍쳐](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/)PostgreSQL 은 30 년 이상 개발 · 개선되어왔다 객체 관계형 데이터베이스 시스템에서의 안정성, 기능의 안정성, 성능면에서 높은 평가를 얻고 있습니다.
- [Realtime](https://github.com/supabase/realtime) 은 웹 소켓을 사용하여 PostgreSQL 삽입, 업데이트 및 삭제를 수신 할 수있는 Elixir 서버입니다. Supabase는 Postgres의 내장 복제 기능을 수신하고 복제 바이트 스트림을 JSON으로 변환 한 다음 웹 소켓을 통해 JSON을 브로드 캐스트합니다.
- [PostgREST](http://postgrest.org/) 는 PostgreSQL 데이터베이스를 RESTful API로 직접 변환하는 웹 서버입니다.
- [Storage](https://github.com/supabase/storage-api) 는 Postgres를 사용하여 권한을 관리하여 S3에 저장된 파일을 관리하기위한 RESTful 인터페이스를 제공합니다.
- [postgres-meta](https://github.com/supabase/postgres-meta) 는 Postgres를 관리하기위한 RESTful API로, 테이블을 가져오고, 역할을 추가하고, 쿼리를 실행할 수 있습니다.
- [GoTrue](https://github.com/netlify/gotrue) 는 사용자 관리 및 SWT 토큰 발급을위한 SWT 기반 API입니다.
- [Kong](https://github.com/Kong/kong) 은 클라우드 네이티브 API 게이트웨이입니다.

#### 클라이언트 라이브러리

Supabase 클라이언트 라이브러리는 모듈식 입니다. 각 하위 라이브러리는 단일 외부 시스템에 대한 독립 실행형 구조입니다. 이는 기존 도구를 지원하는 방법 중 하나입니다.

- **`supabase-{lang}`**: 아래 모든 라이브러리를 내포 한 클라이언트 라이브러리
  - `postgrest-{lang}`: [PostgREST](https://github.com/postgrest/postgrest)용 클라이언트 라이브러리
  - `realtime-{lang}`: [Realtime](https://github.com/supabase/realtime)용 클라이언트 라이브러리
  - `gotrue-{lang}`: [GoTrue](https://github.com/netlify/gotrue)용 클라이언트 라이브러리

| 저장소                | 공식                                             | 커뮤니티                                                                                                                                                                                                                                                                                                                             |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust` \| [`Ruby`](https://github.com/supabase/supabase-rb) \| `Go`                                                                                             |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) \| [`Ruby`](https://github.com/supabase/postgrest-rb) \| [`Go`](https://github.com/supabase/postgrest-go) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust` \| `Ruby` \| `Go`                                                                                                                                        |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust` \| `Ruby` \| `Go`                                                                                                                                              |

<!--- Remove this list if you're traslating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## 번역

- [번역](/i18n/languages.md) <!--- Keep only the this-->

---

## 스폰서

[![스폰서가 되다](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
