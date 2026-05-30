package freezekit

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"runtime"
	"runtime/debug"
	"sync"
	"sync/atomic"
	"time"
)

// Manager is the entrypoint of freezekit. One Manager per process.
//
// Lifecycle:
//
//   - [New] validates the Config and constructs the Manager. No
//     background goroutines are spawned.
//   - [Manager.Run] is a blocking call that owns all background work
//     (signal sampling, detector state machine, capture worker,
//     upload workers, self-watchdog). It returns when ctx is
//     cancelled.
//   - [Manager.Shutdown] performs a final flush of pending uploads
//     with the given context as deadline. It is safe to call from
//     a defer.
//
// Concurrency:
//
//   - The Manager itself is safe to use from multiple goroutines.
//   - The HTTPMiddleware can be used freely.
//   - [Manager.TriggerCapture] is safe and non-blocking; the actual
//     capture happens asynchronously.
type Manager struct {
	cfg    Config
	log    *slog.Logger

	// Wired sub-systems. Constructed in New, owned by the Manager
	// for its full lifetime. None of these are reassigned after
	// New returns.
	detector     *detector
	tracker      *inflightTracker
	capturer     *capturer
	rateLimiter  *rateLimiter
	circuit      *circuitBreaker
	metrics      *managerMetrics
	dbStatsFn    atomic.Pointer[func() DBPoolStats]

	// Channel between the capture worker and upload workers.
	// Bounded; drop-on-full.
	uploads chan Artifact

	// runOnce guards Run from being called more than once.
	runOnce sync.Once

	// shutdown coordination.
	shutdownOnce     sync.Once
	shutdownDoneOnce sync.Once
	shutdownDone     chan struct{}

	// Self-watchdog heartbeat. Updated by the detector loop; read
	// by the watchdog goroutine.
	heartbeat atomic.Int64 // unix nano of last sample loop tick

	// Disabled flag, set by Shutdown or self-watchdog. While true,
	// all public methods become no-ops.
	disabled atomic.Bool

	// startedAt is the process start time captured by New. Used in
	// the manifest's uptime field.
	startedAt time.Time
}

// New constructs a Manager from the given Config. It validates the
// config and installs the configured block/mutex profile rates but
// does NOT start any background work — call [Manager.Run] for that.
//
// If cfg.Disabled is true, New returns a Manager whose Run is a
// no-op and whose middleware is a passthrough.
func New(cfg Config) (*Manager, error) {
	cfg = cfg.WithDefaults()
	if cfg.Disabled {
		m := &Manager{cfg: cfg, log: cfg.Logger, shutdownDone: make(chan struct{})}
		m.disabled.Store(true)
		return m, nil
	}
	if err := cfg.Validate(); err != nil {
		return nil, fmt.Errorf("freezekit config: %w", err)
	}

	// Install profile rates exactly once per process. Re-calling
	// these with the same values is a no-op so calling from tests
	// that construct multiple Managers is safe enough.
	if cfg.Capture.BlockProfileRateNS > 0 {
		runtime.SetBlockProfileRate(cfg.Capture.BlockProfileRateNS)
	}
	if cfg.Capture.MutexProfileFraction > 0 {
		runtime.SetMutexProfileFraction(cfg.Capture.MutexProfileFraction)
	}

	m := &Manager{
		cfg:          cfg,
		log:          cfg.Logger.With(slog.String("subsystem", "freezekit")),
		shutdownDone: make(chan struct{}),
		startedAt:    time.Now(),
		uploads:      make(chan Artifact, cfg.Limits.ArtifactChannelCap),
	}
	m.metrics = newManagerMetrics()
	m.tracker = newInflightTracker()

	// Default the signal list if the user didn't provide one.
	if len(cfg.Detector.Signals) == 0 {
		cfg.Detector.Signals = DefaultSignals(m)
	}
	m.detector = newDetector(cfg.Detector, m.metrics, m.log)
	m.capturer = newCapturer(cfg, m)
	m.rateLimiter = newRateLimiter(
		cfg.Limits.MaxCapturesPerHour,
		cfg.Limits.MinIntervalBetweenCaptures,
	)
	m.circuit = newCircuitBreaker(
		cfg.Limits.SinkCircuitBreakerFailures,
		cfg.Limits.SinkCircuitBreakerCooldown,
	)

	// Auto-wire the metrics into well-known sinks. Operators who
	// embed custom sinks can implement metricsWirable to receive
	// the same callback.
	wireSinkMetrics(m.cfg.Sink, m.metrics)

	return m, nil
}

