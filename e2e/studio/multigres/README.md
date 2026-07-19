# Supabase self-hosted stack against Multigres

Runs the Supabase **self-hosted** stack (`docker/docker-compose.yml`) against an
external [Multigres](https://github.com/multigres/multigres) database, so the
Studio E2E suite can run against it.

## Prerequisites

1. **Docker** running.
2. **Multigres** running with its gateway on `127.0.0.1:15432`, using the
   prebuilt [`multigres-cluster-supabase`](https://github.com/multigres/multigres/pkgs/container/multigres-cluster-supabase)
   image, which is already built on a `supabase/postgres:*-multigres` base so
   the Supabase roles/schemas/extensions exist via that image's `initdb`.
   `MULTIGRES_PG_EXTRA_CONF` sets `shared_preload_libraries` so pg_cron/pg_net/
   pg_stat_statements can load (they can't be enabled at runtime otherwise):
   ```bash
   docker run -d --name multigres-multigres-1 \
     -p 15432:15432 -p 15100:15100 -p 15000:15000 \
     -e MULTIGRES_NUM_CELLS=2 \
     -e MULTIGRES_GATEWAY_PG_PORT=15432 \
     -e MULTIGRES_PG_EXTRA_CONF="shared_preload_libraries = 'pg_cron,pg_net,pg_stat_statements'" \
     ghcr.io/multigres/multigres-cluster-supabase:latest   # wait ~30s for healthy
   ```

## Usage

From the repo root:

```bash
pnpm e2e:multigres        # sync demo passwords + start the stack
pnpm e2e:multigres:down   # stop the stack
```

or directly:

```bash
cd e2e/studio/multigres
./setup.sh up | status | down | provision
```

Once it's up, Studio is on `http://localhost:8082` and the API gateway on
`http://localhost:8000`.

## Pointing the E2E suite at this stack

Configure `e2e/studio/.env.local`:

```bash
STUDIO_URL=http://localhost:8082
API_URL=http://localhost:8000
IS_PLATFORM=false
```

then run from `e2e/studio`:

```bash
pnpm exec playwright test
```

## Files

| File                          | Purpose                                                           |
| ----------------------------- | ----------------------------------------------------------------- |
| `multigres.env`               | Stack env (demo secrets), with Postgres pointed at the gateway    |
| `docker-compose.override.yml` | Layers on `docker/docker-compose.yml` for the external database   |
| `setup.sh`                    | Syncs demo passwords onto the baked-in roles and starts the stack |

## CI

`.github/workflows/studio-e2e-multigres-test.yml` runs this harness on PRs that
touch `e2e/studio/multigres/**` (or via **workflow_dispatch**), then runs the
Playwright suite against it and posts a report on the PR.
