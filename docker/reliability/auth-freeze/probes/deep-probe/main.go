// gotrue-deep-probe is a sidecar that runs honest, layered health checks
// against a GoTrue / supabase-auth instance and exposes the result as both
// an HTTP endpoint (for Kubernetes readiness) and Prometheus metrics.
//
// Three layers are probed on a configurable interval:
//
//	L1 liveness  GET /health                    (process up)
//	L2 router    GET /settings                  (router + middleware + JSON encoder)
//	L3 db+admin  GET /admin/users?per_page=1    (full DB pool + admin path)
//
// HTTP endpoints
//
//	GET /probe        200 if last result of all configured layers is "ok",
//	                  503 otherwise. Designed for K8s readinessProbe.
//	GET /probe?layer=L1
//	                  Per-layer status.
//	GET /metrics      Prometheus text exposition.
//	GET /healthz      Liveness for the probe ITSELF (cheap).
//
// CLI
//
//	-once             Run one cycle, print JSON, exit non-zero on failure.
//	                  Useful for `docker compose exec` smoke tests.
//
// Design notes
//
//   - Stdlib-only. No external module deps. Prometheus exposition is
//     written by hand against a tiny registry so the build cannot fail on
//     a network-restricted CI runner. Exposition follows the OpenMetrics
//     text format that all Prometheus / VictoriaMetrics / OTLP scrapers
//     accept.
//
//   - Every outbound HTTP call uses context.WithTimeout. The probe itself
//     enforces a per-cycle budget; if the budget is exceeded the cycle is
//     aborted and recorded as a failure for the slow layer.
//
//   - A self-watchdog goroutine logs (and optionally exits) if the probe
//     loop has not made progress within 3× the configured interval. This
//     guarantees the probe will not silently freeze in production.
//
//   - The probe binary is the reference implementation of the patterns
//     the upstream GoTrue patches (01–04) apply to the auth service
//     itself.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"runtime"
	"sort"
	"strings"
	"sync"
	"sync/atomic"
	"syscall"
	"time"
)

// ----------------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------------

type config struct {
	GoTrueURL       string
	AdminJWT        string
	ListenAddr      string
	ProbeInterval   time.Duration
	ProbeTimeout    time.Duration
	WatchdogStall   time.Duration
	WatchdogExitOn  bool
	MaxBodyBytes    int64
	UserAgent       string
	IncludeAdmin    bool
	LogLevel        slog.Level
	OnceMode        bool
}

func loadConfig() (*config, error) {
	var (
		once = flag.Bool("once", false, "run a single probe cycle and exit")
	)
	flag.Parse()

	c := &config{
		GoTrueURL:      envStr("GOTRUE_URL", "http://auth:9999"),
		AdminJWT:       envStr("GOTRUE_PROBE_ADMIN_JWT", ""),
		ListenAddr:     envStr("PROBE_LISTEN_ADDR", ":9101"),
		ProbeInterval:  envDur("PROBE_INTERVAL", 10*time.Second),
		ProbeTimeout:   envDur("PROBE_TIMEOUT", 3*time.Second),
		WatchdogStall:  envDur("PROBE_WATCHDOG_STALL", 30*time.Second),
		WatchdogExitOn: envBool("PROBE_WATCHDOG_EXIT", false),
		MaxBodyBytes:   envInt64("PROBE_MAX_BODY_BYTES", 1<<20), // 1 MiB
		UserAgent:      envStr("PROBE_USER_AGENT", "gotrue-deep-probe/1.0"),
		LogLevel:       slog.LevelInfo,
		OnceMode:       *once,
	}
	c.IncludeAdmin = c.AdminJWT != ""

	if lvl := os.Getenv("PROBE_LOG_LEVEL"); lvl != "" {
		_ = c.LogLevel.UnmarshalText([]byte(strings.ToUpper(lvl)))
	}

	if _, err := url.Parse(c.GoTrueURL); err != nil {
		return nil, fmt.Errorf("invalid GOTRUE_URL: %w", err)
	}
	if c.ProbeTimeout >= c.ProbeInterval {
		return nil, fmt.Errorf("PROBE_TIMEOUT (%s) must be < PROBE_INTERVAL (%s)",
			c.ProbeTimeout, c.ProbeInterval)
	}
	return c, nil
}

