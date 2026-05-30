package freezekit

import (
	"time"
)

// ManifestSchemaVersion is bumped only on backward-incompatible
// changes to the JSON shape. Operators can build dashboards keyed
// on this.
const ManifestSchemaVersion = "1"

// Manifest is the JSON document emitted alongside each capture. See
// the design doc for field-by-field meanings.
type Manifest struct {
	SchemaVersion string    `json:"schema_version"`
	FreezeEventID string    `json:"freeze_event_id"`
	CapturedAt    time.Time `json:"captured_at"`

	Trigger Trigger `json:"trigger"`

	Process ProcessMetaJSON `json:"process"`
	Host    HostMetaJSON    `json:"host"`

	StateAtCapture StateAtCapture `json:"state_at_capture"`

	InflightRequests []InflightRequest `json:"inflight_requests,omitempty"`
	ActiveRoutes     []string          `json:"active_routes,omitempty"`

	Signals []signalSnapshot `json:"signals,omitempty"`

	Artifacts []ArtifactRef `json:"artifacts,omitempty"`
	Skipped   []string      `json:"skipped,omitempty"`

	// Notes is operator-provided context; populated only for manual
	// captures via ?note= query string.
	Notes string `json:"notes,omitempty"`
}

// Trigger describes WHY a capture fired.
type Trigger struct {
	Reason         string  `json:"reason"`           // e.g. "score>=0.9", "manual", "preStop"
	Score          float64 `json:"score"`
	TopSignal      string  `json:"top_signal"`
	TopSignalValue float64 `json:"top_signal_value"`
}

// ProcessMetaJSON is the manifest-friendly subset of ProcessMeta.
type ProcessMetaJSON struct {
	GoVersion      string    `json:"go_version"`
	ServiceVersion string    `json:"service_version,omitempty"`
	GitSHA         string    `json:"git_sha,omitempty"`
	StartedAt      time.Time `json:"started_at"`
	UptimeSeconds  int64     `json:"uptime_seconds"`
	GOMAXPROCS     int       `json:"gomaxprocs"`
}

// HostMetaJSON is the manifest-friendly subset of ProcessMeta's
// host/k8s identification fields.
type HostMetaJSON struct {
	Hostname   string `json:"hostname,omitempty"`
	PodName    string `json:"pod_name,omitempty"`
	Namespace  string `json:"namespace,omitempty"`
	NodeName   string `json:"node_name,omitempty"`
	Region     string `json:"region,omitempty"`
	Cluster    string `json:"cluster,omitempty"`
	Deployment string `json:"deployment,omitempty"`
}

// StateAtCapture summarises the runtime state at t0 of the capture
// cycle. Anything that can be computed cheaply at capture time goes
// here; anything that requires the full pprof artifact goes in the
// artifact bundle, not the manifest.
type StateAtCapture struct {
	Goroutines             int     `json:"goroutines"`
	HeapInUseMB            uint64  `json:"heap_in_use_mb"`
	RSSMB                  uint64  `json:"rss_mb"`
	CPUPercent             float64 `json:"cpu_percent,omitempty"`
	Inflight               int64   `json:"inflight"`
	OldestInflightSeconds  float64 `json:"oldest_inflight_seconds"`

	GCPauseTotalSeconds float64 `json:"gc_pause_total_seconds"`
	NextGCMB            uint64  `json:"next_gc_mb"`

	DBPool *DBPoolStats `json:"db_pool,omitempty"`
}

// ArtifactRef is a manifest entry pointing at one captured artifact.
type ArtifactRef struct {
	Name   string `json:"name"`
	Bytes  int    `json:"bytes"`
	SHA256 string `json:"sha256"`
}
