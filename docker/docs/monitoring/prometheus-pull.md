# Prometheus Pull — Self-Hosted Supabase

This guide covers enabling and scraping Prometheus-compatible metrics from
each pull-based service in the self-hosted Supabase stack. All endpoints were
verified against source code and tested against a live self-hosted instance.

For a quick overview of which services expose metrics and how, see
[README.md](./README.md).

---

## Bearer JWT

Supavisor and Realtime authenticate scrape requests with a Bearer JWT.
The `ANON_KEY` in your `.env` file works directly as the scrape token:

```bash
ANON_KEY=$(grep '^ANON_KEY=' .env | cut -d= -f2)
```

> Both services use `METRICS_JWT_SECRET=${JWT_SECRET}` from `docker-compose.yml`.
> `ANON_KEY` is signed with `JWT_SECRET`, so it satisfies the metrics endpoint
> auth check.

---

## 1. Supavisor

[Source](https://github.com/supabase/supavisor) ·
[prom_ex.ex](https://github.com/supabase/supavisor/blob/main/lib/supavisor/monitoring/prom_ex.ex) ·
[Metrics docs](https://supabase.github.io/supavisor/monitoring/metrics/)

Supavisor exposes Prometheus metrics at `/metrics` on port `4000` out of the
box. No additional configuration required.

### Verify

```bash
docker run --rm --network supabase_default curlimages/curl:latest \
  curl -s -H "Authorization: Bearer $ANON_KEY" \
  http://supabase-pooler:4000/metrics | head -5
```

### Key metrics

| Metric | Description |
|--------|-------------|
| `supavisor_prom_ex_beam_memory_allocated_bytes` | Total memory allocated to the BEAM VM |
| `supavisor_prom_ex_osmon_memory_system_total` | Total system memory |
| `supavisor_prom_ex_cluster_size` | Number of nodes in the Supavisor cluster |
| `supavisor_prom_ex_phoenix_http_request_duration_milliseconds` | HTTP request latency histogram |

### Scrape config

```yaml
- job_name: supabase-supavisor
  metrics_path: /metrics
  authorization:
    type: Bearer
    credentials_file: /etc/vm/jwt
  static_configs:
    - targets: ["supabase-pooler:4000"]
      labels:
        service: supavisor
```

---

## 2. Realtime

[Source](https://github.com/supabase/realtime) ·
[router.ex](https://github.com/supabase/realtime/blob/main/lib/realtime_web/router.ex) ·
[prom_ex plugins](https://github.com/supabase/realtime/tree/main/lib/realtime/monitoring/prom_ex/plugins)

Realtime exposes Prometheus metrics at `/metrics` on port `4000` using the
same Bearer JWT as Supavisor. Container name is `realtime-dev.supabase-realtime`.

### Verify

```bash
docker run --rm --network supabase_default curlimages/curl:latest \
  curl -s -H "Authorization: Bearer $ANON_KEY" \
  http://realtime-dev.supabase-realtime:4000/metrics | head -5
```

### Key metrics

| Metric | Description |
|--------|-------------|
| `realtime_tenants_connected` | Number of connected tenants |
| `beam_memory_ets_total_bytes` | Memory allocated to ETS tables |
| `osmon_cpu_avg15` | 15-minute CPU load average |

### Scrape config

```yaml
- job_name: supabase-realtime
  metrics_path: /metrics
  authorization:
    type: Bearer
    credentials_file: /etc/vm/jwt
  static_configs:
    - targets: ["realtime-dev.supabase-realtime:4000"]
      labels:
        service: realtime
```

---

## 3. Auth (GoTrue)

[Source](https://github.com/supabase/auth) ·
[internal/conf/metrics.go](https://github.com/supabase/auth/blob/master/internal/conf/metrics.go) ·
[internal/observability/metrics.go](https://github.com/supabase/auth/blob/master/internal/observability/metrics.go)

Auth metrics are off by default. The Prometheus exporter is only started when
`GOTRUE_METRICS_ENABLED=true` is set.

Enable via `docker-compose.override.yml` (already included in this repository):

```yaml
services:
  auth:
    environment:
      GOTRUE_METRICS_ENABLED: "true"
      GOTRUE_METRICS_EXPORTER: "prometheus"
      OTEL_EXPORTER_PROMETHEUS_HOST: "0.0.0.0"
      OTEL_EXPORTER_PROMETHEUS_PORT: "9100"
```

> **Note:** Auth uses the OpenTelemetry SDK internally.
> `GOTRUE_METRICS_EXPORTER: "prometheus"` tells the OTel SDK to expose a
> Prometheus pull endpoint instead of pushing to an OTel Collector.
> `OTEL_EXPORTER_PROMETHEUS_HOST/PORT` configure where that endpoint listens.

### Verify

```bash
docker run --rm --network supabase_default curlimages/curl:latest \
  curl -s http://supabase-auth:9100/ | head -5
```

### Key metrics

| Metric | Description |
|--------|-------------|
| `db_sql_connection_open` | Open database connections (idle + in-use) |
| `db_sql_connection_wait_total` | Total connections waited for |
| `gotrue_running` | Always 1 — confirms Auth is up |

### Scrape config

```yaml
- job_name: supabase-auth
  metrics_path: /
  static_configs:
    - targets: ["supabase-auth:9100"]
      labels:
        service: auth
```

---

## 4. PostgreSQL

[Source](https://github.com/prometheus-community/postgres_exporter)

Postgres does not expose Prometheus metrics natively. `postgres_exporter` is
added as a sidecar via
[`examples/docker-compose.metrics.yml`](./examples/docker-compose.metrics.yml).
It connects to the Supabase Postgres container and exposes metrics at
`:9187/metrics`.

### Verify

```bash
docker run --rm --network supabase_default curlimages/curl:latest \
  curl -s http://postgres-exporter:9187/metrics | grep "^pg_" | head -5
```

### Key metrics

| Metric | Description |
|--------|-------------|
| `pg_database_size_bytes` | Database size per database |
| `pg_locks_count` | Lock contention by mode |
| `pg_stat_database_numbackends` | Active connections per database |
| `pg_replication_lag` | Replication lag in seconds |

### Scrape config

```yaml
- job_name: supabase-postgres
  metrics_path: /metrics
  static_configs:
    - targets: ["postgres-exporter:9187"]
      labels:
        service: postgres
```

---

## 5. Kong *(deprecation pending)*

> **Note:** Kong will be deprecated soon in the self-hosted stack. The optional
> [Envoy gateway](https://supabase.com/docs/guides/self-hosting/self-hosted-envoy)
> (`docker-compose.envoy.yml`) is its replacement. See [Envoy →](#6-envoy) below
> for how to collect metrics from the Envoy gateway.

[Source](https://github.com/Kong/kong) ·
[Prometheus plugin](https://developer.konghq.com/plugins/prometheus/)

Two changes are required, both included in
[`examples/docker-compose.override.yml`](./examples/docker-compose.override.yml):

**1. Enable the Prometheus plugin** in `volumes/api/kong.yml`:

```yaml
plugins:
  - name: prometheus
    config:
      status_code_metrics: true
      latency_metrics: true
      bandwidth_metrics: true
      upstream_health_metrics: true
```

**2. Open the Admin API to the Docker network:**

```yaml
services:
  kong:
    environment:
      KONG_PLUGINS: >-
        request-transformer,cors,key-auth,acl,basic-auth,
        request-termination,ip-restriction,post-function,prometheus
      KONG_ADMIN_LISTEN: "0.0.0.0:8001"  # Kong Admin API binds to 127.0.0.1 by default; this opens it to the Docker network
```

> ⚠️ Kong's Admin API (`:8001`) exposes management endpoints beyond just
> metrics — including routes, plugins, and consumers. Keep port `8001`
> internal to the Docker network — do not map it to the host.
> See [Kong's security guide](https://developer.konghq.com/gateway/secure-the-admin-api/).

### Verify

```bash
docker run --rm --network supabase_default curlimages/curl:latest \
  curl -s http://supabase-kong:8001/metrics | head -5
```

### Key metrics

| Metric | Description |
|--------|-------------|
| `kong_datastore_reachable` | 1 if datastore is reachable, 0 if not |
| `kong_http_requests_total` | Total requests by service, route, and status code |
| `kong_request_latency_ms` | End-to-end request latency histogram |
| `kong_memory_lua_shared_dict_bytes` | Lua shared memory usage |

### Scrape config

```yaml
- job_name: supabase-kong
  metrics_path: /metrics
  static_configs:
    - targets: ["supabase-kong:8001"]
      labels:
        service: kong
```

---

## 6. Envoy

[Source](https://github.com/envoyproxy/envoy) ·
[Supabase Envoy docs](https://supabase.com/docs/guides/self-hosting/self-hosted-envoy) ·
[Admin API docs](https://www.envoyproxy.io/docs/envoy/latest/operations/admin)

Envoy is the replacement for Kong as the self-hosted API gateway, available via
`docker-compose.envoy.yml`. Envoy exposes Prometheus-compatible metrics at
`:9901/stats/prometheus` through its admin interface.

By default, the admin interface binds to `127.0.0.1:9901` — accessible only
from within the container itself. To allow a metrics collector running in the
same Docker network to scrape it, change the bind address in
`volumes/api/envoy/envoy.yaml`:

```yaml
admin:
  address:
    socket_address:
      address: 0.0.0.0  # changed from 127.0.0.1
      port_value: 9901
```

Apply the change:

```bash
docker compose -f docker-compose.yml -f docker-compose.envoy.yml up -d api-gw
```

> ⚠️ Envoy's admin endpoint (`:9901`) exposes `/config_dump` which includes
> API keys, JWTs, and the dashboard basic auth hash in plaintext. Keep port
> `9901` internal to the Docker network — do not map it to the host.
> See the [Envoy security hardening guide](https://supabase.com/docs/guides/self-hosting/self-hosted-envoy#security-hardening).

### Verify

```bash
docker run --rm --network supabase_default curlimages/curl:latest \
  curl -s http://supabase-envoy:9901/stats/prometheus | head -5
```

### Key metrics

| Metric | Description |
|--------|-------------|
| `envoy_cluster_upstream_rq_total` | Total requests forwarded per upstream cluster (auth, rest, realtime, storage, functions, meta, studio) |
| `envoy_cluster_upstream_rq_time` | Request latency histogram per upstream cluster |
| `envoy_http_downstream_rq_total` | Total requests received from downstream clients |
| `envoy_server_memory_allocated` | Envoy process memory usage |
| `envoy_cluster_assignment_stale` | CDS assignment staleness counter per cluster |

### Scrape config

```yaml
- job_name: supabase-envoy
  metrics_path: /stats/prometheus
  static_configs:
    - targets: ["supabase-envoy:9901"]
      labels:
        service: envoy
```

---

## 7. Vector

[Source](https://github.com/vectordotdev/vector) ·
[internal_metrics](https://vector.dev/docs/reference/configuration/sources/internal_metrics/)

Vector's own operational metrics are off by default. Enabling them requires
adding a second config file alongside the original `vector.yml` — without
modifying it. Vector supports loading multiple config files simultaneously.

[`examples/vector/metrics.yml`](./examples/vector/metrics.yml) adds an
`internal_metrics` source and a `prometheus_exporter` sink on `:9598`.
[`examples/docker-compose.override.yml`](./examples/docker-compose.override.yml)
mounts it alongside the original `vector.yml`.

### Verify

```bash
docker run --rm --network supabase_default curlimages/curl:latest \
  curl -s http://supabase-vector:9598/metrics | head -5
```

### Key metrics

| Metric | Description |
|--------|-------------|
| `vector_component_received_events_total` | Events received per component |
| `vector_component_sent_events_total` | Events sent per component |
| `vector_component_errors_total` | Errors per component |

### Scrape config

```yaml
- job_name: supabase-vector
  metrics_path: /metrics
  static_configs:
    - targets: ["supabase-vector:9598"]
      labels:
        service: vector
```

---

## Complete scrape config

A complete VictoriaMetrics scrape config for all services — including both Kong
and Envoy scrape jobs — is available at
[`examples/victoriametrics/scrape.yml`](./examples/victoriametrics/scrape.yml).
Enable the job that matches your active gateway.

---

## Related

- [Overview → Full service reference and getting started guide](./README.md)
- [OTel push → Storage metrics via OpenTelemetry Collector](./otel-push.md)
- [Security → Endpoint exposure risks and hardening recommendations](./security.md)
- [Supabase Envoy gateway docs](https://supabase.com/docs/guides/self-hosting/self-hosted-envoy)
- [victoriametrics/scrape.yml → Complete VictoriaMetrics scrape config](./examples/victoriametrics/scrape.yml)
- [docker-compose.override.yml → Enables Auth, Kong, Vector, Storage metrics](./examples/docker-compose.override.yml)
- [docker-compose.metrics.yml → Adds VictoriaMetrics, postgres_exporter, and OTel Collector](./examples/docker-compose.metrics.yml)
- [vector/metrics.yml → Vector internal metrics config](./examples/vector/metrics.yml)
