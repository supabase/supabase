// Command freezekit-sidecar is the deploy-today alternative to
// embedding the freezekit package directly. It runs as a Kubernetes
// sidecar next to an unmodified GoTrue container and:
//
//  1. Scrapes the auth container's existing /metrics endpoint to
//     read inflight + DB pool indicators.
//  2. Runs an external version of the freezekit detector.
//  3. On freeze, pulls the auth container's /debug/pprof/{goroutine,heap,block,mutex,threadcreate}
//     endpoints and bundles them into the same Manifest format.
//  4. Writes to a shared emptyDir (local sink) and/or uploads via
//     pre-signed URL.
//
// The auth container only needs to expose /debug/pprof on a loopback
// or pod-local port — no GoTrue patch is required to get most of the
// value. (The OldestInflight signal works best when the auth
// container also exposes patch 03's metrics; absent that, the
// sidecar falls back to ZeroSuccessRate + GoroutineSpike +
// SchedulerLatency from its own runtime/metrics and rolled-up
// Prometheus scrapes.)
package main

import (
	"bytes"
	"context"
	"errors"
	"flag"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"
)

func main() {
	cfg := parseFlags()
	logger := slog.New(slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelInfo}))

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGTERM, syscall.SIGINT)
	defer cancel()

	logger.Info("freezekit-sidecar starting",
		slog.String("target", cfg.TargetURL),
		slog.String("metrics_url", cfg.MetricsURL),
		slog.String("local_dir", cfg.LocalDir),
		slog.Duration("sample_interval", cfg.SampleInterval),
	)

	s := &sidecar{
		cfg:    cfg,
		log:    logger,
		client: &http.Client{Timeout: 30 * time.Second},
	}
	if err := s.run(ctx); err != nil && !errors.Is(err, context.Canceled) {
		logger.Error("sidecar failed", slog.Any("err", err))
		os.Exit(1)
	}
	logger.Info("freezekit-sidecar exiting")
}

type config struct {
	TargetURL         string
	MetricsURL        string
	LocalDir          string
	SignerURL         string
	SignerAuth        string
	SampleInterval    time.Duration
	OldestThreshold   time.Duration
	GoroutineMax      int
	MaxPerHour        int
	MinInterval       time.Duration
	ListenAddr        string
	IncludeHeap       bool
	HeapSkipRSSMB     int
}

func parseFlags() config {
	c := config{}
	flag.StringVar(&c.TargetURL, "target", env("TARGET_URL", "http://localhost:9999"), "Auth container base URL (with /debug/pprof reachable)")
	flag.StringVar(&c.MetricsURL, "metrics", env("METRICS_URL", ""), "Optional Prometheus /metrics URL of the auth container")
	flag.StringVar(&c.LocalDir, "local-dir", env("LOCAL_DIR", "/var/freezekit"), "Local directory for the LocalSink")
	flag.StringVar(&c.SignerURL, "signer", env("SIGNER_URL", ""), "Optional signed-URL signer endpoint")
	flag.StringVar(&c.SignerAuth, "signer-auth", env("SIGNER_AUTH", ""), "Authorization header for the signer (e.g. 'Bearer x')")
	flag.DurationVar(&c.SampleInterval, "sample-interval", envDur("SAMPLE_INTERVAL", 5*time.Second), "Detector sample cadence")
	flag.DurationVar(&c.OldestThreshold, "oldest-threshold", envDur("OLDEST_THRESHOLD", 45*time.Second), "OldestInflight trigger threshold")
	flag.IntVar(&c.GoroutineMax, "goroutine-max", envInt("GOROUTINE_MAX", 50000), "Goroutine spike ceiling")
	flag.IntVar(&c.MaxPerHour, "max-per-hour", envInt("MAX_PER_HOUR", 6), "Capture rate limit")
	flag.DurationVar(&c.MinInterval, "min-interval", envDur("MIN_INTERVAL", 5*time.Minute), "Minimum interval between captures")
	flag.StringVar(&c.ListenAddr, "listen", env("LISTEN_ADDR", ":9101"), "HTTP listen address for /metrics + /probe + /capture")
	flag.BoolVar(&c.IncludeHeap, "include-heap", envBool("INCLUDE_HEAP", true), "Include heap profile in captures")
	flag.IntVar(&c.HeapSkipRSSMB, "heap-skip-rss-mb", envInt("HEAP_SKIP_RSS_MB", 0), "Skip heap capture if target RSS exceeds this many MB (0 = no skip)")
	flag.Parse()
	return c
}

