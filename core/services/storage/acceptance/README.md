# Acceptance Tests

This suite verifies Supabase Storage as a black-box service. It is intentionally separate from
`src/test`: acceptance tests must talk to a running target through HTTP, S3, TUS, or admin
endpoints only. Do not import `src/app`, use `app.inject`, or call storage/database classes here.
See [`API_COVERAGE.md`](./API_COVERAGE.md) for the API/feature coverage inventory.

## Profiles

- `smoke` - fast target sanity plus REST and S3 lifecycle checks.
- `core` - smoke plus broader protocol behavior such as TUS and multipart.
- `wire` - smoke plus raw HTTP/SigV4 cases such as `aws-chunked` bodies and trailer negatives.
- `full` - all acceptance tests allowed by the configured target and capability gates.

## Run Against An Existing Target

The runner loads `.env.acceptance`. To use a different acceptance env file, set
`ACCEPTANCE_ENV_FILE`.

```bash
ACCEPTANCE_BASE_URL=http://127.0.0.1:5000 \
ACCEPTANCE_S3_ENDPOINT=http://127.0.0.1:5000/s3 \
ACCEPTANCE_SERVICE_KEY="..." \
ACCEPTANCE_S3_ACCESS_KEY_ID="..." \
ACCEPTANCE_S3_SECRET_ACCESS_KEY="..." \
npm run acceptance:run -- --profile full
```

For a hosted target with a path prefix, set `ACCEPTANCE_BASE_URL` to the public storage base,
for example `https://project.supabase.co/storage/v1`. Relative URLs returned by the API are
resolved against that base so prefix behavior is covered. Set `ACCEPTANCE_TARGET=remote` for
hosted targets; destructive tests then require `ACCEPTANCE_ALLOW_DESTRUCTIVE=true`.

For local targets on a non-default port, set `ACCEPTANCE_BASE_URL` explicitly.

## Managed Local Run

```bash
cp .env.sample .env
cp .env.test.sample .env.test
cp .env.acceptance.sample .env.acceptance
npm run acceptance -- --profile full
```

This restarts local infra, seeds dummy data, starts the TypeScript server from `.env.test` plus
`.env`, waits for `/status`, runs the acceptance profile, and then stops the server. Set
`ACCEPTANCE_SKIP_INFRA=true` to reuse already-running local infra.

The sample env and local CI default to `full`, so enabled capability-gated tests such as Iceberg
run by default. Use `--profile smoke` for a faster sanity run.

### Watt Runtime

Run the same managed acceptance suite against the current Storage Watt configuration with:

```bash
npm run acceptance:watt -- --profile full
```

This builds Storage, starts Watt with `watt.json`, waits for the `storage` application, runs the
selected acceptance profile, and then stops Watt.

For local backend variants, put server/runtime changes in `.env` or `.env.test`. Keep
`.env.acceptance` limited to acceptance runner inputs such as target URLs, client credentials,
capability gates, and resource naming.

Managed local runs start a lightweight in-process CDN purge stub when
`ACCEPTANCE_ENABLE_CDN=true` and the server env does not already set `CDN_PURGE_ENDPOINT_URL`.
Admin acceptance is enabled in the sample runner env, but it still requires a multitenant server
because the admin app is not started for single-tenant local runs. Managed single-tenant runs disable
admin acceptance automatically; managed multitenant runs populate the admin URL and API key from the
server env. Local CI enables admin only for multitenant matrix entries and enables pg-boss there so
admin queue contracts are backed by the expected schema. When local multitenant pg-boss is enabled
without an explicit queue URL, the managed runner uses the direct multitenant database URL so pg-boss
can install its schema instead of connecting through transaction pgbouncer. Managed local runs pass
the resolved `STORAGE_BACKEND` into the acceptance runner so path-edge tests can run only when the
backend is known to accept empty path segments.

### Local Render Tests

Image rendering tests need imgproxy to read the source image URL produced by the storage server.
The default local S3 endpoint is `http://127.0.0.1:9000`, which works for a host-run server but is
not reachable as RustFS from the Dockerized imgproxy container.

