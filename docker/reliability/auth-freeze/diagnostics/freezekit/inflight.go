package freezekit

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"sort"
	"sync"
	"sync/atomic"
	"time"
)

// requestIDKeyType is unexported so other packages can't accidentally
// clobber the context value.
type requestIDKeyType struct{}

// RequestIDKey is the context key under which the per-request
// correlation ID is stored. The middleware sets it; downstream
// handlers can read it via:
//
//	id, _ := r.Context().Value(freezekit.RequestIDKey).(string)
var RequestIDKey = requestIDKeyType{}

// InflightRequest is the row recorded by the in-flight tracker.
type InflightRequest struct {
	ID            string    `json:"id"`
	Route         string    `json:"route"`
	Method        string    `json:"method"`
	StartedAt     time.Time `json:"started_at"`
	AgeSeconds    float64   `json:"age_seconds"`
	TraceID       string    `json:"trace_id,omitempty"`
	UserID        string    `json:"user_id,omitempty"`
	ClientIPHash  string    `json:"client_ip_hash,omitempty"`
	RemoteAddr    string    `json:"remote_addr,omitempty"`
	UserAgent     string    `json:"user_agent,omitempty"`
}

// InflightSummary is the lightweight version used in /debug/freezekit/state.
type InflightSummary struct {
	Count             int     `json:"count"`
	OldestAgeSeconds  float64 `json:"oldest_age_seconds"`
	Routes            []routeCount `json:"routes,omitempty"`
}

type routeCount struct {
	Route string `json:"route"`
	N     int    `json:"n"`
}

// inflightTracker holds the live request set and recent-window
// counters. It is safe to use from many goroutines.
type inflightTracker struct {
	// Hot path mutations: oldestNS, count, last2xx, lastTotal.
	// These are atomics so the request middleware does not contend
	// on the map mutex unless absolutely necessary.
	count    atomic.Int64

	// ringWindow holds (timestamp, status) of recent finished
	// requests for the ZeroSuccessRateSignal. Bounded.
	ringMu   sync.Mutex
	ring     [256]ringEntry
	ringHead int
	ringSize int

	// entries is the live in-flight set. Key is a monotonically
	// increasing ID independent of the public request ID so the
	// hot path doesn't have to hash strings.
	mu      sync.RWMutex
	entries map[uint64]*inflightRow
	nextKey atomic.Uint64

	// Per-process salt for IP hashing. Generated once.
	salt [16]byte
}

type ringEntry struct {
	at   int64 // unix nano
	ok   bool
}

type inflightRow struct {
	publicID  string
	route     string
	method    string
	startedAt time.Time
	traceID   string
	userID    string
	ipHash    string
	remote    string
	ua        string
}

func newInflightTracker() *inflightTracker {
	t := &inflightTracker{
		entries: make(map[uint64]*inflightRow, 256),
	}
	_, _ = rand.Read(t.salt[:])
	return t
}

// middleware returns the http.Handler middleware that:
//   - extracts or generates a request ID (X-Request-Id wins; W3C
//     traceparent second; ULID fallback)
//   - records the request in the tracker
//   - on response, captures the status code into the recent ring
//   - on completion (success or panic), deregisters the entry
//
// Hot-path cost: one map insert + one map delete + a small atomic
// counter update. No JSON, no allocation beyond what net/http
// already does. Routes are derived from the request URL path; if
// the host framework (e.g. chi) exposes a route pattern via
// context, callers can pass a routeResolver via [Manager.SetRouteResolver]
// (TODO).
func (t *inflightTracker) middleware(redact RedactionPolicy, m *managerMetrics) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			id := extractOrMintRequestID(r)
			row := &inflightRow{
				publicID:  id,
				route:     r.URL.Path,
				method:    r.Method,
				startedAt: time.Now(),
				traceID:   extractTraceID(r),
			}
			if redact.HashClientIP {
				row.ipHash = t.hashIP(r.RemoteAddr)
			} else {
				row.remote = r.RemoteAddr
			}
			row.ua = r.Header.Get("User-Agent")

			key := t.nextKey.Add(1)
			t.mu.Lock()
			t.entries[key] = row
			t.mu.Unlock()
			t.count.Add(1)
			if m != nil {
				m.inflight.set(float64(t.count.Load()))
			}

			// Attach the ID to the response header for downstream
			// log correlation, and to the request context for
			// handler use.
			w.Header().Set("X-Request-Id", id)
			r = r.WithContext(context.WithValue(r.Context(), RequestIDKey, id))

			// Wrap the response writer to capture the final status.
			sw := &statusCapture{ResponseWriter: w, status: 200}
			defer func() {
				// Defer first runs after any panic; bubble.
				t.mu.Lock()
				delete(t.entries, key)
				t.mu.Unlock()
				t.count.Add(-1)
				if m != nil {
					m.inflight.set(float64(t.count.Load()))
				}
				ok := sw.status >= 200 && sw.status < 300
				t.recordFinish(ok)
			}()
			next.ServeHTTP(sw, r)
		})
	}
}

