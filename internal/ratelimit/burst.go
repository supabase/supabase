package ratelimit

import (
	"time"

	"github.com/supabase/auth/internal/conf"
	"golang.org/x/time/rate"
)

const defaultOverTime = time.Hour

// BurstLimiter wraps the golang.org/x/time/rate package.
type BurstLimiter struct {
	rl  *rate.Limiter
	cfg conf.Rate
}

// NewBurstLimiter returns a rate limiter configured using the given conf.Rate.
//
// The returned Limiter will be configured with a token bucket containing a
// single token, which will fill up at a rate of 1 event per r.OverTime with
// an initial burst amount of r.Events.
//
// For example:
//   - 1/10s  is 1 events per 10 seconds with burst of 1.
//   - 1/2s   is 1 events per 2  seconds with burst of 1.
//   - 10/10s is 1 events per 10 seconds with burst of 10.
//
// If Rate.Events is <= 0, the burst amount will be set to 0. Since b is the
// initial size of the token bucket this means no events will be permitted at
// all.
//
// See Example_newBurstLimiter for a visualization.
func NewBurstLimiter(r conf.Rate) *BurstLimiter {
	// The rate limiter deals in events per second.
	d := r.OverTime
	if d <= 0 {
		d = defaultOverTime
	}

	e := r.Events
	if e <= 0 {
		e = 0
	}

	// BurstLimiter will have an initial token bucket of size `e`. It will
	// be refilled at a rate of 1 per duration `d` indefinitely.
	rl := &BurstLimiter{
		rl:  rate.NewLimiter(rate.Every(d), int(e)),
		cfg: r,
	}
	return rl
}

// Allow implements Limiter by calling AllowAt with the current time.
func (l *BurstLimiter) Allow() bool {
	return l.AllowAt(time.Now())
}

// AllowAt implements Limiter by calling the underlying x/time/rate.Limiter
// with the given time.
func (l *BurstLimiter) AllowAt(at time.Time) bool {
	return l.rl.AllowN(at, 1)
}

func (l *BurstLimiter) String() string { return "BurstLimiter" }

func (l *BurstLimiter) Config() conf.Rate { return l.cfg }
