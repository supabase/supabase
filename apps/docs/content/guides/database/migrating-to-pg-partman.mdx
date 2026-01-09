---
id: 'migrating-from-timescaledb-to-pg-partman'
title: 'Migrate from TimescaleDB to pg_partman'
description: 'Convert TimescaleDB hypertables to Postgres native partitions managed by pg_partman.'
---

Starting from Postgres 17, Supabase projects do not have the `timescaledb` extension available. If your project relies on TimescaleDB hypertables, you will need to migrate to standard Postgres tables before upgrading.

This guide shows one approach to migrate a hypertable to a native Postgres partitioned table and optionally configure `pg_partman` to automate ongoing partition maintenance.
The approach outlined in this guide can also be used for traditional partitioned tables.

## Before you begin

- Test the migration path in a staging environment (for example by creating a copy of your production project or using branching).
- Review your application for TimescaleDB-specific SQL usage (for example `time_bucket()`, compression policies). Those features are not provided by `pg_partman`.

## Migration overview

1. Create a new partitioned table.
2. Copy data from the hypertable to the new table.
3. Swap over and drop the hypertable.
4. Configure `pg_partman` (optional) and schedule maintenance.

## Example: Migrate `messages` from hypertable to native partitions

This example assumes a `messages` hypertable partitioned by `sent_at`.

### 1. Rename the existing hypertable

This keeps the original data in place while you create a new partitioned table with the original name.

{/* prettier-ignore */}
```sql
alter table public.messages rename to ht_messages;
```

### 2. Create a new partitioned table

When using native partitioning, the partitioning column must be included in any unique index (including the primary key).

{/* prettier-ignore */}
```sql
create table public.messages (
  like public.ht_messages including all,
  primary key (sent_at, id)
)
partition by range (sent_at);
```

### 3. Copy data into the new table

For large tables, consider copying in batches (for example by time range) during a maintenance window.

{/* prettier-ignore */}
```sql
insert into public.messages
select *
from public.ht_messages;
```

### 4. Drop the old hypertable (and TimescaleDB)

Only drop the extension once you’ve migrated all hypertables and no other objects depend on it.

{/* prettier-ignore */}
```sql
drop table public.ht_messages;

drop extension if exists timescaledb;
```

### 5. Configure `pg_partman` (optional)

Enable `pg_partman` and register your table so partitions are created ahead of time.

{/* prettier-ignore */}
```sql
create schema if not exists partman;
create extension if not exists pg_partman with schema partman;

select partman.create_parent(
  p_parent_table := 'public.messages',
  p_control := 'sent_at',
  p_type := 'range',
  p_interval := '7 days',
  p_premake := 7,
  p_start_partition := '2025-01-01 00:00:00'
);
```

## Keep partitions up to date

`pg_partman` requires running maintenance to pre-make partitions and apply retention policies.

{/* prettier-ignore */}
```sql
call partman.run_maintenance_proc();
```

To automate this, schedule it with `pg_cron`.

{/* prettier-ignore */}
```sql
create extension if not exists pg_cron;

select cron.schedule('@daily', $$call partman.run_maintenance_proc()$$);
```

## Additional resources

- [Partitioning your tables](/docs/guides/database/partitions).
- [`pg_partman` documentation](/docs/guides/database/extensions/pg_partman)
- [`pg_partman` migration guides](https://github.com/pgpartman/pg_partman/blob/development/doc/migrate_to_partman.md)