func (t *inflightTracker) recordFinish(ok bool) {
	t.ringMu.Lock()
	t.ring[t.ringHead] = ringEntry{at: time.Now().UnixNano(), ok: ok}
	t.ringHead = (t.ringHead + 1) % len(t.ring)
	if t.ringSize < len(t.ring) {
		t.ringSize++
	}
	t.ringMu.Unlock()
}

// oldestAge returns the age of the longest-running in-flight request.
// O(N). For the size of N we expect (≤ 1000s of concurrent reqs)
// this is fine on the detector cadence (every 5s). For larger fleets
// consider switching to a min-heap keyed by startedAt.
func (t *inflightTracker) oldestAge() time.Duration {
	t.mu.RLock()
	defer t.mu.RUnlock()
	var oldest time.Time
	for _, row := range t.entries {
		if oldest.IsZero() || row.startedAt.Before(oldest) {
			oldest = row.startedAt
		}
	}
	if oldest.IsZero() {
		return 0
	}
	return time.Since(oldest)
}

// recentCounts returns (total, ok2xx) from the ring within `window`.
func (t *inflightTracker) recentCounts(window time.Duration) (total, ok int) {
	cutoff := time.Now().Add(-window).UnixNano()
	t.ringMu.Lock()
	defer t.ringMu.Unlock()
	for i := 0; i < t.ringSize; i++ {
		idx := (t.ringHead - 1 - i + len(t.ring)) % len(t.ring)
		e := t.ring[idx]
		if e.at < cutoff {
			break
		}
		total++
		if e.ok {
			ok++
		}
	}
	return
}

// snapshot returns up to `max` in-flight rows, oldest first.
func (t *inflightTracker) snapshot(max int) []InflightRequest {
	t.mu.RLock()
	rows := make([]*inflightRow, 0, len(t.entries))
	for _, r := range t.entries {
		rows = append(rows, r)
	}
	t.mu.RUnlock()

	sort.Slice(rows, func(i, j int) bool {
		return rows[i].startedAt.Before(rows[j].startedAt)
	})
	if max > 0 && len(rows) > max {
		rows = rows[:max]
	}
	now := time.Now()
	out := make([]InflightRequest, len(rows))
	for i, r := range rows {
		out[i] = InflightRequest{
			ID:           r.publicID,
			Route:        r.route,
			Method:       r.method,
			StartedAt:    r.startedAt,
			AgeSeconds:   now.Sub(r.startedAt).Seconds(),
			TraceID:      r.traceID,
			UserID:       r.userID,
			ClientIPHash: r.ipHash,
			RemoteAddr:   r.remote,
			UserAgent:    r.ua,
		}
	}
	return out
}

// summary returns a compact view for /debug/freezekit/state.
func (t *inflightTracker) summary() InflightSummary {
	t.mu.RLock()
	defer t.mu.RUnlock()
	count := len(t.entries)
	var oldest time.Time
	routes := map[string]int{}
	for _, row := range t.entries {
		if oldest.IsZero() || row.startedAt.Before(oldest) {
			oldest = row.startedAt
		}
		routes[row.route]++
	}
	rc := make([]routeCount, 0, len(routes))
	for r, n := range routes {
		rc = append(rc, routeCount{Route: r, N: n})
	}
	sort.Slice(rc, func(i, j int) bool { return rc[i].N > rc[j].N })
	if len(rc) > 10 {
		rc = rc[:10]
	}
	var ageS float64
	if !oldest.IsZero() {
		ageS = time.Since(oldest).Seconds()
	}
	return InflightSummary{
		Count:            count,
		OldestAgeSeconds: ageS,
		Routes:           rc,
	}
}

