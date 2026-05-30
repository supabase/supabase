package freezekit

import (
	"fmt"
	"io"
	"math"
	"net/http"
	"runtime"
	"sort"
	"sync"
	"sync/atomic"
)

// managerMetrics is the freezekit metric set. It exposes a private
// Prometheus-text /metrics handler via [Manager.MetricsHandler] but
// is also embeddable into a host registry (see [Manager.RegisterWith]).
//
// We deliberately avoid a hard dependency on github.com/prometheus/client_golang
// so freezekit stays stdlib-only. If a host application uses
// client_golang it can shadow these metrics via a small adapter; the
// metric NAMES are stable.
type managerMetrics struct {
	// Gauges
	state         *fkGauge
	inflight      *fkGauge
	oldestSecs    *fkGauge
	signalScore   *fkLabeledGauge
	localDisk     *fkGauge

	// Counters
	freezeEvents    *fkCounter
	capturesStart   *fkLabeledCounter
	capturesEnd     *fkLabeledCounter
	dropped         *fkLabeledCounter
	sinkUploads     *fkLabeledCounter
	selfStall       *fkCounter
	panics          *fkLabeledCounter
	localEvictions  *fkCounter

	// Histograms
	captureDuration *fkHistogram
	uploadDuration  *fkLabeledHistogram
	artifactBytes   *fkLabeledHistogram

	// Other internal state
	disabled atomic.Bool

	registered []metricExport
}

func newManagerMetrics() *managerMetrics {
	m := &managerMetrics{
		state:           newGauge("freezekit_state", "Detector state: 0=NORMAL 1=WARNING 2=DEGRADED 3=FREEZE_DETECTED 4=CAPTURE_COMPLETE"),
		inflight:        newGauge("freezekit_inflight", "Current in-flight HTTP requests."),
		oldestSecs:      newGauge("freezekit_oldest_inflight_seconds", "Age of the longest-running in-flight request."),
		signalScore:     newLabeledGauge("freezekit_signal_score", "Latest score per signal.", "signal"),
		localDisk:       newGauge("freezekit_local_disk_used_bytes", "Bytes used by the LocalSink (if any)."),

		freezeEvents:    newCounter("freezekit_freeze_events_total", "FREEZE_DETECTED → CAPTURE_COMPLETE transitions."),
		capturesStart:   newLabeledCounter("freezekit_captures_started_total", "Captures started by trigger.", "trigger"),
		capturesEnd:     newLabeledCounter("freezekit_captures_completed_total", "Captures completed by result.", "result"),
		dropped:         newLabeledCounter("freezekit_artifacts_dropped_total", "Captures or artifacts dropped by reason.", "reason"),
		sinkUploads:     newLabeledCounter("freezekit_sink_uploads_total", "Sink upload attempts by sink and result.", "sink", "result"),
		selfStall:       newCounter("freezekit_self_stall_total", "Self-watchdog trips."),
		panics:          newLabeledCounter("freezekit_panics_recovered_total", "Panics recovered in freezekit goroutines.", "goroutine"),
		localEvictions:  newCounter("freezekit_local_disk_evictions_total", "LRU evictions in the LocalSink."),

		captureDuration: newHistogram("freezekit_capture_duration_seconds", "End-to-end capture duration."),
		uploadDuration:  newLabeledHistogram("freezekit_sink_upload_duration_seconds", "Per-attempt upload duration.", "sink"),
		artifactBytes:   newLabeledHistogram("freezekit_artifact_bytes", "Per-artifact size in bytes.", "artifact"),
	}
	m.registered = []metricExport{
		m.state, m.inflight, m.oldestSecs, m.signalScore, m.localDisk,
		m.freezeEvents, m.capturesStart, m.capturesEnd, m.dropped,
		m.sinkUploads, m.selfStall, m.panics, m.localEvictions,
		m.captureDuration, m.uploadDuration, m.artifactBytes,
	}
	return m
}

// MetricsHandler returns an http.Handler that serves the freezekit
// metrics in Prometheus text-exposition format. If the host already
// has a /metrics endpoint, mount this under a different path, e.g.:
//
//	mux.Handle("/metrics/freezekit", fk.MetricsHandler())
func (m *Manager) MetricsHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
		writeMetrics(w, m.metrics)
		// Also include a couple of runtime gauges that pair with
		// freezekit signals (cheap; readers expect them).
		fmt.Fprintf(w, "# HELP go_goroutines Number of goroutines.\n")
		fmt.Fprintf(w, "# TYPE go_goroutines gauge\n")
		fmt.Fprintf(w, "go_goroutines %d\n", runtime.NumGoroutine())
	})
}

// MetricSnapshot returns every metric's current value. Mainly for
// tests; callers can also scrape /metrics.
func (m *Manager) MetricSnapshot() map[string]float64 {
	out := map[string]float64{}
	for _, mx := range m.metrics.registered {
		for _, sample := range mx.samples() {
			out[sample.line()] = sample.value
		}
	}
	return out
}

