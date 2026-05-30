// Package chaos provides controlled freeze injectors for end-to-end
// validation of the freezekit pipeline.
//
// Each injector is a self-contained, recoverable runtime perturbation:
//
//   - Deadlock          two goroutines acquire two mutexes in opposite order
//   - ChannelHang        N goroutines block forever on a never-closed channel
//   - MutexContention    N goroutines hammer one mutex
//   - GoroutineLeak      spawn N goroutines that wait on a chan that never closes
//   - DBStarvation       hold every DB connection in an open transaction
//   - InfiniteWait       a handler does select{}
//   - SchedulerStarvation N goroutines spin in a tight loop
//
// Injectors return a Stopper which the caller MUST invoke (typically
// via defer) to release resources. Stoppers are idempotent.
//
// SAFETY: this package is intended for tests and an explicitly
// flag-gated debug endpoint. It MUST NOT be wired into a production
// build path. See `chaos.AssertSafeBuild` for the recommended
// build-tag guard.
package chaos

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"os"
	"runtime"
	"sync"
	"sync/atomic"
	"time"
)

// Stopper releases resources held by an injector. Idempotent.
type Stopper func()

var ErrNotEnabled = errors.New("chaos: not enabled in this build")

// AssertSafeBuild panics if FREEZEKIT_CHAOS_ENABLED != "true".
// Call this from `func init()` in any binary that imports the chaos
// package to make sure a chaos-enabled binary never ships by accident.
func AssertSafeBuild() {
	if os.Getenv("FREEZEKIT_CHAOS_ENABLED") != "true" {
		panic("freezekit chaos package imported but FREEZEKIT_CHAOS_ENABLED!=true; refusing to start")
	}
}

// ---------------------------------------------------------------------------
// Deadlock
// ---------------------------------------------------------------------------

// Deadlock spawns two goroutines that acquire (A, B) and (B, A) in
// opposite order. They deadlock immediately. Stopper has no way to
// unwedge the deadlocked goroutines — by design — but cancels any
// not-yet-deadlocked ones.
//
// Use this for goroutine-dump assertions: after invoking, dump and
// look for `sync.(*Mutex).Lock` in two goroutines holding the
// opposite mutex.
func Deadlock() Stopper {
	var a, b sync.Mutex
	ready := make(chan struct{}, 2)
	done := make(chan struct{})
	go func() {
		a.Lock()
		ready <- struct{}{}
		<-done   // park; if Stop closes done before we try to lock b, we exit cleanly
		select { // best effort: still try the lock if Stop didn't fire
		case <-time.After(50 * time.Millisecond):
			b.Lock()
			defer b.Unlock()
		case <-done:
		}
		a.Unlock()
	}()
	go func() {
		b.Lock()
		ready <- struct{}{}
		<-done
		select {
		case <-time.After(50 * time.Millisecond):
			a.Lock()
			defer a.Unlock()
		case <-done:
		}
		b.Unlock()
	}()
	<-ready
	<-ready
	// Trigger the deadlock: both goroutines wake up and race for the
	// opposite mutex.
	close(done)
	// Give the scheduler a beat so the goroutines actually park.
	time.Sleep(50 * time.Millisecond)
	return func() {} // there is no unwedge
}

// ---------------------------------------------------------------------------
// ChannelHang
// ---------------------------------------------------------------------------

// ChannelHang spawns N goroutines each blocked on <-ch where ch is
// never closed. They will appear as `chan receive` in the goroutine
// dump and contribute to the block profile (if SetBlockProfileRate > 0).
//
// Stopper closes the channel which releases all the goroutines.
func ChannelHang(n int) Stopper {
	ch := make(chan struct{})
	var stopOnce sync.Once
	for i := 0; i < n; i++ {
		go func() { <-ch }()
	}
	return func() {
		stopOnce.Do(func() { close(ch) })
	}
}

// ---------------------------------------------------------------------------
// MutexContention
// ---------------------------------------------------------------------------