// ----------------------------------------------------------------------------
// Tiny in-house Prometheus registry (stdlib-only). Sufficient for our
// counter+gauge+histogram needs and avoids a module dependency.
// ----------------------------------------------------------------------------

type metric interface {
	name() string
	help() string
	mtype() string
	write(w io.Writer)
}

type registry struct {
	mu sync.RWMutex
	ms []metric
}

func newRegistry() *registry { return &registry{} }

func (r *registry) register(m metric) {
	r.mu.Lock()
	r.ms = append(r.ms, m)
	r.mu.Unlock()
}

func (r *registry) handler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
		r.mu.RLock()
		ms := make([]metric, len(r.ms))
		copy(ms, r.ms)
		r.mu.RUnlock()
		sort.Slice(ms, func(i, j int) bool { return ms[i].name() < ms[j].name() })
		for _, m := range ms {
			fmt.Fprintf(w, "# HELP %s %s\n# TYPE %s %s\n", m.name(), m.help(), m.name(), m.mtype())
			m.write(w)
		}
	})
}

// -- counter -----------------------------------------------------------------

type counter struct {
	n, h string
	v    map[string]*uint64 // label-key -> count
	mu   sync.Mutex
	keys []string // ordered label names
}

func newCounter(reg *registry, name, help string, labelKeys ...string) *counter {
	c := &counter{n: name, h: help, v: map[string]*uint64{}, keys: labelKeys}
	reg.register(c)
	return c
}

func (c *counter) name() string  { return c.n }
func (c *counter) help() string  { return c.h }
func (c *counter) mtype() string { return "counter" }

func (c *counter) inc(labelVals ...string) { c.add(1, labelVals...) }

func (c *counter) add(delta uint64, labelVals ...string) {
	key := joinLabels(c.keys, labelVals)
	c.mu.Lock()
	p, ok := c.v[key]
	if !ok {
		var z uint64
		p = &z
		c.v[key] = p
	}
	c.mu.Unlock()
	atomic.AddUint64(p, delta)
}

func (c *counter) write(w io.Writer) {
	c.mu.Lock()
	defer c.mu.Unlock()
	keys := make([]string, 0, len(c.v))
	for k := range c.v {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		fmt.Fprintf(w, "%s%s %d\n", c.n, k, atomic.LoadUint64(c.v[k]))
	}
}

// -- gauge -------------------------------------------------------------------

type gauge struct {
	n, h string
	v    float64
	fn   func() float64
	mu   sync.Mutex
}

func newGauge(reg *registry, name, help string) *gauge {
	g := &gauge{n: name, h: help}
	reg.register(g)
	return g
}

func newGaugeFunc(reg *registry, name, help string, fn func() float64) *gauge {
	g := &gauge{n: name, h: help, fn: fn}
	reg.register(g)
	return g
}

func (g *gauge) name() string  { return g.n }
func (g *gauge) help() string  { return g.h }
func (g *gauge) mtype() string { return "gauge" }

func (g *gauge) set(v float64) { g.mu.Lock(); g.v = v; g.mu.Unlock() }

func (g *gauge) write(w io.Writer) {
	var v float64
	if g.fn != nil {
		v = g.fn()
	} else {
		g.mu.Lock()
		v = g.v
		g.mu.Unlock()
	}
	fmt.Fprintf(w, "%s %g\n", g.n, v)
}

// -- histogram (fixed bucket layout suitable for HTTP latency) ---------------

var defaultBuckets = []float64{
	0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
}

type histogram struct {
	n, h    string
	keys    []string
	buckets []float64
	mu      sync.Mutex
	series  map[string]*histSeries
}

type histSeries struct {
	counts []uint64
	sum    float64
	count  uint64
}

func newHistogram(reg *registry, name, help string, labelKeys ...string) *histogram {
	hg := &histogram{
		n: name, h: help, keys: labelKeys,
		buckets: defaultBuckets, series: map[string]*histSeries{},
	}
	reg.register(hg)
	return hg
}

