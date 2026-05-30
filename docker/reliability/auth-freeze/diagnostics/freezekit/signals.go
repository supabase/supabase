package freezekit

import (
	"context"
	"runtime"
	"runtime/metrics"
	"sync"
	"sync/atomic"
	"time"
)

// Signal is a pluggable freeze-detection input. Each Signal returns
// a score in [0,1] where 0 = healthy and 1 = critical. Signals MUST
// be cheap to sample (a few microseconds at most) and MUST NOT block
// — Sample is called from the detector loop on a fixed cadence.
//
// Implementations are wrapped in safeSample which enforces a 1-second
// budget and recovers panics, so a buggy Signal cannot wedge the
// detector. But: returning quickly is still the contract.
type Signal interface {
	// Name is the short, snake_case identifier used in metrics
	// and manifests. Must be unique per Manager.
	Name() string

	// Weight is the relative importance of this signal in the
	// composite score. Higher is more important. Values typically
	// in [0.1, 1.0]. Must not change between calls.
	Weight() float64

	// Sample returns the current score. Implementations should
	// honour ctx for cancellation. Returning a value outside [0,1]
	// is allowed; the detector clamps.
	Sample(ctx context.Context) float64
}

// DefaultSignals returns the built-in production-default signal set:
//
//   - OldestInflight   (threshold 45s, weight 1.0)
//   - ZeroSuccessRate  (window 60s,   weight 0.9)
//   - GoroutineSpike   (max 50_000,   weight 0.6)
//   - DBPoolWait       (threshold 5s, weight 0.8)
//   - SchedulerLatency (threshold 100ms, weight 0.5)
//   - MutexContention  (threshold 1s/s,  weight 0.5)
//   - Heartbeat        (threshold 3× sample interval, weight 1.0)
//
// The Manager pointer is required for signals that read in-process
// state (inflight tracker, DB stats callback, heartbeat).
func DefaultSignals(m *Manager) []Signal {
	return []Signal{
		NewOldestInflightSignal(m, 45*time.Second, 1.0),
		NewZeroSuccessRateSignal(m, 60*time.Second, 0.9),
		NewGoroutineSpikeSignal(50_000, 0.6),
		NewDBPoolWaitSignal(m, 5*time.Second, 0.8),
		NewSchedulerLatencySignal(100*time.Millisecond, 0.5),
		NewMutexContentionSignal(1.0, 0.5),
		NewHeartbeatSignal(m, 3, 1.0),
	}
}

// ---------------------------------------------------------------------------
// OldestInflight
// ---------------------------------------------------------------------------

type oldestInflightSignal struct {
	m         *Manager
	threshold time.Duration
	weight    float64
}

// NewOldestInflightSignal scores how long the oldest in-flight request
// has been running, normalised against `threshold`.
//
//	score = clamp(age / threshold)
func NewOldestInflightSignal(m *Manager, threshold time.Duration, weight float64) Signal {
	return &oldestInflightSignal{m: m, threshold: threshold, weight: weight}
}

func (s *oldestInflightSignal) Name() string                     { return "oldest_inflight" }
func (s *oldestInflightSignal) Weight() float64                  { return s.weight }
func (s *oldestInflightSignal) Sample(_ context.Context) float64 {
	age := s.m.tracker.oldestAge()
	if age <= 0 {
		return 0
	}
	return float64(age) / float64(s.threshold)
}

// ---------------------------------------------------------------------------
// ZeroSuccessRate
// ---------------------------------------------------------------------------

type zeroSuccessRateSignal struct {
	m      *Manager
	window time.Duration
	weight float64
}

// NewZeroSuccessRateSignal scores 1.0 if, within `window`, there have
// been requests but zero 2xx responses. Returns 0 otherwise. The
// signal reads the inflight tracker's success/total counters.
func NewZeroSuccessRateSignal(m *Manager, window time.Duration, weight float64) Signal {
	return &zeroSuccessRateSignal{m: m, window: window, weight: weight}
}

func (s *zeroSuccessRateSignal) Name() string    { return "zero_success_rate" }
func (s *zeroSuccessRateSignal) Weight() float64 { return s.weight }
func (s *zeroSuccessRateSignal) Sample(_ context.Context) float64 {
	total, ok2xx := s.m.tracker.recentCounts(s.window)
	if total < 5 {
		// Too few requests in the window for a meaningful ratio.
		return 0
	}
	if ok2xx == 0 {
		return 1
	}
	// Smooth signal: 1 - (ok2xx / total). At 50% success → 0.5.
	return 1.0 - float64(ok2xx)/float64(total)
}

