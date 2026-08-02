---
title: 'Advanced Log Querying and Filtering'
description: 'Query and filter logs with regular expressions'
---

The [Logs Explorer](/dashboard/project/_/logs-explorer) exposes logs from each part of the Supabase stack, which you can query and filter using SQL.

![Logs Explorer](/docs/img/guides/platform/logs/logs-explorer.png)

You can access the following log sources from the **Sources** drop-down:

- `auth_logs`: GoTrue server logs, containing authentication/authorization activity.
- `edge_logs`: Edge network logs, containing request and response metadata retrieved from Cloudflare.
- `function_edge_logs`: Edge network logs for only edge functions, containing network requests and response metadata for each execution.
- `function_logs`: Function internal logs, containing any `console` logging from within the edge function.
- `postgres_logs`: Postgres database logs, containing statements executed by connected applications.
- `realtime_logs`: Realtime server logs, containing client connection information.
- `storage_logs`: Storage server logs, containing object upload and retrieval information.

The Logs Explorer runs on ClickHouse. Every log line from every source is one row in a single `logs` table, tagged by a `source` column. Structured fields live in a `log_attributes` map, and the raw line is in `event_message`. Filter by `source` to scope a query to one service.

<Admonition type="note">

ClickHouse has been the default engine since June 2026. Projects created before this date use BigQuery, whose `cross join unnest(metadata)` syntax is deprecated. We recommend rewriting those queries in the ClickHouse syntax shown in this guide.

</Admonition>

## Timestamp display and behavior

The `timestamp` column is a `DateTime64` value in UTC, formatted as an ISO-8601 string like `2026-06-22T09:34:06.215000`. You can order and compare it directly, so no conversion function is needed. In the Logs Explorer the selected time range is applied for you, so you rarely need to filter on `timestamp` by hand.

```sql
select timestamp, event_message
from logs
where source = 'edge_logs'
order by timestamp desc
limit 100;
```

## Reading fields from log_attributes

Structured fields live in the `log_attributes` map. Read a field with bracket access, keeping the full dotted key. There are no unnesting joins.

```sql
select
  log_attributes['request.method'] as method,
  log_attributes['request.path'] as path,
  log_attributes['response.status_code'] as status
from logs
where source = 'edge_logs'
limit 100;
```

The key keeps the full dotted path, with the `metadata` root dropped. What BigQuery expressed as `metadata.request.cf.country` is `log_attributes['request.cf.country']`. Keep the full prefix rather than shortening it.

Map values are always strings. To compare or aggregate a numeric field, wrap it in `toInt32OrZero`, which returns `0` for a missing or non-numeric value:

```sql
select count() as server_errors
from logs
where source = 'edge_logs'
  and toInt32OrZero(log_attributes['response.status_code']) between 500 and 599;
```

Do not guess keys. Discover the keys a source sets from recent rows:

```sql
select arrayJoin(mapKeys(log_attributes)) as key, count() as n
from logs
where source = 'postgres_logs'
group by key
order by n desc
limit 100;
```

## LIMIT and result row limitations

The Logs Explorer has a maximum of 1000 rows per run. Use `LIMIT` to reduce the number of rows returned further.

## Best practices

1. **Use a narrow time range.**

The Logs Explorer applies the time range you select, so keep it tight. Querying a very large range risks timeouts, especially for Enterprise customers with long retention, because of the extra data scanned.

2. **Select only the fields you need.**

Selecting the whole `log_attributes` map, or every column, reads far more data than you need and slows the query down. Select the specific keys instead.

```sql
-- ❌ Avoid this: selecting the whole attributes map
select timestamp, log_attributes
from logs
where source = 'edge_logs';

-- ✅ Do this: select only the keys you need
select timestamp, log_attributes['request.method'] as method
from logs
where source = 'edge_logs';
```

## Examples and templates

The Logs Explorer includes **Templates** (available in the Templates tab or the dropdown in the Query tab) to help you get started.

For example, you can enter the following query in the SQL Editor to retrieve each user's IP address:

```sql
select timestamp, log_attributes['request.headers.x_real_ip'] as x_real_ip
from logs
where source = 'edge_logs'
  and log_attributes['request.headers.x_real_ip'] != ''
  and log_attributes['request.method'] = 'GET'
order by timestamp desc
limit 100;
```

