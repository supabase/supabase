# Sandbox setup

Containerized local execution for `/test-the-docs`. The **host** only starts Docker Compose and tears it down. Every MDX fence (shell, SQL, JS/TS, example-app builds) runs **inside** the disposable `runner` container — never as a host shell.

Assets live in [`../sandbox/`](../sandbox/): `compose.yaml`, `Dockerfile`, `run.sh`.

## Threat model and guardrails

| Layer                  | What it does                                                                                                                                                                                                                                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host                   | `docker compose` lifecycle only (`run.sh up-*` / `down`). No fence execution.                                                                                                                                                                                                                                                            |
| Runner container       | Executes fences as non-root `runner` (uid 1001). No `$HOME` mount. Work dir is `/work`; optional read-only `/examples`.                                                                                                                                                                                                                  |
| DinD (`stack` profile) | Privileged `docker:dind` runs an isolated Docker daemon. `supabase start` creates stack containers **inside DinD**. The runner shares DinD’s network namespace (`network_mode: service:dind`) so `127.0.0.1` healthchecks and client URLs work. Residual risk: privileged DinD; mitigate with ephemeral project names and `run.sh down`. |
| Examples profile       | No DinD and no docker.sock — Node-only builds.                                                                                                                                                                                                                                                                                           |

This skill is for docs authors and reviewers verifying intended content. It is not unattended CI over arbitrary hostile input.

Guardrails:

- **Fences in-container only.** Never run MDX fences on the host shell. Use `./sandbox/run.sh exec` or `exec-timeout`.
- **Local stack only.** Reject snippets that target hosted or production Supabase projects.
- **No secrets in notes.** Never paste `PUBLISHABLE_KEY`, `SECRET_KEY`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `S3_PROTOCOL_ACCESS_KEY_ID`, `S3_PROTOCOL_ACCESS_KEY_SECRET`, or other keys into the Verification table, PR body, or chat logs. Capture **URLs only** from `supabase status -o env`.
- **`curl` / `wget`.** Only to URLs from the filtered status capture (`API_URL`, `DB_URL`, `DATABASE_URL`), or to local endpoints the page under test documents. Mark other targets `deferred`.
- **`npm` / `npx` / `node`.** Only for `example-app` artifacts. Mount the app read-only at `/examples`, copy into `/work/example`, then `npm install && npm run build` (or the page’s documented build). Arbitrary `node -e`, remote `npx`, or Node from unrelated bash fences → `deferred`.
- **Prefer page commands.** Run documented steps from the MDX under test.
- **Fail closed** when Docker/Compose prerequisites for that artifact class are missing (see skill Phase 4).

## Host prerequisites (fail closed)

```bash
if [[ "$(id -u)" = "0" ]]; then
  echo "error: refuse to run as root" >&2
  exit 1
fi
command -v docker >/dev/null || { echo "error: docker not found" >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo "error: Docker is not running" >&2; exit 1; }
docker compose version >/dev/null || { echo "error: docker compose not available" >&2; exit 1; }
```

The host does **not** need a global `supabase` CLI or Node for stack/example runs; those tools live in the runner image. If Docker/Compose is unavailable, mark artifacts that need the runner `deferred`.

## Lifecycle (`run.sh`)

From `.agents/skills/test-the-docs/sandbox/`:

```bash
# Optional: pin dirs / project name for the session
eval "$(./run.sh env)"

# Stack profile: DinD + runner → supabase init/start inside /work
./run.sh up-stack

# Capture URLs only inside the runner (never log credential fields)
./run.sh exec -- bash -lc '
  eval "$(supabase status -o env | grep -E "^(API_URL|DB_URL|DATABASE_URL)=")"
  echo "API_URL is set (value omitted from logs)"
'

# Run a fence with a deadline (process group killed on timeout)
./run.sh exec-timeout 60 -- bash -lc 'eval "$(supabase status -o env | grep -E "^(API_URL|DB_URL|DATABASE_URL)=")"; psql "$DB_URL" -c "select 1"'

# Examples profile (no DinD): mount the app, then build
TTD_EXAMPLE_DIR=/path/to/repo/examples/auth/hono ./run.sh up-examples
./run.sh exec-timeout 300 -- bash -lc 'cd /work/example && npm install && npm run build'

# Always tear down
./run.sh down
```

## Profiles

| Profile    | Services                | Isolation                        | Use when                                      |
| ---------- | ----------------------- | -------------------------------- | --------------------------------------------- |
| `stack`    | `dind` + `runner-stack` | Privileged DinD; fences off-host | SQL, CLI, client calls against local Supabase |
| `examples` | `runner`                | No Docker daemon in-sandbox      | `example-app` install/build only              |

Do not start the stack unless the artifact needs it.

## Teardown

Always `./run.sh down` (stops `supabase` project containers when possible, `compose down -v`, removes temp work/output dirs). Leave Docker Desktop running for the next session.
