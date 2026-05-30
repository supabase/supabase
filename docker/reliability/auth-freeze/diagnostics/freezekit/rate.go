package freezekit

import (
	"sync"
	"sync/atomic"
	"time"
)

// rateLimiter is a tiny token bucket tuned for "captures per hour".
//
// - Capacity: 1 token. Bursts are explicitly NOT desirable (we don't
//   want to dump-storm at the start of an incident).
// - Refill: 1 token every (3600 / MaxCapturesPerHour) seconds.
// - Floor: regardless of refill, never allow two captures within
//   `minInterval` (typically 5 minutes).
//
// nowFn is overridable for tests (virtual clock).
type rateLimiter struct {
	maxPerHour    int
	minInterval   time.Duration
	refillEvery   time.Duration

	mu         sync.Mutex
	tokens     int
	lastRefill time.Time
	lastAllow  time.Time

	// Adaptive: if 3 captures happen in 1h, double the min interval
	// (capped at 1h). Reset to baseline if no capture in 2× current.
	adaptiveMin time.Duration

	nowFn func() time.Time
}

func newRateLimiter(maxPerHour int, minInterval time.Duration) *rateLimiter {
	if maxPerHour < 1 {
		maxPerHour = 1
	}
	if minInterval <= 0 {
		minInterval = time.Minute
	}
	return &rateLimiter{
		maxPerHour:  maxPerHour,
		minInterval: minInterval,
		refillEvery: time.Hour / time.Duration(maxPerHour),
		tokens:      1,
		adaptiveMin: minInterval,
		nowFn:       time.Now,
	}
}

// allow returns true if a token was consumed, false otherwise.
// Always non-blocking.
func (r *rateLimiter) allow() bool {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := r.nowFn()

	// Lazy refill.
	if r.lastRefill.IsZero() {
		r.lastRefill = now
	}
	elapsed := now.Sub(r.lastRefill)
	if elapsed >= r.refillEvery {
		// Add at most 1 token (capacity is 1).
		r.tokens = 1
		r.lastRefill = now
	}

	// Adaptive cooldown: stretch as we keep firing within the hour.
	if !r.lastAllow.IsZero() && now.Sub(r.lastAllow) < r.adaptiveMin {
		return false
	}

	if r.tokens <= 0 {
		return false
	}

	// Adaptive bump: if we fire >2 in adaptive window, double it.
	if !r.lastAllow.IsZero() && now.Sub(r.lastAllow) < time.Hour && r.adaptiveMin < time.Hour {
		// Compute how aggressive we've been recently.
		gap := now.Sub(r.lastAllow)
		if gap < r.adaptiveMin*2 {
			r.adaptiveMin *= 2
			if r.adaptiveMin > time.Hour {
				r.adaptiveMin = time.Hour
			}
		}
	} else if now.Sub(r.lastAllow) > r.adaptiveMin*2 {
		// Decay back to baseline.
		r.adaptiveMin = r.minInterval
	}

	r.tokens--
	r.lastAllow = now
	return true
}

// ----------------------------------------------------------------------------
// Circuit breaker.
//
// A simple 3-state breaker:
//
//	closed   normal operation, count failures
//	open     all calls rejected until cooldown elapses
//	half-open after cooldown, allow exactly one probe call; on success
//	         → closed, on failure → open
// ----------------------------------------------------------------------------

type breakerState int32

const (
	breakerClosed breakerState = iota
	breakerOpen
	breakerHalfOpen
)

type circuitBreaker struct {
	failureThreshold int
	cooldown         time.Duration

	state           atomic.Int32 // breakerState
	consecutiveFail atomic.Int32
	openedAt        atomic.Int64 // unix nano

	nowFn func() time.Time
}

func newCircuitBreaker(failureThreshold int, cooldown time.Duration) *circuitBreaker {
	if failureThreshold < 1 {
		failureThreshold = 5
	}
	if cooldown <= 0 {
		cooldown = 10 * time.Minute
	}
	return &circuitBreaker{
		failureThreshold: failureThreshold,
		cooldown:         cooldown,
		nowFn:            time.Now,
	}
}

// Allow returns true if the call may proceed. Must be paired with a
// subsequent Success() or Failure() call.
func (b *circuitBreaker) Allow() bool {
	st := breakerState(b.state.Load())
	switch st {
	case breakerClosed:
		return true
	case breakerOpen:
		if time.Since(time.Unix(0, b.openedAt.Load())) >= b.cooldown {
			// Try to transition to half-open. Only one caller wins.
			if b.state.CompareAndSwap(int32(breakerOpen), int32(breakerHalfOpen)) {
				return true
			}
		}
		return false
	case breakerHalfOpen:
		// Only one probe at a time; if we got here someone else has it.
		return false
	}
	return false
}

func (b *circuitBreaker) Success() {
	b.consecutiveFail.Store(0)
	b.state.Store(int32(breakerClosed))
}

func (b *circuitBreaker) Failure() {
	st := breakerState(b.state.Load())
	if st == breakerHalfOpen {
		// Probe failed → re-open.
		b.openedAt.Store(b.nowFn().UnixNano())
		b.state.Store(int32(breakerOpen))
		return
	}
	n := b.consecutiveFail.Add(1)
	if int(n) >= b.failureThreshold {
		b.openedAt.Store(b.nowFn().UnixNano())
		b.state.Store(int32(breakerOpen))
	}
}

// State returns the current breaker state. Mainly for tests / debug.
func (b *circuitBreaker) State() string {
	switch breakerState(b.state.Load()) {
	case breakerClosed:
		return "closed"
	case breakerOpen:
		return "open"
	case breakerHalfOpen:
		return "half-open"
	}
	return "unknown"
}
