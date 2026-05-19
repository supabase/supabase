Last updated: 2026-05-19

# Self-hosted Supabase configuration reference

This document is the aggregated reference for environment variables relevant to a self-hosted Supabase deployment. It aims to be comprehensive for the self-hosted use case rather than literally exhaustive - variables that only apply on the hosted platform (billing, multi-tenant orchestration, internal tooling) are typically omitted or marked as such. For the complete set a given service can read, refer to its upstream repository linked in the [service version matrix](#service-version-matrix) below.

## How to read this document

Each table has five columns:

| Column | Meaning |
|---|---|
| **Variable** | Exact env var name as the service's code reads it. Names are case-sensitive. |
| **Description** | What the variable controls. |
| **CLI** | "Yes" if this variable is set inside the corresponding container when you run `supabase start` (see the [Local development & CLI](https://supabase.com/docs/guides/local-development)). |
| **Self-hosted** | "Yes" if this variable is referenced in `docker/docker-compose.yml`, any of the compose overlay files (`docker-compose.rustfs.yml`, etc.), or `docker/.env.example`. Variables that appear only inside commented-out lines are still marked "Yes" with a note in the Notes column. |
| **Notes** | Default value, requirement, deprecation, alias, or scope. |

A few caveats:

- **"Self-hosted = No" does not mean "unusable in self-hosted".** It only means the default `docker-compose.yml` does not pass the variable through. You can almost always try to add it under the service's `environment:` block.
- **Defaults shown are from the upstream service code.** Some defaults are overridden by `docker-compose.yml`; where that happens it is called out in Notes.
- **The CLI does not run Supavisor** as part of `supabase start`, so every variable in the Supavisor section is marked CLI=No.
- **Auth/gotrue env vars are programmatically derived** from a Go config struct (envconfig), so most fields are reachable via two names: a prefixed form (`GOTRUE_API_API_EXTERNAL_URL`) and a bare-name alias (`API_EXTERNAL_URL`). Both are documented.

## Service version matrix

The image tags below are pinned in `docker-compose.yml` at the time of this document; check that file for the current versions.

| Service | Image | Source repo |
|---|---|---|
| Studio (Dashboard) | `supabase/studio` | [supabase/supabase – apps/studio](https://github.com/supabase/supabase/tree/master/apps/studio) |
| Auth | `supabase/gotrue` | [supabase/auth](https://github.com/supabase/auth) |
| PostgREST | `postgrest/postgrest` | [PostgREST/postgrest](https://github.com/PostgREST/postgrest) |
| Realtime | `supabase/realtime` | [supabase/realtime](https://github.com/supabase/realtime) |
| Storage | `supabase/storage-api` | [supabase/storage](https://github.com/supabase/storage) |
| Edge Functions | `supabase/edge-runtime` | [supabase/edge-runtime](https://github.com/supabase/edge-runtime) |
| Analytics | `logflare/logflare` | [logflare/logflare](https://github.com/logflare/logflare) |
| Postgres | `supabase/postgres` | [supabase/postgres](https://github.com/supabase/postgres) |
| Supavisor (Pooler) | `supabase/supavisor` | [supabase/supavisor](https://github.com/supabase/supavisor) |

## Table of contents

- [Studio (Dashboard)](#studio-dashboard)
- [Auth (GoTrue)](#auth)
- [PostgREST](#postgrest)
- [Realtime](#realtime)
- [Storage](#storage)
- [Edge Functions](#edge-functions)
- [Analytics (Logflare)](#analytics)
- [Postgres (supabase/postgres)](#postgres)
- [Supavisor](#supavisor)

---

## Studio (Dashboard)

> Studio is a Next.js (Pages Router) app. `NEXT_PUBLIC_*` variables are inlined into the client bundle at build time and are visible in the browser - never store secrets in them.

### Core (database, API gateway, public URL)

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `DEFAULT_ORGANIZATION_NAME` | Name shown for the single default organization on the dashboard. | No | Yes | Mapped from `STUDIO_DEFAULT_ORGANIZATION` in `.env.example`. Default: `Default Organization`. |
| `DEFAULT_PROJECT_NAME` | Name shown for the single default project on the dashboard. | No | Yes | Mapped from `STUDIO_DEFAULT_PROJECT` in `.env.example`. Default: `Default Project`. |
| `HOSTNAME` | Network interface Next.js binds to inside the container. | Yes | Yes | Set to `0.0.0.0` so the container is reachable from outside. |
| `POSTGRES_DB` | Postgres database name used for Studio's internal connections. | No | Yes | Default: `postgres`. |
| `POSTGRES_HOST` | Postgres host (service name in compose network). | No | Yes | Default: `db`. |
| `POSTGRES_PASSWORD` | Postgres password for the `POSTGRES_USER_READ_WRITE` role. | Yes | Yes | Supports `_FILE` suffix for Docker secrets. |
| `POSTGRES_PORT` | Postgres TCP port. | No | Yes | Default: `5432`. |
| `POSTGRES_USER_READ_ONLY` | Postgres role used for read-only queries from the SQL editor. | No | No | Default: `supabase_read_only_user`. Only takes effect if you've manually created the role per the "remove superuser access" guide. |
| `POSTGRES_USER_READ_WRITE` | Postgres role used for read/write queries from the SQL editor. | Yes | Yes | Default: `supabase_admin`. Commented out in default compose. See "remove superuser access" guide. |
| `STUDIO_PG_META_URL` | URL of the `postgres-meta` service used for schema introspection. | Yes | Yes | E.g. `http://meta:8080`. Required. |
| `SUPABASE_PUBLIC_URL` | Public URL of the Supabase stack (Kong gateway) as seen by end users. | Yes | Yes | Used to construct REST API URLs and connection strings shown in the dashboard. |
| `SUPABASE_URL` | Internal URL Studio uses to reach Kong from inside the Docker network. | Yes | Yes | E.g. `http://kong:8000`. |

### Auth / JWT

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `AUTH_JWT_SECRET` | HS256 JWT secret used to mint/verify legacy API keys; surfaced to the UI for "JWT settings" and PostgREST config. | Yes | Yes | Mapped from `JWT_SECRET` in `.env.example`. Must be at least 32 characters. |
| `SUPABASE_ANON_KEY` | Anon API key surfaced in the Project API Settings page and used by in-dashboard clients. | Yes | Yes | Mapped from `ANON_KEY`. Supports `_FILE` suffix for Docker secrets. |
| `SUPABASE_SERVICE_KEY` | Service-role API key surfaced in the Project API Settings page. | Yes | Yes | Mapped from `SERVICE_ROLE_KEY`. Supports `_FILE` suffix for Docker secrets. Keep secret. |

### PG Meta

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `PG_META_CRYPTO_KEY` | Encryption key used by Studio's pg-meta routes to encrypt sensitive values (vault, foreign-server credentials) before storing them. | No | Yes | Falls back to `SAMPLE_KEY` if unset - set this to a random 32+ char string. |

### PostgREST passthrough

These mirror the running PostgREST configuration so the dashboard can display correct settings on the "API" page.

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `PGRST_DB_EXTRA_SEARCH_PATH` | Extra Postgres schemas added to `search_path` for every PostgREST request. | Yes | Yes | Default: `public`. |
| `PGRST_DB_MAX_ROWS` | Maximum rows returned by any single PostgREST request. | Yes | Yes | Default: `1000`. |
| `PGRST_DB_SCHEMAS` | Comma-separated list of schemas exposed via PostgREST. | Yes | Yes | Default: `public,storage,graphql_public`. Also used as the list of "Exposed schemas" in the API settings UI. |

### Analytics / Logflare

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `LOGFLARE_API_KEY` | Legacy alias for `LOGFLARE_PUBLIC_ACCESS_TOKEN`. | No | Yes | Deprecated. Declared in `apps/studio/turbo.jsonc` but not read by Studio code; kept only for backward compatibility with older deployments. |
| `LOGFLARE_PRIVATE_ACCESS_TOKEN` | Private API token Studio uses server-side to query Logflare endpoints (logs, charts). | Yes | Yes | Required for logs/analytics features to work on self-hosted. |
| `LOGFLARE_PUBLIC_ACCESS_TOKEN` | Public API token used by the analytics (supabase/logflare) container for ingestion. | No | Yes | Not read by Studio code (despite being in `apps/studio/turbo.jsonc`). Passed through the `studio` service env in `docker-compose.yml` for parity only. |
| `LOGFLARE_URL` | Base URL of the Logflare/analytics service. | Yes | Yes | E.g. `http://analytics:4000`. Used to build the `PROJECT_ANALYTICS_URL`. |
| `NEXT_ANALYTICS_BACKEND_PROVIDER` | Historically intended to select the analytics container's backend (`postgres` or `bigquery`). | Yes | Yes | No-op today: not read by Studio code, and the `analytics` (supabase/logflare) container chooses its backend via `POSTGRES_BACKEND_URL` / `LOGFLARE_FEATURE_FLAG_OVERRIDE` instead. Safe to ignore. |
| `NEXT_PUBLIC_ENABLE_LOGS` | Historically intended to toggle visibility of log explorer pages. | Yes | Yes | Not read by Studio code today, and not declared in `apps/studio/turbo.jsonc`. Use `ENABLED_FEATURES_LOGS_ALL` (see Feature flags below) for runtime control of the logs section. |

### Feature flags (runtime overrides)

Self-hosted Studio reads `ENABLED_FEATURES_*` env vars at container start time to disable or re-enable individual feature flags without rebuilding the image. The mapping rule is: uppercase the feature key from `packages/common/enabled-features/enabled-features.json` and replace every non-alphanumeric character with `_` (e.g. `logs:all` → `ENABLED_FEATURES_LOGS_ALL`). See `packages/common/enabled-features/README.md` for the full mechanism and the canonical flag list (~90 flags).

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `ENABLED_FEATURES_*` | Per-flag runtime override. Set to `true` or `false` (case-insensitive); other values are logged and ignored. | No | No | One env var per flag. Full key list: `packages/common/enabled-features/enabled-features.json`. No-op when `NEXT_PUBLIC_IS_PLATFORM=true`. |
| `ENABLED_FEATURES_LOGS_ALL` | Disable the entire Logs section of the dashboard. Maps to the `logs:all` feature flag. | No | No | Documented explicitly as the runtime replacement for the legacy build-time `NEXT_PUBLIC_ENABLE_LOGS`. |

### AI features

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `OPENAI_API_KEY` | OpenAI API key used by the AI Assistant and SQL generator. | Yes | Yes | Required for AI features in self-hosted Studio. Optional; AI panel is disabled if unset. |

### Edge Functions / Snippets management

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `EDGE_FUNCTIONS_MANAGEMENT_FOLDER` | Filesystem directory inside the container where edge function source is read from / written to when using the dashboard editor. | Yes | Yes | Mounted as a volume in `docker-compose.yml` (`./volumes/functions:/app/edge-functions`). |
| `SNIPPETS_MANAGEMENT_FOLDER` | Filesystem directory inside the container where SQL editor snippets are persisted. | Yes | Yes | Mounted as a volume in `docker-compose.yml` (`./volumes/snippets:/app/snippets`). |

### Platform flags / runtime mode

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `CURRENT_CLI_VERSION` | Version string set when Studio is started by the Supabase CLI. | Yes | No | Renames the default project to "Supabase Studio (CLI)" when set. Exposed to client via Next.js passthrough. |
| `NEXT_PUBLIC_IS_PLATFORM` | Master switch: `"true"` runs Studio in hosted (multi-project) mode, anything else runs in self-hosted single-project mode. | No | No | Self-hosted images are **built** with this unset/`false`. Exposed to client. Setting this to `true` in a self-hosted deployment will break the dashboard. |
| `NEXT_PUBLIC_NODE_ENV` | Marks the build as a test build (used by E2E setup). | No | No | Set to `test` only by `generateLocalEnv.js`. Exposed to client. |
| `NODE_ENV` | Standard Node.js environment (`development` / `production` / `test`). | Yes | Yes | Set automatically by Next.js. |

---

## Auth

> Auth (gotrue) uses Go's [envconfig](https://github.com/kelseyhightower/envconfig) library - the env var names are programmatically derived from the `Configuration` struct in `internal/conf/configuration.go` by combining the `GOTRUE_` prefix with each nested struct's path. Aliased fields are reachable via two names: the prefixed form (`GOTRUE_API_API_EXTERNAL_URL`) and a bare-name fallback (`API_EXTERNAL_URL`).

### API

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `API_EXTERNAL_URL` | Externally reachable URL of the Auth API; used in emails, OAuth callbacks, SAML, etc. | Yes | Yes | Required. Alias of `GOTRUE_API_API_EXTERNAL_URL` |
| `GOTRUE_API_API_EXTERNAL_URL` | Externally reachable URL of the Auth API (prefixed form). | No | No | Required. Same field as `API_EXTERNAL_URL` |
| `GOTRUE_API_ENDPOINT` | Override of the API endpoint base. | No | No | |
| `GOTRUE_API_HOST` | Bind address for the API server. | Yes | Yes | |
| `GOTRUE_API_MAX_REQUEST_DURATION` | Maximum total duration of a single API request. | No | No | Default: `10s` |
| `GOTRUE_API_PORT` | TCP port for the API server. | Yes | Yes | Default: `8081`. Alias of `PORT` |
| `PORT` | TCP port for the API server (bare alias). | No | No | Default: `8081` |
| `GOTRUE_API_REQUEST_ID_HEADER` | HTTP header name to read the request ID from. | No | No | Alias of `REQUEST_ID_HEADER` |
| `REQUEST_ID_HEADER` | HTTP header name to read the request ID from (bare alias). | No | No | |

### Database

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `DATABASE_URL` | Database connection string (bare alias). | No | No | Required. Alias of `GOTRUE_DB_DATABASE_URL` |
| `GOTRUE_DB_ADVISOR_ENABLED` | Enables the DB connection-pool advisor. | No | No | Default: `true` |
| `GOTRUE_DB_ADVISOR_OBSERVATION_INTERVAL` | Observation window length for the DB advisor. | No | No | Default: `20s` |
| `GOTRUE_DB_ADVISOR_SAMPLING_INTERVAL` | Sampling interval for the DB advisor. | No | No | Default: `200ms` |
| `GOTRUE_DB_CLEANUP_ENABLED` | Enables periodic cleanup of expired auth rows. | No | No | Default: `false` |
| `GOTRUE_DB_CONN_MAX_IDLE_TIME` | Max time a DB connection may sit idle. | No | No | |
| `GOTRUE_DB_CONN_MAX_LIFETIME` | Max lifetime of a DB connection. | No | No | |
| `GOTRUE_DB_CONN_PERCENTAGE` | Percentage of available DB connections the Auth server may use (1-100). | No | No | |
| `GOTRUE_DB_DATABASE_URL` | Database connection string. | Yes | Yes | Required. Alias of `DATABASE_URL` |
| `GOTRUE_DB_DB_NAMESPACE` | Database schema to use (prefixed alias). | No | No | Default: `auth` |
| `DB_NAMESPACE` | Database schema to use (bare alias). | No | No | Default: `auth` |
| `GOTRUE_DB_DRIVER` | Database driver name. | Yes | Yes | Required. Typically `postgres` |
| `GOTRUE_DB_HEALTH_CHECK_PERIOD` | Interval between DB connection health checks. | No | No | |
| `GOTRUE_DB_MAX_IDLE_POOL_SIZE` | Maximum number of idle DB connections. | No | No | |
| `GOTRUE_DB_MAX_POOL_SIZE` | Maximum total DB connections (0 = unlimited). | No | No | |
| `GOTRUE_DB_MIGRATIONS_PATH` | Filesystem path containing migration SQL files. | Yes | No | Default: `./migrations` |

### JWT

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOTRUE_JWT_ADMIN_GROUP_NAME` | Group claim value treated as admin. | No | No | Default: `admin` |
| `GOTRUE_JWT_ADMIN_ROLES` | Comma-separated roles treated as admin. | Yes | Yes | Default: `service_role,supabase_admin` |
| `GOTRUE_JWT_AUD` | Default `aud` claim for issued JWTs. | Yes | Yes | |
| `GOTRUE_JWT_DEFAULT_GROUP_NAME` | Default group assigned to users. | Yes | Yes | |
| `GOTRUE_JWT_EXP` | Access token lifetime in seconds. | Yes | Yes | Default: `3600` |
| `GOTRUE_JWT_ISSUER` | `iss` claim for issued JWTs. | Yes | Yes | |
| `GOTRUE_JWT_KEY_ID` | Key ID assigned to the symmetric secret key. | No | No | |
| `GOTRUE_JWT_KEYS` | JSON array of JWKs used for signing/verification. | Yes | Yes | Commented out in compose |
| `GOTRUE_JWT_SECRET` | Symmetric HS256 signing secret. | Yes | Yes | Required |
| `GOTRUE_JWT_VALID_METHODS` | Allowed JWT signing methods (e.g. `HS256,RS256`). | Yes | No | |
| `GOTRUE_JWT_VALIDMETHODS` | Alternate spelling seen in CLI; same field. | Yes | No | Alias artifact; prefer `GOTRUE_JWT_VALID_METHODS` |

### Site / Redirect

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOTRUE_DISABLE_SIGNUP` | Disable new user signups. | Yes | Yes | |
| `GOTRUE_SITE_URL` | Primary site URL used in email/redirect defaults. | Yes | Yes | Required |
| `GOTRUE_URI_ALLOW_LIST` | Comma-separated list of allowed redirect URIs (supports glob). | Yes | Yes | |

### Email / SMTP

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOTRUE_MAILER_ALLOW_UNVERIFIED_EMAIL_SIGN_INS` | Allow sign in before email is confirmed. | No | No | Default: `false` |
| `GOTRUE_MAILER_AUTOCONFIRM` | Skip email confirmation flow. | Yes | Yes | |
| `GOTRUE_MAILER_EMAIL_BACKGROUND_SENDING` | Send emails in background (experimental). | No | No | Default: `false` |
| `GOTRUE_MAILER_EMAIL_VALIDATION_BLOCKED_MX` | JSON array of blocked MX records for email validation. | No | No | Experimental |
| `GOTRUE_MAILER_EMAIL_VALIDATION_EXTENDED` | Enable extended email validation (MX/SMTP). | No | No | Default: `false`, experimental |
| `GOTRUE_MAILER_EMAIL_VALIDATION_SERVICE_HEADERS` | JSON object of headers sent to email validation service. | No | No | Experimental |
| `GOTRUE_MAILER_EMAIL_VALIDATION_SERVICE_URL` | External email-validation service URL. | No | No | Experimental |
| `GOTRUE_MAILER_EXTERNAL_HOSTS` | Additional hostnames allowed as the email-link host. | No | No | |
| `GOTRUE_MAILER_OTP_EXP` | OTP/email link expiry in seconds. | Yes | No | Default: `86400` |
| `GOTRUE_MAILER_OTP_LENGTH` | OTP code length (6-10). | Yes | No | Default: `6` |
| `GOTRUE_MAILER_SECURE_EMAIL_CHANGE_ENABLED` | Require confirmation on both old and new emails when changing. | Yes | Yes | Default: `true`, commented out in compose |
| `GOTRUE_MAILER_TEMPLATE_MAX_AGE` | Max age of a cached email template before refresh. | No | No | Default: `10m` |
| `GOTRUE_MAILER_TEMPLATE_MAX_SIZE` | Max template size in bytes pulled from a URL. | No | No | Default: `1000000` |
| `GOTRUE_MAILER_TEMPLATE_RELOADING_ENABLED` | Enable background reloading of email templates. | Yes | No | Default: `false` |
| `GOTRUE_MAILER_TEMPLATE_RELOADING_MAX_IDLE` | Max idle time before stopping template reload loop. | No | No | Default: `20m` |
| `GOTRUE_MAILER_TEMPLATE_RETRY_INTERVAL` | Retry interval for failed template reloads. | No | No | Default: `10s` |
| `GOTRUE_SMTP_ADMIN_EMAIL` | From address used as `admin_email`. | Yes | Yes | |
| `GOTRUE_SMTP_HEADERS` | JSON object of extra headers added to outgoing emails. | No | No | |
| `GOTRUE_SMTP_HOST` | SMTP relay hostname. | Yes | Yes | |
| `GOTRUE_SMTP_LOGGING_ENABLED` | Verbose SMTP debug logging. | No | No | Default: `false` |
| `GOTRUE_SMTP_MAX_FREQUENCY` | Minimum interval between emails per address. | Yes | Yes | Default: `1m`, commented out in compose |
| `GOTRUE_SMTP_PASS` | SMTP password. | No | Yes | |
| `GOTRUE_SMTP_PORT` | SMTP relay port. | Yes | Yes | Default: `587` |
| `GOTRUE_SMTP_SENDER_NAME` | From name displayed on emails. | Yes | Yes | |
| `GOTRUE_SMTP_USER` | SMTP username. | No | Yes | |

### Mailer notifications / subjects / templates / URL paths

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOTRUE_MAILER_NOTIFICATIONS_EMAIL_CHANGED_ENABLED` | Send notification when email changes. | No | No | Default: `false` |
| `GOTRUE_MAILER_NOTIFICATIONS_IDENTITY_LINKED_ENABLED` | Send notification when an identity is linked. | No | No | Default: `false` |
| `GOTRUE_MAILER_NOTIFICATIONS_IDENTITY_UNLINKED_ENABLED` | Send notification when an identity is unlinked. | No | No | Default: `false` |
| `GOTRUE_MAILER_NOTIFICATIONS_MFA_FACTOR_ENROLLED_ENABLED` | Send notification when an MFA factor is enrolled. | No | No | Default: `false` |
| `GOTRUE_MAILER_NOTIFICATIONS_MFA_FACTOR_UNENROLLED_ENABLED` | Send notification when an MFA factor is removed. | No | No | Default: `false` |
| `GOTRUE_MAILER_NOTIFICATIONS_PASSWORD_CHANGED_ENABLED` | Send notification when password changes. | No | No | Default: `false` |
| `GOTRUE_MAILER_NOTIFICATIONS_PHONE_CHANGED_ENABLED` | Send notification when phone changes. | No | No | Default: `false` |
| `GOTRUE_MAILER_SUBJECTS_CONFIRMATION` | Subject for the confirmation email. | No | No | |
| `GOTRUE_MAILER_SUBJECTS_EMAIL_CHANGE` | Subject for the email-change email. | No | No | |
| `GOTRUE_MAILER_SUBJECTS_EMAIL_CHANGED_NOTIFICATION` | Subject for the email-changed notification. | No | No | |
| `GOTRUE_MAILER_SUBJECTS_IDENTITY_LINKED_NOTIFICATION` | Subject for the identity-linked notification. | No | No | |
| `GOTRUE_MAILER_SUBJECTS_IDENTITY_UNLINKED_NOTIFICATION` | Subject for the identity-unlinked notification. | No | No | |
| `GOTRUE_MAILER_SUBJECTS_INVITE` | Subject for the invite email. | No | No | |
| `GOTRUE_MAILER_SUBJECTS_MAGIC_LINK` | Subject for the magic-link email. | No | No | |
| `GOTRUE_MAILER_SUBJECTS_MFA_FACTOR_ENROLLED_NOTIFICATION` | Subject for the MFA-enrolled notification. | No | No | |
| `GOTRUE_MAILER_SUBJECTS_MFA_FACTOR_UNENROLLED_NOTIFICATION` | Subject for the MFA-unenrolled notification. | No | No | |
| `GOTRUE_MAILER_SUBJECTS_PASSWORD_CHANGED_NOTIFICATION` | Subject for the password-changed notification. | No | No | |
| `GOTRUE_MAILER_SUBJECTS_PHONE_CHANGED_NOTIFICATION` | Subject for the phone-changed notification. | No | No | |
| `GOTRUE_MAILER_SUBJECTS_REAUTHENTICATION` | Subject for the reauthentication email. | No | No | |
| `GOTRUE_MAILER_SUBJECTS_RECOVERY` | Subject for the password-recovery email. | No | No | |
| `GOTRUE_MAILER_TEMPLATES_CONFIRMATION` | URL to the confirmation email template. | No | No | |
| `GOTRUE_MAILER_TEMPLATES_EMAIL_CHANGE` | URL to the email-change email template. | No | No | |
| `GOTRUE_MAILER_TEMPLATES_EMAIL_CHANGED_NOTIFICATION` | URL to the email-changed notification template. | No | No | |
| `GOTRUE_MAILER_TEMPLATES_IDENTITY_LINKED_NOTIFICATION` | URL to the identity-linked notification template. | No | No | |
| `GOTRUE_MAILER_TEMPLATES_IDENTITY_UNLINKED_NOTIFICATION` | URL to the identity-unlinked notification template. | No | No | |
| `GOTRUE_MAILER_TEMPLATES_INVITE` | URL to the invite email template. | No | No | |
| `GOTRUE_MAILER_TEMPLATES_MAGIC_LINK` | URL to the magic-link email template. | No | No | |
| `GOTRUE_MAILER_TEMPLATES_MFA_FACTOR_ENROLLED_NOTIFICATION` | URL to the MFA-enrolled notification template. | No | No | |
| `GOTRUE_MAILER_TEMPLATES_MFA_FACTOR_UNENROLLED_NOTIFICATION` | URL to the MFA-unenrolled notification template. | No | No | |
| `GOTRUE_MAILER_TEMPLATES_PASSWORD_CHANGED_NOTIFICATION` | URL to the password-changed notification template. | No | No | |
| `GOTRUE_MAILER_TEMPLATES_PHONE_CHANGED_NOTIFICATION` | URL to the phone-changed notification template. | No | No | |
| `GOTRUE_MAILER_TEMPLATES_REAUTHENTICATION` | URL to the reauthentication email template. | No | No | |
| `GOTRUE_MAILER_TEMPLATES_RECOVERY` | URL to the password-recovery email template. | No | No | |
| `GOTRUE_MAILER_URLPATHS_CONFIRMATION` | URL path appended to the email confirmation link. | Yes | Yes | Default: `/verify` |
| `GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE` | URL path appended to the email-change link. | Yes | Yes | Default: `/verify` |
| `GOTRUE_MAILER_URLPATHS_EMAIL_CHANGED_NOTIFICATION` | URL path for the email-changed notification link. | No | No | |
| `GOTRUE_MAILER_URLPATHS_IDENTITY_LINKED_NOTIFICATION` | URL path for the identity-linked notification link. | No | No | |
| `GOTRUE_MAILER_URLPATHS_IDENTITY_UNLINKED_NOTIFICATION` | URL path for the identity-unlinked notification link. | No | No | |
| `GOTRUE_MAILER_URLPATHS_INVITE` | URL path appended to the invite link. | Yes | Yes | Default: `/verify` |
| `GOTRUE_MAILER_URLPATHS_MAGIC_LINK` | URL path for the magic-link redirect. | No | No | |
| `GOTRUE_MAILER_URLPATHS_MFA_FACTOR_ENROLLED_NOTIFICATION` | URL path for the MFA-enrolled notification link. | No | No | |
| `GOTRUE_MAILER_URLPATHS_MFA_FACTOR_UNENROLLED_NOTIFICATION` | URL path for the MFA-unenrolled notification link. | No | No | |
| `GOTRUE_MAILER_URLPATHS_PASSWORD_CHANGED_NOTIFICATION` | URL path for the password-changed notification link. | No | No | |
| `GOTRUE_MAILER_URLPATHS_PHONE_CHANGED_NOTIFICATION` | URL path for the phone-changed notification link. | No | No | |
| `GOTRUE_MAILER_URLPATHS_REAUTHENTICATION` | URL path for the reauthentication link. | No | No | |
| `GOTRUE_MAILER_URLPATHS_RECOVERY` | URL path appended to the recovery link. | Yes | Yes | Default: `/verify` |

### External OAuth providers

The fields below are repeated for each provider. Substitute `<PROVIDER>` with one of: `APPLE`, `AZURE`, `BITBUCKET`, `DISCORD`, `FACEBOOK`, `FIGMA`, `FLY`, `GITHUB`, `GITLAB`, `GOOGLE`, `KAKAO`, `KEYCLOAK`, `LINKEDIN`, `LINKEDIN_OIDC`, `NOTION`, `SLACK`, `SLACK_OIDC`, `SNAPCHAT`, `SPOTIFY`, `TWITCH`, `TWITTER`, `VERCEL_MARKETPLACE`, `WORKOS`, `X`, `ZOOM`. Each provider supports: `_ENABLED`, `_CLIENT_ID`, `_SECRET`, `_REDIRECT_URI`, `_URL`, `_API_URL`, `_SKIP_NONCE_CHECK`, `_EMAIL_OPTIONAL`.

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOTRUE_EXTERNAL_ALLOWED_ID_TOKEN_ISSUERS` | Additional issuers accepted when verifying external ID tokens. | No | No | Defaults include `https://appleid.apple.com`, `https://accounts.google.com` |
| `GOTRUE_EXTERNAL_APPLE_API_URL` | Override Apple OAuth API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_APPLE_CLIENT_ID` | Apple OAuth client ID(s) (comma-separated). | Yes | No | |
| `GOTRUE_EXTERNAL_APPLE_EMAIL_OPTIONAL` | Allow accounts without an email from Apple. | Yes | No | |
| `GOTRUE_EXTERNAL_APPLE_ENABLED` | Enable the Apple provider. | Yes | No | |
| `GOTRUE_EXTERNAL_APPLE_REDIRECT_URI` | Override redirect URI for Apple. | Yes | No | |
| `GOTRUE_EXTERNAL_APPLE_SECRET` | Apple OAuth client secret. | Yes | No | |
| `GOTRUE_EXTERNAL_APPLE_SKIP_NONCE_CHECK` | Skip OIDC nonce check for Apple. | Yes | No | |
| `GOTRUE_EXTERNAL_APPLE_URL` | Override Apple OAuth base URL. | No | No | |
| `GOTRUE_EXTERNAL_AZURE_API_URL` | Override Azure API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_AZURE_CLIENT_ID` | Azure OAuth client ID. | No | Yes | Commented out in compose |
| `GOTRUE_EXTERNAL_AZURE_EMAIL_OPTIONAL` | Allow accounts without an email from Azure. | No | No | |
| `GOTRUE_EXTERNAL_AZURE_ENABLED` | Enable the Azure provider. | No | Yes | Commented out in compose |
| `GOTRUE_EXTERNAL_AZURE_REDIRECT_URI` | Override redirect URI for Azure. | No | Yes | Commented out in compose |
| `GOTRUE_EXTERNAL_AZURE_SECRET` | Azure OAuth client secret. | No | Yes | Commented out in compose |
| `GOTRUE_EXTERNAL_AZURE_SKIP_NONCE_CHECK` | Skip OIDC nonce check for Azure. | No | No | |
| `GOTRUE_EXTERNAL_AZURE_URL` | Override Azure OAuth base URL. | No | No | |
| `GOTRUE_EXTERNAL_BITBUCKET_API_URL` | Override Bitbucket API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_BITBUCKET_CLIENT_ID` | Bitbucket OAuth client ID. | No | No | |
| `GOTRUE_EXTERNAL_BITBUCKET_EMAIL_OPTIONAL` | Allow accounts without an email from Bitbucket. | No | No | |
| `GOTRUE_EXTERNAL_BITBUCKET_ENABLED` | Enable the Bitbucket provider. | No | No | |
| `GOTRUE_EXTERNAL_BITBUCKET_REDIRECT_URI` | Override redirect URI for Bitbucket. | No | No | |
| `GOTRUE_EXTERNAL_BITBUCKET_SECRET` | Bitbucket OAuth client secret. | No | No | |
| `GOTRUE_EXTERNAL_BITBUCKET_SKIP_NONCE_CHECK` | Skip OIDC nonce check for Bitbucket. | No | No | |
| `GOTRUE_EXTERNAL_BITBUCKET_URL` | Override Bitbucket OAuth base URL. | No | No | |
| `GOTRUE_EXTERNAL_DISCORD_API_URL` | Override Discord API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_DISCORD_CLIENT_ID` | Discord OAuth client ID. | No | No | |
| `GOTRUE_EXTERNAL_DISCORD_EMAIL_OPTIONAL` | Allow accounts without an email from Discord. | No | No | |
| `GOTRUE_EXTERNAL_DISCORD_ENABLED` | Enable the Discord provider. | No | No | |
| `GOTRUE_EXTERNAL_DISCORD_REDIRECT_URI` | Override redirect URI for Discord. | No | No | |
| `GOTRUE_EXTERNAL_DISCORD_SECRET` | Discord OAuth client secret. | No | No | |
| `GOTRUE_EXTERNAL_DISCORD_SKIP_NONCE_CHECK` | Skip OIDC nonce check for Discord. | No | No | |
| `GOTRUE_EXTERNAL_DISCORD_URL` | Override Discord OAuth base URL. | No | No | |
| `GOTRUE_EXTERNAL_EMAIL_AUTHORIZED_ADDRESSES` | Restrict email signup to a list of allowed addresses/domains. | No | No | |
| `GOTRUE_EXTERNAL_EMAIL_ENABLED` | Enable email/password authentication. | Yes | Yes | Default: `true` |
| `GOTRUE_EXTERNAL_EMAIL_MAGIC_LINK_ENABLED` | Enable email magic links. | No | No | Default: `true` |
| `GOTRUE_EXTERNAL_FACEBOOK_API_URL` | Override Facebook API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_FACEBOOK_CLIENT_ID` | Facebook OAuth client ID. | No | No | |
| `GOTRUE_EXTERNAL_FACEBOOK_EMAIL_OPTIONAL` | Allow accounts without an email from Facebook. | No | No | |
| `GOTRUE_EXTERNAL_FACEBOOK_ENABLED` | Enable the Facebook provider. | No | No | |
| `GOTRUE_EXTERNAL_FACEBOOK_REDIRECT_URI` | Override redirect URI for Facebook. | No | No | |
| `GOTRUE_EXTERNAL_FACEBOOK_SECRET` | Facebook OAuth client secret. | No | No | |
| `GOTRUE_EXTERNAL_FACEBOOK_SKIP_NONCE_CHECK` | Skip OIDC nonce check for Facebook. | No | No | |
| `GOTRUE_EXTERNAL_FACEBOOK_URL` | Override Facebook OAuth base URL. | No | No | |
| `GOTRUE_EXTERNAL_FIGMA_API_URL` | Override Figma API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_FIGMA_CLIENT_ID` | Figma OAuth client ID. | No | No | |
| `GOTRUE_EXTERNAL_FIGMA_EMAIL_OPTIONAL` | Allow accounts without an email from Figma. | No | No | |
| `GOTRUE_EXTERNAL_FIGMA_ENABLED` | Enable the Figma provider. | No | No | |
| `GOTRUE_EXTERNAL_FIGMA_REDIRECT_URI` | Override redirect URI for Figma. | No | No | |
| `GOTRUE_EXTERNAL_FIGMA_SECRET` | Figma OAuth client secret. | No | No | |
| `GOTRUE_EXTERNAL_FIGMA_SKIP_NONCE_CHECK` | Skip OIDC nonce check for Figma. | No | No | |
| `GOTRUE_EXTERNAL_FIGMA_URL` | Override Figma OAuth base URL. | No | No | |
| `GOTRUE_EXTERNAL_FLOW_STATE_EXPIRY_DURATION` | Lifetime of the PKCE flow state. | No | No | Default: `5m` (minimum enforced) |
| `GOTRUE_EXTERNAL_FLY_API_URL` | Override Fly.io API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_FLY_CLIENT_ID` | Fly.io OAuth client ID. | No | No | |
| `GOTRUE_EXTERNAL_FLY_EMAIL_OPTIONAL` | Allow accounts without an email from Fly.io. | No | No | |
| `GOTRUE_EXTERNAL_FLY_ENABLED` | Enable the Fly.io provider. | No | No | |
| `GOTRUE_EXTERNAL_FLY_REDIRECT_URI` | Override redirect URI for Fly.io. | No | No | |
| `GOTRUE_EXTERNAL_FLY_SECRET` | Fly.io OAuth client secret. | No | No | |
| `GOTRUE_EXTERNAL_FLY_SKIP_NONCE_CHECK` | Skip OIDC nonce check for Fly.io. | No | No | |
| `GOTRUE_EXTERNAL_FLY_URL` | Override Fly.io OAuth base URL. | No | No | |
| `GOTRUE_EXTERNAL_GITHUB_API_URL` | Override GitHub API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_GITHUB_CLIENT_ID` | GitHub OAuth client ID. | No | Yes | Commented out in compose |
| `GOTRUE_EXTERNAL_GITHUB_EMAIL_OPTIONAL` | Allow accounts without an email from GitHub. | No | No | |
| `GOTRUE_EXTERNAL_GITHUB_ENABLED` | Enable the GitHub provider. | No | Yes | Commented out in compose |
| `GOTRUE_EXTERNAL_GITHUB_REDIRECT_URI` | Override redirect URI for GitHub. | No | Yes | Commented out in compose |
| `GOTRUE_EXTERNAL_GITHUB_SECRET` | GitHub OAuth client secret. | No | Yes | Commented out in compose |
| `GOTRUE_EXTERNAL_GITHUB_SKIP_NONCE_CHECK` | Skip OIDC nonce check for GitHub. | No | No | |
| `GOTRUE_EXTERNAL_GITHUB_URL` | Override GitHub OAuth base URL. | No | No | |
| `GOTRUE_EXTERNAL_GITLAB_API_URL` | Override GitLab API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_GITLAB_CLIENT_ID` | GitLab OAuth client ID. | No | No | |
| `GOTRUE_EXTERNAL_GITLAB_EMAIL_OPTIONAL` | Allow accounts without an email from GitLab. | No | No | |
| `GOTRUE_EXTERNAL_GITLAB_ENABLED` | Enable the GitLab provider. | No | No | |
| `GOTRUE_EXTERNAL_GITLAB_REDIRECT_URI` | Override redirect URI for GitLab. | No | No | |
| `GOTRUE_EXTERNAL_GITLAB_SECRET` | GitLab OAuth client secret. | No | No | |
| `GOTRUE_EXTERNAL_GITLAB_SKIP_NONCE_CHECK` | Skip OIDC nonce check for GitLab. | No | No | |
| `GOTRUE_EXTERNAL_GITLAB_URL` | Override GitLab OAuth base URL. | No | No | |
| `GOTRUE_EXTERNAL_GOOGLE_API_URL` | Override Google API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID` | Google OAuth client ID. | No | Yes | Commented out in compose |
| `GOTRUE_EXTERNAL_GOOGLE_EMAIL_OPTIONAL` | Allow accounts without an email from Google. | No | No | |
| `GOTRUE_EXTERNAL_GOOGLE_ENABLED` | Enable the Google provider. | No | Yes | Commented out in compose |
| `GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI` | Override redirect URI for Google. | No | Yes | Commented out in compose |
| `GOTRUE_EXTERNAL_GOOGLE_SECRET` | Google OAuth client secret. | No | Yes | Commented out in compose |
| `GOTRUE_EXTERNAL_GOOGLE_SKIP_NONCE_CHECK` | Skip OIDC nonce check for Google. | No | No | |
| `GOTRUE_EXTERNAL_GOOGLE_URL` | Override Google OAuth base URL. | No | No | |
| `GOTRUE_EXTERNAL_IOS_BUNDLE_ID` | Apple iOS bundle ID for the Apple provider. | No | No | |
| `GOTRUE_EXTERNAL_KAKAO_API_URL` | Override Kakao API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_KAKAO_CLIENT_ID` | Kakao OAuth client ID. | No | No | |
| `GOTRUE_EXTERNAL_KAKAO_EMAIL_OPTIONAL` | Allow accounts without an email from Kakao. | No | No | |
| `GOTRUE_EXTERNAL_KAKAO_ENABLED` | Enable the Kakao provider. | No | No | |
| `GOTRUE_EXTERNAL_KAKAO_REDIRECT_URI` | Override redirect URI for Kakao. | No | No | |
| `GOTRUE_EXTERNAL_KAKAO_SECRET` | Kakao OAuth client secret. | No | No | |
| `GOTRUE_EXTERNAL_KAKAO_SKIP_NONCE_CHECK` | Skip OIDC nonce check for Kakao. | No | No | |
| `GOTRUE_EXTERNAL_KAKAO_URL` | Override Kakao OAuth base URL. | No | No | |
| `GOTRUE_EXTERNAL_KEYCLOAK_API_URL` | Override Keycloak API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_KEYCLOAK_CLIENT_ID` | Keycloak OAuth client ID. | No | No | |
| `GOTRUE_EXTERNAL_KEYCLOAK_EMAIL_OPTIONAL` | Allow accounts without an email from Keycloak. | No | No | |
| `GOTRUE_EXTERNAL_KEYCLOAK_ENABLED` | Enable the Keycloak provider. | No | No | |
| `GOTRUE_EXTERNAL_KEYCLOAK_REDIRECT_URI` | Override redirect URI for Keycloak. | No | No | |
| `GOTRUE_EXTERNAL_KEYCLOAK_SECRET` | Keycloak OAuth client secret. | No | No | |
| `GOTRUE_EXTERNAL_KEYCLOAK_SKIP_NONCE_CHECK` | Skip OIDC nonce check for Keycloak. | No | No | |
| `GOTRUE_EXTERNAL_KEYCLOAK_URL` | Override Keycloak OAuth base URL (realm URL). | No | No | |
| `GOTRUE_EXTERNAL_LINKEDIN_API_URL` | Override LinkedIn API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_LINKEDIN_CLIENT_ID` | LinkedIn OAuth client ID. | No | No | |
| `GOTRUE_EXTERNAL_LINKEDIN_EMAIL_OPTIONAL` | Allow accounts without an email from LinkedIn. | No | No | |
| `GOTRUE_EXTERNAL_LINKEDIN_ENABLED` | Enable the legacy LinkedIn provider. | No | No | |
| `GOTRUE_EXTERNAL_LINKEDIN_OIDC_API_URL` | Override LinkedIn OIDC API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_LINKEDIN_OIDC_CLIENT_ID` | LinkedIn OIDC client ID. | No | No | |
| `GOTRUE_EXTERNAL_LINKEDIN_OIDC_EMAIL_OPTIONAL` | Allow accounts without an email from LinkedIn OIDC. | No | No | |
| `GOTRUE_EXTERNAL_LINKEDIN_OIDC_ENABLED` | Enable the LinkedIn OIDC provider. | No | No | |
| `GOTRUE_EXTERNAL_LINKEDIN_OIDC_REDIRECT_URI` | Override redirect URI for LinkedIn OIDC. | No | No | |
| `GOTRUE_EXTERNAL_LINKEDIN_OIDC_SECRET` | LinkedIn OIDC client secret. | No | No | |
| `GOTRUE_EXTERNAL_LINKEDIN_OIDC_SKIP_NONCE_CHECK` | Skip OIDC nonce check for LinkedIn OIDC. | No | No | |
| `GOTRUE_EXTERNAL_LINKEDIN_OIDC_URL` | Override LinkedIn OIDC base URL. | No | No | |
| `GOTRUE_EXTERNAL_LINKEDIN_REDIRECT_URI` | Override redirect URI for LinkedIn. | No | No | |
| `GOTRUE_EXTERNAL_LINKEDIN_SECRET` | LinkedIn OAuth client secret. | No | No | |
| `GOTRUE_EXTERNAL_LINKEDIN_SKIP_NONCE_CHECK` | Skip OIDC nonce check for LinkedIn. | No | No | |
| `GOTRUE_EXTERNAL_LINKEDIN_URL` | Override LinkedIn OAuth base URL. | No | No | |
| `GOTRUE_EXTERNAL_NOTION_API_URL` | Override Notion API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_NOTION_CLIENT_ID` | Notion OAuth client ID. | No | No | |
| `GOTRUE_EXTERNAL_NOTION_EMAIL_OPTIONAL` | Allow accounts without an email from Notion. | No | No | |
| `GOTRUE_EXTERNAL_NOTION_ENABLED` | Enable the Notion provider. | No | No | |
| `GOTRUE_EXTERNAL_NOTION_REDIRECT_URI` | Override redirect URI for Notion. | No | No | |
| `GOTRUE_EXTERNAL_NOTION_SECRET` | Notion OAuth client secret. | No | No | |
| `GOTRUE_EXTERNAL_NOTION_SKIP_NONCE_CHECK` | Skip OIDC nonce check for Notion. | No | No | |
| `GOTRUE_EXTERNAL_NOTION_URL` | Override Notion OAuth base URL. | No | No | |
| `GOTRUE_EXTERNAL_OIDC_PROVIDER_CACHE_TTL` | Cache lifetime for OIDC discovery documents. | No | No | Default: `1h` |
| `GOTRUE_EXTERNAL_REDIRECT_URL` | Global override of OAuth redirect URL. | No | No | |
| `GOTRUE_EXTERNAL_SKIP_NONCE_CHECK` | Listed (commented) in compose but does not map to a configuration field. | No | Yes | Commented out in compose; no effect - use per-provider `*_SKIP_NONCE_CHECK` |
| `GOTRUE_EXTERNAL_SLACK_API_URL` | Override Slack API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_SLACK_CLIENT_ID` | Legacy Slack OAuth client ID. | No | No | |
| `GOTRUE_EXTERNAL_SLACK_EMAIL_OPTIONAL` | Allow accounts without an email from Slack. | No | No | |
| `GOTRUE_EXTERNAL_SLACK_ENABLED` | Enable the legacy Slack provider. | No | No | Prefer `SLACK_OIDC` |
| `GOTRUE_EXTERNAL_SLACK_OIDC_API_URL` | Override Slack OIDC API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_SLACK_OIDC_CLIENT_ID` | Slack OIDC client ID. | No | No | |
| `GOTRUE_EXTERNAL_SLACK_OIDC_EMAIL_OPTIONAL` | Allow accounts without an email from Slack OIDC. | No | No | |
| `GOTRUE_EXTERNAL_SLACK_OIDC_ENABLED` | Enable the Slack OIDC provider. | No | No | |
| `GOTRUE_EXTERNAL_SLACK_OIDC_REDIRECT_URI` | Override redirect URI for Slack OIDC. | No | No | |
| `GOTRUE_EXTERNAL_SLACK_OIDC_SECRET` | Slack OIDC client secret. | No | No | |
| `GOTRUE_EXTERNAL_SLACK_OIDC_SKIP_NONCE_CHECK` | Skip OIDC nonce check for Slack OIDC. | No | No | |
| `GOTRUE_EXTERNAL_SLACK_OIDC_URL` | Override Slack OIDC base URL. | No | No | |
| `GOTRUE_EXTERNAL_SLACK_REDIRECT_URI` | Override redirect URI for Slack. | No | No | |
| `GOTRUE_EXTERNAL_SLACK_SECRET` | Legacy Slack OAuth client secret. | No | No | |
| `GOTRUE_EXTERNAL_SLACK_SKIP_NONCE_CHECK` | Skip OIDC nonce check for Slack. | No | No | |
| `GOTRUE_EXTERNAL_SLACK_URL` | Override Slack OAuth base URL. | No | No | |
| `GOTRUE_EXTERNAL_SNAPCHAT_API_URL` | Override Snapchat API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_SNAPCHAT_CLIENT_ID` | Snapchat OAuth client ID. | No | No | |
| `GOTRUE_EXTERNAL_SNAPCHAT_EMAIL_OPTIONAL` | Allow accounts without an email from Snapchat. | No | No | |
| `GOTRUE_EXTERNAL_SNAPCHAT_ENABLED` | Enable the Snapchat provider. | No | No | |
| `GOTRUE_EXTERNAL_SNAPCHAT_REDIRECT_URI` | Override redirect URI for Snapchat. | No | No | |
| `GOTRUE_EXTERNAL_SNAPCHAT_SECRET` | Snapchat OAuth client secret. | No | No | |
| `GOTRUE_EXTERNAL_SNAPCHAT_SKIP_NONCE_CHECK` | Skip OIDC nonce check for Snapchat. | No | No | |
| `GOTRUE_EXTERNAL_SNAPCHAT_URL` | Override Snapchat OAuth base URL. | No | No | |
| `GOTRUE_EXTERNAL_SPOTIFY_API_URL` | Override Spotify API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_SPOTIFY_CLIENT_ID` | Spotify OAuth client ID. | No | No | |
| `GOTRUE_EXTERNAL_SPOTIFY_EMAIL_OPTIONAL` | Allow accounts without an email from Spotify. | No | No | |
| `GOTRUE_EXTERNAL_SPOTIFY_ENABLED` | Enable the Spotify provider. | No | No | |
| `GOTRUE_EXTERNAL_SPOTIFY_REDIRECT_URI` | Override redirect URI for Spotify. | No | No | |
| `GOTRUE_EXTERNAL_SPOTIFY_SECRET` | Spotify OAuth client secret. | No | No | |
| `GOTRUE_EXTERNAL_SPOTIFY_SKIP_NONCE_CHECK` | Skip OIDC nonce check for Spotify. | No | No | |
| `GOTRUE_EXTERNAL_SPOTIFY_URL` | Override Spotify OAuth base URL. | No | No | |
| `GOTRUE_EXTERNAL_TWITCH_API_URL` | Override Twitch API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_TWITCH_CLIENT_ID` | Twitch OAuth client ID. | No | No | |
| `GOTRUE_EXTERNAL_TWITCH_EMAIL_OPTIONAL` | Allow accounts without an email from Twitch. | No | No | |
| `GOTRUE_EXTERNAL_TWITCH_ENABLED` | Enable the Twitch provider. | No | No | |
| `GOTRUE_EXTERNAL_TWITCH_REDIRECT_URI` | Override redirect URI for Twitch. | No | No | |
| `GOTRUE_EXTERNAL_TWITCH_SECRET` | Twitch OAuth client secret. | No | No | |
| `GOTRUE_EXTERNAL_TWITCH_SKIP_NONCE_CHECK` | Skip OIDC nonce check for Twitch. | No | No | |
| `GOTRUE_EXTERNAL_TWITCH_URL` | Override Twitch OAuth base URL. | No | No | |
| `GOTRUE_EXTERNAL_TWITTER_API_URL` | Override Twitter API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_TWITTER_CLIENT_ID` | Twitter OAuth client ID. | No | No | |
| `GOTRUE_EXTERNAL_TWITTER_EMAIL_OPTIONAL` | Allow accounts without an email from Twitter. | No | No | |
| `GOTRUE_EXTERNAL_TWITTER_ENABLED` | Enable the Twitter provider. | No | No | |
| `GOTRUE_EXTERNAL_TWITTER_REDIRECT_URI` | Override redirect URI for Twitter. | No | No | |
| `GOTRUE_EXTERNAL_TWITTER_SECRET` | Twitter OAuth client secret. | No | No | |
| `GOTRUE_EXTERNAL_TWITTER_SKIP_NONCE_CHECK` | Skip OIDC nonce check for Twitter. | No | No | |
| `GOTRUE_EXTERNAL_TWITTER_URL` | Override Twitter OAuth base URL. | No | No | |
| `GOTRUE_EXTERNAL_VERCEL_MARKETPLACE_API_URL` | Override Vercel Marketplace API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_VERCEL_MARKETPLACE_CLIENT_ID` | Vercel Marketplace OAuth client ID. | No | No | |
| `GOTRUE_EXTERNAL_VERCEL_MARKETPLACE_EMAIL_OPTIONAL` | Allow accounts without an email from Vercel Marketplace. | No | No | |
| `GOTRUE_EXTERNAL_VERCEL_MARKETPLACE_ENABLED` | Enable the Vercel Marketplace provider. | No | No | |
| `GOTRUE_EXTERNAL_VERCEL_MARKETPLACE_REDIRECT_URI` | Override redirect URI for Vercel Marketplace. | No | No | |
| `GOTRUE_EXTERNAL_VERCEL_MARKETPLACE_SECRET` | Vercel Marketplace OAuth client secret. | No | No | |
| `GOTRUE_EXTERNAL_VERCEL_MARKETPLACE_SKIP_NONCE_CHECK` | Skip OIDC nonce check for Vercel Marketplace. | No | No | |
| `GOTRUE_EXTERNAL_VERCEL_MARKETPLACE_URL` | Override Vercel Marketplace OAuth base URL. | No | No | |
| `GOTRUE_EXTERNAL_WORKOS_API_URL` | Override WorkOS API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_WORKOS_CLIENT_ID` | WorkOS OAuth client ID. | No | No | |
| `GOTRUE_EXTERNAL_WORKOS_EMAIL_OPTIONAL` | Allow accounts without an email from WorkOS. | No | No | |
| `GOTRUE_EXTERNAL_WORKOS_ENABLED` | Enable the WorkOS provider. | No | No | |
| `GOTRUE_EXTERNAL_WORKOS_REDIRECT_URI` | Override redirect URI for WorkOS. | No | No | |
| `GOTRUE_EXTERNAL_WORKOS_SECRET` | WorkOS OAuth client secret. | No | No | |
| `GOTRUE_EXTERNAL_WORKOS_SKIP_NONCE_CHECK` | Skip OIDC nonce check for WorkOS. | No | No | |
| `GOTRUE_EXTERNAL_WORKOS_URL` | Override WorkOS OAuth base URL. | No | No | |
| `GOTRUE_EXTERNAL_X_API_URL` | Override X (Twitter) API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_X_CLIENT_ID` | X (Twitter) OAuth client ID. | No | No | |
| `GOTRUE_EXTERNAL_X_EMAIL_OPTIONAL` | Allow accounts without an email from X. | No | No | |
| `GOTRUE_EXTERNAL_X_ENABLED` | Enable the X (Twitter) provider. | No | No | |
| `GOTRUE_EXTERNAL_X_REDIRECT_URI` | Override redirect URI for X. | No | No | |
| `GOTRUE_EXTERNAL_X_SECRET` | X (Twitter) OAuth client secret. | No | No | |
| `GOTRUE_EXTERNAL_X_SKIP_NONCE_CHECK` | Skip OIDC nonce check for X. | No | No | |
| `GOTRUE_EXTERNAL_X_URL` | Override X (Twitter) OAuth base URL. | No | No | |
| `GOTRUE_EXTERNAL_ZOOM_API_URL` | Override Zoom API endpoint. | No | No | |
| `GOTRUE_EXTERNAL_ZOOM_CLIENT_ID` | Zoom OAuth client ID. | No | No | |
| `GOTRUE_EXTERNAL_ZOOM_EMAIL_OPTIONAL` | Allow accounts without an email from Zoom. | No | No | |
| `GOTRUE_EXTERNAL_ZOOM_ENABLED` | Enable the Zoom provider. | No | No | |
| `GOTRUE_EXTERNAL_ZOOM_REDIRECT_URI` | Override redirect URI for Zoom. | No | No | |
| `GOTRUE_EXTERNAL_ZOOM_SECRET` | Zoom OAuth client secret. | No | No | |
| `GOTRUE_EXTERNAL_ZOOM_SKIP_NONCE_CHECK` | Skip OIDC nonce check for Zoom. | No | No | |
| `GOTRUE_EXTERNAL_ZOOM_URL` | Override Zoom OAuth base URL. | No | No | |

### Anonymous

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED` | Enable anonymous user signup. | Yes | Yes | Default: `false` |

### Custom OAuth / OAuth Server

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOTRUE_CUSTOM_OAUTH_ENABLED` | Enable user-defined custom OAuth/OIDC providers. | No | No | Default: `true` |
| `GOTRUE_CUSTOM_OAUTH_MAX_PROVIDERS` | Maximum number of custom providers allowed. | No | No | Default: `0` (unlimited) |
| `GOTRUE_OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION` | Allow dynamic client registration on the OAuth server. | No | No | |
| `GOTRUE_OAUTH_SERVER_AUTHORIZATION_PATH` | Path prefix for the OAuth authorization endpoint. | No | No | |
| `GOTRUE_OAUTH_SERVER_AUTHORIZATION_TTL` | Lifetime of an authorization code. | No | No | Default: `10m` |
| `GOTRUE_OAUTH_SERVER_DEFAULT_SCOPE` | Default scope returned to clients. | No | No | Default: `email` |
| `GOTRUE_OAUTH_SERVER_ENABLED` | Enable the built-in OAuth authorization server. | No | No | Default: `false` |

### Phone / SMS

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOTRUE_EXTERNAL_PHONE_ENABLED` | Enable phone-based authentication. | Yes | Yes | Default: `false` |
| `GOTRUE_SMS_AUTOCONFIRM` | Skip phone verification flow. | Yes | Yes | |
| `GOTRUE_SMS_MAX_FREQUENCY` | Minimum interval between SMS messages per phone. | Yes | Yes | Default: `1m`, commented out in compose |
| `GOTRUE_SMS_MESSAGEBIRD_ACCESS_KEY` | Messagebird API access key. | No | No | |
| `GOTRUE_SMS_MESSAGEBIRD_ORIGINATOR` | Messagebird originator (sender ID). | No | No | |
| `GOTRUE_SMS_OTP_EXP` | SMS OTP expiry in seconds. | Yes | Yes | Default: `60`, commented out in compose |
| `GOTRUE_SMS_OTP_LENGTH` | SMS OTP code length (6-10). | Yes | Yes | Default: `6`, commented out in compose |
| `GOTRUE_SMS_PROVIDER` | SMS provider name (`twilio`, `twilio_verify`, `messagebird`, `textlocal`, `vonage`). | No | Yes | Commented out in compose |
| `GOTRUE_SMS_TEMPLATE` | Message template for SMS OTP. | Yes | Yes | Commented out in compose |
| `GOTRUE_SMS_TEST_OTP` | JSON map of phone-to-OTP overrides for testing. | Yes | Yes | Commented out in compose |
| `GOTRUE_SMS_TEST_OTP_VALID_UNTIL` | Cutoff time after which test OTPs stop being accepted. | No | No | |
| `GOTRUE_SMS_TEXTLOCAL_API_KEY` | Textlocal API key. | No | No | |
| `GOTRUE_SMS_TEXTLOCAL_SENDER` | Textlocal sender ID. | No | No | |
| `GOTRUE_SMS_TWILIO_ACCOUNT_SID` | Twilio account SID. | No | Yes | Commented out in compose |
| `GOTRUE_SMS_TWILIO_AUTH_TOKEN` | Twilio auth token. | No | Yes | Commented out in compose |
| `GOTRUE_SMS_TWILIO_CONTENT_SID` | Twilio content SID (template). | No | No | |
| `GOTRUE_SMS_TWILIO_MESSAGE_SERVICE_SID` | Twilio message service SID / phone number. | No | Yes | Commented out in compose |
| `GOTRUE_SMS_TWILIO_VERIFY_ACCOUNT_SID` | Twilio Verify account SID. | No | No | |
| `GOTRUE_SMS_TWILIO_VERIFY_AUTH_TOKEN` | Twilio Verify auth token. | No | No | |
| `GOTRUE_SMS_TWILIO_VERIFY_MESSAGE_SERVICE_SID` | Twilio Verify message service SID. | No | No | |
| `GOTRUE_SMS_VONAGE_API_KEY` | Vonage API key. | No | No | |
| `GOTRUE_SMS_VONAGE_API_SECRET` | Vonage API secret. | No | No | |
| `GOTRUE_SMS_VONAGE_FROM` | Vonage `from` parameter (sender). | No | No | |

### MFA

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOTRUE_MFA_CHALLENGE_EXPIRY_DURATION` | Lifetime of an MFA challenge (seconds). | No | No | Default: `300` |
| `GOTRUE_MFA_FACTOR_EXPIRY_DURATION` | Lifetime of an unverified MFA factor. | No | No | Default: `300s` |
| `GOTRUE_MFA_MAX_ENROLLED_FACTORS` | Maximum factors a user may enroll. | Yes | Yes | Default: `10`, commented out in compose |
| `GOTRUE_MFA_MAX_VERIFIED_FACTORS` | Maximum verified factors per user. | No | No | Default: `10` |
| `GOTRUE_MFA_PHONE_ENROLL_ENABLED` | Allow enrolling a phone MFA factor. | Yes | Yes | Default: `false`, commented out in compose |
| `GOTRUE_MFA_PHONE_MAX_FREQUENCY` | Minimum interval between MFA phone OTPs. | No | No | Default: `1m` |
| `GOTRUE_MFA_PHONE_OTP_LENGTH` | Phone MFA OTP code length. | No | No | Default: `6` |
| `GOTRUE_MFA_PHONE_TEMPLATE` | Template string for MFA phone OTP messages. | No | No | |
| `GOTRUE_MFA_PHONE_VERIFY_ENABLED` | Allow verifying a phone MFA factor. | Yes | Yes | Default: `false`, commented out in compose |
| `GOTRUE_MFA_RATE_LIMIT_CHALLENGE_AND_VERIFY` | Rate limit for MFA challenge + verify. | No | No | Default: `15` |
| `GOTRUE_MFA_TOTP_ENROLL_ENABLED` | Allow enrolling a TOTP MFA factor. | Yes | Yes | Default: `true`, commented out in compose |
| `GOTRUE_MFA_TOTP_VERIFY_ENABLED` | Allow verifying a TOTP MFA factor. | Yes | Yes | Default: `true`, commented out in compose |
| `GOTRUE_MFA_WEB_AUTHN_ENROLL_ENABLED` | Allow enrolling a WebAuthn MFA factor. | Yes | No | Default: `false` |
| `GOTRUE_MFA_WEB_AUTHN_VERIFY_ENABLED` | Allow verifying a WebAuthn MFA factor. | Yes | No | Default: `false` |

### WebAuthn / Passkey

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOTRUE_PASSKEY_ENABLED` | Enable passkey (passwordless WebAuthn) authentication. | No | No | Default: `false` |
| `GOTRUE_PASSKEY_MAX_PASSKEYS_PER_USER` | Maximum passkeys a user may register. | No | No | Default: `10` |
| `GOTRUE_WEBAUTHN_CHALLENGE_EXPIRY_DURATION` | Lifetime of a WebAuthn challenge. | No | No | Default: `5m` |
| `GOTRUE_WEBAUTHN_RP_DISPLAY_NAME` | WebAuthn relying party display name. | No | No | Required when WebAuthn/Passkey is enabled |
| `GOTRUE_WEBAUTHN_RP_ID` | WebAuthn relying party ID (host). | No | No | Required when WebAuthn/Passkey is enabled. Alias of `RP_ID` |
| `RP_ID` | WebAuthn relying party ID (bare alias). | No | No | |
| `GOTRUE_WEBAUTHN_RP_ORIGINS` | Allowed WebAuthn origins (https or http://localhost). | No | No | Required when WebAuthn/Passkey is enabled |

### SAML

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOTRUE_SAML_ALLOW_ENCRYPTED_ASSERTIONS` | Permit encrypted SAML assertions. | No | Yes | Commented out in compose |
| `GOTRUE_SAML_ENABLED` | Enable SAML SSO. | No | Yes | Commented out in compose |
| `GOTRUE_SAML_EXTERNAL_URL` | External URL used in SAML metadata (defaults to `API_EXTERNAL_URL`). | No | Yes | Commented out in compose |
| `GOTRUE_SAML_PRIVATE_KEY` | Base64-encoded PKCS#1 RSA private key (>= 2048 bits). | No | Yes | Commented out in compose |
| `GOTRUE_SAML_RATE_LIMIT_ASSERTION` | Rate limit for SAML assertion submissions. | No | Yes | Default: `15`, commented out in compose |
| `GOTRUE_SAML_RELAY_STATE_VALIDITY_PERIOD` | Lifetime of SAML RelayState. | No | Yes | Default: `2m`, commented out in compose |

### Hooks

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOTRUE_HOOK_AFTER_USER_CREATED_ENABLED` | Enable the after-user-created hook. | No | No | |
| `GOTRUE_HOOK_AFTER_USER_CREATED_SECRETS` | Standard webhook secrets (pipe-separated) for after-user-created hook. | No | No | |
| `GOTRUE_HOOK_AFTER_USER_CREATED_URI` | URI of the after-user-created hook (pg-functions or https). | No | No | |
| `GOTRUE_HOOK_BEFORE_USER_CREATED_ENABLED` | Enable the before-user-created hook. | No | No | |
| `GOTRUE_HOOK_BEFORE_USER_CREATED_SECRETS` | Standard webhook secrets for the before-user-created hook. | No | No | |
| `GOTRUE_HOOK_BEFORE_USER_CREATED_URI` | URI of the before-user-created hook. | No | No | |
| `GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_ENABLED` | Enable the custom access token hook. | No | Yes | Commented out in compose |
| `GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_SECRETS` | Standard webhook secrets for the custom access token hook. | No | Yes | Commented out in compose |
| `GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_URI` | URI of the custom access token hook. | No | Yes | Commented out in compose |
| `GOTRUE_HOOK_MFA_VERIFICATION_ATTEMPT_ENABLED` | Enable the MFA verification attempt hook. | No | Yes | Commented out in compose |
| `GOTRUE_HOOK_MFA_VERIFICATION_ATTEMPT_SECRETS` | Standard webhook secrets for the MFA verification attempt hook. | No | No | |
| `GOTRUE_HOOK_MFA_VERIFICATION_ATTEMPT_URI` | URI of the MFA verification attempt hook. | No | Yes | Commented out in compose |
| `GOTRUE_HOOK_PASSWORD_VERIFICATION_ATTEMPT_ENABLED` | Enable the password verification attempt hook. | No | Yes | Commented out in compose |
| `GOTRUE_HOOK_PASSWORD_VERIFICATION_ATTEMPT_SECRETS` | Standard webhook secrets for the password verification attempt hook. | No | No | |
| `GOTRUE_HOOK_PASSWORD_VERIFICATION_ATTEMPT_URI` | URI of the password verification attempt hook. | No | Yes | Commented out in compose |
| `GOTRUE_HOOK_SEND_EMAIL_ENABLED` | Enable the send-email hook. | No | Yes | Commented out in compose |
| `GOTRUE_HOOK_SEND_EMAIL_SECRETS` | Standard webhook secrets for the send-email hook. | No | Yes | Commented out in compose |
| `GOTRUE_HOOK_SEND_EMAIL_URI` | URI of the send-email hook. | No | Yes | Commented out in compose |
| `GOTRUE_HOOK_SEND_SMS_ENABLED` | Enable the send-SMS hook. | No | Yes | Commented out in compose |
| `GOTRUE_HOOK_SEND_SMS_SECRETS` | Standard webhook secrets for the send-SMS hook. | No | Yes | Commented out in compose |
| `GOTRUE_HOOK_SEND_SMS_URI` | URI of the send-SMS hook. | No | Yes | Commented out in compose |

### Rate limits

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOTRUE_RATE_LIMIT_ANONYMOUS_USERS` | Rate limit for anonymous user creation. | Yes | No | Default: `30` per hour |
| `GOTRUE_RATE_LIMIT_EMAIL_SENT` | Rate limit for outgoing emails. Accepts `n` or `n/duration` (burst). | Yes | No | Default: `30` per hour |
| `GOTRUE_RATE_LIMIT_HEADER` | HTTP header used to identify the rate-limit subject (e.g. `X-Forwarded-For`). | No | No | |
| `GOTRUE_RATE_LIMIT_O_AUTH_DYNAMIC_CLIENT_REGISTER` | Rate limit for OAuth dynamic client registration. | No | No | Default: `10` per hour |
| `GOTRUE_RATE_LIMIT_OTP` | Rate limit for OTP endpoints. | Yes | No | Default: `30` per hour |
| `GOTRUE_RATE_LIMIT_PASSKEY` | Rate limit for passkey endpoints. | No | No | Default: `30` per hour |
| `GOTRUE_RATE_LIMIT_SMS_SENT` | Rate limit for outgoing SMS messages. | Yes | No | Default: `30` per hour |
| `GOTRUE_RATE_LIMIT_SSO` | Rate limit for SSO endpoints. | No | No | Default: `30` per hour |
| `GOTRUE_RATE_LIMIT_TOKEN_REFRESH` | Rate limit for token refresh. | Yes | No | Default: `150` per hour |
| `GOTRUE_RATE_LIMIT_VERIFY` | Rate limit for the verify endpoint. | Yes | No | Default: `30` per hour |
| `GOTRUE_RATE_LIMIT_WEB3` | Rate limit for Web3 sign-in. | Yes | No | Default: `30` per hour |

### Security

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOTRUE_SECURITY_DB_ENCRYPTION_DECRYPTION_KEYS` | Map of `key_id:base64-key` used to decrypt previously encrypted columns. | No | No | |
| `GOTRUE_SECURITY_DB_ENCRYPTION_ENCRYPT` | Enable column-level encryption for new writes. | No | No | |
| `GOTRUE_SECURITY_DB_ENCRYPTION_ENCRYPTION_KEY` | Active encryption key (256-bit, base64-RawURL-encoded). | No | No | |
| `GOTRUE_SECURITY_DB_ENCRYPTION_ENCRYPTION_KEY_ID` | ID of the active encryption key. | No | No | |
| `GOTRUE_SECURITY_MANUAL_LINKING_ENABLED` | Allow admins to link identities manually. | Yes | No | Default: `false` |
| `GOTRUE_SECURITY_REFRESH_TOKEN_ALGORITHM_VERSION` | Refresh token algorithm version (0, 1 or 2). | No | No | |
| `GOTRUE_SECURITY_REFRESH_TOKEN_ALLOW_REUSE` | Allow refresh-token reuse without rotation. | No | No | |
| `GOTRUE_SECURITY_REFRESH_TOKEN_REUSE_INTERVAL` | Grace period (s) during which a rotated refresh token can be reused. | Yes | No | |
| `GOTRUE_SECURITY_REFRESH_TOKEN_ROTATION_ENABLED` | Rotate refresh tokens on use. | Yes | No | Default: `true` |
| `GOTRUE_SECURITY_REFRESH_TOKEN_UPGRADE_PERCENTAGE` | Percentage of users to upgrade to a newer refresh-token format (0-100). | No | No | |
| `GOTRUE_SECURITY_SB_FORWARDED_FOR_ENABLED` | Trust the `X-Sb-Forwarded-For` header. | No | No | Default: `false` |
| `GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_CURRENT_PASSWORD` | Require the current password to change a password. | No | No | |
| `GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_REAUTHENTICATION` | Require reauthentication before changing a password. | Yes | No | |

### CAPTCHA

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOTRUE_SECURITY_CAPTCHA_ENABLED` | Enable CAPTCHA protection. | No | No | Default: `false` |
| `GOTRUE_SECURITY_CAPTCHA_PROVIDER` | CAPTCHA provider (`hcaptcha` or `turnstile`). | No | No | Default: `hcaptcha` |
| `GOTRUE_SECURITY_CAPTCHA_SECRET` | CAPTCHA provider secret. | No | No | |
| `GOTRUE_SECURITY_CAPTCHA_TIMEOUT` | HTTP timeout for the CAPTCHA verify call. | No | No | Default: `10s` |

### Password

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOTRUE_PASSWORD_HIBP_BLOOM_ENABLED` | Use a local bloom filter for HIBP lookups. | No | No | |
| `GOTRUE_PASSWORD_HIBP_BLOOM_FALSE_POSITIVES` | Target false positive rate for the HIBP bloom filter. | No | No | Default: `0.0000099` |
| `GOTRUE_PASSWORD_HIBP_BLOOM_ITEMS` | Expected number of items in the HIBP bloom filter. | No | No | Default: `100000` |
| `GOTRUE_PASSWORD_HIBP_ENABLED` | Reject pwned passwords using Have I Been Pwned. | No | No | |
| `GOTRUE_PASSWORD_HIBP_FAIL_CLOSED` | Reject requests if the HIBP lookup fails. | No | No | |
| `GOTRUE_PASSWORD_HIBP_USER_AGENT` | User-Agent sent to the HIBP API. | No | No | Default: `https://github.com/supabase/gotrue` |
| `GOTRUE_PASSWORD_MIN_LENGTH` | Minimum password length. | Yes | No | Default: `6` |
| `GOTRUE_PASSWORD_REQUIRED_CHARACTERS` | Colon-separated character classes required in passwords. | Yes | No | |

### Sessions

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOTRUE_SESSIONS_ALLOW_LOW_AAL` | Time during which a low-AAL session is still accepted. | No | No | |
| `GOTRUE_SESSIONS_INACTIVITY_TIMEOUT` | Session inactivity timeout. | No | No | |
| `GOTRUE_SESSIONS_SINGLE_PER_USER` | Allow only one active session per user. | No | No | |
| `GOTRUE_SESSIONS_TAGS` | Tags attached to created sessions. | No | No | |
| `GOTRUE_SESSIONS_TIMEBOX` | Absolute session lifetime. | No | No | |

### Web3

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOTRUE_EXTERNAL_WEB3_ETHEREUM_ENABLED` | Enable Ethereum sign-in (Sign-in with Ethereum). | Yes | No | Default: `false` |
| `GOTRUE_EXTERNAL_WEB3_ETHEREUM_MAXIMUM_VALIDITY_DURATION` | Max validity of an Ethereum signed message. | No | No | Default: `10m` |
| `GOTRUE_EXTERNAL_WEB3_SOLANA_ENABLED` | Enable Solana sign-in. | Yes | No | Default: `false` |
| `GOTRUE_EXTERNAL_WEB3_SOLANA_MAXIMUM_VALIDITY_DURATION` | Max validity of a Solana signed message. | No | No | Default: `10m` |

### CORS / Audit log

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOTRUE_AUDIT_LOG_DISABLE_POSTGRES` | Disable Postgres-backed audit log writes. | No | No | Default: `false` |
| `GOTRUE_CORS_ALLOWED_HEADERS` | Additional headers appended to the CORS allow-list. | No | No | |

### Logging

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOTRUE_LOG_DISABLE_COLORS` | Disable ANSI color in log output. | No | No | |
| `GOTRUE_LOG_FIELDS` | Static log fields (JSON object) attached to every log line. | No | No | |
| `GOTRUE_LOG_FILE` | Path to a file to write logs to. | No | No | |
| `GOTRUE_LOG_LEVEL` | Logger level (`debug`, `info`, `warn`, `error`). | No | No | |
| `GOTRUE_LOG_QUOTE_EMPTY_FIELDS` | Quote empty log field values. | No | No | |
| `GOTRUE_LOG_SQL` | SQL logger configuration. | No | No | |
| `GOTRUE_LOG_TSFORMAT` | Timestamp format string for log output. | No | No | |

### Profiler / Tracing / Metrics

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOTRUE_METRICS_ENABLED` | Enable metrics export. | No | No | |
| `GOTRUE_METRICS_EXPORTER` | Metrics exporter (`opentelemetry` or `prometheus`). | No | No | Default: `opentelemetry` |
| `GOTRUE_METRICS_OTEL_EXPORTER_OTLP_PROTOCOL` | OTLP protocol for metrics. | No | No | Default: `http/protobuf`. Alias of `OTEL_EXPORTER_OTLP_PROTOCOL` |
| `GOTRUE_METRICS_OTEL_EXPORTER_PROMETHEUS_HOST` | Bind host for the Prometheus exporter. | No | No | Default: `0.0.0.0`. Alias of `OTEL_EXPORTER_PROMETHEUS_HOST` |
| `GOTRUE_METRICS_OTEL_EXPORTER_PROMETHEUS_PORT` | Bind port for the Prometheus exporter. | No | No | Default: `9100`. Alias of `OTEL_EXPORTER_PROMETHEUS_PORT` |
| `GOTRUE_PROFILER_ENABLED` | Expose the Go pprof HTTP endpoint. | No | No | Default: `false` |
| `GOTRUE_PROFILER_HOST` | Bind host for the profiler endpoint. | No | No | Default: `localhost` |
| `GOTRUE_PROFILER_PORT` | Bind port for the profiler endpoint. | No | No | Default: `9998` |
| `GOTRUE_TRACING_ENABLED` | Enable distributed tracing. | No | No | |
| `GOTRUE_TRACING_EXPORTER` | Tracing exporter (`opentelemetry`). | No | No | Default: `opentelemetry` |
| `GOTRUE_TRACING_HOST` | OpenTelemetry collector host. | No | No | |
| `GOTRUE_TRACING_OTEL_EXPORTER_OTLP_PROTOCOL` | OTLP protocol for tracing. | No | No | Default: `http/protobuf`. Alias of `OTEL_EXPORTER_OTLP_PROTOCOL` |
| `GOTRUE_TRACING_PORT` | OpenTelemetry collector port. | No | No | |
| `GOTRUE_TRACING_SERVICE_NAME` | Service name reported in traces. | No | No | Default: `gotrue` |
| `GOTRUE_TRACING_TAGS` | Comma-separated `k=v` pairs attached to all spans. | No | No | |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | OTLP protocol (bare alias, applies to metrics and tracing). | No | No | Default: `http/protobuf` |
| `OTEL_EXPORTER_PROMETHEUS_HOST` | Prometheus host (bare alias). | No | No | Default: `0.0.0.0` |
| `OTEL_EXPORTER_PROMETHEUS_PORT` | Prometheus port (bare alias). | No | No | Default: `9100` |

### Config reloading

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOTRUE_RELOADING_GRACE_PERIOD_INTERVAL` | Idle period before processing a config reload (debounce). | No | No | Default: `5s` |
| `GOTRUE_RELOADING_NOTIFY_ENABLED` | Use filesystem notifications to detect config changes. | No | No | Default: `true` |
| `GOTRUE_RELOADING_POLLER_INTERVAL` | Polling interval when notifications are disabled. | No | No | Default: `10s` |
| `GOTRUE_RELOADING_POLLERENABLED` | Enable filesystem polling for config changes (name is intentionally unsplit). | No | No | Default: `false` |
| `GOTRUE_RELOADING_SIGNAL_ENABLED` | Trigger a config reload on receiving a Unix signal. | No | No | Default: `false` |
| `GOTRUE_RELOADING_SIGNAL_NUMBER` | Unix signal number to listen for. | No | No | Default: `10` (SIGUSR1) |

### Other

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOTRUE_EXPERIMENTAL_PROVIDERS_WITH_OWN_LINKING_DOMAIN` | Providers that do not participate in email-similarity identity linking. | No | No | Experimental |
| `GOTRUE_INDEX_WORKER_ENSURE_USER_SEARCH_INDEXES_EXIST` | Always create user-search indexes on startup. | No | No | Default: `false` |
| `GOTRUE_INDEX_WORKER_MAX_USERS_THRESHOLD` | Create user-search indexes only if user count is at or below this threshold. | No | No | Default: `0` (disabled) |
| `GOTRUE_INTERNAL_HTTP_TIMEOUT` | HTTP client timeout used by external OAuth and SMS provider calls. | No | No | Read via `os.Getenv`, not envconfig |
| `GOTRUE_OPERATOR_TOKEN` | Bearer token required for operator/admin endpoints. | No | No | |

---

## PostgREST

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `PGRST_ADMIN_SERVER_HOST` | Hostname for the PostgREST admin server. | No | No | Defaults to `server-host` value |
| `PGRST_ADMIN_SERVER_PORT` | Port for the PostgREST admin server. The admin server is disabled unless a port is set, and it must differ from `PGRST_SERVER_PORT`. | Yes | No | No default (admin server disabled when unset) |
| `PGRST_APP_SETTINGS_*` | Arbitrary settings exposed to PostgreSQL via `current_setting('app.settings.<name>')`. The suffix after `PGRST_APP_SETTINGS_` becomes the setting name (case-insensitive). | No | Yes | Used for `PGRST_APP_SETTINGS_JWT_SECRET` and `PGRST_APP_SETTINGS_JWT_EXP` in self-hosted |
| `PGRST_CLIENT_ERROR_VERBOSITY` | Controls verbosity of client-facing error responses. | No | No | Default: `verbose` (other value: `minimal`) |
| `PGRST_DB_AGGREGATES_ENABLED` | Allows the use of aggregate functions (`max`, `sum`, etc.) in queries. | No | No | Default: `false` |
| `PGRST_DB_ANON_ROLE` | Database role used for unauthenticated requests. When unset, anonymous access is blocked. | Yes | Yes | No default |
| `PGRST_DB_CHANNEL` | Postgres `NOTIFY` channel name used for schema cache and config reloading. | No | No | Default: `pgrst` |
| `PGRST_DB_CHANNEL_ENABLED` | Enables the Postgres `NOTIFY` listener channel. | No | No | Default: `true` |
| `PGRST_DB_CONFIG` | Enables loading in-database configuration via `db-pre-config` and role settings. | No | No | Default: `true` |
| `PGRST_DB_EXTRA_SEARCH_PATH` | Comma-separated list of extra schemas added to the `search_path` of every request. Schemas listed here do not get API endpoints. | No | Yes | Default: `public` |
| `PGRST_DB_HOISTED_TX_SETTINGS` | Comma-separated list of settings allowed to be applied as transaction-scoped function settings. | No | No | Default: `statement_timeout,plan_filter.statement_cost_limit,default_transaction_isolation` |
| `PGRST_DB_MAX_ROWS` | Hard limit on the number of rows PostgREST returns for any table, view, or function. | Yes | Yes | No default (unlimited); alias `PGRST_MAX_ROWS` |
| `PGRST_DB_PLAN_ENABLED` | Allows clients to request the query execution plan with `Accept: application/vnd.pgrst.plan`. | No | No | Default: `false` |
| `PGRST_DB_POOL` | Maximum number of database connections kept open in PostgREST's pool. | No | No | Default: `10` |
| `PGRST_DB_POOL_ACQUISITION_TIMEOUT` | Time in seconds a request waits for a free connection from the pool. | No | No | Default: `10` |
| `PGRST_DB_POOL_AUTOMATIC_RECOVERY` | Enables automatic retrying on connection loss. When disabled, PostgREST terminates after losing the database connection. | No | No | Default: `true` |
| `PGRST_DB_POOL_MAX_IDLETIME` | Time in seconds after which idle pool connections are closed. | No | No | Default: `30`; alias `PGRST_DB_POOL_TIMEOUT` |
| `PGRST_DB_POOL_MAX_LIFETIME` | Maximum lifetime in seconds of a connection in the pool before it is recycled. | No | No | Default: `1800` |
| `PGRST_DB_POOL_TIMEOUT` | Deprecated alias for `PGRST_DB_POOL_MAX_IDLETIME`. | No | No | Deprecated; use `PGRST_DB_POOL_MAX_IDLETIME` |
| `PGRST_DB_PRE_CONFIG` | Schema-qualified function name used for in-database configuration. | No | No | No default |
| `PGRST_DB_PRE_REQUEST` | Schema-qualified function executed right after transaction settings are set, on every request. | No | No | No default; alias `PGRST_PRE_REQUEST` |
| `PGRST_DB_PREPARED_STATEMENTS` | Enables prepared statements. Disable only when running behind an external connection pooler in transaction pooling mode. | No | No | Default: `true` |
| `PGRST_DB_ROOT_SPEC` | Schema-qualified function used to override the OpenAPI response at the API root. | No | No | No default; alias `PGRST_ROOT_SPEC` |
| `PGRST_DB_SCHEMA` | Deprecated alias for `PGRST_DB_SCHEMAS`. | No | No | Deprecated; use `PGRST_DB_SCHEMAS` |
| `PGRST_DB_SCHEMAS` | Comma-separated list of database schemas exposed by the REST API. `pg_catalog` and `information_schema` are not allowed. | Yes | Yes | Default: `public` |
| `PGRST_DB_TIMEZONE_ENABLED` | Enables the `Prefer: timezone` header for querying `pg_timezone_names`. | No | No | Default: `true` |
| `PGRST_DB_TX_END` | Controls how database transactions are terminated. Allowed values: `commit`, `commit-allow-override`, `rollback`, `rollback-allow-override`. | No | No | Default: `commit` |
| `PGRST_DB_URI` | PostgreSQL connection string (URI or key/value). Prefix with `@` to load from a file. Defaults read libpq env vars. | Yes | Yes | Default: `postgresql://`; required |
| `PGRST_DB_USE_LEGACY_GUCS` | Toggles legacy text-based GUCs versus JSON GUCs for request context. | No | Yes | Deprecated; removed in PostgREST v12 (still set in self-hosted docker-compose) |
| `PGRST_INTERNAL_SCHEMA_CACHE_LOAD_SLEEP` | Internal test hook: sleep (ms) inserted while loading the schema cache. | No | No | Internal; no default |
| `PGRST_INTERNAL_SCHEMA_CACHE_QUERY_SLEEP` | Internal test hook: sleep (ms) inserted during schema cache query. | No | No | Internal; no default |
| `PGRST_INTERNAL_SCHEMA_CACHE_RELATIONSHIP_LOAD_SLEEP` | Internal test hook: sleep (ms) inserted while loading schema cache relationships. | No | No | Internal; no default |
| `PGRST_JWT_AUD` | Expected value of the `aud` claim in JWTs. Must be a string or valid URI. | No | No | No default |
| `PGRST_JWT_CACHE_MAX_ENTRIES` | Maximum entries in the JWT validation cache. Set to `0` to disable caching. | No | No | Default: `1000` |
| `PGRST_JWT_ROLE_CLAIM_KEY` | JSPath expression locating the role claim inside the JWT. | No | No | Default: `.role`; alias `PGRST_ROLE_CLAIM_KEY` |
| `PGRST_JWT_SECRET` | Secret, JWK, or JWKS used to verify JWTs. Must be at least 32 characters for symmetric secrets. Prefix with `@` to load from a file. | Yes | Yes | No default |
| `PGRST_JWT_SECRET_IS_BASE64` | Treats `PGRST_JWT_SECRET` as base64-encoded. | No | No | Default: `false`; alias `PGRST_SECRET_IS_BASE64` |
| `PGRST_LOG_LEVEL` | Logging level. Allowed values: `crit`, `error`, `warn`, `info`, `debug`. | No | No | Default: `error` |
| `PGRST_LOG_QUERY` | Logs the SQL query for each request at the current log level. | No | No | Default: `false` |
| `PGRST_MAX_ROWS` | Deprecated alias for `PGRST_DB_MAX_ROWS`. | No | No | Deprecated; use `PGRST_DB_MAX_ROWS` |
| `PGRST_OPENAPI_MODE` | Controls OpenAPI output. Allowed values: `follow-privileges`, `ignore-privileges`, `disabled`. | No | No | Default: `follow-privileges` |
| `PGRST_OPENAPI_SECURITY_ACTIVE` | Includes security definitions in the OpenAPI output. | No | No | Default: `false` |
| `PGRST_OPENAPI_SERVER_PROXY_URI` | Overrides the base URL in the OpenAPI self-documentation (useful behind a proxy). | No | No | No default |
| `PGRST_PRE_REQUEST` | Deprecated alias for `PGRST_DB_PRE_REQUEST`. | No | No | Deprecated; use `PGRST_DB_PRE_REQUEST` |
| `PGRST_ROLE_CLAIM_KEY` | Deprecated alias for `PGRST_JWT_ROLE_CLAIM_KEY`. | No | No | Deprecated; use `PGRST_JWT_ROLE_CLAIM_KEY` |
| `PGRST_ROOT_SPEC` | Deprecated alias for `PGRST_DB_ROOT_SPEC`. | No | No | Deprecated; use `PGRST_DB_ROOT_SPEC` |
| `PGRST_SECRET_IS_BASE64` | Deprecated alias for `PGRST_JWT_SECRET_IS_BASE64`. | No | No | Deprecated; use `PGRST_JWT_SECRET_IS_BASE64` |
| `PGRST_SERVER_CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins. When empty or unset, all origins are accepted. | No | No | No default |
| `PGRST_SERVER_HOST` | Address the PostgREST web server binds to. Special values: `*`, `*4`, `!4`, `*6`, `!6`. | No | No | Default: `!4` |
| `PGRST_SERVER_PORT` | TCP port the PostgREST web server binds to. Use `0` to auto-assign. | No | No | Default: `3000` |
| `PGRST_SERVER_TIMING_ENABLED` | Enables the `Server-Timing` HTTP response header. | No | No | Default: `false` |
| `PGRST_SERVER_TRACE_HEADER` | HTTP header name used to trace requests (e.g. `X-Request-Id`). | No | No | No default |
| `PGRST_SERVER_UNIX_SOCKET` | Path to a Unix domain socket the server binds to. Takes precedence over `PGRST_SERVER_PORT` when set. | No | No | No default |
| `PGRST_SERVER_UNIX_SOCKET_MODE` | Octal file mode applied to the Unix socket. Must be between `600` and `777`. | No | No | Default: `660` |

---

## Realtime

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `API_JWT_JWKS` | JWKS JSON used to verify tenant JWTs during self-host seeding. Read by `priv/repo/seeds.exs` and `priv/repo/dev_seeds.exs`. | Yes | Yes | Used only by the seed script (`SEED_SELF_HOST=true`). Commented out in the default docker-compose. |
| `API_JWT_SECRET` | Symmetric HS256 secret used to sign tokens for the tenant management API and the default self-host tenant. | Yes | Yes | Required for the tenant management API in production. |
| `API_TOKEN_BLOCKLIST` | Comma-separated list of tokens blocked from tenant management API access. | No | No | Default: empty list. |
| `APP_NAME` | Application/node name. Used to build the Phoenix endpoint URL host, libcluster DNS basename, and Erlang `RELEASE_NODE`. | Yes | Yes | Required - raises `APP_NAME not available` if empty. Default: empty (build) / `realtime` (Erlang release script). |
| `BROADCAST_POOL_SIZE` | Number of processes used to relay Phoenix.PubSub messages across the cluster. | No | No | Default: `10`. |
| `CHANNEL_ERROR_BACKOFF_MS` | Delay (ms) before returning a channel join error to the client. Slows down reconnect storms. | No | No | Default: `5000` (5 seconds). |
| `CLIENT_PRESENCE_MAX_CALLS` | Maximum presence calls allowed per client (per WebSocket) within the time window. | No | No | Default: `5`. |
| `CLIENT_PRESENCE_WINDOW_MS` | Time window (ms) for per-client presence rate limiting. | No | No | Default: `30000`. |
| `CLUSTER` | Cluster name added to log metadata. | No | No | No default. Read by `Realtime.Application.start/2`. |
| `CLUSTER_SECRET_ID` | AWS Secrets Manager secret ID holding the cluster CA cert/key. | No | No | Used by `run.sh` `generate_certs` when `GENERATE_CLUSTER_CERTS` is set. |
| `CLUSTER_SECRET_REGION` | AWS region for `CLUSTER_SECRET_ID`. | No | No | Used by `run.sh` `generate_certs` when `GENERATE_CLUSTER_CERTS` is set. |
| `CLUSTER_STRATEGIES` | Comma-separated list of libcluster backends to enable. Supported: `EPMD`, `DNS`, `POSTGRES`. | No | No | Default: `POSTGRES` (??), `EPMD` otherwise. |
| `CONNECT_ERROR_BACKOFF_MS` | Delay (ms) before returning a WebSocket connection error to the client. | No | No | Default: `2000` (2 seconds). |
| `CONNECT_PARTITION_SLOTS` | Number of dynamic supervisor partitions for the `Connect` / `ReplicationConnect` processes. | No | No | Default: `System.schedulers_online() * 2`. |
| `DASHBOARD_AUTH` | Authentication method for the admin dashboard (`/admin`). Accepted: `basic_auth`, `zta`. | No | No | Default: `basic_auth`. |
| `DASHBOARD_PASSWORD` | Password for admin dashboard basic auth. | No | No | Default: random hex string generated at boot. |
| `DASHBOARD_USER` | Username for admin dashboard basic auth. | No | No | Default: random hex string generated at boot. |
| `DB_AFTER_CONNECT_QUERY` | SQL query executed after every Postgres connection is established. | Yes | Yes | No default. Self-host sets `SET search_path TO _realtime`. |
| `DB_ENC_KEY` | Key used to encrypt sensitive fields in the `_realtime.tenants` and `_realtime.extensions` tables. | Yes | Yes | Recommended: 16 characters. Required (consumed as `db_enc_key` by the app config). |
| `DB_HOST` | Primary Postgres host. | Yes | Yes | Default: `127.0.0.1`. |
| `DB_IP_VERSION` | Forces the IP version for Postgres connections. Accepted: `ipv4`, `ipv6`. | No | No | When unset, IP version is auto-detected from `DB_HOST`. |
| `DB_MASTER_REGION` | Overrides the primary region for region-aware routing and tenant placement. | No | No | When unset, the current `REGION` is used. |
| `DB_NAME` | Postgres database name. | Yes | Yes | Default: `postgres`. |
| `DB_PASSWORD` | Postgres password. | Yes | Yes | Default: `postgres`. |
| `DB_POOL_SIZE` | Number of connections in the primary Postgres pool. | No | No | Default: `5`. |
| `DB_PORT` | Postgres port. | Yes | Yes | Default: `5432`. |
| `DB_QUEUE_INTERVAL` | Ecto pool queue interval in ms. | No | No | Default: `5000`. |
| `DB_QUEUE_TARGET` | Ecto pool queue target in ms. | No | No | Default: `5000`. |
| `DB_REPLICA_HOST` | Hostname for the main replica Postgres pool. | No | No | When set, enables the `Realtime.Repo.Replica` connection pool. |
| `DB_REPLICA_POOL_SIZE` | Number of connections in the replica pool(s). | No | No | Default: `5`. |
| `DB_SSL` | Enable SSL for Postgres connections. | No | No | Default: `false`. Accepts `true`/`false`/`1`/`0`. |
| `DB_SSL_CA_CERT` | Path to a CA trust store used when `DB_SSL=true`. Enables server certificate verification. | No | No | When unset and `DB_SSL=true`, falls back to `verify: :verify_none`. |
| `DB_USER` | Postgres user. | Yes | Yes | Default: `supabase_admin`. |
| `DISABLE_HEALTHCHECK_LOGGING` | Disables request logging for `/healthcheck` and `/api/tenants/:tenant_id/health`. | No | Yes | Default: `false`. |
| `DNS_NODES` | DNS query used by the libcluster `DNS` strategy. | Yes | Yes | No default. Only consulted when `CLUSTER_STRATEGIES` contains `DNS`. |
| `HTTP_DYNAMIC_BUFFER_MAX` | Maximum buffer size (bytes) for HTTP connections (Cowboy dynamic buffer). | No | No | Must be set together with `HTTP_DYNAMIC_BUFFER_MIN`. |
| `HTTP_DYNAMIC_BUFFER_MIN` | Minimum buffer size (bytes) for HTTP connections (Cowboy dynamic buffer). | No | No | Must be set together with `HTTP_DYNAMIC_BUFFER_MAX`. |
| `JANITOR_CHILDREN_TIMEOUT` | Timeout (ms) for each janitor child task. | No | No | Default: `5000`. Only used when `RUN_JANITOR=true`. |
| `JANITOR_CHUNK_SIZE` | Number of tenants processed per chunk per janitor task. | No | No | Default: `10`. |
| `JANITOR_MAX_CHILDREN` | Maximum number of concurrent janitor task children. | No | No | Default: `5`. |
| `JANITOR_RUN_AFTER_IN_MS` | Delay (ms) before the janitor first runs after boot. | No | No | Default: 10 minutes. |
| `JANITOR_SCHEDULE_RANDOMIZE` | Add a random offset to the janitor schedule. | No | No | Default: `true`. |
| `JANITOR_SCHEDULE_TIMER_IN_MS` | Interval (ms) between janitor runs. | No | No | Default: 4 hours. |
| `JWT_CLAIM_VALIDATORS` | JSON object of claim validators applied to incoming JWTs (e.g. `{"iss":"Issuer"}`). | No | No | Default: `{}`. Must be valid JSON object or boot fails. |
| `LOG_LEVEL` | Logger level. One of `info`, `emergency`, `alert`, `critical`, `error`, `warning`, `notice`, `debug`. | No | No | Default: `info`. |
| `LOG_THROTTLE_JANITOR_INTERVAL_IN_MS` | Cachex expiration interval (ms) for the log-throttle cache. | No | No | Default: 10 minutes. |
| `LOGFLARE_API_KEY` | Logflare API key. | No | No | Required when `LOGS_ENGINE=logflare`. |
| `LOGFLARE_LOGGER_BACKEND_URL` | Endpoint for the Logflare logger backend. | No | No | Default: `https://api.logflare.app`. |
| `LOGFLARE_SOURCE_ID` | Logflare source ID. | No | No | Required when `LOGS_ENGINE=logflare`. |
| `LOGS_ENGINE` | Log backend selector. Set to `logflare` to enable the Logflare HTTP backend. | No | No | When unset, standard logger output is used. |
| `MAX_CONNECTIONS` | Soft maximum number of WebSocket connections. | No | No | Default: `1000`. |
| `MAX_HEADER_LENGTH` | Maximum HTTP header value length (bytes). | Yes | No | Default: `4096`. |
| `METRICS_CLEANER_SCHEDULE_TIMER_IN_MS` | Interval (ms) between metrics cleaner runs. | No | No | Default: 30 minutes. |
| `METRICS_JWT_SECRET` | Secret used to sign JWTs for the metrics endpoints. | Yes | Yes | Required - the app raises an exception if unset. |
| `METRICS_PUSHER_AUTH` | Password used for Basic auth on metrics pushes. Used together with `METRICS_PUSHER_USER`. | No | No | When unset, requests are sent without authorization. |
| `METRICS_PUSHER_COMPRESS` | Enable gzip compression for metrics payloads. | No | No | Default: `true`. |
| `METRICS_PUSHER_ENABLED` | Enable periodic push of Prometheus metrics. | No | No | Default: `false`. Requires `METRICS_PUSHER_URL`. |
| `METRICS_PUSHER_EXTRA_LABELS` | Comma-separated `key=value` pairs appended as `extra_label` query parameters on every push. | No | No | Default: empty. |
| `METRICS_PUSHER_INTERVAL_MS` | Interval (ms) between metrics pushes. | No | No | Default: 30 seconds. |
| `METRICS_PUSHER_TIMEOUT_MS` | HTTP timeout (ms) for metrics push requests. | No | No | Default: 15 seconds. |
| `METRICS_PUSHER_URL` | Full URL endpoint to push metrics in Prometheus exposition format. | No | No | Required when `METRICS_PUSHER_ENABLED=true`. |
| `METRICS_PUSHER_USER` | Username used for Basic auth on metrics pushes. | No | No | Default: `realtime`. |
| `METRICS_RPC_TIMEOUT_IN_MS` | Timeout (ms) for RPC calls that fetch metrics from other nodes. | No | No | Default: 15 seconds. |
| `METRICS_TOKEN_BLOCKLIST` | Comma-separated list of tokens blocked from accessing the metrics endpoints. | No | No | Default: empty list. |
| `PORT` | HTTP listener port. | Yes | Yes | Default: `4000`. |
| `PROM_POLL_RATE` | Poll interval (ms) for PromEx metrics collection. | No | No | Default: `5000`. |
| `REALTIME_IP_VERSION` | Forces the HTTP listener IP version. Accepted: `ipv4`, `ipv6`. | No | No | When unset, IPv6 is preferred when available. |
| `REBALANCE_CHECK_INTERVAL_IN_MS` | Interval (ms) used to check whether a process is in the right region. | No | No | Default: 10 minutes. |
| `REGION` | Region name for the current node. Used in logs, latency reporting, and region-aware routing. | No | No | No default. Also rendered in the admin dashboard layout. |
| `REGION_MAPPING` | Custom mapping of platform regions to tenant regions, as a JSON object with string keys and values. | No | No | When unset, the hardcoded default mapping is used. Must be a JSON object or boot fails. |
| `REQUEST_ID_BAGGAGE_KEY` | OTEL Baggage key used as the request ID. | No | No | Default: `request-id`. |
| `RPC_TIMEOUT` | Timeout (ms) for generic RPC calls. | No | No | Default: 30 seconds. |
| `RUN_JANITOR` | Enable the tenant janitor and metrics cleaner tasks. | Yes | Yes | Default: `false`.|
| `SECRET_KEY_BASE` | Secret used by Phoenix to sign cookies and tokens. | Yes | Yes | Required - recommended length: 64 characters. |
| `SEED_SELF_HOST` | If `true`, `run.sh` runs `Realtime.Release.seeds/1` to create the default tenant. | Yes | Yes | Default: not set (no seeding). Self-host enables this on first boot. |
| `SELF_HOST_TENANT_NAME` | Tenant external_id used by the self-host seed script. | No | No | Default: `realtime-dev`. Must be URL-safe. |
| `SLOT_NAME_SUFFIX` | Suffix appended to the default replication slot name `supabase_realtime_replication_slot`. | Yes | No | Allowed: lowercase letters, numbers, underscore. Combined name must be 64 characters or fewer. |
| `TENANT_CACHE_EXPIRATION_IN_MS` | TTL (ms) for the in-process tenant cache. | No | No | Default: 30 seconds. |
| `TENANT_MAX_BYTES_PER_SECOND` | Default per-tenant maximum bytes per second (used when a tenant is first created). | No | No | Default: `100000`. |
| `TENANT_MAX_CHANNELS_PER_CLIENT` | Default per-tenant maximum channels per client. | No | No | Default: `100`. |
| `TENANT_MAX_CONCURRENT_USERS` | Default per-tenant maximum concurrent users per channel. | No | No | Default: `200`. |
| `TENANT_MAX_EVENTS_PER_SECOND` | Default per-tenant maximum events per second. | No | No | Default: `100`. |
| `TENANT_MAX_JOINS_PER_SECOND` | Default per-tenant maximum channel joins per second. | No | No | Default: `100`. |
| `USERS_SCOPE_SHARDS` | Number of partitions used by the Beacon `users` scope. | No | No | Default: `5`. |
| `WEBSOCKET_MAX_HEAP_SIZE` | Maximum heap (bytes) for each WebSocket transport process; the process is killed if exceeded. | No | No | Default: `50000000` (50 MB). |

---

## Storage

### Server

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `ADMIN_API_KEYS` | Comma-separated API keys accepted on the admin port. Legacy alias for `SERVER_ADMIN_API_KEYS`. | No | No | Default: empty |
| `ADMIN_PORT` | Port the admin HTTP server listens on. Legacy alias for `SERVER_ADMIN_PORT`. | No | No | Default: `5001` |
| `EXPOSE_DOCS` | Expose `/docs` Swagger UI. | No | No | Default: `true` |
| `HOST` | Host the public server binds to. Legacy alias for `SERVER_HOST`. | No | No | Default: `0.0.0.0` |
| `NODE_ENV` | Node.js runtime mode. When `production`, sets `isProduction` and forces HTTPS in TUS link generation. | No | No | Default: unset |
| `PORT` | Port the public HTTP server listens on. Legacy alias for `SERVER_PORT`. | No | No | Default: `5000` |
| `PROJECT_REF` | Single-tenant project reference; used as `tenantId` when set. | No | No | Optional (single-tenant) |
| `REGION` | Region label exposed in responses and used as fallback for `STORAGE_S3_REGION` / `SERVER_REGION`. | No | Yes | Default: `not-specified` |
| `REQUEST_ADMIN_TRACE_HEADER` | Header carrying the admin request trace id. Legacy fallback for `REQUEST_TRACE_HEADER`. | No | No | Optional |
| `REQUEST_ALLOW_X_FORWARDED_PATH` | Honor the `X-Forwarded-Path` header when computing public URLs. | No | Yes | Default: `false` |
| `REQUEST_ETAG_HEADERS` | Comma-separated list of request headers that carry an ETag for conditional GETs. | No | No | Default: `if-none-match` |
| `REQUEST_ID_HEADER` | Legacy alias for `REQUEST_TRACE_HEADER`. | No | No | Optional |
| `REQUEST_TRACE_HEADER` | Header name used to propagate the request trace id. | No | No | Default: unset |
| `REQUEST_URL_LENGTH_LIMIT` | Maximum object key URL length. | No | No | Default: `7500` |
| `REQUEST_X_FORWARDED_HOST_REGEXP` | Regex applied to `X-Forwarded-Host` to derive the tenant id. | No | No | Optional |
| `RESPONSE_S_MAXAGE` | `s-maxage` (CDN) cache lifetime added to public responses (seconds). | No | No | Default: `0` |
| `SERVER_ADMIN_API_KEYS` | Comma-separated API keys accepted on the admin port. | No | No | Default: empty |
| `SERVER_ADMIN_PORT` | Port the admin HTTP server listens on. | No | No | Default: `5001` |
| `SERVER_HEADERS_TIMEOUT` | Node `headersTimeout` (seconds) for the HTTP server. | No | No | Default: `65` |
| `SERVER_HOST` | Host the public server binds to. | No | No | Default: `0.0.0.0` |
| `SERVER_KEEP_ALIVE_TIMEOUT` | Node `keepAliveTimeout` (seconds) for the HTTP server. | No | No | Default: `61` |
| `SERVER_PORT` | Port the public HTTP server listens on. | No | No | Default: `5000` |
| `SERVER_REGION` | Region label exposed in responses; falls back to `REGION`. | No | No | Default: `not-specified` |
| `STORAGE_PUBLIC_URL` | Public base URL prepended to generated object URLs. | No | Yes | Optional |
| `TENANT_ID` | Single-tenant tenant id (fallback after `PROJECT_REF`). | No | Yes | Default: `storage-single-tenant` |
| `URL_LENGTH_LIMIT` | Legacy alias for `REQUEST_URL_LENGTH_LIMIT`. | No | No | Default: `7500` |
| `VERSION` | Build version reported in logs and the default DB application name. | No | No | Default: `0.0.0` |
| `WORKERS_NUM` | Number of cluster workers to spawn. | No | No | Default: `1` |
| `X_FORWARDED_HOST_REGEXP` | Legacy alias for `REQUEST_X_FORWARDED_HOST_REGEXP`. | No | No | Optional |

### Database

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `DATABASE_APPLICATION_NAME` | Postgres `application_name` for the API connection pool. | No | No | Default: `Supabase Storage API ${VERSION}` |
| `DATABASE_CONNECTION_TIMEOUT` | Postgres connection acquire timeout (ms). | No | No | Default: `3000` |
| `DATABASE_ENABLE_QUERY_CANCELLATION` | Issue a Postgres cancel on request abort. | No | No | Default: `false` |
| `DATABASE_FREE_POOL_AFTER_INACTIVITY` | Time (ms) after which an idle tenant pool is released. | No | No | Default: `60000` |
| `DATABASE_MAX_CONNECTIONS` | Max connections per tenant pool. Ignored when `DATABASE_POOL_URL` is set. | No | No | Default: `20` |
| `DATABASE_POOL_MODE` | `single_use` or `recycle`. | No | No | Optional |
| `DATABASE_POOL_URL` | External pooler (Supavisor/PgBouncer) connection string. When set, `DATABASE_MAX_CONNECTIONS` is ignored. | No | No | Optional |
| `DATABASE_POSTGRES_VERSION` | Override the detected Postgres version string. | No | No | Optional |
| `DATABASE_SEARCH_PATH` | Comma-separated `search_path` prepended to every session. | No | No | Default: empty |
| `DATABASE_SSL_ROOT_CERT` | PEM bundle used to verify the Postgres server certificate. | No | No | Optional |
| `DATABASE_STATEMENT_TIMEOUT` | Postgres `statement_timeout` (ms) applied per session. | No | No | Default: `30000` |
| `DATABASE_URL` | Primary Postgres connection string used by the API. | Yes | Yes | Required (single-tenant) |
| `DB_ALLOW_MIGRATION_REFRESH` | Allow refreshing migration hashes when the hash recorded in the DB diverges. | No | No | Default: `true` |
| `DB_ANON_ROLE` | Postgres role used when authenticating as anonymous. | No | No | Default: `anon` |
| `DB_AUTHENTICATED_ROLE` | Postgres role used for authenticated requests. | No | No | Default: `authenticated` |
| `DB_INSTALL_ROLES` | Run role install migrations on boot. | No | No | Default: `false` |
| `DB_MIGRATIONS_FREEZE_AT` | Stop applying migrations after the named migration. | Yes | No | Optional |
| `DB_SEARCH_PATH` | Legacy alias for `DATABASE_SEARCH_PATH`. | No | No | Default: empty |
| `DB_SERVICE_ROLE` | Postgres role used by the service-role key. | No | No | Default: `service_role` |
| `DB_SUPER_USER` | Postgres superuser used for migrations. | No | No | Default: `postgres` |
| `TENANT_POOL_CACHE_HIT_LOG_SAMPLE_RATE` | Sample rate (0-1) for logging tenant-pool cache hits. | No | No | Default: `0` |
| `TENANT_POOL_CACHE_MISS_LOG_SAMPLE_RATE` | Sample rate (0-1) for logging tenant-pool cache misses. | No | No | Default: `0` |
| `TENANT_POOL_CACHE_TTL_MS` | TTL (ms) for the per-tenant connection-pool cache. | No | No | Default: `10000` |

### JWT

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `AUTH_JWT_ALGORITHM` | JWT algorithm used to verify tokens. | No | No | Default: `HS256` |
| `AUTH_JWT_SECRET` | HS256 secret used to verify the legacy `ANON_KEY` / `SERVICE_KEY`. | Yes | Yes | Required (single-tenant) |
| `JWT_CACHING_ENABLED` | Cache decoded JWTs in memory to reduce verification cost. | No | No | Default: `false` |
| `JWT_JWKS` | JSON Web Key Set used to verify asymmetric JWTs (e.g. ES256). | Yes | Yes | Optional |
| `PGRST_JWT_ALGORITHM` | Legacy alias for `AUTH_JWT_ALGORITHM`. | No | No | Default: `HS256` |
| `PGRST_JWT_SECRET` | Legacy alias for `AUTH_JWT_SECRET`. | No | No | Required (single-tenant) |

### Auth

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `ANON_KEY` | Anon JWT served to public clients. Auto-generated from `AUTH_JWT_SECRET` when blank in single-tenant mode. | Yes | Yes | Required for self-hosted single-tenant |
| `SERVICE_KEY` | Service-role JWT. Auto-generated from `AUTH_JWT_SECRET` when blank in single-tenant mode. | Yes | Yes | Required for self-hosted single-tenant |

### S3 backend

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `AWS_ACCESS_KEY_ID` | AWS access key id consumed by the AWS SDK to sign S3 requests. | No | Yes | Required when `STORAGE_BACKEND=s3` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key consumed by the AWS SDK to sign S3 requests. | No | Yes | Required when `STORAGE_BACKEND=s3` |
| `GLOBAL_S3_BUCKET` | Legacy alias for `STORAGE_S3_BUCKET`. | Yes | Yes | Required when `STORAGE_BACKEND=s3` |
| `GLOBAL_S3_ENDPOINT` | Legacy alias for `STORAGE_S3_ENDPOINT`. | No | Yes | Optional |
| `GLOBAL_S3_FORCE_PATH_STYLE` | Legacy alias for `STORAGE_S3_FORCE_PATH_STYLE`. | No | Yes | Default: `false` |
| `GLOBAL_S3_MAX_SOCKETS` | Legacy alias for `STORAGE_S3_MAX_SOCKETS`. | No | No | Default: `200` |
| `GLOBAL_S3_PRIVATE_ASSET_ENDPOINT` | Legacy alias for `STORAGE_S3_PRIVATE_ASSET_ENDPOINT`. | No | No | Optional |
| `S3_ALLOW_FORWARDED_HEADER` | Honor the `Forwarded` header when reconstructing canonical request URLs for SigV4. | No | No | Default: `false` |
| `S3_PROTOCOL_ACCESS_KEY_ID` | Static SigV4 access key id (single-tenant). | Yes | Yes | Optional |
| `S3_PROTOCOL_ACCESS_KEY_SECRET` | Static SigV4 secret (single-tenant). | Yes | Yes | Optional |
| `S3_PROTOCOL_ENABLED` | Enable the S3-compatible API. | Yes | No | Default: `true` |
| `S3_PROTOCOL_ENFORCE_REGION` | Reject SigV4 requests whose region does not match `STORAGE_S3_REGION`. | No | No | Default: `false` |
| `S3_PROTOCOL_NON_CANONICAL_HOST_HEADER` | Override host used during SigV4 canonicalization. | No | No | Optional |
| `S3_PROTOCOL_PREFIX` | URL prefix mounted in front of the S3 protocol routes. | Yes | No | Default: empty |
| `STORAGE_BACKEND` | Object backend driver: `s3` or `file`. | Yes | Yes | Default: `file` (compose) / unset (code) |
| `STORAGE_EMPTY_BUCKET_MAX` | Max objects deletable in a single empty-bucket call. | No | No | Default: `200000` |
| `STORAGE_S3_BUCKET` | Bucket name used by the S3 backend. | No | No | Required when `STORAGE_BACKEND=s3` |
| `STORAGE_S3_CLIENT_TIMEOUT` | Per-request timeout (ms) for S3 SDK calls; `0` disables. | No | No | Default: `0` |
| `STORAGE_S3_DISABLE_CHECKSUM` | Disable S3 SDK request checksums. | No | No | Default: `false` |
| `STORAGE_S3_ENABLED_METRICS` | Enable internal S3 client tracing/metrics. | No | No | Default: `false` |
| `STORAGE_S3_ENDPOINT` | Custom S3 endpoint (e.g. MinIO). | No | No | Optional |
| `STORAGE_S3_FORCE_PATH_STYLE` | Use path-style S3 addressing. | No | No | Default: `false` |
| `STORAGE_S3_MAX_SOCKETS` | Max concurrent sockets for the S3 HTTP agent. | No | No | Default: `200` |
| `STORAGE_S3_PRIVATE_ASSET_ENDPOINT` | Endpoint used only when signing private source URLs for internal consumers (e.g. imgproxy). | No | No | Optional |
| `STORAGE_S3_REGION` | AWS region for the S3 backend; falls back to `REGION`. | Yes | No | Required when `STORAGE_BACKEND=s3` |
| `STORAGE_S3_UPLOAD_QUEUE_SIZE` | Concurrent part uploads per multipart object. | No | No | Default: `2` |

### File backend

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `FILE_STORAGE_BACKEND_PATH` | Legacy alias for `STORAGE_FILE_BACKEND_PATH`. | Yes | Yes | Required when `STORAGE_BACKEND=file` |
| `STORAGE_FILE_BACKEND_PATH` | Filesystem directory used by the `file` backend. | No | No | Required when `STORAGE_BACKEND=file` |
| `STORAGE_FILE_ETAG_ALGORITHM` | ETag algorithm for the `file` backend: `md5` or `mtime`. | No | No | Default: `md5` |

### Image transformation

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `ENABLE_IMAGE_TRANSFORMATION` | Legacy alias for `IMAGE_TRANSFORMATION_ENABLED`. | Yes | Yes | Default: `false` |
| `IMAGE_TRANSFORMATION_ENABLED` | Enable image rendering via imgproxy. | No | No | Default: `false` |
| `IMAGE_TRANSFORMATION_LIMIT_MAX_SIZE` | Max requested dimension (px) for transformations. | No | No | Default: `2000` |
| `IMAGE_TRANSFORMATION_LIMIT_MIN_SIZE` | Min requested dimension (px) for transformations. | No | No | Default: `1` |
| `IMGPROXY_HTTP_KEEP_ALIVE_TIMEOUT` | Keep-alive timeout (seconds) for the imgproxy HTTP agent. | No | No | Default: `61` |
| `IMGPROXY_HTTP_MAX_SOCKETS` | Max concurrent sockets for the imgproxy HTTP agent. | No | No | Default: `5000` |
| `IMGPROXY_REQUEST_TIMEOUT` | Request timeout (seconds) for imgproxy calls. | No | No | Default: `15` |
| `IMGPROXY_URL` | imgproxy base URL. | Yes | Yes | Required when image transformation is enabled |
| `IMG_LIMITS_MAX_SIZE` | Legacy alias for `IMAGE_TRANSFORMATION_LIMIT_MAX_SIZE`. | No | No | Default: `2000` |
| `IMG_LIMITS_MIN_SIZE` | Legacy alias for `IMAGE_TRANSFORMATION_LIMIT_MIN_SIZE`. | No | No | Default: `1` |

### Upload limits

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `FILE_SIZE_LIMIT` | Legacy alias for `UPLOAD_FILE_SIZE_LIMIT`. | Yes | Yes | Required |
| `FILE_SIZE_LIMIT_STANDARD_UPLOAD` | Legacy alias for `UPLOAD_FILE_SIZE_LIMIT_STANDARD`. | No | No | Default: `0` (disabled) |
| `SIGNED_UPLOAD_URL_EXPIRATION_TIME` | Legacy alias for `UPLOAD_SIGNED_URL_EXPIRATION_TIME`. | Yes | No | Default: `60` |
| `TUS_ALLOW_S3_TAGS` | Propagate user metadata as S3 tags during TUS uploads. | No | No | Default: `true` |
| `TUS_LOCK_TYPE` | TUS upload lock backend: `postgres` or `s3`. | No | No | Default: `postgres` |
| `TUS_MAX_CONCURRENT_UPLOADS` | Max concurrent TUS upload sessions. | No | No | Default: `500` |
| `TUS_PART_SIZE` | TUS multipart part size (MB). | No | No | Default: `50` |
| `TUS_URL_EXPIRY_MS` | TUS upload-URL expiry (ms). | No | No | Default: `3600000` (1h) |
| `TUS_URL_PATH` | Path mount for TUS resumable uploads. | Yes | No | Default: `/upload/resumable` |
| `TUS_USE_FILE_VERSION_SEPARATOR` | Include the object version in TUS storage keys. | No | No | Default: `false` |
| `UPLOAD_FILE_SIZE_LIMIT` | Max upload size in bytes. | Yes | No | Required |
| `UPLOAD_FILE_SIZE_LIMIT_STANDARD` | Max size in bytes for non-resumable uploads. | Yes | No | Default: `0` (disabled) |
| `UPLOAD_SIGNED_URL_EXPIRATION_TIME` | Default lifetime (seconds) of signed upload URLs. | No | No | Default: `60` |

### Rate limiting

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `ENABLE_RATE_LIMITER` | Legacy alias for `RATE_LIMITER_ENABLED`. | No | No | Default: `false` |
| `RATE_LIMITER_DRIVER` | Rate limiter backend: `memory` or `redis`. | No | No | Default: `memory` |
| `RATE_LIMITER_ENABLED` | Enable the image-transformation rate limiter. | No | No | Default: `false` |
| `RATE_LIMITER_REDIS_COMMAND_TIMEOUT` | Per-command timeout (seconds) when using the Redis driver. | No | No | Default: `2` |
| `RATE_LIMITER_REDIS_CONNECT_TIMEOUT` | Connect timeout (seconds) when using the Redis driver. | No | No | Default: `2` |
| `RATE_LIMITER_REDIS_URL` | Redis connection URL. | No | No | Required when `RATE_LIMITER_DRIVER=redis` |
| `RATE_LIMITER_RENDER_PATH_MAX_REQ_SEC` | Max requests per second on render paths. | No | No | Default: `5` |
| `RATE_LIMITER_SKIP_ON_ERROR` | Allow requests through when the rate limiter errors. | No | No | Default: `false` |

### Webhook

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `WEBHOOK_API_KEY` | Bearer key sent with outbound webhooks. | No | No | Optional |
| `WEBHOOK_QUEUE_PULL_INTERVAL` | Polling interval (ms) for the webhook queue. | No | No | Default: `700` |
| `WEBHOOK_URL` | Endpoint that receives object events. | No | No | Optional |

### Logging

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `LOGFLARE_API_KEY` | Logflare ingest API key. | No | No | Required when `LOGFLARE_ENABLED=true` |
| `LOGFLARE_BATCH_SIZE` | Max records per Logflare batch. | No | No | Default: `200` |
| `LOGFLARE_ENABLED` | Forward logs to Logflare. | No | No | Default: `false` |
| `LOGFLARE_SOURCE_TOKEN` | Logflare source identifier. | No | No | Required when `LOGFLARE_ENABLED=true` |
| `LOG_LEVEL` | pino log level. | No | No | Default: `info` |
| `METRICS_DISABLED` | Comma-separated list of metric names (or `all`) to drop. | No | No | Optional |
| `OTEL_EXPORTER_OTLP_COMPRESSION` | OTLP exporter compression algorithm (`gzip`, `none`). | No | No | Optional |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP endpoint used when a metrics-specific endpoint is not set. | No | No | Optional |
| `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` | OTLP endpoint for metrics export. | No | No | Optional |
| `OTEL_EXPORTER_OTLP_METRICS_HEADERS` | Comma-separated `k=v` headers attached to OTLP metric requests. | No | No | Optional |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | OTLP endpoint for trace export. | No | No | Optional |
| `OTEL_EXPORTER_OTLP_TRACES_HEADERS` | Comma-separated `k=v` headers attached to OTLP trace requests. | No | No | Optional |
| `OTEL_METRICS_ENABLED` | Enable the OpenTelemetry metrics SDK. | No | No | Default: `false` |
| `OTEL_METRICS_EXPORT_INTERVAL_MS` | OTLP metrics export interval (ms). | No | No | Default: `60000` |
| `OTEL_METRICS_TEMPORALITY` | OTLP metrics temporality: `DELTA` or `CUMULATIVE`. | No | No | Default: `CUMULATIVE` |
| `PROMETHEUS_METRICS_ENABLED` | Expose Prometheus metrics on the admin port. | No | No | Default: `false` |
| `PROMETHEUS_METRICS_INCLUDE_TENANT` | Include the tenant id label on Prometheus metrics. | No | No | Default: `false` |
| `TRACING_ENABLED` | Enable OpenTelemetry tracing. | No | No | Default: `false` |
| `TRACING_FEATURE_UPLOAD` | Emit detailed spans for the upload pipeline. | No | No | Default: `false` |
| `TRACING_MODE` | Tracing verbosity, e.g. `basic`, `debug`. | No | No | Default: `basic` |
| `TRACING_RETURN_SERVER_TIMINGS` | Return `Server-Timing` response headers. | No | No | Default: `false` |
| `TRACING_SERVER_TIME_MIN_DURATION` | Min span duration (ms) before it is reported in `Server-Timing`. | No | No | Default: `100.0` |

### Tenant features (Vector)

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `VECTOR_BUCKET_REGION` | AWS region for vector buckets. | No | No | Optional |
| `VECTOR_ENABLED` | Enable vector bucket support. | No | No | Default: `false` |
| `VECTOR_MAX_BUCKETS` | Max vector buckets per tenant. | No | No | Default: `10` |
| `VECTOR_MAX_INDEXES` | Max indexes per vector bucket. | No | No | Default: `20` |
| `VECTOR_S3_BUCKETS` | Comma-separated list of S3 buckets backing vector indexes. | No | No | Optional |

### Other (tooling)

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `ADMIN_API_KEY` | API key used by the bundled `pprof-client` script. | No | No | Optional (tooling) |
| `ADMIN_URL` | Admin server URL used by the bundled `pprof-client` script. | No | No | Optional (tooling) |
| `FLAME_SOURCEMAPS_DIRS` | Sourcemap directories used by the flamegraph tool. | No | No | Default: `dist` |
| `PPROF_FLAME_MD_FORMAT` | Markdown format flag for the pprof flamegraph script. | No | No | Optional (tooling) |
| `PPROF_GENERATE_FLAME` | Generate a flamegraph from a captured pprof profile. | No | No | Optional (tooling) |
| `PPROF_NODE_MODULES_SOURCE_MAPS` | Include `node_modules` sourcemaps in flame output. | No | No | Optional (tooling) |
| `PPROF_OUTPUT` | Output path for the pprof script. | No | No | Optional (tooling) |
| `PPROF_SECONDS` | Profile duration (seconds) for the pprof script. | No | No | Optional (tooling) |
| `PPROF_SOURCE_MAPS` | Use sourcemaps when symbolicating pprof output. | No | No | Optional (tooling) |
| `PPROF_WORKER_ID` | Worker id targeted by the pprof script. | No | No | Optional (tooling) |

---

## Edge Functions

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `ALL_PROXY` / `all_proxy` | Default outbound proxy for all schemes for `fetch()` from user functions. | No | No | Read by `vendor/deno_fetch/proxy.rs` |
| `DENO_AUTH_TOKENS` | Authentication tokens used when fetching remote modules (`<token>@<host>` syntax). | No | No | Read by `deno/file_fetcher.rs` |
| `DENO_CERT` | Path to a PEM file with extra CA certificates loaded into Deno's TLS store. | No | No | Read by `ext/runtime/cert.rs` |
| `DENO_DIR` | Override location of Deno's module/transpile cache directory. | No | No | Defaults to OS cache dir + `/deno` |
| `DENO_DISABLE_PEDANTIC_NODE_WARNINGS` | Suppress pedantic Node.js compatibility warnings. | No | No | Read by `deno/args/mod.rs` |
| `DENO_FETCH_TIMEOUT_SECS` | Timeout (seconds) for HTTP fetches made by the runtime when resolving/downloading modules. | No | No | No default |
| `DENO_NO_DEPRECATION_WARNINGS` | Disable Deno API deprecation warnings. | No | No | Read at startup via `cli/src/env.rs` |
| `DENO_NO_PACKAGE_JSON` | Disable auto-discovery of `package.json`. | No | No | Read by `deno/lib.rs` (set to `1`) |
| `DENO_REPL_HISTORY` | REPL history file path (REPL isn't exposed by edge-runtime, but the var is read by embedded Deno). | No | No | Read by `deno/cache/deno_dir.rs` |
| `DENO_TCP_KEEPALIVE_SECS` | TCP keepalive duration (seconds) for outbound `fetch()` connections. | No | No | Default: `30` |
| `DENO_TLS_CA_STORE` | Comma-separated list of TLS root stores to use (`mozilla`, `system`). | No | No | Default: `mozilla` |
| `DENO_USE_WRITEV` | Enable `writev` for HTTP responses (perf experiment). | No | No | Default: off |
| `DENO_VERBOSE_WARNINGS` | Emit verbose stack traces on deprecation warnings. | No | No | Read at startup via `cli/src/env.rs` |
| `EDGE_RUNTIME_ALLOC_CHECK_INT` | Interval (ms) between memory allocation checks for user workers. | No | No | Default: `1000` |
| `EDGE_RUNTIME_BUNDLE_CHECKSUM` | Default hash kind for the `bundle` subcommand (`sha256`, `xxhash3`, or `nochecksum`). | No | No | Wired to `--checksum` flag |
| `EDGE_RUNTIME_EVENT_WORKER_INITIAL_HEAP_SIZE_MIB` | V8 initial heap size (MiB) for the event worker. | No | No | Read at startup via `cli/src/env.rs` |
| `EDGE_RUNTIME_EVENT_WORKER_MAX_HEAP_SIZE_MIB` | V8 max heap size (MiB) for the event worker. | No | No | Read at startup via `cli/src/env.rs` |
| `EDGE_RUNTIME_INCLUDE_MALLOCED_MEMORY_ON_MEMCHECK` | If truthy, include `malloced_memory` in the per-worker memory limit check. | No | No | Read at startup via `cli/src/env.rs` |
| `EDGE_RUNTIME_MAIN_WORKER_INITIAL_HEAP_SIZE_MIB` | V8 initial heap size (MiB) for the main worker. | No | No | Read at startup via `cli/src/env.rs` |
| `EDGE_RUNTIME_MAIN_WORKER_MAX_HEAP_SIZE_MIB` | V8 max heap size (MiB) for the main worker. | No | No | Read at startup via `cli/src/env.rs` |
| `EDGE_RUNTIME_PORT` | Port to listen on. | No | No | Wired to `--port`/`-p` flag; default `9000` |
| `EDGE_RUNTIME_PRIMARY_WORKER_POOL_SIZE` | Tokio LocalPool size for the main + event workers. | No | No | Default: `1` |
| `EDGE_RUNTIME_TLS` | TLS listening port (presence enables TLS). | No | No | Wired to `--tls` flag; default-missing-value `443` |
| `EDGE_RUNTIME_TLS_CERT_PATH` | Path to PEM X.509 certificate (when TLS enabled). | No | No | Wired to `--cert` flag |
| `EDGE_RUNTIME_TLS_KEY_PATH` | Path to PEM-encoded private key (when TLS enabled). | No | No | Wired to `--key` flag |
| `EDGE_RUNTIME_WORKER_POOL_SIZE` | Tokio LocalPool size for the user worker pool. | No | No | Default: `available_parallelism()` in release |
| `EXT_AI_CACHE_DIR` | Directory used to cache ONNX model files downloaded by `Supabase.ai`. | No | No | Defaults to OS cache dir |
| `HTTP_PROXY` / `http_proxy` | HTTP outbound proxy for `fetch()` from user functions. | No | No | Read by `vendor/deno_fetch/proxy.rs` |
| `HTTPS_PROXY` / `https_proxy` | HTTPS outbound proxy for `fetch()` and for the S3 filesystem backend. | No | No | Read by `vendor/deno_fetch/proxy.rs` and `crates/fs/impl/s3_fs.rs` |
| `JSR_URL` | Override JSR (`jsr.io`) registry base URL. | No | No | Default: `https://jsr.io/` |
| `JWT_SECRET` | Legacy HS256 symmetric secret. Used by the bundled main service to verify legacy JWTs and injected into user functions. | No | Yes | Consumed by `docker/volumes/functions/main/index.ts` |
| `NO_PROXY` / `no_proxy` | Comma-separated bypass list for proxy variables. | No | No | Read by `vendor/deno_fetch/proxy.rs` |
| `NPM_CONFIG_REGISTRY` | Override the npm registry base URL used to resolve `npm:` specifiers. | No | No | Default: `https://registry.npmjs.org` |
| `OMP_NUM_THREADS` | Number of intra-op threads for the ONNX runtime used by `Supabase.ai`. | No | No | Default: `1` |
| `OTEL_EXPORTER_OTLP_CERTIFICATE` | Path to PEM CA file used to verify the OTLP collector's TLS certificate. | No | No | Read by `vendor/deno_telemetry/lib.rs` |
| `OTEL_EXPORTER_OTLP_CLIENT_CERTIFICATE` | Client cert for mTLS to the OTLP collector. | No | No | Read by `vendor/deno_telemetry/lib.rs` |
| `OTEL_EXPORTER_OTLP_CLIENT_KEY` | Client key for mTLS to the OTLP collector. | No | No | Read by `vendor/deno_telemetry/lib.rs` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP collector endpoint. Setting it enables both runtime-level OTel and the OTLP exporter. | No | No | Presence required to enable telemetry |
| `OTEL_EXPORTER_OTLP_HEADERS` | Comma-separated headers attached to OTLP exports. | No | No | Picked up automatically by the OTLP SDK |
| `OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE` | OTel metrics temporality (`cumulative`, `delta`, `lowmemory`). | No | No | Default: `cumulative` |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | OTLP protocol (`http/protobuf` or `http/json`). | No | No | Default: `http/protobuf` |
| `OTEL_METRIC_EXPORT_INTERVAL` | Metric export interval in milliseconds. | No | No | Default: `60000` |
| `OTEL_RESOURCE_ATTRIBUTES` | Comma-separated `key=value` attributes added to every span/metric/log. | No | No | Picked up automatically by the OTLP SDK |
| `OTEL_SERVICE_NAME` | `service.name` resource attribute used by the OTel exporter. | No | No | Picked up automatically by the OTLP SDK |
| `RUST_LOG` | Filter directive for the Rust logger (e.g. `info`, `base=debug`, `trace`). | No | No | Read by `env_logger` / `tracing-subscriber` |
| `SUPABASE_ANON_KEY` | Public ("anonymous") Supabase API key. Injected for user functions to call the public API. | Yes | Yes | Injected for user functions |
| `SUPABASE_DB_URL` | Postgres connection string. Injected for user functions that connect directly to Postgres. | Yes | Yes | Injected for user functions |
| `SUPABASE_INTERNAL_FUNCTIONS_CONFIG` | JSON map of per-function options (e.g. `verify_jwt`, `import_map_path`) consumed by the CLI's bundled main service. | Yes | No | Set by CLI; consumed by main service |
| `SUPABASE_INTERNAL_HOST_PORT` | Local API port the CLI's bundled main service forwards requests to. | Yes | No | Set by CLI |
| `SUPABASE_INTERNAL_JWT_SECRET` | HS256 secret used by the CLI's bundled main service to verify JWTs from the local stack. | Yes | No | Set by CLI |
| `SUPABASE_INTERNAL_PUBLISHABLE_KEY` | Opaque API key (publishable) used internally by the CLI's bundled main service. | Yes | No | Set by CLI |
| `SUPABASE_INTERNAL_SECRET_KEY` | Opaque API key (secret) used internally by the CLI's bundled main service. | Yes | No | Set by CLI |
| `SUPABASE_JWKS` | JSON Web Key Set (asymmetric + legacy symmetric) used by the bundled main service to verify user JWTs. | Yes | No | Self-hosted derives this from `SUPABASE_URL`'s `/auth/v1/.well-known/jwks.json` instead |
| `SUPABASE_PUBLIC_URL` | External/public URL of the Supabase project. Injected for user functions. | No | Yes | Injected for user functions |
| `SUPABASE_PUBLISHABLE_KEYS` | JSON map of opaque publishable API keys (new asymmetric-key format). | No | Yes | Injected for user functions |
| `SUPABASE_SECRET_KEYS` | JSON map of opaque secret API keys (new asymmetric-key format). Never expose to client code. | No | Yes | Injected for user functions |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` API key (full database access). Injected for user functions for privileged calls. | Yes | Yes | Injected for user functions |
| `SUPABASE_URL` | Internal Supabase API URL (Kong gateway hostname in self-hosted setups). Injected for user functions. | Yes | Yes | Injected for user functions |
| `V8_FLAGS` | Space-separated V8 command-line flags applied at startup (e.g. `--max-old-space-size=256`). | No | No | Read by `crates/base/src/runtime/mod.rs` |
| `VERIFY_JWT` | If `true`, the bundled main service rejects requests whose JWT does not verify against `JWT_SECRET`/`SUPABASE_JWKS`. Applies to all functions. | No | Yes | Read by `docker/volumes/functions/main/index.ts`; supplied via `FUNCTIONS_VERIFY_JWT` in `.env.example` |

---

## Analytics

> The `analytics` container runs `supabase/logflare`, an Elixir/Phoenix application. Almost all runtime env reads live in `config/runtime.exs`. Self-hosted Supabase runs it in single-tenant Supabase mode with the Postgres backend; BigQuery support is available but commented out in `docker-compose.yml`. The container is the consumer of `LOGFLARE_PUBLIC_ACCESS_TOKEN`/`LOGFLARE_PRIVATE_ACCESS_TOKEN`.

> **Heads-up — always-on admin UI:** Logflare's admin pages under `/admin/*` (sources, accounts, cluster view) are reachable by default. `LOGFLARE_SUPABASE_MODE=true` provisions an auto-admin user, and the `/admin/*` routes are gated by an auth pipeline rather than an env var - there is no flag to disable them. If the `analytics` container is exposed beyond your private Docker network, **block** `/admin/*` at the reverse proxy or API gateway level.

### Self-host mode

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `LOGFLARE_SINGLE_TENANT` | Run Logflare in single-tenant mode (no per-tenant isolation, no signup flow). | Yes | Yes | Default: `false`. Self-hosted: `true` |
| `LOGFLARE_SUPABASE_MODE` | Enable the Supabase preset: auto-creates the default source, wires the `analytics` container to the Supabase stack. | Yes | Yes | Default: `false`. Self-hosted: `true` |
| `LOGFLARE_PUBLIC_ACCESS_TOKEN` | Public API token used by ingestion clients (e.g. the `vector` container) to push log events. Falls back to `LOGFLARE_API_KEY`. | No | Yes | Required in single-tenant mode |
| `LOGFLARE_PRIVATE_ACCESS_TOKEN` | Private API token used by Studio server-side (and the management API) to query logs and run analytics endpoints. | Yes | Yes | Required in single-tenant mode |
| `LOGFLARE_FEATURE_FLAG_OVERRIDE` | Comma-separated `key=value` pairs overriding feature flags at boot. Self-hosted sets `multibackend=true` so the Postgres backend is reachable. | Yes | Yes | E.g. `multibackend=true` |
| `LOGFLARE_API_KEY` | Legacy fallback name for `LOGFLARE_PUBLIC_ACCESS_TOKEN`. | No | No | Deprecated; prefer `LOGFLARE_PUBLIC_ACCESS_TOKEN` |

### Internal database (metadata)

> These configure Logflare's own metadata Postgres connection (tenants, sources, endpoints). Self-hosted points them at the shared `supabase-db` container, schema `_analytics`.

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `DB_HOSTNAME` | Hostname for Logflare's metadata Postgres. | Yes | Yes | Self-hosted: from `POSTGRES_HOST` |
| `DB_PORT` | Port for Logflare's metadata Postgres. | Yes | Yes | Self-hosted: from `POSTGRES_PORT` |
| `DB_DATABASE` | Database name for Logflare's metadata Postgres. | Yes | Yes | Self-hosted: `_supabase` |
| `DB_SCHEMA` | Postgres schema used for Logflare metadata tables (set as `search_path`). | Yes | Yes | Self-hosted: `_analytics` |
| `DB_USERNAME` | Postgres user for Logflare's metadata connection. | Yes | Yes | Self-hosted: `supabase_admin` |
| `DB_PASSWORD` | Postgres password for the metadata connection. | Yes | Yes | Self-hosted: from `POSTGRES_PASSWORD` |
| `DB_POOL_SIZE` | Ecto connection pool size for the metadata Postgres. | No | No | No default |
| `DB_SSL` | Enable SSL/TLS for the metadata Postgres connection (requires cert files). | No | No | Default: `false` |

### Postgres backend (log storage)

> When `LOGFLARE_FEATURE_FLAG_OVERRIDE=multibackend=true`, Logflare stores log events in a separate Postgres backend rather than BigQuery. Self-hosted points this at the same `db` container, schema `_analytics`.

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `POSTGRES_BACKEND_URL` | Connection URL for the Postgres log-storage backend. | Yes | Yes | Required when `multibackend=true` |
| `POSTGRES_BACKEND_SCHEMA` | Schema in the Postgres backend that holds log tables. | Yes | Yes | Self-hosted: `_analytics` |

### BigQuery backend (log storage)

> Disabled in the default self-hosted compose. To use BigQuery, comment out `POSTGRES_BACKEND_URL` / `POSTGRES_BACKEND_SCHEMA` / `LOGFLARE_FEATURE_FLAG_OVERRIDE` in `docker-compose.yml`, mount a `gcloud.json` service-account key, and set the variables below.

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `GOOGLE_PROJECT_ID` | Google Cloud project ID hosting the BigQuery dataset. | No | Yes | Commented out in compose |
| `GOOGLE_PROJECT_NUMBER` | Numeric Google Cloud project number. | No | Yes | Commented out in compose |
| `GOOGLE_DATASET_ID_APPEND` | Suffix appended to BigQuery dataset IDs. | No | No | Default: `_default` |
| `GOOGLE_DATASET_LOCATION` | BigQuery dataset location (e.g. `US`, `EU`). | No | No | |
| `GOOGLE_SERVICE_ACCOUNT` | Service-account email used for BigQuery operations. | No | No | |
| `LOGFLARE_BIGQUERY_MANAGED_SA_POOL` | Number of managed service accounts in the BigQuery SA pool. | No | No | Default: `0` |
| `LOGFLARE_BQ_WRITE_API_POOL_SIZE` | Connection pool size for the BigQuery Write API. | No | No | Default: `10` |

### Server / Phoenix endpoint

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `PHX_HTTP_PORT` | HTTP port the Phoenix endpoint binds to. | No | No | Default: `4000` (image) |
| `PHX_HTTP_IP` | Bind IP for the HTTP endpoint. | No | No | |
| `PHX_URL_HOST` | External host used to build absolute URLs. | No | No | |
| `PHX_URL_SCHEME` | URL scheme (`http`/`https`). | No | No | |
| `PHX_URL_PORT` | External URL port. | No | No | |
| `PHX_SECRET_KEY_BASE` | Phoenix session signing/encryption key. | No | No | Required in production; baked into the image for self-host |
| `PHX_CHECK_ORIGIN` | Comma-separated list of allowed origins for CSRF check. | No | No | |
| `PHX_LIVE_VIEW_SIGNING_SALT` | Salt used for Phoenix LiveView token signing. | No | No | |
| `LOGFLARE_GRPC_PORT` | Port for the gRPC server (used for trace ingestion / OTLP). | No | No | Default: `50051` |
| `LOGFLARE_ENABLE_GRPC_SSL` | Enable TLS for the gRPC server. | No | No | Default: `false` |
| `LOGFLARE_ENABLE_LIVE_DASHBOARD` | Expose Phoenix LiveDashboard at `/admin`. | No | No | Default: `false` |
| `LOGFLARE_HTTP_CONNECTION_POOLS` | Comma-separated list of HTTP pool providers to enable. | No | No | Default: `all` |
| `LOGFLARE_PUBSUB_POOL_SIZE` | PubSub connection pool size. | No | No | Default: `56` |
| `LOGFLARE_NODE_SHUTDOWN_CODE` | Shutdown identifier code. | No | No | |

### Logging

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `LOGFLARE_LOG_LEVEL` | Logger level (`debug`, `info`, `warning`, `error`). | Yes | No | Default: `info` |
| `LOGFLARE_LOGGER_JSON` | Emit JSON-formatted log lines instead of plain text. | No | No | Default: `false` |
| `LOGFLARE_LOGGER_BACKEND_URL` | URL of a remote Logflare logger backend (forwards Logflare's own logs there). | No | No | |
| `LOGFLARE_LOGGER_BACKEND_API_KEY` | API key for the remote logger backend. | No | No | |
| `LOGFLARE_LOGGER_BACKEND_SOURCE_ID` | Source ID for the remote logger backend. | No | No | |

### Telemetry / Observability

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `LOGFLARE_OTEL_ENDPOINT` | OTLP collector endpoint. Presence enables tracing. | No | No | |
| `LOGFLARE_OTEL_SAMPLE_RATIO` | Default sampling ratio (0.0-1.0) for OTel traces. | No | No | Default: `1.0` |
| `LOGFLARE_OTEL_INGEST_SAMPLE_RATIO` | Sampling ratio for ingest-path traces (falls back to default). | No | No | |
| `LOGFLARE_OTEL_ENDPOINT_SAMPLE_RATIO` | Sampling ratio for endpoint-path traces (falls back to default). | No | No | |
| `LOGFLARE_OTEL_SOURCE_UUID` | Source UUID header attached to OTel exports. | No | No | |
| `LOGFLARE_OTEL_ACCESS_TOKEN` | Access token header attached to OTel exports. | No | No | |
| `LOGFLARE_HEALTH_MAX_MEMORY_UTILIZATION` | Memory utilization threshold (0.0-1.0) reported by the health check. | No | No | Default: `0.80` |
| `LOGFLARE_ALERTS_ENABLED` | Enable the alerting subsystem. | No | No | Default: `true` |

### Encryption

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `LOGFLARE_DB_ENCRYPTION_KEY` | Primary base64 key used to encrypt sensitive columns. | No | No | Image fallback baked in |
| `LOGFLARE_DB_ENCRYPTION_KEY_RETIRED` | Previously-active key, kept for decryption during rotation. | No | No | |

---

## Postgres

> The `db` container runs the `supabase/postgres` image, a fork of the official `postgres` image that adds Supabase-specific extensions (`pgsodium`, `pg_graphql`, `pgjwt`, etc.), default roles, and seed migrations. Most variables are inherited from the upstream `postgres` image and read by its `docker-entrypoint.sh` on first boot (initdb). A few are added by the Supabase fork or by init SQL that the self-hosted compose mounts into `/docker-entrypoint-initdb.d/init-scripts/`.

### Core (inherited from upstream `postgres` image)

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `POSTGRES_PASSWORD` | Password for the `POSTGRES_USER` superuser. Set on first boot during `initdb`. | Yes | Yes | Required unless `POSTGRES_HOST_AUTH_METHOD=trust` |
| `POSTGRES_USER` | Username for the initial superuser. The Supabase image overrides this. | Yes | No | Default: `supabase_admin` (Supabase image) |
| `POSTGRES_DB` | Name of the first database to create. | Yes | Yes | Default: `postgres` |
| `POSTGRES_HOST` | Unix socket directory or hostname Postgres listens on. The Supabase image hardcodes the socket path. | Yes | Yes | Default: `/var/run/postgresql` (Supabase image) |
| `POSTGRES_PORT` | TCP port Postgres listens on (Supabase migration scripts also read this). | No | Yes | Default: `5432` |
| `POSTGRES_INITDB_ARGS` | Extra arguments passed to `initdb` (locale, encoding, etc.). | Yes | No | Default in CLI: `--allow-group-access --locale-provider=icu --encoding=UTF-8 --icu-locale=en_US.UTF-8` |
| `POSTGRES_INITDB_WALDIR` | Separate filesystem path used by `initdb` for the WAL directory. | No | No | When unset, WAL lives inside `PGDATA` |
| `POSTGRES_HOST_AUTH_METHOD` | Default `pg_hba.conf` authentication method (e.g. `trust`, `scram-sha-256`). | No | No | Defaults to `scram-sha-256` (Postgres 14+) |
| `PGDATA` | Data directory used by Postgres. | Yes | No | Default: `/var/lib/postgresql/data` |

### libpq client variables (read by Supabase migration scripts on init)

> The Supabase image's `migrations/db/migrate.sh` runs at first boot and reads the standard libpq env vars rather than the `POSTGRES_*` ones. The compose file sets both so both the entrypoint and the migration runner work.

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `PGPORT` | TCP port for the migration runner's psql connection. | No | Yes | Self-hosted: mirrors `POSTGRES_PORT` |
| `PGPASSWORD` | Password for the migration runner's psql connection. | No | Yes | Self-hosted: mirrors `POSTGRES_PASSWORD` |
| `PGDATABASE` | Database name used by the migration runner. | No | Yes | Self-hosted: mirrors `POSTGRES_DB` |
| `PGHOST` | Host used by the migration runner (defaults to socket path inside the container). | No | No | Self-hosted relies on `POSTGRES_HOST` |

### Supabase init SQL (mounted by docker-compose)

> These are consumed by SQL scripts the self-hosted compose mounts into `/docker-entrypoint-initdb.d/init-scripts/`. They are *not* read by the `supabase/postgres` image itself — they are read by init SQL under `docker/volumes/db/` (the orchestration layer).

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `JWT_SECRET` | HS256 secret stored as `app.settings.jwt_secret` on the `postgres` database. Read by `volumes/db/jwt.sql`. PostgREST and pgjwt-using functions read it via `current_setting()`. | Yes | Yes | Required. Sourced from `JWT_SECRET` in `.env.example` |
| `JWT_EXP` | Default JWT expiry (seconds) stored as `app.settings.jwt_exp` on the `postgres` database. Read by `volumes/db/jwt.sql`. | Yes | Yes | Sourced from `JWT_EXPIRY` in `.env.example` |

---

## Supavisor

| Variable | Description | CLI | Self-hosted | Notes |
|---|---|---|---|---|
| `ADDR_TYPE` | Socket address family for the HTTP endpoint. Must be `inet` or `inet6`. | No | No | Default: `inet` |
| `API_JWT_SECRET` | JWT secret used to authenticate requests to Supavisor's management API. | No | Yes | Self-hosted sets this to `JWT_SECRET` |
| `API_TOKEN_BLOCKLIST` | Comma-separated list of API JWTs to reject. | No | No | Default: empty |
| `CACHE_BYPASS_USERS` | Comma-separated list of DB users that bypass the auth-query cache. | No | No | Default: empty |
| `CLUSTER_ID` | Region identifier used in the libcluster Postgres channel name. First of `CLUSTER_ID`, `LOCATION_ID`, `REGION` wins. | No | No | Only used when `CLUSTER_POSTGRES` is set |
| `CLUSTER_NODES` | Comma-separated list of Erlang node names for static EPMD clustering. | No | No | Optional |
| `CLUSTER_POSTGRES` | Enables libcluster Postgres strategy (heartbeats via `pg_notify`). | No | Yes | Set to `true` to enable. Self-hosted: `true` |
| `DATABASE_URL` | Ecto URL for Supavisor's metadata database (tenants, users). Also used by the Postgres clustering strategy. | No | Yes | Default: `ecto://postgres:postgres@localhost:6432/postgres` |
| `DB_POOL_SIZE` | Pool size for Supavisor's internal metadata Ecto repo. | No | Yes | Default: `25`. Self-hosted: from `POOLER_DB_POOL_SIZE` (default `5`) |
| `DEBUG_LOAD_RUNTIME_CONFIG` | If set, hot-upgrade loads `config/runtime.exs` from CWD instead of the release dir. | No | No | Debug only |
| `DNS_POLL` | DNS name to poll for libcluster `DNSPoll` strategy. | No | No | Optional |
| `DOWNSTREAM_SERVER_ECDSA_CERT` | Path to ECDSA certificate file served to downstream clients. | No | No | Optional, file must exist |
| `DOWNSTREAM_SERVER_ECDSA_KEY` | Path to ECDSA private key file served to downstream clients. | No | No | Optional, file must exist |
| `GLOBAL_DOWNSTREAM_CERT_PATH` | Path to TLS certificate file served to downstream Postgres clients. | No | No | Optional, file must exist |
| `GLOBAL_DOWNSTREAM_KEY_PATH` | Path to TLS private key file served to downstream Postgres clients. | No | No | Optional, file must exist |
| `GLOBAL_UPSTREAM_CA_PATH` | Path to upstream CA bundle used to verify upstream Postgres TLS certificates. | No | No | Optional |
| `INSTANCE_ID` | Instance identifier added to logger metadata. | No | No | Optional |
| `JWT_CLAIM_VALIDATORS` | JSON object of additional JWT claims to validate (e.g. `{"iss":"supabase"}`). | No | No | Default: `{}` |
| `LOCATION_ID` | Region identifier used in the libcluster Postgres channel name. Falls back to `REGION` if unset. | No | No | Only used when `CLUSTER_POSTGRES` is set |
| `LOCATION_KEY` | Location label added to logger metadata. Falls back to `region` if unset. | No | No | Optional |
| `LOGFLARE_API_KEY` | Logflare API key. Required when `LOGS_ENGINE=logflare`. | No | No | Optional |
| `LOGFLARE_SOURCE_ID` | Logflare source ID. Required when `LOGS_ENGINE=logflare`. | No | No | Optional |
| `LOGS_ENGINE` | Logging backend. Set to `logflare` to enable the Logflare HTTP logger backend. | No | No | Optional |
| `MAX_CONNECTIONS` | Max concurrent connections accepted by the HTTP endpoint and Ranch proxy listeners. | No | No | Default: `1000` (HTTP), `:infinity` (proxy listeners) |
| `METRICS_DISABLED` | If `true`, disables Prometheus metrics children (PromEx, TenantsMetrics, MetricsCleaner). | No | No | Default: `false` |
| `METRICS_JWT_SECRET` | JWT secret used to authenticate requests to the metrics endpoint. | No | Yes | Self-hosted sets this to `JWT_SECRET` |
| `METRICS_TOKEN_BLOCKLIST` | Comma-separated list of metrics JWTs to reject. | No | No | Default: empty |
| `NAMED_PREPARED_STATEMENTS_ENABLED` | Feature flag enabling named prepared statement support in transaction mode. | No | No | Default: `false`. Accepts `true`/`false`/`1`/`0` |
| `NODE_IP` | IP address used to build the Erlang `RELEASE_NODE` (`<name>@<ip>`). Also stored as `node_host` in app config. | No | No | Default: `127.0.0.1`. In Fly, falls back to the `fly-local-6pn` entry in `/etc/hosts` |
| `NODE_NAME` | Erlang node basename. Used as `<name>@<ip>` for the release node. | No | No | Falls back to `FLY_APP_NAME`, then `supavisor` |
| `NO_WARM_POOL_USERS` | Comma-separated list of DB users for which Supavisor should not pre-warm a pool. | No | No | Default: empty |
| `NUM_ACCEPTORS` | Number of acceptor processes per Ranch listener (HTTP endpoint and proxy listeners). | No | No | Default: `100` |
| `PORT` | HTTP port for the Phoenix endpoint (health, metrics, management API). | No | Yes | Default: `4000`. Self-hosted: `4000` |
| `POOLER_DEFAULT_POOL_SIZE` | Default upstream pool size for the bootstrapped tenant. Read by the self-hosted `pooler.exs` provisioning script. | No | Yes | Configured via pooler.exs |
| `POOLER_MAX_CLIENT_CONN` | Maximum client connections for the bootstrapped tenant. Read by the self-hosted `pooler.exs` provisioning script. | No | Yes | Configured via pooler.exs |
| `POOLER_POOL_MODE` | Pool mode for the bootstrapped tenant's user (`transaction` or `session`). Read by the self-hosted `pooler.exs` provisioning script. | No | Yes | Configured via pooler.exs. Self-hosted hard-codes `transaction` |
| `POOLER_TENANT_ID` | External tenant ID created at first startup. Read by the self-hosted `pooler.exs` provisioning script. | No | Yes | Configured via pooler.exs. Required |
| `POSTGRES_DB` | Tenant Postgres database name. Read by the self-hosted `pooler.exs` provisioning script. | No | Yes | Configured via pooler.exs |
| `POSTGRES_HOST` | Tenant Postgres host. Read by the self-hosted `pooler.exs` provisioning script. | No | Yes | Configured via pooler.exs. Default in script: `db` |
| `POSTGRES_PASSWORD` | Tenant Postgres password for the `pgbouncer` auth user. Read by the self-hosted `pooler.exs` provisioning script. | No | Yes | Configured via pooler.exs |
| `POSTGRES_PORT` | Tenant Postgres port. Read by the self-hosted `pooler.exs` provisioning script and used to map the session-mode listener port. | No | Yes | Configured via pooler.exs |
| `PROM_POLL_RATE` | Prometheus metrics poll interval in milliseconds. | No | No | Default: `15000` |
| `PROXY_PORT` | Generic Postgres proxy listener port (mode: `proxy`). | No | No | Default: `5412` |
| `PROXY_PORT_SESSION` | Postgres session-mode proxy listener port. | No | No | Default: `5432` |
| `PROXY_PORT_TRANSACTION` | Postgres transaction-mode proxy listener port. | No | No | Default: `6543` |
| `REGION` | Region label used in logger metadata and as the default for `LOCATION_KEY`. Also used in the libcluster Postgres channel name when `CLUSTER_ID`/`LOCATION_ID` are unset. | No | Yes | Falls back to `FLY_REGION`. Self-hosted: `local` |
| `RELEASE_COOKIE` | Erlang distribution cookie. Read by the release scripts. | No | No | Optional |
| `RELEASE_DISTRIBUTION` | Erlang release distribution mode. Set to `name` by `rel/env.sh.eex`. | No | No | Default: `name` |
| `RELEASE_NODE` | Erlang release node name (`<NODE_NAME>@<NODE_IP>`). Set by `rel/env.sh.eex`. | No | No | Computed at startup |
| `RELEASE_ROOT` | Release root directory. Used to locate `runtime.exs` during hot upgrades. | No | No | Set by the release scripts |
| `RLIMIT_NOFILE` | Open-file descriptor limit applied by the container entrypoint (`limits.sh`). | No | No | Default: `100000` (baked into image) |
| `SECRET_KEY_BASE` | Phoenix endpoint secret used to sign/encrypt session and CSRF tokens. | No | Yes | Required in non-dev/test envs |
| `SESSION_PROXY_PORTS` | Comma-separated list of additional internal session-mode proxy listener ports. | No | No | Default: `12100,12101,12102,12103` |
| `SUBSCRIBE_RETRIES` | Number of retries when subscribing to a tenant pool. | No | No | Default: `20` |
| `SUPAVISOR_DB_IP_VERSION` | Socket family for upstream Postgres connections. Set to `ipv6` to use `inet6`. | No | No | Default: `ipv4` (`inet`) |
| `SUPAVISOR_LOG_FILE_PATH` | If set, the default logger writes logs to this file (rotated, 8 MiB each, 5 files). | No | No | Optional |
| `SUPAVISOR_LOG_FORMAT` | Set to `json` to emit logs in Logflare JSON format. | No | No | Optional |
| `SWITCH_ACTIVE_COUNT` | Number of activity ticks before a pool is switched out. | No | No | Default: `100` |
| `TRANSACTION_PROXY_PORTS` | Comma-separated list of additional internal transaction-mode proxy listener ports. | No | No | Default: `12104,12105,12106,12107` |
| `VAULT_ENC_KEY` | AES.GCM encryption key for the Cloak vault used to encrypt tenant credentials at rest. | No | Yes | Required |
