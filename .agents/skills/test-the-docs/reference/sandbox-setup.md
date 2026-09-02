# Sandbox setup

Docker-isolated local execution for `/test-the-docs`. Patterns adapted from the contained E2E runner in [docs-agent-skills#16](https://github.com/supabase/docs-agent-skills/pull/16) (daemon check, non-root, temp workspace, fail closed). This skill uses Docker as the **local Supabase data plane** (`supabase start`), not as an act/GHA runner.

## Prerequisites (fail closed)

```bash
# Must not run as root (act / container users: --user 1001:1001 or equivalent)
if [[ "$(id -u)" = "0" ]]; then
  echo "error: refuse to run as root" >&2
  exit 1
fi

command -v docker >/dev/null || { echo "error: docker not found — install Docker Desktop" >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo "error: Docker is not running — start Docker Desktop" >&2; exit 1; }
command -v supabase >/dev/null || { echo "error: supabase CLI not found" >&2; exit 1; }
```

If any check fails during a docs review, mark affected snippets `deferred` with the failure reason. Do not pretend they passed.

## Temp project + local stack

Prefer a disposable project directory, not the monorepo root:

```bash
TMP=$(mktemp -d)
cleanup() {
  (cd "$TMP" && supabase stop 2>/dev/null) || true
  rm -rf "$TMP" 2>/dev/null || true
}
trap cleanup EXIT

cd "$TMP"
supabase init
supabase start
# Connection details:
supabase status -o env
```

Apply SQL or migrations from the doc in order. Use the local DB URL from `supabase status` for `psql` / client snippets.

## CLI-only (no database)

When blocks are help text, flag checks, or non-DB shell:

```bash
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
cd "$TMP"
# run commands here
```

Do not start the stack unless the snippet needs it.

## Teardown

Always stop the stack and remove the temp dir (see `trap` above). Leave Docker Desktop running for the next session; only stop the project containers.
