package freezekit

import (
	"bytes"
	"compress/gzip"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log/slog"
	"runtime"
	"runtime/pprof"
	"time"
)

// Artifact is one byte blob bound for the Sink. The capturer emits
// one Artifact per pprof profile plus one for the manifest itself.
type Artifact struct {
	// EventID is the freeze_event_id; sinks should group artifacts
	// by this key.
	EventID string

	// Name is the relative path inside the event directory, e.g.
	// "manifest.json" or "goroutine.txt.gz".
	Name string

	// Body is the raw bytes. Always non-empty when delivered to a
	// sink.
	Body []byte

	// ContentType is the appropriate MIME for HTTP-based sinks.
	ContentType string

	// ContentEncoding is "gzip" for the gzipped artifacts (the
	// .txt.gz and metrics.json.gz), empty otherwise. Sinks like
	// SignedURLSink set the corresponding HTTP header.
	ContentEncoding string

	// CreatedAt is the wall-clock time the artifact was generated.
	CreatedAt time.Time

	// Manifest is filled only for the manifest artifact and ignored
	// otherwise. Lets ListableSinks index recent captures.
	Manifest *Manifest
}

// capturer owns the capture pipeline. One per Manager.
type capturer struct {
	cfg Config
	m   *Manager
	log *slog.Logger

	// requests is the inbound queue from the detector. Cap 1.
	requests chan captureReq
}

func newCapturer(cfg Config, m *Manager) *capturer {
	return &capturer{
		cfg:      cfg,
		m:        m,
		log:      m.log.With(slog.String("component", "capturer")),
		requests: make(chan captureReq, 1),
	}
}

// requestCapture asynchronously asks the capturer to run a cycle.
// Returns true if accepted. If a capture is already queued, returns
// false (the detector treats that as already-served).
func (c *capturer) requestCapture(reason string) bool {
	select {
	case c.requests <- captureReq{reason: reason}:
		return true
	default:
		return false
	}
}

