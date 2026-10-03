package version

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"go.opentelemetry.io/otel/metric"
)

func TestVersionInitVersionMetrics(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	check := func(vi *versionInfo) {
		if exp, got := uint64(2), vi.Major; exp != got {
			t.Fatalf("exp Major version %v; got %v", exp, got)
		}
		if exp, got := uint64(187), vi.Minor; exp != got {
			t.Fatalf("exp Minor version %v; got %v", exp, got)
		}
		if exp, got := uint64(3), vi.Patch; exp != got {
			t.Fatalf("exp Patch version %v; got %v", exp, got)
		}
		if exp, got := uint64(23), vi.RC; exp != got {
			t.Fatalf("exp RC version %v; got %v", exp, got)
		}
	}

	const validVer = "rc2.187.3-rc.23-g33b87ae0"

	{
		vi, err := parseSemver(validVer)
		require.NoError(t, err)
		check(vi)
	}

	{
		err := InitVersionMetrics(ctx, validVer)
		require.NoError(t, err)
	}

	{
		err := InitVersionMetrics(ctx, "invalid")
		require.Error(t, err)
		const exp = "initVersionMetrics: unable to parse version"
		if got := err.Error(); !strings.Contains(got, exp) {
			t.Fatalf("exp err %q to contain %q", got, exp)
		}
	}

	{
		max := strconv.AppendUint(nil, math.MaxUint64, 10)
		ver := fmt.Sprintf("%v.%v.%s", 2, 187, max)
		err := InitVersionMetrics(ctx, ver)
		require.Error(t, err)
		if exp, got := "math.MaxInt64", err.Error(); !strings.Contains(got, exp) {
			t.Fatalf("exp err %q to contain %q", got, exp)
		}
	}

	{
		sentinel := errors.New("otel-sentinel")
		errFn := func(name string, options ...metric.Int64GaugeOption) (metric.Int64Gauge, error) {
			return nil, sentinel
		}

		err := initGauge(ctx, "metric", 1, errFn)
		require.Error(t, err)
		if exp, got := sentinel.Error(), err.Error(); !strings.Contains(got, exp) {
			t.Fatalf("exp err %q to contain %q", got, exp)
		}
	}
}