// ---------------------------------------------------------------------------

type sidecar struct {
	cfg    config
	log    *slog.Logger
	client *http.Client

	mu             sync.Mutex
	lastCapture    time.Time
	captureToken   chan struct{} // capacity 1
	consecutiveBad int

	scrapedOldest float64
	scrapedInfl   int
}

func (s *sidecar) run(ctx context.Context) error {
	s.captureToken = make(chan struct{}, 1)
	s.captureToken <- struct{}{}

	if err := os.MkdirAll(s.cfg.LocalDir, 0o750); err != nil {
		return fmt.Errorf("mkdir local-dir: %w", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/probe", s.handleProbe)
	mux.HandleFunc("/metrics", s.handleMetrics)
	mux.HandleFunc("/capture", s.handleCaptureRequest(ctx))
	srv := &http.Server{Addr: s.cfg.ListenAddr, Handler: mux, ReadHeaderTimeout: 5 * time.Second}

	errCh := make(chan error, 1)
	go func() { errCh <- srv.ListenAndServe() }()

	t := time.NewTicker(s.cfg.SampleInterval)
	defer t.Stop()

	for {
		select {
		case <-ctx.Done():
			shutdownCtx, c := context.WithTimeout(context.Background(), 10*time.Second)
			_ = srv.Shutdown(shutdownCtx)
			c()
			return ctx.Err()
		case err := <-errCh:
			if err != nil && !errors.Is(err, http.ErrServerClosed) {
				return err
			}
		case <-t.C:
			s.sample(ctx)
		}
	}
}

func (s *sidecar) sample(ctx context.Context) {
	infl, oldest := s.scrapeMetrics(ctx)
	s.mu.Lock()
	s.scrapedInfl = infl
	s.scrapedOldest = oldest
	s.mu.Unlock()

	if oldest >= s.cfg.OldestThreshold.Seconds() {
		s.consecutiveBad++
	} else {
		s.consecutiveBad = 0
	}
	if s.consecutiveBad >= 2 {
		go s.maybeCapture(ctx, "oldest_inflight_seconds>="+strconv.FormatFloat(s.cfg.OldestThreshold.Seconds(), 'f', 0, 64))
	}
}

func (s *sidecar) maybeCapture(ctx context.Context, reason string) {
	s.mu.Lock()
	if time.Since(s.lastCapture) < s.cfg.MinInterval {
		s.mu.Unlock()
		return
	}
	s.mu.Unlock()

	select {
	case <-s.captureToken:
	default:
		return
	}
	defer func() { s.captureToken <- struct{}{} }()

	s.runCapture(ctx, reason)
}

func (s *sidecar) handleCaptureRequest(ctx context.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		reason := r.URL.Query().Get("reason")
		if reason == "" {
			reason = "manual"
		}
		// Manual triggers BYPASS the min-interval.
		s.runCapture(ctx, reason)
		w.WriteHeader(http.StatusAccepted)
	}
}

func (s *sidecar) runCapture(parent context.Context, reason string) {
	ctx, cancel := context.WithTimeout(parent, 60*time.Second)
	defer cancel()

	eventID := mintULID()
	dir := filepath.Join(s.cfg.LocalDir, eventID)
	if err := os.MkdirAll(dir, 0o750); err != nil {
		s.log.Error("capture mkdir failed", slog.Any("err", err))
		return
	}

	s.log.Info("capture starting",
		slog.String("event_id", eventID),
		slog.String("reason", reason),
	)
	start := time.Now()

	type pull struct{ name, path string }
	steps := []pull{
		{"goroutine.txt", "/debug/pprof/goroutine?debug=2"},
		{"goroutine.pb.gz", "/debug/pprof/goroutine"},
		{"block.pb.gz", "/debug/pprof/block"},
		{"mutex.pb.gz", "/debug/pprof/mutex"},
		{"threadcreate.pb.gz", "/debug/pprof/threadcreate"},
	}
	if s.cfg.IncludeHeap {
		steps = append(steps, pull{"heap.pb.gz", "/debug/pprof/heap"})
	}

	var skipped []string
	for _, st := range steps {
		body, err := s.fetch(ctx, st.path)
		if err != nil {
			skipped = append(skipped, st.name+": "+err.Error())
			continue
		}
		if err := os.WriteFile(filepath.Join(dir, st.name), body, 0o640); err != nil {
			skipped = append(skipped, st.name+": write: "+err.Error())
		}
	}

	manifest := map[string]any{
		"schema_version":   "1",
		"freeze_event_id":  eventID,
		"captured_at":      time.Now().UTC().Format(time.RFC3339Nano),
		"captured_by":      "freezekit-sidecar",
		"trigger":          map[string]any{"reason": reason},
		"target":           s.cfg.TargetURL,
		"sample_oldest_s":  s.scrapedOldest,
		"sample_inflight":  s.scrapedInfl,
		"skipped":          skipped,
	}
	manBytes, _ := mustJSON(manifest)
	_ = os.WriteFile(filepath.Join(dir, "manifest.json"), manBytes, 0o640)

	if s.cfg.SignerURL != "" {
		s.uploadAll(ctx, eventID, dir)
	}

	s.mu.Lock()
	s.lastCapture = time.Now()
	s.mu.Unlock()
	s.log.Info("capture complete",
		slog.String("event_id", eventID),
		slog.Duration("duration", time.Since(start)),
		slog.Int("skipped", len(skipped)),
	)
}

func (s *sidecar) uploadAll(ctx context.Context, eventID, dir string) {
	entries, _ := os.ReadDir(dir)
	for _, e := range entries {
		path := filepath.Join(dir, e.Name())
		body, err := os.ReadFile(path)
		if err != nil {
			continue
		}
		key := eventID + "/" + e.Name()
		signed, err := s.signOne(ctx, key, contentTypeFor(e.Name()))
		if err != nil {
			s.log.Warn("sign failed", slog.String("key", key), slog.Any("err", err))
			continue
		}
		req, _ := http.NewRequestWithContext(ctx, http.MethodPut, signed, bytes.NewReader(body))
		req.Header.Set("Content-Type", contentTypeFor(e.Name()))
		req.ContentLength = int64(len(body))
		resp, err := s.client.Do(req)
		if err != nil {
			s.log.Warn("upload failed", slog.String("key", key), slog.Any("err", err))
			continue
		}
		_ = resp.Body.Close()
		if resp.StatusCode >= 300 {
			s.log.Warn("upload non-2xx",
				slog.String("key", key),
				slog.Int("status", resp.StatusCode),
			)
		}
	}
}

func (s *sidecar) signOne(ctx context.Context, key, contentType string) (string, error) {
	u := s.cfg.SignerURL + "?key=" + key + "&content_type=" + contentType
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if s.cfg.SignerAuth != "" {
		req.Header.Set("Authorization", s.cfg.SignerAuth)
	}
	resp, err := s.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return "", fmt.Errorf("signer http %d: %s", resp.StatusCode, string(body))
	}
	var raw map[string]any
	if err := jsonDecode(resp.Body, &raw); err != nil {
		return "", err
	}
	u2, _ := raw["url"].(string)
	if u2 == "" {
		return "", errors.New("signer returned empty url")
	}
	return u2, nil
}

