Connecting to a Postgres database with Prisma is easy.

## PgBouncer Compatibility

Supavisor pool modes behave the same way as PgBouncer. You should be able to
connect to Supavisor with the exact same connection string as you use for
PgBouncer.

## Named Prepared Statements

Prisma will use named prepared statements to query Postgres by default.

To turn off named prepared statements use `pgbouncer=true` in your connection
string with Prisma.

The `pgbouncer=true` connection string parameter is compatible with Supavisor.

Alternatively, Supavisor supports named prepared statements in transaction
mode when the `named_prepared_statements` feature flag is enabled, either
globally with the `NAMED_PREPARED_STATEMENTS_ENABLED` environment variable or
per tenant via `feature_flags`. With it enabled, Prisma can connect through
transaction mode without `pgbouncer=true`.

## Slow Queries on Tables with Extension Types

With `pgbouncer=true`, Prisma does not reuse its per-connection statement and
type caches across transactions. For columns whose types come from extensions
(such as `citext`), Prisma then resolves the type OID with extra lookups
against `pg_type` inside every transaction, costing two additional
client-server round trips per column. Over high-latency connections these
round trips dominate, and queries on such tables can be several times slower
than on tables with only built-in types (whose OIDs are known to the client
statically). The same slowdown occurs with PgBouncer in transaction mode; it
is client behavior, not work done by the pooler.

To avoid it, enable the `named_prepared_statements` feature flag and connect
without `pgbouncer=true`, or use session mode.

## Prisma Connection Management

Make sure to review the [Prisma connection management guide](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management).