// ----------------------------------------------------------------------------
// Internal mini-registry
// ----------------------------------------------------------------------------

type metricSample struct {
	name   string
	labels []string // alternating k,v pairs
	value  float64
	bucket string // for histogram, the "le" or "" for sum/count
	mType  string // "gauge", "counter", "histogram_bucket", "histogram_sum", "histogram_count"
}

func (s metricSample) line() string {
	if len(s.labels) == 0 {
		return s.name
	}
	out := s.name + "{"
	for i := 0; i < len(s.labels); i += 2 {
		if i > 0 {
			out += ","
		}
		out += s.labels[i] + "=\"" + s.labels[i+1] + "\""
	}
	out += "}"
	return out
}

type metricExport interface {
	help() string
	mtype() string
	mname() string
	samples() []metricSample
}

func writeMetrics(w io.Writer, m *managerMetrics) {
	xs := make([]metricExport, len(m.registered))
	copy(xs, m.registered)
	sort.Slice(xs, func(i, j int) bool { return xs[i].mname() < xs[j].mname() })
	for _, x := range xs {
		fmt.Fprintf(w, "# HELP %s %s\n# TYPE %s %s\n", x.mname(), x.help(), x.mname(), x.mtype())
		for _, s := range x.samples() {
			fmt.Fprintf(w, "%s %g\n", s.line(), s.value)
		}
	}
}

// -- Gauge ---------------------------------------------------------

type fkGauge struct {
	name, helpStr string
	v             atomic.Uint64 // float64 bits
}

func newGauge(name, help string) *fkGauge {
	return &fkGauge{name: name, helpStr: help}
}

func (g *fkGauge) set(v float64) { g.v.Store(uint64bitsForFloat(v)) }
func (g *fkGauge) get() float64  { return floatForUint64Bits(g.v.Load()) }
func (g *fkGauge) help() string  { return g.helpStr }
func (g *fkGauge) mtype() string { return "gauge" }
func (g *fkGauge) mname() string { return g.name }
func (g *fkGauge) samples() []metricSample {
	return []metricSample{{name: g.name, value: g.get(), mType: "gauge"}}
}

// -- LabeledGauge --------------------------------------------------

type fkLabeledGauge struct {
	name, helpStr string
	keys          []string
	mu            sync.RWMutex
	vals          map[string]float64
}

func newLabeledGauge(name, help string, keys ...string) *fkLabeledGauge {
	return &fkLabeledGauge{name: name, helpStr: help, keys: keys, vals: map[string]float64{}}
}

func (g *fkLabeledGauge) set(labels map[string]string, v float64) {
	k := labelKey(g.keys, labels)
	g.mu.Lock()
	g.vals[k] = v
	g.mu.Unlock()
}

func (g *fkLabeledGauge) help() string  { return g.helpStr }
func (g *fkLabeledGauge) mtype() string { return "gauge" }
func (g *fkLabeledGauge) mname() string { return g.name }
func (g *fkLabeledGauge) samples() []metricSample {
	g.mu.RLock()
	defer g.mu.RUnlock()
	out := make([]metricSample, 0, len(g.vals))
	for k, v := range g.vals {
		out = append(out, metricSample{name: g.name, labels: splitLabelKey(k), value: v, mType: "gauge"})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].line() < out[j].line() })
	return out
}

// -- Counter -------------------------------------------------------

type fkCounter struct {
	name, helpStr string
	v             atomic.Uint64
}

func newCounter(name, help string) *fkCounter {
	return &fkCounter{name: name, helpStr: help}
}

func (c *fkCounter) add(delta uint64) { c.v.Add(delta) }
func (c *fkCounter) help() string     { return c.helpStr }
func (c *fkCounter) mtype() string    { return "counter" }
func (c *fkCounter) mname() string    { return c.name }
func (c *fkCounter) samples() []metricSample {
	return []metricSample{{name: c.name, value: float64(c.v.Load()), mType: "counter"}}
}

// -- LabeledCounter ------------------------------------------------

type fkLabeledCounter struct {
	name, helpStr string
	keys          []string
	mu            sync.RWMutex
	vals          map[string]*uint64
}

func newLabeledCounter(name, help string, keys ...string) *fkLabeledCounter {
	return &fkLabeledCounter{name: name, helpStr: help, keys: keys, vals: map[string]*uint64{}}
}

// add accepts either a single label (positional first label) or a map.
func (c *fkLabeledCounter) add(labels any, delta uint64) {
	var k string
	switch v := labels.(type) {
	case string:
		k = labelKey(c.keys, map[string]string{c.keys[0]: v})
	case map[string]string:
		k = labelKey(c.keys, v)
	default:
		return
	}
	c.mu.Lock()
	p, ok := c.vals[k]
	if !ok {
		var z uint64
		p = &z
		c.vals[k] = p
	}
	c.mu.Unlock()
	atomic.AddUint64(p, delta)
}

