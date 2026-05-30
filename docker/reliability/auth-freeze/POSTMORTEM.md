# Customer-facing postmortem template — GoTrue partial freeze

> Template. Fill bracketed fields before publishing. Keep section
> structure stable — Pro customers and SOC2 auditors expect this layout.

---

## Summary

On **[YYYY-MM-DD HH:MM UTC]**, authentication on the affected project
became unresponsive for approximately **[N] minutes**. During the
incident:

* `POST /auth/v1/token` calls (sign-in, sign-up, refresh) timed out.
* The Supabase Dashboard **Authentication → Users** page did not load.
* Other project services (PostgREST, Storage, Realtime, Edge
  Functions, the database itself) were unaffected.

The project recovered after an automated restart of the auth service.
**No customer data was lost or disclosed.** Sessions issued before the
incident remained valid throughout.

## Impact

| Surface                            | Impact                                   |
| ---------------------------------- | ---------------------------------------- |
| End-user sign-in / sign-up         | Failed with timeouts during the window.  |
| End-user refresh-token             | Failed with timeouts.                    |
| Already-signed-in users using JWTs | Unaffected; existing tokens kept working until expiry. |
| Dashboard Users page               | Unloadable during the window.            |
| PostgREST `/rest/v1/*`             | No measurable impact.                    |
| Storage / Realtime / Edge          | No measurable impact.                    |

## Root cause

The auth service's database connection pool became saturated while a
handful of long-running database operations held connections beyond
their expected lifetime. New auth requests queued behind unavailable
connections without an upper time bound, and the process-level
liveness probe — which by design does not exercise the database —
continued reporting healthy. As a result, the container orchestrator
did not restart the pod automatically.

In short: every layer was *individually* healthy, but the
**aggregate** request path was wedged, and our liveness signal was
not designed to detect that case.

## Detection

Detection was customer-driven. Internal monitoring did not flag the
condition because the metrics we collected (process up, port open,
`/health` status) all stayed green. We have since corrected this —
see *What we changed.*

## Timeline (UTC)

| Time      | Event                                                                |
| --------- | -------------------------------------------------------------------- |
| HH:MM     | Onset: `POST /token` p99 latency rises from ~80 ms to >15 s.         |
| HH:MM+N   | First customer report.                                                |
| HH:MM+N   | On-call paged; confirmed `/health` still 200, database healthy.       |
| HH:MM+N   | Auth service restarted manually.                                      |
| HH:MM+N   | Latency returns to baseline; sign-ins succeeding.                     |

## Why our automated systems didn't catch it

`/health` returns 200 in well under a second whenever the GoTrue
process is alive and the HTTP listener is accepting connections.
It does not — and historically *could not* — exercise the database
or the request pipeline as a whole. That made it a poor signal for
this failure class.

## What we changed

1. **Honest liveness vs. readiness split.** A new `/healthz/deep`
   endpoint exercises the actual auth pipeline (router → middleware →
   database). Kubernetes readiness probes now consume the deep
   endpoint, so traffic is shed within seconds of pipeline
   degradation, while liveness continues to use the cheap `/health`
   probe to avoid cascading restarts during database outages.
2. **Per-route request deadlines.** Auth handlers now have an upper
   time bound. A slow database or upstream cannot keep a request
   alive indefinitely.
3. **Database safety nets.** The auth role now ships with
   `statement_timeout`, `idle_in_transaction_session_timeout`, and
   `lock_timeout` configured, so a runaway query is terminated within
   30 seconds without operator action.
4. **Direct observability of the symptom.** We now emit Prometheus
   metrics for in-flight handler age, database-pool wait time, and
   goroutine count. Alerts page our on-call before the freeze becomes
   user-visible.
5. **Continuous synthetic auth probing.** A sidecar performs a real
   admin-API round-trip every 10 seconds. Any future occurrence
   trips the alert in <90 seconds, before customers notice.

## What we will *not* do

We will not bind Kubernetes **liveness** probes to a database-touching
endpoint. Doing so converts a database hiccup into a fleet-wide
restart loop and a stampeding-herd reconnect storm. We have seen
this pattern hurt other operators and intentionally chose **readiness
+ alerting + cheap liveness** instead.

## How to verify on your end

Sign-in latency should now have a hard 15-second upper bound (it was
previously unbounded). If you observe any auth request taking longer
than 15 seconds we want to know immediately —
[support contact / status page link].

## Apologies

We're sorry — particularly to customers whose end users were locked
out during the incident. Authentication is a critical-path service
and we hold it to a higher uptime standard than the rest of the
platform. The changes above measurably raise that standard.

---

*Compiled from the internal investigation document at*
[`docker/reliability/auth-freeze/README.md`](./README.md).
