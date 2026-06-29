# Supabase self-hosted stack against Multigres

Runs the Supabase **self-hosted** stack (`docker/docker-compose.yml`) against an
external [Multigres](https://github.com/multigres/multigres) database, so the
Studio E2E suite can run against it.

## Prerequisites

1. **Docker** running.
2. **Multigres** running with its gateway on `127.0.0.1:15432`:
   ```bash
   git clone https://github.com/multigres/multigres
   cd multigres && docker compose up --build -d   # wait ~30s for healthy
   ```

## Usage

From the repo root:

```bash
pnpm e2e:multigres        # provision the database + start the stack
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

| File                          | Purpose                                                         |
| ----------------------------- | --------------------------------------------------------------- |
| `multigres.env`               | Stack env (demo secrets), with Postgres pointed at the gateway  |
| `docker-compose.override.yml` | Layers on `docker/docker-compose.yml` for the external database |
| `setup.sh`                    | Provisions the database and starts the stack                    |

## CI

`.github/workflows/studio-e2e-multigres-test.yml` runs this harness on PRs that
touch `e2e/studio/multigres/**` (or via **workflow_dispatch**), then runs the
Playwright suite against it and posts a report on the PR.
