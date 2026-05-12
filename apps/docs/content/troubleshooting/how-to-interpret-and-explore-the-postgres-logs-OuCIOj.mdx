---
title = "How to Interpret and Explore the Postgres Logs"
github_url = "https://github.com/orgs/supabase/discussions/26224"
date_created = "2024-05-12T21:19:37+00:00"
topics = [ "database", "platform" ]
database_id = "8b000bb4-180b-4a6c-b280-ba02965060f6"
---

> A complimentary guide was made for the [API logs](https://github.com/orgs/supabase/discussions/22849)

# Debugging and monitoring Postgres with logs

Logs provide insights into Postgres operations. They help meet compliance requirements, detect suspicious activity, and troubleshoot problems.

## Table of contents

- Querying Logs
  - `postgres_logs` Table Structure
- Filtering Logs
  - Routine Events
  - By Timeframe
  - By Error Severity
  - By Query
  - By APIs/Roles
  - By Supabase Dashboard Queries
  - Full Example For Finding Errors
- Logging for Compliance and Security
- Reviewing Log Settings
- Changing Log Settings
  - Severity levels
  - Configuring queries logged
  - Logging within functions
- Frequently Asked Questions
- Other resources

## Querying logs

The most practical way to explore and filter logs is through the [Logs Explorer](/dashboard/project/_/logs/explorer).

It uses a subset of BigQuery SQL syntax and pre-parses queries for optimization. This imposes three primary limitations:

- No subqueries or `WITH` statements
- No `*` wildcards for column names
- No `ILIKE` statements

Although there are many strategies to filter logs, such as `like` and `in` statements, a helper function called [`regexp_contains`](https://github.com/orgs/supabase/discussions/22640) provides the most flexibility and control.

The `postgres_logs` table contains Postgres events.

### `postgres_logs` table structure

The table contains 3 fundamental columns:

| column          | description             |
| --------------- | ----------------------- |
| event_message   | the log's message       |
| timestamp       | time event was recorded |
| parsed metadata | metadata about event    |

The parsed metadata column is an array that contains relevant information about events. To access the information, it must be unnested. This is done with a `cross join`.

**Unnesting example**

```sql
select
  event_message,
  parsed.<column name>
from
  postgres_logs
-- Unpack data stored in the 'metadata' field
cross join unnest(metadata) AS metadata
-- After unpacking the 'metadata' field, extract the 'parsed' field from it
cross join unnest(parsed) AS parsed;
```

### Parsed metadata fields

#### Query information

| Field                 | Description                                                                                            | Example                         |
| --------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------- |
| parsed.query          | The SQL query executed                                                                                 | `SELECT * FROM table;`          |
| parsed.command_tag    | Tag identifying the type of command (e.g., SELECT)                                                     | `SELECT`, `INSERT`, `UPDATE`... |
| parsed.internal_query | An internal query that is used to facilitate a primary query. Often used by realtime for certain tasks | `select to_jsonb()`             |

**Suggested use cases:**

- Identifying slow queries
- Identifying failing queries

#### Error/Warning information

| Field                 | Description                                            | Example                                                                                             |
| --------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| parsed.error_severity | [event severity](#severity-levels)                     | `LOG`, `WARNING`, `ERROR`...                                                                        |
| parsed.detail         | Explanation of the event according to Postgres         | "Key (fk_table)=(553585367) already exists."                                                        |
| parsed.sql_state_code | An error code that maps to Postgres's error table      | `42501`                                                                                             |
| parsed.hint           | Hint on how to solve the error                         | "No function matches the given name and argument types. You might need to add explicit type casts." |
| parsed.context        | Provides insight into where an error may have occurred | "PL/pgSQL function public.find_text(public.vector,integer) line 3 at IF"                            |

**Suggested use cases:**

- Filter by error severity or SQL code
- Get hints, details, and context about error events

#### Connection/Identification information

| Field                     | Description                                                                                                                                                    | Example              |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| parsed.session_id         | The session ID                                                                                                                                                 | 12345                |
| parsed.session_start_time | The start time of the session                                                                                                                                  | 2024-05-08 15:30:00  |
| parsed.connection_from    | The connection IP                                                                                                                                              | 192.165.1.100        |
| parsed.user_name          | The name of the connecting database user                                                                                                                       | `postgres`           |
| parsed.application_name   | The name of the application                                                                                                                                    | Supavisor, PostgREST |
| parsed.database_name      | The name of the database                                                                                                                                       | `postgres`           |
| parsed.process_id         | The process ID, often used to identify extension workers                                                                                                       | 1234                 |
| parsed.backend_type       | Determine if the event originated internally (e.g., from background workers like pg_net, timescale, or pg_cron) or externally from a client (`client backend`) | `client backend`     |

**Suggested use cases:**

- Identify events by server/API
- Filter connections by IP
- Identify connections to specific databases
- Filter connections by sessions for debugging
- identify extension events

## Filtering logs

### Excluding routine events

Most Postgres logs during normal periods are routine events, such as connection authorizations and checkpoints. To see the default types of events that are logged, you can check this [guide](https://gist.github.com/TheOtherBrian1/991d32c2b00dbc75d29b80d4cdf41aa7).

When exploring the logs for atypical behavior, it's often strategic to filter out expected values. This can be done by adding the following filter to your queries:

```sql
...query
where
  -- Excluding routine events related to cron, PgBouncer, checkpoints, and successful connections
  not regexp_contains(event_message, '^cron|PgBouncer|checkpoint|connection received|authenticated|authorized';
```

### By timeframe

To investigate issues around a specific period:

```sql
-- filtering by time period
...query
where
  timestamp between '2024-05-06 04:44:00' and '2024-05-06 04:45:00'
```

### By error severity

This filter finds all errors, fatals, and panics:

| Severity | Usage                                                        |
| -------- | ------------------------------------------------------------ |
| ERROR    | Reports an error that caused the current command to abort.   |
| FATAL    | Reports an error that caused the current session to abort.   |
| PANIC    | Reports an error that caused all database sessions to abort. |

```sql
-- find error events
... query
where
  parsed.error_severity in ('ERROR', 'FATAL', 'PANIC')
```

Failure events include an sql_state_code that can be referenced in the [Postgres Docs](https://www.postgresql.org/docs/current/errcodes-appendix.html)

### By query

> NOTE: Unless pg_audit is configured, only failed queries are logged

```
-- find queries executed by the Dashboard
...query
where
  regexp_contains(parsed.query, '(?i)select . <some table>')
```

Queries can use complex syntax, so it is often helpful to isolate by referenced database objects, such as `functions`, `tables`, and `columns`. Because query structures can be complex, it is advised to use [regex](https://github.com/orgs/supabase/discussions/22640) to find matches. Some common regex patterns are:

- `(?i)`: ignore case sensitivity
- `.`: wildcard
- `^`: look for values at start of string
- `|`: or operator

## By APIs/roles

All failed queries, including those from PostgREST, Auth, and external libraries (e.g., Prisma) are logged with helpful error messages for debugging.

#### Server/Role mapping

API servers have assigned database roles for connecting to the database:

| Role                         | API/Tool                                                                  |
| ---------------------------- | ------------------------------------------------------------------------- |
| `supabase_admin`             | Used by Supabase to configure projects and for monitoring                 |
| `authenticator`              | PostgREST                                                                 |
| `supabase_auth_admin`        | Auth                                                                      |
| `supabase_storage_admin`     | Storage                                                                   |
| `supabase_realtime_admin`    | Realtime                                                                  |
| `supabase_replication_admin` | Synchronizes Read Replicas                                                |
| `postgres`                   | Supabase Dashboard and External Tools (e.g., Prisma, SQLAlchemy, PSQL...) |
| Custom roles                 | External Tools (e.g., Prisma, SQLAlchemy, PSQL...)                        |

Filter by the `parsed.user_name` role to only retrieve logs made by specific roles:

```sql
-- find events based on role/server
... query
where
  -- find events from the relevant role
  parsed.user_name = '<ROLE>'
...
```

## By Dashboard queries

Queries from the Supabase Dashboard are executed under the `postgres` role and include the comment `-- source: dashboard`. To isolate or exclude Dashboard requests during debugging, you can filter by this comment.

```sql
-- find queries executed by the Dashboard
...query
where
  regexp_contains(parsed.query, '-- source: dashboard')
```

## Full example for finding errors

```sql
select
  cast(postgres_logs.timestamp as datetime) as timestamp,
  event_message,
  parsed.error_severity,
  parsed.user_name,
  parsed.query,
  parsed.detail,
  parsed.hint,
  parsed.sql_state_code,
  parsed.backend_type
from
  postgres_logs
  cross join unnest(metadata) as metadata
  cross join unnest(metadata.parsed) as parsed
where
  regexp_contains(parsed.error_severity, 'ERROR|FATAL|PANIC')
  and parsed.user_name = 'postgres'
  and regexp_contains(event_message, 'duration|operator')
  and not regexp_contains(parsed.query, '<key words>')
  and postgres_logs.timestamp between '2024-04-15 10:50:00' and '2024-04-15 10:50:27'
order by timestamp desc
limit 100;
```

# Logging for compliance and security

### Customized object and role activity logging

> ⚠️ NOTE: This is specifically designated for those using the `postgres` role or [custom roles](/docs/guides/database/postgres/roles) to interact with their database. Those utilizing the Database REST API should reference the [Database API Logging Guide](https://github.com/orgs/supabase/discussions/22849) instead.

When recording what is accessed and by whom, logging based on database roles and objects is the most reliable way to ensure a proper trail of activity.

You can use the [pg_audit](/docs/guides/database/extensions/pgaudit) extension to selectively log relevant queries (not just errors) by certain roles, against specific database objects.

You should take care when using the extension to not log all database events, but only what is absolutely necessary. Over-logging can strain the database and create log noise that makes it difficult to filter for relevant events.

**Filtering by pg_audit**:

```sql
... query
where
 -- all pg_audit recorded events start with 'AUDIT'
 regexp_contains(event_message, '^AUDIT')
  and
 -- Finding queries executed from the relevant role (e.g., 'API_role')
 parsed.user_name = 'API_role'
```

### Filtering by IP

> If you are connecting from a known, limited range of IP addresses, you should enable [network restrictions](/docs/guides/platform/network-restrictions).

Monitoring IPs becomes tricky when dealing with dynamic addressing, such as those from serverless or edge environments. This challenge amplifies when relying on certain poolers, such as Prisma Accelerate, Supavisor, or Cloudflare's Hyperdrive, as they record the pooler's IP, not the true origin.

IP tracking is most effective when consistently relying on direct database connections from servers with static IP addresses:

```sql
-- filter by IP
select
  event_message,
  connection_from as ip,
  count(connection_from) as ip_count
from
  postgres_logs
  cross join unnest(metadata) as metadata
  cross join unnest(parsed) as parsed
where
  regexp_contains(user_name, '<ROLE>')
  and regexp_contains(backend_type, 'client backend') -- only search for connections from outside the database (excludes cron jobs)
  and regexp_contains(event_message, '^connection authenticated') -- only view successful authentication events
group by connection_from, event_message
order by ip_count desc
limit 100;
```

# Reviewing log settings

The `pg_settings` table describes system and logging configurations.

```sql
-- view system variables
select * from pg_settings;
```

The settings that affect logs are categorized under:
| Category | Description |
|----------|-------------|
| `Reporting and Logging / What to Log` | Specifies system events worth logging.|
| `Reporting and Logging / When to Log` | Specifies certain conditions or rules for logging
| `Customized Options` | Configures extensions and loaded modules, including those enhancing logging like auto_explain and pg_audit. |

To view all log settings for your database, you can execute the following SQL:

```sql
-- view all log related settings
select *
from pg_settings
where
  (
    category like 'Reporting and Logging / What to Log'
    or category like 'Reporting and Logging / When to Log'
    or category = 'Customized Options'
  )
  and name like '%log%';
```

## Changing log settings

> WARNING: lenient settings can lead to over-logging, impacting database performance while creating noise in the logs.

#### Severity levels

The `log_min_messages` variable determines what is severe enough to log. Here are the severity thresholds from the [Postgres docs](https://www.postgresql.org/docs/current/runtime-config-logging.html).

| Severity         | Usage                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| DEBUG1 .. DEBUG5 | Provides successively-more-detailed information for use by developers.                               |
| INFO             | Provides information implicitly requested by the user, e.g., output from VACUUM VERBOSE.             |
| NOTICE           | Provides information that might be helpful to users, e.g., notice of truncation of long identifiers. |
| WARNING          | Provides warnings of likely problems, e.g., COMMIT outside a transaction block.                      |
| ERROR            | Reports an error that caused the current command to abort.                                           |
| LOG              | Reports information of interest to administrators, e.g., checkpoint activity.                        |
| FATAL            | Reports an error that caused the current session to abort.                                           |
| PANIC            | Reports an error that caused all database sessions to abort.                                         |

In most cases, the default is adequate. However, if you must adjust the setting, you can do so with the following query:

```sql
alter role postgres set log_min_messages = '<NEW VALUE>';

-- view new setting
show log_min_messages; -- default WARNING
```

#### Configuring queries logged

By default, only failed queries are logged. The [PGAudit extension](/docs/guides/database/extensions/pgaudit) extends Postgres's built-in logging abilities. It can be used to selectively track all queries in your database by:

- role
- session
- database object
- entire database

#### Logging within database functions

To track or debug functions, logging can be configured by following the [function debugging guide](/docs/guides/database/functions#general-logging)

# Frequently Asked Questions

#### How to join different log tables

No, log tables are independent from each other and do not share any primary/foreign key relations for joining.

#### How to download logs

At the moment, the way to download logs is through the Log Dashboard as a CSV

#### What is logged?

To see the default types of events that are logged, you can check this [guide](https://gist.github.com/TheOtherBrian1/991d32c2b00dbc75d29b80d4cdf41aa7).

### Other resources:

- [Regex for filtering logs](https://github.com/orgs/supabase/discussions/22640)
- [Debugging with the DB API logs](https://github.com/orgs/supabase/discussions/22849)
- [Debugging Database Functions](/docs/guides/database/functions#debugging-functions)
- [pg_audit](/docs/guides/database/extensions/pgaudit)
- [Supabase Logging](/docs/guides/platform/logs)
- [Self-Hosting Logs](/docs/reference/self-hosting-analytics/introduction)