func (s *sidecar) fetch(ctx context.Context, path string) ([]byte, error) {
	u := strings.TrimRight(s.cfg.TargetURL, "/") + path
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("fetch %s: http %d", path, resp.StatusCode)
	}
	return io.ReadAll(resp.Body)
}

// scrapeMetrics reads the target's Prometheus /metrics endpoint
// (if configured) and pulls out freezekit_oldest_inflight_seconds
// + freezekit_inflight. Falls back to zeros if not available.
func (s *sidecar) scrapeMetrics(ctx context.Context) (inflight int, oldestSeconds float64) {
	if s.cfg.MetricsURL == "" {
		return 0, 0
	}
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, s.cfg.MetricsURL, nil)
	resp, err := s.client.Do(req)
	if err != nil {
		s.log.Debug("scrape failed", slog.Any("err", err))
		return 0, 0
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return 0, 0
	}
	for _, line := range readLines(resp.Body) {
		if strings.HasPrefix(line, "#") {
			continue
		}
		switch {
		case strings.HasPrefix(line, "freezekit_oldest_inflight_seconds "):
			oldestSeconds = parseFloat(strings.TrimPrefix(line, "freezekit_oldest_inflight_seconds "))
		case strings.HasPrefix(line, "freezekit_inflight "):
			inflight = int(parseFloat(strings.TrimPrefix(line, "freezekit_inflight ")))
		}
	}
	return inflight, oldestSeconds
}

