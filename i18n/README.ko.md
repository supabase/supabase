<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com)는 오픈 소스 Firebase 대안입니다.  Firebase와 유사한 기능을 오픈 소스 엔터프라이즈급 도구를 사용하여 구축하고 있습니다.

**주요 기능:**

- [x] **관리형 Postgres 데이터베이스:** [문서](https://supabase.com/docs/guides/database)
- [x] **인증 및 권한 부여:** [문서](https://supabase.com/docs/guides/auth)
- [x] **자동 생성 API:**
    - [x] REST: [문서](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [문서](https://supabase.com/docs/guides/graphql)
    - [x] 실시간 구독: [문서](https://supabase.com/docs/guides/realtime)
- [x] **함수:**
    - [x] 데이터베이스 함수: [문서](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (엣지 함수): [문서](https://supabase.com/docs/guides/functions)
- [x] **파일 저장소:** [문서](https://supabase.com/docs/guides/storage)
- [x] **AI, 벡터 및 임베딩 도구:** [문서](https://supabase.com/docs/guides/ai)
- [x] **대시보드**

![Supabase 대시보드](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

주요 업데이트에 대한 알림을 받으려면 이 저장소의 "릴리스"를 구독하세요. 이를 통해 최신 변경 사항 및 개선 사항을 확인할 수 있습니다.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="저장소 구독"/></kbd>

## 문서

전체 문서는 [supabase.com/docs](https://supabase.com/docs)에서 확인할 수 있습니다. 필요한 모든 가이드와 참조 자료를 찾을 수 있습니다.

프로젝트에 기여하고 싶다면 [시작하기](./../DEVELOPERS.md) 섹션을 참조하세요.

## 커뮤니티 및 지원

*   **커뮤니티 포럼:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions).  개발 관련 도움을 받고 데이터베이스 모범 사례를 논의하기에 이상적입니다.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues).  Supabase 사용 중 발생하는 버그 및 오류를 보고하는 데 사용하세요.
*   **이메일 지원:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). 데이터베이스 또는 인프라 관련 문제에 대한 최상의 옵션입니다.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com).  애플리케이션을 공유하고 커뮤니티와 소통하기에 좋은 곳입니다.

## 작동 원리

Supabase는 여러 오픈 소스 도구를 결합합니다.  Firebase와 유사한 기능을 검증된 엔터프라이즈급 제품을 사용하여 만듭니다.  도구나 커뮤니티가 존재하고 MIT, Apache 2 또는 유사한 개방형 라이선스를 사용하는 경우 해당 도구를 사용하고 지원합니다.  해당 도구가 없으면 자체적으로 만들고 오픈 소스로 공개합니다.  Supabase는 Firebase의 정확한 복제품이 아닙니다. 우리의 목표는 개발자에게 오픈 소스 도구를 사용하여 Firebase와 유사한 편리함을 제공하는 것입니다.

**아키텍처**

Supabase는 [관리형 플랫폼](https://supabase.com/dashboard)입니다.  아무것도 설치하지 않고도 Supabase에 가입하고 즉시 사용할 수 있습니다.  또한 [자체 인프라를 배포](https://supabase.com/docs/guides/hosting/overview)하고 [로컬에서 개발](https://supabase.com/docs/guides/local-development)할 수도 있습니다.

![아키텍처](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** 30년 이상 활발하게 개발된 객체-관계형 데이터베이스 시스템입니다.  안정성, 기능 및 성능으로 유명합니다.
*   **Realtime:** 웹 소켓을 통해 PostgreSQL 변경 사항(삽입, 업데이트 및 삭제)을 수신할 수 있는 Elixir 서버입니다.  Realtime은 Postgres의 내장 복제 기능을 사용하여 변경 사항을 JSON으로 변환하고 권한이 있는 클라이언트에 전달합니다.
*   **PostgREST:** PostgreSQL 데이터베이스를 RESTful API로 변환하는 웹 서버입니다.
*   **GoTrue:** 사용자를 관리하고 JWT 토큰을 발급하기 위한 JWT 기반 API입니다.
*   **Storage:** Postgres를 사용하여 권한을 관리하면서 S3에 저장된 파일을 관리하기 위한 RESTful 인터페이스를 제공합니다.
*   **pg_graphql:** GraphQL API를 제공하는 PostgreSQL 확장입니다.
*   **postgres-meta:** Postgres를 관리하기 위한 RESTful API로, 테이블을 가져오고, 역할을 추가하고, 쿼리를 실행하는 등의 작업을 수행할 수 있습니다.
*   **Kong:** 클라우드 네이티브 API 게이트웨이입니다.

#### 클라이언트 라이브러리

우리는 클라이언트 라이브러리에 모듈식 접근 방식을 사용합니다. 각 하위 라이브러리는 단일 외부 시스템을 위해 설계되었습니다. 이는 기존 도구를 지원하는 한 가지 방법입니다.

(원래와 같은 클라이언트 라이브러리 테이블이지만 한국어 이름과 필요한 경우 설명 포함).

| 언어                       | Supabase 클라이언트                                                    | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️공식⚡️**              |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚커뮤니티 지원💚**    |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## 배지 (Badges)

다음 배지를 사용하여 애플리케이션이 Supabase로 만들어졌음을 표시할 수 있습니다.

**밝은색:**

![Supabase로 제작됨](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Supabase로 제작됨](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Supabase로 제작됨" />
</a>
```

**어두운색:**

![Supabase로 제작됨 (어두운 버전)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Supabase로 제작됨](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Supabase로 제작됨" />
</a>
```

## 번역

[번역 목록](./languages.md)