## Understanding field references

Every log source shares the same `logs` table. Each row has these columns:

| column           | description                                        |
| ---------------- | -------------------------------------------------- |
| `id`             | unique log identifier                              |
| `timestamp`      | time the event was recorded                        |
| `event_message`  | the log's message                                  |
| `severity_text`  | log level, when the source sets one                |
| `source`         | the service the log came from                      |
| `log_attributes` | structured per-source fields, keyed by dotted path |

Service-specific details live in `log_attributes`. For example, in `postgres_logs` the `log_attributes['parsed.error_severity']` field holds the error level of an event. Read those fields with bracket access:

```sql
select
  event_message,
  log_attributes['parsed.error_severity'] as error_severity,
  log_attributes['parsed.user_name'] as user_name
from logs
where source = 'postgres_logs'
limit 100;
```

## Expanding results

Logs returned by queries may be difficult to read in table format. Double-click a row to expand the result into more readable JSON:

![Expanding log results](/docs/img/guides/platform/expanded-log-results.png)

## Filtering with [regular expressions](https://en.wikipedia.org/wiki/Regular_expression)

Use the ClickHouse [`match` function](https://clickhouse.com/docs/sql-reference/functions/string-search-functions#match) for regular expressions. In its most basic form, it checks whether a pattern is present in a column.

```sql
select timestamp, event_message
from logs
where source = 'postgres_logs'
  and match(event_message, 'is present')
limit 100;
```

There are multiple operators to consider using.

### Find messages that start with a phrase

`^` only looks for values at the start of a string

```sql
-- find only messages that start with connection
match(event_message, '^connection')
```

### Find messages that end with a phrase

`$` only looks for values at the end of the string

```sql
-- find only messages that end with port=12345
match(event_message, 'port=12345$')
```

### Ignore case sensitivity

`(?i)` ignores capitalization for all proceeding characters

```sql
-- find all event_messages with the word "connection"
match(event_message, '(?i)COnnecTion')
```

For a plain case-insensitive substring match, `ilike` is simpler:

```sql
-- find all event_messages containing "connection", in any case
event_message ilike '%connection%'
```

### Wildcards

`.` matches any single character, and `.*` matches any sequence of characters

```sql
-- find event_messages like "hello<anything>world"
match(event_message, 'hello.*world')
```

### Alphanumeric ranges

`[0-9a-zA-Z]` matches a single alphanumeric character. Anchor it with `^[0-9a-zA-Z]+$` to match a value that is entirely alphanumeric.

```sql
-- find event_messages that contain a digit between 1 and 5 (inclusive)
match(event_message, '[1-5]')
```

### Repeated values

`x*` zero or more x
`x+` one or more x
`x?` zero or one x
`x{4,}` four or more x
`x{3}` exactly 3 x

```sql
-- find event_messages that contain any sequence of 3 digits
match(event_message, '[0-9]{3}')
```

### Escaping reserved characters

`\.` is interpreted as a period `.` instead of as a wildcard

```sql
-- escapes .
match(event_message, 'hello world\.')
```

### `or` statements

`x|y` any string with `x` or `y` present

```sql
-- find event_messages that have the word 'started' followed by either "host" or "authenticated"
match(event_message, 'started (host|authenticated)')
```

### `and`/`or`/`not` statements in SQL

`and`, `or`, and `not` are native terms in SQL and can be used with regular expressions to filter results

```sql
select timestamp, event_message
from logs
where source = 'postgres_logs'
  and (
    (match(event_message, 'connection') and match(event_message, 'host'))
    or not match(event_message, 'received')
  )
limit 100;
```

### Filtering example

Filter for Postgres errors:

```sql
select
  timestamp,
  log_attributes['parsed.error_severity'] as error_severity,
  log_attributes['parsed.user_name'] as user_name,
  event_message
from logs
where source = 'postgres_logs'
  and match(log_attributes['parsed.error_severity'], 'ERROR|FATAL|PANIC')
order by timestamp desc
limit 100;
```

## Limitations

### The wildcard operator `*` is not supported

The logs query surface rejects `select *` and `count(*)`. List the columns you need, and use `count()` for row counts:

```sql
select timestamp, event_message, log_attributes['parsed.error_severity'] as error_severity
from logs
where source = 'postgres_logs'
order by timestamp desc
limit 100;
```
