package ratelimit

import (
	"time"

	"github.com/supabase/auth/internal/conf"
)

// Limiter is the interface implemented by rate limiters.
//
// Implementations of Limiter must be safe for concurrent use.
type Limiter interface {

	// Allow should return true if an event should be allowed at the time
	// which it was called, or false otherwise.
	Allow() bool

	// AllowAt should return true if an event should be allowed at the given
	// time, or false otherwise.
	AllowAt(at time.Time) bool

	// Config returns the underlying config value
	Config() conf.Rate
}

// Equal checks to see if two limiters / vals / cfgs are both valid and equal.
func Equal(a, b any) bool {
	return a != nil && b != nil && toRate(a) == toRate(b)
}

func toRate(v any) conf.Rate {
	switch T := v.(type) {
	case *BurstLimiter:
		return T.Config()
	case *IntervalLimiter:
		return T.Config()
	case *conf.Rate:
		return *T
	case conf.Rate:
		return T
	case string:
		var r conf.Rate
		if err := r.Decode(T); err == nil {
			return r
		}
		return conf.Rate{}
	default:
		return conf.Rate{}
	}
}

// New returns a new Limiter based on the given config.
//
// When the type is conf.BurstRateType it returns a BurstLimiter, otherwise
// New returns an IntervalLimiter.
func New(r conf.Rate) Limiter {
	switch r.GetRateType() {
	case conf.BurstRateType:
		return NewBurstLimiter(r)
	default:
		return NewIntervalLimiter(r)
	}
}
