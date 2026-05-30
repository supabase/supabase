package freezekit

import (
	"errors"
	"fmt"
	"log/slog"
	"os"
	"runtime"
	"strconv"
	"strings"
	"time"
)

// Config is the user-facing configuration for a Manager. All fields
// have safe production defaults; the zero-value of Config plus
// [Config.WithDefaults] is itself usable but does nothing interesting
// (no sinks, no signals, detector disabled).
//
// Conceptually, Config is split into four sub-structs that mirror
// the directories of concern: Detector, Capture, Sink, Limits.
type Config struct {
	// Logger is the structured logger used for all freezekit output.
	// If nil, a JSON logger to stderr is used.
	Logger *slog.Logger

	// ProcessMeta carries identifying information about the host
	// process. Embedded verbatim in every manifest. Defaults are
	// populated from the environment in [LoadConfigFromEnv].
	ProcessMeta ProcessMeta

	// Detector configures the freeze-detection state machine.
	Detector DetectorConfig

	// Capture configures what gets captured and the profile rates.
	Capture CaptureConfig

	// Sink is the destination for captured artifacts. If nil,
	// NoopSink is used (metrics-only mode).
	Sink Sink

	// Limits configures all anti-storm protections.
	Limits LimitsConfig

	// Disabled, if true, makes [New] return a Manager whose [Run]
	// returns immediately and whose middleware is a passthrough.
	// Equivalent to setting FREEZEKIT_DISABLED=true.
	Disabled bool
}

// DetectorConfig controls the state machine and signal sampling.
type DetectorConfig struct {
	// Enabled, when false, samples signals (so metrics are still
	// emitted) but never transitions out of NORMAL and never
	// triggers a capture. Useful for Wave 1 rollout.
	Enabled bool

	// SampleInterval is the cadence at which signals are sampled.
	// Default 5s. Lowering this increases responsiveness at the
	// cost of CPU.
	SampleInterval time.Duration

	// DebounceSamples is the number of consecutive above-threshold
	// samples required to transition UP a state. Default 3 (15s at
	// the default SampleInterval).
	DebounceSamples int

	// Cooldown is the duration after CAPTURE_COMPLETE during which
	// new captures are suppressed (regardless of signal state).
	// Default 5m.
	Cooldown time.Duration

	// WarnThreshold, DegradedThreshold, FreezeThreshold are the
	// score boundaries on the [0,1] severity axis. They MUST be
	// strictly increasing.
	WarnThreshold     float64
	DegradedThreshold float64
	FreezeThreshold   float64

	// Signals is the ordered list of signals to sample. If nil,
	// [DefaultSignals] is used.
	Signals []Signal
}

// CaptureConfig controls the pprof capture pipeline.
type CaptureConfig struct {
	// MaxDuration is the total wall-clock budget for a capture
	// cycle. Default 30s. Exceeding it aborts the in-progress
	// capture and yields a partial manifest.
	MaxDuration time.Duration

	// IncludeHeap, IncludeBlock, IncludeMutex, IncludeThreadCreate,
	// IncludeRuntimeMetrics gate the individual artifacts.
	IncludeHeap          bool
	IncludeBlock         bool
	IncludeMutex         bool
	IncludeThreadCreate  bool
	IncludeRuntimeMetrics bool

	// BlockProfileRateNS sets [runtime.SetBlockProfileRate] at
	// Manager start. 0 disables block profiling. Default 10000
	// (sample if blocked > 10µs).
	BlockProfileRateNS int

	// MutexProfileFraction sets [runtime.SetMutexProfileFraction]
	// at Manager start. 0 disables mutex profiling. Default 100
	// (sample 1% of contended mutex ops).
	MutexProfileFraction int

	// HeapSkipRSSBytes is the RSS-based safety gate for heap
	// capture. If process RSS exceeds this value, heap capture is
	// skipped. Default: 80% of detected cgroup limit, falling back
	// to 4 GiB if no limit is detectable.
	HeapSkipRSSBytes uint64

	// MaxInflightInManifest caps how many in-flight requests are
	// listed in the manifest. Oldest first. Default 50.
	MaxInflightInManifest int

	// Redaction controls PII handling in the manifest.
	Redaction RedactionPolicy
}

