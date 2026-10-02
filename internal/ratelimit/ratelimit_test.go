package ratelimit

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/conf"
)

func TestNew(t *testing.T) {
	fromRateStr := func(rateStr string) Limiter {
		var r conf.Rate
		err := r.Decode(rateStr)
		if err != nil {
			t.Fatalf("exp nil err; got %v", err)
		}
		return New(r)
	}

	// Limits & Burst equality
	tests := []struct {
		from string
		str  string
	}{
		{
			from: "13.5",
			str:  "IntervalLimiter",
		},
		{
			from: "3600",
			str:  "IntervalLimiter",
		},
		{
			from: "0",
			str:  "IntervalLimiter",
		},
		{
			from: "10/1s",
			str:  "BurstLimiter",
		},
		{
			from: "1/1h",
			str:  "BurstLimiter",
		},
		{
			from: "0/1s",
			str:  "BurstLimiter",
		},
	}

	for idx, test := range tests {
		t.Logf("test #%d from %v exp String(%q)",
			idx+1, test.from, test.str)
		rl := fromRateStr(test.from)
		require.Equal(t, test.str, fmt.Sprint(rl))
		require.True(t, Equal(rl, fromRateStr(test.from)),
			"rate should be equal to itself")
		require.True(t, Equal(rl, fromRateStr(test.from).Config()),
			"rate should be equal to it's own config")

		for _, t2 := range tests {
			if test.from == t2.from {
				continue
			}
			require.False(t, Equal(rl, fromRateStr(t2.from)),
				"%v should not be equal to %v", test.from, t2.from)
		}
	}

	{
		a := fromRateStr("3600/1h")
		cfg := a.Config()

		// To be extra careful for now I intentionally treat two rate limiters with
		// a different config value as inequal, even if they result in the same
		// underlying limiter.
		require.False(t, Equal(a, false))
		require.False(t, Equal(a, "1/1s"))
		require.False(t, Equal(a, fromRateStr("1/1s")))
		require.False(t, Equal(a, fromRateStr("60/1m")))
		require.False(t, Equal(a, "invalid"))
		require.False(t, Equal(a, nil))
		require.False(t, Equal(nil, a))

		// as a special case two nils returns false
		require.False(t, Equal(nil, nil))

		require.True(t, Equal(a, "3600/1h"))
		require.True(t, Equal(a, "3600/1h"))
		require.True(t, Equal(a, fromRateStr("3600/1h")))
		require.True(t, Equal(a, cfg))
		require.True(t, Equal(a, &cfg))
	}
}
