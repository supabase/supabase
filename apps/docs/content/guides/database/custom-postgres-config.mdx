---
id: 'customizing-postgres-configs'
title: 'Customizing Postgres configs'
description: 'Configuring Postgres for your Supabase project.'
---

Each Supabase project is a pre-configured Postgres cluster. You can override some configuration settings to suit your needs. This is an advanced topic, and we don't recommend touching these settings unless it is necessary.

<Admonition type="note">

Customizing Postgres configurations provides _advanced_ control over your database, but inappropriate settings can lead to severe performance degradation or project instability.

</Admonition>

### Viewing settings

To list all Postgres settings and their descriptions, run:

```sql
select * from pg_settings;
```

## Configurable settings

### User-context settings

The [`pg_settings`](https://www.postgresql.org/docs/current/view-pg-settings.html) table's `context` column specifies the requirements for changing a setting. By default, those with a `user` context can be changed at the `role` or `database` level with [SQL](/dashboard/project/_/sql/).

To list all user-context settings, run:

```sql
select * from pg_settings where context = 'user';
```

As an example, the `statement_timeout` setting can be altered:

```sql
alter database "postgres" set "statement_timeout" TO '60s';
```

To verify the change, execute:

```sql
show "statement_timeout";
```

### Superuser settings

Some settings can only be modified by a superuser. Supabase pre-enables the [`supautils` extension](/blog/roles-postgres-hooks#setting-up-the-supautils-extension), which allows the `postgres` role to retain certain superuser privileges. It enables modification of the below reserved configurations at the `role` level:

| Setting                      | Description                                                                                                                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auto_explain.*`             | Configures the [auto_explain module](https://www.postgresql.org/docs/current/auto-explain.html). Can be configured to log execution plans for queries expected to exceed x seconds, including function queries. |
| `deadlock_timeout`           | Sets the time to wait on a lock before checking for deadlock.                                                                                                                                                   |
| `log_lock_waits`             | Controls whether a log message is produced when a session waits longer than [deadlock_timeout](https://www.postgresql.org/docs/current/runtime-config-locks.html#GUC-DEADLOCK-TIMEOUT) to acquire a lock.       |
| `log_min_duration_statement` | Causes the duration of each completed statement to be logged if the statement ran for at least the specified amount of time.                                                                                    |
| `log_min_messages`           | Minimum severity level of messages to log.                                                                                                                                                                      |
| `log_parameter_max_length`   | Sets the maximum length in bytes of data logged for bind parameter values when logging statements.                                                                                                              |
| `log_replication_commands`   | Logs all replication commands                                                                                                                                                                                   |
| `log_statement`              | Controls which SQL statements are logged. Valid values are `none` (off), `ddl`, `mod`, and `all` (all statements).                                                                                              |
| `log_temp_files`             | Controls logging of temporary file names and sizes.                                                                                                                                                             |
| `pg_net.batch_size`          | Sets how many requests the [pg_net extension](/docs/guides/database/extensions/pg_net) can make per second                                                                                                      |
| `pg_net.ttl`                 | Sets how long the [pg_net extension](/docs/guides/database/extensions/pg_net) saves responses                                                                                                                   |
| `pg_stat_statements.*`       | Configures the [pg_stat_statements extension](https://www.postgresql.org/docs/current/pgstatstatements.html).                                                                                                   |
| `pgaudit.*`                  | Configures the [PGAudit extension](/docs/guides/database/extensions/pgaudit). The `log_parameter` is still restricted to protect secrets                                                                        |
| `pgrst.*`                    | [`PostgREST` settings](https://docs.postgrest.org/en/stable/references/configuration.html#db-aggregates-enabled)                                                                                                |
| `plan_filter.*`              | Configures the [pg_plan_filter extension](/docs/guides/database/extensions/pg_plan_filter)                                                                                                                      |
| `safeupdate.enabled`         | Enables the [safeupdate extension](https://github.com/eradman/pg-safeupdate), which requires a `WHERE` clause on `UPDATE` and `DELETE` statements.                                                              |
| `session_replication_role`   | Sets the session's behavior for triggers and rewrite rules.                                                                                                                                                     |
| `track_functions`            | Controls whether function call counts and timing are tracked. Valid values are `none`, `pl` (only procedural-language functions), and `all`.                                                                    |
| `track_io_timing`            | Collects timing statistics for database I/O activity.                                                                                                                                                           |
| `wal_compression`            | This parameter enables compression of WAL using the specified compression method.                                                                                                                               |

For example, to enable `log_nested_statements` for the `postgres` role, execute:

```sql
alter role "postgres" set "auto_explain.log_nested_statements" to 'on';
```

To view the change:

```sql
select
  rolname,
  rolconfig
from pg_roles
where rolname = 'postgres';
```

### CLI configurable settings

While many Postgres parameters are configurable directly, some configurations can be changed with the Supabase CLI at the [`system`](https://www.postgresql.org/docs/current/config-setting.html#CONFIG-SETTING-SQL) level.

<Admonition type="caution">

CLI changes permanently overwrite default settings, so `reset all` and `set to default` commands won't revert to the original values.

</Admonition>

<Admonition type="danger">

In order to overwrite the default settings, you must have `Owner` or `Administrator` privileges within your organizations.

</Admonition>

#### CLI supported parameters

<Admonition type="tip">

If a setting you need is not yet configurable, [share your use case with us](/dashboard/support/new)! Let us know what setting you'd like to control, and we'll consider adding support in future updates.

</Admonition>

The following parameters are available for overrides:

<Admonition type="note">

Parameters marked with **Restart: Yes** cause the CLI to automatically restart your database (and any read replicas) to apply the change. This may cause a brief interruption to active connections. You can use the [`--no-restart`](#managing-postgres-configuration-with-the-cli) flag to defer the restart.

</Admonition>

Use the examples below with `supabase --experimental --project-ref <project-ref> postgres-config update`:

| Parameter                                                                                                                                                                                                                      | Type      | Restart | Example                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ------- | --------------------------------------------- |
| [checkpoint_timeout](https://www.postgresql.org/docs/current/runtime-config-wal.html#GUC-CHECKPOINT-TIMEOUT)                                                                                                                   | CLI only  | No      | `--config checkpoint_timeout=15min`           |
| [effective_cache_size](https://www.postgresql.org/docs/current/runtime-config-query.html#GUC-EFFECTIVE-CACHE-SIZE)                                                                                                             | CLI + SQL | No      | `--config effective_cache_size=8GB`           |
| [hot_standby_feedback](https://www.postgresql.org/docs/current/runtime-config-replication.html#GUC-HOT-STANDBY-FEEDBACK)                                                                                                       | CLI only  | No      | `--config hot_standby_feedback=true`          |
| [logical_decoding_work_mem](https://www.postgresql.org/docs/current/runtime-config-resource.html#GUC-LOGICAL-DECODING-WORK-MEM)                                                                                                | CLI + SQL | No      | `--config logical_decoding_work_mem=128MB`    |
| [maintenance_work_mem](https://www.postgresql.org/docs/current/runtime-config-resource.html#GUC-MAINTENANCE-WORK-MEM)                                                                                                          | CLI + SQL | No      | `--config maintenance_work_mem=512MB`         |
| [max_connections](https://www.postgresql.org/docs/current/runtime-config-connection.html#GUC-MAX-CONNECTIONS) (Be aware of [these considerations](/docs/guides/troubleshooting/how-to-change-max-database-connections-_BQ8P5)) | CLI only  | Yes     | `--config max_connections=200`                |
| [max_locks_per_transaction](https://www.postgresql.org/docs/current/runtime-config-locks.html#GUC-MAX-LOCKS-PER-TRANSACTION)                                                                                                   | CLI only  | Yes     | `--config max_locks_per_transaction=128`      |
| [max_parallel_maintenance_workers](https://www.postgresql.org/docs/current/runtime-config-resource.html#GUC-MAX-PARALLEL-MAINTENANCE-WORKERS)                                                                                  | CLI + SQL | No      | `--config max_parallel_maintenance_workers=2` |
| [max_parallel_workers_per_gather](https://www.postgresql.org/docs/current/runtime-config-resource.html#GUC-MAX-PARALLEL-WORKERS-PER-GATHER)                                                                                    | CLI + SQL | No      | `--config max_parallel_workers_per_gather=2`  |
| [max_parallel_workers](https://www.postgresql.org/docs/current/runtime-config-resource.html#GUC-MAX-PARALLEL-WORKERS)                                                                                                          | CLI + SQL | No      | `--config max_parallel_workers=4`             |
| [max_replication_slots](https://www.postgresql.org/docs/current/runtime-config-replication.html#GUC-MAX-REPLICATION-SLOTS)                                                                                                     | CLI only  | Yes     | `--config max_replication_slots=10`           |
| [max_slot_wal_keep_size](https://www.postgresql.org/docs/current/runtime-config-replication.html#GUC-MAX-SLOT-WAL-KEEP-SIZE)                                                                                                   | CLI only  | No      | `--config max_slot_wal_keep_size=4GB`         |
| [max_standby_archive_delay](https://www.postgresql.org/docs/current/runtime-config-replication.html#GUC-MAX-STANDBY-ARCHIVE-DELAY)                                                                                             | CLI only  | No      | `--config max_standby_archive_delay=30s`      |
| [max_standby_streaming_delay](https://www.postgresql.org/docs/current/runtime-config-replication.html#GUC-MAX-STANDBY-STREAMING-DELAY)                                                                                         | CLI only  | No      | `--config max_standby_streaming_delay=30s`    |
| [max_wal_size](https://www.postgresql.org/docs/current/runtime-config-wal.html#GUC-MAX-WAL-SIZE)                                                                                                                               | CLI only  | No      | `--config max_wal_size=2GB`                   |
| [max_wal_senders](https://www.postgresql.org/docs/current/runtime-config-replication.html#GUC-MAX-WAL-SENDERS)                                                                                                                 | CLI only  | Yes     | `--config max_wal_senders=10`                 |
| [max_worker_processes](https://www.postgresql.org/docs/current/runtime-config-resource.html#GUC-MAX-WORKER-PROCESSES)                                                                                                          | CLI only  | Yes     | `--config max_worker_processes=8`             |
| [session_replication_role](https://www.postgresql.org/docs/current/runtime-config-client.html#GUC-SESSION-REPLICATION-ROLE)                                                                                                    | CLI only  | No      | `--config session_replication_role=replica`   |
| [shared_buffers](https://www.postgresql.org/docs/current/runtime-config-resource.html#GUC-SHARED-BUFFERS)                                                                                                                      | CLI only  | Yes     | `--config shared_buffers=256MB`               |
| [statement_timeout](https://www.postgresql.org/docs/current/runtime-config-client.html#GUC-STATEMENT-TIMEOUT)                                                                                                                  | CLI + SQL | No      | `--config statement_timeout=60s`              |
| [track_activity_query_size](https://www.postgresql.org/docs/current/runtime-config-statistics.html#GUC-TRACK-ACTIVITY-QUERY-SIZE)                                                                                              | CLI only  | Yes     | `--config track_activity_query_size=2048B`    |
| [track_commit_timestamp](https://www.postgresql.org/docs/current/runtime-config-replication.html#GUC-TRACK-COMMIT-TIMESTAMP)                                                                                                   | CLI only  | Yes     | `--config track_commit_timestamp=true`        |
| [wal_keep_size](https://www.postgresql.org/docs/current/runtime-config-replication.html#GUC-WAL-KEEP-SIZE)                                                                                                                     | CLI only  | No      | `--config wal_keep_size=1GB`                  |
| [wal_sender_timeout](https://www.postgresql.org/docs/current/runtime-config-replication.html#GUC-WAL-SENDER-TIMEOUT)                                                                                                           | CLI only  | No      | `--config wal_sender_timeout=60s`             |
| [work_mem](https://www.postgresql.org/docs/current/runtime-config-resource.html#GUC-WORK-MEM)                                                                                                                                  | CLI + SQL | No      | `--config work_mem=64MB`                      |

#### Managing Postgres configuration with the CLI

To start:

1. [Install](/docs/guides/resources/supabase-cli) Supabase CLI 1.69.0+.
2. [Log in](/docs/guides/cli/local-development#log-in-to-the-supabase-cli) to your Supabase account using the CLI.

To update Postgres configurations, use the [`postgres config`](/docs/reference/cli/supabase-postgres-config) command:

```bash
supabase --experimental \
--project-ref <project-ref> \
postgres-config update --config shared_buffers=250MB
```

By default, the CLI will merge any provided config overrides with any existing ones. The `--replace-existing-overrides` flag can be used to instead force all existing overrides to be replaced with the ones being provided:

```bash
supabase --experimental \
--project-ref <project-ref> \
postgres-config update --config max_parallel_workers=3 \
--replace-existing-overrides
```

To delete specific configuration overrides, use the `postgres-config delete` command:

```bash
supabase --experimental \
--project-ref <project-ref> \
postgres-config delete --config shared_buffers,work_mem
```

By default, CLI v2 (≥ 2.0.0) checks the parameter’s context and requests the correct action (reload or restart):

- If the setting can be reloaded (`pg_settings.context = 'sighup'`), then the Management API will detect this and apply the change with a configuration reload.
- If the setting requires a restart (`pg_settings.context = 'postmaster'`), then both the primary and any read replicas will restart to apply the change.

To check whether a parameter can be reloaded without a restart, see the [Postgres docs](https://www.postgresql.org/docs/current/runtime-config.html).

You can verify whether changes have been applied with the following checks:

```bash
supabase --version;
```

```sql
-- Check whether the parameters were updated (and if a restart is pending):
select name, setting, context, pending_restart
from pg_settings
where name in ('max_slot_wal_keep_size', 'shared_buffers', 'max_connections');
```

```sql
-- If the timestamp hasn’t changed, no restart occurred
select pg_postmaster_start_time();
```

You can also pass the `--no-restart` flag to attempt a reload-only apply. If the parameter cannot be reloaded, the change stays pending until the next restart.

<Admonition type="note" label="Read Replicas and Custom Config">

Postgres requires several parameters to be synchronized between the Primary cluster and [Read Replicas](/docs/guides/platform/read-replicas).

By default, Supabase ensures that this propagation is executed correctly. However, if the `--no-restart` behavior is used in conjunction with parameters that cannot be reloaded without a restart, the user is responsible for ensuring that both the primaries and the read replicas get restarted in a timely manner to ensure a stable running state. Leaving the configuration updated, but not utilized (via a restart) in such a case can result in read replica failure if the primary, or a read replica, restarts in isolation (e.g. due to an out-of-memory event, or hardware failure).

</Admonition>

```bash
supabase --experimental \
--project-ref <project-ref> \
postgres-config delete --config shared_buffers --no-restart
```

### Resetting to default config

To reset a setting to its default value at the database level:

```sql
-- reset a single setting at the database level
alter database "postgres" set "<setting_name>" to default;

-- reset all settings at the database level
alter database "postgres" reset all;
```

For `role` level configurations, you can run:

```sql
alter role "<role_name>" set "<setting_name>" to default;
```

### Considerations

1. Changes through the CLI might restart the database causing momentary disruption to existing database connections; in most cases this should not take more than a few seconds. However, you can use the --no-restart flag to bypass the restart and keep the connections intact. Keep in mind that this depends on the specific configuration changes you're making. if the change requires a restart, using the --no-restart flag will prevent the restart but you won't see those changes take effect until a restart is manually triggered. Additionally, some parameters are required to be the same on Primary and Read Replicas; not restarting in these cases can result in read replica failure if the Primary/Read Replicas restart in isolation.
2. Custom Postgres Config will always override the default optimizations generated by Supabase. When changing compute add-ons, you should also review and update your custom Postgres Config to ensure they remain compatible and effective with the updated compute.
3. Some parameters (e.g. `wal_keep_size`) can increase disk utilization, triggering disk expansion, which in turn can lead to [increases in your bill](/docs/guides/platform/compute-add-ons#disk-io).