// ---------------------------------------------------------------------------
// GoroutineSpike
// ---------------------------------------------------------------------------

type goroutineSpikeSignal struct {
	maxN   int
	weight float64

	// adaptiveBaseline is a slow-moving average of recent goroutine
	// counts. We compute "above baseline" rather than "absolute" so
	// a service that legitimately runs 30k goroutines doesn't fire
	// at the static 50k threshold for normal operation. Initialised
	// lazily on the first Sample.
	mu       sync.Mutex
	baseline float64
}

// NewGoroutineSpikeSignal scores how far the current goroutine count
// is above an adaptive baseline, capped at `maxN`. The baseline is
// an exponential moving average with α=0.05 (≈ last 20 samples).
//
//	score = clamp((current - baseline) / (maxN - baseline))
func NewGoroutineSpikeSignal(maxN int, weight float64) Signal {
	return &goroutineSpikeSignal{maxN: maxN, weight: weight}
}

func (s *goroutineSpikeSignal) Name() string    { return "goroutine_spike" }
func (s *goroutineSpikeSignal) Weight() float64 { return s.weight }
func (s *goroutineSpikeSignal) Sample(_ context.Context) float64 {
	n := float64(runtime.NumGoroutine())
	s.mu.Lock()
	if s.baseline == 0 {
		s.baseline = n
	}
	// Only update the baseline DOWNWARD (or sideways) — don't let a
	// freeze train the baseline up so the signal silences itself.
	if n < s.baseline {
		s.baseline = 0.95*s.baseline + 0.05*n
	} else {
		s.baseline = 0.99*s.baseline + 0.01*n
	}
	baseline := s.baseline
	s.mu.Unlock()

	if n <= baseline || float64(s.maxN) <= baseline {
		return 0
	}
	return (n - baseline) / (float64(s.maxN) - baseline)
}

// ---------------------------------------------------------------------------
// DBPoolWait
// ---------------------------------------------------------------------------

type dbPoolWaitSignal struct {
	m         *Manager
	threshold time.Duration
	weight    float64

	// Track wait-rate over the sample interval: ΔWaitDuration /
	// Δsample-time gives "seconds spent waiting per real second".
	mu        sync.Mutex
	prevAt    time.Time
	prevWait  int64 // milliseconds
}

// NewDBPoolWaitSignal scores the *rate* at which the DB pool is
// accumulating wait time, normalised against `threshold` per second.
// If the pool is healthy, requests don't wait; rate ≈ 0. Under
// starvation, rate approaches MaxOpenConns (every concurrent request
// is waiting).
func NewDBPoolWaitSignal(m *Manager, threshold time.Duration, weight float64) Signal {
	return &dbPoolWaitSignal{m: m, threshold: threshold, weight: weight}
}

func (s *dbPoolWaitSignal) Name() string    { return "db_pool_wait" }
func (s *dbPoolWaitSignal) Weight() float64 { return s.weight }
func (s *dbPoolWaitSignal) Sample(_ context.Context) float64 {
	fnPtr := s.m.dbStatsFn.Load()
	if fnPtr == nil {
		return 0
	}
	stats := (*fnPtr)()
	now := time.Now()
	s.mu.Lock()
	defer s.mu.Unlock()
	defer func() {
		s.prevAt = now
		s.prevWait = stats.WaitDurationMS
	}()
	if s.prevAt.IsZero() {
		return 0
	}
	dt := now.Sub(s.prevAt).Seconds()
	if dt <= 0 {
		return 0
	}
	dw := float64(stats.WaitDurationMS-s.prevWait) / 1000.0
	rate := dw / dt
	if rate <= 0 {
		return 0
	}
	return rate / s.threshold.Seconds()
}

// ---------------------------------------------------------------------------
// SchedulerLatency
// ---------------------------------------------------------------------------

type schedulerLatencySignal struct {
	threshold time.Duration
	weight    float64

	mu      sync.Mutex
	samples []metrics.Sample
}

// NewSchedulerLatencySignal scores Go scheduler latency at p99 via
// `sched/latencies:seconds` from runtime/metrics, normalised against
// `threshold`.
//
//	score = clamp(p99 / threshold)
func NewSchedulerLatencySignal(threshold time.Duration, weight float64) Signal {
	s := &schedulerLatencySignal{threshold: threshold, weight: weight}
	s.samples = []metrics.Sample{{Name: "/sched/latencies:seconds"}}
	return s
}

