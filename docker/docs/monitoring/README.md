
# Monitoring Self-Hosted Supabase
 
The [Supabase Metrics API](https://supabase.com/docs/guides/telemetry/metrics)
is not available in self-hosted deployments. Each service exposes metrics
independently — some are on by default, others require explicit activation.
 
This guide documents what is available, how to enable it, and how to wire
everything into a working observability stack. All endpoints were verified
against the source code of each service and tested against a live self-hosted
instance.
 
---
 
## Prerequisites
 
This guide assumes you already have a self-hosted Supabase instance running
via Docker Compose. If you haven't set that up yet:
→ [Self-Hosting with Docker](https://supabase.com/docs/guides/self-hosting/docker)
 
---
 
## How it works
 
Unlike Supabase Cloud, self-hosted Supabase has no single unified metrics
endpoint. Each service exposes telemetry differently — some via the Prometheus
client library, others via the OpenTelemetry SDK. Services fall into two
categories:
 
```
┌──────────────────────────────────────────────────────────────────────┐
│                     PROMETHEUS PULL                                  │
│                                                                      │
│  VictoriaMetrics ──scrapes──► Supavisor   supabase-pooler:4000       │
│                  ──scrapes──► Realtime    realtime-dev.*:4000        │
│                  ──scrapes──► Auth        supabase-auth:9100         │
│                  ──scrapes──► Postgres    postgres-exporter:9187     │
│                  ──scrapes──► Kong        supabase-kong:8001  (↓)    │
│                  ──scrapes──► Envoy       supabase-envoy:9901        │
│                  ──scrapes──► Vector      supabase-vector:9598       │
│                                                                      │
│  (↓) Kong will be deprecated soon. Envoy is its replacement.         │
└──────────────────────────────────────────────────────────────────────┘
 
┌──────────────────────────────────────────────────────────────────────┐
│                          OTEL PUSH                                   │
│                                                                      │
│  Storage ──pushes──► OTel Collector ──► VictoriaMetrics              │
│                                                                      │
│  Storage's /metrics route is only active in multi-tenant mode        │
│  (Supabase Cloud internal). In standard self-hosted deployments,     │
│  Storage metrics are collected via OTel push.                        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```
 
---
 
## Quick reference
 
| Service | Repo | Endpoint | On by default | Auth |
|---------|------|----------|---------------|------|
| Supavisor | [supabase/supavisor](https://github.com/supabase/supavisor) | `:4000/metrics` | ✅ Yes | Bearer JWT (`ANON_KEY`) |
| Realtime | [supabase/realtime](https://github.com/supabase/realtime) | `:4000/metrics` | ✅ Yes | Bearer JWT (`ANON_KEY`) |
| Auth (GoTrue) | [supabase/auth](https://github.com/supabase/auth) | `:9100/` | ❌ Env vars needed | None |
| PostgreSQL | [postgres_exporter](https://github.com/prometheus-community/postgres_exporter) | `:9187/metrics` | ❌ Sidecar needed | None |
| Kong *(deprecation pending)* | [Kong/kong](https://github.com/Kong/kong) | `:8001/metrics` | ❌ Plugin + env var needed | None |
| Envoy | [envoyproxy/envoy](https://github.com/envoyproxy/envoy) | `:9901/stats/prometheus` | ❌ Admin bind address needed | None |
| Storage | [supabase/storage](https://github.com/supabase/storage) | OTel push only | ❌ Env vars needed | — |
| Vector | [vectordotdev/vector](https://github.com/vectordotdev/vector) | `:9598/metrics` | ❌ Config file needed | None |
 
> **Note:** Supavisor and Realtime both use port `4000` but run in separate
> containers — no conflict. Address them by container name:
> `supabase-pooler:4000` and `realtime-dev.supabase-realtime:4000`.
 
> **Note:** Kong will be deprecated soon in the self-hosted stack. The optional
> [Envoy gateway](https://supabase.com/docs/guides/self-hosting/self-hosted-envoy)
> (`docker-compose.envoy.yml`) is its replacement.
 
> **Note:** Both Kong (`:8001`) and Envoy (`:9901`) expose admin APIs that go
> beyond metrics — Kong's Admin API can modify routes and plugins; Envoy's
> `/config_dump` exposes API keys and JWTs in plaintext. Keep these ports
> internal to the Docker network — do not map them to the host.
> See [Kong security guide](https://developer.konghq.com/gateway/secure-the-admin-api/)
> and [Envoy security hardening](https://supabase.com/docs/guides/self-hosting/self-hosted-envoy#security-hardening).
 
---
 
## What's included
 
### `examples/docker-compose.override.yml`
 
Auth, Kong, Vector, and Storage do not expose metrics by default. This file
adds the environment variables needed to activate them without modifying the
original `docker-compose.yml`. Docker Compose automatically merges override
files.
 
- **Auth** — activates a Prometheus exporter on `:9100` via
  `GOTRUE_METRICS_ENABLED=true`.
- **Kong** *(deprecation pending)* — adds `prometheus` to `KONG_PLUGINS` and sets
  `KONG_ADMIN_LISTEN: "0.0.0.0:8001"` to open the Admin API to the Docker
  network. If you are using Envoy instead, this section can be omitted.
- **Vector** — mounts a second config file (`vector/metrics.yml`) alongside
  the original `vector.yml` to add an internal metrics exporter on `:9598`.
- **Storage** — enables OTel push via `OTEL_METRICS_ENABLED=true` and points
  it at the OTel Collector.
### `examples/vector/metrics.yml`
 
A standalone Vector config that adds an `internal_metrics` source and a
`prometheus_exporter` sink on `:9598`.
 
### `examples/docker-compose.metrics.yml`
 
Adds the monitoring stack:
 
- **VictoriaMetrics** — Prometheus-compatible time series database. Scrapes
  all pull endpoints and stores them for querying via PromQL.
- **postgres_exporter** — Postgres does not expose Prometheus metrics
  natively. This sidecar connects to the Supabase Postgres container and
  exposes metrics at `:9187/metrics`.
- **OTel Collector** — receives Storage metrics via OTLP gRPC and forwards
  them to VictoriaMetrics via Prometheus remote write.
### `examples/victoriametrics/scrape.yml`
 
VictoriaMetrics scrape configuration covering all pull-based services.
Uses `ANON_KEY` from your `.env` file for Bearer authentication on Supavisor
and Realtime. Includes both Kong and Envoy scrape jobs — enable whichever
gateway you are running.
 
### `examples/otelcol/config.yml`
 
OTel Collector configuration. Sets up an OTLP gRPC receiver on `:4317` to
accept Storage push and a Prometheus remote write exporter to forward metrics
to VictoriaMetrics.
 
---
 
## Getting started
 
**Step 1 — Stage runtime files**
 
The example files in `docs/monitoring/examples/` are documentation. Copy them
to the locations Docker Compose expects, alongside `docker-compose.yml`:
 
```bash
cd docker
 
# Copy override and metrics compose files to the project root
cp docs/monitoring/examples/docker-compose.override.yml .
cp docs/monitoring/examples/docker-compose.metrics.yml .
 
# Copy Vector metrics config alongside the existing vector.yml
cp docs/monitoring/examples/vector/metrics.yml volumes/logs/vector.metrics.yml
 
# Set up the monitoring volume with scrape config, OTel config, and JWT token
mkdir -p volumes/monitoring/otelcol
cp docs/monitoring/examples/victoriametrics/scrape.yml volumes/monitoring/
cp docs/monitoring/examples/otelcol/config.yml volumes/monitoring/otelcol/
grep '^ANON_KEY=' .env | cut -d= -f2 > volumes/monitoring/jwt
```
 
**Step 2 — Enable metrics endpoints**
 
> **Note:** This step assumes the full Supabase stack is already running. If
> you haven't started it yet, follow the [Self-Hosting with Docker](https://supabase.com/docs/guides/self-hosting/docker)
> guide first, then return here.
 
Activate metrics on Auth, Vector, and Storage (required regardless of which gateway you use):
 
```bash
docker compose up -d auth vector storage
```
 
_Gateway (choose one):_
 
_Option A — Kong (default)_
 
```bash
docker compose up -d kong
```
 
_Option B — Envoy_
 
Change the admin bind address in `volumes/api/envoy/envoy.yaml`:
 
```yaml
# volumes/api/envoy/envoy.yaml
admin:
  address:
    socket_address:
      address: 0.0.0.0  # changed from 127.0.0.1
      port_value: 9901
```
 
> **Note:** This is a direct edit to `volumes/api/envoy/envoy.yaml`. Unlike
> other services in this guide, Envoy does not support overriding the admin
> bind address via environment variables — editing the config file directly
> is the only option.
>
> This opens the admin interface to the Docker network so VictoriaMetrics can
> scrape it. See [Metrics Security →](./security.md#envoy) for what this
> exposes and how to keep it safe.
 
Then stop Kong (both gateways bind to host port 8000 and cannot run simultaneously)
and start Envoy:
 
```bash
docker compose stop kong
docker compose -f docker-compose.yml -f docker-compose.envoy.yml up -d api-gw
```
 
**Step 3 — Verify each endpoint responds (1st check)**
 
Confirm the endpoints are reachable inside the Docker network:
 
```bash
ANON_KEY=$(grep '^ANON_KEY=' .env | cut -d= -f2)
 
# Supavisor — on by default, requires Bearer JWT
docker run --rm --network supabase_default curlimages/curl:latest \
  curl -s -H "Authorization: Bearer $ANON_KEY" \
  http://supabase-pooler:4000/metrics | head -3
 
# Realtime — on by default, requires Bearer JWT
docker run --rm --network supabase_default curlimages/curl:latest \
  curl -s -H "Authorization: Bearer $ANON_KEY" \
  http://realtime-dev.supabase-realtime:4000/metrics | head -3
 
# Auth
docker run --rm --network supabase_default curlimages/curl:latest \
  curl -s http://supabase-auth:9100/ | head -3
 
# Option A — Kong
docker run --rm --network supabase_default curlimages/curl:latest \
  curl -s http://supabase-kong:8001/metrics | head -3
 
# Option B — Envoy
docker run --rm --network supabase_default curlimages/curl:latest \
  curl -s http://supabase-envoy:9901/stats/prometheus | head -3
 
# Vector
docker run --rm --network supabase_default curlimages/curl:latest \
  curl -s http://supabase-vector:9598/metrics | head -3
```
 
**Step 4 — Bring up VictoriaMetrics, postgres_exporter, and OTel Collector**
 
_Option A — Kong_
 
```bash
docker compose -f docker-compose.yml \
               -f docker-compose.override.yml \
               -f docker-compose.metrics.yml up -d
```
 
_Option B — Envoy_
 
```bash
docker compose -f docker-compose.yml \
               -f docker-compose.metrics.yml up -d
```
 
**Step 5 — Verify all services are being scraped (2nd check)**
 
Open `http://localhost:8428/targets` — all active targets should show state `UP`
with zero errors.
 
For Storage (which pushes via OTel rather than being scraped), confirm metrics
arrived in VictoriaMetrics:
 
```bash
curl -s "http://localhost:8428/api/v1/label/__name__/values" | \
  python3 -m json.tool | grep -E "nodejs|cache_entries|db_connections"
```
 
**Step 6 — Explore metrics**
 
Open `http://localhost:8428/vmui` and try a query like
`supavisor_prom_ex_cluster_size`, `envoy_cluster_upstream_rq_total`, or
`vector_component_received_events_total`.
 
---
 
## Guides
 
- **[Prometheus pull →](./prometheus-pull.md)** Source code references,
  environment variables, key metrics, and scrape config for each pull-based
  service.
- **[OTel push →](./otel-push.md)** How Storage pushes metrics via the
  OpenTelemetry SDK and how the OTel Collector forwards them to
  VictoriaMetrics.
- **[Security →](./security.md)** Security properties of each metrics
  endpoint, admin API exposure risks, and production hardening recommendations.
---
 
## Related
 
- [Supabase Metrics API (cloud only)](https://supabase.com/docs/guides/telemetry/metrics)
- [Self-hosting with Docker](https://supabase.com/docs/guides/self-hosting/docker)
- [Envoy API Gateway (self-hosted)](https://supabase.com/docs/guides/self-hosting/self-hosted-envoy)
- [Supavisor metrics documentation](https://supabase.github.io/supavisor/monitoring/metrics/)
- [postgres_exporter](https://github.com/prometheus-community/postgres_exporter)
- [Kong Prometheus plugin](https://developer.konghq.com/plugins/prometheus/)
- [Envoy Admin API](https://www.envoyproxy.io/docs/envoy/latest/operations/admin)
- [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/)
- [Vector internal_metrics](https://vector.dev/docs/reference/configuration/sources/internal_metrics/)
- [VictoriaMetrics](https://victoriametrics.com/)
- [Security reference](./security.md)
 