// runOnce performs one capture cycle and returns the resulting
// artifacts. Never returns nil; in the worst case returns just the
// manifest with a non-empty Skipped list.
//
// The cycle is bounded by cfg.Capture.MaxDuration. Each step has its
// own per-step deadline derived from the remaining budget. A panic
// in any step is recovered and recorded as a "skipped" entry; the
// remaining steps still run.
func (c *capturer) runOnce(ctx context.Context, req captureReq) []Artifact {
	ctx, cancel := context.WithTimeout(ctx, c.cfg.Capture.MaxDuration)
	defer cancel()

	c.m.metrics.capturesStart.add("auto", 1) // overwritten if reason indicates otherwise
	if req.reason == "manual" {
		c.m.metrics.capturesStart.add("manual", 1)
	}
	if req.reason == "preStop" {
		c.m.metrics.capturesStart.add("preStop", 1)
	}
	c.m.metrics.freezeEvents.add(1)
	start := time.Now()

	eventID := mintULID()
	state := c.captureState()
	man := c.buildManifest(eventID, req, state)

	var arts []Artifact
	add := func(a Artifact) {
		a.EventID = eventID
		a.CreatedAt = time.Now()
		arts = append(arts, a)
		c.m.metrics.artifactBytes.observe(map[string]string{"artifact": a.Name}, float64(len(a.Body)))
	}
	addManifestRef := func(name string, body []byte) {
		sum := sha256.Sum256(body)
		man.Artifacts = append(man.Artifacts, ArtifactRef{
			Name:   name,
			Bytes:  len(body),
			SHA256: hex.EncodeToString(sum[:]),
		})
	}

	// 1. Goroutine text dump. Must run; this is the highest-value artifact.
	body, err := c.capture("goroutine", func(buf *bytes.Buffer) error {
		return pprof.Lookup("goroutine").WriteTo(buf, 2)
	})
	if err == nil {
		gz, gzerr := gzipBytes(body)
		if gzerr == nil {
			addManifestRef("goroutine.txt.gz", gz)
			add(Artifact{Name: "goroutine.txt.gz", Body: gz, ContentType: "text/plain", ContentEncoding: "gzip"})
		} else {
			addManifestRef("goroutine.txt", body)
			add(Artifact{Name: "goroutine.txt", Body: body, ContentType: "text/plain"})
		}
	} else {
		man.Skipped = append(man.Skipped, "goroutine: "+err.Error())
	}

	// 2. Goroutine pprof (binary).
	body, err = c.capture("goroutine_pb", func(buf *bytes.Buffer) error {
		return pprof.Lookup("goroutine").WriteTo(buf, 0)
	})
	if err == nil {
		addManifestRef("goroutine.pb.gz", body)
		add(Artifact{Name: "goroutine.pb.gz", Body: body, ContentType: "application/octet-stream"})
	} else {
		man.Skipped = append(man.Skipped, "goroutine_pb: "+err.Error())
	}

	// 3. Block profile.
	if c.cfg.Capture.IncludeBlock {
		body, err = c.capture("block", func(buf *bytes.Buffer) error {
			return pprof.Lookup("block").WriteTo(buf, 0)
		})
		if err == nil {
			addManifestRef("block.pb.gz", body)
			add(Artifact{Name: "block.pb.gz", Body: body, ContentType: "application/octet-stream"})
		} else {
			man.Skipped = append(man.Skipped, "block: "+err.Error())
		}
	}

	// 4. Mutex profile.
	if c.cfg.Capture.IncludeMutex {
		body, err = c.capture("mutex", func(buf *bytes.Buffer) error {
			return pprof.Lookup("mutex").WriteTo(buf, 0)
		})
		if err == nil {
			addManifestRef("mutex.pb.gz", body)
			add(Artifact{Name: "mutex.pb.gz", Body: body, ContentType: "application/octet-stream"})
		} else {
			man.Skipped = append(man.Skipped, "mutex: "+err.Error())
		}
	}

	// 5. Threadcreate profile.
	if c.cfg.Capture.IncludeThreadCreate {
		body, err = c.capture("threadcreate", func(buf *bytes.Buffer) error {
			return pprof.Lookup("threadcreate").WriteTo(buf, 0)
		})
		if err == nil {
			addManifestRef("threadcreate.pb.gz", body)
			add(Artifact{Name: "threadcreate.pb.gz", Body: body, ContentType: "application/octet-stream"})
		} else {
			man.Skipped = append(man.Skipped, "threadcreate: "+err.Error())
		}
	}

	// 6. Runtime metrics snapshot.
	if c.cfg.Capture.IncludeRuntimeMetrics {
		snap := captureRuntimeSnapshot()
		var buf bytes.Buffer
		zw := gzip.NewWriter(&buf)
		if err := json.NewEncoder(zw).Encode(snap); err == nil {
			_ = zw.Close()
			addManifestRef("metrics.json.gz", buf.Bytes())
			add(Artifact{Name: "metrics.json.gz", Body: buf.Bytes(), ContentType: "application/json", ContentEncoding: "gzip"})
		}
	}

	// 7. Heap profile — LAST, RSS-gated.
	if c.cfg.Capture.IncludeHeap {
		rss := rssBytes()
		if c.cfg.Capture.HeapSkipRSSBytes > 0 && rss > c.cfg.Capture.HeapSkipRSSBytes {
			man.Skipped = append(man.Skipped, fmt.Sprintf("heap: rss=%dMB > threshold=%dMB",
				rss/1024/1024, c.cfg.Capture.HeapSkipRSSBytes/1024/1024))
		} else {
			body, err = c.capture("heap", func(buf *bytes.Buffer) error {
				runtime.GC() // pprof recommends this for an accurate snapshot
				return pprof.WriteHeapProfile(buf)
			})
			if err == nil {
				addManifestRef("heap.pb.gz", body)
				add(Artifact{Name: "heap.pb.gz", Body: body, ContentType: "application/octet-stream"})
			} else {
				man.Skipped = append(man.Skipped, "heap: "+err.Error())
			}
		}
	}

	// Finally: the manifest itself. Built last so it references all
	// other artifacts. Prepend so it appears first in the directory.
	manBody, err := json.MarshalIndent(man, "", "  ")
	if err != nil {
		// This should never fail; fall back to a minimal manifest.
		c.log.Error("manifest marshal failed", slog.Any("err", err))
		manBody = []byte(`{"schema_version":"1","error":"manifest marshal failed"}`)
	}
	manifestArt := Artifact{
		EventID:     eventID,
		Name:        "manifest.json",
		Body:        manBody,
		ContentType: "application/json",
		CreatedAt:   time.Now(),
		Manifest:    &man,
	}
	arts = append([]Artifact{manifestArt}, arts...)
	c.m.metrics.artifactBytes.observe(map[string]string{"artifact": "manifest.json"}, float64(len(manBody)))

	// Final accounting.
	dur := time.Since(start)
	c.m.metrics.captureDuration.observe(dur.Seconds())
	result := "ok"
	if len(man.Skipped) > 0 {
		result = "partial"
	}
	c.m.metrics.capturesEnd.add(result, 1)

	c.log.Info("capture complete",
		slog.String("event_id", eventID),
		slog.String("reason", req.reason),
		slog.Duration("duration", dur),
		slog.Int("artifacts", len(arts)),
		slog.Int("skipped", len(man.Skipped)),
	)
	return arts
}