For S3-backed render coverage, keep normal S3 traffic on the host-reachable endpoint and use
`STORAGE_S3_PRIVATE_ASSET_ENDPOINT` for the Docker-reachable URL embedded in imgproxy source links:

```bash
STORAGE_BACKEND=s3 \
STORAGE_S3_PRIVATE_ASSET_ENDPOINT=http://rustfs:9000 \
ACCEPTANCE_ENABLE_RENDER=true \
npm run acceptance -- --profile full acceptance/specs/cdn-render.test.ts
```

The file backend also works because imgproxy mounts the local `./data` directory:

```bash
mkdir -p data
STORAGE_BACKEND=file ACCEPTANCE_ENABLE_RENDER=true npm run acceptance -- --profile full acceptance/specs/render.test.ts
```

Local CI enables render tests for both S3 and file backend runs. The S3 matrix sets
`STORAGE_S3_PRIVATE_ASSET_ENDPOINT=http://rustfs:9000`; file backend entries use the
default `STORAGE_FILE_BACKEND_PATH=./data` from `.env.sample`. Multitenant render
tests also rely on the local imgproxy container allowing security processing options
because tenant image limits are sent as `max_src_resolution`.

Local CI also enables admin acceptance for multitenant matrix entries. Path-edge coverage is derived
from the local storage backend, so empty path segment object names are exercised only on backends
that can store them.

Local CI enables vector acceptance on PostgreSQL, OrioleDB, and Multigres matrix rows using the
pgvector-backed local provider, covering both S3/file storage backends and single/multitenant modes.
OrioleDB rows use a locally built pgvector-enabled image, and Multigres rows use the upstream
`ghcr.io/multigres/multigres-cluster:latest` image, which is expected to include pgvector.
Single-tenant PostgreSQL and OrioleDB pgvector rows create and migrate a dedicated
`storage_vectors` database from `VECTOR_DATABASE_URL`; single-tenant Multigres rows set
`VECTOR_DATABASE_CREATE=false` and run vector migrations in the configured database because the
Multigres gateway does not support `CREATE DATABASE`. Multitenant pgvector rows provision the local
tenant with the configured tenant database URL and pool URL. Multitenant pgvector index DDL reuses
the active tenant transaction connection; single-tenant pgvector and S3 Vectors index creation keep
physical side effects outside retried metadata transactions and clean up committed metadata on
post-commit failures.

## GitHub Environments

The workflow dispatch `acceptance_environment` input uses `local` for the managed local run. Any
other option is treated as a GitHub Environment name and is used to populate `.env.acceptance` at
runtime. Store non-secret values such as `ACCEPTANCE_BASE_URL`, `ACCEPTANCE_REGION`, and capability
flags as environment variables, and store credentials such as `ACCEPTANCE_SERVICE_KEY` and S3
secrets as environment secrets.

## Useful Configuration