// wireSinkMetrics walks a Sink tree (including MultiSink) and hands
// the metric set to any sink that wants it.
func wireSinkMetrics(s Sink, m *managerMetrics) {
	switch v := s.(type) {
	case *LocalSink:
		v.WithMetrics(m)
	case MultiSink:
		for _, child := range v.Sinks {
			wireSinkMetrics(child, m)
		}
	case *MultiSink:
		for _, child := range v.Sinks {
			wireSinkMetrics(child, m)
		}
	}
}

// Run starts all background work. It blocks until ctx is cancelled
// and then returns nil. Calling Run a second time returns an error.
func (m *Manager) Run(ctx context.Context) error {
	if m.disabled.Load() {
		m.log.Info("freezekit disabled; Run returning immediately")
		<-ctx.Done()
		return nil
	}

	started := false
	m.runOnce.Do(func() {
		started = true
		m.log.Info("freezekit starting",
			slog.String("service", m.cfg.ProcessMeta.ServiceName),
			slog.String("version", m.cfg.ProcessMeta.ServiceVersion),
			slog.String("pod", m.cfg.ProcessMeta.PodName),
			slog.Bool("detector_enabled", m.cfg.Detector.Enabled),
			slog.String("sink", m.cfg.Sink.Name()),
		)

		var wg sync.WaitGroup

		// Detector / sampler loop.
		wg.Add(1)
		go m.runWithRecover(ctx, "detector", &wg, m.detectorLoop)

		// Capture worker (single, drained from the trigger channel
		// inside the detector).
		wg.Add(1)
		go m.runWithRecover(ctx, "capturer", &wg, m.captureLoop)

		// Upload workers.
		for i := 0; i < m.cfg.Limits.UploadWorkers; i++ {
			i := i
			wg.Add(1)
			go m.runWithRecover(ctx, fmt.Sprintf("upload-%d", i), &wg, m.uploadLoop)
		}

		// Self-watchdog.
		wg.Add(1)
		go m.runWithRecover(ctx, "self-watchdog", &wg, m.selfWatchdog)

		<-ctx.Done()
		// Closing uploads tells upload workers to drain & exit.
		close(m.uploads)
		wg.Wait()
	})

	if !started {
		return errors.New("freezekit: Run called more than once")
	}
	return nil
}

// Shutdown blocks until all in-flight uploads complete or the
// context expires. Safe to call from a defer. After Shutdown, the
// Manager is permanently disabled.
func (m *Manager) Shutdown(ctx context.Context) error {
	var err error
	m.shutdownOnce.Do(func() {
		m.disabled.Store(true)
		m.log.Info("freezekit shutdown requested")
		// We don't own the Run ctx; rely on the operator passing
		// it cancellation. We only wait briefly for outstanding
		// uploads via the shutdownDone channel.
		select {
		case <-m.shutdownDone:
		case <-ctx.Done():
			err = ctx.Err()
		case <-time.After(5 * time.Second):
		}
	})
	return err
}

// Disable is the in-process equivalent of FREEZEKIT_DISABLED=true.
// After Disable, all background loops degrade to no-ops on next
// iteration.
func (m *Manager) Disable(reason string) {
	if m.disabled.CompareAndSwap(false, true) {
		m.log.Warn("freezekit disabling itself", slog.String("reason", reason))
		m.metrics.disabled.Store(true)
	}
}

// SetDBPoolStatsFunc registers a callback the DBPoolWait signal can
// use to read live pool stats. It is safe to call before or after Run.
// Passing nil unsets the callback (signal returns 0).
func (m *Manager) SetDBPoolStatsFunc(fn func() DBPoolStats) {
	if fn == nil {
		m.dbStatsFn.Store(nil)
		return
	}
	m.dbStatsFn.Store(&fn)
}

// TriggerCapture asynchronously requests a capture. Always returns
// quickly; the actual capture happens on the capture worker.
// `reason` is a human-readable label embedded in the manifest.
//
// Returns true if the request was accepted (the capture will be
// attempted) and false if it was rejected by the rate limiter, the
// capture worker already has a pending request, or freezekit is
// disabled.
func (m *Manager) TriggerCapture(reason string) bool {
	if m.disabled.Load() {
		return false
	}
	if !m.rateLimiter.allow() {
		m.metrics.dropped.add("rate_limited", 1)
		m.log.Debug("capture rejected by rate limiter", slog.String("reason", reason))
		return false
	}
	if m.cfg.Limits.SampleRate < 1 && globalRand.Float64() >= m.cfg.Limits.SampleRate {
		m.metrics.dropped.add("sample_skip", 1)
		return false
	}
	m.detector.markFreezeDetected()
	return m.capturer.requestCapture(reason)
}

