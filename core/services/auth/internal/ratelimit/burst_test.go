package ratelimit

import (
	"fmt"
	"testing"
	"time"

	"github.com/supabase/auth/internal/conf"
)

func Example_newBurstLimiter() {
	now, _ := time.Parse(time.RFC3339, "2024-09-24T10:00:00.00Z")
	{
		cfg := conf.Rate{Events: 10, OverTime: time.Second * 20}
		rl := NewBurstLimiter(cfg)
		cur := now
		for i := 0; i < 20; i++ {
			allowed := rl.AllowAt(cur)
			fmt.Printf("%-5v @ %v\n", allowed, cur)
			cur = cur.Add(time.Second * 5)
		}
	}

	// Output:
	// true  @ 2024-09-24 10:00:00 +0000 UTC
	// true  @ 2024-09-24 10:00:05 +0000 UTC
	// true  @ 2024-09-24 10:00:10 +0000 UTC
	// true  @ 2024-09-24 10:00:15 +0000 UTC
	// true  @ 2024-09-24 10:00:20 +0000 UTC
	// true  @ 2024-09-24 10:00:25 +0000 UTC
	// true  @ 2024-09-24 10:00:30 +0000 UTC
	// true  @ 2024-09-24 10:00:35 +0000 UTC
	// true  @ 2024-09-24 10:00:40 +0000 UTC
	// true  @ 2024-09-24 10:00:45 +0000 UTC
	// true  @ 2024-09-24 10:00:50 +0000 UTC
	// true  @ 2024-09-24 10:00:55 +0000 UTC
	// true  @ 2024-09-24 10:01:00 +0000 UTC
	// false @ 2024-09-24 10:01:05 +0000 UTC
	// false @ 2024-09-24 10:01:10 +0000 UTC
	// false @ 2024-09-24 10:01:15 +0000 UTC
	// true  @ 2024-09-24 10:01:20 +0000 UTC
	// false @ 2024-09-24 10:01:25 +0000 UTC
	// false @ 2024-09-24 10:01:30 +0000 UTC
	// false @ 2024-09-24 10:01:35 +0000 UTC
}

func TestBurstLimiter(t *testing.T) {
	t.Run("Allow", func(t *testing.T) {
		for i := 1; i < 10; i++ {
			cfg := conf.Rate{Events: float64(i), OverTime: time.Hour}
			rl := NewBurstLimiter(cfg)
			for y := i; y > 0; y-- {
				if exp, got := true, rl.Allow(); exp != got {
					t.Fatalf("exp Allow() to be %v; got %v", exp, got)
				}
			}
			if exp, got := false, rl.Allow(); exp != got {
				t.Fatalf("exp Allow() to be %v; got %v", exp, got)
			}
		}
	})

	t.Run("AllowAt", func(t *testing.T) {
		now, _ := time.Parse(time.RFC3339, "2024-09-24T10:00:00.00Z")

		type event struct {
			ok bool
			at time.Time

			// Event should be `ok` at `at` for `i` times
			i int
		}

		type testCase struct {
			cfg  conf.Rate
			now  time.Time
			evts []event
		}
		cases := []testCase{
			{
				cfg: conf.Rate{Events: 20, OverTime: time.Second * 20},
				now: now,
				evts: []event{
					// initial burst of 20 is permitted
					{true, now, 19},

					// then denied, even at same time
					{false, now, 100},

					// and continue to deny until the next generated token
					{false, now.Add(time.Second), 100},
					{false, now.Add(time.Second * 19), 100},

					// allows a single call to allow at 20 seconds
					{true, now.Add(time.Second * 20), 0},

					// then denied
					{false, now.Add(time.Second * 20), 100},

					// and the pattern repeats
					{true, now.Add(time.Second * 40), 0},
					{false, now.Add(time.Second * 40), 100},
					{false, now.Add(time.Second * 59), 100},

					{true, now.Add(time.Second * 60), 0},
					{false, now.Add(time.Second * 60), 100},
					{false, now.Add(time.Second * 79), 100},

					{true, now.Add(time.Second * 80), 0},
					{false, now.Add(time.Second * 80), 100},
					{false, now.Add(time.Second * 99), 100},

					// allow tokens to be built up still
					{true, now.Add(time.Hour), 19},
				},
			},

			{
				cfg: conf.Rate{Events: 1, OverTime: time.Second * 20},
				now: now,
				evts: []event{
					// initial burst of 1 is permitted
					{true, now, 0},

					// then denied, even at same time
					{false, now, 100},

					// and continue to deny until the next generated token
					{false, now.Add(time.Second), 100},
					{false, now.Add(time.Second * 19), 100},

					// allows a single call to allow at 20 seconds
					{true, now.Add(time.Second * 20), 0},

					// then denied
					{false, now.Add(time.Second * 20), 100},

					// and the pattern repeats
					{true, now.Add(time.Second * 40), 0},
					{false, now.Add(time.Second * 40), 100},
					{false, now.Add(time.Second * 59), 100},

					{true, now.Add(time.Second * 60), 0},
					{false, now.Add(time.Second * 60), 100},
					{false, now.Add(time.Second * 79), 100},

					{true, now.Add(time.Second * 80), 0},
					{false, now.Add(time.Second * 80), 100},
					{false, now.Add(time.Second * 99), 100},
				},
			},

			// 1 event per second
			{
				cfg: conf.Rate{Events: 1, OverTime: time.Second},
				now: now,
				evts: []event{
					{true, now, 0},
					{true, now.Add(time.Second), 0},
					{false, now.Add(time.Second), 0},
					{true, now.Add(time.Second * 2), 0},
				},
			},

			// 1 events per second and OverTime = 1 event per hour.
			{
				cfg: conf.Rate{Events: 1, OverTime: 0},
				now: now,
				evts: []event{
					{true, now, 0},
					{false, now.Add(time.Hour - time.Second), 0},
					{true, now.Add(time.Hour), 0},
					{true, now.Add(time.Hour * 2), 0},
				},
			},

			// zero value for Events = 0 event per second
			{
				cfg: conf.Rate{Events: 0, OverTime: time.Second},
				now: now,
				evts: []event{
					{false, now, 0},
					{false, now.Add(-time.Second), 0},
					{false, now.Add(time.Second), 0},
					{false, now.Add(time.Second * 2), 0},
				},
			},

			// zero value for both Events and OverTime = 1 event per hour.
			{
				cfg: conf.Rate{Events: 0, OverTime: 0},
				now: now,
				evts: []event{
					{false, now, 0},
					{false, now.Add(time.Hour - time.Second), 0},
					{false, now.Add(-time.Hour), 0},
					{false, now.Add(time.Hour), 0},
					{false, now.Add(time.Hour * 2), 0},
				},
			},
		}

		for _, tc := range cases {
			rl := NewBurstLimiter(tc.cfg)
			for _, evt := range tc.evts {
				for i := 0; i <= evt.i; i++ {
					if exp, got := evt.ok, rl.AllowAt(evt.at); exp != got {
						t.Fatalf("exp AllowAt(%v) to be %v; got %v", evt.at, exp, got)
					}
				}
			}
		}
	})
}