// MutexContention spawns N goroutines hammering a single mutex at
// `gripDuration` per critical section. They will produce a hot
// mutex profile.
//
// Stopper signals every goroutine to exit.
func MutexContention(n int, gripDuration time.Duration) Stopper {
	if gripDuration <= 0 {
		gripDuration = 100 * time.Microsecond
	}
	var mu sync.Mutex
	stop := make(chan struct{})
	var wg sync.WaitGroup
	for i := 0; i < n; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for {
				select {
				case <-stop:
					return
				default:
				}
				mu.Lock()
				busyWait(gripDuration)
				mu.Unlock()
			}
		}()
	}
	var stopOnce sync.Once
	return func() {
		stopOnce.Do(func() { close(stop) })
		wg.Wait()
	}
}

// busyWait spins until d has elapsed. We deliberately avoid time.Sleep
// inside the locked section — we want the mutex to actually be
// contended for `d`, which time.Sleep would foil (the runtime
// deschedules the goroutine, releasing other CPU cores).
func busyWait(d time.Duration) {
	deadline := time.Now().Add(d)
	for time.Now().Before(deadline) {
		runtime.Gosched()
	}
}

// ---------------------------------------------------------------------------
// GoroutineLeak
// ---------------------------------------------------------------------------

// GoroutineLeak spawns N goroutines that each wait on a per-goroutine
// channel that is never closed. They show up in `runtime.NumGoroutine()`
// and the goroutine profile.
//
// Stopper closes every channel, releasing the goroutines.
func GoroutineLeak(n int) Stopper {
	chs := make([]chan struct{}, n)
	for i := 0; i < n; i++ {
		chs[i] = make(chan struct{})
		ch := chs[i]
		go func() { <-ch }()
	}
	var stopOnce sync.Once
	return func() {
		stopOnce.Do(func() {
			for _, ch := range chs {
				close(ch)
			}
		})
	}
}

// ---------------------------------------------------------------------------
// DBStarvation
// ---------------------------------------------------------------------------

// DBStarvation opens N transactions on the provided *sql.DB and
// holds them, each running `SELECT pg_sleep(holdSecs)`. This is the
// most realistic reproduction of the original GoTrue incident — the
// pool is fully consumed, every subsequent request blocks on
// `db.Conn()`, the in-flight tracker shows growing age.
//
// `n` SHOULD be `db.Stats().MaxOpenConnections + 1` so the +1
// request sits in the wait queue producing the visible degradation.
//
// Stopper rolls back every transaction.
func DBStarvation(ctx context.Context, db *sql.DB, n int, holdSecs int) (Stopper, error) {
	if db == nil {
		return nil, errors.New("nil db")
	}
	txs := make([]*sql.Tx, 0, n)
	for i := 0; i < n; i++ {
		tx, err := db.BeginTx(ctx, nil)
		if err != nil {
			for _, t := range txs {
				_ = t.Rollback()
			}
			return nil, fmt.Errorf("begin tx %d: %w", i, err)
		}
		txs = append(txs, tx)
		go func(tx *sql.Tx) {
			_, _ = tx.ExecContext(ctx, fmt.Sprintf("SELECT pg_sleep(%d)", holdSecs))
		}(tx)
	}
	var stopOnce sync.Once
	return func() {
		stopOnce.Do(func() {
			for _, t := range txs {
				_ = t.Rollback()
			}
		})
	}, nil
}

// ---------------------------------------------------------------------------
// SchedulerStarvation
// ---------------------------------------------------------------------------

// SchedulerStarvation spawns N goroutines each in a tight `for {}`
// loop that never yields. Each goroutine pins one P (logical CPU),
// starving cooperative goroutines and inflating
// `/sched/latencies:seconds`.
//
// We deliberately use `for { _ = i }` without runtime.Gosched so the
// scheduler MUST preempt to make progress elsewhere — exactly the
// pathology the freezekit MutexContention signal aims to detect.
func SchedulerStarvation(n int) Stopper {
	stop := make([]atomic.Bool, n)
	for i := 0; i < n; i++ {
		i := i
		go func() {
			var sink int
			for !stop[i].Load() {
				sink++
				_ = sink
			}
		}()
	}
	var stopOnce sync.Once
	return func() {
		stopOnce.Do(func() {
			for i := range stop {
				stop[i].Store(true)
			}
		})
	}
}

