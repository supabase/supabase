---
name: clickhouse-logs-queries
description: >-
  Write, review, and migrate Supabase logs queries against the ClickHouse-backed
  `logs` table (the `logs.all.otel` analytics endpoint). Use this whenever a task
  involves Logs Explorer SQL, the `log_attributes` map, querying a log `source`
  (edge_logs, postgres_logs, auth_logs, etc.), translating an old BigQuery
  `cross join unnest(metadata)` logs query to ClickHouse, or wiring analytics log
  SQL in `apps/studio/data/logs` and `apps/studio/components/interfaces/Settings/Logs`.
  Reach for it even when the user just says "logs query", "Logs Explorer", or
  pastes a BigQuery logs query to convert, not only when they name ClickHouse.
---

# Querying Supabase logs (ClickHouse)

Supabase logs live in a single ClickHouse `logs` table, served by the
`logs.all.otel` analytics endpoint. Every log line from every part of the stack
is one row in this table, tagged by a `source` column. This replaces the older
BigQuery model, where each service had its own table and fields were reached
through `cross join unnest(metadata)`.

Two kinds of work use this skill, and they share the same SQL model:

1. **Writing or reviewing a logs query** (in the Logs Explorer or anywhere a raw
   ClickHouse logs query is needed). Start here in this file.
2. **Wiring a logs query in the Studio codebase** (branded analytics SQL, the
   endpoint picker, the OTEL query builders). Read
   [references/codebase-integration.md](references/codebase-integration.md).

If you are converting an existing BigQuery logs query, read
[references/bigquery-migration.md](references/bigquery-migration.md) for the full
translation table.

## The logs table

Each row has a small set of real columns. Everything specific to a service lives
in `log_attributes`.

| Column           | Type                  | Notes                                                 |
| ---------------- | --------------------- | ----------------------------------------------------- |
| `id`             | `String`              | Unique log identifier.                                |
| `timestamp`      | `DateTime64` (UTC)    | When the log was produced. Order/compare it directly. |
| `event_message`  | `String`              | The raw log line.                                     |
| `severity_text`  | `String`              | Log level, when the source sets one.                  |
| `source`         | `String`              | The service the log came from. Always filter on this. |
| `log_attributes` | `Map(String, String)` | Structured per-source fields, keyed by a dotted path. |

`timestamp` is formatted like `2026-06-22T09:34:06.215000` (ISO 8601, microsecond
precision, no trailing `Z`). In the Logs Explorer the selected time range is
applied for you, so you rarely need to write a `timestamp` filter by hand.

A minimal, well-formed query. Lead with a comment naming the query, filter by
`source`, and always `limit`:

```sql
-- recent edge requests
select timestamp, event_message
from logs
where source = 'edge_logs'
order by timestamp desc
limit 100;
```

## Sources

`source` selects the service. The common ones:

- `edge_logs` — API gateway requests and responses
- `postgres_logs` — database statements and errors (also where pg_cron logs live)
- `auth_logs` — authentication and authorization activity
- `function_edge_logs` — edge function requests and responses
- `function_logs` — `console` output from inside edge functions
- `storage_logs` — object upload and retrieval activity
- `realtime_logs` — Realtime client connections
- `postgrest_logs`, `supavisor_logs`, `pgbouncer_logs` — mostly `id`, `timestamp`, `event_message`

The Logs Explorer **Field Reference** drawer lists every source and the fields it
actually sets. When in doubt about a key, discover it from real data rather than
guessing (see below).

## Reading fields from log_attributes

`log_attributes` maps a string key to a string value. Read a field with bracket
access. There are no unnesting joins:

```sql
-- edge requests with method and path
select
  log_attributes['request.method'] as method,
  log_attributes['request.path'] as path,
  log_attributes['response.status_code'] as status
from logs
where source = 'edge_logs'
order by timestamp desc
limit 100
```

