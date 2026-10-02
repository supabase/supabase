package ratelimit

import (
	"fmt"
	"testing"
	"time"

	"github.com/supabase/auth/internal/conf"
)

func Example_newIntervalLimiter() {
	now, _ := time.Parse(time.RFC3339, "2024-09-24T10:00:00.00Z")
	cfg := conf.Rate{Events: 100, OverTime: time.Hour * 24}
	rl := NewIntervalLimiter(cfg)
	rl.last = now

	cur := now
	allowed := 0

	for days := 0; days < 2; days++ {
		// First 100 events succeed.
		for i := 0; i < 100; i++ {
			allow := rl.allowAt(cur)
			cur = cur.Add(time.Second)

			if !allow {
				fmt.Printf("false @ %v after %v events... [FAILED]\n", cur, allowed)
				return
			}
			allowed++
		}
		fmt.Printf("true  @ %v for last %v events...\n", cur, allowed)

		// We try hourly until it allows us to make requests again.
		denied := 0
		for i := 0; i < 23; i++ {
			cur = cur.Add(time.Hour)
			allow := rl.AllowAt(cur)
			if allow {
				fmt.Printf("true  @ %v before quota reset... [FAILED]\n", cur)
				return
			}
			denied++
		}
		fmt.Printf("false @ %v for last %v events...\n", cur, denied)

		cur = cur.Add(time.Hour)
	}

	// Output:
	// true  @ 2024-09-24 10:01:40 +0000 UTC for last 100 events...
	// false @ 2024-09-25 09:01:40 +0000 UTC for last 23 events...
	// true  @ 2024-09-25 10:03:20 +0000 UTC for last 200 events...
	// false @ 2024-09-26 09:03:20 +0000 UTC for last 23 events...
}

func TestNewIntervalLimiter(t *testing.T) {
	t.Run("Allow", func(t *testing.T) {
		for i := 1; i < 10; i++ {
			cfg := conf.Rate{Events: float64(i), OverTime: time.Hour}
			rl := NewIntervalLimiter(cfg)
			for y := i; y > 0; y-- {
				if exp, got := true, rl.Allow(); exp != got {
					t.Fatalf("exp Allow() to be %v; got %v", exp, got)
				}
			}
			if exp, got := false, rl.Allow(); exp != got {
				t.Fatalf("exp Allow() to be %v; got %v", exp, got)
			}
		}

		// should accept a negative burst.
		cfg := conf.Rate{Events: 10, OverTime: time.Hour}
		rl := NewBurstLimiter(cfg)
		for y := 0; y < 10; y++ {
			if exp, got := true, rl.Allow(); exp != got {
				t.Fatalf("exp Allow() to be %v; got %v", exp, got)
			}
		}
	})
}
