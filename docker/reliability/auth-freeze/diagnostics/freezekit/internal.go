package freezekit

import (
	"encoding/json"
	"io"
	mrand "math/rand/v2"
	"sync/atomic"
)

// globalRand is the package-wide pseudo-random source used for
// probabilistic sampling. math/rand/v2's ChaCha8 is goroutine-safe.
var globalRand = mrand.New(mrand.NewPCG(0xfeed_face_dead_beef, 0xc0de_cafe_1234_5678))

// writeJSON marshals v as compact JSON and writes it to w. Errors
// from w are swallowed (we are typically writing to an http.ResponseWriter
// and the framework will log).
func writeJSON(w io.Writer, v any) error {
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	return enc.Encode(v)
}

// State is the public freeze-detection state. It is also surfaced
// via the freezekit_state metric.
type State int32

const (
	StateNormal State = iota
	StateWarning
	StateDegraded
	StateFreezeDetected
	StateCaptureComplete
)

// String returns the upper-snake-case label matching the design doc.
func (s State) String() string {
	switch s {
	case StateNormal:
		return "NORMAL"
	case StateWarning:
		return "WARNING"
	case StateDegraded:
		return "DEGRADED"
	case StateFreezeDetected:
		return "FREEZE_DETECTED"
	case StateCaptureComplete:
		return "CAPTURE_COMPLETE"
	default:
		return "UNKNOWN"
	}
}

// DBPoolStats is what [Manager.SetDBPoolStatsFunc]'s callback must
// return. The fields mirror the documented subset of database/sql.DBStats.
type DBPoolStats struct {
	InUse          int
	Idle           int
	Max            int
	WaitCount      int64
	WaitDurationMS int64
}

// atomicState wraps a State in an atomic.Int32 for the detector.
type atomicState struct{ v atomic.Int32 }

func (a *atomicState) load() State          { return State(a.v.Load()) }
func (a *atomicState) store(s State)        { a.v.Store(int32(s)) }
func (a *atomicState) cas(old, new State) bool {
	return a.v.CompareAndSwap(int32(old), int32(new))
}