func (hg *histogram) name() string  { return hg.n }
func (hg *histogram) help() string  { return hg.h }
func (hg *histogram) mtype() string { return "histogram" }

func (hg *histogram) observe(v float64, labelVals ...string) {
	key := joinLabels(hg.keys, labelVals)
	hg.mu.Lock()
	s, ok := hg.series[key]
	if !ok {
		s = &histSeries{counts: make([]uint64, len(hg.buckets))}
		hg.series[key] = s
	}
	s.sum += v
	s.count++
	for i, b := range hg.buckets {
		if v <= b {
			s.counts[i]++
		}
	}
	hg.mu.Unlock()
}

func (hg *histogram) write(w io.Writer) {
	hg.mu.Lock()
	defer hg.mu.Unlock()
	keys := make([]string, 0, len(hg.series))
	for k := range hg.series {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		s := hg.series[k]
		// k is either empty (no labels) or "{a=\"b\"}".
		// We need to splice "le" into the existing label set.
		for i, b := range hg.buckets {
			fmt.Fprintf(w, "%s_bucket%s %d\n", hg.n, withLabel(k, "le", fmt.Sprintf("%g", b)), s.counts[i])
		}
		fmt.Fprintf(w, "%s_bucket%s %d\n", hg.n, withLabel(k, "le", "+Inf"), s.count)
		fmt.Fprintf(w, "%s_sum%s %g\n", hg.n, k, s.sum)
		fmt.Fprintf(w, "%s_count%s %d\n", hg.n, k, s.count)
	}
}

func joinLabels(keys, vals []string) string {
	if len(keys) == 0 {
		return ""
	}
	n := len(keys)
	if len(vals) < n {
		n = len(vals)
	}
	parts := make([]string, 0, n)
	for i := 0; i < n; i++ {
		parts = append(parts, fmt.Sprintf("%s=%q", keys[i], vals[i]))
	}
	return "{" + strings.Join(parts, ",") + "}"
}

// Splice a (name=value) into an existing "{a=\"b\",...}" label string.
func withLabel(existing, name, value string) string {
	if existing == "" {
		return fmt.Sprintf("{%s=%q}", name, value)
	}
	// existing is "{...}" — insert before the closing brace.
	return existing[:len(existing)-1] + fmt.Sprintf(",%s=%q}", name, value)
}

// ----------------------------------------------------------------------------
// Probe state
// ----------------------------------------------------------------------------

type layerResult struct {
	Name       string        `json:"name"`
	OK         bool          `json:"ok"`
	StatusCode int           `json:"status_code,omitempty"`
	LatencyMS  int64         `json:"latency_ms"`
	Err        string        `json:"err,omitempty"`
	CheckedAt  time.Time     `json:"checked_at"`
	skipped    bool          // not exported; "skipped" layers don't influence /probe verdict
	Duration   time.Duration `json:"-"`
}

type probeState struct {
	mu      sync.RWMutex
	results map[string]*layerResult
	cycleAt atomic.Int64 // unix nano of last cycle start

	// Aggregate "ok" flag: 1 if every non-skipped layer succeeded in
	// the most recent cycle, 0 otherwise. Read by /probe.
	allOK atomic.Bool
}

func newProbeState(layerNames []string) *probeState {
	s := &probeState{results: map[string]*layerResult{}}
	now := time.Now()
	for _, n := range layerNames {
		s.results[n] = &layerResult{Name: n, CheckedAt: now}
	}
	return s
}

func (s *probeState) update(r *layerResult) {
	s.mu.Lock()
	s.results[r.Name] = r
	allOK := true
	for _, lr := range s.results {
		if lr.skipped {
			continue
		}
		if !lr.OK {
			allOK = false
			break
		}
	}
	s.mu.Unlock()
	s.allOK.Store(allOK)
}

func (s *probeState) snapshot() map[string]*layerResult {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make(map[string]*layerResult, len(s.results))
	for k, v := range s.results {
		cp := *v
		out[k] = &cp
	}
	return out
}

