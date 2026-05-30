package freezekit

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

// ---------------------------------------------------------------------------
// Detector
// ---------------------------------------------------------------------------

func TestDetectorStateMachineTransitions(t *testing.T) {
	m := mustManager(t, func(c *Config) {
		c.Detector.Enabled = true
		c.Detector.SampleInterval = 100 * time.Millisecond
		c.Detector.DebounceSamples = 2
		c.Detector.Cooldown = 50 * time.Millisecond
		c.Detector.WarnThreshold = 0.4
		c.Detector.DegradedThreshold = 0.7
		c.Detector.FreezeThreshold = 0.9
		// Single deterministic signal driven by an atomic.
		c.Detector.Signals = []Signal{newScriptedSignal()}
	})
	sig := m.cfg.Detector.Signals[0].(*scriptedSignal)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 0.0 → NORMAL.
	sig.set(0.0)
	m.detector.tick(ctx)
	if got := m.detector.snapshot().State; got != "NORMAL" {
		t.Fatalf("want NORMAL, got %s", got)
	}

	// 0.5 once → still NORMAL (debounce=2).
	sig.set(0.5)
	m.detector.tick(ctx)
	if got := m.detector.snapshot().State; got != "NORMAL" {
		t.Fatalf("after 1 warn tick want NORMAL, got %s", got)
	}
	// 0.5 twice → WARNING.
	m.detector.tick(ctx)
	if got := m.detector.snapshot().State; got != "WARNING" {
		t.Fatalf("after 2 warn ticks want WARNING, got %s", got)
	}

	// 0.95 twice → FREEZE_DETECTED + triggered.
	sig.set(0.95)
	m.detector.tick(ctx)
	triggered, _ := m.detector.tick(ctx)
	if !triggered {
		t.Fatalf("expected freeze trigger")
	}
	if got := m.detector.snapshot().State; got != "FREEZE_DETECTED" {
		t.Fatalf("want FREEZE_DETECTED, got %s", got)
	}

	// Mark capture done.
	m.detector.markCaptureComplete()
	if got := m.detector.snapshot().State; got != "CAPTURE_COMPLETE" {
		t.Fatalf("want CAPTURE_COMPLETE, got %s", got)
	}

	// Tick while in cooldown → stays CAPTURE_COMPLETE.
	sig.set(0.0)
	m.detector.tick(ctx)
	if got := m.detector.snapshot().State; got != "CAPTURE_COMPLETE" {
		t.Fatalf("want CAPTURE_COMPLETE during cooldown, got %s", got)
	}

	// After cooldown, returns to NORMAL.
	time.Sleep(60 * time.Millisecond)
	m.detector.tick(ctx)
	if got := m.detector.snapshot().State; got != "NORMAL" {
		t.Fatalf("after cooldown want NORMAL, got %s", got)
	}
}

func TestDetectorDoesNotTriggerWhenDisabled(t *testing.T) {
	m := mustManager(t, func(c *Config) {
		c.Detector.Enabled = false
		c.Detector.Signals = []Signal{constantSignal{score: 1.0}}
	})
	for i := 0; i < 5; i++ {
		triggered, _ := m.detector.tick(context.Background())
		if triggered {
			t.Fatalf("disabled detector triggered")
		}
	}
}

func TestSafeSampleRecoversPanic(t *testing.T) {
	got := safeSample(context.Background(), panickingSignal{})
	if got != 0 {
		t.Fatalf("expected 0 from panicking signal, got %v", got)
	}
}

// ---------------------------------------------------------------------------
// Rate limiter & circuit breaker
// ---------------------------------------------------------------------------

