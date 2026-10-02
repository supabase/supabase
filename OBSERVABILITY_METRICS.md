# Observability and Metrics

## Table of contents

- [Metrics Endpoints](#metrics-endpoints)
- [Metric Scopes](#metric-scopes)
- [Connection & Tenant Metrics](#connection--tenant-metrics)
- [Event Metrics](#event-metrics)
- [Payload & Traffic Metrics](#payload--traffic-metrics)
- [Latency & Performance Metrics](#latency--performance-metrics)
- [Authorization & Error Metrics](#authorization--error-metrics)
- [Subscription Pooler Metrics](#subscription-pooler-metrics)
- [Tenant Migration Metrics](#tenant-migration-metrics)
- [BEAM/Erlang VM Metrics](#beamerlang-vm-metrics)
  - [Memory Metrics](#memory-metrics)
  - [Process & Resource Metrics](#process--resource-metrics)
  - [Performance Metrics](#performance-metrics)
- [Infrastructure Metrics](#infrastructure-metrics)
  - [Node Metrics](#node-metrics)
  - [Distributed System Metrics](#distributed-system-metrics)

Supabase Realtime exposes comprehensive metrics for monitoring performance, resource usage, and application behavior. These metrics are exposed in Prometheus format and can be scraped by any compatible monitoring system (Victoria Metrics, Prometheus, Grafana Agent, etc.).

## Metrics Endpoints

Metrics are split across two endpoints with different priorities, allowing you to configure different scrape intervals in your monitoring system:

| Endpoint                      | Priority | Recommended Scrape Interval | Contents                                                                                         |
| ----------------------------- | -------- | --------------------------- | ------------------------------------------------------------------------------------------------ |
| `GET /metrics`                | **High** | 30s                         | BEAM/VM, OS, Phoenix, distributed infra, and global aggregated tenant totals (no `tenant` label) |
| `GET /tenant-metrics`         | **Low**  | 60s                         | Per-tenant labeled metrics (connection counts, channel events, replication, authorization)       |
| `GET /metrics/:region`        | **High** | 30s                         | Same as `/metrics` scoped to a specific region                                                   |
| `GET /tenant-metrics/:region` | **Low**  | 60s                         | Same as `/tenant-metrics` scoped to a specific region                                            |

All endpoints require a `Bearer` JWT token in the `Authorization` header signed with `METRICS_JWT_SECRET`.

**Victoria Metrics scrape configuration example:**

```yaml
scrape_configs:
  - job_name: realtime_global
    scrape_interval: 30s
    bearer_token: <METRICS_JWT_SECRET_TOKEN>
    static_configs:
      - targets: ["<host>:4000"]
    metrics_path: /metrics

  - job_name: realtime_tenant
    scrape_interval: 60s
    bearer_token: <METRICS_JWT_SECRET_TOKEN>
    static_configs:
      - targets: ["<host>:4000"]
    metrics_path: /tenant-metrics
```

## Metric Scopes

Metrics are classified by their scope to help you understand what they measure:

- **Per-Tenant**: Metrics tagged with a `tenant` label measure activity scoped to individual tenants. Exposed on `/tenant-metrics`.
- **Global Aggregate**: Metrics prefixed with `realtime_channel_global_*` or `realtime_connections_global_*` aggregate tenant data without the `tenant` label, suitable for cluster-wide dashboards. Exposed on `/metrics`.
- **Per-Node**: Metrics measure activity on the current Realtime node. Without explicit per-node indication, assume metrics apply to the local node.
- **BEAM/Erlang VM**: Metrics prefixed with `beam_*` and `phoenix_*` expose Erlang runtime internals. Exposed on `/metrics`.
- **Infrastructure**: Metrics prefixed with `osmon_*`, `gen_rpc_*`, and `dist_*` measure system-level resources and cluster communication. Exposed on `/metrics`.

## Connection & Tenant Metrics

These metrics track WebSocket connections and tenant activity across the Realtime cluster.

| Metric                                          | Type    | Description                                                                                                                                       | Scope            | Endpoint          |
| ----------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ----------------- |
| `realtime_tenants_connected`                    | Gauge   | Number of connected tenants per Realtime node. Use this to understand tenant distribution across your cluster and identify load imbalances.       | Per-Node         | `/metrics`        |
| `realtime_connections_global_connected`         | Gauge   | Node total of active WebSocket connections across all tenants. Aggregated without a `tenant` label for cluster-wide dashboards.                   | Global Aggregate | `/metrics`        |
| `realtime_connections_global_connected_cluster` | Gauge   | Cluster-wide total of active WebSocket connections across all tenants.                                                                            | Global Aggregate | `/metrics`        |
| `realtime_connections_connected`                | Gauge   | Active WebSocket connections that have at least one subscribed channel. Indicates active client engagement with Realtime features.                | **Per-Tenant**   | `/tenant-metrics` |
| `realtime_connections_connected_cluster`        | Gauge   | Cluster-wide active WebSocket connections for each individual tenant.                                                                             | **Per-Tenant**   | `/tenant-metrics` |
| `phoenix_connections_total`                     | Gauge   | Total open connections to the Ranch listener (includes idle connections waiting for data).                                                        | Per-Node         | `/metrics`        |
| `phoenix_connections_active`                    | Gauge   | Connections actively processing a WebSocket frame or HTTP request. Divide by `phoenix_connections_max` to get a saturation ratio.                 | Per-Node         | `/metrics`        |
| `phoenix_connections_max`                       | Gauge   | The configured Ranch connection limit. When `phoenix_connections_total` approaches this the node is saturated and new connections will be queued. | Per-Node         | `/metrics`        |
| `realtime_channel_joins`                        | Counter | Rate of channel join attempts per second per tenant.                                                                                              | **Per-Tenant**   | `/tenant-metrics` |
| `realtime_channel_global_joins`                 | Counter | Global rate of channel join attempts per second across all tenants.                                                                               | Global Aggregate | `/metrics`        |

## Event Metrics

These metrics measure the volume and types of events flowing through your Realtime system, segmented by feature type.

| Metric                                    | Type    | Description                                                                                                                 | Scope            | Endpoint          |
| ----------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------- | ----------------- |
| `realtime_channel_events`                 | Counter | Broadcast events per second per tenant.                                                                                     | **Per-Tenant**   | `/tenant-metrics` |
| `realtime_channel_presence_events`        | Counter | Presence events per second per tenant. Includes online/offline status updates and custom presence metadata synchronization. | **Per-Tenant**   | `/tenant-metrics` |
| `realtime_channel_db_events`              | Counter | Postgres Changes events per second per tenant.                                                                              | **Per-Tenant**   | `/tenant-metrics` |
| `realtime_channel_global_events`          | Counter | Global broadcast events per second across all tenants. Compare against per-tenant values for outlier detection.             | Global Aggregate | `/metrics`        |
| `realtime_channel_global_presence_events` | Counter | Global presence events per second across all tenants.                                                                       | Global Aggregate | `/metrics`        |
| `realtime_channel_global_db_events`       | Counter | Global Postgres Changes events per second across all tenants.                                                               | Global Aggregate | `/metrics`        |

## Payload & Traffic Metrics

These metrics provide insight into data volume, message sizes, and network I/O characteristics.

| Metric                                 | Type      | Description                                                                                                                     | Scope            | Endpoint          |
| -------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ----------------- |
| `realtime_payload_size_bucket`         | Histogram | Global payload size distribution across all tenants, tagged by message type. Use for cluster-wide sizing and capacity planning. | Global Aggregate | `/metrics`        |
| `realtime_tenants_payload_size_bucket` | Histogram | Per-tenant payload size distribution. Use this to identify tenants generating unusually large messages.                         | **Per-Tenant**   | `/tenant-metrics` |
| `realtime_channel_input_bytes`         | Counter   | Total ingress bytes per tenant.                                                                                                 | **Per-Tenant**   | `/tenant-metrics` |
| `realtime_channel_output_bytes`        | Counter   | Total egress bytes per tenant.                                                                                                  | **Per-Tenant**   | `/tenant-metrics` |
| `realtime_channel_global_input_bytes`  | Counter   | Global total ingress bytes across all tenants.                                                                                  | Global Aggregate | `/metrics`        |
| `realtime_channel_global_output_bytes` | Counter   | Global total egress bytes across all tenants.                                                                                   | Global Aggregate | `/metrics`        |

## Latency & Performance Metrics

These metrics measure end-to-end latency and processing performance across different Realtime operations.

| Metric                                                                 | Type      | Description                                                                                                      | Scope            | Endpoint          |
| ---------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------- | ---------------- | ----------------- |
| `realtime_replication_poller_query_duration_bucket`                    | Histogram | Postgres Changes query latency in milliseconds per tenant. High values may indicate database performance issues. | **Per-Tenant**   | `/tenant-metrics` |
| `realtime_replication_poller_query_duration_count`                     | Counter   | Number of database polling queries executed per tenant.                                                          | **Per-Tenant**   | `/tenant-metrics` |
| `realtime_tenants_broadcast_from_database_latency_committed_at_bucket` | Histogram | Time from database commit to client broadcast per tenant.                                                        | **Per-Tenant**   | `/tenant-metrics` |
| `realtime_tenants_broadcast_from_database_latency_inserted_at_bucket`  | Histogram | Alternative latency using insert timestamp per tenant.                                                           | **Per-Tenant**   | `/tenant-metrics` |
| `realtime_tenants_replay_bucket`                                       | Histogram | Broadcast replay latency per tenant.                                                                             | **Per-Tenant**   | `/tenant-metrics` |
| `realtime_global_rpc_bucket`                                           | Histogram | Inter-node RPC call latency distribution, tagged by `success` and `mechanism`.                                   | Global Aggregate | `/metrics`        |
| `realtime_global_rpc_count`                                            | Counter   | Total inter-node RPC calls. Divide failed by total to get error rate.                                            | Global Aggregate | `/metrics`        |
| `realtime_tenants_read_authorization_check_bucket`                     | Histogram | RLS policy evaluation time for read operations per tenant.                                                       | **Per-Tenant**   | `/tenant-metrics` |
| `realtime_tenants_read_authorization_check_count`                      | Counter   | Number of read authorization checks per tenant.                                                                  | **Per-Tenant**   | `/tenant-metrics` |
| `realtime_tenants_write_authorization_check_bucket`                    | Histogram | RLS policy evaluation time for write operations per tenant.                                                      | **Per-Tenant**   | `/tenant-metrics` |
| `phoenix_channel_handled_in_duration_milliseconds_bucket`              | Histogram | Time for the application to respond to a channel message. High p99 values indicate slow message handlers.        | Per-Node         | `/metrics`        |
| `phoenix_socket_connected_duration_milliseconds_bucket`                | Histogram | Time to establish a WebSocket socket connection, tagged by `result`/`transport`/`serializer`.                    | Per-Node         | `/metrics`        |

## Authorization & Error Metrics

These metrics track security policy enforcement and error rates.

| Metric                          | Type    | Description                                                                                                                                     | Scope            | Endpoint          |
| ------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ----------------- |
| `realtime_channel_error`        | Counter | Unhandled channel errors per tenant. Any non-zero value warrants investigation.                                                                 | **Per-Tenant**   | `/tenant-metrics` |
| `realtime_channel_global_error` | Counter | Global unhandled channel error count across all tenants, tagged by error code.                                                                  | Global Aggregate | `/metrics`        |
| `phoenix_channel_joined_total`  | Counter | WebSocket channel join attempts tagged by `result` (`ok`/`error`) and `transport`. Use `result="error"` rate to detect client or policy issues. | Per-Node         | `/metrics`        |

## Subscription Pooler Metrics

These metrics cover the Postgres Changes subscription pooler per tenant: the workers that hold subscriptions, poll the replication slot, and broadcast row changes to clients.

| Metric                                                | Type    | Description                                                                                  | Scope          | Endpoint          |
| ----------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------- | -------------- | ----------------- |
| `realtime_subscriptions_manager_subscribers`          | Gauge   | Subscribers tracked for the tenant across the cluster.                                       | **Per-Tenant** | `/tenant-metrics` |
| `realtime_replication_poller_stop_total`              | Counter | How many times the tenant's poller terminated, tagged by `reason`.                           | **Per-Tenant** | `/tenant-metrics` |
| `realtime_replication_poller_exception_total`         | Counter | How many times the tenant's poller crashed (terminated abnormally).                          | **Per-Tenant** | `/tenant-metrics` |
| `realtime_replication_poller_query_exception_total`   | Counter | How many of the tenant's polls failed reading changes from the slot, tagged by `reason`.     | **Per-Tenant** | `/tenant-metrics` |
| `realtime_replication_poller_prepare_exception_total` | Counter | How many of the tenant's attempts to prepare the replication slot for polling failed.        | **Per-Tenant** | `/tenant-metrics` |
| `realtime_replication_poller_changes_dispatch`        | Counter | Number of Postgres Changes rows the poller broadcast to subscribers.                         | **Per-Tenant** | `/tenant-metrics` |
| `realtime_replication_poller_changes_skip`            | Counter | Number of Postgres Changes rows skipped without broadcasting, tagged by `reason`.            | **Per-Tenant** | `/tenant-metrics` |
| `realtime_subscriptions_manager_dead_pid`             | Counter | Not-alive subscriber pids the manager handled, tagged by `reason`: `phantom` or `not_found`. | **Per-Tenant** | `/tenant-metrics` |

## Tenant Migration Metrics

These metrics track tenants migration execution and reconciliations.

| Metric                                                     | Type      | Description                                                                                                  | Scope            | Endpoint   |
| ---------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------ | ---------------- | ---------- |
| `realtime_tenants_migrations_duration_milliseconds_bucket` | Histogram | Tenant migration duration in milliseconds.                                                                   | Global Aggregate | `/metrics` |
| `realtime_tenants_migrations_duration_milliseconds_count`  | Counter   | Completed tenant migration runs.                                                                             | Global Aggregate | `/metrics` |
| `realtime_tenants_migrations_duration_milliseconds_sum`    | Counter   | Cumulative tenant migration time in milliseconds.                                                            | Global Aggregate | `/metrics` |
| `realtime_tenants_migrations_exceptions_total`             | Counter   | Failed tenant migration runs, tagged by `error_code`.                                                        | Global Aggregate | `/metrics` |
| `realtime_tenants_migrations_reconcile_total`              | Counter   | Tenants whose cached `migrations_ran` was reconciled against the database on connect.                        | Global Aggregate | `/metrics` |
| `realtime_tenants_migrations_reconcile_exceptions_total`   | Counter   | Failed reconciliations.                                                                                      | Global Aggregate | `/metrics` |

Per-tenant attribution lives on the log path — see [TELEMETRY.md](./TELEMETRY.md) for the alert query foundation.

## BEAM/Erlang VM Metrics

These metrics provide insight into the underlying Erlang runtime that powers Realtime, critical for capacity planning and debugging performance issues.

All BEAM/Erlang VM metrics are served from `GET /metrics`.

### Memory Metrics

| Metric                                    | Type  | Description                                                                                                                                                               |
| ----------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beam_memory_allocated_bytes`             | Gauge | Total memory allocated by the Erlang VM. Compare this to the container memory limit to ensure you have headroom. Steady increase may indicate a memory leak.              |
| `beam_memory_atom_total_bytes`            | Gauge | Memory used by the atom table. Atoms in Erlang are never garbage collected, so this should remain relatively stable. Unbounded growth indicates a bug creating new atoms. |
| `beam_memory_binary_total_bytes`          | Gauge | Memory used by binary data (WebSocket payloads, database results). This metric closely correlates with active connection volume and message sizes.                        |
| `beam_memory_code_total_bytes`            | Gauge | Memory used by compiled Erlang bytecode. Changes only during code reloads and should remain stable in production.                                                         |
| `beam_memory_ets_total_bytes`             | Gauge | Memory used by ETS (in-memory tables) including channel subscriptions and presence state. Monitor this to understand session storage overhead.                            |
| `beam_memory_processes_total_bytes`       | Gauge | Memory used by Erlang processes themselves. Each channel connection and background task consumes memory; this scales with concurrency.                                    |
| `beam_memory_persistent_term_total_bytes` | Gauge | Memory used by persistent terms (immutable shared state). Should be minimal and stable in typical Realtime deployments.                                                   |

### Process & Resource Metrics

| Metric                     | Type  | Description                                                                                                                                                           |
| -------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beam_stats_process_count` | Gauge | Number of active Erlang processes. Each WebSocket connection spawns processes; high values correlate with connection count. Sudden spikes may indicate process leaks. |
| `beam_stats_port_count`    | Gauge | Number of open port connections (network sockets, pipes). Should correlate roughly with connection count plus internal cluster communications.                        |
| `beam_stats_ets_count`     | Gauge | Number of active ETS tables used for caching and state. Changes reflect dynamic supervisor activity and feature usage patterns.                                       |
| `beam_stats_atom_count`    | Gauge | Total atoms in the atom table. Should remain relatively stable; unbounded growth indicates code bugs.                                                                 |

### Performance Metrics

| Metric                                 | Type    | Description                                                                                                                                                           |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beam_stats_uptime_milliseconds_count` | Counter | Node uptime in milliseconds. Use this to track restarts and validate deployment stability. Unexpected resets indicate crashes.                                        |
| `beam_stats_port_io_byte_count`        | Counter | Total bytes transferred through network ports. Compare ingress and egress to identify asymmetric traffic patterns.                                                    |
| `beam_stats_gc_count`                  | Counter | Garbage collection events executed by the Erlang VM. Frequent GC indicates high memory churn; infrequent GC suggests stable state.                                    |
| `beam_stats_gc_reclaimed_bytes`        | Counter | Bytes reclaimed by garbage collection. Divide by GC count to understand average cleanup size. Low reclaim per GC may indicate inefficient memory allocation patterns. |
| `beam_stats_reduction_count`           | Counter | Total reductions (work units) executed by the VM. Correlates with CPU usage; high reduction rates under stable load indicate inefficient algorithms.                  |
| `beam_stats_context_switch_count`      | Counter | Process context switches by the Erlang scheduler. High values indicate contention between many processes; compare with process count to gauge congestion.             |
| `beam_stats_active_task_count`         | Gauge   | Tasks currently executing on dirty schedulers (non-Erlang operations). High values indicate CPU-bound work or blocking I/O.                                           |
| `beam_stats_run_queue_count`           | Gauge   | Processes waiting to be scheduled. High values indicate CPU saturation; the node cannot keep up with work demand.                                                     |

## Infrastructure Metrics

These metrics expose system-level resource usage and inter-node cluster communication. All infrastructure metrics are served from `GET /metrics`.

### Node Metrics

| Metric            | Type  | Description                                                                                                                                             |
| ----------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `osmon_cpu_util`  | Gauge | Current CPU utilization percentage (0-100). Monitor this to trigger horizontal scaling and identify CPU-bound bottlenecks.                              |
| `osmon_cpu_avg1`  | Gauge | 1-minute CPU load average. Sharp increases indicate sudden load spikes; values > CPU count indicate sustained overload.                                 |
| `osmon_cpu_avg5`  | Gauge | 5-minute CPU load average. Smooths short-term spikes; use this to detect sustained load increases.                                                      |
| `osmon_cpu_avg15` | Gauge | 15-minute CPU load average. Indicates long-term trends; use for capacity planning and detecting gradual load growth.                                    |
| `osmon_ram_usage` | Gauge | RAM utilization percentage (0-100). Combined with `beam_memory_allocated_bytes`, this indicates kernel memory overhead and other processes on the node. |

### Distributed System Metrics

| Metric                                         | Type    | Description                                                                                                                                                                                                                        |
| ---------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gen_rpc_queue_size_bytes`                     | Gauge   | Outbound queue size for gen_rpc inter-node communication in bytes. Large values indicate a receiving node cannot keep up with message rate.                                                                                        |
| `gen_rpc_send_pending_bytes`                   | Gauge   | Bytes pending transmission in gen_rpc queues. Combined with queue size, helps identify network saturation or slow receivers.                                                                                                       |
| `gen_rpc_send_bytes`                           | Counter | Total bytes sent via gen_rpc across the cluster. Monitor this to understand inter-node traffic and plan network capacity.                                                                                                          |
| `gen_rpc_recv_bytes`                           | Counter | Total bytes received via gen_rpc from other nodes. Compare with send bytes to identify asymmetric communication patterns.                                                                                                          |
| `dist_queue_size`                              | Gauge   | Erlang distribution queue size for cluster communication. High values indicate network congestion or unbalanced load across nodes.                                                                                                 |
| `dist_send_pending_bytes`                      | Gauge   | Bytes pending in Erlang distribution queues. Works with queue size to diagnose cluster communication issues.                                                                                                                       |
| `dist_send_bytes`                              | Counter | Total bytes sent via Erlang distribution protocol. Includes all cluster metadata and RPC traffic.                                                                                                                                  |
| `dist_recv_bytes`                              | Counter | Total bytes received via Erlang distribution protocol. Compare with send to validate symmetric communication.                                                                                                                      |
| `realtime_presence_replication_received_bytes` | Counter | Bytes (`:erlang.external_size/1`) of Presence state replication received from other nodes, tagged by `implementation` (`phoenix` = `Phoenix.Tracker` gossip). Not client presence events (see `realtime_channel_presence_events`). |

