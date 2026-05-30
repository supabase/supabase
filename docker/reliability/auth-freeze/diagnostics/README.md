# freezekit — automatic freeze-diagnostics framework for GoTrue

> **Mission:** when the GoTrue process is partially frozen — `/health`
> green, DB-backed paths wedged — capture every piece of runtime
> forensic state that a senior engineer would need to root-cause it,
> *before* a restart obliterates the evidence.

This is the diagnostics companion to the freeze *detection* work in
the parent directory. The parent's deep-probe sidecar tells you "the
auth service is wedged"; **freezekit tells you why**.

It is designed to embed inside `supabase/auth` itself (preferred), or
run as a sidecar for operators who can't patch upstream yet.

---

## Table of Contents

1.  [Design principles](#design-principles)
2.  [Architecture](#architecture)
3.  [Phase 1 — Freeze Detection](#phase-1--freeze-detection)
4.  [Phase 2 — Runtime Artifact Capture](#phase-2--runtime-artifact-capture)
5.  [Phase 3 — Safe Production Upload Pipeline](#phase-3--safe-production-upload-pipeline)
6.  [Phase 4 — Correlation & Traceability](#phase-4--correlation--traceability)
7.  [Phase 5 — Anti-Storm Protections](#phase-5--anti-storm-protections)
8.  [Phase 6 — Kubernetes Integration](#phase-6--kubernetes-integration)
9.  [Phase 7 — Go Implementation map](#phase-7--go-implementation-map)
10. [Phase 8 — Observability](#phase-8--observability)
11. [Phase 9 — Testing & Chaos Engineering](#phase-9--testing--chaos-engineering)
12. [Phase 10 — Rollout Plan](#phase-10--rollout-plan)
13. [Critical safety constraints](#critical-safety-constraints)
14. [Embedding guide (`supabase/auth`)](#embedding-guide-supabaseauth)
15. [Operating guide](#operating-guide)

---

## Design principles

These are non-negotiable. Every line of code in `freezekit/` is
defensible against this list.

1. **Never worsen the outage.** If freezekit itself panics, hangs,
   or runs out of memory, the auth service must continue running. All
   work happens on dedicated goroutines, never on a request path.
2. **Useful when the rest of the process isn't.** The detector and
   capture pipeline must work even when the DB pool is wedged, the
   logger is blocked on a slow stderr, or the mutex profile is hot.
3. **Bounded everything.** Bounded memory (heap profile gated on RSS),
   bounded disk (local sink has LRU eviction), bounded CPU (capture
   rate-limited), bounded upload bandwidth (token bucket), bounded
   channels (drop-policy on overflow).
4. **Default-safe, opt-in escalation.** First wave: metrics only.
   Second wave: local dumps. Third wave: uploads. Fourth wave:
   automatic triggering. Each wave is a feature flag with a
   single-flag kill switch.
5. **Cloud-agnostic core.** Core package is stdlib-only. Sinks are
   pluggable; AWS/GCS SDKs are deliberately *not* a dependency. The
   reference upload path is HTTPS PUT to a pre-signed URL — which
   works for S3, GCS, R2, Azure Blob, MinIO and Tigris without any
   extra dependency.
6. **Forensic-first formats.** Every artifact is the canonical
   pprof binary format (so `go tool pprof` works), plus a JSON
   manifest with the timeline + correlation metadata.

---

## Architecture

```
                ┌─────────────────────────────────────────────────────┐
                │            GoTrue process (or sidecar)              │
                │                                                     │
                │   ┌──────────────┐    ┌──────────────────────────┐  │
   incoming     │   │ HTTP middl.  │───►│   In-flight tracker      │  │
   /token, ────►│   │ correlation  │    │   (oldest age, snapshot) │  │
   /admin/…     │   └──────────────┘    └──────────────┬───────────┘  │
                │                                      │              │
                │   ┌──────────────────────────────────▼───────────┐  │
                │   │      Signal samplers (every 5s)              │  │
                │   │   - oldestInflight  - goroutineSpike         │  │
                │   │   - dbPoolWait      - schedulerLatency       │  │
                │   │   - mutexContention - heartbeatStall         │  │
                │   │   - zeroSuccessRate                          │  │
                │   └──────────────┬───────────────────────────────┘  │
                │                  │ score ∈ [0,1] per signal         │
                │                  ▼                                  │
                │   ┌──────────────────────────────────────────────┐  │
                │   │   Detector state machine                     │  │
                │   │   NORMAL → WARNING → DEGRADED                │  │
                │   │          → FREEZE_DETECTED → CAPTURE_COMPLETE│  │
                │   └──────────────┬───────────────────────────────┘  │
                │                  │ TriggerCapture(reason)           │
                │                  ▼                                  │
                │   ┌──────────────────────────────────────────────┐  │
                │   │   Rate limiter + circuit breaker             │  │
                │   │   (token bucket, max N/hour, adaptive cooldown)│ │
                │   └──────────────┬───────────────────────────────┘  │
                │                  ▼                                  │
                │   ┌──────────────────────────────────────────────┐  │
                │   │   Capture worker (single goroutine)          │  │
                │   │   1. manifest (correlation + inflight snap)  │  │
                │   │   2. goroutine pprof (debug=2 text + binary) │  │
                │   │   3. block profile                           │  │
                │   │   4. mutex profile                           │  │
                │   │   5. threadcreate profile                    │  │
                │   │   6. runtime/metrics snapshot                │  │
                │   │   7. heap profile (LAST + RSS-gated)         │  │
                │   └──────────────┬───────────────────────────────┘  │
                │                  ▼                                  │
                │   ┌──────────────────────────────────────────────┐  │
                │   │   Bounded artifact channel (cap=4, drop on   │  │
                │   │   full so the capture worker never blocks)   │  │
                │   └──────────────┬───────────────────────────────┘  │
                │                  ▼                                  │
                │   ┌──────────────────────────────────────────────┐  │
                │   │   Async upload workers (2)                   │  │
                │   │   - LocalSink (always)                       │  │
                │   │   - SignedURLSink (S3/GCS/R2/Azure/MinIO)    │  │
                │   │   - MultiSink fan-out                        │  │
                │   └──────────────────────────────────────────────┘  │
                │                                                     │
                │   Self-watchdog: if capture worker hasn't ticked    │
                │   in 60s, fire freezekit_self_stall alert and       │
                │   restart the worker goroutine.                     │
                └─────────────────────────────────────────────────────┘
```

The hot path adds **one map insert + one atomic gauge update** per
request (~50 ns). All heavy work is on the capture/upload goroutines.

---

## Phase 1 — Freeze Detection

### Signals

Each signal returns a score in `[0.0, 1.0]`. Scores are combined into
a *severity* via:

```
severity = max( weightedSum(signals), max(individualSignals) )
```

The `max(individual)` term ensures a single catastrophic signal (e.g.
oldest inflight = 5 minutes) trips the detector even if other signals
look normal. The weighted-sum captures multi-signal degradation that
no individual signal would catch.

Built-in signals (`signals.go`):

| Signal               | Score formula                                                    | Default trigger | Default weight |
| -------------------- | ---------------------------------------------------------------- | --------------- | -------------- |
| `OldestInflight`     | `clamp(age / threshold)` where threshold = 45s                   | age > 45s       | 1.0            |
| `ZeroSuccessRate`    | `1` if (requests > 0 AND 2xx == 0 for window)                    | window = 60s    | 0.9            |
| `GoroutineSpike`     | `clamp((current - baseline) / (max - baseline))`                 | max = 50k       | 0.6            |
| `DBPoolWait`         | `clamp(p99_wait_ms / threshold_ms)` (via callback)               | 5s              | 0.8            |
| `SchedulerLatency`   | `clamp(p99_ms / threshold_ms)` from `runtime/metrics`            | 100ms           | 0.5            |
| `MutexContention`    | `clamp(seconds_per_sec / threshold)` from `runtime/metrics`      | 1.0             | 0.5            |
| `Heartbeat`          | `1` if internal heartbeat hasn't ticked in N×interval            | 3× interval     | 1.0            |

### State machine

```
                          score < 0.4
        ┌─────────────────────────────────────────────────────┐
        │                                                     ▼
   ┌─────────┐  ≥0.4  ┌─────────┐  ≥0.7  ┌──────────┐  ≥0.9 ┌──────────────────┐
   │ NORMAL  │───────►│ WARNING │───────►│ DEGRADED │──────►│ FREEZE_DETECTED  │
   └─────────┘        └─────────┘        └──────────┘       └────────┬─────────┘
                                                                     │ TriggerCapture
                                                                     ▼
                                                            ┌──────────────────┐
                                                            │ CAPTURE_COMPLETE │
                                                            └────────┬─────────┘
                                                                     │ cooldown
                                                                     ▼
                                                                ( NORMAL )
```

Transitions UP require **N consecutive samples above threshold**
(default N=3, sample interval 5s → 15s debounce). Transitions DOWN
require **all signals below threshold for cooldown** (default 5
minutes). This eliminates flap during borderline conditions.

CAPTURE_COMPLETE is a sticky state: while in it, no further captures
are triggered, regardless of signal state. After cooldown, returns
to NORMAL and re-arms.

### Why not a single threshold?

Single-threshold detectors are notorious for false positives at the
boundary. The scoring approach lets us encode operator intuition
("DB pool wait alone is bad; goroutine spike alone is bad; but DB
wait *plus* goroutine spike *plus* zero success rate together is a
five-alarm fire even if no single one is at threshold").

### Why not just Prometheus alerts?

Three reasons:
1. **Capture must happen in-process.** Prometheus alerts fire after
   scrape latency + alert-eval-interval + Alertmanager debouncing
   (≥ 1 minute typical). By the time a Slack message arrives, the
   process may have been restarted. In-process detection captures
   evidence within seconds of the freeze.
2. **The signals that matter aren't all exportable.** `runtime/metrics`
   scheduler latency, mutex profile rates, and in-process channel
   depths are cheap to read in-process and expensive to expose.
3. **Defense in depth.** Prometheus alerts and freezekit detection
   should agree. When they disagree, one of them is buggy and we
   want to know.

---

## Phase 2 — Runtime Artifact Capture

Capture is **strictly ordered**, cheapest first, most-dangerous last:

| # | Artifact          | Method                                                 | Cost   | Safety notes                                                   |
| - | ----------------- | ------------------------------------------------------ | ------ | -------------------------------------------------------------- |
| 1 | Manifest          | JSON marshal of in-memory metadata                     | <1 ms  | Always safe.                                                   |
| 2 | Goroutine (text)  | `pprof.Lookup("goroutine").WriteTo(w, 2)`              | ~50 ms | Stops the world briefly. Text form is human-readable.          |
| 3 | Goroutine (proto) | `pprof.Lookup("goroutine").WriteTo(w, 0)`              | ~30 ms | Same STW. Binary form for `go tool pprof`.                     |
| 4 | Block profile     | `pprof.Lookup("block").WriteTo(w, 0)`                  | ~10 ms | Only meaningful if `SetBlockProfileRate(>0)` was set.          |
| 5 | Mutex profile     | `pprof.Lookup("mutex").WriteTo(w, 0)`                  | ~10 ms | Only meaningful if `SetMutexProfileFraction(>0)` was set.      |
| 6 | Threadcreate      | `pprof.Lookup("threadcreate").WriteTo(w, 0)`           | ~5 ms  | Detects OS-thread leaks (often from blocking syscalls).        |
| 7 | Runtime metrics   | `runtime/metrics.Read([]Sample)`                       | <1 ms  | All gauges + histograms in one call.                           |
| 8 | Heap (proto)      | `pprof.WriteHeapProfile(w)`                            | ~200ms+| **GC + alloc spike.** Skipped if RSS > `heap_skip_rss_mb`.    |

### Profile-rate tuning

```go
// One-time, at process start.
runtime.SetBlockProfileRate(10_000)    // sample if blocked > 10µs
runtime.SetMutexProfileFraction(100)   // sample 1% of contended mutex ops
```

These rates are the **upstream-recommended production defaults**.
They produce useful profiles with <1% overhead in benchmark tests.
Both rates are configurable via `FREEZEKIT_BLOCK_PROFILE_RATE_NS`
and `FREEZEKIT_MUTEX_PROFILE_FRACTION`. Set to 0 to disable.

### Why the strict order

* Manifest first: even if capture is interrupted by OOM kill, we
  still have the correlation metadata.
* Goroutine text first (after manifest): the single most valuable
  artifact. ~50 ms of STW is acceptable; we wouldn't want to lose
  this if a later step crashes.
* Heap last: the *only* artifact that can OOM the process during
  capture. If we skip it, we still have everything else.

### Heap-capture safety gate

```go
if rssBytes() > cfg.HeapSkipRSSBytes {
    manifest.Skipped = append(manifest.Skipped, "heap: rss above threshold")
    return
}
```

`rssBytes()` reads `/proc/self/status` (Linux) or returns 0
(fallback — heap capture proceeds). The default
`HeapSkipRSSBytes` is 80% of the cgroup memory limit if detectable,
else 4 GiB.

---

## Phase 3 — Safe Production Upload Pipeline

### Sink interface

```go
type Sink interface {
    // Put writes the artifact to the sink. The caller guarantees:
    //   - data is non-nil
    //   - ctx has a sane deadline
    // Implementations MUST be safe to call concurrently.
    Put(ctx context.Context, art Artifact) error

    // Health returns nil if the sink is currently usable. Used by
    // the circuit breaker to skip a known-broken sink without
    // burning the upload-retry budget.
    Health(ctx context.Context) error

    // Name is used in metrics labels and logs.
    Name() string
}
```

### Built-in sinks (`sink.go`)

| Sink            | Use case                                | Auth                         | Failure mode                       |
| --------------- | --------------------------------------- | ---------------------------- | ---------------------------------- |
| `NoopSink`      | metrics-only mode (Wave 1)              | -                            | -                                  |
| `LocalSink`     | always-on fallback; bounded disk        | -                            | LRU-evicts oldest when over budget |
| `SignedURLSink` | S3 / GCS / R2 / Azure / MinIO / Tigris  | URL is pre-signed by caller  | falls back to LocalSink on error   |
| `MultiSink`     | fan-out to local + cloud                | composed                     | aggregate error, both attempted    |

### Pre-signed URL flow (cloud-agnostic, no SDK)

```
       ┌──────────────┐   1. GET /signurl?key=…    ┌────────────────────┐
       │   freezekit  │ ─────────────────────────► │ small metadata svc │
       │              │                            │  (PutObject IAM)   │
       │              │ ◄───── PUT URL + headers ──│                    │
       │              │                            └────────────────────┘
       │              │                                       │
       │              │   2. PUT bytes (HTTPS, stdlib only)   │
       │              │ ───────────────────────────────────────► S3 / R2 / GCS
       └──────────────┘
```

Why pre-signed URLs:

1. **No SDK dependency.** Pulling `aws-sdk-go-v2` into GoTrue adds
   ~25 MiB of compiled binary. Doing it via signed URLs keeps the
   binary lean and removes a whole class of dep-rot risk.
2. **Privilege isolation.** The auth pod never holds AWS credentials.
   A separate small "url signer" service holds an IAM role with
   strictly `s3:PutObject` on the diagnostics bucket. Compromise of
   the auth pod cannot exfiltrate from S3 nor escalate.
3. **Works everywhere.** Pre-signed PUT URLs are supported identically
   by S3, GCS (V4 signing), R2, MinIO, Tigris, Azure Blob (SAS),
   and any S3-compatible store.

The signer service is **not** part of this PR — operators ship it
in whatever language they prefer, or use a sidecar like
[`s3-presign-server`](https://github.com/various/options). A minimal
example is shown in `examples/sign-server/`.

### Compression & chunking

* All text artifacts (goroutine debug=2) are gzipped before upload.
* All binary pprof artifacts are *not* re-compressed; pprof's own
  format is already gzipped.
* No chunking — the artifacts are small (<10 MiB total per capture)
  and S3 multipart adds complexity that's not justified here.

### Upload retry

* 3 attempts with exponential backoff (1s, 4s, 16s, capped by ctx).
* Each attempt has its own bounded timeout (default 30s).
* On final failure, the artifact is left on disk via `LocalSink` and
  an operator can run a small reconciliation script.

### Backpressure

The capture worker writes to a `chan Artifact` with **cap=4**. If
all 4 slots are full (upload workers stuck), the capture worker
*drops* the new artifact and increments `freezekit_artifacts_dropped_total`.
The drop is logged but does NOT block. This is the most important
backpressure rule: **the capture worker never blocks on the upload
worker**, because doing so would let an outage of the storage backend
block the next freeze capture.

---

## Phase 4 — Correlation & Traceability

### Manifest schema

Every capture emits a `manifest.json` artifact with:

```jsonc
{
  "schema_version":  "1",
  "freeze_event_id": "ulid-01HPV7XF…",
  "captured_at":     "2026-05-30T22:14:11.234Z",
  "trigger":         { "reason": "score>=0.9", "score": 0.94,
                       "top_signal": "oldest_inflight",
                       "top_signal_value": 78.2 },

  "process": {
    "go_version":      "go1.22.4",
    "gotrue_version":  "v2.186.0",
    "git_sha":         "a1b2c3d",
    "started_at":      "2026-05-30T19:02:03.000Z",
    "uptime_seconds":  11528,
    "gomaxprocs":      4
  },

  "host": {
    "hostname":        "supabase-auth-0",
    "pod_name":        "supabase-auth-7f8b6c-zx2k1",
    "namespace":       "supabase",
    "node_name":       "ip-10-0-1-23.us-east-1.compute.internal",
    "region":          "us-east-1",
    "cluster":         "supabase-prod-use1"
  },

  "state_at_capture": {
    "goroutines":      12483,
    "heap_in_use_mb":  287,
    "rss_mb":          412,
    "cpu_percent":     2.4,
    "inflight":        207,
    "oldest_inflight_seconds": 78.2,
    "db_pool":         { "in_use": 25, "idle": 0, "max": 25,
                         "wait_count": 1842, "wait_duration_ms": 91234 }
  },

  "inflight_requests": [
    { "id":   "req_01HPV7…",
      "route":"/token",
      "method":"POST",
      "started_at":"2026-05-30T22:13:00.000Z",
      "age_seconds": 71.2,
      "trace_id": "b3:…",
      "user_id":  null,                   // redacted by default
      "client_ip_hash": "sha256:…"        // hashed by default
    }
    // … up to MaxInflightInManifest (default 50, oldest first)
  ],

  "active_routes": ["/token", "/admin/users", "/admin/users/:id"],

  "signals": [
    { "name":"oldest_inflight",   "score":1.0, "window":"latest" },
    { "name":"zero_success_rate", "score":1.0, "window":"60s" },
    { "name":"db_pool_wait",      "score":0.82,"window":"30s" },
    { "name":"goroutine_spike",   "score":0.44,"window":"latest" }
  ],

  "artifacts": [
    { "name":"goroutine.txt.gz", "bytes": 124518, "sha256":"…" },
    { "name":"goroutine.pb.gz",  "bytes":  68441, "sha256":"…" },
    { "name":"block.pb.gz",      "bytes":   2811, "sha256":"…" },
    { "name":"mutex.pb.gz",      "bytes":   1944, "sha256":"…" },
    { "name":"threadcreate.pb.gz","bytes":   831, "sha256":"…" },
    { "name":"metrics.json.gz",  "bytes":   4218, "sha256":"…" }
  ],
  "skipped": ["heap: rss above 80% cgroup limit"]
}
```

### `freeze_event_id`

A [ULID](https://github.com/ulid/spec) so events sort lexicographically
by time, which is the dominant access pattern (operator: "show me
yesterday's freezes"). The framework generates it without an external
ULID library — a 16-byte buffer of `crypto/rand` + millisecond
timestamp encoded in Crockford base32.

### Cross-system correlation

* Every artifact filename embeds the `freeze_event_id` so artifacts
  are co-located in storage:
  `auth/<region>/<pod>/<event_id>/{manifest.json,goroutine.txt.gz,…}`.
* The `freeze_event_id` is logged via the structured logger so it
  appears in Loki / Logflare / Datadog.
* The event is also emitted as a Prometheus annotation via
  `freezekit_freeze_events_total{freeze_event_id="…"}` (cardinality
  bounded: ULIDs are pruned after 1h).
* When OpenTelemetry tracing is configured, the manifest carries
  `trace_id` for every inflight request so operators can pivot
  from a freeze event into the per-request traces.

### Request correlation IDs

The HTTP middleware extracts (or generates) a request ID:

```go
// Preference order: existing X-Request-Id → existing W3C traceparent → new ULID.
```

The ID is stored in `r.Context()` under `freezekit.RequestIDKey`,
propagated via `X-Request-Id` on the response, and used as the row
key in the in-flight tracker. When a freeze fires, the manifest's
`inflight_requests` list ties every wedged handler to the request
ID it serves — and therefore to the upstream log line.

### PII redaction

`user_id`, `email`, `client_ip` and any header values are **never**
recorded by default. The middleware accepts a `RedactionPolicy`:

```go
type RedactionPolicy struct {
    HashClientIP   bool   // default true; SHA-256 with per-process salt
    IncludeUserID  bool   // default false
    IncludeHeaders []string // explicit allowlist; default []
}
```

Operators who legally need full IPs can opt in; the default is
SOC2/GDPR-safe.

---

## Phase 5 — Anti-Storm Protections

A freeze-diagnostics framework that crashes the process during a
freeze is worse than no framework. Storm protection is layered:

| Layer                | Mechanism                                             | Hard limit          |
| -------------------- | ----------------------------------------------------- | ------------------- |
| Detector cooldown    | After CAPTURE_COMPLETE, ignore signals for N minutes  | 5 min (configurable) |
| Capture rate limit   | Token bucket: capacity 1, refill 1 per 10 min         | 6 / hour            |
| Adaptive backoff     | After 3 captures in 1h, double cooldown until 1h max   | exponential          |
| Capture concurrency  | Single goroutine; second trigger is dropped + counted  | 1 in-flight         |
| Probabilistic sample | `FREEZEKIT_SAMPLE_RATE` (0–1.0) skips fraction        | n/a                 |
| Upload concurrency   | Bounded worker pool (default 2)                       | 2 inflight          |
| Local disk budget    | LRU-evict oldest manifest dir when over N MiB         | 256 MiB             |
| Channel cap          | Drop on full (no blocking)                            | cap=4               |
| Self-circuit breaker | If 5 consecutive captures fail, disable for 1h         | 5 → 1h              |
| Kill switch          | `FREEZEKIT_DISABLED=true` env or `freezekit.Disable()` | global              |

### Why a capacity-1 token bucket

A freeze is, almost by definition, a long-duration event. Once you
have one good dump, a second dump 30 seconds later is unlikely to
provide new information; it just doubles your disk + upload cost.
The default refill rate (1 per 10 min) gives you a fresh dump every
10 minutes during a sustained incident — more than enough to track
evolution, far less than enough to storm.

---

## Phase 6 — Kubernetes Integration

### Sidecar vs embedded?

| Mode      | Pros                                              | Cons                                                  |
| --------- | ------------------------------------------------- | ----------------------------------------------------- |
| Embedded  | Direct access to inflight tracker + DB pool stats | Requires patching GoTrue (upstream PR)                |
| Sidecar   | Zero changes to GoTrue                            | Limited to what `/debug/pprof` exposes                |

**Recommendation:** embedded everywhere we can, sidecar everywhere
we can't (yet). The sidecar in `cmd/freezekit-sidecar/` is the
"deploy-today" path while the embedded patches go through canary.

### Deployment manifest

`k8s/auth-deployment-with-freezekit.yaml` updates the parent
directory's manifest with:

* Sidecar container `freezekit-sidecar` (256 MiB memory, 100m CPU).
* `emptyDir` volume `freezekit-tmp` (`sizeLimit: 512Mi`) shared
  between the auth container and the sidecar.
* `preStop` hook on the auth container: triggers a final dump
  before SIGTERM propagates (see below).
* `terminationGracePeriodSeconds: 90` so a final dump can complete.

### SIGTERM-triggered final dump

```yaml
lifecycle:
  preStop:
    exec:
      command:
        - /bin/sh
        - -c
        - |
          # Tell freezekit to dump synchronously, then sleep so
          # the pod is removed from Service endpoints before we exit.
          curl -fsS -X POST -m 30 http://localhost:9100/debug/freezekit/capture?reason=preStop || true
          sleep 15
```

The sidecar's `/debug/freezekit/capture` does *not* respect the rate
limiter (it's a one-shot, operator/lifecycle-initiated).

### preStop hook script

`k8s/preStop.sh` is the reference implementation. Single-file,
POSIX, no bashisms. Mountable via ConfigMap.

### Ephemeral storage budgeting

* Each capture is ~5 MiB compressed.
* `LocalSink` default budget: 256 MiB → ~50 captures retained.
* Pod `emptyDir.sizeLimit: 512Mi` → kubelet evicts the pod if local
  storage exceeds limit. We never want this for capture data; the
  256 MiB freezekit budget is half the sizeLimit specifically to
  give kubelet a comfortable margin.

### Surviving rolling deploys

* Captures are uploaded *as soon as* they're written; not on
  shutdown. The preStop hook is the last-resort capture, not the
  primary upload trigger.
* The local fallback survives across pod restarts only if
  `emptyDir` is replaced by a PVC. For most setups the cost of a
  PVC isn't justified — the cloud sink is the durable copy.

### Node-level impact

* `pprof.WriteHeapProfile` does a full GC. On a 4 GiB heap that's
  ~80 ms of CPU. We rate-limit and budget for this.
* Goroutine dump with `debug=2` is `runtime.Stack(buf, true)` which
  briefly stops the world. For 10k goroutines, ~30 ms STW. The
  ZeroSuccessRate signal explicitly accounts for this — if a
  capture STW causes a 30 ms blip, we don't want to interpret it
  as another freeze.

---

## Phase 7 — Go Implementation map

This directory's `freezekit/` package implements the design above.

```
freezekit/
├── doc.go               package overview + public API contract
├── config.go            Config struct, env loader, validation, defaults
├── freezekit.go         Manager type: New, Run, Shutdown, TriggerCapture
├── detector.go          state machine NORMAL→…→CAPTURE_COMPLETE
├── signals.go           Signal interface + 7 built-in signals
├── inflight.go          request tracker (oldest age, snapshot, route map)
├── middleware.go        net/http middleware with correlation IDs
├── capture.go           orchestrated pprof capture pipeline
├── runtime_metrics.go   runtime/metrics snapshot collector
├── manifest.go          Manifest schema + ULID + JSON marshal
├── sink.go              Sink interface + NoopSink + LocalSink + MultiSink + SignedURLSink
├── rate.go              token bucket + circuit breaker + adaptive backoff
├── metrics.go           Prometheus metrics (or registry-agnostic)
└── freezekit_test.go    unit + chaos tests
```

All files together are ~1800 lines of Go. Public API surface is
~20 exported types, ~40 exported funcs/methods — small enough that a
maintainer can hold the contract in their head.

### Embedding API summary

```go
// In supabase/auth's cmd/serve.go:
fk, _ := freezekit.New(freezekit.LoadConfigFromEnv())
defer fk.Shutdown(context.Background())

go fk.Run(ctx)

// In api/api.go on the chi router:
r.Use(fk.HTTPMiddleware())

// Optional: hand the DB stats sampler our callback.
fk.SetDBPoolStatsFunc(func() freezekit.DBPoolStats {
    s := db.Stats()
    return freezekit.DBPoolStats{
        InUse: s.InUse, Idle: s.Idle, Max: s.MaxOpenConnections,
        WaitCount: s.WaitCount, WaitDurationMS: s.WaitDuration.Milliseconds(),
    }
})

// Optional: wire to the existing /admin namespace for ops endpoints
// (under existing service-role auth):
r.Route("/debug/freezekit", fk.MountDebugRoutes)
```

---

## Phase 8 — Observability

### Metrics emitted (`metrics.go`)

| Metric                                       | Type      | Labels                  | Notes                                              |
| -------------------------------------------- | --------- | ----------------------- | -------------------------------------------------- |
| `freezekit_state`                            | gauge     | -                       | 0=NORMAL, 1=WARNING, 2=DEGRADED, 3=FREEZE_DETECTED, 4=CAPTURE_COMPLETE |
| `freezekit_signal_score`                     | gauge     | signal                  | latest score per signal                            |
| `freezekit_freeze_events_total`              | counter   | -                       | total CAPTURE_COMPLETE events                      |
| `freezekit_captures_started_total`           | counter   | trigger                 | trigger ∈ {auto, manual, preStop}                  |
| `freezekit_captures_completed_total`         | counter   | result                  | result ∈ {ok, partial, failed}                     |
| `freezekit_capture_duration_seconds`         | histogram | -                       | end-to-end                                         |
| `freezekit_artifact_bytes`                   | histogram | artifact                | size per artifact type                             |
| `freezekit_artifacts_dropped_total`          | counter   | reason                  | reason ∈ {channel_full, rate_limited, sample_skip} |
| `freezekit_sink_uploads_total`               | counter   | sink, result            | per-sink success/failure                           |
| `freezekit_sink_upload_duration_seconds`     | histogram | sink                    |                                                    |
| `freezekit_oldest_inflight_seconds`          | gauge     | -                       | also useful as a freeze precursor                  |
| `freezekit_goroutines`                       | gauge     | -                       | `runtime.NumGoroutine()`                           |
| `freezekit_mutex_contention_seconds_total`   | gauge     | -                       | from `runtime/metrics`                             |
| `freezekit_self_stall_total`                 | counter   | -                       | freezekit's own watchdog tripped                   |
| `freezekit_local_disk_used_bytes`            | gauge     | -                       | bounded by `LocalDiskBudgetBytes`                  |
| `freezekit_local_disk_evictions_total`       | counter   | -                       | LRU evictions                                      |

### Alerts (`observability/alerts.yml`)

* `FreezekitDetected` — any FREEZE_DETECTED state for >30s. Page.
* `FreezekitCaptureFailing` — capture failed 3+ times in 1h. Warn.
* `FreezekitUploadFailing` — sink upload failure rate >50% in 1h. Warn.
* `FreezekitSelfStall` — self-watchdog tripped. Warn — *meta-alert*.
* `FreezekitDisabled` — `freezekit_state` absent. Warn — meta.
* `FreezekitDiskUsageHigh` — local disk >80% of budget. Warn.

### Dashboard (`observability/dashboard.json`)

7 panels:
1. State stat (NORMAL/WARNING/DEGRADED/FREEZE/CAPTURE)
2. Signal-score time series (one line per signal)
3. Captures per hour (counter rate)
4. Capture duration histogram heatmap
5. Sink success-vs-failure stacked bar
6. Inflight + oldest-age dual-axis
7. Self-stall + dropped-artifact counters

---

## Phase 9 — Testing & Chaos Engineering

### Unit tests (`freezekit_test.go`)

* `TestDetector_StateMachine_Transitions` — feed known scores, assert
  exact transitions (including debounce).
* `TestRateLimiter_TokenBucket` — virtual clock; assert capacity and
  refill.
* `TestCircuitBreaker_Trip_Recover` — simulate failures.
* `TestLocalSink_LRU_Evicts_When_OverBudget` — write past budget,
  assert oldest dir removed.
* `TestSignedURLSink_RetryThenFail` — `httptest.Server` returning
  503; assert retry pattern.
* `TestManifest_RedactsPIIByDefault` — assert no email/IP/user_id.

### Chaos tests (`freezekit_test.go` + `chaos/`)

Each chaos primitive is a function that the test harness calls
during a running freezekit instance, then asserts:
1. Detector entered FREEZE_DETECTED within N seconds.
2. Capture artifacts written with expected fields.
3. No additional capture within cooldown.
4. Process is still serving `/healthz`.

| Chaos                  | Inject                                                 | Asserts                            |
| ---------------------- | ------------------------------------------------------ | ---------------------------------- |
| `deadlock`             | two goroutines acquire two mutexes in opposite order   | goroutine dump shows both waits    |
| `channel_hang`         | spawn goroutine that blocks on `<-make(chan int)`      | block profile non-empty            |
| `mutex_contention`     | 100 goroutines hammer one mutex                        | mutex profile non-empty            |
| `goroutine_leak`       | spawn N goroutines that wait on a chan that never closes | goroutine count gauge spike     |
| `db_starvation`        | block all DB-pool connections                          | `DBPoolWait` signal trips          |
| `infinite_wait`        | a handler does `select{}`                              | OldestInflight signal trips        |
| `scheduler_starvation` | spin a few goroutines in tight `for{}`                 | SchedulerLatency signal trips      |

The chaos primitives live in their own package
(`docker/reliability/auth-freeze/diagnostics/chaos`) so they cannot
accidentally end up in a production binary.

### k6 integration

`chaos/k6-freeze-capture.js` extends the parent directory's k6
script to also wait for the freezekit metrics endpoint to report
`freezekit_freeze_events_total >= 1` and asserts the capture
duration is `< 5s`.

### CI

A new GitHub Actions workflow (`docker/reliability/auth-freeze/diagnostics/.github-workflow.yml`)
runs the chaos tests on every PR. Total runtime budget: <2 min.

---

## Phase 10 — Rollout Plan

| Wave | What turns on                                          | Risk     | Bake time     |
| ---- | ------------------------------------------------------ | -------- | ------------- |
| 1    | `freezekit.New(...)`, **metrics only**                 | very low | 1 week        |
| 2    | LocalSink enabled (`FREEZEKIT_SINK=local`)             | low      | 1 week        |
| 3    | SignedURLSink enabled (`FREEZEKIT_SINK=multi`, signer service deployed) | low | 1 week |
| 4    | Detector + capture enabled in **5% canary**            | medium   | 1 week        |
| 5    | Detector + capture enabled fleet-wide                  | medium   | indefinite    |

Feature flags:

| Env                                  | Default | Effect                                                     |
| ------------------------------------ | ------- | ---------------------------------------------------------- |
| `FREEZEKIT_DISABLED`                 | false   | Global kill switch. Nothing runs.                          |
| `FREEZEKIT_DETECTOR_ENABLED`         | false   | Wave 4+: detector runs, automatic captures allowed         |
| `FREEZEKIT_SINK`                     | noop    | `noop` | `local` | `signed-url` | `multi`               |
| `FREEZEKIT_SAMPLE_RATE`              | 1.0     | Probabilistic skip                                         |
| `FREEZEKIT_MAX_CAPTURES_PER_HOUR`    | 6       | Hard ceiling                                               |
| `FREEZEKIT_HEAP_CAPTURE_ENABLED`     | true    | Skip the dangerous one if needed                           |
| `FREEZEKIT_HEAP_SKIP_RSS_MB`         | auto    | Override the RSS-based heap-skip threshold                 |
| `FREEZEKIT_BLOCK_PROFILE_RATE_NS`    | 10000   | 0 disables block profiling                                 |
| `FREEZEKIT_MUTEX_PROFILE_FRACTION`   | 100     | 0 disables mutex profiling                                 |

Rollback per wave = flip the env flag back. Nothing in freezekit
modifies external state (DB schema, file permissions, etc.) so
rollback is instantaneous.

---

## Critical safety constraints

These are the rules the implementation enforces:

1. **The capture worker never blocks on an upload.** Capture writes
   to a `chan Artifact` with a finite cap; if full, drop.
2. **The detector never blocks on a capture.** Detector calls
   `TriggerCapture()` which atomically transitions to
   `FREEZE_DETECTED` and returns; the capture worker picks it up.
3. **Heap capture is gated on RSS.** Always skip if RSS > threshold.
4. **`recover()` wraps every goroutine.** A panic in any worker
   logs + increments a counter + restarts the worker; never propagates.
5. **Every sink call has a context with a deadline.** No naked
   `http.Post`s.
6. **No global mutex held across user code.** All maps protected by
   short-scope mutexes; no defer-unlock across an upload.
7. **The self-watchdog can kill freezekit but never the process.**
   If freezekit's worker hasn't ticked in 60s, freezekit disables
   itself and emits `freezekit_self_stall_total`.
8. **No reflection-based recursion in panic recovery.** A panicking
   capture cannot trigger another capture.

---

## Embedding guide (`supabase/auth`)

Three-line drop-in:

```go
fk, _ := freezekit.New(freezekit.LoadConfigFromEnv())
defer fk.Shutdown(context.Background())
go fk.Run(ctx)
```

Wire into the chi router:

```go
r.Use(fk.HTTPMiddleware())
```

Optional: feed in DB pool stats so the `DBPoolWait` signal works
properly (without this, the signal returns 0):

```go
fk.SetDBPoolStatsFunc(func() freezekit.DBPoolStats {
    s := db.Stats()
    return freezekit.DBPoolStats{
        InUse:           s.InUse,
        Idle:            s.Idle,
        Max:             s.MaxOpenConnections,
        WaitCount:       s.WaitCount,
        WaitDurationMS:  s.WaitDuration.Milliseconds(),
    }
})
```

That is the entire integration. The metrics endpoint is exposed
under `:9100/metrics` (added by patch 03 from the parent dir); the
ops debug endpoints are mounted under `/debug/freezekit/`.

---

## Operating guide

### Triggering a manual capture

```sh
# From inside a pod (admin auth, behind the existing service-role gate)
curl -fsS -X POST -H "apikey: $SERVICE_ROLE_KEY" \
  http://localhost:9999/debug/freezekit/capture?reason=manual_investigation
```

### Listing recent captures

```sh
curl -fsS -H "apikey: $SERVICE_ROLE_KEY" \
  http://localhost:9999/debug/freezekit/captures | jq .
```

### Pulling a capture from S3

```sh
aws s3 sync s3://supabase-diagnostics/auth/us-east-1/<pod>/<event_id>/ ./capture/
go tool pprof ./capture/goroutine.pb.gz
go tool pprof ./capture/heap.pb.gz
gunzip -c ./capture/goroutine.txt.gz | less
jq . ./capture/manifest.json
```

### Disabling in an emergency

```sh
kubectl set env deployment/supabase-auth FREEZEKIT_DISABLED=true
kubectl rollout status deployment/supabase-auth
```

(Or via the operator's preferred config-management tool — env-flag
takes effect on pod restart, no code change required.)