func TestRateLimiterTokenBucket(t *testing.T) {
	now := time.Now()
	// 1 per hour refill, 5-minute min-interval.
	r := newRateLimiter(1, 5*time.Minute)
	r.nowFn = func() time.Time { return now }

	if !r.allow() {
		t.Fatal("first allow should succeed")
	}
	if r.allow() {
		t.Fatal("second allow at same instant should fail (no token)")
	}
	// Advance just inside the min-interval — still blocked by min.
	now = now.Add(time.Minute)
	if r.allow() {
		t.Fatal("allow inside min-interval should be blocked")
	}
	// Advance past min-interval but still within refill window
	// — blocked by empty bucket.
	now = now.Add(10 * time.Minute)
	if r.allow() {
		t.Fatal("allow with no refill token should be blocked")
	}
	// Advance past the refill window — now allowed.
	now = now.Add(time.Hour)
	if !r.allow() {
		t.Fatal("allow after refill window should succeed")
	}
}

func TestCircuitBreakerTripAndHalfOpen(t *testing.T) {
	b := newCircuitBreaker(3, 50*time.Millisecond)
	for i := 0; i < 2; i++ {
		b.Allow()
		b.Failure()
		if b.State() != "closed" {
			t.Fatalf("after %d failures, expected closed; got %s", i+1, b.State())
		}
	}
	b.Allow()
	b.Failure()
	if b.State() != "open" {
		t.Fatalf("after 3 failures, expected open; got %s", b.State())
	}
	if b.Allow() {
		t.Fatal("open breaker should reject")
	}
	time.Sleep(60 * time.Millisecond)
	if !b.Allow() {
		t.Fatal("after cooldown breaker should allow probe")
	}
	b.Success()
	if b.State() != "closed" {
		t.Fatalf("after probe success expected closed; got %s", b.State())
	}
}

// ---------------------------------------------------------------------------
// LocalSink
// ---------------------------------------------------------------------------

func TestLocalSinkWriteAndLRUEvict(t *testing.T) {
	dir := t.TempDir()
	sink, err := NewLocalSink(dir, 512) // tiny budget
	if err != nil {
		t.Fatalf("NewLocalSink: %v", err)
	}
	put := func(eid string, name string, size int) {
		body := bytes.Repeat([]byte{'x'}, size)
		err := sink.Put(context.Background(), Artifact{EventID: eid, Name: name, Body: body})
		if err != nil {
			t.Fatalf("Put: %v", err)
		}
	}
	put("E1", "a.bin", 256)
	put("E1", "b.bin", 256) // E1 is now 512 = budget
	time.Sleep(2 * time.Millisecond)
	put("E2", "a.bin", 256) // triggers eviction of E1

	entries, err := os.ReadDir(dir)
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 1 || entries[0].Name() != "E2" {
		var names []string
		for _, e := range entries {
			names = append(names, e.Name())
		}
		t.Fatalf("expected only E2 to remain; got %v", names)
	}
}

func TestLocalSinkListRecent(t *testing.T) {
	dir := t.TempDir()
	sink, err := NewLocalSink(dir, 1<<20)
	if err != nil {
		t.Fatal(err)
	}
	man := Manifest{SchemaVersion: "1", FreezeEventID: "E1", CapturedAt: time.Now()}
	body, _ := json.Marshal(man)
	if err := sink.Put(context.Background(), Artifact{EventID: "E1", Name: "manifest.json", Body: body}); err != nil {
		t.Fatal(err)
	}
	got, err := sink.ListRecent(5)
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 1 || got[0].FreezeEventID != "E1" {
		t.Fatalf("unexpected list: %+v", got)
	}
}

// ---------------------------------------------------------------------------
// SignedURLSink
// ---------------------------------------------------------------------------

func TestSignedURLSinkRetryThenFail(t *testing.T) {
	var signerCalls, putCalls atomic.Int32
	signer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		signerCalls.Add(1)
		_, _ = w.Write([]byte(`{"url":"` + uploadStubURL(t, &putCalls) + `"}`))
	}))
	defer signer.Close()

	s := &SignedURLSink{SignURL: signer.URL}
	err := s.Put(context.Background(), Artifact{EventID: "E1", Name: "manifest.json", Body: []byte("{}"), ContentType: "application/json"})
	if err == nil {
		t.Fatal("expected upload error from 503-returning server")
	}
	if signerCalls.Load() == 0 || putCalls.Load() == 0 {
		t.Fatalf("expected calls; signer=%d put=%d", signerCalls.Load(), putCalls.Load())
	}
}

