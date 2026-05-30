package freezekit

import (
	"os"
	"runtime"
	"runtime/metrics"
	"strconv"
	"strings"
	"time"
)

// RuntimeSnapshot is the full /runtime/metrics dump captured during
// a freeze. It's serialised as JSON into a `metrics.json.gz` artifact.
//
// We capture EVERY exposed metric (not just a curated subset) because
// the cost is negligible (~5KB serialised) and we don't want to
// realise a year from now that the missing metric was the one we
// needed.
type RuntimeSnapshot struct {
	CapturedAt time.Time      `json:"captured_at"`
	GoVersion  string         `json:"go_version"`
	GOMAXPROCS int            `json:"gomaxprocs"`
	NumCPU     int            `json:"num_cpu"`
	Metrics    map[string]any `json:"metrics"`
	MemStats   memStatsLite   `json:"memstats"`
	RSSBytes   uint64         `json:"rss_bytes,omitempty"`
}

// memStatsLite is a tiny subset of runtime.MemStats — enough to do
// quick math (heap size, GC frequency) without bloating the JSON.
type memStatsLite struct {
	HeapAllocBytes      uint64  `json:"heap_alloc_bytes"`
	HeapInUseBytes      uint64  `json:"heap_in_use_bytes"`
	HeapObjects         uint64  `json:"heap_objects"`
	StackInUseBytes     uint64  `json:"stack_in_use_bytes"`
	SysBytes            uint64  `json:"sys_bytes"`
	NextGCBytes         uint64  `json:"next_gc_bytes"`
	NumGC               uint32  `json:"num_gc"`
	PauseTotalSeconds   float64 `json:"pause_total_seconds"`
	GCCPUFraction       float64 `json:"gc_cpu_fraction"`
}

// captureRuntimeSnapshot is the cheap (~1ms) full snapshot.
func captureRuntimeSnapshot() RuntimeSnapshot {
	descs := metrics.All()
	samples := make([]metrics.Sample, len(descs))
	for i, d := range descs {
		samples[i].Name = d.Name
	}
	metrics.Read(samples)

	out := RuntimeSnapshot{
		CapturedAt: time.Now(),
		GoVersion:  runtime.Version(),
		GOMAXPROCS: runtime.GOMAXPROCS(0),
		NumCPU:     runtime.NumCPU(),
		Metrics:    make(map[string]any, len(samples)),
	}
	for _, s := range samples {
		out.Metrics[s.Name] = encodeMetricValue(s.Value)
	}

	var ms runtime.MemStats
	runtime.ReadMemStats(&ms)
	out.MemStats = memStatsLite{
		HeapAllocBytes:      ms.HeapAlloc,
		HeapInUseBytes:      ms.HeapInuse,
		HeapObjects:         ms.HeapObjects,
		StackInUseBytes:     ms.StackInuse,
		SysBytes:            ms.Sys,
		NextGCBytes:         ms.NextGC,
		NumGC:               ms.NumGC,
		PauseTotalSeconds:   float64(ms.PauseTotalNs) / 1e9,
		GCCPUFraction:       ms.GCCPUFraction,
	}
	if rss := rssBytes(); rss > 0 {
		out.RSSBytes = rss
	}
	return out
}

// encodeMetricValue maps a metrics.Value into a JSON-friendly type.
func encodeMetricValue(v metrics.Value) any {
	switch v.Kind() {
	case metrics.KindUint64:
		return v.Uint64()
	case metrics.KindFloat64:
		return v.Float64()
	case metrics.KindFloat64Histogram:
		h := v.Float64Histogram()
		return map[string]any{
			"buckets": h.Buckets,
			"counts":  h.Counts,
		}
	case metrics.KindBad:
		return nil
	default:
		return nil
	}
}

// rssBytes returns the resident-set-size of the current process in
// bytes. Linux-only via /proc/self/status; returns 0 on other OSes.
//
// This is intentionally NOT a syscall (and intentionally NOT cgo) so
// that we cannot accidentally block on a kernel call that's in the
// same "stuck" state as the rest of the process.
func rssBytes() uint64 {
	b, err := os.ReadFile("/proc/self/status")
	if err != nil {
		return 0
	}
	for _, line := range strings.Split(string(b), "\n") {
		if !strings.HasPrefix(line, "VmRSS:") {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) < 3 {
			return 0
		}
		n, err := strconv.ParseUint(fields[1], 10, 64)
		if err != nil {
			return 0
		}
		unit := strings.ToLower(fields[2])
		switch unit {
		case "kb":
			return n * 1024
		case "mb":
			return n * 1024 * 1024
		default:
			return n
		}
	}
	return 0
}

