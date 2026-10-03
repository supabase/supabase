package conf

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestRateDecode(t *testing.T) {
	cases := []struct {
		str string
		exp Rate
		err string
	}{
		{str: "1800",
			exp: Rate{val: "1800", Events: 1800, OverTime: time.Hour, typ: IntervalRateType}},
		{str: "1800.0",
			exp: Rate{val: "1800.0", Events: 1800, OverTime: time.Hour, typ: IntervalRateType}},
		{str: "3600/1h",
			exp: Rate{val: "3600/1h", Events: 3600, OverTime: time.Hour, typ: BurstRateType}},
		{str: "3600/1h0m0s",
			exp: Rate{val: "3600/1h0m0s", Events: 3600, OverTime: time.Hour, typ: BurstRateType}},
		{str: "100/24h",
			exp: Rate{val: "100/24h", Events: 100, OverTime: time.Hour * 24, typ: BurstRateType}},
		{str: "", exp: Rate{},
			err: `rate: value does not match`},
		{str: "1h", exp: Rate{},
			err: `rate: value does not match`},
		{str: "/", exp: Rate{},
			err: `rate: events part of rate value`},
		{str: "/1h", exp: Rate{},
			err: `rate: events part of rate value`},
		{str: "3600.0/1h", exp: Rate{},
			err: `rate: events part of rate value "3600.0/1h" failed to parse`},
		{str: "100/", exp: Rate{},
			err: `rate: over-time part of rate value`},
		{str: "100/1", exp: Rate{},
			err: `rate: over-time part of rate value`},

		// zero events
		{str: "0/1h",
			exp: Rate{val: "0/1h", Events: 0, OverTime: time.Hour, typ: BurstRateType}},
		{str: "0/24h",
			exp: Rate{val: "0/24h", Events: 0, OverTime: time.Hour * 24, typ: BurstRateType}},
	}
	for idx, tc := range cases {
		t.Logf("test #%v - duration str %v", idx, tc.str)

		var r Rate
		err := r.Decode(tc.str)
		require.Equal(t, tc.exp, r) // verify don't mutate r on errr
		if tc.err != "" {
			require.Error(t, err)
			require.Contains(t, err.Error(), tc.err)
			continue
		}
		require.NoError(t, err)
		require.Equal(t, tc.exp, r)
		require.Equal(t, tc.exp.typ, r.GetRateType())
	}

	// GetRateType() zero value
	require.Equal(t, IntervalRateType, (&Rate{}).GetRateType())

	// String()
	require.Equal(t, "0.000000", (&Rate{}).String())
	require.Equal(t, "100/1h0m0s", (&Rate{Events: 100, OverTime: time.Hour}).String())
}
