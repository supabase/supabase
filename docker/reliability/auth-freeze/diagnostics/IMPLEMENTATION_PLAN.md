# freezekit — Implementation & Rollout Plan

> **Scope:** ship the freezekit framework (this directory) into
> production for Supabase Auth, end-to-end.
> **Status:** plan; nothing in this document has been executed yet.
> **Owner:** Auth Platform + SRE.
> **Target completion:** ~10 weeks from kick-off, assuming standard
> review cadence.
> **Parent:** complements the freeze-detection work in
> [`../PR_PLAN.md`](../PR_PLAN.md). This document covers the
> diagnostics-capture half.

---

## Table of contents

1. [Goals & non-goals](#1-goals--non-goals)
2. [Workstream overview](#2-workstream-overview)
3. [PR sequence](#3-pr-sequence)
4. [Per-wave acceptance criteria](#4-per-wave-acceptance-criteria)
5. [Risk register & mitigations](#5-risk-register--mitigations)
6. [Rollback playbook](#6-rollback-playbook)
7. [Timeline & dependencies](#7-timeline--dependencies)
8. [Ownership & approvals](#8-ownership--approvals)
9. [Communication plan](#9-communication-plan)
10. [Success metrics](#10-success-metrics)

---

## 1. Goals & non-goals

### Goals

- **G1.** When a freeze of the class described in
  [`../README.md`](../README.md) recurs, capture goroutine, heap,
  block, mutex, threadcreate, and runtime-metrics artifacts plus a
  correlation manifest **before** Kubernetes (or an operator)
  restarts the pod.
- **G2.** Ship to production *without* increasing the freeze blast
  radius. Every wave is a single env-flag flip with instant
  rollback.
- **G3.** Adoptable upstream by `supabase/auth` with ≤ 30 lines of
  diff across ≤ 3 files and zero new transitive deps.
- **G4.** Steady-state cost ≤ 0.5 % CPU, ≤ 64 MiB RSS overhead per
  pod (excluding the sidecar variant).

### Non-goals

- **N1.** Replacing the existing health-check / deep-probe work.
  This is *complementary*, not a substitute.
- **N2.** Auto-remediation. freezekit captures; the *operator* (or
  the existing K8s probe) decides what to do.
- **N3.** Long-term storage / search of dumps. The first 256 MiB
  per pod live on `emptyDir`; the durable copy goes into the
  operator's existing object store. Indexing / search is out of
  scope.
- **N4.** A new alerting backbone. We piggy-back on the existing
  Prometheus + Alertmanager stack.

---

## 2. Workstream overview

The work is partitioned into four streams that can largely
proceed in parallel after the foundations land:

| Stream                 | Owner                | Stream lead      |
| ---------------------- | -------------------- | ---------------- |
| **A. Code**            | Auth Platform        | (TBD)            |
| **B. Infrastructure**  | SRE                  | (TBD)            |
| **C. Observability**   | SRE                  | (TBD)            |
| **D. Security**        | Application Security | (TBD)            |

Streams A and B converge at the *deployment* milestone (Wave 1);
Stream C lands the alerts/dashboard before Wave 4 (when automatic
captures begin); Stream D approves the signer service before Wave 3
(when uploads start).

---

## 3. PR sequence

Eleven PRs across the four streams. Each row lists its blast radius
in terms of who/what is affected if it goes wrong.

### Foundation (no behaviour change)

| # | Title | Stream | Files touched | Blast radius |
|---|-------|--------|---------------|--------------|
| 1 | `freezekit`: stdlib-only Go package + CI | A | `diagnostics/freezekit/**` (already in this directory) | 0 — dead code |
| 2 | `freezekit-sidecar`: standalone binary + image build | A | `diagnostics/cmd/freezekit-sidecar/**` + `.github/workflows/release-sidecar.yml` | 0 — image not deployed |
| 3 | Stage sidecar to *staging* cluster, no-op mode | B | `k8s/auth-deployment-with-freezekit.yaml` (staging overlay) | Staging only; sidecar is read-only |
| 4 | Upstream PR to `supabase/auth`: embed freezekit with `FREEZEKIT_DISABLED=true` | A | upstream `cmd/serve.go`, `internal/api/api.go` | 0 — disabled |
| 5 | Chaos tests in upstream CI | A | upstream `.github/workflows/ci.yml` | 0 — tests only |

### Rollout — Waves 1–5 (each gated on the previous baking clean)

| # | Title | Stream | Flag flip | Blast radius |
|---|-------|--------|-----------|--------------|
| 6 | **Wave 1 / canary 5 %**: metrics-only | B | `FREEZEKIT_DISABLED=false`, `FREEZEKIT_DETECTOR_ENABLED=false`, `FREEZEKIT_SINK=noop` | 5 % of auth pods; CPU +<0.5 %, mem +<32 MiB |
| 7 | **Wave 1 / fleet**: metrics-only on 100 % | B | Same flags fleet-wide | All pods; revert by flipping `FREEZEKIT_DISABLED=true` |
| 8 | **Wave 2**: `LocalSink` enabled | B | `FREEZEKIT_SINK=local`, `FREEZEKIT_LOCAL_DIR=/var/freezekit` | All pods; risk = `emptyDir` filling |
| 9 | **Signer service deployment** (gated by AppSec review) | D | `infra/signer-service/**` | New service; no auth pods depend on it yet |
| 10 | **Wave 3**: `MultiSink` (local + signed-URL) | B | `FREEZEKIT_SINK=multi`, `FREEZEKIT_SIGNER_URL=…` | Uploads start flowing; risk = signer overload |
| 11 | **Wave 4 / canary 5 %**: detector enabled | A+B | `FREEZEKIT_DETECTOR_ENABLED=true` | First *automatic* captures; risk = false positives, capture overhead during real incident |
| 12 | **Wave 5 / fleet**: detector enabled on 100 % | A+B | Same flag fleet-wide | Steady state |

### Observability (lands in parallel, must be live before Wave 4)

| # | Title | Stream |
|---|-------|--------|
| O-1 | Prometheus rules: `observability/alerts.yml` | C |
| O-2 | Grafana dashboard: `observability/dashboard.json` | C |
| O-3 | On-call runbook: `Incident response — auth freeze` (Notion / Confluence) | C |
| O-4 | Slack channel `#auth-freezekit` for capture notifications (Alertmanager webhook) | C |

### Security (must complete before Wave 3 = #10)

| # | Title | Stream |
|---|-------|--------|
| S-1 | Signer service threat model + IAM scoping (PutObject only) | D |
| S-2 | NetworkPolicy review — egress allowlist in `auth-deployment-with-freezekit.yaml` | D |
| S-3 | PII review of `Manifest` schema — confirm default redaction is acceptable | D |
| S-4 | Audit-logging requirement: every signed URL issued is logged with pod ID | D |

---

## 4. Per-wave acceptance criteria

Every wave has the same shape: enter-criteria, exit-criteria,
metrics to watch, and a hard rollback trigger.

### Wave 1 — metrics only (PRs #6 and #7)

| Field | Value |
|-------|-------|
| **Enter** | Foundation PRs 1–5 merged + green; staging burn-in ≥ 48 h with no panics, no probe failures |
| **Bake**  | Canary 5 % for 1 week → fleet for 1 week (2 weeks total) |
| **Watch** | `freezekit_state` (must be 0 always), `freezekit_panics_recovered_total` (must be 0), `freezekit_inflight`, `freezekit_oldest_inflight_seconds`, GoTrue p99 token latency (must not regress > 5 %) |
| **Exit**  | Two consecutive weeks with: zero recovered panics; zero auto state-transitions out of NORMAL; p99 latency delta < 5 % vs. pre-rollout baseline |
| **Roll back if** | Any `freezekit_panics_recovered_total > 0`, OR `freezekit_self_stall_total > 0`, OR p99 latency regression > 5 % attributable to freezekit |
| **Rollback method** | `kubectl set env deployment/supabase-auth FREEZEKIT_DISABLED=true` + rollout |

### Wave 2 — LocalSink enabled (PR #8)

| Field | Value |
|-------|-------|
| **Enter** | Wave 1 baked clean; emptyDir `sizeLimit` confirmed at 512 MiB across all pods |
| **Bake**  | 1 week |
| **Watch** | `freezekit_local_disk_used_bytes` (should stay 0 unless someone fires a manual capture), kubelet eviction events on auth pods (must be 0) |
| **Exit**  | One week with zero kubelet evictions; smoke test of manual `POST /debug/freezekit/capture` writes a complete artifact set to `emptyDir` |
| **Roll back if** | Any kubelet eviction of an auth pod attributed to ephemeral-storage |
| **Rollback method** | `FREEZEKIT_SINK=noop` |

### Wave 3 — SignedURLSink + MultiSink (PRs #9 and #10)

| Field | Value |
|-------|-------|
| **Enter** | Signer service deployed, IAM review signed off, smoke test `GET signer?key=test` returns valid URL; LocalSink baked from Wave 2 |
| **Bake**  | 1 week |
| **Watch** | `freezekit_sink_uploads_total{result=…}` ratio (≥ 99 % `ok`), signer service latency (p99 < 100 ms), S3 bucket fill rate |
| **Exit**  | One week with sink success ratio ≥ 99 %; manual capture round-trip (trigger → S3 object → `go tool pprof`) verified |
| **Roll back if** | Sink failure rate > 10 % for > 1 h, OR signer service errors > 5 % for > 1 h |
| **Rollback method** | `FREEZEKIT_SINK=local` (keep capturing, just stop uploading) |

### Wave 4 — detector enabled (canary) (PR #11)

| Field | Value |
|-------|-------|
| **Enter** | Wave 3 baked; alerts O-1, dashboard O-2, runbook O-3, Slack O-4 all live; on-call training session delivered |
| **Bake**  | 1 week or until ≥ 1 real freeze captured (whichever first) |
| **Watch** | `freezekit_freeze_events_total` (expect 0–N where N is the historical freeze rate), `freezekit_captures_completed_total{result="ok"}` ratio (≥ 95 %), false-positive rate (manual review: any capture not matching a known incident) |
| **Exit**  | One week with ≤ 1 unexplained capture per pod per week (false-positive ceiling); ≥ 95 % of triggered captures complete with `result="ok"` |
| **Roll back if** | False-positive rate > 1 per pod per week, OR `freezekit_capture_duration_seconds` p99 > 10 s (would block too long during a real incident), OR any auth-traffic regression coincident with a capture |
| **Rollback method** | `FREEZEKIT_DETECTOR_ENABLED=false` (keep metrics, manual captures, sinks; just stop auto-triggering) |

### Wave 5 — detector fleet-wide (PR #12)

| Field | Value |
|-------|-------|
| **Enter** | Wave 4 baked across full canary window |
| **Bake**  | Indefinite — this is the steady state |
| **Watch** | Same as Wave 4, but tracked as long-term SLOs (see § 10) |
| **Exit**  | n/a — this is the destination |
| **Roll back if** | Same triggers as Wave 4 |
| **Rollback method** | Same as Wave 4 (fleet-wide flag flip) |

---

## 5. Risk register & mitigations

Ordered by severity (combined likelihood × impact).

| ID  | Risk                                                                              | Likelihood | Impact   | Mitigation                                                                                                                  |
| --- | --------------------------------------------------------------------------------- | ---------- | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| R-1 | **Heap capture OOMs the pod during a real freeze**                                | Medium     | High     | RSS-gated, defaults to skip if RSS > 80 % cgroup limit. Heap is captured *last* so other artifacts already saved on partial failure. `FREEZEKIT_INCLUDE_HEAP=false` available as kill-switch per-env. |
| R-2 | **Mutex/block profiling adds steady-state latency**                               | Low        | Medium   | Defaults (fraction=100, rate=10 µs) are upstream-recommended production values benchmarked at < 1 %. Wave 1 specifically bakes these on with no other freezekit activity. |
| R-3 | **Detector false-positives during normal load spikes**                            | Medium     | Medium   | 7-signal weighted scoring, debounce 3 samples, adaptive baseline on goroutine-spike, cooldown 5 min, capacity-1 token bucket. Canary at 5 % for 1 week before fleet-wide. |
| R-4 | **Signer service compromise → exfiltration**                                      | Low        | High     | Signer IAM is `s3:PutObject` only; *cannot* read or list. Per-key audit log. NetworkPolicy denies metadata-service access (`169.254.169.254`). |
| R-5 | **Sidecar pulls /debug/pprof and CPU-spikes the auth container**                  | Low        | Medium   | Sidecar default sample interval 5 s + min-interval 5 min between captures. /debug/pprof binds to localhost only (parent dir's K8s manifests bind to 127.0.0.1). |
| R-6 | **LocalSink fills `emptyDir` → kubelet evicts the pod**                           | Low        | High     | Budget 256 MiB hard-coded; `sizeLimit` 512 MiB; LRU eviction inside freezekit before kubelet ever sees pressure. Alert `FreezekitLocalDiskUsageHigh` fires at 80 %. |
| R-7 | **freezekit itself wedges during a freeze**                                       | Low        | Medium   | Self-watchdog disables freezekit (not the process) if its detector loop stalls > 60 s. `recover()` wraps every worker goroutine; `freezekit_panics_recovered_total` surfaces silently-recovered panics. |
| R-8 | **Storm of captures during a sustained incident → upload backpressure → OOM**     | Low        | Medium   | Capture: cap-1 token bucket. Upload: bounded chan cap=4, drop-on-full (counted not queued). Adaptive backoff doubles cooldown on repeated firing. |
| R-9 | **PII in goroutine dump (function args)**                                         | Medium     | Medium   | Goroutine dumps in Go do not include function-argument *values*, only types/pointers — confirmed via `pprof.Lookup("goroutine").WriteTo(..., 2)` output. Manifest redacts user IDs and IPs by default. |
| R-10| **freezekit upgrade introduces regression**                                       | Low        | Medium   | Version-pinned via vendored go.mod in `supabase/auth`. Test matrix in CI includes the chaos suite. |
| R-11| **`FREEZEKIT_DISABLED=true` env not applied uniformly during rollback**           | Low        | High     | Rollback PR is a single Deployment env-flag flip; `kubectl rollout status` confirms convergence before declaring rollback complete. |
| R-12| **Sidecar version skew vs. embedded freezekit**                                   | Medium     | Low      | Sidecar is a *fallback* when embedding isn't possible. The two modes produce identical Manifest schemas (same `schema_version` field). |
| R-13| **Loss of forensic data due to upload race vs. SIGKILL**                          | Medium     | Medium   | `terminationGracePeriodSeconds: 90` + preStop hook + LocalSink + post-restart sync. Even if upload races, the LocalSink survives on a pre-empted node iff the PV is durable (operator choice). |
| R-14| **freezekit metric cardinality explosion**                                        | Low        | Low      | Labels are bounded: `signal` ∈ 7 known values; `sink` ∈ 4 known values; `result` ∈ {ok, partial, failed, …}. Per-request labels are *not* emitted. |

---

## 6. Rollback playbook

Every layer has a flag. Failure → flip the lowest-impact flag that
addresses the failure.

| Symptom                                              | Flip                                                |
| ---------------------------------------------------- | --------------------------------------------------- |
| Any freezekit-attributable panic                     | `FREEZEKIT_DISABLED=true` (full off)                |
| Auth p99 regression of any size                      | `FREEZEKIT_DISABLED=true`                           |
| Self-stall metric trips                              | Already auto-disabled; investigate at leisure       |
| False-positive captures                              | `FREEZEKIT_DETECTOR_ENABLED=false`                  |
| Sink upload failures > 10 %                          | `FREEZEKIT_SINK=local`                              |
| Local disk near budget                               | (no action needed; LRU eviction handles)            |
| Heap capture causes OOM                              | `FREEZEKIT_INCLUDE_HEAP=false`                      |
| Block/mutex profile suspicion                        | `FREEZEKIT_BLOCK_PROFILE_RATE_NS=0` and `FREEZEKIT_MUTEX_PROFILE_FRACTION=0` |
| Specific signal misbehaving                          | Operator-side: remove from `cfg.Detector.Signals` (requires deploy) |

All rollbacks are env-flag flips applied via the operator's
existing config-management tool (`kubectl set env`, Helm `--set`,
Terraform, etc.). No DB migrations, no code reverts, no file-format
conversions.

---

## 7. Timeline & dependencies

Optimistic; assumes typical review SLAs and no security re-spins.

```
Week 0   ─── PR #1, #2 land. Foundation merged.
Week 1   ─── PR #3 sidecar to staging. Soak begins.
Week 2   ─── PR #4 upstream supabase/auth (DISABLED=true). Soak.
Week 3   ─── PR #4 merged after upstream review.
              PR #5 chaos tests in CI.
              O-1, O-2, O-3, O-4 land in parallel.
              S-1, S-2, S-3 reviews kick off.
Week 4   ─── PR #6: Wave 1 canary 5 %.
Week 5   ─── PR #7: Wave 1 fleet-wide.
Week 6   ─── PR #8: Wave 2 LocalSink fleet-wide.
              S-1, S-2 sign-off; PR #9 signer service deploy.
Week 7   ─── S-4 audit log live. PR #10: Wave 3 SignedURLSink fleet-wide.
              On-call training delivered.
Week 8   ─── PR #11: Wave 4 detector canary 5 %.
Week 9   ─── PR #12: Wave 5 detector fleet-wide. Project complete.
```

### Critical-path dependencies

- **AppSec review of signer service** (S-1 + S-4) blocks Wave 3.
  Start this in Week 3 — it's the longest single critical-path item.
- **On-call training** blocks Wave 4. 1-hour session covering the
  runbook, dashboard, and a live `go tool pprof` walk-through on a
  sample capture.
- **Upstream review of PR #4** (`supabase/auth`) is the longest
  single PR review. Plan for 1–2 weeks; engage maintainers up-front
  with the design doc so they aren't surprised.

### Slip-buffers

- 2 weeks added implicitly between Wave 3 and Wave 4 (Week 7 → 8)
  to absorb signer-service issues.
- Wave 4 bake is "1 week *or* until ≥ 1 real freeze captured" — the
  latter is the more interesting exit criterion and may take longer
  than 1 week (which would be a *good* outcome — fewer freezes).

---

## 8. Ownership & approvals

| Decision                                                    | Owner            | Approver          |
| ----------------------------------------------------------- | ---------------- | ----------------- |
| Code merge in this repo (foundation PRs 1–3, 5)             | Auth Platform    | Auth Platform TL  |
| Upstream PR #4 in `supabase/auth`                           | Auth Platform    | `supabase/auth` maintainers |
| Production K8s deploy (PRs #6–#12)                          | SRE              | SRE on-call lead  |
| Signer service IAM scope (S-1)                              | SRE + AppSec     | AppSec lead       |
| Default redaction policy in Manifest (S-3)                  | Auth Platform    | Privacy / DPO     |
| Wave 4 → Wave 5 promotion (detector fleet-wide)             | Auth Platform + SRE | Director of Engineering |
| Rollback at any point                                       | On-call          | (no approval — incident response) |

---

## 9. Communication plan

| Audience              | Channel                | Cadence / trigger                                                  |
| --------------------- | ---------------------- | ------------------------------------------------------------------ |
| Auth team             | Weekly standup         | Status of current wave, blockers, next milestone                   |
| SRE                   | `#supabase-sre` Slack  | Wave promotion announcements (T-24h, T-0, T+24h)                   |
| All engineering       | Internal eng newsletter | Wave 1 launch (heads-up: new metric label), Wave 5 launch (we now auto-capture freezes) |
| Maintainers of `supabase/auth` | GitHub PR thread | Design doc, PR #4 review, post-merge bake updates                  |
| Customers             | (none)                 | This is purely internal reliability infrastructure                 |
| Customers (only if a freeze is captured) | Existing status page processes | unchanged — the value is internal RCA |

Capture-event Slack notifications (O-4) go to a low-volume
`#auth-freezekit-events` channel with one message per
`FreezekitFreezeDetected` alert. Format:

```
:rotating_light: Freeze captured on supabase-auth-7f8b6c-zx2k1
event_id: 01HPV7XF8A...
trigger:  oldest_inflight (78.2s)
artifacts: s3://supabase-diagnostics/auth/us-east-1/.../01HPV7XF8A.../
runbook:  https://runbooks.supabase.com/auth-freeze
```

---

## 10. Success metrics

### Leading indicators (during rollout)

- `freezekit_panics_recovered_total == 0` cumulative across all
  pods after Wave 1 bake.
- p99 token-endpoint latency delta < 5 % vs. pre-Wave-1 baseline.
- `freezekit_sink_uploads_total{result="ok"} / total >= 0.99` over
  Wave 3 bake window.
- ≤ 1 unexplained capture per pod per week over Wave 4 bake.

### Lagging indicators (steady-state SLOs)

| SLO                                                         | Target          | Window  |
| ----------------------------------------------------------- | --------------- | ------- |
| **Time-to-evidence** for an auth freeze incident            | ≤ 60 seconds    | 90-day  |
| **% of freeze incidents with a complete artifact set**      | ≥ 95 %          | 90-day  |
| **False-positive capture rate**                             | ≤ 1 per pod per week | 30-day rolling |
| **freezekit-attributable production incidents**             | 0               | rolling |
| **Mean Manifest manifest-to-S3 latency**                    | < 30 s          | 7-day   |

### Definition of "complete artifact set"

The freeze captured at minimum:

1. `manifest.json` (always)
2. `goroutine.txt.gz` (always)
3. `goroutine.pb.gz`
4. `block.pb.gz` *or* `mutex.pb.gz` *or* both
5. `metrics.json.gz`

Optional: `heap.pb.gz`, `threadcreate.pb.gz`. Their absence is
acceptable per the design (heap is RSS-gated, threadcreate is
included by default).

---

## Appendix: PR template

```
## Title
[freezekit/wave-N] <one-line description>

## Risk classification
□ Foundation (no behaviour change)
□ Canary    (5 % blast radius)
□ Fleet     (100 % blast radius)
□ Rollback

## Acceptance criteria
- [ ] All previous-wave SLOs met during bake
- [ ] (wave-specific bullets from § 4)
- [ ] Rollback flag verified in staging
- [ ] On-call notified in #supabase-sre 24h ahead

## Rollback
Single env-flag flip:
    kubectl set env deployment/supabase-auth FREEZEKIT_<FLAG>=<value>

## References
- Plan: docker/reliability/auth-freeze/diagnostics/IMPLEMENTATION_PLAN.md
- Design: docker/reliability/auth-freeze/diagnostics/README.md
- Embedding guide: docker/reliability/auth-freeze/diagnostics/examples/embed-in-gotrue.md
```

---

*End of plan. Updates to this document require a PR with the
`docs:` prefix and one reviewer from each of Auth Platform and SRE.*
