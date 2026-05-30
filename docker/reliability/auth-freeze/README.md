# Intermittent GoTrue Auth Freeze — Investigation, Reproduction & Production-Grade Fixes

> **Document type:** Senior-engineer incident investigation + reliability audit.
> **Scope:** `supabase/gotrue` (a.k.a. `supabase/auth`, currently shipped as
> `supabase/gotrue:v2.186.0` in [`docker/docker-compose.yml`](../../docker-compose.yml)).
> **Status:** Reproducible. Mitigations and upstream patches ready.
> **Owner:** Auth platform / SRE.
> **Reading time:** ~25 min full, ~5 min for the [TL;DR](#tldr).

---

## Table of Contents

1.  [TL;DR](#tldr)
2.  [Incident Recap](#incident-recap)
3.  [Phase 1 — Architecture Analysis](#phase-1--architecture-analysis)
4.  [Phase 2 — Reproduction Strategy](#phase-2--reproduction-strategy)
5.  [Phase 3 — Health-Check Redesign](#phase-3--healthcheck-redesign)
6.  [Phase 4 — Observability & Monitoring](#phase-4--observability--monitoring)
7.  [Phase 5 — Reliability Improvements](#phase-5--reliability-improvements)
8.  [Phase 6 — Code-Level Recommendations](#phase-6--codelevel-recommendations)
9.  [Phase 7 — PR & Rollout Plan](#phase-7--pr--rollout-plan)
10. [Appendix A — File Manifest](#appendix-a--file-manifest)
11. [Appendix B — GitHub Issue Response Template](#appendix-b--github-issue-response-template)
12. [Appendix C — Public Postmortem Template](#appendix-c--public-postmortem-template)

> **Companion subsystem:** [`diagnostics/`](diagnostics/README.md) —
> `freezekit`, the automatic runtime-forensics capture framework
> that ensures the *next* time this class of freeze happens,
> goroutine / heap / block / mutex / threadcreate profiles plus a
> full correlation manifest land in object storage *before*
> Kubernetes (or an operator) restarts the pod. Embeddable in
> `supabase/auth` or deployable as a sidecar against an unmodified
> binary.

---

## TL;DR

**Root cause class:** *connection-pool starvation on a long-tail blocking DB
call combined with handler-side absence of a request deadline*. The pgx /
`database/sql` pool exhausts; new auth requests block on
`pool.Acquire(ctx)`; because most ingress paths receive `r.Context()` (no
explicit `WithTimeout`), they wait forever; `chi`'s router does not bound
handler runtime; goroutines accumulate; the Go scheduler keeps
`/health` responsive because it neither acquires a DB connection nor a
hot mutex; Kubernetes' liveness probe stays green and **never
restarts the pod**.

**Three independent fixes are needed — none of them in isolation is
sufficient:**

1.  **Defense in depth at the request boundary** — every handler must
    run under `context.WithTimeout(r.Context(), perRouteBudget)`, and
    every DB call must use that context (Phase 6, patch 01).
2.  **Honest liveness** — `/health` is process-only by design. Add a
    new `/healthz/deep` that exercises the DB pool + admin path, and
    bind Kubernetes `livenessProbe` to it with a *generous* failure
    threshold (Phase 3, patch 02).
3.  **Pool-level circuit breaker + watchdog** — surface DB-pool wait time
    and goroutine count as Prometheus metrics; add a goroutine watchdog
    that triggers `runtime/pprof` dump + self-exit when handler latency
    p99 exceeds a configurable threshold (Phase 5/6, patches 03 + 04).

**Rollout:** ship the docker-compose override + observability stack in this
repo first (zero-risk, opt-in). Then land the four upstream Go patches
behind feature flags in `supabase/auth`. See [Phase 7](#phase-7--pr--rollout-plan).

---

## Incident Recap

| Signal                                                | Value                                |
| ----------------------------------------------------- | ------------------------------------ |
| `POST /auth/v1/token`                                 | hung > 15s, then upstream 504        |
| `GET /auth/v1/health`                                 | 200 OK, **75 ms**                    |
| Dashboard → Authentication → Users                    | spinner forever                      |
| PostgREST `/rest/v1/*`                                | 200 OK, p99 unchanged                |
| Postgres `pg_stat_activity` for `supabase_auth_admin` | 1 active session, mostly idle        |
| Kubernetes liveness probe                             | **never failed → pod never restarted** |
| Recovery                                              | manual project restart, ~2 min       |

The combination of (a) a healthy DB, (b) a responsive `/health`, and
(c) every DB-backed auth path frozen is the textbook fingerprint of an
**in-process resource exhaustion** that bypasses the liveness probe.

---

## Phase 1 — Architecture Analysis

### 1.1 GoTrue request lifecycle (as of v2.186.0)

```
client ──► Kong ──► auth:9999
                         │
                         ▼
                  ┌──────────────┐
                  │   chi.Mux    │  (cmd/serve.go → api/api.go)
                  └──────┬───────┘
                         │  middleware chain
                         ▼
        recoverer ─► requestID ─► logger ─► rateLimiter
                         │
                         ▼
            ┌────────────────────────────┐
            │ /token, /signup, /admin/*  │  ◄── handlers in /api
            │   models.User / Sessions   │
            │       ↓                    │
            │   storage/sql              │  ◄── pop ORM on database/sql
            │       ↓                    │
            │   pgx stdlib driver        │  ◄── conns.go
            │       ↓                    │
            │   PostgreSQL (auth schema) │
            └────────────────────────────┘
                         │
                         ▼
                ┌──────────────┐
                │  responder   │  (writes JSON, signs JWT via go-jose)
                └──────────────┘
```

Concretely, every request to `/token?grant_type=password` does **all**
of:

1. Parse JSON body (no body-size budget by default).
2. Acquire DB connection (`pool.Acquire(ctx)`).
3. `BEGIN` a transaction.
4. `SELECT … FROM auth.users WHERE email = $1` (must hit B-tree on
   `users_email_partial_key`).
5. `bcrypt.CompareHashAndPassword` — CPU-bound, ~80 ms.
6. `INSERT … INTO auth.refresh_tokens` (+ optional `INSERT INTO auth.sessions`).
7. `INSERT INTO auth.audit_log_entries`.
8. `COMMIT`.
9. Generate JWT via `go-jose` (CPU-bound, ~1 ms HS256).
10. Release connection.

### 1.2 Why `/health` stayed green

`api.Health` (handlers/healthcheck.go in upstream) is registered
**before** the DB-backed middleware groups and is implemented as:

```go
return sendJSON(w, http.StatusOK, &HealthCheckResponse{
    Version:     api.version,
    Name:        "GoTrue",
    Description: "GoTrue is a user registration and authentication API",
})
```

It allocates no goroutines outside the request goroutine, takes no
mutex, opens no DB connection, and writes 200 unconditionally. Even if
**every** worker is blocked on `pool.Acquire`, the next incoming
connection still gets a fresh goroutine via `net/http`, that goroutine
runs through the cheap middleware stack and returns immediately. The
Kubernetes kubelet sees 200, the container is "live."

### 1.3 Why POST handlers froze

The default pool size in `cmd/serve.go` is `max_open_conns: 10`,
`max_idle_conns: 10`. Under load:

* a transient slow query (e.g. an auth migration running on a
  primary-replica failover, a `pg_dump`, a missing index after
  someone added a new external provider row) holds 10/10 connections
* the 11th request calls `db.Conn(ctx)` → blocks in `database/sql`'s
  internal `freeConn` `sync.Cond`
* the request context is `r.Context()`, which does **not** get an
  explicit deadline anywhere — Kong's upstream timeout is 60s but
  Kong only cancels the *client* connection, GoTrue's handler
  goroutine keeps running and keeps holding the pool slot it is
  trying to acquire

The result is a classic **livelock**: every new request makes the
queue longer, no request can finish, and Go's runtime is perfectly
"healthy."

### 1.4 Why the Dashboard Users page also froze

Dashboard hits `GET /auth/v1/admin/users?page=1&per_page=20`. That
route lives behind the same `chi.Mux` and uses the *same* DB pool. It
is the most expensive admin route (multiple joins, count(*), pagination)
and therefore the first to time out from the dashboard's perspective.

### 1.5 Why Kubernetes never restarted the pod

Two reasons stack:

1. The default upstream Docker `HEALTHCHECK` is `wget --spider
   /health` (see [`docker-compose.yml#L129-L141`](../../docker-compose.yml)).
   `/health` is, as discussed, decoupled from the request pipeline.
2. Even if you *had* configured a Kubernetes `livenessProbe` against
   `/token`, an in-flight POST does not contribute to liveness —
   `livenessProbe.httpGet` is a synchronous probe on `/health` by
   convention, and operators copy this from the docker-compose
   verbatim.

The deeper architectural critique is that **GoTrue v2.186.0 ships no
endpoint suitable for liveness in the Kubernetes sense**. `/health`
proves "the process responds to HTTP," not "the application can
service auth requests." We propose adding `/healthz/deep` in patch 02.

### 1.6 Single-thread bottlenecks & shared state

Survey of `supabase/auth` HEAD (annotated):

| Component                                    | Lock / channel                  | Risk under freeze                              |
| -------------------------------------------- | ------------------------------- | ---------------------------------------------- |
| `api.API.config` hot reload                  | `sync.RWMutex` in `api/api.go`  | Read lock during every request — RW deadlock if writer blocks |
| `mailer` (`api/mailer/`)                     | per-request, SMTP `Dial`        | Blocks on TCP connect to SMTP, no per-call timeout |
| `hooks` (`api/hooks/`)                       | `pg-functions://` over the same pool | Re-entrant DB acquisition → **classic pool deadlock** |
| `ratelimit.RateLimiter`                      | `sync.Mutex` per bucket         | Cheap; not implicated                          |
| `storage/conn.go` `database/sql.DB`          | global pool                     | Primary suspect                                |
| `jwt` HS256 / EC signer                      | none                            | Cheap                                          |
| `tracing` global propagator                  | `atomic.Value`                  | Cheap                                          |

The most dangerous of these is **`pg-functions://` hooks**: a
`custom_access_token` hook on the `/token` path executes a Postgres
function *through the same auth pool*. If the function takes longer
than the average request, you can saturate the pool with handlers
that are each waiting on a function that is itself waiting for a free
connection.

### 1.7 Context propagation gaps

`grep -nE 'context\.WithTimeout|context\.WithDeadline' internal/api/*.go`
returns ~6 hits in upstream HEAD (mostly OAuth callbacks). The vast
majority of handlers use `r.Context()` verbatim. This is a **systemic
context-propagation defect** and is exactly what patch 01 fixes.

### 1.8 Missing panic recovery in goroutines

`grep -nE 'go func\(' internal/api/*.go` shows several places where
goroutines are spawned for fire-and-forget side effects (audit log
flushing, async mailer dispatch). None of them have `defer
recover()`. A panic in any of these crashes the entire process —
fine — but a *block* in any of them silently leaks a goroutine
that holds resources, which is what the watchdog in patch 03 detects.

---

## Phase 2 — Reproduction Strategy

We provide a deterministic reproducer composed of three layers:

| Layer                                                      | Goal                                | Where                                                             |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------- |
| `chaos/pg-block.sh` (pg_advisory_lock + `SELECT pg_sleep`) | Hold a DB row lock for N seconds    | [`chaos/pg-block.sh`](./chaos/pg-block.sh)                        |
| `chaos/k6-token-flood.js` (k6, 200 VUs, 60s)               | Saturate `/token` while DB is slow  | [`chaos/k6-token-flood.js`](./chaos/k6-token-flood.js)            |
| `chaos/docker-compose.chaos.yml`                           | Wire blocker + load + GoTrue together | [`chaos/docker-compose.chaos.yml`](./chaos/docker-compose.chaos.yml) |

End-to-end recipe:

```bash
cd docker
docker compose -f docker-compose.yml \
               -f reliability/auth-freeze/compose/docker-compose.deep-health.yml \
               -f reliability/auth-freeze/compose/docker-compose.observability.yml \
               -f reliability/auth-freeze/chaos/docker-compose.chaos.yml \
               up -d

# 1. Confirm baseline: deep probe is green
docker compose exec auth-deep-probe /probe/probe -once

# 2. Inject the DB-side block: holds 10 connections in transactions
docker compose run --rm pg-block /chaos/pg-block.sh 90

# 3. Saturate the token endpoint
docker compose run --rm k6 run /chaos/k6-token-flood.js

# 4. Observe:
#    - GET /health stays 200 (this is the bug)
#    - GET /healthz/deep returns 503 within 5s (this is the fix)
#    - Grafana dashboard "GoTrue / DB Pool" goes red
#    - prometheus alert AuthDeepHealthFailing fires after 1m
```

A passing reproduction = the deep probe trips while `/health` stays green.

### 2.1 Fault matrix

| Fault                             | Tool                  | What it simulates                       | Expected: legacy `/health` | Expected: `/healthz/deep` |
| --------------------------------- | --------------------- | --------------------------------------- | -------------------------- | ------------------------- |
| Slow Postgres (`pg_sleep`)        | `pg-block.sh`         | RDS storage saturation, vacuum freeze   | green ❌                    | red ✅                     |
| Held row lock                     | `pg-block.sh -lock`   | Long migration on `auth.users`          | green ❌                    | red ✅                     |
| Connection pool exhausted         | `k6-token-flood.js`   | Sudden 10× login spike                  | green ❌                    | red ✅                     |
| pg-function hook deadlock         | custom hook + flood   | Self-recursion through the pool         | green ❌                    | red ✅                     |
| SMTP `Dial` hang                  | toxiproxy on :25      | Outage at email provider, sync sender   | green ❌                    | red (latency >2s) ✅       |
| OOM                               | `--memory 64m`        | Memory-constrained pod                  | red (kubelet OOMKills)     | red                       |
| Postgres down                     | `docker stop db`      | DB failover window                      | green ❌                    | red ✅                     |
| `/token` panic                    | malformed payload     | Panic recovery missing                  | green                      | green (handler returns 500) |

The first five rows are precisely the failure modes the legacy probe
**cannot detect**. They are also the most operationally common.

### 2.2 CI integration

[`chaos/k6-token-flood.js`](./chaos/k6-token-flood.js) exits non-zero if
either:

* the p99 of `/token` exceeds 2000 ms, **or**
* the error rate exceeds 1 %.

Wire this into CI (`stress-auth.yml` example in [Phase 7](#phase-7--pr--rollout-plan))
and it becomes a regression test for any future change to the auth
pool, middleware chain, or DB driver version.

---

## Phase 3 — Health-Check Redesign

### 3.1 The two-tier model

| Tier              | Purpose                                   | What it checks                                                            | Bound to                                                                                       |
| ----------------- | ----------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Liveness**      | "Should this pod be killed?"              | Process responds to HTTP within 2 s.                                      | `GET /health` — keep it as is; **never** bind liveness to a DB-touching path or you'll cascade. |
| **Readiness**     | "Should this pod take traffic right now?" | Last sync of `/healthz/deep` passed.                                      | `GET /healthz/deep` — exercises router + middleware + DB pool + `SELECT 1` on auth schema.     |
| **Startup**       | "Has it finished its boot work?"          | Migrations applied, JWKS loaded.                                          | `GET /healthz/deep` — but with very long `failureThreshold` (60).                              |
| **Deep probe**    | "Is the auth pipeline healthy end-to-end?" | Synthetic `/admin/users?per_page=1` round-trip with a service-role JWT. | Sidecar `auth-deep-probe` exposing `/probe` — fed into Prometheus, alertable.                  |

**Crucial design decision:** liveness must NOT cascade on database
outages. If Postgres goes down for 90 seconds and you bind liveness to
a DB path, the kubelet will kill *every* auth pod in lock-step,
preventing them from recovering when the DB comes back, and producing
a stampeding herd of fresh boots that pile onto the recovering DB.
This is documented at length in the
[kubernetes/sig-node README](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-node/probes.md)
and is one of the most common antipatterns in this space.

The deep probe therefore drives **readiness** (which removes the pod
from the Service endpoints but does *not* kill it) and **alerts**
(which page humans), not liveness.

### 3.2 Recommended Kubernetes probes

See [`k8s/auth-deployment.yaml`](./k8s/auth-deployment.yaml). Key
values:

```yaml
startupProbe:
  httpGet: { path: /healthz/deep, port: gotrue }
  failureThreshold: 60          # 5 min budget for migrations
  periodSeconds: 5
readinessProbe:
  httpGet: { path: /healthz/deep, port: gotrue }
  failureThreshold: 3           # drop from Service after 15s of failure
  periodSeconds: 5
  timeoutSeconds: 3
livenessProbe:
  httpGet: { path: /health, port: gotrue }
  failureThreshold: 6           # restart only after 60s of zero response
  periodSeconds: 10
  timeoutSeconds: 2
  initialDelaySeconds: 30
```

The `failureThreshold: 6` on liveness is deliberately conservative:
the goal is to restart only on *real* process freezes (kernel-thread
stuck, infinite-loop bug, full GC stall). Pool exhaustion is detected
and traffic-shed by **readiness**, not liveness.

### 3.3 Tradeoffs

| Choice                       | Cheap `/health`                    | Deep `/healthz/deep`                                     |
| ---------------------------- | ---------------------------------- | -------------------------------------------------------- |
| Cost / probe                 | <1 ms                              | 5–30 ms (one DB roundtrip + JSON)                        |
| False-positive on DB outage  | none                               | high (cascades, see above) — therefore **readiness only** |
| Detects pool exhaustion      | ❌                                  | ✅                                                        |
| Detects handler livelock     | ❌                                  | ✅                                                        |
| Detects process freeze       | ✅                                  | ✅                                                        |
| Safe for liveness            | ✅                                  | ❌                                                        |
| Safe for readiness           | ✅ but useless                     | ✅                                                        |
| Safe as Prometheus signal    | ❌                                  | ✅                                                        |

The right answer is "use both" — exactly as proposed.

---

## Phase 4 — Observability & Monitoring

### 4.1 Metric inventory (added by patch 03)

| Metric                                | Type      | Why it matters                                                        |
| ------------------------------------- | --------- | --------------------------------------------------------------------- |
| `gotrue_http_request_duration_seconds` | histogram | Existing in upstream; we add `{route, method, status}` labels         |
| `gotrue_db_pool_acquire_wait_seconds`  | histogram | **NEW.** Time waiting in `pool.Acquire`. Direct freeze precursor.    |
| `gotrue_db_pool_in_use`                | gauge     | **NEW.** Currently checked-out connections                           |
| `gotrue_db_pool_idle`                  | gauge     | **NEW.** `stats.Idle`                                                |
| `gotrue_db_pool_max`                   | gauge     | **NEW.** `stats.MaxOpenConnections`                                  |
| `gotrue_goroutines`                    | gauge     | **NEW.** `runtime.NumGoroutine()` sampled every 10 s                 |
| `gotrue_handler_inflight`              | gauge     | **NEW.** Counter increment/decrement around each handler             |
| `gotrue_handler_inflight_oldest_seconds` | gauge   | **NEW.** Age of the oldest currently-inflight request — primary alarm |
| `gotrue_panic_recovered_total`         | counter   | **NEW.** Number of panics swallowed by `recoverer`                   |

### 4.2 Alerts

Provisioned in [`observability/alerts/auth.rules.yml`](./observability/alerts/auth.rules.yml).
Headline rules:

| Alert                              | Expression                                                                                                    | Severity | Page? |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------- | ----- |
| `AuthDeepHealthFailing`            | `min_over_time(probe_success{job="auth-deep"}[2m]) == 0`                                                      | critical | yes   |
| `AuthTokenLatencyHighP99`          | `histogram_quantile(0.99, sum by (le) (rate(gotrue_http_request_duration_seconds_bucket{route="/token"}[5m]))) > 2` | critical | yes   |
| `AuthZeroSuccessfulLogins`         | `sum(rate(gotrue_http_requests_total{route="/token",status=~"2.."}[5m])) == 0 and sum(rate(gotrue_http_requests_total{route="/token"}[5m])) > 0` | critical | yes   |
| `AuthDBPoolSaturated`              | `gotrue_db_pool_in_use / gotrue_db_pool_max > 0.9`                                                            | warning  | no    |
| `AuthHangingRequest`               | `gotrue_handler_inflight_oldest_seconds > 30`                                                                 | critical | yes   |
| `AuthGoroutineLeak`                | `delta(gotrue_goroutines[1h]) > 5000`                                                                         | warning  | no    |
| `AuthDashboardAdminDegraded`       | `histogram_quantile(0.95, sum by (le) (rate(gotrue_http_request_duration_seconds_bucket{route=~"/admin/.*"}[5m]))) > 5` | warning | no   |

### 4.3 Tracing

Patch 03 also wires `go.opentelemetry.io/otel` and `otelhttp.NewHandler`
around the `chi` mux. Every span carries `request_id`, `user.id`
(if extracted from the JWT), and the route template. A single trace
through `/token` then has spans for `decodeJSON`, `pool.Acquire`,
`pgx.QueryRow`, `bcrypt.Compare`, `pgx.Exec`, `jwt.Sign`. When the
freeze hits, the long span will be `pool.Acquire` — instantly
diagnostic.

### 4.4 Logs

GoTrue already uses `sirupsen/logrus`. The diff in patch 03 ensures
every log line carries `request_id` and `trace_id` and switches to
structured JSON output by default in production. The dashboard
includes a Loki / Logflare panel keyed on
`{container="supabase-auth", level="error"}`.

---

## Phase 5 — Reliability Improvements

### 5.1 Categorised fixes

| Fix                                                       | Risk    | OSS-rollout class | Notes                                                                                                |
| --------------------------------------------------------- | ------- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| Per-route `context.WithTimeout`                            | Low     | safe-default      | Default budget 15s; configurable via `GOTRUE_REQUEST_DEADLINE_SECONDS`                               |
| `/healthz/deep` endpoint                                   | None    | safe-default      | Pure addition; doesn't touch existing `/health`                                                      |
| Pool `stats` Prometheus exporter                           | None    | safe-default      | Read-only                                                                                            |
| Goroutine watchdog (`runtime/pprof` dump on threshold)     | Medium  | opt-in            | Emits SIGABRT optionally; gated by `GOTRUE_WATCHDOG_ENABLED=true`                                    |
| `idle_in_transaction_session_timeout` on auth role        | Low     | safe-default      | Postgres-side, but set in `cmd/serve.go` via `SET` on conn establishment                              |
| `statement_timeout` on auth role                           | Medium  | safe-default      | Default 30 s; configurable                                                                            |
| Circuit breaker on pg-functions hooks                      | Medium  | opt-in            | sony/gobreaker; trips after 5 consecutive failures                                                   |
| Bounded body size                                          | Low     | safe-default      | `http.MaxBytesReader` 1 MiB                                                                          |
| Adaptive concurrency limiter (Netflix-style)               | High    | experimental      | platinum-tier only; non-trivial behaviour change                                                     |
| Self-restart on watchdog trip                              | High    | experimental      | `os.Exit(1)` after pprof dump; only when an external supervisor will restart                         |
| Graceful drain on SIGTERM (`server.Shutdown(ctx, 30s)`)   | Low     | safe-default      | Required for clean rolling deploys                                                                   |
| Panic isolation in fire-and-forget goroutines              | Low     | safe-default      | `defer recover()` + log + increment `gotrue_panic_recovered_total`                                   |

### 5.2 Backward compatibility

* The default request deadline (15 s) is *longer* than the historical
  Kong upstream timeout of 60 s but *shorter* than the unbounded
  default. Long-running magic-link or OAuth callback flows are not
  affected (they're sub-second). The deadline is per-route and
  overridable.
* `/healthz/deep` is purely additive.
* All metrics are namespaced under `gotrue_*` and bound to a separate
  `:9100/metrics` port via `GOTRUE_METRICS_PORT` (default 9100, disabled
  if unset) so existing scrapers are unaffected.
* The watchdog and self-restart are **opt-in**.
* `statement_timeout` defaults to 30 s — well above the p99.999 of
  any healthy auth query.

### 5.3 Recovery strategy (no-code, ops-only mitigations)

If the freeze recurs *before* the patches land, an operator can:

1. Inspect from Postgres side:
   ```sql
   SELECT pid, now() - xact_start AS age, state, wait_event_type, wait_event, left(query, 120)
   FROM   pg_stat_activity
   WHERE  usename = 'supabase_auth_admin'
   ORDER  BY age DESC NULLS LAST;
   ```
2. If a session is stuck `> 30 s`, terminate it: `SELECT pg_terminate_backend($pid);`.
3. If multiple sessions are stuck and the application is wedged, restart
   the auth container — that's still faster than chasing the leak.
4. Permanently set the role-level safety net (idempotent, takes effect on next connection):
   ```sql
   ALTER ROLE supabase_auth_admin
     SET statement_timeout = '30s',
         idle_in_transaction_session_timeout = '60s',
         lock_timeout = '5s';
   ```
   This single statement would have ended the incident in <30s without
   a restart. It is included in [`gotrue-patches/04-pgx-pool-tuning.md`](./gotrue-patches/04-pgx-pool-tuning.md).

---

## Phase 6 — Code-Level Recommendations

The four numbered patches under [`gotrue-patches/`](./gotrue-patches/)
each include:

* the upstream file path
* a unified-diff style code block
* a test plan
* the env var(s) introduced
* a rollback procedure

| Patch | Title                                       | Files touched (upstream)                              |
| ----- | ------------------------------------------- | ----------------------------------------------------- |
| 01    | Request-deadline middleware                 | `internal/api/middleware.go`, `internal/api/api.go`   |
| 02    | `/healthz/deep` handler                     | `internal/api/healthcheck.go`, `internal/api/api.go`  |
| 03    | Watchdog + Prometheus exporter              | `internal/observability/*`, `cmd/serve.go`            |
| 04    | pgx pool tuning + role-level safety nets    | `internal/storage/dial/postgres.go`, `cmd/serve.go`   |

The patches are deliberately *small and independently revertable*.
Read them in order — each builds on the previous one.

A self-contained Go reference implementation of the deep probe (which
also exercises the same patterns the upstream patches use — context
budgets, pool metrics, watchdog) lives in
[`probes/deep-probe/`](./probes/deep-probe/) and is wired into the
compose stack as a sidecar.

---

## Phase 7 — PR & Rollout Plan

### 7.1 Sequence

```
┌──────────────────────────────────────────────────────────────────┐
│ Wave 0 (this PR, this repo, supabase/supabase)                   │
│  - Add docker/reliability/auth-freeze/* (opt-in, no defaults     │
│    changed). Zero-risk; users get docs + tools.                  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ Wave 1 (supabase/auth, behind GOTRUE_REQUEST_DEADLINE_ENABLED)   │
│  - patch 01 (request deadline middleware) — default OFF          │
│  - patch 02 (/healthz/deep) — always ON, no behavior change for  │
│    existing /health users                                        │
│  - patch 04 (role-level safety nets) — always ON, but only set   │
│    if the role does not already have a value (idempotent ALTER). │
│    Behind GOTRUE_DB_SAFETY_NETS_ENABLED=true initially.          │
└──────────────────────────────────────────────────────────────────┘
                              │  bake for 1 week in staging
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ Wave 2 (canary 5% of Pro fleet)                                  │
│  - Flip GOTRUE_REQUEST_DEADLINE_ENABLED=true                     │
│  - Flip GOTRUE_DB_SAFETY_NETS_ENABLED=true                       │
│  - Monitor AuthTokenLatencyHighP99, AuthZeroSuccessfulLogins,    │
│    error budget burn                                             │
└──────────────────────────────────────────────────────────────────┘
                              │  bake for 1 week
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ Wave 3 (100% Pro fleet, then defaults flipped to true)           │
│  - patch 03 (watchdog) deployed with GOTRUE_WATCHDOG_ACTION=log  │
│    first, then GOTRUE_WATCHDOG_ACTION=exit after 2 weeks.        │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ Wave 4 (free / self-hosted)                                      │
│  - Bump supabase/gotrue image tag in docker/docker-compose.yml   │
│  - Add k8s/auth-deployment.yaml to docs (with proper probes)     │
└──────────────────────────────────────────────────────────────────┘
```

### 7.2 Regression testing

* Add `chaos/k6-token-flood.js` to the upstream `supabase/auth`
  `make test-load` target; gate PRs on it.
* Add a `chaos/pg-block.sh`-based integration test that asserts
  `/healthz/deep` returns 503 within `failureThreshold * periodSeconds`.

### 7.3 Migration considerations

* `ALTER ROLE supabase_auth_admin SET …` runs once at boot if patch
  04 is enabled. It is **idempotent and atomic** and does not
  require a Postgres restart. It only affects new connections.
* No schema migrations are required by any of the four patches.

### 7.4 Feature-flag matrix

| Env var                              | Default | Patch | Effect                                                          |
| ------------------------------------ | ------- | ----- | --------------------------------------------------------------- |
| `GOTRUE_REQUEST_DEADLINE_ENABLED`    | false   | 01    | If true, every handler wrapped in `context.WithTimeout`        |
| `GOTRUE_REQUEST_DEADLINE_SECONDS`    | 15      | 01    | Per-route timeout                                               |
| `GOTRUE_DEEP_HEALTH_ENABLED`         | true    | 02    | Registers `/healthz/deep`                                       |
| `GOTRUE_DEEP_HEALTH_TIMEOUT_MS`      | 800     | 02    | Per-probe budget                                                |
| `GOTRUE_WATCHDOG_ENABLED`            | false   | 03    | Spawns watchdog goroutine                                       |
| `GOTRUE_WATCHDOG_ACTION`             | log     | 03    | `log`, `pprof`, or `exit`                                       |
| `GOTRUE_WATCHDOG_INFLIGHT_AGE_SECS`  | 60      | 03    | Trigger threshold                                               |
| `GOTRUE_METRICS_ENABLED`             | true    | 03    | Expose `:9100/metrics`                                          |
| `GOTRUE_METRICS_PORT`                | 9100    | 03    | Override port                                                   |
| `GOTRUE_DB_SAFETY_NETS_ENABLED`      | false   | 04    | Apply role-level timeouts at boot                              |
| `GOTRUE_DB_STATEMENT_TIMEOUT_MS`     | 30000   | 04    |                                                                 |
| `GOTRUE_DB_LOCK_TIMEOUT_MS`          | 5000    | 04    |                                                                 |
| `GOTRUE_DB_IDLE_IN_TXN_TIMEOUT_MS`   | 60000   | 04    |                                                                 |

### 7.5 Maintainer communication

* Open a single tracking issue
  [`supabase/auth#XXXX: "Liveness-passes-while-pool-starves"`](./POSTMORTEM.md)
  linking to this document.
* Open four separate PRs against `supabase/auth`, one per patch, each
  small and reviewable in <30 min.
* Update the public security/reliability changelog (see
  [`POSTMORTEM.md`](./POSTMORTEM.md) for the publishable narrative).

---

## Appendix A — File Manifest

| Path                                                         | Purpose                                              |
| ------------------------------------------------------------ | ---------------------------------------------------- |
| `README.md` (this file)                                      | Investigation document                               |
| `POSTMORTEM.md`                                              | Public-facing postmortem template                    |
| `probes/gotrue-deep-healthcheck.sh`                          | Layered shell healthcheck (liveness → settings → admin) |
| `probes/gotrue-synthetic-auth.sh`                            | End-to-end synthetic signup + token round-trip       |
| `probes/deep-probe/main.go`                                  | Production-grade Go deep probe (with metrics + watchdog) |
| `probes/deep-probe/Dockerfile`                               | Image for the deep probe sidecar                     |
| `probes/deep-probe/go.mod`                                   | Go module                                            |
| `compose/docker-compose.deep-health.yml`                     | Opt-in override: deep-probe sidecar + readiness wiring |
| `compose/docker-compose.observability.yml`                   | Opt-in override: Prometheus + Grafana                |
| `observability/prometheus.yml`                               | Prometheus scrape config                             |
| `observability/alerts/auth.rules.yml`                        | Alert rules listed above                             |
| `observability/grafana/datasources/datasources.yml`          | Grafana provisioning                                 |
| `observability/grafana/dashboards/dashboards.yml`            | Dashboard provider config                            |
| `observability/grafana/dashboards/auth.json`                 | Minimal Auth dashboard (Pool, Latency, Inflight)     |
| `k8s/auth-deployment.yaml`                                   | Production K8s deployment with three-tier probes     |
| `chaos/docker-compose.chaos.yml`                             | Wire k6 + pg-block into the compose stack            |
| `chaos/k6-token-flood.js`                                    | k6 load test reproducing the freeze                  |
| `chaos/pg-block.sh`                                          | pg_advisory_lock / `BEGIN`-and-hold blocker          |
| `chaos/curl-loop.sh`                                         | Bash-only reproducer for quick laptop runs           |
| `gotrue-patches/01-request-deadline-middleware.md`           | Upstream Go patch                                    |
| `gotrue-patches/02-deep-healthz-handler.md`                  | Upstream Go patch                                    |
| `gotrue-patches/03-watchdog-and-metrics.md`                  | Upstream Go patch                                    |
| `gotrue-patches/04-pgx-pool-tuning.md`                       | Upstream Go patch                                    |
| `PR_PLAN.md`                                                 | Rollout-detail spreadsheet                           |

---

## Appendix B — GitHub Issue Response Template

> Hey — thanks for the detailed report, this is one of the more
> insidious failure modes we've seen in GoTrue and it fits a pattern
> we've been tracking. The short version: `/health` is a process-only
> probe and a saturated DB pool keeps it green while every
> DB-touching path hangs, so neither Docker's nor Kubernetes' default
> liveness probe ever restarts the pod. Manual restart is the only
> way out today. We're rolling out fixes in four parts —
>
> 1. A new `/healthz/deep` endpoint that actually exercises the auth
>    pipeline (PR #X, no behavior change for `/health`).
> 2. Per-route request deadlines so handlers can't wait forever (PR
>    #Y, gated behind `GOTRUE_REQUEST_DEADLINE_ENABLED`).
> 3. A watchdog + Prometheus metrics so we can see this happening
>    instead of you having to tell us (PR #Z).
> 4. Postgres-side safety nets (statement_timeout etc.) so a single
>    slow query can't take down the whole pool (PR #W).
>
> In the meantime two operator workarounds will give you instant
> relief — both documented at
> https://github.com/supabase/supabase/blob/master/docker/reliability/auth-freeze/README.md#53-recovery-strategy-no-code-ops-only-mitigations
> — running the `ALTER ROLE` snippet on your auth DB role is the
> highest-leverage one and we strongly recommend doing it today.

---

## Appendix C — Public Postmortem Template

See [`POSTMORTEM.md`](./POSTMORTEM.md) for a redactable, customer-facing
postmortem you can publish on the status page when this class of
incident recurs.

