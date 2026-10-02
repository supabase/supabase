# Supavisor Environment Variables

This document provides a categorized list of all environment variables used in Supavisor, including connection pool settings, clustering, Phoenix API server, and logging configuration.

## Table of Contents

1. [Core Configuration](#1-core-configuration)
2. [Management API Configuration](#2-management-api-configuration)
   - [Phoenix HTTP Server](#phoenix-http-server)
   - [Security](#security)
   - [Metrics](#metrics)
   - [Logging](#logging)
3. [Metadata Database Configuration](#3-metadata-database-configuration)
4. [Node and Clustering Configuration](#4-node-and-clustering-configuration)
5. [Fly.io Deployment Configuration](#5-flyio-deployment-configuration)
6. [Release Configuration](#6-release-configuration)
7. [Testing Configuration](#7-testing-configuration)

---

## 1. Core Configuration

| Variable                      | Description                                                | Default Value             | Required |
| ----------------------------- | ---------------------------------------------------------- | ------------------------- | -------- |
| `PROXY_PORT_TRANSACTION`      | Transaction pool port                                      | `6543`                    | No       |
| `PROXY_PORT_SESSION`          | Session pool port                                          | `5432`                    | No       |
| `PROXY_PORT`                  | Internal proxy port                                        | `5412`                    | No       |
| `SUBSCRIBE_RETRIES`           | Number of subscription retries                             | `20`                      | No       |
| `ADMISSION_RETRIES`           | Retries waiting for a free client slot before EMAXCONN     | `5`                       | No       |
| `ADMISSION_BACKOFF`           | Backoff between admission retries (ms)                     | `300`                     | No       |
| `SWITCH_ACTIVE_COUNT`         | Switch active connection count                             | `100`                     | No       |
| `GLOBAL_UPSTREAM_CA_PATH`     | Upstream CA certificate path                               | -                         | No       |
| `GLOBAL_DOWNSTREAM_CERT_PATH` | Downstream certificate path                                | -                         | No       |
| `GLOBAL_DOWNSTREAM_KEY_PATH`  | Downstream private key path                                | -                         | No       |
| `SESSION_PROXY_PORTS`         | Comma-separated list of ports for session proxy shards     | `12100,12101,12102,12103` | No       |
| `TRANSACTION_PROXY_PORTS`     | Comma-separated list of ports for transaction proxy shards | `12104,12105,12106,12107` | No       |

### Feature Flags

| Variable                            | Description                                                  | Default Value | Required |
| ----------------------------------- | ------------------------------------------------------------ | ------------- | -------- |
| `NAMED_PREPARED_STATEMENTS_ENABLED` | Enable named prepared statements feature (true, false, 1, 0) | `false`       | No       |
| `APP_NAME_METRIC_ENABLED`           | Add client `app_name` label to connection metrics (true, false, 1, 0) | `false` | No       |

---

## 2. Management API Configuration

### Phoenix HTTP Server

| Variable          | Description                  | Default Value | Required      |
| ----------------- | ---------------------------- | ------------- | ------------- |
| `PORT`            | Server port                  | `4000`        | No            |
| `MAX_CONNECTIONS` | Maximum connections allowed  | `1000`        | No            |
| `NUM_ACCEPTORS`   | Number of acceptor processes | `100`         | No            |
| `ADDR_TYPE`       | Socket address type          | `inet`        | No            |
| `SECRET_KEY_BASE` | Phoenix endpoint secret key  | -             | Yes (in prod) |

### Security

| Variable                  | Description                                                     | Default Value | Required             |
| ------------------------- | --------------------------------------------------------------- | ------------- | -------------------- |
| `JWT_CLAIM_VALIDATORS`    | JWT claim validators configuration                              | `{}`          | No                   |
| `API_JWT_SECRET`          | Secret for API JWT authentication                               | -             | No                   |
| `METRICS_JWT_SECRET`      | Secret for metrics JWT authentication                           | -             | No                   |
| `API_TOKEN_BLOCKLIST`     | Comma-separated list of blocked API tokens                      | -             | No                   |
| `METRICS_TOKEN_BLOCKLIST` | Comma-separated list of blocked metrics tokens                  | -             | No                   |
| `CACHE_BYPASS_USERS`      | Comma-separated list of users to skip validation secret caching | -             | No                   |
| `NO_WARM_POOL_USERS`      | Comma-separated list of users with no warm pool (min size 0)    | -             | No                   |
| `VAULT_ENC_KEY`           | Encryption key for Vault                                        | -             | Yes (if using Vault) |

### Metrics

| Variable           | Description                             | Default Value | Required |
| ------------------ | --------------------------------------- | ------------- | -------- |
| `METRICS_DISABLED` | Disable metrics collection              | `false`       | No       |
| `PROM_POLL_RATE`   | Prometheus polling rate in milliseconds | `15000`       | No       |

### Logging

| Variable                         | Description             | Default Value | Required                |
| -------------------------------- | ----------------------- | ------------- | ----------------------- |
| `SUPAVISOR_LOG_FILE_PATH`        | Path to log file        | -             | No                      |
| `SUPAVISOR_LOG_FORMAT`           | Log format (json/text)  | `text`        | No                      |
| `SUPAVISOR_LOG_BURST_LIMIT_ENABLE` | Enable burst-limit overload protection on the `:default` logger handler | `true` | No |
| `SUPAVISOR_LOG_BURST_LIMIT_MAX_COUNT` | Max log events the `:default` logger handler writes per burst-limit window | `500` | No |
| `SUPAVISOR_LOG_BURST_LIMIT_WINDOW_TIME` | Burst-limit window size for the `:default` logger handler, in milliseconds | `1000` | No |
| `LOGS_ENGINE`                    | Logging engine to use   | -             | No                      |
| `LOGFLARE_API_KEY`               | Logflare API key        | -             | Yes (if using Logflare) |
| `LOGFLARE_SOURCE_ID`             | Logflare source ID      | -             | Yes (if using Logflare) |

---

## 3. Metadata Database Configuration

| Variable                  | Description                           | Default Value                                      | Required |
| ------------------------- | ------------------------------------- | -------------------------------------------------- | -------- |
| `DATABASE_URL`            | Connection URL                        | `ecto://postgres:postgres@localhost:6432/postgres` | No       |
| `DB_POOL_SIZE`            | Connection pool size                  | `25`                                               | No       |
| `SUPAVISOR_DB_IP_VERSION` | IP version for connection (ipv4/ipv6) | auto-detects from `DATABASE_URL`                   | No       |

---

## 4. Node and Clustering Configuration

| Variable            | Description                                                                 | Default Value | Required |
| ------------------- | --------------------------------------------------------------------------- | ------------- | -------- |
| `NODE_NAME`         | Base name for the node                                                      | `supavisor`   | No       |
| `NODE_IP`           | Node host IP address                                                        | `127.0.0.1`   | No       |
| `AVAILABILITY_ZONE` | Current availability zone                                                   | -             | No       |
| `REGION`            | Current region (falls back to `FLY_REGION` if not set)                      | -             | No       |
| `DNS_POLL`          | DNS polling configuration for clustering                                    | -             | No       |
| `CLUSTER_NODES`     | Comma-separated list of cluster nodes                                       | -             | No       |
| `CLUSTER_POSTGRES`  | Enable PostgreSQL-based clustering (uses `DATABASE_URL` for node discovery) | -             | No       |
| `CLUSTER_ID`        | Cluster identifier                                                          | -             | No       |
| `LOCATION_ID`       | Location identifier                                                         | -             | No       |
| `LOCATION_KEY`      | Location key (falls back to region if not set)                              | -             | No       |
| `INSTANCE_ID`       | Instance identifier                                                         | -             | No       |

---

## 5. Fly.io Deployment Configuration

| Variable       | Description      | Default Value | Required |
| -------------- | ---------------- | ------------- | -------- |
| `FLY_APP_NAME` | Application name | -             | No       |
| `FLY_REGION`   | Region           | -             | No       |
| `FLY_ALLOC_ID` | Allocation ID    | -             | No       |

## 6. Release Configuration

| Variable                    | Description                                         | Default Value | Required |
| --------------------------- | --------------------------------------------------- | ------------- | -------- |
| `INCLUDE_ERTS`              | Whether to include ERTS in the release              | `true`        | No       |
| `RELEASE_COOKIE`            | Release cookie for distributed Erlang               | Random value  | No       |
| `UPGRADE_FROM`              | Version to upgrade from during hot upgrades         | -             | No       |
| `DEBUG_LOAD_RUNTIME_CONFIG` | Load runtime config from config/runtime.exs if true | -             | No       |
| `RELEASE_ROOT`              | Root directory of the release                       | -             | No       |

## 7. Testing Configuration

| Variable    | Description                  | Default Value | Required |
| ----------- | ---------------------------- | ------------- | -------- |
| `TEST_LOGS` | Controls test logging output | `all`         | No       |
