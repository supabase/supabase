Last updated: 2026-11-26

# Self-hosted Supabase configuration reference

This document is the aggregated reference for environment variables relevant to a self-hosted Supabase deployment. It aims to be comprehensive for the self-hosted use case rather than literally exhaustive - variables that only apply on the hosted platform are typically omitted or marked as such. For the complete set a given service can read, refer to its [upstream repositories](#upstream-repositories) below.

The default self-hosted setup already includes explicit values for all required variables, and the remaining configuration inherits sensible defaults from the services themselves. Otherwise, it serves as a reference for advanced customization or educational purposes. For more guidance on the essential keys and secrets, see [Configuring secrets](https://supabase.com/docs/guides/self-hosting/docker#configuring-secrets) in the self-hosting guide.

> **A note on accuracy.** This reference is compiled from each service's source code and upstream docs as a self-hosting overview - it is **not** maintained by the individual product teams and shouldn't be treated as canonical. Within each row:
>
> - **Type, defaults, formats, and where the variable is read** are derived directly from code (parse sites in Go / TypeScript / Elixir / Rust) and are usually reliable. The `Type` cell uses a closed vocabulary with embedded unit hints (e.g. `integer (seconds)`, `integer (ms)`, `string (duration)`) to surface unit conventions that vary across services.
> - The **prose description of what the variable is *for*** is more interpretive. It captures the immediate mechanical effect well, but the underlying *intent* - why the variable exists, when you should change it, how it interacts with other variables - is partly synthesized by an LLM and can be subtly off.
>
> When the *what* matters operationally, trust the row. When the *why* matters, defer to the upstream service's own documentation or source.

## Verification status

The Type column was derived from each service's parse-site code (Go struct fields, TypeScript conversions, Elixir parse calls, Rust `clap` declarations). The Description column is best-effort and was cross-checked against upstream prose where a fresh, trusted source exists:

- **Auth** - against [supabase/auth/README.md](https://github.com/supabase/auth/blob/master/README.md)
- **PostgREST** - against [postgrest.org/en/stable](https://docs.postgrest.org/en/stable/references/configuration.html)
- **Realtime** - against [supabase/realtime/ENVS.md](https://github.com/supabase/realtime/blob/main/ENVS.md)
- **Storage** - against the Supabase docs [YAML spec](https://github.com/supabase/supabase/blob/master/apps/docs/spec/storage_v0_config.yaml) for the variables it covers; otherwise from code reads
- **Analytics (Logflare)** - against the Supabase docs [YAML spec](https://github.com/supabase/supabase/blob/master/apps/docs/spec/analytics_v0_config.yaml) and [docs.logflare.app/self-hosting](https://docs.logflare.app/self-hosting/) for the rest, with [logflare/config/runtime.exs](https://github.com/Logflare/logflare/blob/main/config/runtime.exs) and [logflare/config/config.exs](https://github.com/Logflare/logflare/blob/main/config/config.exs) used as tiebreakers
- **Supavisor** - against [supabase/supavisor/docs/configuration/env.md](https://github.com/supabase/supavisor/blob/main/docs/configuration/env.md)

Other sections (Studio, Edge Functions, Postgres) appeared to have no comparable upstream prose documentation and were documented by reading the source repos. Corrections welcome via PR.

## How to read this document

Each table has five columns:

| Column | Meaning |
|---|---|
| **Variable** | Exact env var name as the service's code reads it. Names are case-sensitive. |
| **Type** | Closed vocabulary: `string`, `integer`, `number`, `boolean`, `JSON`, `enum`, `URL`, `path`, `JWT`, `JWKS`. Numeric forms carry a unit hint where one applies - e.g. `integer (seconds)`, `integer (ms)`, `integer (bytes)`, `integer (MB)`, `integer (count)`, `number (ratio)`. String forms with a semantic hint: `string (duration)` (Go `time.Duration` strings like `10s`, `5m`, distinct from `integer (seconds)`), `string (regex)`, `string (CSV)`. |
| **Set by (CLI, Self-hosted)** | `Both` if the variable is set inside the corresponding container when you run `supabase start` (see the [Local development & CLI](https://supabase.com/docs/guides/local-development)) *and* in `docker/docker-compose.yml` / `docker/.env.example`. `Self-hosted` if only in the self-hosted compose/.env (including inside commented-out lines). `CLI` if only in the CLI runtime env. Blank if neither - the variable is documented because the service's code reads it, but no Supabase-side config pre-wires it. |
| **Description** | What the variable controls. |
| **Notes** | Default value, requirement, deprecation, alias, or scope. |

A few caveats:

- **"Set by = blank" does not mean "unusable in self-hosted".** It only means the default `docker-compose.yml` does not pass the variable through. You can almost always try to add it under the service's `environment:` block.
- **Defaults shown are from the upstream service code.** Some defaults are overridden by `docker-compose.yml`; where that happens it is called out in Notes.
- **The CLI runs Supavisor only when the pooler is enabled** in `config.toml` (`[db.pooler] enabled = true`). Supavisor rows marked `Both` or `CLI` apply to `supabase start` only in that case.
- **Auth/gotrue env vars are programmatically derived** from a Go config struct (envconfig), so most fields are reachable via two names: a prefixed form (`GOTRUE_API_API_EXTERNAL_URL`) and a bare-name alias (`API_EXTERNAL_URL`). Both are documented.

## Upstream repositories

The image tags below are pinned in `docker-compose.yml` at the time of this document; check that file for the current versions.

| Service | Image | Source repo |
|---|---|---|
| Studio (Dashboard) | `supabase/studio` | [supabase/supabase/apps/studio](https://github.com/supabase/supabase/tree/master/apps/studio) |
| Auth | `supabase/gotrue` | [supabase/auth](https://github.com/supabase/auth) |
| PostgREST | `postgrest/postgrest` | [PostgREST/postgrest](https://github.com/PostgREST/postgrest) |
| Realtime | `supabase/realtime` | [supabase/realtime](https://github.com/supabase/realtime) |
| Storage | `supabase/storage-api` | [supabase/storage](https://github.com/supabase/storage) |
| Edge Functions | `supabase/edge-runtime` | [supabase/edge-runtime](https://github.com/supabase/edge-runtime) |
| Analytics | `supabase/logflare` | [logflare/logflare](https://github.com/logflare/logflare) |
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

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `DEFAULT_ORGANIZATION_NAME` | string | Self-hosted | Name shown for the single default organization on the dashboard. | Mapped from `STUDIO_DEFAULT_ORGANIZATION` in `.env.example`. Default: `Default Organization`. |
| `DEFAULT_PROJECT_NAME` | string | Self-hosted | Name shown for the single default project on the dashboard. | Mapped from `STUDIO_DEFAULT_PROJECT` in `.env.example`. Default: `Default Project`. |
| `HOSTNAME` | string | Both | Network interface Next.js binds to inside the container. | Set to `0.0.0.0` so the container is reachable from outside. |
| `POSTGRES_DB` | string | Self-hosted | Postgres database name used for Studio's internal connections. | Default: `postgres`. |
| `POSTGRES_HOST` | string | Self-hosted | Postgres host (service name in compose network). | Default: `db`. |
| `POSTGRES_PASSWORD` | string | Both | Postgres password for the `POSTGRES_USER_READ_WRITE` role. | Supports `_FILE` suffix for Docker secrets. |
| `POSTGRES_PORT` | integer | Self-hosted | Postgres TCP port. | Default: `5432`. |
| `POSTGRES_USER_READ_ONLY` | string | | Postgres role used by the local MCP server when running in read-only mode. | Default: `supabase_read_only_user`. This role has no password by default, so read-only MCP will fail to connect. To enable, assign a password matching `POSTGRES_PASSWORD`. |
| `POSTGRES_USER_READ_WRITE` | string | Both | Postgres role used for read/write queries from the SQL editor. | Default: `postgres`. |
| `STUDIO_PG_META_URL` | URL | Both | URL of the `postgres-meta` service used for schema introspection. | E.g. `http://meta:8080`. Required. |
| `SUPABASE_PUBLIC_URL` | URL | Both | Public URL of the Supabase stack (Kong gateway) as seen by end users. | Used to construct REST API URLs and connection strings shown in the dashboard. |
| `SUPABASE_URL` | URL | Both | Internal URL Studio uses to reach Kong from inside the Docker network. | E.g. `http://kong:8000`. |

### Auth / JWT

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `AUTH_JWT_SECRET` | string | Both | HS256 JWT secret used to mint/verify legacy API keys; surfaced to the UI for "JWT settings" and PostgREST config. | Mapped from `JWT_SECRET` in `.env.example`. Must be at least 32 characters. |
| `SUPABASE_ANON_KEY` | string | Both | Anon API key surfaced in the Project API Settings page and used by in-dashboard clients. | Mapped from `ANON_KEY`. Supports `_FILE` suffix for Docker secrets. |
| `SUPABASE_SERVICE_KEY` | string | Both | Service-role API key surfaced in the Project API Settings page. | Mapped from `SERVICE_ROLE_KEY`. Supports `_FILE` suffix for Docker secrets. Keep secret. |
| `SUPABASE_PUBLISHABLE_KEY` | string | Both | Publishable API key listed on the API Keys page. Studio's self-hosted MCP endpoint also uses it. | Listed only when set |
| `SUPABASE_SECRET_KEY` | string | Both | Secret API key listed on the API Keys page. | Listed only when set. Keep secret. |
| `S3_PROTOCOL_ACCESS_KEY_ID` | string | CLI | S3 access key ID returned by Studio's `/api/get-s3-keys` route for the S3 connection settings. | The self-hosted compose passes it to the `storage` container only, not to Studio |
| `S3_PROTOCOL_ACCESS_KEY_SECRET` | string | CLI | S3 secret access key returned by Studio's `/api/get-s3-keys` route. | The self-hosted compose passes it to the `storage` container only, not to Studio. Keep secret. |

### PG Meta

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `PG_META_CRYPTO_KEY` | string | Self-hosted | Encryption key used by Studio's pg-meta routes to encrypt sensitive values (vault, foreign-server credentials) before storing them. | Falls back to `SAMPLE_KEY` if unset - set this to a random 32+ char string. |

### PostgREST passthrough

These mirror the running PostgREST configuration so the dashboard can display correct settings on the "API" page.

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `PGRST_DB_EXTRA_SEARCH_PATH` | string (CSV) | Both | Extra Postgres schemas added to `search_path` for every PostgREST request. | Default: `public`. |
| `PGRST_DB_MAX_ROWS` | integer (count) | Both | Maximum rows returned by any single PostgREST request. | Default: `1000`. |
| `PGRST_DB_SCHEMAS` | string (CSV) | Both | Comma-separated list of schemas exposed via PostgREST. | Default: `public,graphql_public`. Also used as the list of "Exposed schemas" in the API settings UI. |

### Analytics / Logflare

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `LOGFLARE_API_KEY` | string | | Legacy alias for `LOGFLARE_PUBLIC_ACCESS_TOKEN`. | Deprecated. Declared in `apps/studio/turbo.jsonc` but not read by Studio code; kept only for backward compatibility with older deployments. |
| `LOGFLARE_PRIVATE_ACCESS_TOKEN` | string | Both | Private API token Studio uses server-side to query Logflare endpoints (logs, charts). | Required for logs/analytics features to work on self-hosted. |
| `LOGFLARE_URL` | URL | Both | Base URL of the Logflare/analytics service. | E.g. `http://analytics:4000`. Used to build the `PROJECT_ANALYTICS_URL`. |
| `NEXT_ANALYTICS_BACKEND_PROVIDER` | enum | CLI | Historically intended to select the analytics container's backend (`postgres` or `bigquery`). | No-op today: not read by Studio code, and the `analytics` (supabase/logflare) container chooses its backend via `POSTGRES_BACKEND_URL` / `LOGFLARE_FEATURE_FLAG_OVERRIDE` instead. Safe to ignore. |
| `NEXT_PUBLIC_ENABLE_LOGS` | boolean | | Historically intended to toggle visibility of log explorer pages. | Not read by Studio code today, and not declared in `apps/studio/turbo.jsonc`. Use `ENABLED_FEATURES_LOGS_ALL` (see Feature flags below) for runtime control of the logs section. |

### Feature flags (runtime overrides)

Self-hosted Studio reads `ENABLED_FEATURES_*` env vars at container start time to disable or re-enable individual feature flags without rebuilding the image. The mapping rule is: uppercase the feature key from `packages/common/enabled-features/enabled-features.json` and replace every non-alphanumeric character with `_` (e.g. `logs:all` → `ENABLED_FEATURES_LOGS_ALL`). See `packages/common/enabled-features/README.md` for the full mechanism and the canonical flag list (~90 flags).

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `ENABLED_FEATURES_*` | boolean | | Per-flag runtime override. Set to `true` or `false` (case-insensitive); other values are logged and ignored. | One env var per flag. Full key list: `packages/common/enabled-features/enabled-features.json`. No-op when `NEXT_PUBLIC_IS_PLATFORM=true`. |
| `ENABLED_FEATURES_LOGS_ALL` | boolean | Both | Disable the entire Logs section of the dashboard. Maps to the `logs:all` feature flag. | Documented explicitly as the runtime replacement for the legacy build-time `NEXT_PUBLIC_ENABLE_LOGS`. |

### AI features

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `OPENAI_API_KEY` | string | Both | OpenAI API key used by the AI Assistant and SQL generator. | Optional; AI panel is disabled if unset. |

### Edge Functions / Snippets management

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `EDGE_FUNCTIONS_MANAGEMENT_FOLDER` | path | Both | Filesystem directory inside the container where edge function source is read from / written to when using the dashboard editor. | Mounted as a volume in `docker-compose.yml` (`./volumes/functions:/app/edge-functions`). |
| `SNIPPETS_MANAGEMENT_FOLDER` | path | Both | Filesystem directory inside the container where SQL editor snippets are persisted. | Mounted as a volume in `docker-compose.yml` (`./volumes/snippets:/app/snippets`). |

### Platform flags / runtime mode

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `CURRENT_CLI_VERSION` | string | CLI | Version string set when Studio is started by the Supabase CLI. | Renames the default project to "Supabase Studio (CLI)" when set. Exposed to client via Next.js passthrough. |
| `NEXT_PUBLIC_IS_PLATFORM` | boolean | | Master switch: `"true"` runs Studio in hosted (multi-project) mode, anything else runs in self-hosted single-project mode. | Self-hosted images are **built** with this unset/`false`. Exposed to client. Setting this to `true` in a self-hosted deployment will break the dashboard. |
| `NEXT_PUBLIC_NODE_ENV` | string | | Marks the build as a test build (used by E2E setup). | Set to `test` only by `generateLocalEnv.js`. Exposed to client. |
| `NODE_ENV` | enum | | Standard Node.js environment (`development` / `production` / `test`). | Set automatically by Next.js. |

---

## Auth

> Auth (gotrue) uses Go's [envconfig](https://github.com/kelseyhightower/envconfig) library - the env var names are programmatically derived from the `Configuration` struct in `internal/conf/configuration.go` by combining the `GOTRUE_` prefix with each nested struct's path. Aliased fields are reachable via two names: the prefixed form (`GOTRUE_API_API_EXTERNAL_URL`) and a bare-name fallback (`API_EXTERNAL_URL`).

> Auth's upstream `README.md` documents many of these variables with additional prose context - operator/Netlify history, default email-template bodies, OAuth provider examples, glob-matching syntax. The rows below stay reference-style; for prose backstory and template defaults, see [supabase/auth/README.md](https://github.com/supabase/auth/blob/master/README.md).

### API

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `API_EXTERNAL_URL` | URL | Both | Externally reachable URL of the Auth API; used in emails, OAuth callbacks, SAML, etc. | Required. Alias of `GOTRUE_API_API_EXTERNAL_URL` |
| `GOTRUE_API_API_EXTERNAL_URL` | URL |  | Externally reachable URL of the Auth API (prefixed form). | Required. Same field as `API_EXTERNAL_URL` |
| `GOTRUE_API_ENDPOINT` | string |  | Override of the API endpoint base. |  |
| `GOTRUE_API_HOST` | string | Both | Bind address for the API server. |  |
| `GOTRUE_API_MAX_REQUEST_DURATION` | string (duration) |  | Maximum total duration of a single API request. | Default: `10s` |
| `GOTRUE_API_PORT` | integer | Both | TCP port for the API server. | Default: `8081`. Alias of `PORT` |
| `PORT` | integer |  | TCP port for the API server (bare alias). | Default: `8081` |
| `GOTRUE_API_REQUEST_ID_HEADER` | string |  | HTTP header name to read the request ID from. | Alias of `REQUEST_ID_HEADER` |
| `REQUEST_ID_HEADER` | string |  | HTTP header name to read the request ID from (bare alias). |  |

### Database

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `DATABASE_URL` | string |  | Database connection string (bare alias). | Required. Alias of `GOTRUE_DB_DATABASE_URL` |
| `GOTRUE_DB_ADVISOR_ENABLED` | boolean |  | Enables the DB connection-pool advisor. | Default: `true` |
| `GOTRUE_DB_ADVISOR_OBSERVATION_INTERVAL` | string (duration) |  | Observation window length for the DB advisor. | Default: `20s` |
| `GOTRUE_DB_ADVISOR_SAMPLING_INTERVAL` | string (duration) |  | Sampling interval for the DB advisor. | Default: `200ms` |
| `GOTRUE_DB_CLEANUP_ENABLED` | boolean |  | Enables periodic cleanup of expired auth rows. | Default: `false` |
| `GOTRUE_DB_CONN_MAX_IDLE_TIME` | string (duration) |  | Max time a DB connection may sit idle. |  |
| `GOTRUE_DB_CONN_MAX_LIFETIME` | string (duration) |  | Max lifetime of a DB connection. |  |
| `GOTRUE_DB_CONN_PERCENTAGE` | integer (percent) |  | Percentage of available DB connections the Auth server may use (1-100). |  |
| `GOTRUE_DB_DATABASE_URL` | string | Both | Database connection string. | Required. Alias of `DATABASE_URL` |
| `GOTRUE_DB_DB_NAMESPACE` | string |  | Database schema to use (prefixed alias). | Default: `auth` |
| `DB_NAMESPACE` | string |  | Database schema to use (bare alias). | Default: `auth` |
| `GOTRUE_DB_DRIVER` | string | Both | Database driver name. | Required. Typically `postgres` |
| `GOTRUE_DB_HEALTH_CHECK_PERIOD` | string (duration) |  | Interval between DB connection health checks. |  |
| `GOTRUE_DB_MAX_IDLE_POOL_SIZE` | integer (count) | CLI | Maximum number of idle DB connections. |  |
| `GOTRUE_DB_MAX_POOL_SIZE` | integer (count) | CLI | Maximum total DB connections (0 = unlimited). |  |
| `GOTRUE_DB_MIGRATIONS_PATH` | path | | Filesystem path containing migration SQL files. | Default: `./migrations` |

### JWT

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOTRUE_JWT_ADMIN_GROUP_NAME` | string |  | Group claim value treated as admin. | Default: `admin` |
| `GOTRUE_JWT_ADMIN_ROLES` | string (CSV) | Both | Comma-separated roles treated as admin. | Default: `service_role,supabase_admin` |
| `GOTRUE_JWT_AUD` | string | Both | Default `aud` claim for issued JWTs. |  |
| `GOTRUE_JWT_DEFAULT_GROUP_NAME` | string | Both | Default group assigned to users. |  |
| `GOTRUE_JWT_EXP` | integer (seconds) | Both | Access token lifetime in seconds. | Default: `3600` |
| `GOTRUE_JWT_ISSUER` | string | Both | `iss` claim for issued JWTs. |  |
| `GOTRUE_JWT_KEY_ID` | string |  | Key ID assigned to the symmetric secret key. |  |
| `GOTRUE_JWT_KEYS` | JWKS | Both | JSON array of JWKs used for signing/verification. | Required when using the new API keys and new auth. |
| `GOTRUE_JWT_SECRET` | string | Both | Symmetric HS256 signing secret. | Required |
| `GOTRUE_JWT_VALID_METHODS` | string (CSV) | CLI | Allowed JWT signing methods (e.g. `HS256,RS256`). |  |

### Site / Redirect

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOTRUE_DISABLE_SIGNUP` | boolean | Both | Disable new user signups. |  |
| `GOTRUE_SITE_URL` | URL | Both | Primary site URL used in email/redirect defaults. | Required |
| `GOTRUE_URI_ALLOW_LIST` | string (CSV) | Both | Comma-separated list of allowed redirect URIs (supports glob). |  |

### Email / SMTP

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOTRUE_MAILER_ALLOW_UNVERIFIED_EMAIL_SIGN_INS` | boolean |  | Allow sign in before email is confirmed. | Default: `false` |
| `GOTRUE_MAILER_AUTOCONFIRM` | boolean | Both | Skip email confirmation flow. |  |
| `GOTRUE_MAILER_EMAIL_BACKGROUND_SENDING` | boolean |  | Send emails in background (experimental). | Default: `false` |
| `GOTRUE_MAILER_EMAIL_VALIDATION_BLOCKED_MX` | JSON |  | JSON array of blocked MX records for email validation. | Experimental |
| `GOTRUE_MAILER_EMAIL_VALIDATION_EXTENDED` | boolean |  | Enable extended email validation (MX/SMTP). | Default: `false`, experimental |
| `GOTRUE_MAILER_EMAIL_VALIDATION_SERVICE_HEADERS` | JSON |  | JSON object of headers sent to email validation service. | Experimental |
| `GOTRUE_MAILER_EMAIL_VALIDATION_SERVICE_URL` | URL |  | External email-validation service URL. | Experimental |
| `GOTRUE_MAILER_EXTERNAL_HOSTS` | string (CSV) |  | Additional hostnames allowed as the email-link host. |  |
| `GOTRUE_MAILER_OTP_EXP` | integer (seconds) | CLI | OTP/email link expiry in seconds. | Default: `86400` |
| `GOTRUE_MAILER_OTP_LENGTH` | integer (count) | CLI | OTP code length (6-10). | Default: `6` |
| `GOTRUE_MAILER_SECURE_EMAIL_CHANGE_ENABLED` | boolean | Both | Require confirmation on both old and new emails when changing. | Default: `true`, commented out in compose |
| `GOTRUE_MAILER_TEMPLATE_MAX_AGE` | string (duration) |  | Max age of a cached email template before refresh. | Default: `10m` |
| `GOTRUE_MAILER_TEMPLATE_MAX_SIZE` | integer (bytes) |  | Max template size in bytes pulled from a URL. | Default: `1000000` |
| `GOTRUE_MAILER_TEMPLATE_RELOADING_ENABLED` | boolean | CLI | Enable background reloading of email templates. | Default: `false` |
| `GOTRUE_MAILER_TEMPLATE_RELOADING_MAX_IDLE` | string (duration) |  | Max idle time before stopping template reload loop. | Default: `20m` |
| `GOTRUE_MAILER_TEMPLATE_RETRY_INTERVAL` | string (duration) |  | Retry interval for failed template reloads. | Default: `10s` |
| `GOTRUE_SMTP_ADMIN_EMAIL` | string | Both | From address used as `admin_email`. |  |
| `GOTRUE_SMTP_HEADERS` | JSON |  | JSON object of extra headers added to outgoing emails. |  |
| `GOTRUE_SMTP_HOST` | string | Both | SMTP relay hostname. |  |
| `GOTRUE_SMTP_LOGGING_ENABLED` | boolean |  | Verbose SMTP debug logging. | Default: `false` |
| `GOTRUE_SMTP_MAX_FREQUENCY` | string (duration) | Both | Minimum interval between emails per address. | Default: `1m`, commented out in compose |
| `GOTRUE_SMTP_PASS` | string | Both | SMTP password. |  |
| `GOTRUE_SMTP_PORT` | integer | Both | SMTP relay port. | Default: `587` |
| `GOTRUE_SMTP_SENDER_NAME` | string | Both | From name displayed on emails. Falls back to `GOTRUE_SMTP_ADMIN_EMAIL` when unset. |  |
| `GOTRUE_SMTP_USER` | string | Both | SMTP username. |  |

### Mailer notifications / subjects / templates / URL paths

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOTRUE_MAILER_NOTIFICATIONS_EMAIL_CHANGED_ENABLED` | boolean |  | Send notification when email changes. | Default: `false` |
| `GOTRUE_MAILER_NOTIFICATIONS_IDENTITY_LINKED_ENABLED` | boolean |  | Send notification when an identity is linked. | Default: `false` |
| `GOTRUE_MAILER_NOTIFICATIONS_IDENTITY_UNLINKED_ENABLED` | boolean |  | Send notification when an identity is unlinked. | Default: `false` |
| `GOTRUE_MAILER_NOTIFICATIONS_MFA_FACTOR_ENROLLED_ENABLED` | boolean |  | Send notification when an MFA factor is enrolled. | Default: `false` |
| `GOTRUE_MAILER_NOTIFICATIONS_MFA_FACTOR_UNENROLLED_ENABLED` | boolean |  | Send notification when an MFA factor is removed. | Default: `false` |
| `GOTRUE_MAILER_NOTIFICATIONS_PASSWORD_CHANGED_ENABLED` | boolean |  | Send notification when password changes. | Default: `false` |
| `GOTRUE_MAILER_NOTIFICATIONS_PHONE_CHANGED_ENABLED` | boolean |  | Send notification when phone changes. | Default: `false` |
| `GOTRUE_MAILER_SUBJECTS_CONFIRMATION` | string |  | Subject for the confirmation email. |  |
| `GOTRUE_MAILER_SUBJECTS_EMAIL_CHANGE` | string |  | Subject for the email-change email. |  |
| `GOTRUE_MAILER_SUBJECTS_EMAIL_CHANGED_NOTIFICATION` | string |  | Subject for the email-changed notification. |  |
| `GOTRUE_MAILER_SUBJECTS_IDENTITY_LINKED_NOTIFICATION` | string |  | Subject for the identity-linked notification. |  |
| `GOTRUE_MAILER_SUBJECTS_IDENTITY_UNLINKED_NOTIFICATION` | string |  | Subject for the identity-unlinked notification. |  |
| `GOTRUE_MAILER_SUBJECTS_INVITE` | string |  | Subject for the invite email. |  |
| `GOTRUE_MAILER_SUBJECTS_MAGIC_LINK` | string |  | Subject for the magic-link email. |  |
| `GOTRUE_MAILER_SUBJECTS_MFA_FACTOR_ENROLLED_NOTIFICATION` | string |  | Subject for the MFA-enrolled notification. |  |
| `GOTRUE_MAILER_SUBJECTS_MFA_FACTOR_UNENROLLED_NOTIFICATION` | string |  | Subject for the MFA-unenrolled notification. |  |
| `GOTRUE_MAILER_SUBJECTS_PASSWORD_CHANGED_NOTIFICATION` | string |  | Subject for the password-changed notification. |  |
| `GOTRUE_MAILER_SUBJECTS_PHONE_CHANGED_NOTIFICATION` | string |  | Subject for the phone-changed notification. |  |
| `GOTRUE_MAILER_SUBJECTS_REAUTHENTICATION` | string |  | Subject for the reauthentication email. |  |
| `GOTRUE_MAILER_SUBJECTS_RECOVERY` | string |  | Subject for the password-recovery email. |  |
| `GOTRUE_MAILER_TEMPLATES_CONFIRMATION` | string |  | URL to the confirmation email template. |  |
| `GOTRUE_MAILER_TEMPLATES_EMAIL_CHANGE` | string |  | URL to the email-change email template. |  |
| `GOTRUE_MAILER_TEMPLATES_EMAIL_CHANGED_NOTIFICATION` | string |  | URL to the email-changed notification template. |  |
| `GOTRUE_MAILER_TEMPLATES_IDENTITY_LINKED_NOTIFICATION` | string |  | URL to the identity-linked notification template. |  |
| `GOTRUE_MAILER_TEMPLATES_IDENTITY_UNLINKED_NOTIFICATION` | string |  | URL to the identity-unlinked notification template. |  |
| `GOTRUE_MAILER_TEMPLATES_INVITE` | string |  | URL to the invite email template. |  |
| `GOTRUE_MAILER_TEMPLATES_MAGIC_LINK` | string |  | URL to the magic-link email template. |  |
| `GOTRUE_MAILER_TEMPLATES_MFA_FACTOR_ENROLLED_NOTIFICATION` | string |  | URL to the MFA-enrolled notification template. |  |
| `GOTRUE_MAILER_TEMPLATES_MFA_FACTOR_UNENROLLED_NOTIFICATION` | string |  | URL to the MFA-unenrolled notification template. |  |
| `GOTRUE_MAILER_TEMPLATES_PASSWORD_CHANGED_NOTIFICATION` | string |  | URL to the password-changed notification template. |  |
| `GOTRUE_MAILER_TEMPLATES_PHONE_CHANGED_NOTIFICATION` | string |  | URL to the phone-changed notification template. |  |
| `GOTRUE_MAILER_TEMPLATES_REAUTHENTICATION` | string |  | URL to the reauthentication email template. |  |
| `GOTRUE_MAILER_TEMPLATES_RECOVERY` | string |  | URL to the password-recovery email template. |  |
| `GOTRUE_MAILER_URLPATHS_CONFIRMATION` | string | Both | URL path appended to the email confirmation link. | Default: `/verify` |
| `GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE` | string | Both | URL path appended to the email-change link. | Default: `/verify` |
| `GOTRUE_MAILER_URLPATHS_EMAIL_CHANGED_NOTIFICATION` | string |  | URL path for the email-changed notification link. |  |
| `GOTRUE_MAILER_URLPATHS_IDENTITY_LINKED_NOTIFICATION` | string |  | URL path for the identity-linked notification link. |  |
| `GOTRUE_MAILER_URLPATHS_IDENTITY_UNLINKED_NOTIFICATION` | string |  | URL path for the identity-unlinked notification link. |  |
| `GOTRUE_MAILER_URLPATHS_INVITE` | string | Both | URL path appended to the invite link. | Default: `/verify` |
| `GOTRUE_MAILER_URLPATHS_MAGIC_LINK` | string |  | URL path for the magic-link redirect. |  |
| `GOTRUE_MAILER_URLPATHS_MFA_FACTOR_ENROLLED_NOTIFICATION` | string |  | URL path for the MFA-enrolled notification link. |  |
| `GOTRUE_MAILER_URLPATHS_MFA_FACTOR_UNENROLLED_NOTIFICATION` | string |  | URL path for the MFA-unenrolled notification link. |  |
| `GOTRUE_MAILER_URLPATHS_PASSWORD_CHANGED_NOTIFICATION` | string |  | URL path for the password-changed notification link. |  |
| `GOTRUE_MAILER_URLPATHS_PHONE_CHANGED_NOTIFICATION` | string |  | URL path for the phone-changed notification link. |  |
| `GOTRUE_MAILER_URLPATHS_REAUTHENTICATION` | string |  | URL path for the reauthentication link. |  |
| `GOTRUE_MAILER_URLPATHS_RECOVERY` | string | Both | URL path appended to the recovery link. | Default: `/verify` |

### External OAuth providers

The fields below are repeated for each provider. Substitute `<PROVIDER>` with one of: `APPLE`, `AZURE`, `BITBUCKET`, `DISCORD`, `FACEBOOK`, `FIGMA`, `FLY`, `GITHUB`, `GITLAB`, `GOOGLE`, `KAKAO`, `KEYCLOAK`, `LINKEDIN`, `LINKEDIN_OIDC`, `NOTION`, `SLACK`, `SLACK_OIDC`, `SNAPCHAT`, `SPOTIFY`, `TWITCH`, `TWITTER`, `VERCEL_MARKETPLACE`, `WORKOS`, `X`, `ZOOM`. Each provider supports: `_ENABLED`, `_CLIENT_ID`, `_SECRET`, `_REDIRECT_URI`, `_URL`, `_API_URL`, `_SKIP_NONCE_CHECK`, `_EMAIL_OPTIONAL`.

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOTRUE_EXTERNAL_ALLOWED_ID_TOKEN_ISSUERS` | string (CSV) |  | Additional issuers accepted when verifying external ID tokens. | Defaults include `https://appleid.apple.com`, `https://accounts.google.com` |
| `GOTRUE_EXTERNAL_APPLE_API_URL` | URL |  | Override Apple OAuth API endpoint. |  |
| `GOTRUE_EXTERNAL_APPLE_CLIENT_ID` | string (CSV) | CLI | Apple OAuth client ID(s). | Comma-separated; the first ID is used for the OAuth flow, all are accepted as ID token audiences |
| `GOTRUE_EXTERNAL_APPLE_EMAIL_OPTIONAL` | boolean | CLI | Allow accounts without an email from Apple. |  |
| `GOTRUE_EXTERNAL_APPLE_ENABLED` | boolean | CLI | Enable the Apple provider. |  |
| `GOTRUE_EXTERNAL_APPLE_REDIRECT_URI` | URL | CLI | Override redirect URI for Apple. |  |
| `GOTRUE_EXTERNAL_APPLE_SECRET` | string | CLI | Apple OAuth client secret. |  |
| `GOTRUE_EXTERNAL_APPLE_SKIP_NONCE_CHECK` | boolean | CLI | Skip OIDC nonce check for Apple. |  |
| `GOTRUE_EXTERNAL_APPLE_URL` | URL |  | Override Apple OAuth base URL. |  |
| `GOTRUE_EXTERNAL_AZURE_API_URL` | URL |  | Override Azure API endpoint. |  |
| `GOTRUE_EXTERNAL_AZURE_CLIENT_ID` | string (CSV) | Self-hosted | Azure OAuth client ID(s). | Comma-separated; the first ID is used for the OAuth flow, all are accepted as ID token audiences. Commented out in compose |
| `GOTRUE_EXTERNAL_AZURE_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from Azure. |  |
| `GOTRUE_EXTERNAL_AZURE_ENABLED` | boolean | Self-hosted | Enable the Azure provider. | Commented out in compose |
| `GOTRUE_EXTERNAL_AZURE_REDIRECT_URI` | URL | Self-hosted | Override redirect URI for Azure. | Commented out in compose |
| `GOTRUE_EXTERNAL_AZURE_SECRET` | string | Self-hosted | Azure OAuth client secret. | Commented out in compose |
| `GOTRUE_EXTERNAL_AZURE_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for Azure. |  |
| `GOTRUE_EXTERNAL_AZURE_URL` | URL |  | Override Azure OAuth base URL. |  |
| `GOTRUE_EXTERNAL_BITBUCKET_API_URL` | URL |  | Override Bitbucket API endpoint. |  |
| `GOTRUE_EXTERNAL_BITBUCKET_CLIENT_ID` | string |  | Bitbucket OAuth client ID. |  |
| `GOTRUE_EXTERNAL_BITBUCKET_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from Bitbucket. |  |
| `GOTRUE_EXTERNAL_BITBUCKET_ENABLED` | boolean |  | Enable the Bitbucket provider. |  |
| `GOTRUE_EXTERNAL_BITBUCKET_REDIRECT_URI` | URL |  | Override redirect URI for Bitbucket. |  |
| `GOTRUE_EXTERNAL_BITBUCKET_SECRET` | string |  | Bitbucket OAuth client secret. |  |
| `GOTRUE_EXTERNAL_BITBUCKET_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for Bitbucket. |  |
| `GOTRUE_EXTERNAL_BITBUCKET_URL` | URL |  | Override Bitbucket OAuth base URL. |  |
| `GOTRUE_EXTERNAL_DISCORD_API_URL` | URL |  | Override Discord API endpoint. |  |
| `GOTRUE_EXTERNAL_DISCORD_CLIENT_ID` | string |  | Discord OAuth client ID. |  |
| `GOTRUE_EXTERNAL_DISCORD_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from Discord. |  |
| `GOTRUE_EXTERNAL_DISCORD_ENABLED` | boolean |  | Enable the Discord provider. |  |
| `GOTRUE_EXTERNAL_DISCORD_REDIRECT_URI` | URL |  | Override redirect URI for Discord. |  |
| `GOTRUE_EXTERNAL_DISCORD_SECRET` | string |  | Discord OAuth client secret. |  |
| `GOTRUE_EXTERNAL_DISCORD_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for Discord. |  |
| `GOTRUE_EXTERNAL_DISCORD_URL` | URL |  | Override Discord OAuth base URL. |  |
| `GOTRUE_EXTERNAL_EMAIL_AUTHORIZED_ADDRESSES` | string (CSV) |  | Restrict email signup to a list of allowed addresses/domains. |  |
| `GOTRUE_EXTERNAL_EMAIL_ENABLED` | boolean | Both | Enable email/password authentication. When disabled, OAuth providers can still be used to sign up / sign in. | Default: `true` |
| `GOTRUE_EXTERNAL_EMAIL_MAGIC_LINK_ENABLED` | boolean |  | Enable email magic links. | Default: `true` |
| `GOTRUE_EXTERNAL_FACEBOOK_API_URL` | URL |  | Override Facebook API endpoint. |  |
| `GOTRUE_EXTERNAL_FACEBOOK_CLIENT_ID` | string (CSV) |  | Facebook OAuth client ID(s). | Comma-separated; the first ID is used for the OAuth flow, all are accepted as ID token audiences |
| `GOTRUE_EXTERNAL_FACEBOOK_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from Facebook. |  |
| `GOTRUE_EXTERNAL_FACEBOOK_ENABLED` | boolean |  | Enable the Facebook provider. |  |
| `GOTRUE_EXTERNAL_FACEBOOK_REDIRECT_URI` | URL |  | Override redirect URI for Facebook. |  |
| `GOTRUE_EXTERNAL_FACEBOOK_SECRET` | string |  | Facebook OAuth client secret. |  |
| `GOTRUE_EXTERNAL_FACEBOOK_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for Facebook. |  |
| `GOTRUE_EXTERNAL_FACEBOOK_URL` | URL |  | Override Facebook OAuth base URL. |  |
| `GOTRUE_EXTERNAL_FIGMA_API_URL` | URL |  | Override Figma API endpoint. |  |
| `GOTRUE_EXTERNAL_FIGMA_CLIENT_ID` | string |  | Figma OAuth client ID. |  |
| `GOTRUE_EXTERNAL_FIGMA_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from Figma. |  |
| `GOTRUE_EXTERNAL_FIGMA_ENABLED` | boolean |  | Enable the Figma provider. |  |
| `GOTRUE_EXTERNAL_FIGMA_REDIRECT_URI` | URL |  | Override redirect URI for Figma. |  |
| `GOTRUE_EXTERNAL_FIGMA_SECRET` | string |  | Figma OAuth client secret. |  |
| `GOTRUE_EXTERNAL_FIGMA_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for Figma. |  |
| `GOTRUE_EXTERNAL_FIGMA_URL` | URL |  | Override Figma OAuth base URL. |  |
| `GOTRUE_EXTERNAL_FLOW_STATE_EXPIRY_DURATION` | string (duration) |  | Lifetime of the PKCE flow state. | Default: `5m` (minimum enforced) |
| `GOTRUE_EXTERNAL_FLY_API_URL` | URL |  | Override Fly.io API endpoint. |  |
| `GOTRUE_EXTERNAL_FLY_CLIENT_ID` | string |  | Fly.io OAuth client ID. |  |
| `GOTRUE_EXTERNAL_FLY_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from Fly.io. |  |
| `GOTRUE_EXTERNAL_FLY_ENABLED` | boolean |  | Enable the Fly.io provider. |  |
| `GOTRUE_EXTERNAL_FLY_REDIRECT_URI` | URL |  | Override redirect URI for Fly.io. |  |
| `GOTRUE_EXTERNAL_FLY_SECRET` | string |  | Fly.io OAuth client secret. |  |
| `GOTRUE_EXTERNAL_FLY_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for Fly.io. |  |
| `GOTRUE_EXTERNAL_FLY_URL` | URL |  | Override Fly.io OAuth base URL. |  |
| `GOTRUE_EXTERNAL_GITHUB_API_URL` | URL |  | Override GitHub API endpoint. |  |
| `GOTRUE_EXTERNAL_GITHUB_CLIENT_ID` | string | Self-hosted | GitHub OAuth client ID. | Commented out in compose |
| `GOTRUE_EXTERNAL_GITHUB_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from GitHub. |  |
| `GOTRUE_EXTERNAL_GITHUB_ENABLED` | boolean | Self-hosted | Enable the GitHub provider. | Commented out in compose |
| `GOTRUE_EXTERNAL_GITHUB_REDIRECT_URI` | URL | Self-hosted | Override redirect URI for GitHub. | Commented out in compose |
| `GOTRUE_EXTERNAL_GITHUB_SECRET` | string | Self-hosted | GitHub OAuth client secret. | Commented out in compose |
| `GOTRUE_EXTERNAL_GITHUB_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for GitHub. |  |
| `GOTRUE_EXTERNAL_GITHUB_URL` | URL |  | Override GitHub OAuth base URL. |  |
| `GOTRUE_EXTERNAL_GITLAB_API_URL` | URL |  | Override GitLab API endpoint. |  |
| `GOTRUE_EXTERNAL_GITLAB_CLIENT_ID` | string |  | GitLab OAuth client ID. |  |
| `GOTRUE_EXTERNAL_GITLAB_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from GitLab. |  |
| `GOTRUE_EXTERNAL_GITLAB_ENABLED` | boolean |  | Enable the GitLab provider. |  |
| `GOTRUE_EXTERNAL_GITLAB_REDIRECT_URI` | URL |  | Override redirect URI for GitLab. |  |
| `GOTRUE_EXTERNAL_GITLAB_SECRET` | string |  | GitLab OAuth client secret. |  |
| `GOTRUE_EXTERNAL_GITLAB_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for GitLab. |  |
| `GOTRUE_EXTERNAL_GITLAB_URL` | URL |  | Override GitLab OAuth base URL. |  |
| `GOTRUE_EXTERNAL_GOOGLE_API_URL` | URL |  | Override Google API endpoint. |  |
| `GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID` | string (CSV) | Self-hosted | Google OAuth client ID(s). | Comma-separated; the first ID is used for the OAuth flow, all are accepted as ID token audiences. Commented out in compose |
| `GOTRUE_EXTERNAL_GOOGLE_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from Google. |  |
| `GOTRUE_EXTERNAL_GOOGLE_ENABLED` | boolean | Self-hosted | Enable the Google provider. | Commented out in compose |
| `GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI` | URL | Self-hosted | Override redirect URI for Google. | Commented out in compose |
| `GOTRUE_EXTERNAL_GOOGLE_SECRET` | string | Self-hosted | Google OAuth client secret. | Commented out in compose |
| `GOTRUE_EXTERNAL_GOOGLE_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for Google. |  |
| `GOTRUE_EXTERNAL_GOOGLE_URL` | URL |  | Override Google OAuth base URL. |  |
| `GOTRUE_EXTERNAL_IOS_BUNDLE_ID` | string |  | Apple iOS bundle ID for the Apple provider. |  |
| `GOTRUE_EXTERNAL_KAKAO_API_URL` | URL |  | Override Kakao API endpoint. |  |
| `GOTRUE_EXTERNAL_KAKAO_CLIENT_ID` | string (CSV) |  | Kakao OAuth client ID(s). | Comma-separated; the first ID is used for the OAuth flow, all are accepted as ID token audiences |
| `GOTRUE_EXTERNAL_KAKAO_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from Kakao. |  |
| `GOTRUE_EXTERNAL_KAKAO_ENABLED` | boolean |  | Enable the Kakao provider. |  |
| `GOTRUE_EXTERNAL_KAKAO_REDIRECT_URI` | URL |  | Override redirect URI for Kakao. |  |
| `GOTRUE_EXTERNAL_KAKAO_SECRET` | string |  | Kakao OAuth client secret. |  |
| `GOTRUE_EXTERNAL_KAKAO_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for Kakao. |  |
| `GOTRUE_EXTERNAL_KAKAO_URL` | URL |  | Override Kakao OAuth base URL. |  |
| `GOTRUE_EXTERNAL_KEYCLOAK_API_URL` | URL |  | Override Keycloak API endpoint. |  |
| `GOTRUE_EXTERNAL_KEYCLOAK_CLIENT_ID` | string (CSV) |  | Keycloak OAuth client ID(s). | Comma-separated; the first ID is used for the OAuth flow, all are accepted as ID token audiences |
| `GOTRUE_EXTERNAL_KEYCLOAK_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from Keycloak. |  |
| `GOTRUE_EXTERNAL_KEYCLOAK_ENABLED` | boolean |  | Enable the Keycloak provider. |  |
| `GOTRUE_EXTERNAL_KEYCLOAK_REDIRECT_URI` | URL |  | Override redirect URI for Keycloak. |  |
| `GOTRUE_EXTERNAL_KEYCLOAK_SECRET` | string |  | Keycloak OAuth client secret. |  |
| `GOTRUE_EXTERNAL_KEYCLOAK_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for Keycloak. |  |
| `GOTRUE_EXTERNAL_KEYCLOAK_URL` | URL |  | Override Keycloak OAuth base URL (realm URL). |  |
| `GOTRUE_EXTERNAL_LINKEDIN_API_URL` | URL |  | Override LinkedIn API endpoint. |  |
| `GOTRUE_EXTERNAL_LINKEDIN_CLIENT_ID` | string |  | LinkedIn OAuth client ID. |  |
| `GOTRUE_EXTERNAL_LINKEDIN_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from LinkedIn. |  |
| `GOTRUE_EXTERNAL_LINKEDIN_ENABLED` | boolean |  | Enable the legacy LinkedIn provider. |  |
| `GOTRUE_EXTERNAL_LINKEDIN_OIDC_API_URL` | URL |  | Override LinkedIn OIDC API endpoint. |  |
| `GOTRUE_EXTERNAL_LINKEDIN_OIDC_CLIENT_ID` | string |  | LinkedIn OIDC client ID. |  |
| `GOTRUE_EXTERNAL_LINKEDIN_OIDC_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from LinkedIn OIDC. |  |
| `GOTRUE_EXTERNAL_LINKEDIN_OIDC_ENABLED` | boolean |  | Enable the LinkedIn OIDC provider. |  |
| `GOTRUE_EXTERNAL_LINKEDIN_OIDC_REDIRECT_URI` | URL |  | Override redirect URI for LinkedIn OIDC. |  |
| `GOTRUE_EXTERNAL_LINKEDIN_OIDC_SECRET` | string |  | LinkedIn OIDC client secret. |  |
| `GOTRUE_EXTERNAL_LINKEDIN_OIDC_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for LinkedIn OIDC. |  |
| `GOTRUE_EXTERNAL_LINKEDIN_OIDC_URL` | URL |  | Override LinkedIn OIDC base URL. |  |
| `GOTRUE_EXTERNAL_LINKEDIN_REDIRECT_URI` | URL |  | Override redirect URI for LinkedIn. |  |
| `GOTRUE_EXTERNAL_LINKEDIN_SECRET` | string |  | LinkedIn OAuth client secret. |  |
| `GOTRUE_EXTERNAL_LINKEDIN_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for LinkedIn. |  |
| `GOTRUE_EXTERNAL_LINKEDIN_URL` | URL |  | Override LinkedIn OAuth base URL. |  |
| `GOTRUE_EXTERNAL_NOTION_API_URL` | URL |  | Override Notion API endpoint. |  |
| `GOTRUE_EXTERNAL_NOTION_CLIENT_ID` | string |  | Notion OAuth client ID. |  |
| `GOTRUE_EXTERNAL_NOTION_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from Notion. |  |
| `GOTRUE_EXTERNAL_NOTION_ENABLED` | boolean |  | Enable the Notion provider. |  |
| `GOTRUE_EXTERNAL_NOTION_REDIRECT_URI` | URL |  | Override redirect URI for Notion. |  |
| `GOTRUE_EXTERNAL_NOTION_SECRET` | string |  | Notion OAuth client secret. |  |
| `GOTRUE_EXTERNAL_NOTION_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for Notion. |  |
| `GOTRUE_EXTERNAL_NOTION_URL` | URL |  | Override Notion OAuth base URL. |  |
| `GOTRUE_EXTERNAL_OIDC_PROVIDER_CACHE_TTL` | string (duration) |  | Cache lifetime for OIDC discovery documents. | Default: `1h` |
| `GOTRUE_EXTERNAL_REDIRECTURL` | URL |  | Where users are sent after an OAuth sign-in completes or fails. When set, it's used instead of the request's `redirect_to` and `SITE_URL`. | No underscore between `REDIRECT` and `URL` (the field isn't split into words) |
| `GOTRUE_EXTERNAL_SKIP_NONCE_CHECK` | string | Self-hosted | Listed (commented) in compose but does not map to a configuration field. | Commented out in compose; no effect - use per-provider `*_SKIP_NONCE_CHECK` |
| `GOTRUE_EXTERNAL_SLACK_API_URL` | URL |  | Override Slack API endpoint. |  |
| `GOTRUE_EXTERNAL_SLACK_CLIENT_ID` | string |  | Legacy Slack OAuth client ID. |  |
| `GOTRUE_EXTERNAL_SLACK_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from Slack. |  |
| `GOTRUE_EXTERNAL_SLACK_ENABLED` | boolean |  | Enable the legacy Slack provider. | Prefer `SLACK_OIDC` |
| `GOTRUE_EXTERNAL_SLACK_OIDC_API_URL` | URL |  | Override Slack OIDC API endpoint. |  |
| `GOTRUE_EXTERNAL_SLACK_OIDC_CLIENT_ID` | string |  | Slack OIDC client ID. |  |
| `GOTRUE_EXTERNAL_SLACK_OIDC_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from Slack OIDC. |  |
| `GOTRUE_EXTERNAL_SLACK_OIDC_ENABLED` | boolean |  | Enable the Slack OIDC provider. |  |
| `GOTRUE_EXTERNAL_SLACK_OIDC_REDIRECT_URI` | URL |  | Override redirect URI for Slack OIDC. |  |
| `GOTRUE_EXTERNAL_SLACK_OIDC_SECRET` | string |  | Slack OIDC client secret. |  |
| `GOTRUE_EXTERNAL_SLACK_OIDC_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for Slack OIDC. |  |
| `GOTRUE_EXTERNAL_SLACK_OIDC_URL` | URL |  | Override Slack OIDC base URL. |  |
| `GOTRUE_EXTERNAL_SLACK_REDIRECT_URI` | URL |  | Override redirect URI for Slack. |  |
| `GOTRUE_EXTERNAL_SLACK_SECRET` | string |  | Legacy Slack OAuth client secret. |  |
| `GOTRUE_EXTERNAL_SLACK_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for Slack. |  |
| `GOTRUE_EXTERNAL_SLACK_URL` | URL |  | Override Slack OAuth base URL. |  |
| `GOTRUE_EXTERNAL_SNAPCHAT_API_URL` | URL |  | Override Snapchat API endpoint. |  |
| `GOTRUE_EXTERNAL_SNAPCHAT_CLIENT_ID` | string (CSV) |  | Snapchat OAuth client ID(s). | Comma-separated; the first ID is used for the OAuth flow, all are accepted as ID token audiences |
| `GOTRUE_EXTERNAL_SNAPCHAT_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from Snapchat. |  |
| `GOTRUE_EXTERNAL_SNAPCHAT_ENABLED` | boolean |  | Enable the Snapchat provider. |  |
| `GOTRUE_EXTERNAL_SNAPCHAT_REDIRECT_URI` | URL |  | Override redirect URI for Snapchat. |  |
| `GOTRUE_EXTERNAL_SNAPCHAT_SECRET` | string |  | Snapchat OAuth client secret. |  |
| `GOTRUE_EXTERNAL_SNAPCHAT_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for Snapchat. |  |
| `GOTRUE_EXTERNAL_SNAPCHAT_URL` | URL |  | Override Snapchat OAuth base URL. |  |
| `GOTRUE_EXTERNAL_SPOTIFY_API_URL` | URL |  | Override Spotify API endpoint. |  |
| `GOTRUE_EXTERNAL_SPOTIFY_CLIENT_ID` | string |  | Spotify OAuth client ID. |  |
| `GOTRUE_EXTERNAL_SPOTIFY_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from Spotify. |  |
| `GOTRUE_EXTERNAL_SPOTIFY_ENABLED` | boolean |  | Enable the Spotify provider. |  |
| `GOTRUE_EXTERNAL_SPOTIFY_REDIRECT_URI` | URL |  | Override redirect URI for Spotify. |  |
| `GOTRUE_EXTERNAL_SPOTIFY_SECRET` | string |  | Spotify OAuth client secret. |  |
| `GOTRUE_EXTERNAL_SPOTIFY_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for Spotify. |  |
| `GOTRUE_EXTERNAL_SPOTIFY_URL` | URL |  | Override Spotify OAuth base URL. |  |
| `GOTRUE_EXTERNAL_TWITCH_API_URL` | URL |  | Override Twitch API endpoint. |  |
| `GOTRUE_EXTERNAL_TWITCH_CLIENT_ID` | string |  | Twitch OAuth client ID. |  |
| `GOTRUE_EXTERNAL_TWITCH_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from Twitch. |  |
| `GOTRUE_EXTERNAL_TWITCH_ENABLED` | boolean |  | Enable the Twitch provider. |  |
| `GOTRUE_EXTERNAL_TWITCH_REDIRECT_URI` | URL |  | Override redirect URI for Twitch. |  |
| `GOTRUE_EXTERNAL_TWITCH_SECRET` | string |  | Twitch OAuth client secret. |  |
| `GOTRUE_EXTERNAL_TWITCH_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for Twitch. |  |
| `GOTRUE_EXTERNAL_TWITCH_URL` | URL |  | Override Twitch OAuth base URL. |  |
| `GOTRUE_EXTERNAL_TWITTER_API_URL` | URL |  | Override Twitter API endpoint. |  |
| `GOTRUE_EXTERNAL_TWITTER_CLIENT_ID` | string |  | Twitter OAuth client ID. |  |
| `GOTRUE_EXTERNAL_TWITTER_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from Twitter. |  |
| `GOTRUE_EXTERNAL_TWITTER_ENABLED` | boolean |  | Enable the Twitter provider. |  |
| `GOTRUE_EXTERNAL_TWITTER_REDIRECT_URI` | URL |  | Override redirect URI for Twitter. |  |
| `GOTRUE_EXTERNAL_TWITTER_SECRET` | string |  | Twitter OAuth client secret. |  |
| `GOTRUE_EXTERNAL_TWITTER_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for Twitter. |  |
| `GOTRUE_EXTERNAL_TWITTER_URL` | URL |  | Override Twitter OAuth base URL. |  |
| `GOTRUE_EXTERNAL_VERCEL_MARKETPLACE_API_URL` | URL |  | Override Vercel Marketplace API endpoint. |  |
| `GOTRUE_EXTERNAL_VERCEL_MARKETPLACE_CLIENT_ID` | string (CSV) |  | Vercel Marketplace OAuth client ID(s). | Comma-separated; the first ID is used for the OAuth flow, all are accepted as ID token audiences |
| `GOTRUE_EXTERNAL_VERCEL_MARKETPLACE_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from Vercel Marketplace. |  |
| `GOTRUE_EXTERNAL_VERCEL_MARKETPLACE_ENABLED` | boolean |  | Enable the Vercel Marketplace provider. |  |
| `GOTRUE_EXTERNAL_VERCEL_MARKETPLACE_REDIRECT_URI` | URL |  | Override redirect URI for Vercel Marketplace. |  |
| `GOTRUE_EXTERNAL_VERCEL_MARKETPLACE_SECRET` | string |  | Vercel Marketplace OAuth client secret. |  |
| `GOTRUE_EXTERNAL_VERCEL_MARKETPLACE_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for Vercel Marketplace. |  |
| `GOTRUE_EXTERNAL_VERCEL_MARKETPLACE_URL` | URL |  | Override Vercel Marketplace OAuth base URL. |  |
| `GOTRUE_EXTERNAL_WORKOS_API_URL` | URL |  | Override WorkOS API endpoint. |  |
| `GOTRUE_EXTERNAL_WORKOS_CLIENT_ID` | string |  | WorkOS OAuth client ID. |  |
| `GOTRUE_EXTERNAL_WORKOS_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from WorkOS. |  |
| `GOTRUE_EXTERNAL_WORKOS_ENABLED` | boolean |  | Enable the WorkOS provider. |  |
| `GOTRUE_EXTERNAL_WORKOS_REDIRECT_URI` | URL |  | Override redirect URI for WorkOS. |  |
| `GOTRUE_EXTERNAL_WORKOS_SECRET` | string |  | WorkOS OAuth client secret. |  |
| `GOTRUE_EXTERNAL_WORKOS_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for WorkOS. |  |
| `GOTRUE_EXTERNAL_WORKOS_URL` | URL |  | Override WorkOS OAuth base URL. |  |
| `GOTRUE_EXTERNAL_X_API_URL` | URL |  | Override X (Twitter) API endpoint. |  |
| `GOTRUE_EXTERNAL_X_CLIENT_ID` | string |  | X (Twitter) OAuth client ID. |  |
| `GOTRUE_EXTERNAL_X_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from X. |  |
| `GOTRUE_EXTERNAL_X_ENABLED` | boolean |  | Enable the X (Twitter) provider. |  |
| `GOTRUE_EXTERNAL_X_REDIRECT_URI` | URL |  | Override redirect URI for X. |  |
| `GOTRUE_EXTERNAL_X_SECRET` | string |  | X (Twitter) OAuth client secret. |  |
| `GOTRUE_EXTERNAL_X_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for X. |  |
| `GOTRUE_EXTERNAL_X_URL` | URL |  | Override X (Twitter) OAuth base URL. |  |
| `GOTRUE_EXTERNAL_ZOOM_API_URL` | URL |  | Override Zoom API endpoint. |  |
| `GOTRUE_EXTERNAL_ZOOM_CLIENT_ID` | string |  | Zoom OAuth client ID. |  |
| `GOTRUE_EXTERNAL_ZOOM_EMAIL_OPTIONAL` | boolean |  | Allow accounts without an email from Zoom. |  |
| `GOTRUE_EXTERNAL_ZOOM_ENABLED` | boolean |  | Enable the Zoom provider. |  |
| `GOTRUE_EXTERNAL_ZOOM_REDIRECT_URI` | URL |  | Override redirect URI for Zoom. |  |
| `GOTRUE_EXTERNAL_ZOOM_SECRET` | string |  | Zoom OAuth client secret. |  |
| `GOTRUE_EXTERNAL_ZOOM_SKIP_NONCE_CHECK` | boolean |  | Skip OIDC nonce check for Zoom. |  |
| `GOTRUE_EXTERNAL_ZOOM_URL` | URL |  | Override Zoom OAuth base URL. |  |

### Anonymous

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED` | boolean | Both | Enable anonymous user signup. | Default: `false` |

### Custom OAuth / OAuth Server

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOTRUE_CUSTOM_OAUTH_ENABLED` | boolean |  | Enable user-defined custom OAuth/OIDC providers. | Default: `true` |
| `GOTRUE_CUSTOM_OAUTH_EXTERNAL_URL` | URL |  | Base URL for the callback of custom OAuth/OIDC providers (`<url>/callback`). | Default: `API_EXTERNAL_URL`. An invalid URL stops Auth from starting |
| `GOTRUE_CUSTOM_OAUTH_MAX_PROVIDERS` | integer (count) |  | Maximum number of custom providers allowed. | Default: `0` (unlimited) |
| `GOTRUE_OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION` | boolean | Both | Let OAuth clients register themselves at `/oauth/clients/register` without an API key. | Default: `false`. Commented out in compose |
| `GOTRUE_OAUTH_SERVER_AUTHORIZATION_PATH` | string | Both | Path of the consent page on `SITE_URL`. Auth redirects the browser there with an `authorization_id`. | Required when the OAuth server is enabled. Commented out in compose |
| `GOTRUE_OAUTH_SERVER_AUTHORIZATION_TTL` | string (duration) |  | How long an authorization request stays valid, from the redirect until the client exchanges the code. | Default: `10m` |
| `GOTRUE_OAUTH_SERVER_DEFAULT_SCOPE` | string |  | Scope used when a client doesn't request one. | Default: `email` |
| `GOTRUE_OAUTH_SERVER_ENABLED` | boolean | Both | Enable the OAuth 2.1 server. See [Configure the OAuth 2.1 server](https://supabase.com/docs/guides/self-hosting/self-hosted-oauth-server). | Default: `false`. Commented out in compose |

### Phone / SMS

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOTRUE_EXTERNAL_PHONE_ENABLED` | boolean | Both | Enable phone-based authentication. | Default: `false` |
| `GOTRUE_SMS_AUTOCONFIRM` | boolean | Both | Skip phone verification flow. |  |
| `GOTRUE_SMS_MAX_FREQUENCY` | string (duration) | Both | Minimum interval between SMS messages per phone. | Default: `1m`, commented out in compose |
| `GOTRUE_SMS_MESSAGEBIRD_ACCESS_KEY` | string | CLI | Messagebird API access key. |  |
| `GOTRUE_SMS_MESSAGEBIRD_ORIGINATOR` | string | CLI | Messagebird originator (sender ID). |  |
| `GOTRUE_SMS_OTP_EXP` | integer (seconds) | Both | SMS OTP expiry in seconds. | Default: `60`, commented out in compose |
| `GOTRUE_SMS_OTP_LENGTH` | integer (count) | Both | SMS OTP code length (6-10). | Default: `6`, commented out in compose |
| `GOTRUE_SMS_PROVIDER` | string | Both | SMS provider name (`twilio`, `twilio_verify`, `messagebird`, `textlocal`, `vonage`). | Commented out in compose |
| `GOTRUE_SMS_TEMPLATE` | string | Both | Message template for SMS OTP. | Commented out in compose |
| `GOTRUE_SMS_TEST_OTP` | string (CSV) | Both | Comma-separated `phone:code` pairs of OTP overrides for testing. | Commented out in compose |
| `GOTRUE_SMS_TEST_OTP_VALID_UNTIL` | string |  | Cutoff time after which test OTPs stop being accepted. | RFC 3339, e.g. `2026-12-31T23:59:59Z`. A date-only value stops Auth from starting |
| `GOTRUE_SMS_TEXTLOCAL_API_KEY` | string | CLI | Textlocal API key. |  |
| `GOTRUE_SMS_TEXTLOCAL_SENDER` | string | CLI | Textlocal sender ID. |  |
| `GOTRUE_SMS_TWILIO_ACCOUNT_SID` | string | Both | Twilio account SID. | Commented out in compose |
| `GOTRUE_SMS_TWILIO_AUTH_TOKEN` | string | Both | Twilio auth token. | Commented out in compose |
| `GOTRUE_SMS_TWILIO_CONTENT_SID` | string |  | Twilio content SID (template). |  |
| `GOTRUE_SMS_TWILIO_MESSAGE_SERVICE_SID` | string | Both | Twilio message service SID / phone number. | Commented out in compose |
| `GOTRUE_SMS_TWILIO_VERIFY_ACCOUNT_SID` | string | CLI | Twilio Verify account SID. |  |
| `GOTRUE_SMS_TWILIO_VERIFY_AUTH_TOKEN` | string | CLI | Twilio Verify auth token. |  |
| `GOTRUE_SMS_TWILIO_VERIFY_MESSAGE_SERVICE_SID` | string | CLI | Twilio Verify message service SID. |  |
| `GOTRUE_SMS_VONAGE_API_KEY` | string | CLI | Vonage API key. |  |
| `GOTRUE_SMS_VONAGE_API_SECRET` | string | CLI | Vonage API secret. |  |
| `GOTRUE_SMS_VONAGE_FROM` | string | CLI | Vonage `from` parameter (sender). |  |

### MFA

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOTRUE_MFA_CHALLENGE_EXPIRY_DURATION` | integer (seconds) |  | Lifetime of an MFA challenge (seconds). | Default: `300` |
| `GOTRUE_MFA_FACTOR_EXPIRY_DURATION` | string (duration) |  | Lifetime of an unverified MFA factor. | Default: `300s` |
| `GOTRUE_MFA_MAX_ENROLLED_FACTORS` | integer (count) | Both | Maximum factors a user may enroll. | Default: `10`, commented out in compose |
| `GOTRUE_MFA_MAX_VERIFIED_FACTORS` | integer (count) |  | Maximum verified factors per user. | Default: `10` |
| `GOTRUE_MFA_PHONE_ENROLL_ENABLED` | boolean | Both | Allow enrolling a phone MFA factor. | Default: `false`, commented out in compose |
| `GOTRUE_MFA_PHONE_MAX_FREQUENCY` | string (duration) | CLI | Minimum interval between MFA phone OTPs. | Default: `1m` |
| `GOTRUE_MFA_PHONE_OTP_LENGTH` | integer (count) | CLI | Phone MFA OTP code length. | Default: `6` |
| `GOTRUE_MFA_PHONE_TEMPLATE` | string | CLI | Template string for MFA phone OTP messages. |  |
| `GOTRUE_MFA_PHONE_VERIFY_ENABLED` | boolean | Both | Allow verifying a phone MFA factor. | Default: `false`, commented out in compose |
| `GOTRUE_MFA_RATE_LIMIT_CHALLENGE_AND_VERIFY` | number |  | Rate limit for MFA challenge + verify. | Default: `15` |
| `GOTRUE_MFA_RECOVERY_CODES_CODE_LENGTH` | integer |  | Length of each MFA recovery code (characters). | Default: `16`. Range 13-32, checked when recovery codes are enabled |
| `GOTRUE_MFA_RECOVERY_CODES_COUNT` | integer (count) |  | Number of recovery codes generated per set. | Default: `10`. Range 4-16, checked when recovery codes are enabled |
| `GOTRUE_MFA_RECOVERY_CODES_ENROLL_ENABLED` | boolean |  | Allow generating MFA recovery codes. | Default: `false` |
| `GOTRUE_MFA_RECOVERY_CODES_LOCKOUT_DURATION` | string (duration) |  | How long recovery code verification stays locked after too many failed attempts. | Default: `15m`. Range 1m-24h, checked when recovery codes are enabled |
| `GOTRUE_MFA_RECOVERY_CODES_MAX_VERIFY_ATTEMPTS` | integer (count) |  | Failed recovery code attempts before verification is locked. | Default: `5`. Range 3-15, checked when recovery codes are enabled |
| `GOTRUE_MFA_RECOVERY_CODES_VERIFY_ENABLED` | boolean |  | Allow verifying an MFA recovery code. | Default: `false` |
| `GOTRUE_MFA_TOTP_ENROLL_ENABLED` | boolean | Both | Allow enrolling a TOTP MFA factor. | Default: `true`, commented out in compose |
| `GOTRUE_MFA_TOTP_VERIFY_ENABLED` | boolean | Both | Allow verifying a TOTP MFA factor. | Default: `true`, commented out in compose |
| `GOTRUE_MFA_WEB_AUTHN_ENROLL_ENABLED` | boolean | CLI | Allow enrolling a WebAuthn MFA factor. | Default: `false` |
| `GOTRUE_MFA_WEB_AUTHN_VERIFY_ENABLED` | boolean | CLI | Allow verifying a WebAuthn MFA factor. | Default: `false` |

### WebAuthn / Passkey

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOTRUE_PASSKEY_ENABLED` | boolean | CLI | Enable passkey (passwordless WebAuthn) authentication. | Default: `false` |
| `GOTRUE_PASSKEY_MAX_PASSKEYS_PER_USER` | integer (count) |  | Maximum passkeys a user may register. | Default: `10` |
| `GOTRUE_WEBAUTHN_CHALLENGE_EXPIRY_DURATION` | string (duration) |  | Lifetime of a WebAuthn challenge. | Default: `5m` |
| `GOTRUE_WEBAUTHN_RP_DISPLAY_NAME` | string | CLI | WebAuthn relying party display name. | Required when WebAuthn/Passkey is enabled |
| `GOTRUE_WEBAUTHN_RP_ID` | string | CLI | WebAuthn relying party ID (host). | Required when WebAuthn/Passkey is enabled. Alias of `RP_ID` |
| `RP_ID` | string |  | WebAuthn relying party ID (bare alias). |  |
| `GOTRUE_WEBAUTHN_RP_ORIGINS` | string (CSV) | CLI | Allowed WebAuthn origins (https or http://localhost). | Required when WebAuthn/Passkey is enabled |

### SAML

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOTRUE_SAML_ALLOW_ENCRYPTED_ASSERTIONS` | boolean | Self-hosted | Permit encrypted SAML assertions. | Commented out in compose |
| `GOTRUE_SAML_ENABLED` | boolean | Self-hosted | Enable SAML SSO. | Commented out in compose |
| `GOTRUE_SAML_EXTERNAL_URL` | URL | Self-hosted | External URL used in SAML metadata (defaults to `API_EXTERNAL_URL`). | Commented out in compose |
| `GOTRUE_SAML_PRIVATE_KEY` | string | Self-hosted | Base64-encoded PKCS#1 RSA private key (>= 2048 bits). | Commented out in compose |
| `GOTRUE_SAML_PRIVATE_KEY_NEXT` | string |  | Next SAML key for key rotation, in the same format as `GOTRUE_SAML_PRIVATE_KEY`. Its certificate is published in the SAML metadata next to the current one, and it's tried when decrypting encrypted assertions. | While set, the metadata cache lifetime drops to 60 seconds |
| `GOTRUE_SAML_RATE_LIMIT_ASSERTION` | number | Self-hosted | Rate limit for SAML assertion submissions. | Default: `15`, commented out in compose |
| `GOTRUE_SAML_RELAY_STATE_VALIDITY_PERIOD` | string (duration) | Self-hosted | Lifetime of SAML RelayState. | Default: `2m`, commented out in compose |

### Hooks

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOTRUE_HOOK_AFTER_USER_CREATED_ENABLED` | boolean |  | Enable the after-user-created hook. |  |
| `GOTRUE_HOOK_AFTER_USER_CREATED_SECRETS` | string |  | Standard webhook secrets for after-user-created hook. | Separate multiple secrets with `\|`, not `,` |
| `GOTRUE_HOOK_AFTER_USER_CREATED_URI` | string |  | URI of the after-user-created hook (pg-functions or https). |  |
| `GOTRUE_HOOK_BEFORE_USER_CREATED_ENABLED` | boolean |  | Enable the before-user-created hook. |  |
| `GOTRUE_HOOK_BEFORE_USER_CREATED_SECRETS` | string |  | Standard webhook secrets for the before-user-created hook. | Separate multiple secrets with `\|`, not `,` |
| `GOTRUE_HOOK_BEFORE_USER_CREATED_URI` | string |  | URI of the before-user-created hook. |  |
| `GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_ENABLED` | boolean | Self-hosted | Enable the custom access token hook. | Commented out in compose |
| `GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_SECRETS` | string | Self-hosted | Standard webhook secrets for the custom access token hook. | Separate multiple secrets with `\|`, not `,`. Commented out in compose |
| `GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_URI` | string | Self-hosted | URI of the custom access token hook. | Commented out in compose |
| `GOTRUE_HOOK_MFA_VERIFICATION_ATTEMPT_ENABLED` | boolean | Self-hosted | Enable the MFA verification attempt hook. | Commented out in compose |
| `GOTRUE_HOOK_MFA_VERIFICATION_ATTEMPT_SECRETS` | string |  | Standard webhook secrets for the MFA verification attempt hook. | Separate multiple secrets with `\|`, not `,` |
| `GOTRUE_HOOK_MFA_VERIFICATION_ATTEMPT_URI` | string | Self-hosted | URI of the MFA verification attempt hook. | Commented out in compose |
| `GOTRUE_HOOK_PASSWORD_VERIFICATION_ATTEMPT_ENABLED` | boolean | Self-hosted | Enable the password verification attempt hook. | Commented out in compose |
| `GOTRUE_HOOK_PASSWORD_VERIFICATION_ATTEMPT_SECRETS` | string |  | Standard webhook secrets for the password verification attempt hook. | Separate multiple secrets with `\|`, not `,` |
| `GOTRUE_HOOK_PASSWORD_VERIFICATION_ATTEMPT_URI` | string | Self-hosted | URI of the password verification attempt hook. | Commented out in compose |
| `GOTRUE_HOOK_SEND_EMAIL_ENABLED` | boolean | Self-hosted | Enable the send-email hook. | Commented out in compose |
| `GOTRUE_HOOK_SEND_EMAIL_SECRETS` | string | Self-hosted | Standard webhook secrets for the send-email hook. | Separate multiple secrets with `\|`, not `,`. Commented out in compose |
| `GOTRUE_HOOK_SEND_EMAIL_URI` | string | Self-hosted | URI of the send-email hook. | Commented out in compose |
| `GOTRUE_HOOK_SEND_SMS_ENABLED` | boolean | Self-hosted | Enable the send-SMS hook. | Commented out in compose |
| `GOTRUE_HOOK_SEND_SMS_SECRETS` | string | Self-hosted | Standard webhook secrets for the send-SMS hook. | Separate multiple secrets with `\|`, not `,`. Commented out in compose |
| `GOTRUE_HOOK_SEND_SMS_URI` | string | Self-hosted | URI of the send-SMS hook. | Commented out in compose |

### Rate limits

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOTRUE_RATE_LIMIT_ANONYMOUS_USERS` | number | CLI | Rate limit for anonymous user creation. | Default: `30` per hour |
| `GOTRUE_RATE_LIMIT_EMAIL_SENT` | number | CLI | Rate limit for outgoing emails on `/signup`, `/invite`, `/magiclink`, `/recover`, `/otp`, `/user`. Accepts `n` or `n/duration` (burst). | Default: `30` per hour |
| `GOTRUE_RATE_LIMIT_HEADER` | string |  | HTTP header used to rate-limit the `/token` endpoint (e.g. `X-Forwarded-For`). |  |
| `GOTRUE_RATE_LIMIT_O_AUTH_DYNAMIC_CLIENT_REGISTER` | number |  | Rate limit for OAuth dynamic client registration. | Default: `10` per hour |
| `GOTRUE_RATE_LIMIT_OTP` | number | CLI | Rate limit for OTP endpoints. | Default: `30` per hour |
| `GOTRUE_RATE_LIMIT_PASSKEY` | number |  | Rate limit for passkey endpoints. | Default: `30` per hour |
| `GOTRUE_RATE_LIMIT_SMS_SENT` | number | CLI | Rate limit for outgoing SMS messages. | Default: `30` per hour |
| `GOTRUE_RATE_LIMIT_SSO` | number |  | Rate limit for SSO endpoints. | Default: `30` per hour |
| `GOTRUE_RATE_LIMIT_TOKEN_REFRESH` | number | CLI | Rate limit for token refresh. | Default: `150` per hour |
| `GOTRUE_RATE_LIMIT_VERIFY` | number | CLI | Rate limit for the verify endpoint. | Default: `30` per hour |
| `GOTRUE_RATE_LIMIT_WEB3` | number | CLI | Rate limit for Web3 sign-in. | Default: `30` per hour |

### Sessions

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOTRUE_SESSIONS_ALLOW_LOW_AAL` | string (duration) |  | Time during which a low-AAL session is still accepted. |  |
| `GOTRUE_SESSIONS_INACTIVITY_TIMEOUT` | string (duration) | CLI | Session inactivity timeout. |  |
| `GOTRUE_SESSIONS_SINGLE_PER_USER` | boolean |  | Allow only one active session per user. |  |
| `GOTRUE_SESSIONS_TAGS` | string (CSV) |  | Tags attached to created sessions. |  |
| `GOTRUE_SESSIONS_TIMEBOX` | string (duration) | CLI | Absolute session lifetime. |  |

### Web3

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOTRUE_EXTERNAL_WEB3_ETHEREUM_ENABLED` | boolean | CLI | Enable Ethereum sign-in (Sign-in with Ethereum). | Default: `false` |
| `GOTRUE_EXTERNAL_WEB3_ETHEREUM_MAXIMUM_VALIDITY_DURATION` | string (duration) |  | Max validity of an Ethereum signed message. | Default: `10m` |
| `GOTRUE_EXTERNAL_WEB3_SOLANA_ENABLED` | boolean | CLI | Enable Solana sign-in. | Default: `false` |
| `GOTRUE_EXTERNAL_WEB3_SOLANA_MAXIMUM_VALIDITY_DURATION` | string (duration) |  | Max validity of a Solana signed message. | Default: `10m` |

### Security

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOTRUE_SECURITY_DB_ENCRYPTION_DECRYPTION_KEYS` | string |  | Map of key ID to key, used to decrypt previously encrypted columns. | Format: `key_id:key,key_id:key` |
| `GOTRUE_SECURITY_DB_ENCRYPTION_ENCRYPT` | boolean |  | Enable column-level encryption for new writes. |  |
| `GOTRUE_SECURITY_DB_ENCRYPTION_ENCRYPTION_KEY` | string |  | Active encryption key (256-bit, base64-RawURL-encoded). |  |
| `GOTRUE_SECURITY_DB_ENCRYPTION_ENCRYPTION_KEY_ID` | string |  | ID of the active encryption key. |  |
| `GOTRUE_SECURITY_MANUAL_LINKING_ENABLED` | boolean | CLI | Allow admins to link identities manually. | Default: `false` |
| `GOTRUE_SECURITY_REFRESH_TOKEN_ALGORITHM_VERSION` | integer (count) |  | Refresh token algorithm version (0, 1 or 2). |  |
| `GOTRUE_SECURITY_REFRESH_TOKEN_ALLOW_REUSE` | boolean |  | Allow refresh-token reuse without rotation. |  |
| `GOTRUE_SECURITY_REFRESH_TOKEN_REUSE_INTERVAL` | integer (seconds) | CLI | Grace period (s) during which the immediately-previous refresh token can be reused (supports concurrency / offline retries). Only applies when rotation is enabled. |  |
| `GOTRUE_SECURITY_REFRESH_TOKEN_ROTATION_ENABLED` | boolean | CLI | Rotate refresh tokens on use; detects malicious reuse and revokes the offending token's descendants. | Default: `true` |
| `GOTRUE_SECURITY_REFRESH_TOKEN_UPGRADE_PERCENTAGE` | integer (percent) |  | Percentage of users to upgrade to a newer refresh-token format (0-100). |  |
| `GOTRUE_SECURITY_SB_FORWARDED_FOR_ENABLED` | boolean |  | Trust the `Sb-Forwarded-For` header. Auth parses the leftmost value as an IP address and uses it for IP tracking and rate limiting. | Default: `false` |
| `GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_CURRENT_PASSWORD` | boolean | CLI | Require the current password to change a password. |  |
| `GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_REAUTHENTICATION` | boolean | CLI | Require reauthentication before changing a password. |  |

### CAPTCHA

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOTRUE_SECURITY_CAPTCHA_ENABLED` | boolean | CLI | Enable CAPTCHA protection. | Default: `false` |
| `GOTRUE_SECURITY_CAPTCHA_PROVIDER` | string | CLI | CAPTCHA provider (`hcaptcha` or `turnstile`). | Default: `hcaptcha` |
| `GOTRUE_SECURITY_CAPTCHA_SECRET` | string | CLI | CAPTCHA provider secret. |  |
| `GOTRUE_SECURITY_CAPTCHA_TIMEOUT` | string (duration) |  | HTTP timeout for the CAPTCHA verify call. | Default: `10s` |

### Password

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOTRUE_PASSWORD_HIBP_BLOOM_ENABLED` | boolean |  | Use a local bloom filter for HIBP lookups. |  |
| `GOTRUE_PASSWORD_HIBP_BLOOM_FALSE_POSITIVES` | number (ratio) |  | Target false positive rate for the HIBP bloom filter. | Default: `0.0000099` |
| `GOTRUE_PASSWORD_HIBP_BLOOM_ITEMS` | integer (count) |  | Expected number of items in the HIBP bloom filter. | Default: `100000` |
| `GOTRUE_PASSWORD_HIBP_ENABLED` | boolean |  | Reject pwned passwords using Have I Been Pwned. |  |
| `GOTRUE_PASSWORD_HIBP_FAIL_CLOSED` | boolean |  | Reject requests if the HIBP lookup fails. |  |
| `GOTRUE_PASSWORD_HIBP_USER_AGENT` | string |  | User-Agent sent to the HIBP API. | Default: `https://github.com/supabase/gotrue` |
| `GOTRUE_PASSWORD_MIN_LENGTH` | integer (count) | CLI | Minimum password length. | Default: `6` |
| `GOTRUE_PASSWORD_REQUIRED_CHARACTERS` | string | CLI | Colon-separated character classes; a password must contain at least one character from each set. Escape a literal `:` with `\`. |  |

### CORS / Audit log

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOTRUE_AUDIT_LOG_DISABLE_POSTGRES` | boolean |  | Disable Postgres-backed audit log writes. | Default: `false` |
| `GOTRUE_CORS_ALLOWED_HEADERS` | string (CSV) |  | Additional headers appended to the CORS allow-list. |  |

### Logging

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOTRUE_LOG_DISABLE_COLORS` | boolean |  | Disable ANSI color in log output. |  |
| `GOTRUE_LOG_FILE` | path |  | Path to a file to write logs to. |  |
| `GOTRUE_LOG_LEVEL` | string |  | Logger level (`panic`, `fatal`, `error`, `warn`, `info`, `debug`). |  |
| `GOTRUE_LOG_QUOTE_EMPTY_FIELDS` | boolean |  | Quote empty log field values. |  |
| `GOTRUE_LOG_SQL` | string |  | SQL logger configuration. |  |
| `GOTRUE_LOG_TSFORMAT` | string |  | Timestamp format string for log output. |  |

### Profiler / Tracing / Metrics

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOTRUE_METRICS_ENABLED` | boolean |  | Enable metrics export. |  |
| `GOTRUE_METRICS_EXPORTER` | string |  | Metrics exporter (`opentelemetry` or `prometheus`). | Default: `opentelemetry` |
| `GOTRUE_METRICS_OTEL_EXPORTER_OTLP_PROTOCOL` | string |  | OTLP protocol for metrics. | Default: `http/protobuf`. Alias of `OTEL_EXPORTER_OTLP_PROTOCOL` |
| `GOTRUE_METRICS_OTEL_EXPORTER_PROMETHEUS_HOST` | string |  | Bind host for the Prometheus exporter. | Default: `0.0.0.0`. Alias of `OTEL_EXPORTER_PROMETHEUS_HOST` |
| `GOTRUE_METRICS_OTEL_EXPORTER_PROMETHEUS_PORT` | string |  | Bind port for the Prometheus exporter. | Default: `9100`. Alias of `OTEL_EXPORTER_PROMETHEUS_PORT` |
| `GOTRUE_PROFILER_ENABLED` | boolean |  | Expose the Go pprof HTTP endpoint. | Default: `false` |
| `GOTRUE_PROFILER_HOST` | string |  | Bind host for the profiler endpoint. | Default: `localhost` |
| `GOTRUE_PROFILER_PORT` | string |  | Bind port for the profiler endpoint. | Default: `9998` |
| `GOTRUE_TRACING_ENABLED` | boolean |  | Enable distributed tracing. |  |
| `GOTRUE_TRACING_EXPORTER` | string |  | Tracing exporter (`opentelemetry`). | Default: `opentelemetry` |
| `GOTRUE_TRACING_HOST` | string |  | OpenTelemetry collector host. |  |
| `GOTRUE_TRACING_OTEL_EXPORTER_OTLP_PROTOCOL` | string |  | OTLP protocol for tracing. | Default: `http/protobuf`. Alias of `OTEL_EXPORTER_OTLP_PROTOCOL` |
| `GOTRUE_TRACING_PORT` | string |  | OpenTelemetry collector port. |  |
| `GOTRUE_TRACING_SERVICE_NAME` | string |  | Service name reported in traces. | Default: `gotrue` |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | string |  | OTLP protocol (bare alias, applies to metrics and tracing). | Default: `http/protobuf` |
| `OTEL_EXPORTER_PROMETHEUS_HOST` | string |  | Prometheus host (bare alias). | Default: `0.0.0.0` |
| `OTEL_EXPORTER_PROMETHEUS_PORT` | string |  | Prometheus port (bare alias). | Default: `9100` |

### Config reloading

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOTRUE_RELOADING_GRACE_PERIOD_INTERVAL` | string (duration) |  | Idle period before processing a config reload (debounce). | Default: `5s` |
| `GOTRUE_RELOADING_NOTIFY_ENABLED` | boolean |  | Use filesystem notifications to detect config changes. | Default: `true` |
| `GOTRUE_RELOADING_POLLER_INTERVAL` | string (duration) |  | Polling interval when notifications are disabled. | Default: `10s` |
| `GOTRUE_RELOADING_POLLERENABLED` | boolean |  | Enable filesystem polling for config changes (name is intentionally unsplit). | Default: `false` |
| `GOTRUE_RELOADING_SIGNAL_ENABLED` | boolean |  | Trigger a config reload on receiving a Unix signal. | Default: `false` |
| `GOTRUE_RELOADING_SIGNAL_NUMBER` | integer (count) |  | Unix signal number to listen for. | Default: `10` (SIGUSR1) |

### Other

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOTRUE_INDEX_WORKER_ENSURE_USER_SEARCH_INDEXES_EXIST` | boolean |  | Always create user-search indexes on startup. | Default: `false` |
| `GOTRUE_INDEX_WORKER_MAX_USERS_THRESHOLD` | integer (count) |  | Create user-search indexes only if user count is at or below this threshold. | Default: `0` (disabled) |
| `GOTRUE_INTERNAL_HTTP_TIMEOUT` | string (duration) |  | HTTP client timeout used by external OAuth and SMS provider calls. | Read via `os.Getenv`, not envconfig |
| `GOTRUE_OPERATOR_TOKEN` | string |  | Bearer token required for operator/admin endpoints. |  |

---


## PostgREST

> PostgREST's upstream documentation at [postgrest.org](https://postgrest.org/en/stable/references/configuration.html) covers each variable with prose context - security rationale, interaction notes, examples. The rows below stay reference-style; for backstory and detailed semantics, see the upstream docs.

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `PGRST_ADMIN_SERVER_HOST` | string | Self-hosted | Hostname for the PostgREST admin server. | Defaults to `server-host` value |
| `PGRST_ADMIN_SERVER_PORT` | integer | Both | Port for the PostgREST admin server. The admin server is disabled unless a port is set, and it must differ from `PGRST_SERVER_PORT`. | No default (admin server disabled when unset) |
| `PGRST_APP_SETTINGS_*` | string | Self-hosted | Arbitrary settings exposed to PostgreSQL via `current_setting('app.settings.<name>')`. The suffix after `PGRST_APP_SETTINGS_` becomes the setting name (case-insensitive). | Used for `PGRST_APP_SETTINGS_JWT_EXP` in self-hosted |
| `PGRST_DB_AGGREGATES_ENABLED` | boolean | | Allows the use of aggregate functions (`max`, `sum`, etc.) in queries. Disabled by default due to potential performance risks. | Default: `false` |
| `PGRST_DB_ANON_ROLE` | string | Both | Database role used for unauthenticated requests. When unset, anonymous access is blocked. | No default |
| `PGRST_DB_CHANNEL` | string | | Postgres `NOTIFY` channel name used for schema cache and config reloading. | Default: `pgrst` |
| `PGRST_DB_CHANNEL_ENABLED` | boolean | | Enables the Postgres `NOTIFY` listener channel. Disable when running behind a transaction-pooling connection pooler. | Default: `true` |
| `PGRST_DB_CONFIG` | boolean | | Enables loading in-database configuration via `db-pre-config` and role settings. | Default: `true` |
| `PGRST_DB_EXTRA_SEARCH_PATH` | string (CSV) | Both | Comma-separated list of extra schemas added to the `search_path` of every request. Schemas listed here do not get API endpoints. | Default: `public` |
| `PGRST_DB_HOISTED_TX_SETTINGS` | string (CSV) | | Comma-separated list of settings allowed to be applied as transaction-scoped function settings. | Default: `statement_timeout,plan_filter.statement_cost_limit,default_transaction_isolation` |
| `PGRST_DB_MAX_ROWS` | integer (count) | Both | Hard limit on the number of rows PostgREST returns for any table, view, or function; bounds payload size against accidental or malicious queries. | No default (unlimited); alias `PGRST_MAX_ROWS` |
| `PGRST_DB_PLAN_ENABLED` | boolean | | Allows clients to request the query execution plan with `Accept: application/vnd.pgrst.plan`. | Default: `false` |
| `PGRST_DB_POOL` | integer (count) | CLI | Maximum number of database connections kept open in PostgREST's pool. | Default: `10` |
| `PGRST_DB_POOL_ACQUISITION_TIMEOUT` | integer (seconds) | | Time in seconds a request waits for a free connection from the pool. | Default: `10` |
| `PGRST_DB_POOL_AUTOMATIC_RECOVERY` | boolean | | Enables automatic retrying on connection loss. When disabled, PostgREST terminates after losing the database connection. | Default: `true` |
| `PGRST_DB_POOL_MAX_IDLETIME` | integer (seconds) | | Time in seconds after which idle pool connections are closed. | Default: `30`; alias `PGRST_DB_POOL_TIMEOUT` |
| `PGRST_DB_POOL_MAX_LIFETIME` | integer (seconds) | | Maximum lifetime in seconds of a connection in the pool before it is recycled. | Default: `1800` |
| `PGRST_DB_POOL_TIMEOUT` | integer (seconds) | | Deprecated alias for `PGRST_DB_POOL_MAX_IDLETIME`. | Deprecated; use `PGRST_DB_POOL_MAX_IDLETIME` |
| `PGRST_DB_PRE_CONFIG` | string | | Schema-qualified function name used for in-database configuration. | No default |
| `PGRST_DB_PRE_REQUEST` | string | | Schema-qualified function executed right after transaction settings are set, on every request. | No default; alias `PGRST_PRE_REQUEST` |
| `PGRST_DB_PREPARED_STATEMENTS` | boolean | | Enables prepared statements. Disable only when running behind an external connection pooler in transaction pooling mode. | Default: `true` |
| `PGRST_DB_ROOT_SPEC` | string | | Schema-qualified function used to override the OpenAPI response at the API root. | No default; alias `PGRST_ROOT_SPEC` |
| `PGRST_DB_SCHEMA` | string (CSV) | | Deprecated alias for `PGRST_DB_SCHEMAS`. | Deprecated; use `PGRST_DB_SCHEMAS` |
| `PGRST_DB_SCHEMAS` | string (CSV) | Both | Comma-separated list of database schemas exposed by the REST API. `pg_catalog` and `information_schema` are not allowed. | Default: `public` |
| `PGRST_DB_TX_END` | enum | | Controls how database transactions are terminated. Allowed values: `commit`, `commit-allow-override`, `rollback`, `rollback-allow-override`. | Default: `commit` |
| `PGRST_DB_URI` | URL | Both | PostgreSQL connection string (URI or key/value). Prefix with `@` to load from a file. Defaults read libpq env vars. | Default: `postgresql://`; required |
| `PGRST_DB_USE_LEGACY_GUCS` | boolean | Self-hosted | Toggles legacy text-based GUCs versus JSON GUCs for request context. | Deprecated; removed in PostgREST v12 (still set in self-hosted docker-compose) |
| `PGRST_JWT_AUD` | string | | Expected value of the `aud` claim in JWTs. Must be a string or valid URI. | No default |
| `PGRST_JWT_CACHE_MAX_ENTRIES` | integer (count) | | Maximum entries in the JWT validation cache. Set to `0` to disable caching. | Default: `1000` |
| `PGRST_JWT_ROLE_CLAIM_KEY` | string | | JSPath expression locating the role claim inside the JWT. | Default: `.role`; alias `PGRST_ROLE_CLAIM_KEY` |
| `PGRST_JWT_SECRET` | string | Both | Secret, JWK, or JWKS used to verify JWTs. Must be at least 32 characters for symmetric secrets. Prefix with `@` to load from a file. | No default |
| `PGRST_JWT_SECRET_IS_BASE64` | boolean | | Treats `PGRST_JWT_SECRET` as base64-encoded. | Default: `false`; alias `PGRST_SECRET_IS_BASE64` |
| `PGRST_LOG_LEVEL` | enum | | Logging level. Allowed values: `crit`, `error`, `warn`, `info`, `debug`. | Default: `error` |
| `PGRST_LOG_QUERY` | boolean | | Logs the SQL query for each request at the current log level. | Default: `false` |
| `PGRST_MAX_ROWS` | integer (count) | | Deprecated alias for `PGRST_DB_MAX_ROWS`. | Deprecated; use `PGRST_DB_MAX_ROWS` |
| `PGRST_OPENAPI_MODE` | enum | | Controls OpenAPI output. Allowed values: `follow-privileges`, `ignore-privileges`, `disabled`. | Default: `follow-privileges` |
| `PGRST_OPENAPI_SECURITY_ACTIVE` | boolean | | Includes security definitions in the OpenAPI output. | Default: `false` |
| `PGRST_OPENAPI_SERVER_PROXY_URI` | URL | | Overrides the base URL in the OpenAPI self-documentation (useful behind a proxy). | No default |
| `PGRST_PRE_REQUEST` | string | | Deprecated alias for `PGRST_DB_PRE_REQUEST`. | Deprecated; use `PGRST_DB_PRE_REQUEST` |
| `PGRST_ROLE_CLAIM_KEY` | string | | Deprecated alias for `PGRST_JWT_ROLE_CLAIM_KEY`. | Deprecated; use `PGRST_JWT_ROLE_CLAIM_KEY` |
| `PGRST_ROOT_SPEC` | string | | Deprecated alias for `PGRST_DB_ROOT_SPEC`. | Deprecated; use `PGRST_DB_ROOT_SPEC` |
| `PGRST_SECRET_IS_BASE64` | boolean | | Deprecated alias for `PGRST_JWT_SECRET_IS_BASE64`. | Deprecated; use `PGRST_JWT_SECRET_IS_BASE64` |
| `PGRST_SERVER_CORS_ALLOWED_ORIGINS` | string (CSV) | | Comma-separated list of allowed CORS origins. When empty or unset, all origins are accepted. | No default |
| `PGRST_SERVER_HOST` | string | | Address the PostgREST web server binds to. Special values: `*` (any), `*4` (IPv4-preferred), `!4` (IPv4-only), `*6` (IPv6-preferred), `!6` (IPv6-only). | Default: `!4` |
| `PGRST_SERVER_PORT` | integer | | TCP port the PostgREST web server binds to. Use `0` to auto-assign. | Default: `3000` |
| `PGRST_SERVER_TIMING_ENABLED` | boolean | | Enables the `Server-Timing` HTTP response header. | Default: `false` |
| `PGRST_SERVER_TRACE_HEADER` | string | | HTTP header name used to trace requests (e.g. `X-Request-Id`). | No default |
| `PGRST_SERVER_UNIX_SOCKET` | path | | Path to a Unix domain socket the server binds to. Takes precedence over `PGRST_SERVER_PORT` when set. | No default |
| `PGRST_SERVER_UNIX_SOCKET_MODE` | string | | Octal file mode applied to the Unix socket. Must be between `600` and `777`. | Default: `660` |

---

## Realtime

> Realtime's upstream env-var reference is at [supabase/realtime ENVS.md](https://github.com/supabase/realtime/blob/main/ENVS.md).

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `ACCESS_TOKEN_THROTTLE_MS` | integer (ms) | | Minimum interval (ms) between applying `access_token` refresh messages on a channel. A refresh that arrives sooner is held and applied when the interval ends; if several arrive, the latest one is applied. | Default: `10000` (10 seconds). Only set in production builds. |
| `API_JWT_JWKS` | JWKS | Both | JSON Web Key Set used to verify tenant JWTs during self-host seeding. Read by `priv/repo/seeds.exs` and `priv/repo/dev_seeds.exs`. | Used only by the seed script (`SEED_SELF_HOST=true`). Required when using the new API keys and new auth. |
| `API_JWT_SECRET` | string | Both | Symmetric HS256 secret used to sign tokens for the tenant management API and the default self-host tenant. | Required for the tenant management API in production. The API also accepts `API_JWT_SECRET_NEXT`. When unset, the self-host seed uses `super-secret-jwt-token-with-at-least-32-characters-long` for the tenant. |
| `API_JWT_SECRET_NEXT` | string | | Second HS256 secret accepted by the tenant management API. A token signed with either `API_JWT_SECRET` or this secret is accepted. | No default. Not used by the self-host seed: the seeded tenant's JWT secret is `API_JWT_SECRET`. |
| `API_TOKEN_BLOCKLIST` | string (CSV) | | Comma-separated list of tokens blocked from tenant management API access. | Default: empty list. |
| `APP_NAME` | string | Both | Application/node name. Used to build the Phoenix endpoint URL host, libcluster DNS basename, and Erlang `RELEASE_NODE`. | Required - raises `APP_NAME not available` if empty. Default: empty (build) / `realtime` (Erlang release script). |
| `BROADCAST_POOL_SIZE` | integer (count) | | Number of processes used to relay Phoenix.PubSub messages across the cluster. | Default: `10`. |
| `CHANNEL_ERROR_BACKOFF_MS` | integer (ms) | | Delay (ms) before returning a channel join error to the client. Slows down reconnect storms. | Default: `5000` (5 seconds). |
| `CLIENT_PRESENCE_MAX_CALLS` | integer (count) | | Maximum presence calls allowed per client (per WebSocket) within the time window. | Default: `5`. |
| `CLIENT_PRESENCE_WINDOW_MS` | integer (ms) | | Time window (ms) for per-client presence rate limiting. | Default: `30000`. |
| `CLUSTER` | string | | Cluster name added to log metadata. | No default. Read by `Realtime.Application.start/2`. |
| `CLUSTER_STRATEGIES` | string (CSV) | Self-hosted | Comma-separated list of libcluster backends to enable. Supported: `EPMD`, `DNS`, `POSTGRES`. An empty value disables cluster discovery. | Default: `POSTGRES`. The self-hosted compose sets it empty, since a single node has no peers to discover. |
| `CONNECT_ERROR_BACKOFF_MS` | integer (ms) | | Delay (ms) before returning a WebSocket connection error to the client. Slows down reconnect storms. | Default: `2000` (2 seconds). |
| `CONNECT_PARTITION_SLOTS` | integer (count) | | Number of dynamic supervisor partitions for the `Connect` / `ReplicationConnect` processes. | Default: `System.schedulers_online() * 2`. |
| `DASHBOARD_AUTH` | enum | | Authentication method for the admin dashboard (`/admin`). Accepted: `basic_auth` (requires `DASHBOARD_USER` and `DASHBOARD_PASSWORD`) or `zta` (requires `CF_TEAM_DOMAIN`). | Default: `basic_auth`. |
| `DASHBOARD_PASSWORD` | string | | Password for admin dashboard basic auth. | Default: random hex string generated at boot. |
| `DASHBOARD_USER` | string | | Username for admin dashboard basic auth. | Default: random hex string generated at boot. |
| `DB_AFTER_CONNECT_QUERY` | string | Both | SQL query executed after every Postgres connection is established. | No default. Self-host sets `SET search_path TO _realtime`. |
| `DB_ENC_KEY` | string | Both | AES-128-ECB key used to encrypt sensitive fields in the `_realtime.tenants` and `_realtime.extensions` tables. | Required. Must be 16 bytes (AES-128 key). Still needed after enabling `DB_ENC_WRITE_GCM`, to decrypt values not yet re-encrypted to GCM. |
| `DB_ENC_KEY_GCM` | string | | AES-256-GCM key for the tenant secrets stored in `_realtime` (tenant JWT secret and the `postgres_cdc_rls` connection settings). Used for new writes when `DB_ENC_WRITE_GCM=true`, and to decrypt any value already stored as GCM (`g1:` prefix). | No default. Must be exactly 32 bytes or boot fails. Once values are stored as GCM, they can't be decrypted without this key. |
| `DB_ENC_WRITE_GCM` | boolean | | When `true` and `DB_ENC_KEY_GCM` is set, new writes of tenant secrets use AES-256-GCM instead of the legacy AES-128-ECB cipher (`DB_ENC_KEY`). Existing ECB values are re-encrypted to GCM in the background when a tenant is loaded, if the `gcm_encryption_backfill` feature flag is on (the self-host seed enables it). | Default: `false`. Accepts `true`/`false`/`1`/`0`. If `true` without `DB_ENC_KEY_GCM`, Realtime logs a warning at boot and keeps using ECB. |
| `DB_HOST` | string | Both | Primary Postgres host. | Default: `127.0.0.1`. |
| `DB_IP_VERSION` | enum | | Forces the IP version for Postgres connections. Accepted: `ipv4`, `ipv6`. | When unset, IP version is auto-detected from `DB_HOST`. |
| `DB_MASTER_REGION` | string | | Overrides the primary region for region-aware routing and tenant placement. | When unset, the current `REGION` is used. |
| `DB_NAME` | string | Both | Postgres database name. | Default: `postgres`. |
| `DB_PASSWORD` | string | Both | Postgres password. | Default: `postgres`. |
| `DB_POOL_SIZE` | integer (count) | | Number of connections in the primary Postgres pool. | Default: `5`. |
| `DB_PORT` | string | Both | Postgres port. | Default: `5432`. |
| `DB_QUEUE_INTERVAL` | integer (ms) | | Ecto pool queue interval in ms. | Default: `5000`. |
| `DB_QUEUE_TARGET` | integer (ms) | | Ecto pool queue target in ms. | Default: `5000`. |
| `DB_REPLICA_HOST` | string | | Hostname for the main replica Postgres pool. | When set, enables the `Realtime.Repo.Replica` connection pool. |
| `DB_REPLICA_POOL_SIZE` | integer (count) | | Number of connections in the replica pool(s). | Default: `5`. |
| `DB_SSL` | boolean | | Enable SSL for Postgres connections. | Default: `false`. Accepts `true`/`false`/`1`/`0`. The self-host seed also uses it for the tenant's `ssl_enforced` setting. |
| `DB_SSL_CA_CERT` | path | | Path to a CA trust store used when `DB_SSL=true`. Enables server certificate verification. | When unset and `DB_SSL=true`, falls back to `verify: :verify_none`. |
| `DB_USER` | string | Both | Postgres user. | Default: `supabase_admin`. |
| `DISABLE_HEALTHCHECK_LOGGING` | boolean | Self-hosted | Disables request logging for `/healthcheck` and `/api/tenants/:tenant_id/health`. | Default: `false`. |
| `DNS_NODES` | string | CLI | DNS query used by the libcluster `DNS` strategy. | No default. Empty, `''` and `""` count as unset, which skips the `DNS` strategy. Only consulted when `CLUSTER_STRATEGIES` contains `DNS`. |
| `ERL_AFLAGS` | string | Both | Extra flags for the Erlang VM, read by the Erlang runtime. Compose and the CLI use it to choose the distribution protocol: `-proto_dist inet_tcp` (IPv4) or `-proto_dist inet6_tcp` (IPv6). | Image default: `-proto_dist inet6_tcp`. The self-hosted compose sets `-proto_dist inet_tcp`. `run.sh` appends TLS distribution flags when `GENERATE_CLUSTER_CERTS` is set. |
| `GEN_RPC_SOCKET_IP` | string | Self-hosted | IP address the internal gen_rpc listener binds to. | Default: `0.0.0.0`. Must be a valid IPv4/IPv6 address or the service refuses to start. The self-hosted compose sets `127.0.0.1` so the listener is not reachable from other containers on a single node. |
| `GEN_RPC_TCP_CLIENT_PORT` | integer | | TCP port gen_rpc connects to on peer nodes for inter-node RPC. | Default: `5369`. Should match the peers' `GEN_RPC_TCP_SERVER_PORT`. Ignored when `GEN_RPC_SSL_SERVER_PORT` is set. |
| `GEN_RPC_TCP_SERVER_PORT` | integer | | TCP port the internal gen_rpc listener binds to (on `GEN_RPC_SOCKET_IP`) for inter-node RPC. | Default: `5369`. Ignored when `GEN_RPC_SSL_SERVER_PORT` is set. |
| `HTTP_DYNAMIC_BUFFER_MAX` | integer (bytes) | | Maximum buffer size (bytes) for HTTP connections (Cowboy dynamic buffer). | No default. Must be set together with `HTTP_DYNAMIC_BUFFER_MIN`, or boot fails. |
| `HTTP_DYNAMIC_BUFFER_MIN` | integer (bytes) | | Minimum buffer size (bytes) for HTTP connections (Cowboy dynamic buffer). | No default. Must be set together with `HTTP_DYNAMIC_BUFFER_MAX`, or boot fails. |
| `JANITOR_CHILDREN_TIMEOUT` | integer (ms) | | Timeout (ms) for each janitor child task. | Default: `5000`. Only used when `RUN_JANITOR=true`. |
| `JANITOR_CHUNK_SIZE` | integer (count) | | Number of tenants processed per chunk per janitor task. | Default: `10`. |
| `JANITOR_MAX_CHILDREN` | integer (count) | | Maximum number of concurrent janitor task children. | Default: `5`. |
| `JANITOR_RUN_AFTER_IN_MS` | integer (ms) | | Delay (ms) before the janitor first runs after boot. | Default: 10 minutes. |
| `JANITOR_SCHEDULE_RANDOMIZE` | boolean | | Add a random offset to the janitor schedule. | Default: `true`. |
| `JANITOR_SCHEDULE_TIMER_IN_MS` | integer (ms) | | Interval (ms) between janitor runs. | Default: 4 hours. |
| `JWT_CLAIM_VALIDATORS` | JSON | | JSON object of claim validators applied to incoming JWTs (e.g. `{"iss":"Issuer"}`). | Default: `{}`. Must be valid JSON object or boot fails. |
| `LOG_LEVEL` | enum | | Logger level. One of `info`, `emergency`, `alert`, `critical`, `error`, `warning`, `notice`, `debug`. | Default: `info`. |
| `LOG_THROTTLE_JANITOR_INTERVAL_IN_MS` | integer (ms) | | Cachex expiration interval (ms) for the log-throttle cache. | Default: 10 minutes. |
| `LOGFLARE_API_KEY` | string | | Logflare API key. | Required when `LOGS_ENGINE=logflare`. |
| `LOGFLARE_LOGGER_BACKEND_URL` | URL | | Endpoint for the Logflare logger backend. | Default: `https://api.logflare.app`. |
| `LOGFLARE_SOURCE_ID` | string | | Logflare source ID. | Required when `LOGS_ENGINE=logflare`. |
| `LOGS_ENGINE` | string | | Log backend selector. Set to `logflare` to enable the Logflare HTTP backend. | When unset, standard logger output is used. |
| `MAX_CONNECTIONS` | integer (count) | | Soft maximum number of WebSocket connections. | Default: `1000`. |
| `MAX_HEADER_LENGTH` | integer (bytes) | CLI | Maximum HTTP header value length (bytes). | Default: `4096`. |
| `METRICS_CLEANER_SCHEDULE_TIMER_IN_MS` | integer (ms) | | Interval (ms) between metrics cleaner runs. | Default: 30 minutes. |
| `METRICS_JWT_SECRET` | string | Both | Secret used to sign JWTs for the metrics endpoints. | Required - the app raises an exception if unset. |
| `METRICS_PUSHER_AUTH` | string | | Password used for Basic auth on metrics pushes. Used together with `METRICS_PUSHER_USER`. | When unset, requests are sent without authorization. |
| `METRICS_PUSHER_COMPRESS` | boolean | | Enable gzip compression for metrics payloads. | Default: `true`. |
| `METRICS_PUSHER_ENABLED` | boolean | | Enable periodic push of Prometheus metrics. | Default: `false`. Requires `METRICS_PUSHER_URL`. |
| `METRICS_PUSHER_EXTRA_LABELS` | string (CSV) | | Comma-separated `key=value` pairs appended as `extra_label` query parameters on every push. | Default: empty. |
| `METRICS_PUSHER_INTERVAL_MS` | integer (ms) | | Interval (ms) between metrics pushes. | Default: 30 seconds. |
| `METRICS_PUSHER_TIMEOUT_MS` | integer (ms) | | HTTP timeout (ms) for metrics push requests. | Default: 15 seconds. |
| `METRICS_PUSHER_URL` | URL | | Full URL endpoint to push metrics in Prometheus exposition format. | Required when `METRICS_PUSHER_ENABLED=true`. |
| `METRICS_PUSHER_USER` | string | | Username used for Basic auth on metrics pushes. | Default: `realtime`. |
| `METRICS_RPC_TIMEOUT_IN_MS` | integer (ms) | | Timeout (ms) for RPC calls that fetch metrics from other nodes. | Default: 15 seconds. |
| `METRICS_TOKEN_BLOCKLIST` | string (CSV) | | Comma-separated list of tokens blocked from accessing the metrics endpoints. | Default: empty list. |
| `NO_CHANNEL_TIMEOUT_IN_MS` | integer (ms) | | Time (ms) a WebSocket can stay connected without any joined channel before Realtime closes it (close code `1001`, `No channels joined`). The timer starts on connect and restarts when the socket leaves its last channel. | Default: 10 minutes. |
| `NODE_NAME` | string | | Name part of the Erlang node name (`RELEASE_NODE=<NODE_NAME>@<ip>`), set by the release script `rel/env.sh.eex`. | Default: `APP_NAME`, then `realtime`. |
| `POD_IP` | string | | IP address used as the host part of the Erlang node name (`RELEASE_NODE=<name>@<POD_IP>`), set by the release script `rel/env.sh.eex`. Other cluster nodes reach this node at that address. | Default: `127.0.0.1`. Ignored when `AWS_EXECUTION_ENV=AWS_ECS_FARGATE`. |
| `PORT` | integer | Both | HTTP listener port. | Default: `4000`. |
| `PROM_POLL_RATE` | integer (ms) | | Poll interval (ms) for PromEx metrics collection. | Default: `5000`. |
| `REALTIME_IP_VERSION` | enum | | Forces the HTTP listener IP version. Accepted: `ipv4`, `ipv6`. | When unset, IPv6 is preferred when available. |
| `REBALANCE_CHECK_INTERVAL_IN_MS` | integer (ms) | | Interval (ms) used to check whether a process is in the right region. | Default: 10 minutes. |
| `REGION` | string | | Region name for the current node. Used in logs, latency reporting, and region-aware routing. | Default: `local`. Log metadata and the admin dashboard layout read the variable directly, so they show nothing when it's unset. |
| `REGION_MAPPING` | JSON | | Custom mapping of platform regions to tenant regions, as a JSON object with string keys and values. | When unset, the hardcoded default mapping is used. Must be a JSON object or boot fails. |
| `RELEASE_COOKIE` | string | Self-hosted | Erlang distribution cookie: the shared secret cluster nodes use to trust each other. | When unset, the self-hosted Realtime entrypoint (`volumes/realtime/docker-entrypoint.sh`) generates a random ephemeral cookie on start. Set it explicitly (same value on every node, 63 characters or fewer) only for a multi-node cluster; when discovery is enabled it also serves as the libcluster Postgres `LISTEN` channel name, which Postgres caps at 63 bytes. |
| `REQUEST_ID_BAGGAGE_KEY` | string | | OTEL Baggage key used as the request ID. | Default: `request-id`. |
| `RLIMIT_NOFILE` | integer (count) | Both | Soft limit for open file descriptors, which `run.sh` applies with `ulimit -Sn` before starting the server. | No default: unset or empty keeps the container's limit. The self-hosted compose sets `10000`. The container runs as `nobody`, so the value can't go above the container's hard limit. |
| `RPC_TIMEOUT` | integer (ms) | | Timeout (ms) for generic RPC calls. | Default: 30 seconds. |
| `RUN_JANITOR` | boolean | Both | Enable the tenant janitor and metrics cleaner tasks. | Default: `false`. |
| `SECRET_KEY_BASE` | string | Both | Secret used by Phoenix to sign cookies and tokens. | Required - recommended length: 64 characters. |
| `SEED_SELF_HOST` | boolean | Both | If `true`, `run.sh` runs `Realtime.Release.seeds/1` to create the default tenant. | Default: unset (no seeding). Only the exact value `true` enables it. The self-hosted compose sets it, so the seed runs on every start: it deletes and re-creates the tenant, and globally enables the `gcm_encryption_backfill` and `broadcast_persistence` feature flags. |
| `SELF_HOST_TENANT_DB_HOST` | string | | Database host stored in the seeded self-host tenant's `postgres_cdc_rls` settings: the database Realtime connects to for that tenant. | Default: `DB_HOST`, then `host.docker.internal`. Used only by the seed script (`SEED_SELF_HOST=true`). |
| `SELF_HOST_TENANT_DB_PORT` | string | | Database port stored in the seeded self-host tenant's `postgres_cdc_rls` settings. | Default: `DB_PORT`, then `5433`. Used only by the seed script (`SEED_SELF_HOST=true`). |
| `SELF_HOST_TENANT_NAME` | string | | Tenant external_id used by the self-host seed script. | Default: `realtime-dev`. Must be URL-safe. |
| `SLOT_NAME_SUFFIX` | string | | Suffix appended to Realtime's replication slot names: `supabase_realtime_replication_slot_<suffix>` (Postgres Changes) and `supabase_realtime_messages_replication_slot_<suffix>` (Broadcast from Database). | No default. Allowed: lowercase letters, numbers, underscore. Postgres caps slot names at 63 characters, so the suffix can be at most 19 characters. |
| `TENANT_CACHE_EXPIRATION_IN_MS` | integer (ms) | | TTL (ms) for the in-process tenant cache. | Default: 30 seconds. |
| `TENANT_MAX_BYTES_PER_SECOND` | integer (count) | | Default per-tenant maximum bytes per second (used when a tenant is first created). | Default: `100000`. |
| `TENANT_MAX_CHANNELS_PER_CLIENT` | integer (count) | | Default per-tenant maximum channels per client (used when a tenant is first created). | Default: `100`. |
| `TENANT_MAX_CONCURRENT_USERS` | integer (count) | | Default per-tenant maximum concurrent users per channel (used when a tenant is first created). | Default: `200`. |
| `TENANT_MAX_EVENTS_PER_SECOND` | integer (count) | | Default per-tenant maximum events per second (used when a tenant is first created). | Default: `100`. |
| `TENANT_MAX_JOINS_PER_SECOND` | integer (count) | | Default per-tenant maximum channel joins per second (used when a tenant is first created). | Default: `100`. |
| `USERS_SCOPE_SHARDS` | integer (count) | | Number of partitions used by the `Forum.Census` `users` scope. | Default: `5`. |
| `WEBSOCKET_MAX_HEAP_SIZE` | integer (bytes) | | Maximum heap (bytes) for each WebSocket transport process; the process is killed if exceeded. | Default: `50000000` (50 MB). |

---

## Storage

### Server

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `EXPOSE_DOCS` | boolean |  | Expose `/docs` Swagger UI. | Default: `true` |
| `HOST` | string |  | Host the public server binds to. Legacy alias for `SERVER_HOST`. | Default: `0.0.0.0` |
| `NODE_ENV` | enum |  | Node.js runtime mode. When `production`, sets `isProduction` and forces HTTPS in TUS link generation. | Default: unset |
| `PORT` | integer |  | Port the public HTTP server listens on. Legacy alias for `SERVER_PORT`. | Default: `5000` |
| `PROJECT_REF` | string |  | Single-tenant project reference; used as `tenantId` when set. | Optional (single-tenant) |
| `REGION` | string | Self-hosted | Region label exposed in responses and used as fallback for `STORAGE_S3_REGION` / `SERVER_REGION`. | Default: `not-specified` |
| `REQUEST_ADMIN_TRACE_HEADER` | string |  | Header carrying the admin request trace id. Legacy fallback for `REQUEST_TRACE_HEADER`. | Optional |
| `REQUEST_ALLOW_X_FORWARDED_PATH` | boolean | Self-hosted | Honor the `X-Forwarded-Prefix` header as a path prefix when building TUS upload URLs and verifying S3 SigV4 signatures. | Default: `false` |
| `REQUEST_ETAG_HEADERS` | string (CSV) |  | Comma-separated list of request headers that carry an ETag for conditional GETs. | Default: `if-none-match` |
| `REQUEST_HARD_LIMITS_ENABLED` | boolean |  | Reject bulk delete requests (`DELETE /object/{bucket}` with `prefixes`, S3 `DeleteObjects`) that list more than 1000 objects. | Default: `false` (no cap) |
| `REQUEST_ID_HEADER` | string |  | Legacy alias for `REQUEST_TRACE_HEADER`. | Optional |
| `REQUEST_TRACE_HEADER` | string |  | Header name used to propagate the request trace id. | Default: unset |
| `REQUEST_X_FORWARDED_HOST_REGEXP` | string (regex) |  | Regex applied to `X-Forwarded-Host` to derive the tenant id. | Optional |
| `RESPONSE_STALE_IF_ERROR` | integer (seconds) |  | `stale-if-error` lifetime added to the `Cache-Control` of object responses. `0` adds nothing. | Default: `0`; negative or non-numeric values fall back to `0` |
| `RESPONSE_STALE_WHILE_REVALIDATE` | integer (seconds) |  | `stale-while-revalidate` lifetime added to the `Cache-Control` of object responses. | Default: `0`. With `0`, `stale-while-revalidate=30` is still added when the request's ETag differs from the object's; negative or non-numeric values fall back to `0` |
| `RESPONSE_S_MAXAGE` | integer (seconds) |  | `s-maxage` (CDN) cache lifetime added to the `Cache-Control` of object responses when the request carries an ETag header (`REQUEST_ETAG_HEADERS`). | Default: `0` |
| `SERVER_HEADERS_TIMEOUT` | integer (seconds) |  | Node `headersTimeout` (seconds) for the HTTP server. | Default: `65` |
| `SERVER_HOST` | string |  | Host the public server binds to. | Default: `0.0.0.0` |
| `SERVER_KEEP_ALIVE_TIMEOUT` | integer (seconds) |  | Node `keepAliveTimeout` (seconds) for the HTTP server. | Default: `61` |
| `SERVER_PORT` | integer |  | Port the public HTTP server listens on. | Default: `5000` |
| `SERVER_REGION` | string |  | Region label exposed in responses; falls back to `REGION`. | Default: `not-specified` |
| `STORAGE_PUBLIC_URL` | URL | Self-hosted | Public base URL prepended to generated object URLs. | Optional |
| `STORAGE_VERSIONING_ENABLED` | boolean |  | Enable object versioning and bucket lifecycle configuration in single-tenant mode. | Default: `false`. When unset, setting a bucket's versioning to `ENABLED` or writing a lifecycle configuration returns 409 `FeatureNotEnabled` |
| `TENANT_ID` | string | Both | Single-tenant tenant id (fallback after `PROJECT_REF`). | Default: `storage-single-tenant` |
| `VERSION` | string |  | Build version reported in logs and the default DB application name. | Default: `0.0.0` in code; the image sets it to the release version |
| `WORKERS_NUM` | integer |  | Number of cluster workers to spawn. | Default: `1` |
| `X_FORWARDED_HOST_REGEXP` | string (regex) |  | Legacy alias for `REQUEST_X_FORWARDED_HOST_REGEXP`. | Optional |

### Database

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `DATABASE_APPLICATION_NAME` | string |  | Postgres `application_name` for Storage's connection pools. | Default: `Supabase Storage API ${VERSION}` (`Supabase Storage API Worker ${VERSION}` in worker processes) |
| `DATABASE_CONNECTION_TIMEOUT` | integer (ms) |  | Postgres connection acquire timeout (ms). | Default: `3000` |
| `DATABASE_ENABLE_QUERY_CANCELLATION` | boolean |  | Issue a Postgres cancel on request abort. | Default: `false` |
| `DATABASE_FREE_POOL_AFTER_INACTIVITY` | integer (ms) |  | Time (ms) after which an idle tenant pool is released. | Default: `60000` |
| `DATABASE_MAX_CONNECTIONS` | integer |  | Max connections in the tenant's connection pool, also when `DATABASE_POOL_URL` is set; split across `WORKERS_NUM` worker processes. | Default: `20` |
| `DATABASE_POOL_URL` | URL |  | External pooler (Supavisor/PgBouncer) connection string, used instead of `DATABASE_URL` for request queries. `DATABASE_SEARCH_PATH` isn't applied to it. | Optional |
| `DATABASE_POSTGRES_VERSION` | string |  | Override the detected Postgres version string. | Optional |
| `DATABASE_SEARCH_PATH` | string (CSV) |  | Comma-separated `search_path` prepended to every session. | Default: empty |
| `DATABASE_SSL_ROOT_CERT` | path |  | PEM bundle used to verify the Postgres server certificate. | Optional |
| `DATABASE_STATEMENT_TIMEOUT` | integer (ms) |  | Postgres `statement_timeout` (ms) applied per session. | Default: `30000` |
| `DATABASE_URL` | URL | Both | Primary Postgres connection string used by the API. | Required (single-tenant) |
| `DB_ALLOW_MIGRATION_REFRESH` | boolean |  | Allow refreshing migration hashes when the hash recorded in the DB diverges. | Default: `true` |
| `DB_ANON_ROLE` | string |  | Postgres role used when authenticating as anonymous. | Default: `anon` |
| `DB_AUTHENTICATED_ROLE` | string |  | Postgres role used for authenticated requests. | Default: `authenticated` |
| `DB_INSTALL_ROLES` | boolean |  | Run role install migrations on boot. | Default: `false` |
| `DB_MIGRATIONS_FREEZE_AT` | string | CLI | Stop applying migrations after the named migration. | Optional |
| `DB_SEARCH_PATH` | string (CSV) |  | Legacy alias for `DATABASE_SEARCH_PATH`. | Default: empty |
| `DB_SERVICE_ROLE` | string |  | Postgres role used by the service-role key. | Default: `service_role` |
| `DB_SUPER_USER` | string |  | Postgres superuser used for migrations. | Default: `postgres` |

### JWT

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `AUTH_JWT_ALGORITHM` | enum |  | HMAC algorithm used with `AUTH_JWT_SECRET`: `HS256`, `HS384` or `HS512`. | Default: `HS256`; any other value fails at startup |
| `AUTH_JWT_SECRET` | string | Both | HS256 secret used to verify the legacy `ANON_KEY` / `SERVICE_KEY`. | Required (single-tenant) |
| `JWT_CACHING_ENABLED` | boolean |  | Cache decoded JWTs in memory to reduce verification cost. | Default: `false` |
| `JWT_JWKS` | JWKS | Both | JSON Web Key Set used to verify asymmetric JWTs (e.g. ES256). | Required when using the new API keys and new auth. |
| `PGRST_JWT_ALGORITHM` | enum |  | Legacy alias for `AUTH_JWT_ALGORITHM`. | Default: `HS256`; same values as `AUTH_JWT_ALGORITHM` |
| `PGRST_JWT_SECRET` | string |  | JWT secret used by Storage to verify Postgres-issued tokens; legacy alias for `AUTH_JWT_SECRET`. | Required (single-tenant) |

### Auth

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `ANON_KEY` | JWT | Both | Anon JWT served to public clients. Auto-generated from `AUTH_JWT_SECRET` when blank in single-tenant mode. | Required for self-hosted single-tenant |
| `SERVICE_KEY` | JWT | Both | Service-role JWT (bypasses Row Level Security). Auto-generated from `AUTH_JWT_SECRET` when blank in single-tenant mode. | Required for self-hosted single-tenant |

### S3 backend

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `AWS_ACCESS_KEY_ID` | string | Self-hosted | AWS access key id consumed by the AWS SDK to sign S3 requests. | Required when `STORAGE_BACKEND=s3` |
| `AWS_SECRET_ACCESS_KEY` | string | Self-hosted | AWS secret key consumed by the AWS SDK to sign S3 requests. | Required when `STORAGE_BACKEND=s3` |
| `GLOBAL_S3_BUCKET` | string | Both | S3 bucket name; legacy alias for `STORAGE_S3_BUCKET`. | Required when `STORAGE_BACKEND=s3` |
| `GLOBAL_S3_ENDPOINT` | URL | Self-hosted | Legacy alias for `STORAGE_S3_ENDPOINT`. | Optional |
| `GLOBAL_S3_FORCE_PATH_STYLE` | boolean | Self-hosted | Legacy alias for `STORAGE_S3_FORCE_PATH_STYLE`. | Default: `false` |
| `GLOBAL_S3_MAX_SOCKETS` | integer |  | Legacy alias for `STORAGE_S3_MAX_SOCKETS`. | Default: `200` |
| `GLOBAL_S3_PRIVATE_ASSET_ENDPOINT` | URL |  | Legacy alias for `STORAGE_S3_PRIVATE_ASSET_ENDPOINT`. | Optional |
| `S3_ALLOW_FORWARDED_HEADER` | boolean |  | Honor the `Forwarded` header when reconstructing canonical request URLs for SigV4. | Default: `false` |
| `S3_PROTOCOL_ACCESS_KEY_ID` | string | Both | Static SigV4 access key id (single-tenant). | Optional |
| `S3_PROTOCOL_ACCESS_KEY_SECRET` | string | Both | Static SigV4 secret (single-tenant). | Optional |
| `S3_PROTOCOL_ENABLED` | boolean | CLI | Enable the S3-compatible API. | Default: `true` |
| `S3_PROTOCOL_ENFORCE_REGION` | boolean |  | Reject SigV4 requests whose region does not match `STORAGE_S3_REGION`. | Default: `false` |
| `S3_PROTOCOL_NON_CANONICAL_HOST_HEADER` | string |  | Override host used during SigV4 canonicalization. | Optional |
| `S3_PROTOCOL_PREFIX` | string | CLI | URL prefix mounted in front of the S3 protocol routes. | Default: empty |
| `STORAGE_BACKEND` | enum | Both | Object backend driver: `s3` or `file`. | Default: `file` (compose) / unset (code) |
| `STORAGE_EMPTY_BUCKET_MAX` | integer |  | Max objects deletable in a single empty-bucket call. | Default: `200000` |
| `STORAGE_S3_BUCKET` | string |  | Bucket name used by the S3 backend. | Required when `STORAGE_BACKEND=s3` |
| `STORAGE_S3_CLIENT_TIMEOUT` | integer (ms) |  | Socket timeout (ms) for the S3 backend's SDK calls and the TUS upload S3 clients; `0` disables. | Default: `0` (backend), `60000` (TUS S3 clients); range `0`-`2147483647`, out-of-range values fall back to the default |
| `STORAGE_S3_ENABLED_METRICS` | boolean |  | Enable internal S3 client tracing/metrics. | Default: `false` |
| `STORAGE_S3_ENDPOINT` | URL |  | Custom S3 endpoint (e.g. MinIO). | Optional |
| `STORAGE_S3_FORCE_PATH_STYLE` | boolean |  | Use path-style S3 addressing. | Default: `false` |
| `STORAGE_S3_MAX_SOCKETS` | integer |  | Max concurrent sockets for the S3 HTTP agent. | Default: `200` |
| `STORAGE_S3_PRIVATE_ASSET_ENDPOINT` | URL |  | Endpoint used only when signing private source URLs for internal consumers (e.g. imgproxy). | Optional |
| `STORAGE_S3_REGION` | string | CLI | AWS region for the S3 backend; falls back to `REGION`. | Required when `STORAGE_BACKEND=s3` |
| `STORAGE_S3_REQUEST_CHECKSUM_CALCULATION` | enum |  | AWS SDK `requestChecksumCalculation` for the S3 backend client: `WHEN_SUPPORTED` or `WHEN_REQUIRED`. | Default: unset (AWS SDK default). Case-insensitive; any other value fails at startup. Replaces `STORAGE_S3_DISABLE_CHECKSUM` (removed in v1.60.28) |
| `STORAGE_S3_RESPONSE_CHECKSUM_VALIDATION` | enum |  | AWS SDK `responseChecksumValidation` for the S3 backend client: `WHEN_SUPPORTED` or `WHEN_REQUIRED`. | Default: unset (AWS SDK default). Case-insensitive; any other value fails at startup |
| `STORAGE_S3_UPLOAD_PART_SIZE` | integer (bytes) |  | Multipart upload part size in bytes. Values below the 5 MiB S3 minimum are clamped up. | Default: `16777216` (16 MiB); minimum: `5242880` (5 MiB) |
| `STORAGE_S3_UPLOAD_QUEUE_SIZE` | integer |  | Concurrent part uploads per multipart object. | Default: `2` |

### File backend

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `FILE_STORAGE_BACKEND_PATH` | path | Both | Filesystem path for the `file` backend; legacy alias for `STORAGE_FILE_BACKEND_PATH`. | Required when `STORAGE_BACKEND=file` |
| `STORAGE_FILE_BACKEND_PATH` | path |  | Filesystem directory used by the `file` backend. | Required when `STORAGE_BACKEND=file` |
| `STORAGE_FILE_ETAG_ALGORITHM` | enum |  | ETag algorithm for the `file` backend: `md5` or `mtime`. | Default: `md5` |

### Image transformation

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `ENABLE_IMAGE_TRANSFORMATION` | boolean | Both | Legacy alias for `IMAGE_TRANSFORMATION_ENABLED`. | Default: `false` |
| `IMAGE_TRANSFORMATION_ENABLED` | boolean | CLI | Enable image rendering via imgproxy. | Default: `false` |
| `IMAGE_TRANSFORMATION_LIMIT_MAX_SIZE` | integer |  | Max requested dimension (px) for transformations. | Default: `2000` |
| `IMAGE_TRANSFORMATION_LIMIT_MIN_SIZE` | integer |  | Min requested dimension (px) for transformations. | Default: `1` |
| `IMGPROXY_HTTP_KEEP_ALIVE_TIMEOUT` | integer (seconds) |  | Keep-alive timeout (seconds) for the imgproxy HTTP agent. | Default: `61` |
| `IMGPROXY_HTTP_MAX_SOCKETS` | integer |  | Max concurrent sockets for the imgproxy HTTP agent. | Default: `5000` |
| `IMGPROXY_REQUEST_TIMEOUT` | integer (seconds) |  | Request timeout (seconds) for imgproxy calls. | Default: `15` |
| `IMGPROXY_URL` | URL | Both | imgproxy base URL. | Required when image transformation is enabled |
| `IMG_LIMITS_MAX_SIZE` | integer |  | Legacy alias for `IMAGE_TRANSFORMATION_LIMIT_MAX_SIZE`. | Default: `2000` |
| `IMG_LIMITS_MIN_SIZE` | integer |  | Legacy alias for `IMAGE_TRANSFORMATION_LIMIT_MIN_SIZE`. | Default: `1` |

### Upload limits

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `FILE_SIZE_LIMIT` | integer (bytes) | Both | Maximum upload file size; legacy alias for `UPLOAD_FILE_SIZE_LIMIT`. | Required |
| `FILE_SIZE_LIMIT_STANDARD_UPLOAD` | integer (bytes) |  | Legacy alias for `UPLOAD_FILE_SIZE_LIMIT_STANDARD`. | Default: `0` (disabled) |
| `SIGNED_UPLOAD_URL_EXPIRATION_TIME` | integer (seconds) | CLI | Legacy alias for `UPLOAD_SIGNED_URL_EXPIRATION_TIME`. | Default: `60` |
| `TUS_ALLOW_S3_TAGS` | boolean |  | Propagate user metadata as S3 tags during TUS uploads. | Default: `true` |
| `TUS_BODY_IDLE_TIMEOUT_MS` | integer (ms) |  | Abort a TUS upload request (408) when no body bytes arrive for this long. `0` disables. | Default: `60000`; range `0`-`2147483647`, out-of-range values fall back to the default |
| `TUS_LOCK_TYPE` | enum |  | TUS upload lock backend: `postgres` or `s3`. | Default: `postgres` |
| `TUS_MAX_CONCURRENT_UPLOADS` | integer |  | Max concurrent TUS upload sessions. | Default: `500` |
| `TUS_PART_SIZE` | integer (MB) |  | TUS multipart part size (MB). | Default: `50` |
| `TUS_URL_EXPIRY_MS` | integer (ms) |  | TUS upload-URL expiry (ms). | Default: `3600000` (1h) |
| `TUS_URL_PATH` | path | CLI | Path mount for TUS resumable uploads. | Default: `/upload/resumable` |
| `TUS_USE_FILE_VERSION_SEPARATOR` | boolean |  | Include the object version in TUS storage keys. | Default: `false` |
| `UPLOAD_FILE_SIZE_LIMIT` | integer (bytes) | CLI | Max upload size in bytes. | Required |
| `UPLOAD_FILE_SIZE_LIMIT_STANDARD` | integer (bytes) | CLI | Max size in bytes for non-resumable uploads. | Default: `0` (disabled) |
| `UPLOAD_SIGNED_URL_EXPIRATION_TIME` | integer (seconds) |  | Default lifetime (seconds) of signed upload URLs. | Default: `60` |

### Rate limiting

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `ENABLE_RATE_LIMITER` | boolean |  | Legacy alias for `RATE_LIMITER_ENABLED`. | Default: `false` |
| `RATE_LIMITER_DRIVER` | enum |  | Rate limiter backend: `memory` or `redis`. | Default: `memory` |
| `RATE_LIMITER_ENABLED` | boolean |  | Enable the image-transformation rate limiter. | Default: `false` |
| `RATE_LIMITER_REDIS_COMMAND_TIMEOUT` | integer (seconds) |  | Per-command timeout (seconds) when using the Redis driver. | Default: `2` |
| `RATE_LIMITER_REDIS_CONNECT_TIMEOUT` | integer (seconds) |  | Connect timeout (seconds) when using the Redis driver. | Default: `2` |
| `RATE_LIMITER_REDIS_URL` | URL |  | Redis connection URL. | Required when `RATE_LIMITER_DRIVER=redis` |
| `RATE_LIMITER_RENDER_PATH_MAX_REQ_SEC` | integer |  | Max requests per second on render paths. | Default: `5` |
| `RATE_LIMITER_SKIP_ON_ERROR` | boolean |  | Allow requests through when the rate limiter errors. | Default: `false` |

### Queue

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `ENABLE_QUEUE_EVENTS` | boolean |  | Legacy alias for `PG_QUEUE_ENABLE`. | Default: `false` |
| `PG_QUEUE_CONNECTION_URL` | URL |  | Postgres connection string for the queue. | Default: `DATABASE_URL` |
| `PG_QUEUE_ENABLE` | boolean |  | Run background event handlers (e.g. object and bucket deletes, webhooks) through a persistent pg-boss queue. When `false`, they run inline in the request. | Default: `false` |
| `PG_QUEUE_MAX_CONNECTIONS` | integer |  | Max connections in the queue's Postgres pool. | Default: `4` |

### Webhook

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `WEBHOOK_API_KEY` | string |  | Bearer key sent with outbound webhooks. | Optional |
| `WEBHOOK_QUEUE_PULL_INTERVAL` | integer (ms) |  | Polling interval (ms) for the webhook queue. | Default: `700`; only used when `PG_QUEUE_ENABLE=true` |
| `WEBHOOK_URL` | URL |  | Endpoint that receives object events. | Optional |

### Logging

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `LOGFLARE_API_BASE_URL` | URL |  | Logflare API base URL that logs are sent to. | Default: `https://api.logflare.app` (`pino-logflare` default) |
| `LOGFLARE_API_KEY` | string |  | Logflare ingest API key. | Required when `LOGFLARE_ENABLED=true` |
| `LOGFLARE_BATCH_SIZE` | integer |  | Max records per Logflare batch. | Default: `200` |
| `LOGFLARE_ENABLED` | boolean |  | Forward logs to Logflare. | Default: `false` |
| `LOGFLARE_SOURCE_TOKEN` | string |  | Logflare source identifier. | Required when `LOGFLARE_ENABLED=true` |
| `LOG_LEVEL` | enum |  | pino log level. | Default: `info` |
| `METRICS_DISABLED` | string (CSV) |  | Comma-separated list of metric names (or `all`) to drop. | Optional |
| `OTEL_EXPORTER_OTLP_COMPRESSION` | enum |  | OTLP exporter compression algorithm (`gzip`, `none`). | Optional |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | URL |  | OTLP endpoint used when a metrics-specific endpoint is not set. | Optional |
| `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` | URL |  | OTLP endpoint for metrics export. | Optional |
| `OTEL_EXPORTER_OTLP_METRICS_HEADERS` | string (CSV) |  | Comma-separated `k=v` headers attached to OTLP metric requests. | Optional; read by the OTel exporter SDK |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | URL |  | OTLP endpoint for trace export. | Optional |
| `OTEL_EXPORTER_OTLP_TRACES_HEADERS` | string (CSV) |  | Comma-separated `k=v` headers attached to OTLP trace requests. | Optional; read by the OTel exporter SDK |
| `OTEL_METRICS_ENABLED` | boolean |  | Enable the OpenTelemetry metrics SDK. | Default: `false` |
| `OTEL_METRICS_EXPORT_INTERVAL_MS` | integer (ms) |  | OTLP metrics export interval (ms). | Default: `60000` |
| `OTEL_METRICS_TEMPORALITY` | enum |  | OTLP metrics temporality: `DELTA` or `CUMULATIVE`. | Default: `CUMULATIVE` |
| `PROMETHEUS_METRICS_ENABLED` | boolean |  | Expose Prometheus metrics at `/metrics` on the main port (on the admin port in multi-tenant mode). Requires `OTEL_METRICS_ENABLED=true`. | Default: `false` |
| `SERVICE_NAME` | string |  | OpenTelemetry `service.name` for metrics and traces, and the Prometheus metric name prefix. | Default: `storage_api` |
| `TRACING_ENABLED` | boolean |  | Enable OpenTelemetry tracing. | Default: `false` |
| `TRACING_FEATURE_UPLOAD` | boolean |  | Emit detailed spans for the upload pipeline. | Default: `false` |
| `TRACING_MODE` | enum |  | Tracing verbosity, e.g. `basic`, `debug`. | Default: `basic` |
| `TRACING_RETURN_SERVER_TIMINGS` | boolean |  | Return `Server-Timing` response headers. | Default: `false` |
| `TRACING_SERVER_TIME_MIN_DURATION` | number |  | Min span duration (ms) before it is reported in `Server-Timing`. | Default: `100.0` |

### Tenant features (Vector)

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `VECTOR_BUCKET_PROVIDER` | enum | CLI | Vector index backend: `s3` (Amazon S3 Vectors) or `pgvector` (Postgres). | Default: `s3`. Not validated: other values leave the vector API disabled (`FeatureNotEnabled`) |
| `VECTOR_BUCKET_REGION` | string |  | AWS region for the S3 Vectors client (`VECTOR_BUCKET_PROVIDER=s3`). | Optional; falls back to `STORAGE_S3_REGION` |
| `VECTOR_DATABASE_CREATE` | boolean |  | With `pgvector`, create a dedicated `storage_vectors` database on the `VECTOR_DATABASE_URL` server and use it. When `false`, use the database in `VECTOR_DATABASE_URL` directly. | Default: `true` |
| `VECTOR_DATABASE_URL` | URL | CLI | Postgres connection string for the `pgvector` provider (the maintenance URL when `VECTOR_DATABASE_CREATE=true`). | Required when `VECTOR_BUCKET_PROVIDER=pgvector` and `VECTOR_ENABLED` or `VECTOR_STORE_MIGRATIONS_ENABLED` is `true`; startup fails otherwise |
| `VECTOR_ENABLED` | boolean | CLI | Enable the vector bucket API in single-tenant mode. | Default: `false` |
| `VECTOR_MAX_BUCKETS` | integer |  | Max vector buckets per tenant. | Default: `10` |
| `VECTOR_MAX_INDEXES` | integer |  | Max indexes per vector bucket. | Default: `20` |
| `VECTOR_S3_BUCKETS` | string (CSV) |  | Comma-separated list of S3 Vectors buckets backing vector indexes. | Required when `VECTOR_BUCKET_PROVIDER=s3`; single-tenant mode uses the first entry |
| `VECTOR_STORE_MIGRATIONS_ENABLED` | boolean | CLI | Run the `pgvector` vector-store migrations at startup. | Default: `false`; only with `VECTOR_BUCKET_PROVIDER=pgvector` |

---

## Edge Functions

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `ALL_PROXY` / `all_proxy` | URL | | Default outbound proxy for all schemes for `fetch()` from user functions. | Read by `vendor/deno_fetch/proxy.rs` |
| `DENO_AUTH_TOKENS` | string | | Authentication tokens used when fetching remote modules (`<token>@<host>` syntax). | Read by `deno/file_fetcher.rs` |
| `DENO_CERT` | path | | Path to a PEM file with extra CA certificates loaded into Deno's TLS store. | Read by `ext/runtime/cert.rs` |
| `DENO_DIR` | path | | Override location of Deno's module/transpile cache directory. | Defaults to OS cache dir + `/deno` |
| `DENO_DISABLE_PEDANTIC_NODE_WARNINGS` | boolean | | Suppress pedantic Node.js compatibility warnings. | Read by `deno/args/mod.rs` |
| `DENO_FETCH_TIMEOUT_SECS` | integer (seconds) | | Timeout (seconds) for HTTP fetches made by the runtime when resolving/downloading modules. | No default |
| `DENO_NO_DEPRECATION_WARNINGS` | boolean | | Disable Deno API deprecation warnings. | Read at startup via `cli/src/env.rs` |
| `DENO_NO_PACKAGE_JSON` | boolean | | Disable auto-discovery of `package.json`. | Read by `deno/lib.rs` (set to `1`) |
| `DENO_REPL_HISTORY` | path | | REPL history file path (REPL isn't exposed by edge-runtime, but the var is read by embedded Deno). | Read by `deno/cache/deno_dir.rs` |
| `DENO_TCP_KEEPALIVE_SECS` | integer (seconds) | | TCP keepalive duration (seconds) for outbound `fetch()` connections. | Default: `30` |
| `DENO_TLS_CA_STORE` | string (CSV) | | Comma-separated list of TLS root stores to use (`mozilla`, `system`). | Default: `mozilla` |
| `DENO_USE_WRITEV` | boolean | | Enable `writev` for HTTP responses (perf experiment). | Default: off |
| `DENO_VERBOSE_WARNINGS` | boolean | | Emit verbose stack traces on deprecation warnings. | Read at startup via `cli/src/env.rs` |
| `EDGE_RUNTIME_ALLOC_CHECK_INT` | integer (ms) | | Interval (ms) between memory allocation checks for user workers. | Default: `1000` |
| `EDGE_RUNTIME_BUNDLE_CHECKSUM` | enum | | Default hash kind for the `bundle` subcommand (`sha256`, `xxhash3`, or `nochecksum`). | Wired to `--checksum` flag |
| `EDGE_RUNTIME_EVENT_WORKER_INITIAL_HEAP_SIZE_MIB` | integer (MB) | | V8 initial heap size (MiB) for the event worker. | Read at startup via `cli/src/env.rs` |
| `EDGE_RUNTIME_EVENT_WORKER_MAX_HEAP_SIZE_MIB` | integer (MB) | | V8 max heap size (MiB) for the event worker. | Read at startup via `cli/src/env.rs` |
| `EDGE_RUNTIME_INCLUDE_MALLOCED_MEMORY_ON_MEMCHECK` | boolean | | If truthy, include `malloced_memory` in the per-worker memory limit check. | Read at startup via `cli/src/env.rs` |
| `EDGE_RUNTIME_MAIN_WORKER_INITIAL_HEAP_SIZE_MIB` | integer (MB) | | V8 initial heap size (MiB) for the main worker. | Read at startup via `cli/src/env.rs` |
| `EDGE_RUNTIME_MAIN_WORKER_MAX_HEAP_SIZE_MIB` | integer (MB) | | V8 max heap size (MiB) for the main worker. | Read at startup via `cli/src/env.rs` |
| `EDGE_RUNTIME_PORT` | integer | | Port to listen on. | Wired to `--port`/`-p` flag; default `9000` |
| `EDGE_RUNTIME_PRIMARY_WORKER_POOL_SIZE` | integer (count) | | Tokio LocalPool size for the main + event workers. | Default: `1` |
| `EDGE_RUNTIME_TLS` | integer | | TLS listening port (presence enables TLS). | Wired to `--tls` flag; default-missing-value `443` |
| `EDGE_RUNTIME_TLS_CERT_PATH` | path | | Path to PEM X.509 certificate (when TLS enabled). | Wired to `--cert` flag |
| `EDGE_RUNTIME_TLS_KEY_PATH` | path | | Path to PEM-encoded private key (when TLS enabled). | Wired to `--key` flag |
| `EDGE_RUNTIME_WORKER_POOL_SIZE` | integer (count) | | Tokio LocalPool size for the user worker pool. | Default: `available_parallelism()` in release |
| `EXT_AI_CACHE_DIR` | path | | Directory used to cache ONNX model files downloaded by `Supabase.ai`. | Defaults to OS cache dir |
| `FUNCTIONS_MEMORY_LIMIT` | string | Self-hosted | Total memory limit for the functions container, shared by all workers. | Default: `2g` (2 GiB). Accepts Docker Compose memory sizes, such as `512m` or `4g`. Used by Compose to set `mem_limit`; not passed to the runtime as an environment variable. |
| `HTTP_PROXY` / `http_proxy` | URL | | HTTP outbound proxy for `fetch()` from user functions. | Read by `vendor/deno_fetch/proxy.rs` |
| `HTTPS_PROXY` / `https_proxy` | URL | | HTTPS outbound proxy for `fetch()` and for the S3 filesystem backend. | Read by `vendor/deno_fetch/proxy.rs` and `crates/fs/impl/s3_fs.rs` |
| `JSR_URL` | URL | | Override JSR (`jsr.io`) registry base URL. | Default: `https://jsr.io/` |
| `JWT_SECRET` | JWT | Self-hosted | Legacy HS256 symmetric secret. Used by the bundled main service to verify legacy JWTs and injected into user functions. | Consumed by `docker/volumes/functions/main/index.ts` |
| `NO_PROXY` / `no_proxy` | string (CSV) | | Comma-separated bypass list for proxy variables. | Read by `vendor/deno_fetch/proxy.rs` |
| `NPM_CONFIG_REGISTRY` | URL | | Override the npm registry base URL used to resolve `npm:` specifiers. | Default: `https://registry.npmjs.org` |
| `OMP_NUM_THREADS` | integer (count) | | Number of intra-op threads for the ONNX runtime used by `Supabase.ai`. | Default: `1` |
| `OTEL_EXPORTER_OTLP_CERTIFICATE` | path | | Path to PEM CA file used to verify the OTLP collector's TLS certificate. | Read by `vendor/deno_telemetry/lib.rs` |
| `OTEL_EXPORTER_OTLP_CLIENT_CERTIFICATE` | path | | Client cert for mTLS to the OTLP collector. | Read by `vendor/deno_telemetry/lib.rs` |
| `OTEL_EXPORTER_OTLP_CLIENT_KEY` | path | | Client key for mTLS to the OTLP collector. | Read by `vendor/deno_telemetry/lib.rs` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | URL | | OTLP collector endpoint. Setting it enables both runtime-level OTel and the OTLP exporter. | Presence required to enable telemetry |
| `OTEL_EXPORTER_OTLP_HEADERS` | string (CSV) | | Comma-separated headers attached to OTLP exports. | Picked up automatically by the OTLP SDK |
| `OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE` | enum | | OTel metrics temporality (`cumulative`, `delta`, `lowmemory`). | Default: `cumulative` |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | enum | | OTLP protocol (`http/protobuf` or `http/json`). | Default: `http/protobuf` |
| `OTEL_METRIC_EXPORT_INTERVAL` | integer (ms) | | Metric export interval in milliseconds. | Default: `60000` |
| `OTEL_RESOURCE_ATTRIBUTES` | string (CSV) | | Comma-separated `key=value` attributes added to every span/metric/log. | Picked up automatically by the OTLP SDK |
| `OTEL_SERVICE_NAME` | string | | `service.name` resource attribute used by the OTel exporter. | Picked up automatically by the OTLP SDK |
| `RUST_LOG` | string | | Filter directive for the Rust logger (e.g. `info`, `base=debug`, `trace`). | Read by `env_logger` / `tracing-subscriber` |
| `SUPABASE_ANON_KEY` | JWT | Both | Public ("anonymous") Supabase API key. Injected for user functions to call the public API. | Injected for user functions |
| `SUPABASE_DB_URL` | URL | Both | Postgres connection string. Injected for user functions that connect directly to Postgres. | Injected for user functions |
| `SUPABASE_JWKS` | JWKS | Both | JSON Web Key Set (asymmetric + legacy symmetric) used by the bundled main service to verify user JWTs. | Self-hosted can derive this from `SUPABASE_URL`'s `/auth/v1/.well-known/jwks.json`. |
| `SUPABASE_PUBLIC_URL` | URL | Self-hosted | External/public URL of the Supabase project. Injected for user functions. | Injected for user functions |
| `SUPABASE_PUBLISHABLE_KEYS` | JSON | Self-hosted | JSON map of opaque publishable API keys (new asymmetric-key format). | Injected for user functions |
| `SUPABASE_SECRET_KEYS` | JSON | Self-hosted | JSON map of opaque secret API keys (new asymmetric-key format). Never expose to client code. | Injected for user functions |
| `SUPABASE_SERVICE_ROLE_KEY` | JWT | Both | `service_role` API key (full database access). Injected for user functions for privileged calls. | Injected for user functions |
| `SUPABASE_URL` | URL | Both | Internal Supabase API URL (Kong gateway hostname in self-hosted setups). Injected for user functions. | Injected for user functions |
| `V8_FLAGS` | string | | Space-separated V8 command-line flags applied at startup (e.g. `--max-old-space-size=256`). | Read by `crates/base/src/runtime/mod.rs` |
| `VERIFY_JWT` | boolean | Self-hosted | If `true`, the bundled main service rejects requests whose JWT does not verify against `JWT_SECRET`/`SUPABASE_JWKS`. Applies to all functions. | Read by `docker/volumes/functions/main/index.ts`; supplied via `FUNCTIONS_VERIFY_JWT` in `.env.example` |

---

## Analytics

> The `analytics` container runs [logflare/logflare](https://github.com/Logflare/logflare), an Elixir/Phoenix application. Almost all runtime env reads live in [config/runtime.exs](https://github.com/Logflare/logflare/blob/main/config/runtime.exs). Self-hosted Supabase runs it in single-tenant Supabase mode with the Postgres backend; BigQuery support is available but commented out in `docker-compose.logs.yml`, the optional override that adds the `analytics` and `vector` containers. The container is the consumer of `LOGFLARE_PUBLIC_ACCESS_TOKEN`/`LOGFLARE_PRIVATE_ACCESS_TOKEN`.

> **Heads-up - always-on admin UI:** Logflare's admin pages under `/admin/*` (sources, accounts, cluster view) **are reachable by default**. `LOGFLARE_SUPABASE_MODE=true` provisions an auto-admin user, and the `/admin/*` routes are gated by an auth pipeline rather than an env var - there is no flag to disable them.
>
> If the `analytics` container is exposed beyond your private Docker network, **block** `/admin/*` at the reverse proxy or API gateway level.

> Analytics (Logflare) upstream self-hosting docs: [docs.logflare.app/self-hosting](https://docs.logflare.app/self-hosting/).

### Self-host mode

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `LOGFLARE_SINGLE_TENANT` | boolean | Both | Run Logflare in single-tenant mode (no per-tenant isolation, no signup flow). | Default: `false`. Self-hosted: `true` |
| `LOGFLARE_SUPABASE_MODE` | boolean | Both | Enable the Supabase preset: auto-creates the default source, wires the `analytics` container to the Supabase stack. | Default: `false`. Self-hosted: `true` |
| `LOGFLARE_PUBLIC_ACCESS_TOKEN` | string | Self-hosted | Public API token used by ingestion clients (e.g. the `vector` container) to push log events. Falls back to `LOGFLARE_API_KEY`. | Required in single-tenant mode |
| `LOGFLARE_PRIVATE_ACCESS_TOKEN` | string | Both | Private API token used by Studio server-side (and the management API) to query logs and run analytics endpoints. | Required in single-tenant mode |
| `LOGFLARE_FEATURE_FLAG_OVERRIDE` | string | Both | Comma-separated `key=value` pairs overriding feature flags at boot (lowercased). Self-hosted sets `multibackend=true`, which shows the backend management UI in Logflare's own web pages; the Postgres backend itself is selected by `POSTGRES_BACKEND_URL`. | E.g. `multibackend=true` |
| `LOGFLARE_NODE_HOST` | string | Both | Hostname used to form the Erlang `RELEASE_NODE` (`<name>@<host>`). The single-node default is fine for most self-hosted setups. | Default: `127.0.0.1`. |
| `LOGFLARE_API_KEY` | string | | Legacy fallback name for `LOGFLARE_PUBLIC_ACCESS_TOKEN`. | Deprecated; prefer `LOGFLARE_PUBLIC_ACCESS_TOKEN` |

### Internal database (metadata)

> These configure Logflare's own metadata Postgres connection (tenants, sources, endpoints). Self-hosted points them at the shared `supabase-db` container, schema `_analytics`.

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `DB_HOSTNAME` | string | Both | Hostname for Logflare's metadata Postgres. | Self-hosted: from `POSTGRES_HOST` |
| `DB_PORT` | integer | Both | Port for Logflare's metadata Postgres. | Default: `5432`. Self-hosted: from `POSTGRES_PORT` |
| `DB_DATABASE` | string | Both | Database name for Logflare's metadata Postgres. | Self-hosted: `_supabase` |
| `DB_SCHEMA` | string | Both | Postgres schema used for Logflare metadata tables (set as `search_path`). | Self-hosted: `_analytics` |
| `DB_USERNAME` | string | Both | Postgres user for Logflare's metadata connection. | Self-hosted: `supabase_admin` |
| `DB_PASSWORD` | string | Both | Postgres password for the metadata connection. | Self-hosted: from `POSTGRES_PASSWORD` |
| `DB_URL` | URL | | Connection URI for Logflare's metadata Postgres (`postgres://user:pass@host:port/db`). Values in the URI override the matching `DB_HOSTNAME`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` and `DB_DATABASE`; variables the URI omits stay in effect. | Query params: `ssl`, `pool_size`, `auth` (`password` or `aws_iam`), `aws_region`. Self-hosted uses the individual `DB_*` variables instead |
| `DB_POOL_SIZE` | integer (count) | | Ecto connection pool size for the metadata Postgres. | Default: `10` |
| `DB_SSL` | boolean | | Enable TLS 1.2/1.3 with server certificate verification for the metadata Postgres connection. Takes effect only if the files at `DB_SSL_CA_CERT_PATH`, `DB_SSL_CLIENT_CERT_PATH` and `DB_SSL_CLIENT_KEY_PATH` all exist; otherwise the connection stays unencrypted. | Default: `false` |
| `DB_SSL_CA_CERT_PATH` | path | | CA certificate used to verify the metadata Postgres server when `DB_SSL=true`. | Default: `db-server-ca.pem` (relative to `/opt/app/rel/logflare/bin`) |
| `DB_SSL_CLIENT_CERT_PATH` | path | | Client certificate presented to the metadata Postgres when `DB_SSL=true`. | Default: `db-client-cert.pem` (relative to `/opt/app/rel/logflare/bin`) |
| `DB_SSL_CLIENT_KEY_PATH` | path | | Private key for `DB_SSL_CLIENT_CERT_PATH`. | Default: `db-client-key.pem` (relative to `/opt/app/rel/logflare/bin`) |

### Postgres backend (log storage)

> With `LOGFLARE_SINGLE_TENANT=true` and `POSTGRES_BACKEND_URL` set, Logflare stores log events in a Postgres backend rather than BigQuery. Self-hosted points this at the same `db` container, database `_supabase`, schema `_analytics`.

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `POSTGRES_BACKEND_URL` | URL | Both | Connection URL for the Postgres log-storage backend. Setting it selects the Postgres backend over BigQuery. | Read only when `LOGFLARE_SINGLE_TENANT=true` |
| `POSTGRES_BACKEND_SCHEMA` | string | Both | Schema in the Postgres backend that holds log tables. | Self-hosted: `_analytics` |

### BigQuery backend (log storage)

> Disabled in the default self-hosted compose. To use BigQuery, comment out `POSTGRES_BACKEND_URL` and `POSTGRES_BACKEND_SCHEMA` in `docker-compose.logs.yml`, uncomment `GOOGLE_PROJECT_ID`, `GOOGLE_PROJECT_NUMBER` and the `gcloud.json` service-account key volume there, and set both IDs in the `.env` file. Logflare reads the Google credentials only when the Postgres backend isn't configured.

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `GOOGLE_PROJECT_ID` | string | Both | Google Cloud project ID hosting the BigQuery dataset. | Commented out in compose. CLI: with the BigQuery backend only |
| `GOOGLE_PROJECT_NUMBER` | string | Both | Numeric Google Cloud project number. | Commented out in compose. CLI: with the BigQuery backend only |
| `GOOGLE_APPLICATION_CREDENTIALS` | path | | Path to the Google service-account key file used for BigQuery. | Default: `gcloud.json` (relative to `/opt/app/rel/logflare/bin`, where the commented-out compose volume mounts it). Ignored when `GOOGLE_APPLICATION_CREDENTIALS_JSON` is set |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | JSON | | Google service-account key as inline JSON, used for BigQuery instead of a key file. | Takes precedence over `GOOGLE_APPLICATION_CREDENTIALS` |
| `GOOGLE_DATASET_ID_APPEND` | string | CLI | Suffix appended to BigQuery dataset IDs. | Default: `_default`. CLI: `_prod` (BigQuery backend only) |
| `GOOGLE_DATASET_LOCATION` | string | | BigQuery dataset location (e.g. `US`, `EU`). | Default: `US` |
| `GOOGLE_SERVICE_ACCOUNT` | string | | Service-account email used for BigQuery operations. | |
| `LOGFLARE_BIGQUERY_MANAGED_SA_POOL` | integer (count) | | Number of managed service accounts in the BigQuery SA pool. | Default: `0` |
| `LOGFLARE_BQ_WRITE_API_POOL_SIZE` | integer (count) | | Connection pool size for the BigQuery Write API. | Default: `10` |

### Server / Phoenix endpoint

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `PHX_HTTP_PORT` | integer | | HTTP port the Phoenix endpoint binds to. | Default: `4000` |
| `PHX_HTTP_IP` | string | | Bind IP for the HTTP endpoint. | |
| `PHX_URL_HOST` | string | | External host used to build absolute URLs. | |
| `PHX_URL_SCHEME` | string | | URL scheme (`http`/`https`). | |
| `PHX_URL_PORT` | integer | | External URL port. | |
| `PHX_SECRET_KEY_BASE` | string | | Phoenix session signing/encryption key. | Required in production; baked into the image for self-host |
| `PHX_CHECK_ORIGIN` | string (CSV) | | Comma-separated list of allowed origins for CSRF check. | |
| `PHX_LIVE_VIEW_SIGNING_SALT` | string | | Salt used for Phoenix LiveView token signing. | |
| `LOGFLARE_GRPC_PORT` | integer | | Port for the gRPC server (used for trace ingestion / OTLP). | Default: `50051` |
| `LOGFLARE_ENABLE_GRPC_SSL` | boolean | | Enable TLS for the gRPC server. Takes effect only if the files at `LOGFLARE_TLS_CERT_PATH` and `LOGFLARE_TLS_KEY_PATH` both exist; otherwise the server stays plaintext. | Default: `false` |
| `LOGFLARE_TLS_CERT_PATH` | path | | TLS certificate for the gRPC server when `LOGFLARE_ENABLE_GRPC_SSL=true`. | Default: `cert.pem` (relative to `/opt/app/rel/logflare/bin`) |
| `LOGFLARE_TLS_KEY_PATH` | path | | Private key for `LOGFLARE_TLS_CERT_PATH`. | Default: `cert.key` (relative to `/opt/app/rel/logflare/bin`) |
| `LOGFLARE_HTTP_CONNECTION_POOLS` | string (CSV) | | Comma-separated list of HTTP pool providers to enable. | Default: `all` |
| `LOGFLARE_PUBSUB_POOL_SIZE` | integer (count) | | PubSub connection pool size. | Default: `56` |
| `LOGFLARE_NODE_SHUTDOWN_CODE` | string | | Shared secret for `PUT /admin/shutdown`: a request whose `lf-shutdown-code` header matches it shuts down a Logflare node. | Unset: every shutdown request is rejected (401) |

### Logging

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `LOGFLARE_LOG_LEVEL` | enum | CLI | Logger level (`debug`, `info`, `warning`, `error`). | Default: `info`. `warn` is accepted as `warning`; other values keep the default. The image compiles out `debug` log calls |
| `LOGFLARE_LOGGER_JSON` | boolean | | Emit JSON-formatted log lines instead of plain text. | Default: `false` |
| `LOGFLARE_LOGGER_BACKEND_URL` | URL | | URL of a remote Logflare logger backend (forwards Logflare's own logs there). | |
| `LOGFLARE_LOGGER_BACKEND_API_KEY` | string | | API key for the remote logger backend. | |
| `LOGFLARE_LOGGER_BACKEND_SOURCE_ID` | string | | Source ID for the remote logger backend. | |

### Telemetry / Observability

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `LOGFLARE_OTEL_ENDPOINT` | URL | | OTLP collector endpoint. Presence enables tracing. | |
| `LOGFLARE_OTEL_SAMPLE_RATIO` | number (ratio) | | Default sampling ratio (0.0-1.0) for OTel traces. | Default: `1.0`. Other values fail at boot |
| `LOGFLARE_OTEL_INGEST_SAMPLE_RATIO` | number (ratio) | | Sampling ratio for ingest-path traces (falls back to default). | Must be 0.0-1.0; other values fail at boot |
| `LOGFLARE_OTEL_ENDPOINT_SAMPLE_RATIO` | number (ratio) | | Sampling ratio for endpoint-path traces (falls back to default). | Must be 0.0-1.0; other values fail at boot |
| `LOGFLARE_OTEL_SOURCE_UUID` | string | | Source UUID header attached to OTel exports. | |
| `LOGFLARE_OTEL_ACCESS_TOKEN` | string | | Access token header attached to OTel exports. | |
| `LOGFLARE_HEALTH_MAX_MEMORY_UTILIZATION` | number (ratio) | | Memory threshold for `/health` and `/ready`: once the BEAM's memory use divided by the host's total memory reaches it, they return 503. | Default: `0.95`. Must be 0.0-1.0; other values fail at boot |
| `LOGFLARE_ALERTS_ENABLED` | boolean | | Enable the alerting subsystem. | Default: `true` |

### Encryption

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `LOGFLARE_DB_ENCRYPTION_KEY` | string | | Primary base64 key used to encrypt sensitive columns. | Image fallback baked in |
| `LOGFLARE_DB_ENCRYPTION_KEY_RETIRED` | string | | Previously-active key, kept for decryption during rotation. | |

---

## Postgres

> The `db` container runs the `supabase/postgres` image, a fork of the official `postgres` image that adds Supabase-specific extensions (`pgsodium`, `pg_graphql`, `pgjwt`, etc.), default roles, and seed migrations. Most variables are inherited from the upstream `postgres` image and read by its `docker-entrypoint.sh` on first boot (initdb). A few are added by the Supabase fork or by init SQL that the self-hosted compose mounts into `/docker-entrypoint-initdb.d/init-scripts/`.

### Core (inherited from upstream `postgres` image)

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `POSTGRES_PASSWORD` | string | Both | Password for the `POSTGRES_USER` superuser. Set on first boot during `initdb`. | Required unless `POSTGRES_HOST_AUTH_METHOD=trust` |
| `POSTGRES_USER` | string | | Username for the initial superuser. The Supabase image overrides this. | Default: `supabase_admin` (Supabase image) |
| `POSTGRES_DB` | string | Self-hosted | Name of the first database to create. | Default: `postgres` |
| `POSTGRES_HOST` | string | Both | Unix socket directory or hostname Postgres listens on. The Supabase image hardcodes the socket path. | Default: `/var/run/postgresql` (Supabase image) |
| `POSTGRES_PORT` | integer | Self-hosted | TCP port Postgres listens on (Supabase migration scripts also read this). | Default: `5432` |
| `POSTGRES_INITDB_ARGS` | string | CLI | Extra arguments passed to `initdb` (locale, encoding, etc.). | Default in CLI: `--allow-group-access --locale-provider=icu --encoding=UTF-8 --icu-locale=en_US.UTF-8` |
| `POSTGRES_INITDB_WALDIR` | path | | Separate filesystem path used by `initdb` for the WAL directory. | When unset, WAL lives inside `PGDATA` |
| `POSTGRES_HOST_AUTH_METHOD` | enum | | Default `pg_hba.conf` authentication method (e.g. `trust`, `scram-sha-256`). | Defaults to `scram-sha-256` (Postgres 14+) |
| `PGDATA` | path | | Data directory used by Postgres. | Default: `/var/lib/postgresql/data` |

### libpq client variables (read by Supabase migration scripts on init)

> The Supabase image's `migrations/db/migrate.sh` runs at first boot and reads the standard libpq env vars rather than the `POSTGRES_*` ones. The compose file sets both so the entrypoint and the migration runner both work.

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `PGPORT` | integer | Self-hosted | TCP port for the migration runner's psql connection. | Self-hosted: mirrors `POSTGRES_PORT` |
| `PGPASSWORD` | string | Self-hosted | Password for the migration runner's psql connection. | Self-hosted: mirrors `POSTGRES_PASSWORD` |
| `PGDATABASE` | string | Self-hosted | Database name used by the migration runner. | Self-hosted: mirrors `POSTGRES_DB` |
| `PGHOST` | string | | Host used by the migration runner (defaults to socket path inside the container). | Self-hosted relies on `POSTGRES_HOST` |

### Supabase init SQL (mounted by docker-compose)

> These are consumed by SQL scripts the self-hosted compose mounts into `/docker-entrypoint-initdb.d/init-scripts/`. They are *not* read by the `supabase/postgres` image itself - they are read by init SQL under `docker/volumes/db/` (the orchestration layer).

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `JWT_SECRET` | string | CLI | HS256 secret used by GoTrue, PostgREST, and other services to sign and verify JWTs. Not exposed to SQL; store it in [Vault](https://supabase.com/docs/guides/database/vault) if a database function needs it. | Required. Sourced from `JWT_SECRET` in `.env.example` |
| `JWT_EXP` | integer (seconds) | Both | Default JWT expiry (seconds) stored as `app.settings.jwt_exp` on the `postgres` database. Read by `volumes/db/jwt.sql`. | Sourced from `JWT_EXPIRY` in `.env.example` |

---

## Supavisor

> Supavisor's upstream env-var reference is at [supabase/supavisor/docs/configuration/env.md](https://github.com/supabase/supavisor/blob/main/docs/configuration/env.md).

| Variable | Type | Set by | Description | Notes |
|---|---|---|---|---|
| `ADDR_TYPE` | enum | | Socket address family for the HTTP endpoint. Must be `inet` or `inet6`. | Default: `inet` |
| `API_JWT_SECRET` | string | Both | JWT secret used to authenticate requests to Supavisor's management API. | Self-hosted sets this to `JWT_SECRET` |
| `API_TOKEN_BLOCKLIST` | string (CSV) | | Comma-separated list of API JWTs to reject. | Default: empty |
| `APP_NAME_METRIC_ENABLED` | boolean | | Feature flag adding the client's `application_name` as an `app_name` label on the client connection metrics. | Default: `false`. Accepts `true`/`false`/`1`/`0`. A tenant's `feature_flags` overrides it |
| `CACHE_BYPASS_USERS` | string (CSV) | | Comma-separated list of DB users that bypass the auth-query cache. | Default: empty |
| `CHECK_SIMPLE_QUERY_PREPARE_ENABLED` | boolean | | Feature flag rejecting `PREPARE`, `EXECUTE` and `DEALLOCATE` sent over the simple query protocol in transaction mode, which supports prepared statements only through the extended query protocol. | Default: `false`. Accepts `true`/`false`/`1`/`0`. Parses every simple query, so it adds latency proportional to query size. A tenant's `feature_flags` overrides it |
| `CLEARTEXT_AUTH_OVER_TLS_ENABLED` | boolean | | Feature flag making non-JIT clients connected over TLS authenticate with a cleartext password instead of SCRAM-SHA-256. | Default: `false` (SCRAM over TLS). Accepts `true`/`false`/`1`/`0`. Only relevant when downstream TLS is configured (`GLOBAL_DOWNSTREAM_*` / `DOWNSTREAM_SERVER_ECDSA_*`). A tenant's `feature_flags` overrides it |
| `CLUSTER_ID` | string | | Region identifier used in the libcluster Postgres channel name. First of `CLUSTER_ID`, `LOCATION_ID`, `REGION` wins. | Only used when `CLUSTER_POSTGRES` is set |
| `CLUSTER_NODES` | string (CSV) | | Comma-separated list of Erlang node names for static EPMD clustering. | Optional |
| `CLUSTER_POSTGRES` | boolean | Both | Enables libcluster Postgres strategy (heartbeats via `pg_notify`). | Set to `true` to enable. Self-hosted: `true` |
| `DATABASE_URL` | URL | Both | Ecto URL for Supavisor's metadata database (tenants, users). Also used by the Postgres clustering strategy. | Default: `ecto://postgres:postgres@localhost:6432/postgres` |
| `DB_POOL_SIZE` | integer (count) | Self-hosted | Pool size for Supavisor's internal metadata Ecto repo. | Default: `25`. Self-hosted: from `POOLER_DB_POOL_SIZE` (default `5`) |
| `DEBUG_LOAD_RUNTIME_CONFIG` | boolean | | If set, hot-upgrade loads `config/runtime.exs` from CWD instead of the release dir. | Debug only |
| `DNS_POLL` | string | | DNS name to poll for libcluster `DNSPoll` strategy. | Optional |
| `DOWNSTREAM_SERVER_ECDSA_CERT` | path | | Path to ECDSA certificate file served to downstream clients. | Optional, file must exist |
| `DOWNSTREAM_SERVER_ECDSA_KEY` | path | | Path to ECDSA private key file served to downstream clients. | Optional, file must exist |
| `GLOBAL_DOWNSTREAM_CERT_PATH` | path | | Path to TLS certificate file served to downstream Postgres clients. | Optional, file must exist |
| `GLOBAL_DOWNSTREAM_KEY_PATH` | path | | Path to TLS private key file served to downstream Postgres clients. | Optional, file must exist |
| `GLOBAL_UPSTREAM_CA_PATH` | path | | Path to upstream CA bundle used to verify upstream Postgres TLS certificates. | Optional |
| `INSTANCE_ID` | string | | Instance identifier added to logger metadata. | Optional |
| `JWT_CLAIM_VALIDATORS` | JSON | | JSON object of additional JWT claims to validate (e.g. `{"iss":"supabase"}`). | Default: `{}` |
| `LOCATION_ID` | string | | Region identifier used in the libcluster Postgres channel name. Falls back to `REGION` if unset. | Only used when `CLUSTER_POSTGRES` is set |
| `LOCATION_KEY` | string | | Location label added to logger metadata. Falls back to `region` if unset. | Optional |
| `LOGFLARE_API_KEY` | string | | Logflare API key. Required when `LOGS_ENGINE=logflare`. | Required when `LOGS_ENGINE=logflare`; optional otherwise |
| `LOGFLARE_SOURCE_ID` | string | | Logflare source ID. Required when `LOGS_ENGINE=logflare`. | Required when `LOGS_ENGINE=logflare`; optional otherwise |
| `LOGS_ENGINE` | string | | Logging backend. Set to `logflare` to enable the Logflare HTTP logger backend. | Optional |
| `MAX_CONNECTIONS` | integer (count) | | Max concurrent connections accepted by the HTTP endpoint and Ranch proxy listeners. | Default: `1000` (HTTP), `:infinity` (proxy listeners) |
| `METRICS_JWT_SECRET` | string | Both | JWT secret used to authenticate requests to the metrics endpoint. | Self-hosted sets this to `JWT_SECRET` |
| `METRICS_TOKEN_BLOCKLIST` | string (CSV) | | Comma-separated list of metrics JWTs to reject. | Default: empty |
| `NAMED_PREPARED_STATEMENTS_ENABLED` | boolean | | Feature flag enabling named prepared statement support in transaction mode. | Default: `false`. Accepts `true`/`false`/`1`/`0`. A tenant's `feature_flags` overrides it |
| `NODE_IP` | string | | IP address used to build the Erlang `RELEASE_NODE` (`<name>@<ip>`). Also stored as `node_host` in app config. | Default: `127.0.0.1`. In Fly, falls back to the `fly-local-6pn` entry in `/etc/hosts` |
| `NODE_NAME` | string | | Erlang node basename. Used as `<name>@<ip>` for the release node. | Falls back to `FLY_APP_NAME`, then `supavisor` |
| `NO_WARM_POOL_USERS` | string (CSV) | | Comma-separated list of DB users for which Supavisor should not pre-warm a pool. | Default: empty |
| `NUM_ACCEPTORS` | integer (count) | | Number of acceptor processes per Ranch listener (HTTP endpoint and proxy listeners). | Default: `100` |
| `PORT` | integer | Both | HTTP port for the Phoenix endpoint (health, metrics, management API). | Default: `4000`. Self-hosted: `4000` |
| `POOLER_DEFAULT_POOL_SIZE` | integer (count) | Self-hosted | Default upstream pool size for the bootstrapped tenant. Read by the self-hosted `pooler.exs` provisioning script. | Configured via pooler.exs |
| `POOLER_MAX_CLIENT_CONN` | integer (count) | Self-hosted | Maximum client connections for the bootstrapped tenant. Read by the self-hosted `pooler.exs` provisioning script. | Configured via pooler.exs |
| `POOLER_POOL_MODE` | enum | Self-hosted | Pool mode for the bootstrapped tenant's user (`transaction` or `session`). Read by the self-hosted `pooler.exs` provisioning script. | Configured via pooler.exs. Self-hosted hard-codes `transaction` |
| `POOLER_TENANT_ID` | string | Self-hosted | External tenant ID created at first startup. Read by the self-hosted `pooler.exs` provisioning script. | Configured via pooler.exs. Required |
| `POSTGRES_DB` | string | Self-hosted | Tenant Postgres database name. Read by the self-hosted `pooler.exs` provisioning script. | Configured via pooler.exs |
| `POSTGRES_HOST` | string | Self-hosted | Tenant Postgres host. Read by the self-hosted `pooler.exs` provisioning script. | Configured via pooler.exs. Default in script: `db` |
| `POSTGRES_PASSWORD` | string | Self-hosted | Tenant Postgres password for the `pgbouncer` auth user. Read by the self-hosted `pooler.exs` provisioning script. | Configured via pooler.exs |
| `POSTGRES_PORT` | integer | Self-hosted | Tenant Postgres port. Read by the self-hosted `pooler.exs` provisioning script and used to map the session-mode listener port. | Configured via pooler.exs |
| `PROM_POLL_RATE` | integer (ms) | | Prometheus metrics poll interval in milliseconds. | Default: `15000` |
| `PROXY_PORT_SESSION` | integer | CLI | Postgres session-mode proxy listener port. | Default: `5432` |
| `PROXY_PORT_TRANSACTION` | integer | CLI | Postgres transaction-mode proxy listener port. | Default: `6543` |
| `REGION` | string | Both | Region label used in logger metadata and as the default for `LOCATION_KEY`. Also used in the libcluster Postgres channel name when `CLUSTER_ID`/`LOCATION_ID` are unset (Supavisor builds `supavisor_<region>_<maj>_<min>`). | Falls back to `FLY_REGION`. Self-hosted: `local` |
| `RELEASE_COOKIE` | string | | Erlang distribution cookie. Read by the release scripts. | Optional |
| `RELEASE_DISTRIBUTION` | string | | Erlang release distribution mode. Set to `name` by `rel/env.sh.eex`. | Default: `name` |
| `RELEASE_NODE` | string | | Erlang release node name (`<NODE_NAME>@<NODE_IP>`). Set by `rel/env.sh.eex`. | Computed at startup |
| `RELEASE_ROOT` | path | | Release root directory. Used to locate `runtime.exs` during hot upgrades. | Set by the release scripts |
| `RLIMIT_NOFILE` | integer (count) | CLI | Open-file descriptor limit applied by the container entrypoint (`limits.sh`). | Default: `100000` (baked into image) |
| `SECRET_KEY_BASE` | string | Both | Phoenix endpoint secret used to sign/encrypt session and CSRF tokens. | Required in non-dev/test envs |
| `SESSION_PROXY_PORTS` | string (CSV) | | Comma-separated list of additional internal session-mode proxy listener ports. | Default: `12100,12101,12102,12103` |
| `SUPAVISOR_DB_IP_VERSION` | enum | | Socket family for the connection to Supavisor's metadata database (`DATABASE_URL`) and for the libcluster Postgres strategy. `ipv6` uses `inet6`, `ipv4` uses `inet`. | Default: auto-detected from the `DATABASE_URL` host (IPv4 literal or a hostname that resolves over IPv4: `inet`; otherwise `inet6`). Any other value also auto-detects. Tenant upstream connections use the tenant's own `ip_version` instead |
| `SUPAVISOR_LOG_BURST_LIMIT_ENABLE` | boolean | | Enables burst-limit overload protection on the default logger handler: log events beyond `SUPAVISOR_LOG_BURST_LIMIT_MAX_COUNT` per `SUPAVISOR_LOG_BURST_LIMIT_WINDOW_TIME` are dropped. | Default: `true`. Only `true`/`1` enable it; any other set value disables it |
| `SUPAVISOR_LOG_BURST_LIMIT_MAX_COUNT` | integer (count) | | Max log events the default logger handler writes per burst-limit window. | Default: `500` |
| `SUPAVISOR_LOG_BURST_LIMIT_WINDOW_TIME` | integer (ms) | | Length of the logger burst-limit window. | Default: `1000` |
| `SUPAVISOR_LOG_FILE_PATH` | path | | If set, the default logger writes logs to this file (rotated, 8 MiB each, 5 files). | Optional |
| `SUPAVISOR_LOG_FORMAT` | enum | | Set to `json` to emit logs in Logflare JSON format. | Optional |
| `TRANSACTION_PROXY_PORTS` | string (CSV) | | Comma-separated list of additional internal transaction-mode proxy listener ports. | Default: `12104,12105,12106,12107` |
| `VAULT_ENC_KEY` | string | Both | AES.GCM encryption key for the Cloak vault used to encrypt tenant credentials at rest. | Required |