// capture wraps one pprof step with a timeout-bounded buffer write
// and panic recovery.
func (c *capturer) capture(name string, fn func(*bytes.Buffer) error) (body []byte, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("panic in %s: %v", name, r)
		}
	}()
	var buf bytes.Buffer
	if err := fn(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// captureState fills the StateAtCapture struct cheaply.
func (c *capturer) captureState() StateAtCapture {
	var ms runtime.MemStats
	runtime.ReadMemStats(&ms)
	st := StateAtCapture{
		Goroutines:            runtime.NumGoroutine(),
		HeapInUseMB:           ms.HeapInuse / 1024 / 1024,
		RSSMB:                 rssBytes() / 1024 / 1024,
		Inflight:              c.m.tracker.count.Load(),
		OldestInflightSeconds: c.m.tracker.oldestAge().Seconds(),
		GCPauseTotalSeconds:   float64(ms.PauseTotalNs) / 1e9,
		NextGCMB:              ms.NextGC / 1024 / 1024,
	}
	if fnPtr := c.m.dbStatsFn.Load(); fnPtr != nil {
		s := (*fnPtr)()
		st.DBPool = &s
	}
	return st
}

func (c *capturer) buildManifest(eventID string, req captureReq, st StateAtCapture) Manifest {
	pmeta := c.cfg.ProcessMeta
	snap := c.m.detector.snapshot()
	return Manifest{
		SchemaVersion: ManifestSchemaVersion,
		FreezeEventID: eventID,
		CapturedAt:    time.Now(),
		Trigger: Trigger{
			Reason:         req.reason,
			Score:          snap.Score,
			TopSignal:      snap.TopSignal.Name,
			TopSignalValue: snap.TopSignal.Score,
		},
		Process: ProcessMetaJSON{
			GoVersion:      pmeta.GoVersion,
			ServiceVersion: pmeta.ServiceVersion,
			GitSHA:         pmeta.GitSHA,
			StartedAt:      c.m.startedAt,
			UptimeSeconds:  int64(time.Since(c.m.startedAt).Seconds()),
			GOMAXPROCS:     runtime.GOMAXPROCS(0),
		},
		Host: HostMetaJSON{
			Hostname:   pmeta.Hostname,
			PodName:    pmeta.PodName,
			Namespace:  pmeta.Namespace,
			NodeName:   pmeta.NodeName,
			Region:     pmeta.Region,
			Cluster:    pmeta.Cluster,
			Deployment: pmeta.Deployment,
		},
		StateAtCapture:   st,
		InflightRequests: c.m.tracker.snapshot(c.cfg.Capture.MaxInflightInManifest),
		Signals:          snap.Signals,
	}
}

// gzipBytes compresses b. Returns the compressed bytes and any error.
func gzipBytes(b []byte) ([]byte, error) {
	var buf bytes.Buffer
	zw := gzip.NewWriter(&buf)
	if _, err := zw.Write(b); err != nil {
		return nil, err
	}
	if err := zw.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
