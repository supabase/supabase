# Patch 02 — `/healthz/deep` deep healthcheck handler

**Upstream repo:** `supabase/auth`
**Target files:**
- `internal/api/healthcheck.go` (new handler, sibling to existing `Health`)
- `internal/api/api.go`         (route registration)
**Feature flag:** `GOTRUE_DEEP_HEALTH_ENABLED` (default **`true`**, pure addition)
**Configurable budget:** `GOTRUE_DEEP_HEALTH_TIMEOUT_MS` (default **`800`**)

---

## Why

`/health` is process-only. It returned 200 in 75 ms while the entire
DB-backed pipeline was wedged (see [`../README.md#12-why-health-stayed-green`](../README.md#12-why-health-stayed-green)).

`/healthz/deep` exercises:

1. The router (chi mux)
2. All registered middleware (including the new deadline middleware)
3. The DB pool (`db.PingContext` + a one-row `SELECT 1` via `sqlx`)
4. Optionally, the storage of the audit-log table (read-only stat) —
   gated on `GOTRUE_DEEP_HEALTH_INCLUDE_AUDIT`

It is **idempotent**, **read-only**, **bounded**, and produces a
**structured JSON response** for human ops.

---

## Patch

### `internal/api/healthcheck.go`

```go
package api

import (
	"context"
	"net/http"
	"sync"
	"time"
)

// DeepHealthReport is the JSON body of /healthz/deep. Fields are
// stable; consumers may add new ones but must not remove.
type DeepHealthReport struct {
	OK         bool                    `json:"ok"`
	Version    string                  `json:"version"`
	CheckedAt  time.Time               `json:"checked_at"`
	DurationMS int64                   `json:"duration_ms"`
	Checks     map[string]CheckResult  `json:"checks"`
}

type CheckResult struct {
	OK         bool   `json:"ok"`
	LatencyMS  int64  `json:"latency_ms"`
	Err        string `json:"err,omitempty"`
}

func (a *API) DeepHealth(w http.ResponseWriter, r *http.Request) {
	budget := time.Duration(a.config.DeepHealthTimeoutMS) * time.Millisecond
	if budget <= 0 {
		budget = 800 * time.Millisecond
	}
	ctx, cancel := context.WithTimeout(r.Context(), budget)
	defer cancel()

	start := time.Now()
	report := DeepHealthReport{
		Version:   a.version,
		CheckedAt: start,
		Checks:    map[string]CheckResult{},
	}

	// Run independent checks in parallel; each gets the full budget but
	// the overall context is shared so a slow check doesn't extend the
	// total beyond `budget`.
	var (
		mu sync.Mutex
		wg sync.WaitGroup
	)
	record := func(name string, res CheckResult) {
		mu.Lock()
		report.Checks[name] = res
		mu.Unlock()
	}
	run := func(name string, fn func(context.Context) error) {
		wg.Add(1)
		go func() {
			defer wg.Done()
			t0 := time.Now()
			err := fn(ctx)
			res := CheckResult{LatencyMS: time.Since(t0).Milliseconds()}
			if err != nil {
				res.Err = err.Error()
			} else {
				res.OK = true
			}
			record(name, res)
		}()
	}

	run("db_ping", func(ctx context.Context) error {
		return a.db.PingContext(ctx)
	})
	run("db_select_one", func(ctx context.Context) error {
		var one int
		// Cheap, guaranteed not to touch auth tables. Uses the same
		// connection-acquisition path that real requests use.
		return a.db.QueryRowContext(ctx, `SELECT 1`).Scan(&one)
	})
	if a.config.DeepHealthIncludeAudit {
		run("audit_select", func(ctx context.Context) error {
			var n int
			return a.db.QueryRowContext(ctx,
				`SELECT 1 FROM auth.audit_log_entries LIMIT 1`).Scan(&n)
		})
	}

	wg.Wait()

	report.OK = true
	for _, c := range report.Checks {
		if !c.OK {
			report.OK = false
			break
		}
	}
	report.DurationMS = time.Since(start).Milliseconds()

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	if !report.OK {
		w.WriteHeader(http.StatusServiceUnavailable)
	}
	_ = sendJSONRaw(w, report)
}
```

`sendJSONRaw` is the existing helper used by `Health`; reuse it.

### `internal/api/api.go` (registration — beside the existing /health route)

```go
if cfg.DeepHealthEnabled {
	r.Get("/healthz/deep", api.DeepHealth)
}
```

### `internal/conf/configuration.go`

```go
DeepHealthEnabled      bool `json:"deep_health_enabled"        split_words:"true" default:"true"`
DeepHealthTimeoutMS    int  `json:"deep_health_timeout_ms"     split_words:"true" default:"800"`
DeepHealthIncludeAudit bool `json:"deep_health_include_audit"  split_words:"true" default:"false"`
```

---

## Why parallel rather than serial?

Serial would be `db_ping` → `db_select_one` (~25 ms total).
Parallel keeps the bound at `max(check_latency)` rather than `sum`.
Under the freeze, all checks block on `pool.Acquire` simultaneously and
the deadline trips at the same time. Either way the report is
generated within `budget`.

## Why not include `/admin/users`?

That route requires a service-role JWT. Embedding the JWT in the
binary or expecting it in env is an anti-pattern. The
**`auth-deep-probe` sidecar** (this repo, [`../probes/deep-probe/`](../probes/deep-probe/))
is the right place for JWT-bearing checks because it can be configured
per-environment with rotated secrets.

## Failure modes that this catches that `/health` does not

| Failure              | `/health`     | `/healthz/deep` |
| -------------------- | ------------- | --------------- |
| Pool exhausted       | 200           | 503 (db_ping timeout) |
| DB primary down      | 200           | 503             |
| Reader replica lag   | 200           | 200 (writes still work) |
| chi mux deadlocked   | (might block) | 503             |
| pg-function hook hung| 200           | 503             |
| Goroutine leak       | 200           | 200             |

The last row is **intentional**: leaks are not a synchronous fault.
They are caught by patch 03 (`gotrue_goroutines` gauge + watchdog).

## Test plan

1. Unit: stub `db` with a `PingContext` that sleeps; assert 503 + timing.
2. Integration: run the chaos rig with `--profile chaos run --rm pg-block sleep 60 10`;
   assert `curl :9999/healthz/deep` returns 503 within 1 s.

## Rollback

Set `GOTRUE_DEEP_HEALTH_ENABLED=false`. The route is no longer
registered. Liveness/readiness configurations binding to it must be
updated to `/health` first.