**Before you write that, read [Reading the map is all-or-nothing](#reading-the-map-is-all-or-nothing).**
It is by far the most expensive thing you can do to a logs query, and the cost is
invisible from the syntax.

The key keeps the dotted path that BigQuery expressed through nested structs, with
the `metadata` root dropped: BigQuery `metadata.request.method` becomes
`log_attributes['request.method']`. Keep the full prefix — `request.cf.country`
is `log_attributes['request.cf.country']`, not `log_attributes['cf.country']`.

Common keys by source:

- `edge_logs`: `request.method`, `request.path`, `request.search`, `response.status_code`, `identifier`
- `postgres_logs`: `parsed.error_severity`, `parsed.detail`, `parsed.hint`, `parsed.query`, `identifier`
- `auth_logs`: `level`, `status`, `path`, `msg`, `error`
- `function_edge_logs`: `response.status_code`, `request.method`, `request.pathname`, `function_id`, `execution_id`, `execution_time_ms`
- `function_logs`: `event_type`, `function_id`, `execution_id`, `level`

### Reading the map is all-or-nothing

`Map(String, String)` is stored as two parallel arrays — one of keys, one of
values. ClickHouse cannot read one entry out of that: **any subscript
decompresses both arrays in full.** Reading a single key costs exactly what
reading the whole map costs.

The map also dominates row size. On a high-volume `edge_logs` source it measured
149 GiB against 11 GiB for `event_message` — around 93% of row bytes, averaging
54 keys per row. The practical effect, measured on one hour of one project:

| the query selects                             | bytes read    |
| --------------------------------------------- | ------------- |
| the whole `log_attributes` map                | 22.00 GiB     |
| just `log_attributes['response.status_code']` | **22.00 GiB** |
| no `log_attributes` at all                    | **1.50 GiB**  |

Three rules follow, and they are the difference between a cheap query and one
that can exhaust the server's memory while sorting:

- **Trimming keys saves nothing.** Going from five keys to one is a no-op. A
  query either avoids the map entirely or may as well select all of it.
- **A row list should not touch the map.** Select `id, timestamp, event_message`
  and fetch attributes for the rendered page in a second query (see below).
- **This applies to `where` too, not just `select`.** A predicate on
  `log_attributes['...']` reads the map for every row that passes the `source`
  and time filters. If a filter already reads the map, the projection is free —
  splitting the query buys nothing at that point.

#### Fetch attributes for a page, not for a scan

When you do need attributes alongside a list, get the rows first, then fetch
attributes for just that page — bounded by the page's own timestamp span:

```sql
-- 1. the list: no map access
select id, timestamp, event_message
from logs
where source = 'edge_logs'
order by timestamp desc
limit 100;
```

```sql
-- 2. attributes for the page just returned
select id, log_attributes['request.method'] as method
from logs
where source = 'edge_logs'
  and timestamp >= :page_min_ts   -- from the rows above
  and timestamp <= :page_max_ts
  and id in (:ids)
limit 100
```

The timestamp bracket is what prunes, and it is not optional: **`id` is not part
of the sort key**, so `where id in (...)` on its own scans the entire window and
gives back everything step 1 saved. Measured, this pattern costs ~50 MB for a
page against 22 GiB inline.

### Point lookups need a source and a time bracket

The same trap, for a single row. `id` alone is never enough:

```sql
-- wrong: scans the whole selected range
select id, timestamp, log_attributes from logs where id = 'abc' limit 1;
```

The table's sort key is `(project, source, timestamp)`. Add `source` — it narrows
the sorted range before the time bound even applies — and bracket the timestamp
tightly around the row you already have client-side:

```sql
-- right: source narrows the range, the caller bounds ±1 minute around the row
select id, timestamp, log_attributes
from logs
where id = 'abc' and source = 'edge_logs'
limit 1;
```

### Window size multiplies map cost

Whenever a query reads the map, its cost scales with the time range. This matters
most for queries that _must_ read it — `mapKeys` reads the map by definition, so a
key-discovery query over 7 days costs ~168× the same query over one hour, for a
result that barely changes. Prefer the narrowest window that answers the
question, and widen only when a narrow one comes back empty.

### Numeric fields are strings

Map values are always strings. To compare or aggregate a numeric field, wrap it in
`toInt32OrZero`, which returns `0` for missing or non-numeric values so it never
errors on partial data:

```sql
select count() as server_errors
from logs
where source = 'edge_logs'
  and toInt32OrZero(log_attributes['response.status_code']) between 500 and 599
```

### Discover the keys a source sets

Read `mapKeys` from recent rows rather than guessing key names:

```sql
select arrayJoin(mapKeys(log_attributes)) as key, count() as n
from logs
where source = 'postgres_logs'
group by key
order by n desc
limit 100;
```

`arrayJoin(mapKeys(...))` flattens the map keys into one row per key so you can
rank them by frequency. (The Studio codebase does exactly this for the Field
Reference drawer and to feed real keys to the AI rewrite.)

`mapKeys` reads the map by definition, so this is one of the most expensive
queries you can run — keep the window narrow. Key _names_ are stable, so an hour
of a busy source returns the same set a week would.

## ClickHouse vs BigQuery functions

These are the substitutions that trip people up most:

| Need               | BigQuery                      | ClickHouse                                   |
| ------------------ | ----------------------------- | -------------------------------------------- |
| Count rows         | `count(*)`                    | `count()`                                    |
| Regex match        | `regexp_contains(x, 'p')`     | `match(x, 'p')`                              |
| Substring match    | `x like '%p%'`                | `x ilike '%p%'` (case-insensitive) or `like` |
| Numeric coercion   | `cast(x as int64)`            | `toInt32OrZero(x)`                           |
| Read the timestamp | `cast(timestamp as datetime)` | `timestamp` (use the column directly)        |
| Map keys           | n/a (used unnest)             | `mapKeys(log_attributes)`                    |

The `logs.all.otel` analytics endpoint (and the Logs Explorer on top of it)
rejects `count(*)` and `select *` — use `count()` and list the columns you need.
(Raw ClickHouse supports both; this is a constraint of the logs query surface.)

## Best practices

These keep queries correct and cheap. Log tables are large; an unbounded scan
reads far more data than you need.

- **Start every query with an identifying comment** (e.g. `-- errors since last deploy`). It labels the query in logs and review, and makes each of several queries in a file easy to tell apart.
- **Always include a `LIMIT`.** Even for aggregates while you iterate.
- **Always query `from logs where source = '...'`.** There is no per-service table (no `edge_logs`, `postgres_logs`, etc. table) — there is one `logs` table, and `source` scopes it to a service. Filtering by `source` is required, not just an optimization.
- **Keep the time range tight.** A smaller window returns results faster — and when the query reads `log_attributes`, cost scales with the window.
- **Never reference `log_attributes` in a row list.** Reading one key costs what the whole map costs, so a list query either avoids it entirely or pays for all of it. See [Reading the map is all-or-nothing](#reading-the-map-is-all-or-nothing).
- **Filter on the real columns** (`source`, `timestamp`) before reaching into
  `log_attributes`.
- **Never look up by `id` alone.** `id` is not in the sort key — add `source` and a tight timestamp bracket, or the lookup scans the whole window.
- **Order by `timestamp desc`** to see the most recent logs first.
- **Use `count()`**, not `count(*)` or `select *`.

## Worked examples

Requests by status code:

```sql
select
  toInt32OrZero(log_attributes['response.status_code']) as status,
  count() as count
from logs
where source = 'edge_logs'
group by status
order by count desc
limit 50
```

Auth errors:

```sql
select timestamp, event_message, log_attributes['msg'] as message
from logs
where source = 'auth_logs'
  and log_attributes['level'] in ('error', 'fatal')
order by timestamp desc
limit 100
```

Search the raw message:

```sql
select timestamp, event_message
from logs
where source = 'postgres_logs'
  and event_message ilike '%deadlock%'
order by timestamp desc
limit 100
```

Postgres errors grouped by severity (the canonical unnest-to-map conversion):

```sql
select log_attributes['parsed.error_severity'] as severity, count() as count
from logs
where source = 'postgres_logs'
  and log_attributes['parsed.error_severity'] in ('ERROR', 'FATAL', 'PANIC')
group by severity
order by count desc
limit 100
```

## When the user pastes a BigQuery query

Convert it rather than running it as-is. The mechanical steps (drop the
per-service table for `from logs where source = ...`, remove every
`cross join unnest(...)`, rewrite unnest-alias columns as `log_attributes['...']`
lookups, swap the functions above) are spelled out with a full before/after in
[references/bigquery-migration.md](references/bigquery-migration.md). The Logs
Explorer also has a built-in **Rewrite to ClickHouse** action that does this with
AI; point users to it for one-off conversions in the dashboard.