// hashIP returns "sha256:" + first-16-hex-chars of SHA-256(salt || ip).
// 16 hex chars = 64 bits of entropy — enough to correlate within a
// pod but uncorrelatable across pods (different salts).
func (t *inflightTracker) hashIP(remote string) string {
	if remote == "" {
		return ""
	}
	// Strip the port if present.
	for i := len(remote) - 1; i >= 0; i-- {
		if remote[i] == ':' {
			remote = remote[:i]
			break
		}
	}
	h := sha256.New()
	_, _ = h.Write(t.salt[:])
	_, _ = h.Write([]byte(remote))
	return "sha256:" + hex.EncodeToString(h.Sum(nil))[:16]
}

// statusCapture wraps an http.ResponseWriter to record the final
// status code. Delegates Flusher / Hijacker / Pusher to the wrapped
// writer when the wrapped writer implements them — important for
// streaming handlers and websocket upgrades.
type statusCapture struct {
	http.ResponseWriter
	status      int
	wroteHeader bool
}

func (s *statusCapture) WriteHeader(code int) {
	if !s.wroteHeader {
		s.status = code
		s.wroteHeader = true
	}
	s.ResponseWriter.WriteHeader(code)
}

func (s *statusCapture) Write(b []byte) (int, error) {
	if !s.wroteHeader {
		s.status = 200
		s.wroteHeader = true
	}
	return s.ResponseWriter.Write(b)
}

// Flush implements http.Flusher when the wrapped writer does.
func (s *statusCapture) Flush() {
	if f, ok := s.ResponseWriter.(http.Flusher); ok {
		f.Flush()
	}
}

// Unwrap lets net/http's ResponseController find the underlying
// implementations (Hijacker, Pusher, ReadDeadline, etc.) without
// us having to re-implement every interface.
func (s *statusCapture) Unwrap() http.ResponseWriter { return s.ResponseWriter }

// ---------------------------------------------------------------------------
// ID extraction / minting
// ---------------------------------------------------------------------------

func extractOrMintRequestID(r *http.Request) string {
	if v := r.Header.Get("X-Request-Id"); v != "" && len(v) <= 128 && validULIDOrLog(v) {
		return v
	}
	// W3C traceparent: "00-<trace-id>-<span-id>-<flags>" → use trace-id.
	if tp := r.Header.Get("traceparent"); len(tp) >= 55 {
		// 00-aaaaaaaa…-bbbbbbbb-01
		// indices: 3..35 is the 32-hex trace-id.
		return "trace-" + tp[3:35]
	}
	return mintULID()
}

func extractTraceID(r *http.Request) string {
	if tp := r.Header.Get("traceparent"); len(tp) >= 55 {
		return tp[3:35]
	}
	return ""
}

// validULIDOrLog returns true for IDs that look reasonably safe to
// echo back. We accept anything that is printable ASCII without
// control chars; full ULID validation is overkill since the upstream
// caller chose the ID.
func validULIDOrLog(v string) bool {
	for i := 0; i < len(v); i++ {
		c := v[i]
		if c < 0x20 || c >= 0x7f {
			return false
		}
	}
	return true
}

// mintULID generates a Crockford-base32 ULID. 10-char ms timestamp
// + 16-char randomness = 26 chars. No external dependency.
func mintULID() string {
	const enc = "0123456789ABCDEFGHJKMNPQRSTVWXYZ" // Crockford base32 (no ILOU)
	ms := uint64(time.Now().UnixMilli())
	var rnd [10]byte
	_, _ = rand.Read(rnd[:])
	out := make([]byte, 26)
	// 48-bit timestamp → 10 base32 chars (50 bits with 2 wasted).
	for i := 9; i >= 0; i-- {
		out[i] = enc[ms&0x1f]
		ms >>= 5
	}
	// 80-bit randomness → 16 base32 chars (80 bits exact).
	// We chunk through the 10 bytes 5 bits at a time.
	bit := 0
	for i := 0; i < 16; i++ {
		bidx := bit / 8
		boff := bit % 8
		var v uint16
		if bidx < len(rnd) {
			v = uint16(rnd[bidx]) << 8
		}
		if bidx+1 < len(rnd) {
			v |= uint16(rnd[bidx+1])
		}
		v <<= boff
		idx := (v >> 11) & 0x1f
		out[10+i] = enc[idx]
		bit += 5
	}
	return string(out)
}
