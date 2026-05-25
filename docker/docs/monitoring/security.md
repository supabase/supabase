# Metrics Security Reference

This guide covers the security properties of each metrics endpoint in the
self-hosted Supabase stack and how to keep them safe.

---

## Isolated metrics endpoints

The following services expose metrics on a **dedicated port** that serves only
Prometheus-formatted metric lines — no management functions, no sensitive data.

| Service | Endpoint | Exposed data |
|---------|----------|--------------|
| Supavisor | `:4000/metrics` | Runtime counters, connection pool stats |
| Realtime | `:4000/metrics` | Tenant counts, BEAM VM stats |
| Auth | `:9100/` | DB connection pool, request counters |
| Storage | OTel push to `:4317` | Cache, DB connections, HTTP status codes |
| Vector | `:9598/metrics` | Pipeline event counts, component errors |
| postgres_exporter | `:9187/metrics` | Postgres query stats, lock counts, replication lag |

**Supavisor and Realtime** require a Bearer JWT on every scrape request.
The `ANON_KEY` in your `.env` file is the correct token — it is signed with
`JWT_SECRET`, which both services use as `METRICS_JWT_SECRET`. No additional
token management is needed.

**Auth, Storage, Vector, and postgres_exporter** expose metrics without
authentication. They rely entirely on network isolation — keep them inside
the Docker network and do not publish their ports to the host unless you
control who can reach those ports.

---

## Shared admin endpoints

Kong and Envoy both expose metrics through an **admin interface** that also
serves management and introspection endpoints beyond metrics. These require
extra care.

### Kong *(deprecation pending)*

Kong's Admin API runs on `:8001`. The Prometheus plugin exposes metrics at
`:8001/metrics`, but the same port also handles:

- Route and plugin configuration (`/config`)
- Consumer and credential management (`/consumers`)
- Health check data and node information

**The Admin API must not be published to the host.** Keep port `8001` inside
the Docker network. Do not add `- "8001:8001"` to the `kong` service in
`docker-compose.yml`.

→ [Kong Admin API security guide](https://developer.konghq.com/gateway/secure-the-admin-api/)

> **Note:** Kong will be deprecated soon in the self-hosted stack. Envoy is
> its replacement.

### Envoy

Envoy's admin interface runs on `:9901`. Prometheus-compatible metrics are
available at `:9901/stats/prometheus`, but the same port also exposes:

- `/config_dump` — full runtime configuration including **API keys, JWTs, and
  the dashboard basic auth hash in plaintext**
- `/clusters` — upstream cluster membership and health state
- `/listeners` — active listener configuration

**The admin interface must not be published to the host.** Keep port `9901`
inside the Docker network. Do not add `- "9901:9901"` to the `api-gw` service
in `docker-compose.envoy.yml`.

By default, Envoy's admin interface binds to `127.0.0.1:9901` — accessible
only from within the container itself. The setup guide changes this to
`0.0.0.0` so that VictoriaMetrics (running in the same Docker network) can
reach it. This is intentional and safe as long as the port is not published
to the host.

→ [Envoy Admin API reference](https://www.envoyproxy.io/docs/envoy/latest/operations/admin)
→ [Supabase Envoy security hardening](https://supabase.com/docs/guides/self-hosting/self-hosted-envoy#security-hardening)

---

## General recommendations

**Keep scrapers in the same Docker network.**
VictoriaMetrics and the OTel Collector are defined in
`docker-compose.metrics.yml` with `network: default` (the Supabase compose
network). All scrape targets are addressed by container name over this
internal network — no host-level port exposure required.

**Do not publish admin ports to the host.**
Neither Kong's `:8001` nor Envoy's `:9901` should appear in a `ports:` block.
Only publish ports that need to be reachable from outside Docker — typically
the API gateway's public port (`8000` for Kong, `8443` for Envoy).

**Restrict access to VictoriaMetrics.**
VictoriaMetrics is published on `:8428` by default (for local access to
`/vmui` and `/targets`). In production, either remove the `ports:` entry and
access it through a reverse proxy with authentication, or restrict the bind
address to `127.0.0.1:8428`.

**Rotate `ANON_KEY` if metrics are exposed externally.**
If Supavisor or Realtime metrics are scraped from outside the Docker network
(for example, by a remote Grafana Cloud agent), the Bearer token is your only
access control. Treat `ANON_KEY` as a scrape credential and rotate it if
compromised.

**For production environments**, review the upstream hardening guides:

- [Kong Admin API security](https://developer.konghq.com/gateway/secure-the-admin-api/)
- [Envoy security hardening (Supabase)](https://supabase.com/docs/guides/self-hosting/self-hosted-envoy#security-hardening)
- [Envoy Admin API reference](https://www.envoyproxy.io/docs/envoy/latest/operations/admin)

---

## Related

- [Overview → Full service reference and getting started guide](./README.md)
- [Prometheus pull → Per-service setup and scrape config](./prometheus-pull.md)
- [OTel push → Storage metrics via OpenTelemetry Collector](./otel-push.md)
