# PR & rollout plan

Companion to [`README.md` § Phase 7](./README.md#phase-7--pr--rollout-plan).
This document is the single source of truth for the **per-PR**
breakdown so each one can be reviewed in <30 minutes.

---

## PR-1 (this repo, `supabase/supabase`)

**Title:** `docker/reliability: add auth-freeze investigation + opt-in deep health stack`

**Scope:** all files under `docker/reliability/auth-freeze/`.
**Touches existing files:** none.
**Behavioural change:** none (the override compose files are opt-in;
defaults are unchanged).

**Reviewers:** docker maintainers, SRE.

**CI:**
- shellcheck of `probes/*.sh` and `chaos/*.sh`.
- `go vet ./...` of `probes/deep-probe/`.
- `docker buildx build` of `probes/deep-probe/Dockerfile`.

---

## PR-2 (`supabase/auth`)

**Title:** `feat(api): add /healthz/deep deep healthcheck endpoint`

**Scope:** patch 02 only. Pure addition. No behaviour change for
existing `/health` users.

**Default:** `GOTRUE_DEEP_HEALTH_ENABLED=true`.

**Risk:** very low. The handler is read-only, bounded, and the route
is new.

**Reviewers:** auth maintainers.

**Acceptance test:** integration test that asserts:
- `GET /healthz/deep` returns 200 + valid JSON in <1 s on a healthy
  stack.
- Returns 503 within 1 s when Postgres is unreachable.

---

## PR-3 (`supabase/auth`)

**Title:** `feat(observability): in-flight tracker, Prometheus metrics, watchdog`

**Scope:** patch 03 only.

**Defaults:**
- `GOTRUE_METRICS_ENABLED=true`
- `GOTRUE_WATCHDOG_ENABLED=false` (operators must opt in)
- `GOTRUE_WATCHDOG_ACTION=log` (no exits even when opted in)

**Risk:** medium-low. The new metrics endpoint binds to a separate
port. The in-flight tracker adds a map insert/delete per request
(~50 ns).

**Reviewers:** auth maintainers + one observability reviewer.

**Acceptance test:** assert metrics endpoint serves Prometheus format
on `:9100/metrics` and that `gotrue_handler_inflight` increments
correctly under a parallel benchmark.

---

## PR-4 (`supabase/auth`)

**Title:** `feat(api): per-route request deadlines`

**Scope:** patch 01 only.

**Defaults:** `GOTRUE_REQUEST_DEADLINE_ENABLED=false` (operators
must opt in).

**Risk:** medium. Long-running OAuth / SAML flows must be in the
per-route override map; missing one would surface as 504s in
production. Pre-merge audit of all current routes ≥ 5 s p99 latency
is required.

**Reviewers:** auth maintainers (2x), product (for the 504 error class).

**Acceptance test:** unit + integration as documented in patch 01.

---

## PR-5 (`supabase/auth`)

**Title:** `feat(storage): pgx pool tuning + role-level safety nets`

**Scope:** patch 04 only.

**Defaults:** `GOTRUE_DB_SAFETY_NETS_ENABLED=false`. Pool sizing
defaults raised conservatively (max=25 from 10) — this **is** a
default change and must be called out in the changelog.

**Risk:** medium. The `ALTER ROLE` statement is durable; once
applied, it persists in `pg_authid` until explicitly reset. For
operators with custom timeouts already set, the patch is a no-op
because it ALTERs to the configured values (an operator who wants to
preserve their existing values should set the env vars to match).

**Reviewers:** auth maintainers + a Postgres reviewer.

**Acceptance test:** docker-compose integration that asserts
`pg_roles.rolconfig` contains the three settings after boot, and
that the chaos rig now recovers automatically within 60 s of
injection (previously: required manual restart).

---

## Rollout waves (recap)

```
Wave 0  this repo PR (this doc)        — zero risk, ship now
Wave 1  PR-2 + PR-5 (defaults: off)    — bake 1 week in staging
Wave 2  flip both to on in 5% canary   — bake 1 week
Wave 3  100% Pro                        — collect data
Wave 4  PR-3 (watchdog default off→log) — bake 2 weeks
Wave 5  PR-4 default flipped to true    — full deadline enforcement
Wave 6  watchdog action `log`→`exit`    — auto-recovery
```

Each wave gates on:
- p99 of `/token` ≤ pre-rollout baseline + 5 %.
- `AuthZeroSuccessfulLogins` did not fire.
- Error-budget burn rate <1× normal.

If any of the three trip, hold the wave for one more week and
investigate.