// LimitsConfig is the anti-storm budget.
type LimitsConfig struct {
	// MaxCapturesPerHour is the hard ceiling. Default 6.
	MaxCapturesPerHour int

	// MinIntervalBetweenCaptures is the floor on capture cadence,
	// regardless of token bucket state. Default 5m.
	MinIntervalBetweenCaptures time.Duration

	// ArtifactChannelCap is the bounded queue between the capture
	// worker and the upload workers. On overflow, artifacts are
	// dropped (the capture worker never blocks). Default 4.
	ArtifactChannelCap int

	// UploadWorkers is the size of the upload worker pool.
	// Default 2.
	UploadWorkers int

	// UploadAttempts is the per-artifact retry count. Default 3.
	UploadAttempts int

	// UploadAttemptTimeout is the per-attempt budget. Default 30s.
	UploadAttemptTimeout time.Duration

	// SampleRate ∈ [0,1] probabilistically skips captures even
	// when the detector triggers. Default 1.0 (never skip).
	SampleRate float64

	// SelfStallThreshold is the duration after which freezekit's
	// own watchdog considers the capture worker stalled and
	// disables itself. Default 60s.
	SelfStallThreshold time.Duration

	// SinkCircuitBreakerFailures is the consecutive-failure count
	// at which the sink circuit breaker opens. Default 5.
	SinkCircuitBreakerFailures int

	// SinkCircuitBreakerCooldown is how long the breaker stays
	// open. Default 10m.
	SinkCircuitBreakerCooldown time.Duration
}

// RedactionPolicy controls what request/correlation metadata is
// preserved in the manifest. Defaults are SOC2 / GDPR-safe.
type RedactionPolicy struct {
	// HashClientIP, when true, replaces client IPs with
	// "sha256:<truncated hex>" using a per-process salt.
	// Default true.
	HashClientIP bool

	// IncludeUserID, when true, copies any user ID present on the
	// request context. Default false.
	IncludeUserID bool

	// IncludeHeaders is an allowlist of header names whose values
	// are copied into the manifest. Default empty (no headers).
	IncludeHeaders []string
}

// ProcessMeta is identifying information about the host process.
// Captured once at Manager start and embedded in every manifest.
type ProcessMeta struct {
	// Required fields are filled by [LoadConfigFromEnv] from
	// well-known env vars. All fields are optional; missing ones
	// are simply omitted from the manifest.

	ServiceName    string // e.g. "gotrue"
	ServiceVersion string // e.g. "v2.186.0"
	GitSHA         string // e.g. "a1b2c3d"

	Hostname   string
	PodName    string
	Namespace  string
	NodeName   string
	Region     string
	Cluster    string
	Deployment string

	GoVersion  string
}