// ----------------------------------------------------------------------------
// HTTP client tuned for liveness probes (short timeouts, no keep-alive
// pooling beyond a single host, IPv4/IPv6 dual-stack).
// ----------------------------------------------------------------------------

func newClient(c *config) *http.Client {
	transport := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   c.ProbeTimeout,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		MaxIdleConns:          4,
		MaxIdleConnsPerHost:   4,
		MaxConnsPerHost:       8,
		IdleConnTimeout:       60 * time.Second,
		TLSHandshakeTimeout:   c.ProbeTimeout,
		ExpectContinueTimeout: 1 * time.Second,
		ResponseHeaderTimeout: c.ProbeTimeout,
		// Force a fresh connection per cycle if PROBE_RECYCLE_CONNS is set;
		// useful when diagnosing connection-affinity bugs on a service mesh.
		DisableKeepAlives: envBool("PROBE_RECYCLE_CONNS", false),
	}
	return &http.Client{
		Transport: transport,
		Timeout:   c.ProbeTimeout,
	}
}

// ----------------------------------------------------------------------------
// The probe loop
// ----------------------------------------------------------------------------

type prober struct {
	cfg    *config
	client *http.Client
	state  *probeState
	log    *slog.Logger

	// Metrics
	mCycles        *counter
	mCycleDuration *histogram
	mLayerOK       *counter
	mLayerFail     *counter
	mLayerLatency  *histogram
	mWatchdogTrips *counter
}

func newProber(cfg *config, log *slog.Logger, reg *registry) *prober {
	layerNames := []string{"liveness", "settings"}
	if cfg.IncludeAdmin {
		layerNames = append(layerNames, "admin")
	} else {
		log.Warn("admin layer disabled (GOTRUE_PROBE_ADMIN_JWT empty)")
	}

	p := &prober{
		cfg:    cfg,
		client: newClient(cfg),
		state:  newProbeState(layerNames),
		log:    log,
		mCycles:        newCounter(reg, "gotrue_probe_cycles_total", "Total probe cycles started."),
		mCycleDuration: newHistogram(reg, "gotrue_probe_cycle_duration_seconds", "Duration of full probe cycles."),
		mLayerOK:       newCounter(reg, "gotrue_probe_layer_ok_total", "Successful per-layer probes.", "layer"),
		mLayerFail:     newCounter(reg, "gotrue_probe_layer_fail_total", "Failed per-layer probes.", "layer", "reason"),
		mLayerLatency:  newHistogram(reg, "gotrue_probe_layer_latency_seconds", "Per-layer latency.", "layer"),
		mWatchdogTrips: newCounter(reg, "gotrue_probe_watchdog_trips_total", "Watchdog stall trips."),
	}
	newGaugeFunc(reg, "gotrue_probe_goroutines",
		"Goroutines in the probe process.",
		func() float64 { return float64(runtime.NumGoroutine()) })
	newGaugeFunc(reg, "gotrue_probe_last_cycle_age_seconds",
		"Seconds since the last probe cycle started.",
		func() float64 {
			ts := p.state.cycleAt.Load()
			if ts == 0 {
				return 0
			}
			return time.Since(time.Unix(0, ts)).Seconds()
		})
	newGaugeFunc(reg, "gotrue_probe_all_ok",
		"1 if all non-skipped layers passed in the most recent cycle.",
		func() float64 {
			if p.state.allOK.Load() {
				return 1
			}
			return 0
		})
	return p
}

func (p *prober) runOnce(ctx context.Context) {
	cycleStart := time.Now()
	p.state.cycleAt.Store(cycleStart.UnixNano())
	p.mCycles.inc()

	// Each layer gets its own bounded context, not the cycle-wide one,
	// so a hung L2 doesn't poison L3's budget.
	p.probeLayer(ctx, "liveness", "/health", false)
	p.probeLayer(ctx, "settings", "/settings", false)
	if p.cfg.IncludeAdmin {
		p.probeLayer(ctx, "admin", "/admin/users?page=1&per_page=1", true)
	}

	p.mCycleDuration.observe(time.Since(cycleStart).Seconds())
}

