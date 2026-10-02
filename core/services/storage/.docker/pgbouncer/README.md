# PgBouncer for Multitenant Database

Production-ready PgBouncer container that auto-tunes connection pool settings based on the AWS RDS instance type.

## Quick Start

```bash
# Build
docker build -t pgbouncer-mt .docker/pgbouncer/

# Run (local development)
docker run -p 6432:6432 \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/postgres \
  pgbouncer-mt

# Run (production with auto-tuning)
docker run -p 6432:6432 \
  -e DATABASE_URL=postgresql://user:pass@my-rds-instance.amazonaws.com:5432/mydb \
  -e AWS_DB_INSTANCE_TYPE=db.r6g.xlarge \
  -e DATABASE_SSL_ROOT_CERT="$(cat rds-ca.pem)" \
  pgbouncer-mt

# Connect through PgBouncer
psql postgresql://user:pass@localhost:6432/mydb
```

## Auto-Tuning

When `AWS_DB_INSTANCE_TYPE` is set, pool sizes are derived from the instance memory:

1. Estimate RDS `max_connections`: `memory_bytes / 9531392` (capped at 5000)
2. `default_pool_size` = 75% of max_connections
3. `max_client_conn` = 10x default_pool_size
4. `min_pool_size` = 10% of default_pool_size
5. `reserve_pool_size` = 5% of default_pool_size

| Instance       | Memory | Est. max_conn | Pool Size | Max Clients |
| -------------- | ------ | ------------- | --------- | ----------- |
| db.t3.micro    | 1 GB   | 112           | 84        | 840         |
| db.t3.large    | 8 GB   | 901           | 675       | 6,750       |
| db.r6g.xlarge  | 32 GB  | 3,604         | 2,703     | 27,030      |
| db.r6g.4xlarge | 128 GB | 5,000         | 3,750     | 37,500      |

When no instance type is set, conservative local defaults are used: `default_pool_size=20`, `max_client_conn=200`.

### Supported Instance Families

`db.t3`, `db.t4g`, `db.r5`, `db.r6g`, `db.r6i`, `db.r7g`, `db.m5`, `db.m6g`, `db.m6i`, `db.m7g`

## TLS

TLS mode can be configured in three ways (highest priority first):

1. `PGBOUNCER_SERVER_TLS_MODE` env var
2. `sslmode` query parameter in `DATABASE_URL`
3. Auto-detect: `verify-full` when `DATABASE_SSL_ROOT_CERT` is set, `disable` otherwise

### Encrypted without verification (`no-verify`)

Use `?sslmode=no-verify` in the DSN to encrypt the connection without certificate verification. This is mapped to pgbouncer's `require` mode:

```bash
docker run -p 6432:6432 \
  -e DATABASE_URL=postgresql://user:pass@rds-host:5432/mydb?sslmode=no-verify \
  pgbouncer-mt
```

### Full verification with CA certificate

Set `DATABASE_SSL_ROOT_CERT` to the CA certificate content (PEM or base64-encoded):

```bash
# From a PEM file
-e DATABASE_SSL_ROOT_CERT="$(cat rds-combined-ca-bundle.pem)"

# Base64-encoded
-e DATABASE_SSL_ROOT_CERT="$(base64 < rds-combined-ca-bundle.pem)"
```

This automatically enables `verify-full` mode unless overridden by `sslmode` in the DSN or `PGBOUNCER_SERVER_TLS_MODE`.

## Environment Variables

| Variable                       | Required | Default                   | Description                                                                    |
| ------------------------------ | -------- | ------------------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL`                 | Yes      | —                         | PostgreSQL connection string                                                   |
| `AWS_DB_INSTANCE_TYPE`         | No       | —                         | RDS instance type for auto-tuning (e.g. `db.r6g.xlarge`)                       |
| `DATABASE_SSL_ROOT_CERT`       | No       | —                         | PEM or base64 CA cert; enables `verify-full` TLS                               |
| `PGBOUNCER_POOL_MODE`          | No       | `transaction`             | Pooling mode                                                                   |
| `PGBOUNCER_DEFAULT_POOL_SIZE`  | No       | auto                      | Max backend connections per database                                           |
| `PGBOUNCER_MAX_CLIENT_CONN`    | No       | auto                      | Max client connections                                                         |
| `PGBOUNCER_MIN_POOL_SIZE`      | No       | auto                      | Min backend connections kept open                                              |
| `PGBOUNCER_RESERVE_POOL_SIZE`  | No       | auto                      | Extra connections for burst traffic                                            |
| `PGBOUNCER_MAX_DB_CONNECTIONS` | No       | `0` (unlimited)           | Hard cap on backend connections                                                |
| `PGBOUNCER_SERVER_TLS_MODE`    | No       | `verify-full` / `disable` | TLS mode (`disable`, `allow`, `prefer`, `require`, `verify-ca`, `verify-full`) |
| `PGBOUNCER_AUTH_TYPE`          | No       | `scram-sha-256`           | Authentication method                                                          |
| `PGBOUNCER_ADMIN_USERS`        | No       | DSN user                  | Users allowed to run admin commands                                            |
| `PGBOUNCER_STATS_USERS`        | No       | DSN user                  | Users allowed to view stats                                                    |

Any auto-calculated value can be overridden by setting the corresponding env var explicitly.

## Health Check

The container includes a built-in health check that probes port 6432 every 10 seconds. Use it with orchestrators:

```yaml
# docker-compose example
services:
  pgbouncer:
    build: .docker/pgbouncer/
    ports:
      - "6432:6432"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/postgres
    depends_on:
      - db
```