// LoadConfigFromEnv returns a Config populated from environment
// variables. Unset variables fall back to safe defaults. Errors in
// parsing (e.g. malformed duration) are logged to stderr and the
// default is used; this function never returns an error.
//
// Honoured env vars (all prefixed FREEZEKIT_ except where noted):
//
//	FREEZEKIT_DISABLED                  bool        global kill switch
//	FREEZEKIT_DETECTOR_ENABLED          bool        Wave 4 toggle (default false)
//	FREEZEKIT_SAMPLE_INTERVAL           duration    default 5s
//	FREEZEKIT_DEBOUNCE_SAMPLES          int         default 3
//	FREEZEKIT_COOLDOWN                  duration    default 5m
//	FREEZEKIT_WARN_THRESHOLD            float       default 0.4
//	FREEZEKIT_DEGRADED_THRESHOLD        float       default 0.7
//	FREEZEKIT_FREEZE_THRESHOLD          float       default 0.9
//	FREEZEKIT_MAX_CAPTURE_DURATION      duration    default 30s
//	FREEZEKIT_INCLUDE_HEAP              bool        default true
//	FREEZEKIT_INCLUDE_BLOCK             bool        default true
//	FREEZEKIT_INCLUDE_MUTEX             bool        default true
//	FREEZEKIT_INCLUDE_THREADCREATE      bool        default true
//	FREEZEKIT_INCLUDE_RUNTIME_METRICS   bool        default true
//	FREEZEKIT_BLOCK_PROFILE_RATE_NS     int         default 10000
//	FREEZEKIT_MUTEX_PROFILE_FRACTION    int         default 100
//	FREEZEKIT_HEAP_SKIP_RSS_MB          int         default auto
//	FREEZEKIT_MAX_INFLIGHT_IN_MANIFEST  int         default 50
//	FREEZEKIT_REDACT_HASH_CLIENT_IP     bool        default true
//	FREEZEKIT_REDACT_INCLUDE_USER_ID    bool        default false
//	FREEZEKIT_MAX_CAPTURES_PER_HOUR     int         default 6
//	FREEZEKIT_MIN_INTERVAL              duration    default 5m
//	FREEZEKIT_ARTIFACT_CHANNEL_CAP      int         default 4
//	FREEZEKIT_UPLOAD_WORKERS            int         default 2
//	FREEZEKIT_UPLOAD_ATTEMPTS           int         default 3
//	FREEZEKIT_UPLOAD_ATTEMPT_TIMEOUT    duration    default 30s
//	FREEZEKIT_SAMPLE_RATE               float       default 1.0
//	FREEZEKIT_SELF_STALL_THRESHOLD      duration    default 60s
//
// Pod identification (used in ProcessMeta) is collected from
// hostname plus the standard Downward-API env vars
// POD_NAME, POD_NAMESPACE, NODE_NAME, plus REGION, CLUSTER,
// SERVICE_NAME, SERVICE_VERSION, GIT_SHA if set.
func LoadConfigFromEnv() Config {
	c := DefaultConfig()
	c.Disabled = envBool("FREEZEKIT_DISABLED", c.Disabled)

	c.Detector.Enabled = envBool("FREEZEKIT_DETECTOR_ENABLED", c.Detector.Enabled)
	c.Detector.SampleInterval = envDur("FREEZEKIT_SAMPLE_INTERVAL", c.Detector.SampleInterval)
	c.Detector.DebounceSamples = envInt("FREEZEKIT_DEBOUNCE_SAMPLES", c.Detector.DebounceSamples)
	c.Detector.Cooldown = envDur("FREEZEKIT_COOLDOWN", c.Detector.Cooldown)
	c.Detector.WarnThreshold = envFloat("FREEZEKIT_WARN_THRESHOLD", c.Detector.WarnThreshold)
	c.Detector.DegradedThreshold = envFloat("FREEZEKIT_DEGRADED_THRESHOLD", c.Detector.DegradedThreshold)
	c.Detector.FreezeThreshold = envFloat("FREEZEKIT_FREEZE_THRESHOLD", c.Detector.FreezeThreshold)

	c.Capture.MaxDuration = envDur("FREEZEKIT_MAX_CAPTURE_DURATION", c.Capture.MaxDuration)
	c.Capture.IncludeHeap = envBool("FREEZEKIT_INCLUDE_HEAP", c.Capture.IncludeHeap)
	c.Capture.IncludeBlock = envBool("FREEZEKIT_INCLUDE_BLOCK", c.Capture.IncludeBlock)
	c.Capture.IncludeMutex = envBool("FREEZEKIT_INCLUDE_MUTEX", c.Capture.IncludeMutex)
	c.Capture.IncludeThreadCreate = envBool("FREEZEKIT_INCLUDE_THREADCREATE", c.Capture.IncludeThreadCreate)
	c.Capture.IncludeRuntimeMetrics = envBool("FREEZEKIT_INCLUDE_RUNTIME_METRICS", c.Capture.IncludeRuntimeMetrics)
	c.Capture.BlockProfileRateNS = envInt("FREEZEKIT_BLOCK_PROFILE_RATE_NS", c.Capture.BlockProfileRateNS)
	c.Capture.MutexProfileFraction = envInt("FREEZEKIT_MUTEX_PROFILE_FRACTION", c.Capture.MutexProfileFraction)
	if v := envInt("FREEZEKIT_HEAP_SKIP_RSS_MB", 0); v > 0 {
		c.Capture.HeapSkipRSSBytes = uint64(v) * 1024 * 1024
	}
	c.Capture.MaxInflightInManifest = envInt("FREEZEKIT_MAX_INFLIGHT_IN_MANIFEST", c.Capture.MaxInflightInManifest)
	c.Capture.Redaction.HashClientIP = envBool("FREEZEKIT_REDACT_HASH_CLIENT_IP", c.Capture.Redaction.HashClientIP)
	c.Capture.Redaction.IncludeUserID = envBool("FREEZEKIT_REDACT_INCLUDE_USER_ID", c.Capture.Redaction.IncludeUserID)

	c.Limits.MaxCapturesPerHour = envInt("FREEZEKIT_MAX_CAPTURES_PER_HOUR", c.Limits.MaxCapturesPerHour)
	c.Limits.MinIntervalBetweenCaptures = envDur("FREEZEKIT_MIN_INTERVAL", c.Limits.MinIntervalBetweenCaptures)
	c.Limits.ArtifactChannelCap = envInt("FREEZEKIT_ARTIFACT_CHANNEL_CAP", c.Limits.ArtifactChannelCap)
	c.Limits.UploadWorkers = envInt("FREEZEKIT_UPLOAD_WORKERS", c.Limits.UploadWorkers)
	c.Limits.UploadAttempts = envInt("FREEZEKIT_UPLOAD_ATTEMPTS", c.Limits.UploadAttempts)
	c.Limits.UploadAttemptTimeout = envDur("FREEZEKIT_UPLOAD_ATTEMPT_TIMEOUT", c.Limits.UploadAttemptTimeout)
	c.Limits.SampleRate = envFloat("FREEZEKIT_SAMPLE_RATE", c.Limits.SampleRate)
	c.Limits.SelfStallThreshold = envDur("FREEZEKIT_SELF_STALL_THRESHOLD", c.Limits.SelfStallThreshold)

	c.ProcessMeta = loadProcessMetaFromEnv()
	return c
}

