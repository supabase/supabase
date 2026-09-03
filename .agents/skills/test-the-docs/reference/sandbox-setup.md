# Sandbox setup

Docker-isolated local execution for `/test-the-docs`. Requires Docker daemon up, non-root execution, a temp workspace, and fail-closed behavior when the daemon is down. This skill uses Docker as the **local Supabase data plane** (`supabase start`), not as an act/GHA runner.

## Threat model and guardrails

`mktemp` isolates the **project directory** only. Snippet commands still run on the host with the agent's environment and Docker access. That is intentional for a docs verification skill that needs `supabase start` on the host Docker daemon. Do not treat this as a disposable VM without host mounts.

This skill is for **docs authors and reviewers verifying intended content** (own draft, own PR, or a docs PR they chose to test). It is not an unattended CI runner over arbitrary untrusted PR input. Ordinary docs PRs still run; defer only out-of-policy fences.

Guardrails:

- **Local only.** Use `127.0.0.1` / `localhost` stack URLs. Reject snippets that target hosted or production Supabase projects.
- **No secrets in notes.** Never paste `PUBLISHABLE_KEY`, `SECRET_KEY`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `S3_PROTOCOL_ACCESS_KEY_ID`, `S3_PROTOCOL_ACCESS_KEY_SECRET`, or other keys into the Verification table, PR body, or chat logs.
- **Shell allowlist.** Before running a shell fence, require commands from: `supabase`, `psql`, `npm` / `npx` / `node` (example-app), and `curl` / `wget` only to `127.0.0.1` / `localhost`. Simple `&&` / `;` chains of allowlisted commands are OK.
- **Reject out-of-policy fences.** Mark `deferred` (with reason) for: command substitution / backticks that reach the host, pipes into unknown tools, host-path reads outside `$TMP` / the example app under test, Docker CLI invoked by snippets, and non-loopback Supabase/API targets. Do not fail the whole skill for one bad fence.
- **Prefer page commands.** Run documented steps from the MDX under test; do not run unrelated host-destructive commands.
- **Fail closed** when Docker/CLI prerequisites for that artifact class are missing (see skill Phase 4).

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

Require Docker + `supabase` CLI only for artifacts that need the local stack (`runnable-local` / `runnable-with-setup` with DB/API). `example-app` builds need Node/npm only. If a required check fails, mark **that** artifact `deferred` with the reason. Do not pretend it passed.

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

# Capture URLs only — never log credential fields from `supabase status -o env`
eval "$(supabase status -o env | grep -E '^(API_URL|DB_URL|DATABASE_URL)=' )"
```

Apply SQL or migrations from the doc in order. Use the local DB/API URL from the filtered status output for `psql` / client snippets.

## CLI-only (no database)

When blocks are help text, flag checks, or non-DB shell:

```bash
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
cd "$TMP"
# run commands here (still subject to allowlist + local-only + no-secrets guardrails)
```

Do not start the stack unless the snippet needs it.

## Teardown

Always stop the stack and remove the temp dir (see `trap` above). Leave Docker Desktop running for the next session; only stop the project containers.
