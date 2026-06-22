---
title: 'Migrate from Postgres to Supabase'
description: 'Migrate your existing Postgres database to Supabase.'
subtitle: 'Migrate your existing Postgres database to Supabase.'
---

This is a guide for migrating your Postgres database to [Supabase](https://supabase.com).
Supabase is a robust and open-source platform. Supabase provides all the backend features developers need to build a product: a Postgres database, authentication, instant APIs, edge functions, real-time subscriptions, and storage. Postgres is the core of Supabase—for example, you can use row-level security, and there are more than 40 Postgres extensions available.

This guide demonstrates how to migrate your Postgres database to Supabase to get the most out of Postgres while gaining access to all the features you need to build a project.

This guide provides three methods for migrating your Postgres database to Supabase:

1. **Google Colab** - Guided notebook with copy-paste workflow
2. **Manual Dump/Restore** - CLI approach, works for all versions
3. **Logical Replication** - Minimal downtime, requires Postgres 10+

## Connection modes

Supabase provides the following connection modes:

- Direct connection
- Supavisor session mode
- Supavisor transaction mode

Use Supavisor session mode for the database migration tasks (pg_dump/restore and logical replication).

## Method 1: Google Colab (easiest)

Supabase provides a Google Colab migration notebook for a guided migration experience:
[Supabase Migration Colab Notebook](https://colab.research.google.com/github/mansueli/Supa-Migrate/blob/main/Migrate_Postgres_Supabase.ipynb)

This is ideal if you prefer a step-by-step, copy-paste workflow with minimal setup.

## Method 2: Manual dump/restore

This method works for all Postgres versions using CLI tools.

### Prerequisites

#### Source Postgres requirements

- Connection string with rights to run `pg_dump`
- No special settings required for dump/restore
- Network access from migration VM

#### Migration environment

- Cloud VM running Ubuntu in the same region as source or target database
- Postgres client tools matching your source database version
- tmux for session persistence
- Sufficient disk space (usually ~50% of source database size is enough, but varies case by case)

### Pre-Migration checklist

```sql
-- Check database size
select pg_size_pretty(pg_database_size(current_database())) as size;

-- Check Postgres version
select version();

-- List installed extensions
select * from pg_extension order by extname;

-- Check active connections
select count(*) from pg_stat_activity;
```

#### Check available extensions in Supabase

```sql
-- Connect to your Supabase database and check available extensions
SELECT name, comment FROM pg_available_extensions ORDER BY name;

-- Compare with source database extensions
SELECT extname FROM pg_extension ORDER BY extname;

-- Install needed extensions
CREATE EXTENSION IF NOT EXISTS extension_name;
```

### Step 1: Set up migration VM

<Admonition type="tip">

For optimal performance, run the migration from a cloud VM, not your local machine. The VM should be in the same region as either your source or target database to optimize network performance. See the Resource Requirements table in Step 2 for VM sizing recommendations.

</Admonition>

#### Set up Ubuntu VM

```bash
# Install Postgres client and tools
sudo apt update
sudo apt install software-properties-common
sudo sh -c 'echo "deb http://apt.Postgres.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.Postgres.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install Postgres-client-17 tmux htop iotop moreutils

# Start or attach to tmux session
tmux a -t migration || tmux new -s migration
```

### Step 2: Prepare Supabase project

1. Create a Supabase project at [supabase.com/dashboard](/dashboard)
2. Note your database password
3. Install required extensions via SQL or Dashboard
4. Get your connection string:
   - Go to **Project → Settings → Database → Connection Pooling**
   - Select **Session pooler** (port 5432) and copy the connection string
   - Connection format: `Postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`

**Important Notes**:

- **Users/roles are not migrated** - You'll need to recreate roles and privileges after import ([Supabase Roles Guide](/blog/postgres-roles-and-privileges))
- **Row Level Security (RLS) status on tables is not migrated** - You'll need to enable RLS for tables after migration.

**Resource Requirements**:
| Database Size | Recommended Compute | Recommended VM | Action Required |
|--------------|-------------------|----------------|-----------------|
| < 10 GB | Default | 2 vCPUs, 4 GB RAM | None |
| 10-100 GB | Default-Small | 4 vCPUs, 8 GB RAM | Consider compute upgrade |
| 100-500 GB | Large compute | 8 vCPUs, 16 GB RAM, NVMe | Upgrade compute before restore |
| 500 GB - 1 TB | XL compute | 16 vCPUs, 32 GB RAM, NVMe | Upgrade compute before restore |
| > 1 TB | Custom | Custom | [Contact support](/dashboard/support/new) first |

Also, you can temporarily increase compute size and/or disk IOPS and throughput via Settings → Compute and Disk if you want faster database restore (you can use larger -j for pg_restore if you do so).

### Step 3: Create database dump

#### Set source database to read only mode for production migration

If doing a maintenance window migration, prevent data changes:

```sql
-- Connect to source database and run:
ALTER DATABASE your_database_name SET default_transaction_read_only = true;
```

For testing without a maintenance window, skip this step but use lower -j values.

#### Dump the database

```bash
# Determine number of parallel jobs based on:
# - Source database CPU cores (don't saturate production)
# - VM CPU cores
# - For testing without maintenance window: use lower values to be gentle
# - For production with maintenance window: can use higher values

DUMP_JOBS=4  # Adjust based on your setup

# Check available cores on VM
nproc

# Create dump with progress logging
pg_dump \
  --host=<source_host> \
  --port=<source_port> \
  --username=<source_username> \
  --dbname=<source_database> \
  --jobs=$DUMP_JOBS \
  --format=directory \
  --no-owner \
  --no-privileges \
  --no-subscriptions \
  --verbose \
  --file=./db_dump 2>&1 | ts | tee -a dump.log
```

**Notes about dump flags**:

- `--no-owner --no-privileges`: Applied at dump time to prevent Supabase user management conflicts. While these could be used in pg_restore instead, applying them during dump keeps the dump file cleaner and more portable.
- `--no-subscriptions`: Logical replication subscriptions won't work in the target
- The dump captures all data and schema but excludes ownership/privileges that would conflict with Supabase's managed environment
- To only migrate a single database schema, add the `--schema=PATTERN` parameter to your `pg_dump` command.
- To exclude a schema: `--exclude-schema=PATTERN`.
- To only migrate a single table: `--table=PATTERN`.
- To exclude a table: `--exclude-table=PATTERN`.

Run `pg_dump --help` for a full list of options.

#### Recommended parallelization (-j values)

| Database Size | Testing (no maintenance window) | Production (with maintenance window) | Limiting Factor |
| ------------- | ------------------------------- | ------------------------------------ | --------------- |
| < 10 GB       | 2                               | 4                                    | Source CPU      |
| 10-100 GB     | 2-4                             | 8                                    | Source CPU      |
| 100-500 GB    | 4                               | 16                                   | Disk IOPS       |
| 500 GB - 1 TB | 4-8                             | 16-32                                | Disk IOPS + CPU |

**Note**: For testing without a maintenance window, use lower -j values to avoid impacting production performance.

### Step 4: Restore to Supabase

#### Set connection and restore

```bash
# Set Supabase connection (Session Pooler on port 5432 or direct connection)
export SUPABASE_DB_URL="Postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Determine restore parallelization based on your Supabase compute size:
# Free tier: 2 cores → use -j 2
# Small compute: 2 cores → use -j 2
# Medium compute: 4 cores → use -j 4
# Large compute: 8 cores → use -j 8
# XL compute: 16 cores → use -j 16

RESTORE_JOBS=8  # Adjust based on your Supabase compute size

# Restore the dump (parallel mode)
# Note: -j cannot be used with --single-transaction
pg_restore \
  --dbname="$SUPABASE_DB_URL" \
  --jobs=$RESTORE_JOBS \
  --format=directory \
  --no-owner \
  --no-privileges \
  --verbose \
  ./db_dump 2>&1 | ts | tee -a restore.log
```

If restore fails with extension errors, check that errors are only extension-related.

### Step 5: Post-Migration tasks

#### Update statistics (important)

```bash
psql "$SUPABASE_DB_URL" -c "VACUUM VERBOSE ANALYZE;"
```

<Admonition type="note">

For Postgres 18+, pg_dump includes statistics with `--with-statistics`, but you should still run VACUUM for optimal performance.

</Admonition>

#### Verify migration

```sql
-- Check row counts
select schemaname, tablename, n_live_tup
from pg_stat_user_tables
order by n_live_tup desc
limit 20;
-- Verify data with application-specific queries
```

#### Re-enable writes on source (if keeping it)

```sql
ALTER DATABASE your_database_name SET default_transaction_read_only = false;
```

### Migration time estimates

| Database Size | Dump Time | Restore Time | Total Time |
| ------------- | --------- | ------------ | ---------- |
| 10 GB         | ~5 min    | ~10 min      | ~15 min    |
| 100 GB        | ~30 min   | ~45 min      | ~1.5 hours |
| 500 GB        | ~2 hours  | ~3 hours     | ~5 hours   |
| 1 TB          | ~4 hours  | ~6 hours     | ~10 hours  |

_Times vary based on hardware, network, and parallelization settings_

### Important notes

1. **Region proximity matters**: VM should be in the same region as the source or target for best performance
2. **Downgrade migrations**: While technically possible in some cases, highly not recommended
3. **Testing without downtime**: Use lower `-j` values for pg_dump to avoid impacting production
4. **For pg_restore**: Can use full parallelization regardless of production impact
5. **Monitor resources**: Watch CPU, disk I/O with `htop`, `iotop`
6. **Disk I/O**: Often the bottleneck before network bandwidth

---

## Method 3: Logical replication

This method allows migration with minimal downtime using Postgres's logical replication feature. Requires Postgres 10+ on both source and target.

### When to use logical replication

- You need minimal downtime (minutes instead of hours)
- Source database is Postgres 10 or higher
- You can configure logical replication on the source
- Database has high write activity that can't be paused for long

### Source Postgres prerequisites

#### Access & privileges

- Connection string with rights to CREATE PUBLICATION and read tables
- Superuser or replication privileges recommended

#### Required settings for logical replication

- `wal_level = logical`
- `max_wal_senders ≥ 1`
- `max_replication_slots ≥ 1`
- Sufficient `max_connections` (current + 1 for subscription)

#### Replica identity

Every table receiving UPDATE/DELETE must have a replica identity (typically a PRIMARY KEY). For tables without one:

```sql
ALTER TABLE schema.table_name REPLICA IDENTITY FULL;
```

#### Non-Replicated items

- **DDL changes** (schema modifications)
- **Sequences** (need manual sync)
- **Large Objects (LOBs)** (use dump/restore or store in regular bytea columns)

Plan a schema freeze, sequence sync before cutover, and handle LOBs separately.

### Step 1: Configure source database

Edit Postgres configuration files:

#### Postgres.conf

```bash
# Set Supabase connection (Session Pooler on port 5432 or direct connection)
export SUPABASE_DB_URL="Postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Set WAL level to logical
wal_level = logical

# Ensure sufficient replication slots
max_replication_slots = 10

# Ensure sufficient WAL senders
max_wal_senders = 10

# Set appropriate max_connections (current connections + 1 for subscription)
max_connections = 200  # Adjust based on your needs

# Optional: Enable SSL for secure replication
ssl = on

# Allow connections from Supabase
listen_addresses = '*'  # Or specific IP addresses
```

{/* supa-mdx-lint-disable-next-line Rule001HeadingCase */}

#### pg_hba.conf

```bash
# Allow replication connections from Supabase
# Replace <supabase_ip_range> with actual Supabase IP range
host    replication     all     <supabase_ip_range>    md5
host    all            all     <supabase_ip_range>    md5

# With SSL:
hostssl replication     all     <supabase_ip_range>    md5
hostssl all            all     <supabase_ip_range>    md5
```

Restart Postgres:

```bash
sudo systemctl restart Postgres
sudo systemctl status Postgres
```

### Step 2: Verify configuration

```sql
-- Should return 'logical'
SHOW wal_level;

-- Check other parameters
SHOW max_replication_slots;
SHOW max_wal_senders;

-- Check current connections
SELECT count(*) FROM pg_stat_activity;
```

### Step 3: Check and set replica identity

```sql
-- Find tables without primary keys
SELECT n.nspname, c.relname
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_constraint pk ON pk.conrelid = c.oid AND pk.contype = 'p'
WHERE c.relkind = 'r'
  AND pk.oid IS NULL
  AND n.nspname NOT IN ('pg_catalog','information_schema');

-- For tables without a primary key, set REPLICA IDENTITY FULL
ALTER TABLE my_schema.my_table REPLICA IDENTITY FULL;
```

### Step 4: Export and restore schema only

```bash
# Export schema from source
pg_dump \
  -h <source_host> \
  -U <source_user> \
  -p <source_port> \
  -d <source_database> \
  --schema-only \
  --no-privileges \
  --no-subscriptions \
  --format=directory \
  -f ./schema_dump

# Restore schema to Supabase (use Session Pooler)
pg_restore \
  --dbname="$SUPABASE_DB_URL" \
  --format=directory \
  --schema-only \
  --no-privileges \
  --single-transaction \
  --verbose \
  ./schema_dump
```

### Step 5: Create publication on source

```sql
-- Create publication for all tables
CREATE PUBLICATION supabase_migration FOR ALL TABLES;

-- Or for specific tables only (doesn't require superuser)
CREATE PUBLICATION supabase_migration FOR TABLE
  schema1.table1,
  schema1.table2,
  public.table3;

-- Verify publication was created
SELECT * FROM pg_publication;
```

### Step 6: Create subscription on Supabase

Connect to your Supabase database:

```sql
-- Create subscription with SSL (recommended)
CREATE SUBSCRIPTION supabase_subscription
CONNECTION 'host=<source_host> port=<source_port> user=<source_user> password=<source_password> dbname=<source_database> sslmode=require'
PUBLICATION supabase_migration;

-- Or without SSL (if source doesn't support it)
CREATE SUBSCRIPTION supabase_subscription
CONNECTION 'host=<source_host> port=<source_port> user=<source_user> password=<source_password> dbname=<source_database> sslmode=disable'
PUBLICATION supabase_migration;
```

### Step 7: Monitor replication status

```sql
-- On Supabase (subscriber) - check subscription status
select * from pg_subscription_rel;

-- srsubstate = 'r' means ready (synchronized)
-- srsubstate = 'i' means initializing
-- srsubstate = 'd' means data is being copied

-- Overall subscription status
select * from pg_stat_subscription;

-- On source database - check replication status
select * from pg_stat_replication;

-- Check replication lag
select
  slot_name,
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) as lag_size
from pg_replication_slots;
```

Wait until all tables show `srsubstate = 'r'` (ready) status.

### Step 8: Synchronize sequences

After initial data sync is complete, but BEFORE switching to Supabase:

```bash
# Set source to read-only
psql -h <source_host> -c "ALTER DATABASE <source_database> SET default_transaction_read_only = true;"

# Export sequences from source
pg_dump \
  -h <source_host> \
  -U <source_user> \
  -p <source_port> \
  -d <source_database> \
  --data-only \
  --table='*_seq' \
  --table='*_id_seq' > sequences.sql

# Import sequences to Supabase
psql "$SUPABASE_DB_URL" -f sequences.sql
```

### Step 9: Switch to Supabase

1. Ensure replication lag is zero:

```sql
-- On Supabase
select * from pg_stat_subscription;
-- Check that latest_end_lsn is current
```

2. Stop writes to the source database (if not already read-only)

3. Drop subscription on Supabase:

```sql
DROP SUBSCRIPTION supabase_subscription;
```

4. Update application connection strings to point to Supabase

5. Verify application functionality

### Step 10: Cleanup

On source database (after successful migration):

```sql
-- Remove publication
DROP PUBLICATION supabase_migration;

-- Check and remove any remaining replication slots
SELECT * FROM pg_replication_slots;
DROP REPLICATION SLOT slot_name;  -- if any remain

-- The source database should remain read-only or be decommissioned
-- Do NOT re-enable writes to avoid a split-brain scenario!
```

### Troubleshooting logical replication

| Issue                                | Solution                                                            |
| ------------------------------------ | ------------------------------------------------------------------- |
| "could not connect to the publisher" | Check network connectivity, firewall rules, pg_hba.conf             |
| "role does not exist"                | Ensure replication user exists on source with REPLICATION privilege |
| "publication does not exist"         | Verify publication name and that it was created successfully        |
| Replication lag growing              | Check network bandwidth, source database load, add more WAL senders |
| Tables stuck in `i` state            | Check for locks on source tables, verify table structure matches    |
| "out of replication slots"           | Increase max_replication_slots in Postgres.conf                     |

### Important limitations

- **DDL changes**: Schema modifications are not replicated - freeze schema during migration
- **Sequences**: Need manual synchronization before cutover
- **Large Objects (LOBs)**: Not replicated - use dump/restore or store in regular bytea columns
- **Custom types**: May need special handling
- **Users and roles**: Must be recreated manually on Supabase

For detailed restrictions, see [Postgres Logical Replication Restrictions](https://www.Postgres.org/docs/current/logical-replication-restrictions.html)

### When to use which method

**Use Dump/Restore when:**

- Downtime window is acceptable
- Source is Postgres < 10
- Simpler process preferred
- Cannot configure logical replication on the source

**Use Logical Replication when:**

- Minimal downtime required
- Postgres 10+ on both sides
- Can modify source configuration
- Have replication privileges

## Getting help

- For databases > 150 GB: [Contact Supabase support](/dashboard/support/new) before starting
- [Supabase Dashboard Support](/dashboard/support/new)
- [Supabase Discord](https://discord.supabase.com)
- [Postgres Roles and Privileges Guide](/blog/postgres-roles-and-privileges)
- [Row Level Security Guide](/docs/guides/database/postgres/row-level-security)