// DefaultConfig returns Config populated with the documented
// production-safe defaults. The detector is disabled by default;
// you must set Detector.Enabled = true to allow automatic captures.
func DefaultConfig() Config {
	return Config{
		Disabled: false,
		Detector: DetectorConfig{
			Enabled:           false, // Wave 4 must explicitly enable
			SampleInterval:    5 * time.Second,
			DebounceSamples:   3,
			Cooldown:          5 * time.Minute,
			WarnThreshold:     0.4,
			DegradedThreshold: 0.7,
			FreezeThreshold:   0.9,
		},
		Capture: CaptureConfig{
			MaxDuration:           30 * time.Second,
			IncludeHeap:           true,
			IncludeBlock:          true,
			IncludeMutex:          true,
			IncludeThreadCreate:   true,
			IncludeRuntimeMetrics: true,
			BlockProfileRateNS:    10_000,
			MutexProfileFraction:  100,
			HeapSkipRSSBytes:      autoHeapSkipThreshold(),
			MaxInflightInManifest: 50,
			Redaction: RedactionPolicy{
				HashClientIP:  true,
				IncludeUserID: false,
			},
		},
		Limits: LimitsConfig{
			MaxCapturesPerHour:         6,
			MinIntervalBetweenCaptures: 5 * time.Minute,
			ArtifactChannelCap:         4,
			UploadWorkers:              2,
			UploadAttempts:             3,
			UploadAttemptTimeout:       30 * time.Second,
			SampleRate:                 1.0,
			SelfStallThreshold:         60 * time.Second,
			SinkCircuitBreakerFailures: 5,
			SinkCircuitBreakerCooldown: 10 * time.Minute,
		},
	}
}