func TestSignedURLSinkSuccess(t *testing.T) {
	var got []byte
	upload := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got, _ = io.ReadAll(r.Body)
		w.WriteHeader(200)
	}))
	defer upload.Close()
	signer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"url":"` + upload.URL + `/key"}`))
	}))
	defer signer.Close()

	s := &SignedURLSink{SignURL: signer.URL}
	body := []byte("hello world")
	if err := s.Put(context.Background(), Artifact{EventID: "E1", Name: "a.bin", Body: body}); err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(got, body) {
		t.Fatalf("server got %q want %q", got, body)
	}
}

func uploadStubURL(t *testing.T, n *atomic.Int32) string {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		n.Add(1)
		w.WriteHeader(503)
	}))
	t.Cleanup(srv.Close)
	return srv.URL + "/path"
}

// ---------------------------------------------------------------------------
// MultiSink
// ---------------------------------------------------------------------------

func TestMultiSinkReturnsNilIfAnyOK(t *testing.T) {
	m := MultiSink{Sinks: []Sink{
		errSink{name: "bad"},
		NoopSink{},
	}}
	if err := m.Put(context.Background(), Artifact{EventID: "E1", Name: "x"}); err != nil {
		t.Fatalf("expected nil when one sink succeeds; got %v", err)
	}
}

func TestMultiSinkReturnsErrIfAllFail(t *testing.T) {
	m := MultiSink{Sinks: []Sink{
		errSink{name: "a"},
		errSink{name: "b"},
	}}
	if err := m.Put(context.Background(), Artifact{EventID: "E1", Name: "x"}); err == nil {
		t.Fatal("expected error when all sinks fail")
	}
}

// ---------------------------------------------------------------------------
// Capture pipeline (end-to-end)
// ---------------------------------------------------------------------------

func TestCaptureProducesArtifactsAndManifest(t *testing.T) {
	dir := t.TempDir()
	local, err := NewLocalSink(dir, 1<<22)
	if err != nil {
		t.Fatal(err)
	}
	m := mustManager(t, func(c *Config) {
		c.Sink = local
		c.Detector.Enabled = true
		c.Capture.IncludeHeap = true
		c.Capture.HeapSkipRSSBytes = 1 << 62 // never skip
		c.Limits.ArtifactChannelCap = 16     // avoid drops in test
	})
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go func() { _ = m.Run(ctx) }()
	defer m.Shutdown(context.Background())

	if !m.TriggerCapture("test_trigger") {
		t.Fatal("TriggerCapture rejected")
	}

	// Wait for the manifest to appear.
	mans := waitForManifests(t, local, 1, 3*time.Second)
	if mans[0].FreezeEventID == "" {
		t.Fatalf("manifest missing event id: %+v", mans[0])
	}
	// Verify at least the goroutine artifact was written.
	files, err := filepath.Glob(filepath.Join(dir, mans[0].FreezeEventID, "*"))
	if err != nil {
		t.Fatal(err)
	}
	want := map[string]bool{"manifest.json": true, "goroutine.txt.gz": true}
	for _, f := range files {
		delete(want, filepath.Base(f))
	}
	if len(want) > 0 {
		t.Fatalf("missing artifacts: %v (have %v)", want, files)
	}

	// Manifest references must round-trip.
	if len(mans[0].Artifacts) == 0 {
		t.Fatal("manifest has no artifact refs")
	}
	// Verify .txt.gz is valid gzip.
	body, _ := os.ReadFile(filepath.Join(dir, mans[0].FreezeEventID, "goroutine.txt.gz"))
	gz, err := gzip.NewReader(bytes.NewReader(body))
	if err != nil {
		t.Fatalf("goroutine.txt.gz not a valid gzip: %v", err)
	}
	dump, _ := io.ReadAll(gz)
	if !strings.Contains(string(dump), "goroutine") {
		t.Fatalf("goroutine dump missing 'goroutine' keyword:\n%s", string(dump)[:min(200, len(dump))])
	}
}

func TestRedactionHashesClientIP(t *testing.T) {
	m := mustManager(t, func(c *Config) {
		c.Capture.Redaction.HashClientIP = true
	})
	row := m.tracker.hashIP("10.0.0.1:12345")
	if !strings.HasPrefix(row, "sha256:") {
		t.Fatalf("expected sha256: prefix, got %q", row)
	}
	if strings.Contains(row, "10.0.0.1") {
		t.Fatalf("hashed IP leaked raw IP: %q", row)
	}
}

// ---------------------------------------------------------------------------
// HTTP middleware
// ---------------------------------------------------------------------------

func TestMiddlewareTracksAndRemoves(t *testing.T) {
	m := mustManager(t, func(c *Config) {})
	mid := m.HTTPMiddleware()
	handler := mid(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := m.tracker.count.Load(); got != 1 {
			t.Errorf("in handler expected inflight=1, got %d", got)
		}
		if id, _ := r.Context().Value(RequestIDKey).(string); id == "" {
			t.Error("expected request id in context")
		}
		w.WriteHeader(200)
	}))
	srv := httptest.NewServer(handler)
	defer srv.Close()
	resp, err := http.Get(srv.URL + "/x")
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.Header.Get("X-Request-Id") == "" {
		t.Error("X-Request-Id header missing")
	}
	if got := m.tracker.count.Load(); got != 0 {
		t.Fatalf("after handler expected inflight=0, got %d", got)
	}
}

func TestMiddlewareOldestAge(t *testing.T) {
	m := mustManager(t, func(c *Config) {})
	mid := m.HTTPMiddleware()
	release := make(chan struct{})
	handler := mid(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		<-release
	}))
	srv := httptest.NewServer(handler)
	defer srv.Close()
	go func() { resp, _ := http.Get(srv.URL + "/slow"); if resp != nil { resp.Body.Close() } }()
	// Wait until the inflight set has the request.
	deadline := time.Now().Add(time.Second)
	for time.Now().Before(deadline) && m.tracker.count.Load() == 0 {
		time.Sleep(5 * time.Millisecond)
	}
	if age := m.tracker.oldestAge(); age == 0 {
		t.Fatal("expected oldestAge > 0 while handler blocked")
	}
	close(release)
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

func mustManager(t *testing.T, mut func(*Config)) *Manager {
	t.Helper()
	cfg := DefaultConfig()
	if mut != nil {
		mut(&cfg)
	}
	cfg = cfg.WithDefaults()
	if cfg.Sink == nil {
		cfg.Sink = NoopSink{}
	}
	m, err := New(cfg)
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	return m
}

func waitForManifests(t *testing.T, s ListableSink, n int, timeout time.Duration) []Manifest {
	t.Helper()
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		out, err := s.ListRecent(n + 1)
		if err == nil && len(out) >= n {
			return out
		}
		time.Sleep(20 * time.Millisecond)
	}
	t.Fatalf("timeout waiting for %d manifests", n)
	return nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

type constantSignal struct{ score float64 }

func (constantSignal) Name() string                       { return "constant" }
func (constantSignal) Weight() float64                    { return 1 }
func (c constantSignal) Sample(context.Context) float64    { return c.score }

type panickingSignal struct{}

func (panickingSignal) Name() string                    { return "panic" }
func (panickingSignal) Weight() float64                 { return 1 }
func (panickingSignal) Sample(context.Context) float64  { panic("boom") }

type scriptedSignal struct {
	mu sync.Mutex
	v  float64
}

func newScriptedSignal() *scriptedSignal { return &scriptedSignal{} }
func (s *scriptedSignal) Name() string    { return "scripted" }
func (s *scriptedSignal) Weight() float64 { return 1 }
func (s *scriptedSignal) set(v float64)   { s.mu.Lock(); s.v = v; s.mu.Unlock() }
func (s *scriptedSignal) Sample(context.Context) float64 {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.v
}

type errSink struct{ name string }

func (e errSink) Name() string                            { return e.name }
func (e errSink) Health(context.Context) error            { return errors.New("nope") }
func (e errSink) Put(context.Context, Artifact) error     { return errors.New("nope") }