// HTTPMiddleware returns a middleware that wraps every handler with
// the in-flight tracker and a correlation ID. See [InflightTracker]
// for the metadata it records.
//
// If the Manager is disabled, the returned middleware is a
// transparent passthrough.
func (m *Manager) HTTPMiddleware() func(http.Handler) http.Handler {
	if m.disabled.Load() {
		return func(next http.Handler) http.Handler { return next }
	}
	return m.tracker.middleware(m.cfg.Capture.Redaction, m.metrics)
}

// MountDebugRoutes registers the operator-facing debug endpoints
// on the given chi-compatible router. The signature is:
//
//	r.Route("/debug/freezekit", fk.MountDebugRoutes)
//
// or, plain net/http style:
//
//	mux.HandleFunc("/debug/freezekit/state", fk.HandleState)
//	mux.HandleFunc("/debug/freezekit/capture", fk.HandleCapture)
//	mux.HandleFunc("/debug/freezekit/captures", fk.HandleListCaptures)
//
// All endpoints expect the caller to be authenticated upstream
// (e.g. behind a service-role-key check). freezekit does NOT add
// auth of its own.
func (m *Manager) MountDebugRoutes(r interface {
	Get(string, http.HandlerFunc)
	Post(string, http.HandlerFunc)
}) {
	r.Get("/state", m.HandleState)
	r.Post("/capture", m.HandleCapture)
	r.Get("/captures", m.HandleListCaptures)
}

// HandleState is the GET handler for /debug/freezekit/state.
// Returns the detector state, last-N signal scores, and current
// in-flight summary as JSON.
func (m *Manager) HandleState(w http.ResponseWriter, _ *http.Request) {
	if m.disabled.Load() {
		w.WriteHeader(http.StatusServiceUnavailable)
		_, _ = w.Write([]byte(`{"disabled":true}`))
		return
	}
	snap := m.detector.snapshot()
	snap.Inflight = m.tracker.summary()
	w.Header().Set("Content-Type", "application/json")
	_ = writeJSON(w, snap)
}

// HandleCapture is the POST handler for /debug/freezekit/capture.
// Triggers a manual capture *bypassing* the rate limiter (this is
// a deliberate choice: an operator pressing the button knows what
// they want).
func (m *Manager) HandleCapture(w http.ResponseWriter, r *http.Request) {
	reason := r.URL.Query().Get("reason")
	if reason == "" {
		reason = "manual"
	}
	if m.disabled.Load() {
		http.Error(w, "freezekit disabled", http.StatusServiceUnavailable)
		return
	}
	m.detector.markFreezeDetected()
	if !m.capturer.requestCapture(reason) {
		http.Error(w, "capture already in progress", http.StatusConflict)
		return
	}
	w.WriteHeader(http.StatusAccepted)
	_, _ = fmt.Fprintf(w, `{"accepted":true,"reason":%q}`, reason)
}

// HandleListCaptures is the GET handler for /debug/freezekit/captures.
// Returns the manifests of the last K captures still resident on
// the local sink. If the configured sink isn't a LocalSink or a
// MultiSink containing one, returns an empty list.
func (m *Manager) HandleListCaptures(w http.ResponseWriter, _ *http.Request) {
	lister, ok := m.cfg.Sink.(ListableSink)
	w.Header().Set("Content-Type", "application/json")
	if !ok {
		_, _ = w.Write([]byte(`{"manifests":[]}`))
		return
	}
	ms, err := lister.ListRecent(64)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	_ = writeJSON(w, struct {
		Manifests []Manifest `json:"manifests"`
	}{Manifests: ms})
}

// ----------------------------------------------------------------------------
// Background goroutines. Each is invoked through [runWithRecover] so
// that a panic anywhere in freezekit cannot crash the host process.
// ----------------------------------------------------------------------------

func (m *Manager) runWithRecover(ctx context.Context, name string, wg *sync.WaitGroup, fn func(context.Context)) {
	defer wg.Done()
	for {
		// Inner closure so each restart resets the defer chain.
		func() {
			defer func() {
				if rec := recover(); rec != nil {
					m.metrics.panics.add(name, 1)
					m.log.Error("freezekit goroutine panicked; restarting",
						slog.String("goroutine", name),
						slog.Any("panic", rec),
						slog.String("stack", string(debug.Stack())),
					)
				}
			}()
			fn(ctx)
		}()
		// Either ctx cancelled (clean exit) or panic (restart).
		select {
		case <-ctx.Done():
			return
		case <-time.After(500 * time.Millisecond):
			// brief backoff before restarting after a panic
		}
		if m.disabled.Load() {
			return
		}
	}
}