| Variable                                        | Meaning                                                                                            |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `ACCEPTANCE_BASE_URL`                           | REST base URL. Defaults to `http://127.0.0.1:5000`.                                                |
| `ACCEPTANCE_PROFILE`                            | Acceptance profile to run. Sample env and local CI default to `full`.                              |
| `ACCEPTANCE_S3_ENDPOINT`                        | S3 endpoint. Defaults to `$ACCEPTANCE_BASE_URL/s3`.                                                |
| `ACCEPTANCE_TUS_ENDPOINT`                       | TUS endpoint. Defaults to `$ACCEPTANCE_BASE_URL/upload/resumable`.                                 |
| `ACCEPTANCE_X_FORWARDED_HOST`                   | Optional tenant-routing host header for multitenant targets.                                       |
| `ACCEPTANCE_ADMIN_URL`                          | Admin API base URL for admin tests.                                                                |
| `ACCEPTANCE_SERVICE_KEY`                        | Service role JWT for REST tests.                                                                   |
| `ACCEPTANCE_S3_ACCESS_KEY_ID`                   | S3 protocol access key.                                                                            |
| `ACCEPTANCE_S3_SECRET_ACCESS_KEY`               | S3 protocol secret.                                                                                |
| `ACCEPTANCE_REGION`                             | S3 signing region. Defaults to `us-east-1`.                                                        |
| `ACCEPTANCE_RESOURCE_PREFIX`                    | Prefix for all resources created by this run.                                                      |
| `ACCEPTANCE_ENABLE_ADMIN`                       | Enables admin route tests. Requires admin URL and API key.                                         |
| `ACCEPTANCE_ADMIN_RETURN_TENANT_SENSITIVE_DATA` | Whether the admin API returns sensitive tenant fields (keys, database URL). Defaults to `true`.    |
| `ACCEPTANCE_ADMIN_DATABASE_URL_OVERRIDE`        | Database URL to provision tenants with when sensitive tenant data isn't returned (see above).      |
| `ACCEPTANCE_ENABLE_CDN`                         | Enables CDN purge tests. Managed local runs provide a purge stub by default.                       |
| `ACCEPTANCE_ENABLE_RENDER`                      | Enables image transformation tests.                                                                |
| `ACCEPTANCE_ENABLE_RLS_SETUP`                   | Enables RLS tests; requires service, anon, authenticated keys and bucket/prefix policy resources.  |
| `ACCEPTANCE_ENABLE_VECTOR`                      | Enables vector bucket API tests. Requires local pgvector or a configured S3 Vectors target.        |
| `VECTOR_BUCKET_PROVIDER`                        | Vector provider under test: `s3` (default) or `pgvector`. Controls provider-specific query limits. |
| `ACCEPTANCE_ENABLE_ICEBERG`                     | Enables Iceberg catalog API tests.                                                                 |
| `ACCEPTANCE_ENABLE_WIRE`                        | Enables wire-level tests outside the `wire` / `full` profiles.                                     |
| `ACCEPTANCE_RLS_BUCKET`                         | Bucket used by opt-in RLS tests. Defaults to local dummy `bucket2`.                                |
| `ACCEPTANCE_RLS_READ_OBJECT`                    | Existing object used for RLS read checks; unset self-provisions one under the write prefix.        |
| `ACCEPTANCE_RLS_WRITE_PREFIX`                   | Prefix where authenticated role may upload and anon may not.                                       |
| `ACCEPTANCE_ALLOW_DESTRUCTIVE`                  | Required for destructive tests when `ACCEPTANCE_TARGET=remote`.                                    |

## HTTPS And Wire Tests

The `wire` profile includes smoke coverage and uses a raw SigV4 client for `aws-chunked`
payloads. To verify proxy/TLS behavior, point `ACCEPTANCE_S3_ENDPOINT` at an HTTPS URL, for
example:

```bash
ACCEPTANCE_S3_ENDPOINT=https://storage.localhost/s3 \
ACCEPTANCE_TLS_REJECT_UNAUTHORIZED=false \
npm run acceptance:run -- --profile wire
```

`ACCEPTANCE_TLS_REJECT_UNAUTHORIZED=false` sets `NODE_TLS_REJECT_UNAUTHORIZED=0` in the runner
for local self-signed certificates. Do not use it for remote runs unless the target is explicitly
provisioned for that.

## Reset A Target Project

Repeated destructive runs against a shared target can leave behind buckets from crashed or interrupted runs.
The script `acceptance/scripts/reset-project.ts` wipes every storage, analytics (Iceberg), and vector bucket
in the target project so the next run starts clean. It preserves `ACCEPTANCE_RLS_BUCKET` (emptying its contents
but not deleting the bucket, since it carries hand-configured RLS policies the suite can't recreate).

The script reads the same `ACCEPTANCE_*` variables as the rest of the suite and does not load an
env file itself, so run it with `tsx --env-file`:

```bash
tsx --env-file=.env.acceptance-staging acceptance/scripts/reset-project.ts --yes
```

Omit `--yes` to preview what would be deleted without changing anything.
