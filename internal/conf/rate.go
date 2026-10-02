package conf

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

const defaultOverTime = time.Hour

const (
	BurstRateType    = "burst"
	IntervalRateType = "interval"
)

type Rate struct {
	Events   float64       `json:"events,omitempty"`
	OverTime time.Duration `json:"over_time,omitempty"`
	typ      string        `json:"-"`
	val      string        `json:"-"`
}

func (r *Rate) GetRateType() string {
	if r.typ == "" {
		return IntervalRateType
	}
	return r.typ
}

// Decode is used by envconfig to parse the env-config string to a Rate value.
func (r *Rate) Decode(value string) error {
	if f, err := strconv.ParseFloat(value, 64); err == nil {
		r.typ = IntervalRateType
		r.val = value
		r.Events = f
		r.OverTime = defaultOverTime
		return nil
	}
	parts := strings.Split(value, "/")
	if len(parts) != 2 {
		return fmt.Errorf("rate: value does not match rate syntax %q", value)
	}

	// 52 because the uint needs to fit in a float64
	e, err := strconv.ParseUint(parts[0], 10, 52)
	if err != nil {
		return fmt.Errorf("rate: events part of rate value %q failed to parse as uint64: %w", value, err)
	}

	d, err := time.ParseDuration(parts[1])
	if err != nil {
		return fmt.Errorf("rate: over-time part of rate value %q failed to parse as duration: %w", value, err)
	}

	r.typ = BurstRateType
	r.Events = float64(e)
	r.OverTime = d
	r.val = value
	return nil
}

func (r Rate) GetRateValue() string { return r.val }

func (r *Rate) String() string {
	if r.OverTime == 0 {
		return fmt.Sprintf("%f", r.Events)
	}
	return fmt.Sprintf("%d/%s", uint64(r.Events), r.OverTime.String())
}