// WithDefaults fills in zero-valued fields with the documented
// defaults. Use it when you constructed a Config struct literal
// directly (not via [LoadConfigFromEnv]) and want to ensure all
// required fields are set.
func (c Config) WithDefaults() Config {
	def := DefaultConfig()
	if c.Logger == nil {
		c.Logger = slog.New(slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelInfo}))
	}
	if c.Detector.SampleInterval == 0 {
		c.Detector.SampleInterval = def.Detector.SampleInterval
	}
	if c.Detector.DebounceSamples == 0 {
		c.Detector.DebounceSamples = def.Detector.DebounceSamples
	}
	if c.Detector.Cooldown == 0 {
		c.Detector.Cooldown = def.Detector.Cooldown
	}
	if c.Detector.WarnThreshold == 0 {
		c.Detector.WarnThreshold = def.Detector.WarnThreshold
	}
	if c.Detector.DegradedThreshold == 0 {
		c.Detector.DegradedThreshold = def.Detector.DegradedThreshold
	}
	if c.Detector.FreezeThreshold == 0 {
		c.Detector.FreezeThreshold = def.Detector.FreezeThreshold
	}
	if c.Capture.MaxDuration == 0 {
		c.Capture.MaxDuration = def.Capture.MaxDuration
	}
	if c.Capture.HeapSkipRSSBytes == 0 {
		c.Capture.HeapSkipRSSBytes = def.Capture.HeapSkipRSSBytes
	}
	if c.Capture.MaxInflightInManifest == 0 {
		c.Capture.MaxInflightInManifest = def.Capture.MaxInflightInManifest
	}
	if c.Limits.MaxCapturesPerHour == 0 {
		c.Limits.MaxCapturesPerHour = def.Limits.MaxCapturesPerHour
	}
	if c.Limits.MinIntervalBetweenCaptures == 0 {
		c.Limits.MinIntervalBetweenCaptures = def.Limits.MinIntervalBetweenCaptures
	}
	if c.Limits.ArtifactChannelCap == 0 {
		c.Limits.ArtifactChannelCap = def.Limits.ArtifactChannelCap
	}
	if c.Limits.UploadWorkers == 0 {
		c.Limits.UploadWorkers = def.Limits.UploadWorkers
	}
	if c.Limits.UploadAttempts == 0 {
		c.Limits.UploadAttempts = def.Limits.UploadAttempts
	}
	if c.Limits.UploadAttemptTimeout == 0 {
		c.Limits.UploadAttemptTimeout = def.Limits.UploadAttemptTimeout
	}
	if c.Limits.SampleRate == 0 {
		c.Limits.SampleRate = def.Limits.SampleRate
	}
	if c.Limits.SelfStallThreshold == 0 {
		c.Limits.SelfStallThreshold = def.Limits.SelfStallThreshold
	}
	if c.Limits.SinkCircuitBreakerFailures == 0 {
		c.Limits.SinkCircuitBreakerFailures = def.Limits.SinkCircuitBreakerFailures
	}
	if c.Limits.SinkCircuitBreakerCooldown == 0 {
		c.Limits.SinkCircuitBreakerCooldown = def.Limits.SinkCircuitBreakerCooldown
	}
	if c.ProcessMeta.GoVersion == "" {
		c.ProcessMeta.GoVersion = runtime.Version()
	}
	if c.ProcessMeta.Hostname == "" {
		c.ProcessMeta.Hostname, _ = os.Hostname()
	}
	if c.Sink == nil {
		c.Sink = NoopSink{}
	}
	return c
}