func (c *fkLabeledCounter) help() string  { return c.helpStr }
func (c *fkLabeledCounter) mtype() string { return "counter" }
func (c *fkLabeledCounter) mname() string { return c.name }
func (c *fkLabeledCounter) samples() []metricSample {
	c.mu.RLock()
	defer c.mu.RUnlock()
	out := make([]metricSample, 0, len(c.vals))
	for k, p := range c.vals {
		out = append(out, metricSample{name: c.name, labels: splitLabelKey(k), value: float64(atomic.LoadUint64(p)), mType: "counter"})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].line() < out[j].line() })
	return out
}

// -- Histogram (fixed buckets suitable for sub-second to multi-minute) ----

var histBuckets = []float64{
	0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5,
	1, 2.5, 5, 10, 30, 60, 120, 300,
}

type fkHistogram struct {
	name, helpStr string
	mu            sync.Mutex
	counts        []uint64
	sum           float64
	count         uint64
}

func newHistogram(name, help string) *fkHistogram {
	return &fkHistogram{name: name, helpStr: help, counts: make([]uint64, len(histBuckets))}
}

func (h *fkHistogram) observe(v float64) {
	h.mu.Lock()
	h.sum += v
	h.count++
	for i, b := range histBuckets {
		if v <= b {
			h.counts[i]++
		}
	}
	h.mu.Unlock()
}

func (h *fkHistogram) help() string  { return h.helpStr }
func (h *fkHistogram) mtype() string { return "histogram" }
func (h *fkHistogram) mname() string { return h.name }
func (h *fkHistogram) samples() []metricSample {
	h.mu.Lock()
	defer h.mu.Unlock()
	out := make([]metricSample, 0, len(histBuckets)+3)
	for i, b := range histBuckets {
		out = append(out, metricSample{
			name:   h.name + "_bucket",
			labels: []string{"le", fmt.Sprintf("%g", b)},
			value:  float64(h.counts[i]),
		})
	}
	out = append(out, metricSample{
		name:   h.name + "_bucket",
		labels: []string{"le", "+Inf"},
		value:  float64(h.count),
	})
	out = append(out, metricSample{name: h.name + "_sum", value: h.sum})
	out = append(out, metricSample{name: h.name + "_count", value: float64(h.count)})
	return out
}

// -- LabeledHistogram ----------------------------------------------

type fkLabeledHistogram struct {
	name, helpStr string
	keys          []string
	mu            sync.Mutex
	series        map[string]*fkHistogram
}

func newLabeledHistogram(name, help string, keys ...string) *fkLabeledHistogram {
	return &fkLabeledHistogram{name: name, helpStr: help, keys: keys, series: map[string]*fkHistogram{}}
}

func (h *fkLabeledHistogram) observe(labels map[string]string, v float64) {
	k := labelKey(h.keys, labels)
	h.mu.Lock()
	s, ok := h.series[k]
	if !ok {
		s = newHistogram(h.name, h.helpStr)
		h.series[k] = s
	}
	h.mu.Unlock()
	s.observe(v)
}

func (h *fkLabeledHistogram) help() string  { return h.helpStr }
func (h *fkLabeledHistogram) mtype() string { return "histogram" }
func (h *fkLabeledHistogram) mname() string { return h.name }
func (h *fkLabeledHistogram) samples() []metricSample {
	h.mu.Lock()
	defer h.mu.Unlock()
	out := []metricSample{}
	keys := make([]string, 0, len(h.series))
	for k := range h.series {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		s := h.series[k]
		labelPairs := splitLabelKey(k)
		for _, samp := range s.samples() {
			samp.labels = append(labelPairs, samp.labels...)
			out = append(out, samp)
		}
	}
	return out
}

// ----------------------------------------------------------------------------
// Internal helpers
// ----------------------------------------------------------------------------

func labelKey(keys []string, labels map[string]string) string {
	out := ""
	for _, k := range keys {
		if out != "" {
			out += "|"
		}
		out += k + "=" + labels[k]
	}
	return out
}

func splitLabelKey(k string) []string {
	if k == "" {
		return nil
	}
	// Format: "k1=v1|k2=v2"
	out := []string{}
	start := 0
	for i := 0; i <= len(k); i++ {
		if i == len(k) || k[i] == '|' {
			seg := k[start:i]
			eq := -1
			for j := 0; j < len(seg); j++ {
				if seg[j] == '=' {
					eq = j
					break
				}
			}
			if eq > 0 {
				out = append(out, seg[:eq], seg[eq+1:])
			}
			start = i + 1
		}
	}
	return out
}

func uint64bitsForFloat(f float64) uint64 { return math.Float64bits(f) }
func floatForUint64Bits(u uint64) float64  { return math.Float64frombits(u) }