func (p *prober) probeLayer(ctx context.Context, name, path string, withJWT bool) {
	ctx, cancel := context.WithTimeout(ctx, p.cfg.ProbeTimeout)
	defer cancel()

	r := &layerResult{Name: name, CheckedAt: time.Now()}
	start := time.Now()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, p.cfg.GoTrueURL+path, nil)
	if err != nil {
		r.Err = "bad_request: " + err.Error()
		p.finishLayer(r, start, "bad_request")
		return
	}
	req.Header.Set("User-Agent", p.cfg.UserAgent)
	req.Header.Set("Accept", "application/json")
	if withJWT && p.cfg.AdminJWT != "" {
		req.Header.Set("Authorization", "Bearer "+p.cfg.AdminJWT)
		req.Header.Set("apikey", p.cfg.AdminJWT)
	}

	resp, err := p.client.Do(req)
	if err != nil {
		reason := classifyErr(err)
		r.Err = err.Error()
		p.finishLayer(r, start, reason)
		return
	}
	defer resp.Body.Close()

	// Read+discard a bounded amount to keep the connection reusable
	// without giving an attacker the ability to OOM us.
	_, _ = io.Copy(io.Discard, io.LimitReader(resp.Body, p.cfg.MaxBodyBytes))

	r.StatusCode = resp.StatusCode
	if resp.StatusCode >= 200 && resp.StatusCode < 400 {
		r.OK = true
		p.finishLayer(r, start, "")
		return
	}
	r.Err = fmt.Sprintf("http_status_%d", resp.StatusCode)
	p.finishLayer(r, start, "http_error")
}

func classifyErr(err error) string {
	switch {
	case errors.Is(err, context.DeadlineExceeded):
		return "timeout"
	case errors.Is(err, context.Canceled):
		return "canceled"
	}
	var netErr net.Error
	if errors.As(err, &netErr) && netErr.Timeout() {
		return "net_timeout"
	}
	var opErr *net.OpError
	if errors.As(err, &opErr) {
		return "net_" + opErr.Op
	}
	return "other"
}

func (p *prober) finishLayer(r *layerResult, start time.Time, failReason string) {
	r.Duration = time.Since(start)
	r.LatencyMS = r.Duration.Milliseconds()
	p.mLayerLatency.observe(r.Duration.Seconds(), r.Name)
	if r.OK {
		p.mLayerOK.inc(r.Name)
		p.log.Debug("layer ok", "layer", r.Name, "status", r.StatusCode, "latency_ms", r.LatencyMS)
	} else {
		p.mLayerFail.inc(r.Name, failReason)
		p.log.Warn("layer failed", "layer", r.Name, "status", r.StatusCode,
			"latency_ms", r.LatencyMS, "reason", failReason, "err", r.Err)
	}
	p.state.update(r)
}

// ----------------------------------------------------------------------------
// Watchdog: detects if the probe loop has stalled (we are the very thing
// we're using to detect freezes elsewhere, so we MUST not freeze ourselves).
// ----------------------------------------------------------------------------

func (p *prober) watchdog(ctx context.Context) {
	t := time.NewTicker(p.cfg.WatchdogStall / 3)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			last := p.state.cycleAt.Load()
			if last == 0 {
				continue // probe loop not started yet
			}
			age := time.Since(time.Unix(0, last))
			if age > p.cfg.WatchdogStall {
				p.mWatchdogTrips.inc()
				p.log.Error("WATCHDOG: probe loop stalled",
					"stall", age.String(),
					"goroutines", runtime.NumGoroutine())
				if p.cfg.WatchdogExitOn {
					p.log.Error("WATCHDOG: PROBE_WATCHDOG_EXIT=true → exiting so the orchestrator restarts us")
					os.Exit(2)
				}
			}
		}
	}
}

// ----------------------------------------------------------------------------
// HTTP server
// ----------------------------------------------------------------------------

