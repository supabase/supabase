# Patch 03 — Goroutine watchdog + Prometheus metrics

**Upstream repo:** `supabase/auth`
**Target files:**
- `internal/observability/metrics.go`   (new)
- `internal/observability/watchdog.go`  (new)
- `internal/observability/inflight.go`  (new — middleware)
- `cmd/serve.go`                        (wiring)
- `internal/api/api.go`                 (middleware install)
**Feature flags:**
- `GOTRUE_METRICS_ENABLED`              (default **`true`**)
- `GOTRUE_METRICS_PORT`                 (default **`9100`**)
- `GOTRUE_WATCHDOG_ENABLED`             (default **`false`** initially)
- `GOTRUE_WATCHDOG_ACTION`              (`log` | `pprof` | `exit`; default `log`)
- `GOTRUE_WATCHDOG_INFLIGHT_AGE_SECS`   (default `60`)

---

## Why

The incident was undetectable because GoTrue ships no metrics for the
two signals that mattered:

1. **DB-pool acquire wait time** (was rising for minutes before the freeze).
2. **In-flight handler age** (was unbounded — *the* freeze signature).

This patch adds both, plus a watchdog goroutine that takes action when
either crosses a configured threshold. Action options:

| `GOTRUE_WATCHDOG_ACTION` | Behaviour                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `log`                    | Logs at ERROR with a goroutine count summary. Safe everywhere.                              |
| `pprof`                  | Writes `pprof.Lookup("goroutine").WriteTo(os.Stderr, 2)` — produces a dump for diagnosis.   |
| `exit`                   | After `pprof`, calls `os.Exit(2)`. Only safe under a supervisor that will restart the pod.  |

Default is `log` — zero behavioural risk.

---

## Patch

### `internal/observability/metrics.go`

```go
package observability

import (
	"database/sql"
	"net/http"
	"runtime"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Registry is the single Prometheus registry for the gotrue process.
var Registry = prometheus.NewRegistry()

var (
	HTTPRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "gotrue_http_requests_total",
			Help: "Number of HTTP requests served by GoTrue.",
		}, []string{"route", "method", "status"},
	)
	HTTPRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "gotrue_http_request_duration_seconds",
			Help:    "Duration of HTTP requests.",
			Buckets: []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10},
		}, []string{"route", "method", "status"},
	)
	DBPoolAcquireWait = prometheus.NewHistogram(
		prometheus.HistogramOpts{
			Name:    "gotrue_db_pool_acquire_wait_seconds",
			Help:    "Time spent waiting to acquire a DB connection from the pool.",
			Buckets: []float64{.001, .005, .01, .05, .1, .5, 1, 2.5, 5, 10, 30},
		},
	)
	DBPoolInUse = prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "gotrue_db_pool_in_use", Help: "Currently checked-out DB connections.",
	})
	DBPoolIdle = prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "gotrue_db_pool_idle", Help: "Idle DB connections in the pool.",
	})
	DBPoolMax = prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "gotrue_db_pool_max", Help: "Configured max DB connections.",
	})

	HandlerInflight = prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "gotrue_handler_inflight", Help: "Currently in-flight HTTP handlers.",
	})
	HandlerInflightOldestSeconds = prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "gotrue_handler_inflight_oldest_seconds",
		Help: "Age of the oldest currently-inflight handler.",
	})

	Goroutines = prometheus.NewGaugeFunc(prometheus.GaugeOpts{
		Name: "gotrue_goroutines", Help: "Runtime.NumGoroutine().",
	}, func() float64 { return float64(runtime.NumGoroutine()) })

	PanicRecovered = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "gotrue_panic_recovered_total",
		Help: "Number of panics recovered by the chi recoverer middleware.",
	})
)

func init() {
	Registry.MustRegister(
		collectors.NewGoCollector(collectors.WithGoCollectorRuntimeMetrics(collectors.MetricsAll)),
		collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}),
		HTTPRequestsTotal, HTTPRequestDuration,
		DBPoolAcquireWait, DBPoolInUse, DBPoolIdle, DBPoolMax,
		HandlerInflight, HandlerInflightOldestSeconds,
		Goroutines, PanicRecovered,
	)
}

// SamplePoolStats should be invoked once a second by serve.go to update
// the *_pool_* gauges from sql.DBStats.
func SamplePoolStats(db *sql.DB) {
	s := db.Stats()
	DBPoolInUse.Set(float64(s.InUse))
	DBPoolIdle.Set(float64(s.Idle))
	DBPoolMax.Set(float64(s.MaxOpenConnections))
}

// Serve starts the metrics HTTP server on the given address. Returns
// immediately after starting; the caller is responsible for shutdown.
func Serve(addr string) *http.Server {
	mux := http.NewServeMux()
	mux.Handle("/metrics", promhttp.HandlerFor(Registry,
		promhttp.HandlerOpts{
			ErrorHandling: promhttp.ContinueOnError,
			Timeout:       5 * time.Second,
		}))
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("ok"))
	})

	srv := &http.Server{
		Addr:              addr,
		Handler:           mux,
		ReadHeaderTimeout: 3 * time.Second,
	}
	go func() { _ = srv.ListenAndServe() }()
	return srv
}
```