// ---------------------------------------------------------------------------
// HTTP handlers (sidecar's own surface)
// ---------------------------------------------------------------------------

func (s *sidecar) handleProbe(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	s.mu.Lock()
	defer s.mu.Unlock()
	resp := fmt.Sprintf(`{"target":%q,"oldest_inflight_s":%g,"inflight":%d,"last_capture":%q,"consec_bad":%d}`,
		s.cfg.TargetURL, s.scrapedOldest, s.scrapedInfl,
		s.lastCapture.Format(time.RFC3339), s.consecutiveBad)
	if s.consecutiveBad >= 2 {
		w.WriteHeader(http.StatusServiceUnavailable)
	}
	_, _ = w.Write([]byte(resp))
}

func (s *sidecar) handleMetrics(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/plain; version=0.0.4")
	s.mu.Lock()
	defer s.mu.Unlock()
	fmt.Fprintf(w, "# HELP freezekit_sidecar_oldest_inflight_seconds Scraped from target /metrics.\n")
	fmt.Fprintf(w, "# TYPE freezekit_sidecar_oldest_inflight_seconds gauge\n")
	fmt.Fprintf(w, "freezekit_sidecar_oldest_inflight_seconds %g\n", s.scrapedOldest)
	fmt.Fprintf(w, "# HELP freezekit_sidecar_inflight Scraped from target /metrics.\n")
	fmt.Fprintf(w, "# TYPE freezekit_sidecar_inflight gauge\n")
	fmt.Fprintf(w, "freezekit_sidecar_inflight %d\n", s.scrapedInfl)
}

// ---------------------------------------------------------------------------
// Tiny helpers (zero non-stdlib dependencies)
// ---------------------------------------------------------------------------

func env(k, def string) string {
	if v, ok := os.LookupEnv(k); ok {
		return v
	}
	return def
}

func envInt(k string, def int) int {
	if v, ok := os.LookupEnv(k); ok {
		n, err := strconv.Atoi(v)
		if err == nil {
			return n
		}
	}
	return def
}

func envBool(k string, def bool) bool {
	if v, ok := os.LookupEnv(k); ok {
		switch strings.ToLower(v) {
		case "1", "true", "yes", "on":
			return true
		case "0", "false", "no", "off":
			return false
		}
	}
	return def
}

func envDur(k string, def time.Duration) time.Duration {
	if v, ok := os.LookupEnv(k); ok {
		d, err := time.ParseDuration(v)
		if err == nil {
			return d
		}
	}
	return def
}

func parseFloat(s string) float64 {
	s = strings.TrimSpace(s)
	f, _ := strconv.ParseFloat(s, 64)
	return f
}

func readLines(r io.Reader) []string {
	b, _ := io.ReadAll(io.LimitReader(r, 8<<20))
	return strings.Split(string(b), "\n")
}

func contentTypeFor(name string) string {
	switch {
	case strings.HasSuffix(name, ".json"):
		return "application/json"
	case strings.HasSuffix(name, ".txt"):
		return "text/plain"
	case strings.HasSuffix(name, ".gz"):
		return "application/octet-stream"
	}
	return "application/octet-stream"
}
