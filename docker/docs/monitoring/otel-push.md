# OTel Push — Storage Metrics

Storage is the only service in the self-hosted Supabase stack that does not
expose a Prometheus pull endpoint. Instead, it uses the OpenTelemetry SDK to
push metrics to an OTel Collector.

This is a deliberate design choice in the Storage source code — the `/metrics`
HTTP route only activates in multi-tenant mode, which is internal to Supabase
Cloud. In single-tenant (self-hosted) deployments, OTel push is the only way
to collect Storage metrics.

**Source:**
[src/internal/monitoring/otel-metrics.ts](https://github.com/supabase/storage/blob/master/src/internal/monitoring/otel-metrics.ts) ·
[src/start/server.ts](https://github.com/supabase/storage/blob/master/src/start/server.ts)

---

## How it works

```
Storage (Node.js)
    │
    │  OTel gRPC push (every 60s)
    │  OTEL_EXPORTER_OTLP_ENDPOINT
    ▼
OTel Collector
    │
    │  Prometheus remote write
    ▼
VictoriaMetrics
```

Storage pushes metrics every 60 seconds via gRPC to the OTel Collector. The
Collector forwards them to VictoriaMetrics via Prometheus remote write.

---

## Setup

### 1. OTel Collector config

[`examples/otelcol/config.yml`](./examples/otelcol/config.yml) is included in
this repository. It configures:

- an OTLP gRPC receiver on `:4317` to accept Storage push
- a debug exporter to log received metrics (useful for verification)
- a Prometheus remote write exporter to forward metrics to VictoriaMetrics

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317

exporters:
  debug:
    verbosity: detailed
  prometheusremotewrite:
    endpoint: http://supabase-victoriametrics:8428/api/v1/write

service:
  pipelines:
    metrics:
      receivers: [otlp]
      exporters: [debug, prometheusremotewrite]
```

### 2. Enable Storage OTel push

Add to `docker-compose.override.yml` (already included):

```yaml
services:
  storage:
    environment:
      OTEL_METRICS_ENABLED: "true"
      OTEL_EXPORTER_OTLP_ENDPOINT: "http://otel-collector:4317"
```

The OTel Collector itself is defined in `docker-compose.metrics.yml` alongside
VictoriaMetrics.

### 3. Apply

```bash
docker compose -f docker-compose.yml \
               -f docker-compose.override.yml \
               -f docker-compose.metrics.yml up -d
```

---

## Verify

**Step 1 — Storage is pushing to OTel Collector:**

```bash
docker logs supabase-storage 2>&1 | grep -i "otel"
```

Expected output:
```
[OTel Metrics] Initializing
[OTel Metrics] OTLP exporter configured
[OTel Metrics] Initialized
```

**Step 2 — OTel Collector is receiving metrics:**

Wait 60 seconds for the first push, then:

```bash
docker logs supabase-otel-collector 2>&1 | grep "resource metrics"
```

Expected output:
```
resource metrics: 1, metrics: 37, data points: 96
```

**Step 3 — Metrics are in VictoriaMetrics:**

```bash
curl -s "http://localhost:8428/api/v1/label/__name__/values" | \
  python3 -m json.tool | grep -E "nodejs|cache_entries|db_connections"
```

---

## Key metrics

| Metric | Description |
|--------|-------------|
| `cache_entries` | Number of entries in the Storage cache |
| `cache_size_bytes` | Total size of the Storage cache |
| `db_connections` | Total database connections |
| `db_connections_in_use` | Active database connections |
| `db_active_local_pools` | Active local connection pools |
| `http_status_codes_total` | HTTP requests by status code |
| `nodejs_eventloop_utilization_ratio` | Node.js event loop utilization |
| `nodejs_eventloop_delay_p99_seconds` | P99 event loop delay |

---

## Related

- [Overview → Full service reference and getting started guide](./README.md)
- [Prometheus pull → Supavisor, Realtime, Auth, Postgres, Kong, Envoy, Vector](./prometheus-pull.md)
- [docker-compose.override.yml → Enables Storage OTel push](./examples/docker-compose.override.yml)
- [docker-compose.metrics.yml → Defines OTel Collector and VictoriaMetrics](./examples/docker-compose.metrics.yml)
- [otelcol/config.yml → OTel Collector configuration](./examples/otelcol/config.yml)
- [OTel Collector docs](https://opentelemetry.io/docs/collector/)
- [Storage otel-metrics.ts → Source code for Storage metrics implementation](https://github.com/supabase/storage/blob/master/src/internal/monitoring/otel-metrics.ts)
- [Storage server.ts → isMultitenant condition that disables pull endpoint](https://github.com/supabase/storage/blob/master/src/start/server.ts)