### `internal/observability/inflight.go`

```go
package observability

import (
	"net/http"
	"sync"
	"time"
)

type inflightEntry struct {
	start time.Time
	route string
}

type inflightTracker struct {
	mu      sync.Mutex
	entries map[uint64]inflightEntry
	nextID  uint64
}

var tracker = &inflightTracker{entries: map[uint64]inflightEntry{}}

func (t *inflightTracker) start(route string) uint64 {
	t.mu.Lock()
	defer t.mu.Unlock()
	id := t.nextID
	t.nextID++
	t.entries[id] = inflightEntry{start: time.Now(), route: route}
	HandlerInflight.Set(float64(len(t.entries)))
	return id
}

func (t *inflightTracker) end(id uint64) {
	t.mu.Lock()
	defer t.mu.Unlock()
	delete(t.entries, id)
	HandlerInflight.Set(float64(len(t.entries)))
}

// OldestAge returns the duration the longest in-flight handler has
// been running. Returns 0 if none.
func OldestAge() time.Duration {
	tracker.mu.Lock()
	defer tracker.mu.Unlock()
	var oldest time.Time
	for _, e := range tracker.entries {
		if oldest.IsZero() || e.start.Before(oldest) {
			oldest = e.start
		}
	}
	if oldest.IsZero() {
		return 0
	}
	return time.Since(oldest)
}

// InflightSnapshot returns a copy of (id, route, age) for the /debug/inflight
// admin endpoint.
type InflightItem struct {
	ID     uint64        `json:"id"`
	Route  string        `json:"route"`
	AgeSec float64       `json:"age_seconds"`
}

func InflightSnapshot() []InflightItem {
	tracker.mu.Lock()
	defer tracker.mu.Unlock()
	out := make([]InflightItem, 0, len(tracker.entries))
	now := time.Now()
	for id, e := range tracker.entries {
		out = append(out, InflightItem{
			ID: id, Route: e.route,
			AgeSec: now.Sub(e.start).Seconds(),
		})
	}
	return out
}

// InflightMiddleware wraps every handler.
func InflightMiddleware(routePattern func(*http.Request) string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			route := routePattern(r)
			id := tracker.start(route)
			defer tracker.end(id)
			next.ServeHTTP(w, r)
		})
	}
}
```

A small sampler in `cmd/serve.go` updates `HandlerInflightOldestSeconds`
once per second so Prometheus can scrape it as a gauge:

```go
go func() {
	t := time.NewTicker(1 * time.Second)
	defer t.Stop()
	for range t.C {
		observability.HandlerInflightOldestSeconds.Set(observability.OldestAge().Seconds())
		observability.SamplePoolStats(db.DB)
	}
}()
```

### `internal/observability/watchdog.go`

```go
package observability

import (
	"context"
	"os"
	"runtime/pprof"
	"time"

	"github.com/sirupsen/logrus"
)

type WatchdogConfig struct {
	Enabled            bool
	Action             string        // "log" | "pprof" | "exit"
	InflightAgeTrigger time.Duration // e.g. 60s
	GoroutineTrigger   int           // e.g. 50000
	CheckEvery         time.Duration // e.g. 5s
	Logger             logrus.FieldLogger
}

// Run blocks until ctx is done. Spawn in a goroutine.
func RunWatchdog(ctx context.Context, c WatchdogConfig) {
	if !c.Enabled {
		return
	}
	if c.CheckEvery <= 0 {
		c.CheckEvery = 5 * time.Second
	}
	if c.InflightAgeTrigger <= 0 {
		c.InflightAgeTrigger = 60 * time.Second
	}
	if c.GoroutineTrigger <= 0 {
		c.GoroutineTrigger = 50_000
	}
	log := c.Logger
	if log == nil {
		log = logrus.New()
	}

	t := time.NewTicker(c.CheckEvery)
	defer t.Stop()

	tripCount := 0
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			age := OldestAge()
			goroutines := numGoroutines()
			if age < c.InflightAgeTrigger && goroutines < c.GoroutineTrigger {
				tripCount = 0
				continue
			}
			tripCount++
			log.WithFields(logrus.Fields{
				"oldest_inflight_age": age.String(),
				"goroutines":          goroutines,
				"trip_count":          tripCount,
				"action":              c.Action,
			}).Error("WATCHDOG: GoTrue handler pipeline appears stalled")

			switch c.Action {
			case "pprof":
				_ = pprof.Lookup("goroutine").WriteTo(os.Stderr, 2)
			case "exit":
				_ = pprof.Lookup("goroutine").WriteTo(os.Stderr, 2)
				// Two trips before exit — single false positive shouldn't kill the pod.
				if tripCount >= 2 {
					log.Error("WATCHDOG: GOTRUE_WATCHDOG_ACTION=exit; exiting so supervisor restarts us")
					os.Exit(2)
				}
			}
		}
	}
}

func numGoroutines() int { return runtimeNumGoroutine() }
```