func TestVersionParseSemver(t *testing.T) {
	cases := []struct {
		str, err          string
		maj, min, pat, rc uint64
	}{
		{str: "2.187.3-rc.2-g33b87ae0", maj: 2, min: 187, pat: 3, rc: 2},
		{str: "2.187.3-rc-2-g33b87ae0", maj: 2, min: 187, pat: 3, rc: 2},
		{str: "2.187.3-rc2-g33b87ae0", maj: 2, min: 187, pat: 3, rc: 2},
		{str: "v2.187.3-rc.2-g33b87ae0", maj: 2, min: 187, pat: 3, rc: 2},
		{str: "v2.187.3-rc-2-g33b87ae0", maj: 2, min: 187, pat: 3, rc: 2},
		{str: "v2.187.3-rc2-g33b87ae0", maj: 2, min: 187, pat: 3, rc: 2},
		{str: "rc2.187.3-rc.2-g33b87ae0", maj: 2, min: 187, pat: 3, rc: 2},
		{str: "rc2.187.3-rc-2-g33b87ae0", maj: 2, min: 187, pat: 3, rc: 2},
		{str: "rc2.187.3-rc2-g33b87ae0", maj: 2, min: 187, pat: 3, rc: 2},

		{str: "2.187.3-rc.2-", maj: 2, min: 187, pat: 3, rc: 2},
		{str: "2.187.3-rc-2", maj: 2, min: 187, pat: 3, rc: 2},
		{str: "2.187.3-rc2", maj: 2, min: 187, pat: 3, rc: 2},
		{str: "v2.187.3-rc.2", maj: 2, min: 187, pat: 3, rc: 2},
		{str: "v2.187.3-rc-2", maj: 2, min: 187, pat: 3, rc: 2},
		{str: "v2.187.3-rc2", maj: 2, min: 187, pat: 3, rc: 2},
		{str: "rc2.187.3-rc.2", maj: 2, min: 187, pat: 3, rc: 2},
		{str: "rc2.187.3-rc-2", maj: 2, min: 187, pat: 3, rc: 2},
		{str: "rc2.187.3-rc2", maj: 2, min: 187, pat: 3, rc: 2},

		{str: "2.187.3-rc.31", maj: 2, min: 187, pat: 3, rc: 31},
		{str: "2.187.3-rc-31", maj: 2, min: 187, pat: 3, rc: 31},
		{str: "2.187.3-rc31", maj: 2, min: 187, pat: 3, rc: 31},
		{str: "v2.187.3-rc.31", maj: 2, min: 187, pat: 3, rc: 31},
		{str: "v2.187.3-rc-31", maj: 2, min: 187, pat: 3, rc: 31},
		{str: "v2.187.3-rc31", maj: 2, min: 187, pat: 3, rc: 31},
		{str: "rc2.187.3-rc.31", maj: 2, min: 187, pat: 3, rc: 31},
		{str: "rc2.187.3-rc-31", maj: 2, min: 187, pat: 3, rc: 31},
		{str: "rc2.187.3-rc31", maj: 2, min: 187, pat: 3, rc: 31},

		{str: "v2.187.3", maj: 2, min: 187, pat: 3, rc: 0},
		{str: "v2.187.3", maj: 2, min: 187, pat: 3, rc: 0},

		{str: "v2.187.0", maj: 2, min: 187, pat: 0, rc: 0},
		{str: "v2.187.0", maj: 2, min: 187, pat: 0, rc: 0},

		{str: "0.0.0", maj: 0, min: 0, pat: 0},
		{str: "0.0.0", maj: 0, min: 0, pat: 0},

		{str: "0.0.0", maj: 0, min: 0, pat: 0},
		{str: "0.0.1", maj: 0, min: 0, pat: 1},
		{str: "0.1.1", maj: 0, min: 1, pat: 1},
		{str: "1.1.1", maj: 1, min: 1, pat: 1},

		{str: "0.0.100", maj: 0, min: 0, pat: 100},
		{str: "0.100.100", maj: 0, min: 100, pat: 100},
		{str: "100.100.100", maj: 100, min: 100, pat: 100},

		{str: "1", maj: 1, min: 0, pat: 0},
		{str: "1.0", maj: 1, min: 0, pat: 0},
		{str: "1.0.0", maj: 1, min: 0, pat: 0},

		{str: "2.165", maj: 2, min: 165, pat: 0},
		{str: "2.165.0", maj: 2, min: 165, pat: 0},
		{str: "2.165.1", maj: 2, min: 165, pat: 1},
		{str: "2.165.1-rc.1", maj: 2, min: 165, pat: 1, rc: 1},
		{str: "2.165.1-rc1", maj: 2, min: 165, pat: 1, rc: 1},

		{str: "2.165.1-rc.1.5", maj: 2, min: 165, pat: 1, rc: 1},
		{str: "2.165.1-rc1.5", maj: 2, min: 165, pat: 1, rc: 1},
		{str: "", maj: 0, min: 0, pat: 0, rc: 0},

		{str: "abc", err: "Invalid Semantic Version"},
	}

	for idx, tc := range cases {
		t.Logf("tc #%v - exp %v to parse as %v.%v.%v (err: %q)",
			idx, tc.str, tc.maj, tc.min, tc.pat, tc.err)

		check := func(vi *versionInfo) {
			if exp, got := tc.maj, vi.Major; exp != got {
				t.Fatalf("exp Major version %v; got %v", exp, got)
			}
			if exp, got := tc.min, vi.Minor; exp != got {
				t.Fatalf("exp Minor version %v; got %v", exp, got)
			}
			if exp, got := tc.pat, vi.Patch; exp != got {
				t.Fatalf("exp Patch version %v; got %v", exp, got)
			}
			if exp, got := tc.rc, vi.RC; exp != got {
				t.Fatalf("exp RC version %v; got %v", exp, got)
			}
		}

		vi, err := parseSemver(tc.str)
		if tc.err != "" {
			if err == nil {
				t.Fatal("exp non-nil err")
			}
			if exp, got := tc.err, err.Error(); !strings.Contains(got, exp) {
				t.Fatalf("exp err %q to contain %q", got, exp)
			}
			continue
		}
		if err != nil {
			t.Fatalf("exp nil err; got %v", err)
		}
		check(vi)
	}
}
