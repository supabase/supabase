package freezekit

import (
	"context"
	"log/slog"
	"math"
	"sync"
	"sync/atomic"
	"time"
)

// detector is the state machine + signal-scoring engine. One per Manager.
//
// The detector is the single owner of all UP-transitions:
//
//   * NORMAL → WARNING → DEGRADED → FREEZE_DETECTED
//
// DOWN-transitions happen only via [markCaptureComplete] (resets to
// NORMAL after cooldown) or via [Manager.Disable].
//
// External callers can request a capture explicitly via
// [requestExternalCapture] (programmatic) or [forceCapture] (operator
// button); both bypass the score threshold but still respect the
// capture worker and the rate limiter.
type detector struct {
	cfg DetectorConfig
	log *slog.Logger
	m   *managerMetrics

	state           atomicState
	score           atomicFloat64
	captureRequests chan captureReq

	// debounce counters per UP transition. Reset when score drops
	// below the corresponding threshold. Bounded by DebounceSamples.
	mu                  sync.Mutex
	consecutiveWarn     int
	consecutiveDegraded int
	consecutiveFreeze   int
	lastCapture         time.Time
	lastSignalScores    []signalSnapshot
	lastTopSignal       signalSnapshot
	cooldownUntil       time.Time
}

type captureReq struct {
	reason   string
	manifest *Manifest // optional pre-populated manifest fragment
}

type signalSnapshot struct {
	Name   string  `json:"name"`
	Score  float64 `json:"score"`
	Weight float64 `json:"weight"`
}

// StateSnapshot is the JSON shape returned by /debug/freezekit/state.
type StateSnapshot struct {
	State            string           `json:"state"`
	Score            float64          `json:"score"`
	TopSignal        signalSnapshot   `json:"top_signal"`
	Signals          []signalSnapshot `json:"signals"`
	LastCapture      time.Time        `json:"last_capture,omitempty"`
	CooldownUntil    time.Time        `json:"cooldown_until,omitempty"`
	Inflight         InflightSummary  `json:"inflight"`
	DetectorEnabled  bool             `json:"detector_enabled"`
}

func newDetector(cfg DetectorConfig, m *managerMetrics, log *slog.Logger) *detector {
	return &detector{
		cfg:             cfg,
		log:             log.With(slog.String("component", "detector")),
		m:               m,
		captureRequests: make(chan captureReq, 1), // capacity 1: only one outstanding
	}
}

// tick runs one sample loop iteration. Returns (triggered, reason)
// where triggered indicates that a capture should be requested *now*.
func (d *detector) tick(ctx context.Context) (bool, string) {
	signals := d.cfg.Signals
	scores := make([]signalSnapshot, 0, len(signals))

	var (
		weightedSum, weightTotal float64
		maxScore                 float64
		topSig                   signalSnapshot
	)
	for _, s := range signals {
		raw := safeSample(ctx, s)
		w := s.Weight()
		if w <= 0 {
			w = 1
		}
		clamped := clamp01(raw)
		weightedSum += clamped * w
		weightTotal += w
		if clamped > maxScore {
			maxScore = clamped
			topSig = signalSnapshot{Name: s.Name(), Score: clamped, Weight: w}
		}
		scores = append(scores, signalSnapshot{Name: s.Name(), Score: clamped, Weight: w})
		d.m.signalScore.set(map[string]string{"signal": s.Name()}, clamped)
	}

	weightedAvg := 0.0
	if weightTotal > 0 {
		weightedAvg = weightedSum / weightTotal
	}
	severity := maxFloat(weightedAvg, maxScore)
	d.score.set(severity)

	d.mu.Lock()
	d.lastSignalScores = scores
	d.lastTopSignal = topSig
	cooldownActive := time.Now().Before(d.cooldownUntil)
	d.mu.Unlock()

	// If detector is disabled, still emit metrics but do not transition.
	if !d.cfg.Enabled {
		d.m.state.set(float64(StateNormal))
		return false, ""
	}

	// In CAPTURE_COMPLETE, do not transition. Wait for cooldown.
	if d.state.load() == StateCaptureComplete {
		if !cooldownActive {
			d.state.store(StateNormal)
			d.m.state.set(float64(StateNormal))
		} else {
			d.m.state.set(float64(StateCaptureComplete))
		}
		return false, ""
	}

	transition := d.computeTransition(severity)
	d.m.state.set(float64(d.state.load()))

	if transition == StateFreezeDetected {
		// Promote into FREEZE_DETECTED. Only the first thread to
		// make the transition out of any non-FREEZE state wins.
		for _, from := range [...]State{StateNormal, StateWarning, StateDegraded} {
			if d.state.cas(from, StateFreezeDetected) {
				reason := topSig.Name
				if reason == "" {
					reason = "composite_score"
				}
				d.m.state.set(float64(StateFreezeDetected))
				return true, reason
			}
		}
	}
	return false, ""
}