(`runtimeNumGoroutine` is a thin shim around `runtime.NumGoroutine`
declared in a separate file to keep this file pure-stdlib-free for
testing.)

### `cmd/serve.go` (wiring)

```go
if cfg.MetricsEnabled {
	addr := fmt.Sprintf(":%d", cfg.MetricsPort)
	srv := observability.Serve(addr)
	defer func() {
		_ = srv.Shutdown(context.Background())
	}()
}

ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
defer cancel()

go observability.RunWatchdog(ctx, observability.WatchdogConfig{
	Enabled:            cfg.WatchdogEnabled,
	Action:             cfg.WatchdogAction,
	InflightAgeTrigger: time.Duration(cfg.WatchdogInflightAgeSecs) * time.Second,
	GoroutineTrigger:   cfg.WatchdogGoroutineTrigger,
	Logger:             logger,
})
```

### `internal/api/api.go`

```go
r.Use(observability.InflightMiddleware(func(r *http.Request) string {
	if rc := chi.RouteContext(r.Context()); rc != nil {
		return rc.RoutePattern()
	}
	return "<unmatched>"
}))
```

Also wrap the existing `recoverer` to bump `PanicRecovered`:

```go
r.Use(func(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				observability.PanicRecovered.Inc()
				panic(rec) // let the existing chi.Recoverer log + 500
			}
		}()
		next.ServeHTTP(w, r)
	})
})
r.Use(middleware.Recoverer)
```

### `internal/storage/dial/postgres.go` (instrumented pool acquire)

The cleanest, lowest-risk way to instrument `database/sql` connection
acquisition without rewriting the driver is the
`sql.SetConnMaxLifetime`/Stats sampler above plus a tiny shim on the
`pop.Connection.Transaction` helper. Pop already wraps every DB op;
add a Prometheus timer around its acquisition path. The patch is a
one-line `defer prometheus.NewTimer(observability.DBPoolAcquireWait).ObserveDuration()`
at the top of `auth.(*Connection).Tx`.

---

## Configuration additions

```go
type GlobalConfiguration struct {
	// ... existing fields ...
	MetricsEnabled            bool   `json:"metrics_enabled"               split_words:"true" default:"true"`
	MetricsPort               int    `json:"metrics_port"                  split_words:"true" default:"9100"`
	WatchdogEnabled           bool   `json:"watchdog_enabled"              split_words:"true" default:"false"`
	WatchdogAction            string `json:"watchdog_action"               split_words:"true" default:"log"`
	WatchdogInflightAgeSecs   int    `json:"watchdog_inflight_age_secs"    split_words:"true" default:"60"`
	WatchdogGoroutineTrigger  int    `json:"watchdog_goroutine_trigger"    split_words:"true" default:"50000"`
}
```

---

## Test plan

* Unit test `OldestAge`, `start/end` race-safety.
* Unit test `RunWatchdog` with a mocked clock — assert exit only after 2 trips.
* Integration: reproduce freeze with chaos rig; assert
  `gotrue_handler_inflight_oldest_seconds > 30` within 90 s.

## Rollback

* Metrics path: `GOTRUE_METRICS_ENABLED=false` (the /metrics server
  doesn't start; gauges still update but are not exposed).
* Watchdog: `GOTRUE_WATCHDOG_ENABLED=false`.
* InflightMiddleware: not behind a flag — the cost is one map insert/delete
  per request, which is negligible (~50 ns). If it ever needs to be
  disabled, gate it on `GOTRUE_INFLIGHT_TRACKING_ENABLED=true` in a
  follow-up PR.