func (s *schedulerLatencySignal) Name() string    { return "scheduler_latency" }
func (s *schedulerLatencySignal) Weight() float64 { return s.weight }
func (s *schedulerLatencySignal) Sample(_ context.Context) float64 {
	s.mu.Lock()
	defer s.mu.Unlock()
	metrics.Read(s.samples)
	v := s.samples[0].Value
	if v.Kind() != metrics.KindFloat64Histogram {
		return 0
	}
	h := v.Float64Histogram()
	if h == nil || len(h.Counts) == 0 {
		return 0
	}
	p99 := histogramQuantile(h, 0.99)
	return p99 / s.threshold.Seconds()
}

func histogramQuantile(h *metrics.Float64Histogram, q float64) float64 {
	var total uint64
	for _, c := range h.Counts {
		total += c
	}
	if total == 0 {
		return 0
	}
	target := uint64(float64(total) * q)
	var cum uint64
	for i, c := range h.Counts {
		cum += c
		if cum >= target {
			// h.Buckets has len(Counts)+1 boundaries; the bucket
			// covers [Buckets[i], Buckets[i+1]). Return the upper
			// bound, which is the pessimistic estimate.
			if i+1 < len(h.Buckets) {
				return h.Buckets[i+1]
			}
			return h.Buckets[i]
		}
	}
	return h.Buckets[len(h.Buckets)-1]
}

// ---------------------------------------------------------------------------
// MutexContention
// ---------------------------------------------------------------------------

type mutexContentionSignal struct {
	threshold float64 // seconds-of-contention per real-second
	weight    float64

	mu     sync.Mutex
	prevAt time.Time
	prevS  float64

	samples []metrics.Sample
}

// NewMutexContentionSignal scores the rate at which the process is
// accumulating mutex-contention time, from
// `/sync/mutex/wait/total:seconds` (runtime/metrics, Go 1.20+).
//
//	score = clamp(Δsec_contended / Δsec_real / threshold)
//
// A score of 1.0 means "every wall-clock second, the equivalent of
// `threshold` seconds is being lost to mutex contention" — typically
// a sign that GOMAXPROCS goroutines are queueing on the same lock.
func NewMutexContentionSignal(threshold float64, weight float64) Signal {
	s := &mutexContentionSignal{threshold: threshold, weight: weight}
	s.samples = []metrics.Sample{{Name: "/sync/mutex/wait/total:seconds"}}
	return s
}

func (s *mutexContentionSignal) Name() string    { return "mutex_contention" }
func (s *mutexContentionSignal) Weight() float64 { return s.weight }
func (s *mutexContentionSignal) Sample(_ context.Context) float64 {
	s.mu.Lock()
	defer s.mu.Unlock()
	metrics.Read(s.samples)
	v := s.samples[0].Value
	if v.Kind() != metrics.KindFloat64 {
		return 0
	}
	cur := v.Float64()
	now := time.Now()
	defer func() {
		s.prevAt = now
		s.prevS = cur
	}()
	if s.prevAt.IsZero() {
		return 0
	}
	dt := now.Sub(s.prevAt).Seconds()
	if dt <= 0 {
		return 0
	}
	rate := (cur - s.prevS) / dt
	if rate <= 0 {
		return 0
	}
	return rate / s.threshold
}

// ---------------------------------------------------------------------------
// Heartbeat
// ---------------------------------------------------------------------------

type heartbeatSignal struct {
	m            *Manager
	stallFactor  int
	weight       float64
	lastObserved atomic.Int64 // unix nano
}

// NewHeartbeatSignal scores 1.0 if the Manager's internal heartbeat
// timestamp hasn't advanced in `stallFactor × sample_interval`. This
// is a meta-signal that detects freezekit's *own* detector loop
// stalling — surfaced primarily as the freezekit_self_stall metric.
//
// Note: an updated heartbeat means the *previous* tick completed.
// This signal is intentionally conservative — score is 0 unless we
// have observed a previous heartbeat that has since gone stale.
func NewHeartbeatSignal(m *Manager, stallFactor int, weight float64) Signal {
	return &heartbeatSignal{m: m, stallFactor: stallFactor, weight: weight}
}

func (s *heartbeatSignal) Name() string    { return "heartbeat" }
func (s *heartbeatSignal) Weight() float64 { return s.weight }
func (s *heartbeatSignal) Sample(_ context.Context) float64 {
	prev := s.lastObserved.Load()
	cur := s.m.heartbeat.Load()
	s.lastObserved.Store(cur)
	if prev == 0 || cur == 0 {
		return 0
	}
	if cur == prev {
		return 1
	}
	return 0
}