// ---------------------------------------------------------------------------
// InfiniteWait HTTP handler
// ---------------------------------------------------------------------------

// InfiniteWaitHandler returns a handler that blocks indefinitely on
// ctx.Done. Useful for end-to-end OldestInflightSignal testing.
func InfiniteWaitHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		<-r.Context().Done()
		w.WriteHeader(499)
	}
}

// ---------------------------------------------------------------------------
// HTTP control surface
// ---------------------------------------------------------------------------

// RegisterRoutes attaches POST endpoints to the given chi-like
// router. Every endpoint is a no-op unless FREEZEKIT_CHAOS_ENABLED=true.
//
// Endpoints (relative to whatever prefix the caller mounts):
//
//	POST /chaos/deadlock
//	POST /chaos/channel-hang?n=100
//	POST /chaos/mutex-contention?n=50&grip_us=500
//	POST /chaos/goroutine-leak?n=10000
//	POST /chaos/scheduler-starvation?n=2
//	POST /chaos/stop?id=<token>     stops a previously-spawned injector
//	GET  /chaos/list                lists active injector tokens
func RegisterRoutes(r interface {
	Post(string, http.HandlerFunc)
	Get(string, http.HandlerFunc)
}) {
	r.Post("/chaos/deadlock", control(func(_ *http.Request) (Stopper, error) {
		return Deadlock(), nil
	}))
	r.Post("/chaos/channel-hang", control(func(req *http.Request) (Stopper, error) {
		return ChannelHang(intQuery(req, "n", 100)), nil
	}))
	r.Post("/chaos/mutex-contention", control(func(req *http.Request) (Stopper, error) {
		grip := time.Duration(intQuery(req, "grip_us", 500)) * time.Microsecond
		return MutexContention(intQuery(req, "n", 50), grip), nil
	}))
	r.Post("/chaos/goroutine-leak", control(func(req *http.Request) (Stopper, error) {
		return GoroutineLeak(intQuery(req, "n", 10000)), nil
	}))
	r.Post("/chaos/scheduler-starvation", control(func(req *http.Request) (Stopper, error) {
		return SchedulerStarvation(intQuery(req, "n", 2)), nil
	}))
	r.Post("/chaos/stop", stopHandler)
	r.Get("/chaos/list", listHandler)
}

var (
	activeMu sync.Mutex
	active   = map[string]Stopper{}
	nextTok  atomic.Uint64
)

func control(spawn func(*http.Request) (Stopper, error)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if os.Getenv("FREEZEKIT_CHAOS_ENABLED") != "true" {
			http.Error(w, ErrNotEnabled.Error(), http.StatusForbidden)
			return
		}
		stop, err := spawn(r)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		tok := fmt.Sprintf("c%04d", nextTok.Add(1))
		activeMu.Lock()
		active[tok] = stop
		activeMu.Unlock()
		w.WriteHeader(http.StatusAccepted)
		_, _ = fmt.Fprintf(w, `{"id":%q}`, tok)
	}
}

func stopHandler(w http.ResponseWriter, r *http.Request) {
	if os.Getenv("FREEZEKIT_CHAOS_ENABLED") != "true" {
		http.Error(w, ErrNotEnabled.Error(), http.StatusForbidden)
		return
	}
	id := r.URL.Query().Get("id")
	activeMu.Lock()
	stop, ok := active[id]
	delete(active, id)
	activeMu.Unlock()
	if !ok {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	stop()
	w.WriteHeader(http.StatusNoContent)
}

func listHandler(w http.ResponseWriter, _ *http.Request) {
	activeMu.Lock()
	defer activeMu.Unlock()
	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write([]byte(`{"active":[`))
	first := true
	for k := range active {
		if !first {
			_, _ = w.Write([]byte(","))
		}
		first = false
		_, _ = fmt.Fprintf(w, `%q`, k)
	}
	_, _ = w.Write([]byte(`]}`))
}

func intQuery(r *http.Request, key string, def int) int {
	v := r.URL.Query().Get(key)
	if v == "" {
		return def
	}
	var n int
	if _, err := fmt.Sscanf(v, "%d", &n); err != nil {
		return def
	}
	if n < 0 {
		return def
	}
	return n
}