// computeTransition updates the consecutiveX counters and returns the
// state the detector wants to be in. Returns the *current* state if
// no transition.
func (d *detector) computeTransition(severity float64) State {
	d.mu.Lock()
	defer d.mu.Unlock()

	// Counter updates.
	if severity >= d.cfg.FreezeThreshold {
		d.consecutiveFreeze++
		d.consecutiveDegraded++
		d.consecutiveWarn++
	} else {
		d.consecutiveFreeze = 0
		if severity >= d.cfg.DegradedThreshold {
			d.consecutiveDegraded++
			d.consecutiveWarn++
		} else {
			d.consecutiveDegraded = 0
			if severity >= d.cfg.WarnThreshold {
				d.consecutiveWarn++
			} else {
				d.consecutiveWarn = 0
			}
		}
	}

	switch {
	case d.consecutiveFreeze >= d.cfg.DebounceSamples:
		return StateFreezeDetected
	case d.consecutiveDegraded >= d.cfg.DebounceSamples:
		d.state.store(StateDegraded)
		return StateDegraded
	case d.consecutiveWarn >= d.cfg.DebounceSamples:
		// Don't downgrade DEGRADED to WARNING within the same tick.
		if d.state.load() < StateDegraded {
			d.state.store(StateWarning)
		}
		return StateWarning
	default:
		if d.state.load() != StateFreezeDetected {
			d.state.store(StateNormal)
		}
		return StateNormal
	}
}

// markFreezeDetected snaps the state machine to FREEZE_DETECTED.
// Called by Manager.TriggerCapture and HandleCapture so the state
// metric reflects the manual trigger; the actual capture is queued
// by the Manager directly (this method does not own that flow).
func (d *detector) markFreezeDetected() {
	d.state.store(StateFreezeDetected)
	d.m.state.set(float64(StateFreezeDetected))
}

// markCaptureComplete transitions the state to CAPTURE_COMPLETE and
// schedules the cooldown.
func (d *detector) markCaptureComplete() {
	d.state.store(StateCaptureComplete)
	d.m.state.set(float64(StateCaptureComplete))
	d.mu.Lock()
	d.lastCapture = time.Now()
	d.cooldownUntil = d.lastCapture.Add(d.cfg.Cooldown)
	d.consecutiveFreeze = 0
	d.consecutiveDegraded = 0
	d.consecutiveWarn = 0
	d.mu.Unlock()
}

func (d *detector) markCaptureSkipped(reason string) {
	// Treat as a partial complete: enter the cooldown so we don't
	// keep retrying the same already-rejected trigger.
	d.markCaptureComplete()
	d.log.Info("capture skipped", slog.String("reason", reason))
}

// snapshot returns the current state for /debug/freezekit/state.
// The Inflight field is filled by the caller.
func (d *detector) snapshot() StateSnapshot {
	d.mu.Lock()
	defer d.mu.Unlock()
	return StateSnapshot{
		State:           d.state.load().String(),
		Score:           d.score.get(),
		TopSignal:       d.lastTopSignal,
		Signals:         append([]signalSnapshot(nil), d.lastSignalScores...),
		LastCapture:     d.lastCapture,
		CooldownUntil:   d.cooldownUntil,
		DetectorEnabled: d.cfg.Enabled,
	}
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

// safeSample runs s.Sample with a 1-second budget and a panic recovery.
// A signal that panics or hangs cannot stall the detector loop.
func safeSample(parent context.Context, s Signal) (out float64) {
	ctx, cancel := context.WithTimeout(parent, time.Second)
	defer cancel()
	defer func() {
		if r := recover(); r != nil {
			out = 0
		}
	}()
	type result struct{ v float64 }
	ch := make(chan result, 1)
	go func() {
		defer func() {
			if r := recover(); r != nil {
				ch <- result{v: 0}
			}
		}()
		ch <- result{v: s.Sample(ctx)}
	}()
	select {
	case r := <-ch:
		return r.v
	case <-ctx.Done():
		// Hung signal contributes 0, not 1. We do NOT want a flaky
		// signal to trigger captures by itself.
		return 0
	}
}

func clamp01(v float64) float64 {
	if v < 0 {
		return 0
	}
	if v > 1 {
		return 1
	}
	return v
}

func maxFloat(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}

// atomicFloat64 is a small wrapper. math.Float64bits would let us
// CAS but we don't need it here; we only Store/Load.
type atomicFloat64 struct {
	v atomic.Uint64
}

func (a *atomicFloat64) set(f float64) { a.v.Store(math.Float64bits(f)) }
func (a *atomicFloat64) get() float64  { return math.Float64frombits(a.v.Load()) }
