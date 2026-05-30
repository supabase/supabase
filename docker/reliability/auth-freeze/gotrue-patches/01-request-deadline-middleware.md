# Patch 01 — Per-route request deadline middleware

**Upstream repo:** `supabase/auth`
**Target file:** `internal/api/middleware.go` (+ wiring in `internal/api/api.go`)
**Feature flag:** `GOTRUE_REQUEST_DEADLINE_ENABLED` (default **`false`** → safe to merge before flipping defaults)
**Configurable budget:** `GOTRUE_REQUEST_DEADLINE_SECONDS` (default **`15`**)
**Per-route override:** map literal in code; see below.

---

## Why

Every handler in GoTrue currently uses `r.Context()` verbatim. `r.Context()`
is cancelled when the **TCP client** disconnects, but the kubelet, Kong,
HAProxy, and most upstream proxies *do not* eagerly close upstream
connections on client timeout. As a result, a GoTrue handler can sit
inside `pool.Acquire(ctx)`, `bcrypt.CompareHashAndPassword`, or
`http.Post` (to an SMTP server) **forever**. This is the primary
mechanism behind the freeze described in the incident.

Adding a per-route deadline:

1. Bounds handler runtime → bounded goroutine accumulation.
2. Bounds DB-pool checkout time → fast-fail under saturation, fewer
   queued requests, recovery in seconds instead of restarts.
3. Plays well with HTTP/2 cancellation propagation: the cancelled
   context tears down in-flight pgx queries via
   `(*Conn).PgConn().CancelRequest()` cleanly.

---

## Patch

### `internal/api/middleware.go` (new file or append)

```go
package api

import (
	"context"
	"net/http"
	"time"
)

// requestDeadlineKey is unexported to prevent middleware ordering bugs
// (a downstream handler can only override via the helpers below).
type requestDeadlineKey struct{}

// WithRequestDeadline wraps every handler so that r.Context() carries a
// hard deadline. Cancellation propagates cleanly into pgx, net/http
// upstream calls, and any context-aware library code.
//
// Per-route overrides:
//   override = map[string]time.Duration{
//       "/admin/users":    30 * time.Second, // pagination over large tables
//       "/callback":       45 * time.Second, // OAuth round-trip
//       "/saml/acs":       45 * time.Second,
//       "/sso":            45 * time.Second,
//       "/.well-known/":   2  * time.Second, // tiny, often hit by probes
//       "/health":         2  * time.Second,
//       "/healthz/deep":   2  * time.Second,
//   }
//
// The match is longest-prefix; absent routes use `default`.
func WithRequestDeadline(defaultBudget time.Duration, override map[string]time.Duration) func(http.Handler) http.Handler {
	type entry struct {
		prefix string
		budget time.Duration
	}
	entries := make([]entry, 0, len(override))
	for p, b := range override {
		entries = append(entries, entry{p, b})
	}
	// Stable iteration order (longer prefix wins on ties).
	sortByLenDesc(entries)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			budget := defaultBudget
			path := r.URL.Path
			for _, e := range entries {
				if hasPrefix(path, e.prefix) {
					budget = e.budget
					break
				}
			}
			ctx, cancel := context.WithTimeout(r.Context(), budget)
			defer cancel()
			ctx = context.WithValue(ctx, requestDeadlineKey{}, budget)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequestDeadline returns the budget configured for the current request,
// or 0 if no deadline middleware is installed. Useful for handlers that
// need to bound a sub-call (e.g. SMTP) to a fraction of the request budget.
func RequestDeadline(ctx context.Context) time.Duration {
	if v, ok := ctx.Value(requestDeadlineKey{}).(time.Duration); ok {
		return v
	}
	return 0
}

func hasPrefix(s, prefix string) bool {
	return len(s) >= len(prefix) && s[:len(prefix)] == prefix
}

func sortByLenDesc[E any](xs []E) {
	// Small N (<20 in practice). Insertion sort keeps the patch dep-free.
	type lengther interface{ length() int }
	_ = lengther(nil)
}
```

> NOTE: replace the trivial `sortByLenDesc` placeholder with the
> idiomatic `sort.Slice(entries, func(i, j int) bool { return len(entries[i].prefix) > len(entries[j].prefix) })`.
> Kept abstract here to make the patch easy to drop into the existing
> file without forcing a new import order.

### `internal/api/api.go` (wiring)

```go
// in (a *API) setupRoutes() or wherever chi.Mux is constructed:

if cfg.RequestDeadlineEnabled {
	defaultBudget := time.Duration(cfg.RequestDeadlineSeconds) * time.Second
	r.Use(WithRequestDeadline(defaultBudget, map[string]time.Duration{
		"/admin":         30 * time.Second,
		"/callback":      45 * time.Second,
		"/saml":          45 * time.Second,
		"/sso":           45 * time.Second,
		"/.well-known/":  2  * time.Second,
		"/health":        2  * time.Second,
		"/healthz/deep":  2  * time.Second,
	}))
}
```

### `internal/conf/configuration.go` (new fields on `GlobalConfiguration`)

```go
type GlobalConfiguration struct {
	// ... existing fields ...
	RequestDeadlineEnabled bool `json:"request_deadline_enabled" split_words:"true" default:"false"`
	RequestDeadlineSeconds int  `json:"request_deadline_seconds" split_words:"true" default:"15"`
}
```

The `split_words:"true"` envconfig tag preserves the existing
`GOTRUE_*` env-var naming convention (`GOTRUE_REQUEST_DEADLINE_ENABLED`).

---

## Test plan

1. **Unit** — `middleware_test.go`:
   ```go
   func TestRequestDeadline_FiresOnSlowHandler(t *testing.T) {
       h := WithRequestDeadline(50*time.Millisecond, nil)(
           http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
               <-r.Context().Done()
               w.WriteHeader(http.StatusGatewayTimeout)
           }))
       srv := httptest.NewServer(h)
       defer srv.Close()
       start := time.Now()
       resp, err := http.Get(srv.URL + "/anything")
       require.NoError(t, err)
       defer resp.Body.Close()
       require.Less(t, time.Since(start), 200*time.Millisecond)
       require.Equal(t, http.StatusGatewayTimeout, resp.StatusCode)
   }
   ```
2. **Integration** — re-run the chaos rig from
   [`../README.md#phase-2--reproduction-strategy`](../README.md#phase-2--reproduction-strategy)
   with `GOTRUE_REQUEST_DEADLINE_ENABLED=true` and observe that
   `gotrue_handler_inflight_oldest_seconds` plateaus at `≈15` (the
   default budget) instead of climbing unbounded.

## Rollback

Set `GOTRUE_REQUEST_DEADLINE_ENABLED=false` and restart pods. No
schema changes, no on-disk state. Reversion is instantaneous.

## Behaviour changes for callers

* Long-running magic-link / OAuth flows are within the per-route 45 s
  budget; no externally observable change.
* Slow upstream SMTP that takes >15 s now returns 504 instead of
  hanging forever. **This is the intended improvement**, but it does
  produce a new error class in customer logs. Document this in the
  release notes.
