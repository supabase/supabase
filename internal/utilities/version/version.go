package version

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"

	"github.com/Masterminds/semver/v3"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/metric"
)

func InitVersionMetrics(ctx context.Context, ver string) error {
	vi, err := parseSemver(ver)
	if err != nil {
		const msg = "initVersionMetrics: unable to parse version %q: %w"
		return fmt.Errorf(msg, ver, err)
	}

	if err := initMetrics(ctx, vi); err != nil {
		const msg = "initVersionMetrics: unable to initialize version %q: %w"
		return fmt.Errorf(msg, ver, err)
	}
	return nil
}

func initGauge(
	ctx context.Context,
	typ string,
	val uint64,
	gaugeFunc initGaugeFunc,
) error {
	name := fmt.Sprintf("global_auth_version_%v", typ)
	desc := fmt.Sprintf("Set to this auth servers %v version number.", typ)

	g, err := gaugeFunc(name, metric.WithDescription(desc))
	if err != nil {
		const msg = "initGauge: part %q (%v) otel error: %w"
		return fmt.Errorf(msg, typ, val, err)
	}
	if val > math.MaxInt64 {
		const msg = "initGauge: part %q (%v) value > math.MaxInt64"
		return fmt.Errorf(msg, typ, val)
	}

	g.Record(ctx, int64(val))
	return nil
}

type initGaugeFunc func(
	name string,
	options ...metric.Int64GaugeOption,
) (metric.Int64Gauge, error)

func initGaugeOtel(name string, options ...metric.Int64GaugeOption) (metric.Int64Gauge, error) {
	return otel.Meter("gotrue").Int64Gauge(name, options...)
}

func initMetrics(ctx context.Context, vi *versionInfo) error {
	return errors.Join(
		initGauge(ctx, "major", vi.Major, initGaugeOtel),
		initGauge(ctx, "minor", vi.Minor, initGaugeOtel),
		initGauge(ctx, "patch", vi.Patch, initGaugeOtel),
		initGauge(ctx, "rc", vi.RC, initGaugeOtel),
	)
}

type versionInfo struct {
	Original string
	Major    uint64
	Minor    uint64
	Patch    uint64
	RC       uint64
}

func parseSemver(ver string) (*versionInfo, error) {
	vi := &versionInfo{
		Original: ver,
	}
	if ver == "" {
		ver = "0.0.0-unknown"
	}

	ver = normalizeVersion(ver)
	sv, err := semver.NewVersion(ver)
	if err != nil {
		return nil, err
	}

	pre := sv.Prerelease()
	if strings.HasPrefix(pre, "rc") {
		pre = strings.TrimPrefix(pre, "rc.")
		pre = strings.TrimPrefix(pre, "rc-")
		pre = strings.TrimPrefix(pre, "rc")
		if i := strings.IndexByte(pre, '-'); i >= 0 {
			pre = pre[:i]
		}
		if i := strings.IndexByte(pre, '.'); i >= 0 {
			pre = pre[:i]
		}

		rc, err := strconv.ParseUint(pre, 10, 64)
		if err == nil {
			vi.RC = rc
		}
	}

	vi.Major = sv.Major()
	vi.Minor = sv.Minor()
	vi.Patch = sv.Patch()
	return vi, nil
}

func normalizeVersion(ver string) string {
	ver = strings.TrimSpace(ver)
	if strings.HasPrefix(ver, "v") {
		return ver
	}
	if strings.HasPrefix(ver, "rc") {
		return "v" + ver[2:]
	}
	return "v" + ver
}