// Validate returns a joined error describing every invariant
// violation in the Config. Callers that build Configs by hand
// should call this; [New] calls it internally.
func (c Config) Validate() error {
	var errs []error
	if c.Detector.WarnThreshold < 0 || c.Detector.WarnThreshold > 1 {
		errs = append(errs, fmt.Errorf("detector.warn_threshold out of [0,1]: %v", c.Detector.WarnThreshold))
	}
	if c.Detector.DegradedThreshold < c.Detector.WarnThreshold {
		errs = append(errs, errors.New("detector.degraded_threshold must be ≥ warn_threshold"))
	}
	if c.Detector.FreezeThreshold < c.Detector.DegradedThreshold {
		errs = append(errs, errors.New("detector.freeze_threshold must be ≥ degraded_threshold"))
	}
	if c.Detector.SampleInterval < 100*time.Millisecond {
		errs = append(errs, errors.New("detector.sample_interval must be ≥ 100ms"))
	}
	if c.Detector.DebounceSamples < 1 {
		errs = append(errs, errors.New("detector.debounce_samples must be ≥ 1"))
	}
	if c.Capture.MaxDuration < time.Second {
		errs = append(errs, errors.New("capture.max_duration must be ≥ 1s"))
	}
	if c.Limits.MaxCapturesPerHour < 1 {
		errs = append(errs, errors.New("limits.max_captures_per_hour must be ≥ 1"))
	}
	if c.Limits.ArtifactChannelCap < 1 {
		errs = append(errs, errors.New("limits.artifact_channel_cap must be ≥ 1"))
	}
	if c.Limits.UploadWorkers < 1 {
		errs = append(errs, errors.New("limits.upload_workers must be ≥ 1"))
	}
	if c.Limits.SampleRate < 0 || c.Limits.SampleRate > 1 {
		errs = append(errs, fmt.Errorf("limits.sample_rate out of [0,1]: %v", c.Limits.SampleRate))
	}
	return errors.Join(errs...)
}

// loadProcessMetaFromEnv reads the standard Kubernetes Downward-API
// env vars plus a few service-specific ones.
func loadProcessMetaFromEnv() ProcessMeta {
	host, _ := os.Hostname()
	return ProcessMeta{
		ServiceName:    envStr("SERVICE_NAME", "gotrue"),
		ServiceVersion: envStr("SERVICE_VERSION", ""),
		GitSHA:         envStr("GIT_SHA", ""),
		Hostname:       host,
		PodName:        envStr("POD_NAME", host),
		Namespace:      envStr("POD_NAMESPACE", ""),
		NodeName:       envStr("NODE_NAME", ""),
		Region:         envStr("REGION", ""),
		Cluster:        envStr("CLUSTER", ""),
		Deployment:     envStr("DEPLOYMENT", ""),
		GoVersion:      runtime.Version(),
	}
}

// autoHeapSkipThreshold returns 80% of the detectable cgroup memory
// limit (Linux v1 and v2), falling back to 4 GiB. The result is in
// bytes.
func autoHeapSkipThreshold() uint64 {
	const fallback = 4 * 1024 * 1024 * 1024
	for _, path := range []string{
		"/sys/fs/cgroup/memory.max",                // cgroup v2
		"/sys/fs/cgroup/memory/memory.limit_in_bytes", // cgroup v1
	} {
		b, err := os.ReadFile(path)
		if err != nil {
			continue
		}
		raw := strings.TrimSpace(string(b))
		if raw == "" || raw == "max" {
			continue
		}
		n, err := strconv.ParseUint(raw, 10, 64)
		if err != nil || n == 0 || n >= 1<<62 {
			continue
		}
		return n * 4 / 5
	}
	return fallback
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

func envInt(key string, def int) int {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return def
	}
	return n
}

func envBool(key string, def bool) bool {
	v, ok := os.LookupEnv(key)
	if !ok {
		return def
	}
	switch strings.ToLower(strings.TrimSpace(v)) {
	case "1", "true", "yes", "on", "y", "t":
		return true
	case "0", "false", "no", "off", "n", "f", "":
		return false
	}
	return def
}

func envFloat(key string, def float64) float64 {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		return def
	}
	f, err := strconv.ParseFloat(v, 64)
	if err != nil {
		return def
	}
	return f
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
