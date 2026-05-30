// Package freezekit captures runtime forensic state when the host
// process exhibits symptoms of a freeze.
//
// # Overview
//
// freezekit is intended to be embedded inside a long-running Go HTTP
// service (the original target is supabase/auth, a.k.a. GoTrue) where
// occasional pathological hangs leave the process superficially
// healthy (the liveness endpoint returns 200) while the real request
// pipeline is wedged. By the time an operator can ssh in and run
// `go tool pprof`, the process has been restarted and all evidence
// is gone.
//
// freezekit:
//
//  1. Continuously samples a configurable set of in-process signals
//     (oldest in-flight request, goroutine count, DB-pool wait,
//     scheduler latency, mutex contention, …) and combines them
//     into a severity score.
//  2. Runs a four-state machine (NORMAL → WARNING → DEGRADED →
//     FREEZE_DETECTED → CAPTURE_COMPLETE) with debounce and
//     cooldown to eliminate flap.
//  3. On FREEZE_DETECTED, atomically transitions the worker into
//     a capture cycle that writes goroutine, block, mutex,
//     threadcreate, and (optionally) heap profiles, plus a JSON
//     manifest carrying correlation metadata (pod, node, region,
//     uptime, git-sha, inflight request IDs).
//  4. Hands the bundle to a pluggable [Sink] for asynchronous,
//     bounded upload.
//
// # Hot-path cost
//
// The only work freezekit does on the request goroutine is in its
// HTTP middleware:
//
//   - one map insert (in-flight tracker, ~20 ns)
//   - one map delete (deferred, ~20 ns)
//
// The detector, capture, and upload all live on dedicated worker
// goroutines. The hot path is never blocked by upload backpressure
// or by storage backend outages.
//
// # Embedding example
//
//	fk, err := freezekit.New(freezekit.LoadConfigFromEnv())
//	if err != nil {
//	    log.Fatalf("freezekit: %v", err)
//	}
//	defer fk.Shutdown(context.Background())
//
//	go fk.Run(ctx)
//
//	r := chi.NewMux()
//	r.Use(fk.HTTPMiddleware())
//	// … your routes …
//
// To make the DBPoolWait signal meaningful, hand freezekit a callback
// that returns current pool stats:
//
//	fk.SetDBPoolStatsFunc(func() freezekit.DBPoolStats {
//	    s := db.Stats()
//	    return freezekit.DBPoolStats{
//	        InUse:          s.InUse,
//	        Idle:           s.Idle,
//	        Max:            s.MaxOpenConnections,
//	        WaitCount:      s.WaitCount,
//	        WaitDurationMS: s.WaitDuration.Milliseconds(),
//	    }
//	})
//
// # Safety
//
// freezekit is built around a set of non-negotiable safety
// guarantees, enumerated in README.md § "Critical safety constraints".
// The most important are:
//
//   - The capture worker never blocks on an upload. The artifact
//     channel has a finite capacity; on overflow, artifacts are
//     dropped (counted, logged) rather than queued.
//   - Heap capture is gated on resident-set-size. If the process is
//     already memory-constrained, heap capture is skipped to avoid
//     the GC + allocation burst pushing the process into OOM.
//   - Every worker goroutine has a deferred panic recovery that
//     logs, increments a metric, and restarts the worker. A panic
//     in freezekit cannot crash the host process.
//   - freezekit has its own watchdog that disables freezekit if its
//     internal heartbeat stops ticking. freezekit can degrade
//     gracefully but cannot wedge.
//
// # Stability
//
// The exported API surface is small and intended to be stable for
// at least one minor-version cycle. Internal implementation details
// (file names, signal scoring formulas, sink internals) may evolve.
package freezekit