func (m *Manager) detectorLoop(ctx context.Context) {
	t := time.NewTicker(m.cfg.Detector.SampleInterval)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			m.heartbeat.Store(time.Now().UnixNano())
			if m.disabled.Load() {
				continue
			}
			triggered, reason := m.detector.tick(ctx)
			if !triggered {
				continue
			}
			if !m.rateLimiter.allow() {
				m.metrics.dropped.add("rate_limited", 1)
				m.detector.markCaptureSkipped("rate_limited")
				continue
			}
			if m.cfg.Limits.SampleRate < 1 && globalRand.Float64() >= m.cfg.Limits.SampleRate {
				m.metrics.dropped.add("sample_skip", 1)
				m.detector.markCaptureSkipped("sample_skip")
				continue
			}
			if !m.capturer.requestCapture(reason) {
				m.metrics.dropped.add("queue_full", 1)
				m.detector.markCaptureSkipped("queue_full")
			}
		}
	}
}

func (m *Manager) captureLoop(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case req, ok := <-m.capturer.requests:
			if !ok {
				return
			}
			if m.disabled.Load() {
				m.detector.markCaptureComplete()
				continue
			}
			arts := m.capturer.runOnce(ctx, req)
			for _, a := range arts {
				select {
				case m.uploads <- a:
				default:
					m.metrics.dropped.add("channel_full", 1)
					m.log.Warn("artifact dropped: upload channel full",
						slog.String("artifact", a.Name),
						slog.Int("size", len(a.Body)),
					)
				}
			}
			m.detector.markCaptureComplete()
		}
	}
}

func (m *Manager) uploadLoop(ctx context.Context) {
	for a := range m.uploads {
		if m.disabled.Load() {
			continue
		}
		m.uploadOne(ctx, a)
	}
	// channel closed → signal Shutdown. shutdownDoneOnce makes
	// it safe for every upload goroutine to call this.
	m.shutdownDoneOnce.Do(func() { close(m.shutdownDone) })
}

func (m *Manager) uploadOne(ctx context.Context, a Artifact) {
	if !m.circuit.Allow() {
		m.metrics.sinkUploads.add(map[string]string{
			"sink": m.cfg.Sink.Name(), "result": "circuit_open",
		}, 1)
		return
	}
	var lastErr error
	backoff := time.Second
	for attempt := 0; attempt < m.cfg.Limits.UploadAttempts; attempt++ {
		ac, cancel := context.WithTimeout(ctx, m.cfg.Limits.UploadAttemptTimeout)
		start := time.Now()
		err := m.cfg.Sink.Put(ac, a)
		cancel()
		m.metrics.uploadDuration.observe(map[string]string{"sink": m.cfg.Sink.Name()},
			time.Since(start).Seconds())
		if err == nil {
			m.metrics.sinkUploads.add(map[string]string{
				"sink": m.cfg.Sink.Name(), "result": "ok",
			}, 1)
			m.circuit.Success()
			return
		}
		lastErr = err
		// Don't retry on context cancellation.
		if errors.Is(err, context.Canceled) {
			break
		}
		// Linear-then-doubling backoff.
		select {
		case <-time.After(backoff):
		case <-ctx.Done():
			return
		}
		if backoff < 30*time.Second {
			backoff *= 4
		}
	}
	m.metrics.sinkUploads.add(map[string]string{
		"sink": m.cfg.Sink.Name(), "result": "failed",
	}, 1)
	m.circuit.Failure()
	m.log.Warn("artifact upload failed after retries",
		slog.String("artifact", a.Name),
		slog.String("sink", m.cfg.Sink.Name()),
		slog.Any("err", lastErr),
	)
}

func (m *Manager) selfWatchdog(ctx context.Context) {
	t := time.NewTicker(m.cfg.Limits.SelfStallThreshold / 3)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			last := m.heartbeat.Load()
			if last == 0 {
				continue
			}
			age := time.Since(time.Unix(0, last))
			if age > m.cfg.Limits.SelfStallThreshold {
				m.metrics.selfStall.add(1)
				m.Disable(fmt.Sprintf("self-watchdog: detector loop stalled for %s", age))
				return
			}
		}
	}
}