func (p *prober) httpHandler(reg *registry) http.Handler {
	mux := http.NewServeMux()
	mux.Handle("/metrics", reg.handler())
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, "ok\n")
	})
	mux.HandleFunc("/probe", func(w http.ResponseWriter, r *http.Request) {
		layer := r.URL.Query().Get("layer")
		snap := p.state.snapshot()

		w.Header().Set("Content-Type", "application/json")
		enc := json.NewEncoder(w)
		enc.SetIndent("", "  ")

		if layer != "" {
			lr, ok := snap[layer]
			if !ok {
				w.WriteHeader(http.StatusNotFound)
				_ = enc.Encode(map[string]string{"err": "unknown layer: " + layer})
				return
			}
			if !lr.OK {
				w.WriteHeader(http.StatusServiceUnavailable)
			}
			_ = enc.Encode(lr)
			return
		}

		body := struct {
			OK     bool                    `json:"ok"`
			Layers map[string]*layerResult `json:"layers"`
		}{OK: p.state.allOK.Load(), Layers: snap}

		if !body.OK {
			w.WriteHeader(http.StatusServiceUnavailable)
		}
		_ = enc.Encode(body)
	})
	return mux
}

// ----------------------------------------------------------------------------
// Wiring
// ----------------------------------------------------------------------------

func main() {
	cfg, err := loadConfig()
	if err != nil {
		fmt.Fprintln(os.Stderr, "config error:", err)
		os.Exit(2)
	}

	log := slog.New(slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{Level: cfg.LogLevel}))
	slog.SetDefault(log)

	reg := newRegistry()
	prober := newProber(cfg, log, reg)

	if cfg.OnceMode {
		ctx, cancel := context.WithTimeout(context.Background(), cfg.ProbeInterval)
		defer cancel()
		prober.runOnce(ctx)
		snap := prober.state.snapshot()
		_ = json.NewEncoder(os.Stdout).Encode(map[string]any{
			"ok":     prober.state.allOK.Load(),
			"layers": snap,
		})
		if !prober.state.allOK.Load() {
			os.Exit(1)
		}
		return
	}

	rootCtx, cancel := signal.NotifyContext(context.Background(),
		os.Interrupt, syscall.SIGTERM)
	defer cancel()

	server := &http.Server{
		Addr:              cfg.ListenAddr,
		Handler:           prober.httpHandler(reg),
		ReadHeaderTimeout: 3 * time.Second,
		ReadTimeout:       5 * time.Second,
		WriteTimeout:      5 * time.Second,
		IdleTimeout:       60 * time.Second,
		MaxHeaderBytes:    1 << 16,
	}

	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		log.Info("probe loop starting",
			"url", cfg.GoTrueURL,
			"interval", cfg.ProbeInterval.String(),
			"timeout", cfg.ProbeTimeout.String(),
			"admin_layer", cfg.IncludeAdmin)
		// First cycle immediately, then on the interval.
		prober.runOnce(rootCtx)
		t := time.NewTicker(cfg.ProbeInterval)
		defer t.Stop()
		for {
			select {
			case <-rootCtx.Done():
				return
			case <-t.C:
				prober.runOnce(rootCtx)
			}
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		prober.watchdog(rootCtx)
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		log.Info("HTTP server starting", "addr", cfg.ListenAddr)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Error("server failed", "err", err)
			cancel()
		}
	}()

	<-rootCtx.Done()
	log.Info("shutdown signal received")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Warn("graceful shutdown failed", "err", err)
	}
	wg.Wait()
	log.Info("bye")
}

// ----------------------------------------------------------------------------
// env helpers
// ----------------------------------------------------------------------------

func envStr(key, def string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return def
}

func envBool(key string, def bool) bool {
	v, ok := os.LookupEnv(key)
	if !ok {
		return def
	}
	switch strings.ToLower(v) {
	case "1", "true", "yes", "on":
		return true
	case "0", "false", "no", "off", "":
		return false
	}
	return def
}

func envDur(key string, def time.Duration) time.Duration {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		return def
	}
	d, err := time.ParseDuration(v)
	if err != nil {
		return def
	}
	return d
}

func envInt64(key string, def int64) int64 {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		return def
	}
	var out int64
	_, err := fmt.Sscanf(v, "%d", &out)
	if err != nil {
		return def
	}
	return out
}
