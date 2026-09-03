# Management API (self-hosted)

A small local management server that brings cloud-style runtime configuration to
self-hosted Supabase. It currently manages the Auth (GoTrue) service:

- **Runtime Auth configuration** - configure OAuth providers, SMTP, MFA, rate
  limits, email subjects/templates, auth hooks and everything else exposed by
  the dashboard's Authentication pages, without editing `.env` files or
  restarting containers.
- **React email templates** - upload [react-email](https://react.email)
  components; they are rendered to HTML and served to GoTrue on the fly.

There is no clustering or multi-project support: it is a single-tenant local
server intended to run next to the rest of the self-hosted stack.

## How it works

```
Studio ──(server-side proxy /api/platform/auth/*)──▶ management-api
                                                        │  persists config
                                                        ▼
                                                     Postgres (schema `management`)
                                                        │  writes 90-managed.env
                                                        ▼
                                          shared volume (auth-runtime-config)
                                                        │  fsnotify live reload
                                                        ▼
                                              GoTrue (`auth --config-dir`)
```

GoTrue natively supports live configuration reloading: when started with
`--config-dir <dir>` it watches the directory and re-reads `*.env` files on
change ([supabase/auth `internal/reloader`](https://github.com/supabase/auth)).
The management API persists configuration in Postgres and materializes it as
`90-managed.env` in a volume shared with the auth container. Values in that
file override the container's static environment (`godotenv.Overload`), so the
compose `.env` remains the baseline and runtime changes take effect within
seconds - no restarts, no manual env editing.

Email template *content* cannot be passed through env vars (GoTrue only
accepts template URLs), so the service stores the content and serves it at
`/templates/<type>`, wiring `GOTRUE_MAILER_TEMPLATES_<TYPE>` to those URLs.

## API

Mirrors the platform API paths that Studio already calls, so the dashboard
works unchanged against it:

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/platform/auth/{ref}/config` | Current merged auth configuration |
| `PATCH` | `/platform/auth/{ref}/config` | Update any subset of config keys |
| `PATCH` | `/platform/auth/{ref}/config/hooks` | Update auth hook config |
| `POST` | `/platform/auth/{ref}/templates/{template}/reset` | Reset an email template to default |
| `PUT` | `/platform/auth/{ref}/templates/{template}/react` | Upload a react-email TSX template |
| `GET` | `/platform/auth/{ref}/templates/{template}/react` | Fetch the stored TSX source |
| `GET` | `/templates/{type}` | Rendered HTML (fetched by GoTrue, unauthenticated) |
| `GET` | `/health` | Health check |

All `/platform` endpoints require `Authorization: Bearer $MANAGEMENT_API_TOKEN`.
The `{ref}` segment is accepted for API compatibility and ignored (the
self-hosted stack has a single project, `default`).

Config keys are validated against the same `GoTrueConfigResponse` schema the
platform API uses (`src/auth-config-keys.ts`, generated from
`packages/api-types/types/platform.d.ts`), which keeps the surface in lockstep
with upstream: on new Supabase versions, regenerate the file and new settings
are supported automatically.

### React email templates

```bash
curl -X PUT "http://localhost:8085/platform/auth/default/templates/confirmation/react" \
  -H "Authorization: Bearer $MANAGEMENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --rawfile src emails/confirmation-example.tsx '{source: $src}')"
```

The component receives GoTrue's template variables as props
(`confirmationURL`, `token`, `tokenHash`, `siteURL`, `email`, `newEmail`,
`redirectTo`, `data`); their values are Go-template tokens that GoTrue
substitutes at send time. See `emails/confirmation-example.tsx`.

## Environment

| Var | Default | Description |
| --- | --- | --- |
| `PORT` | `8085` | Listen port |
| `DATABASE_URL` | - (required) | Postgres connection string for persistence |
| `MANAGEMENT_API_TOKEN` | - (required) | Bearer token for `/platform` endpoints |
| `AUTH_CONFIG_DIR` | `/etc/auth-runtime` | Directory watched by GoTrue |
| `SELF_URL` | `http://management-api:8085` | This service's URL as seen by GoTrue |
| `AUTH_CALLBACK_URL` | `${API_EXTERNAL_URL}/auth/v1/callback` | OAuth redirect URI advertised for enabled providers |
| `AUTH_DEFAULT_*` | - | Baseline values shown before any runtime override exists (e.g. `AUTH_DEFAULT_SITE_URL`) |
| `VAULT_ENC_KEY` / `MANAGEMENT_ENC_KEY` | - (one required) | Key used to encrypt credentials (SMTP password, provider secrets) at rest |

## Development

```bash
npm install
npm run typecheck
npm test
npm run dev
```
