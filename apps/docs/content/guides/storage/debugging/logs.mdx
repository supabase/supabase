---
id: 'storage-logs'
title: 'Logs'
description: 'Learn how to check Storage Logs'
sidebar_label: 'Debugging'
---

The [Storage Logs](/dashboard/project/_/logs/storage-logs) provide a convenient way to examine all incoming request logs to your Storage service. You can filter by time and keyword searches.

For more advanced filtering needs, use the [Logs Explorer](/dashboard/project/_/logs/explorer) to query the Storage logs dataset directly. The Logs Explorer is separate from the SQL Editor and uses a subset of the BigQuery SQL syntax rather than traditional SQL.

<Admonition type="tip">
  
For more details on filtering the log tables, see [Advanced Log Filtering](/docs/guides/telemetry/advanced-log-filtering)

</Admonition>

### Example Storage queries for the Logs Explorer

#### Filter by status 5XX error

```sql
select
  id,
  storage_logs.timestamp,
  event_message,
  r.statusCode,
  e.message as errorMessage,
  e.raw as rawError
from
  storage_logs
  cross join unnest(metadata) as m
  cross join unnest(m.res) as r
  cross join unnest(m.error) as e
where r.statusCode >= 500
order by timestamp desc
limit 100;
```

#### Filter by status 4XX error

```sql
select
  id,
  storage_logs.timestamp,
  event_message,
  r.statusCode,
  e.message as errorMessage,
  e.raw as rawError
from
  storage_logs
  cross join unnest(metadata) as m
  cross join unnest(m.res) as r
  cross join unnest(m.error) as e
where r.statusCode >= 400 and r.statusCode < 500
order by timestamp desc
limit 100;
```

#### Filter by method

```sql
select id, storage_logs.timestamp, event_message, r.method
from
  storage_logs
  cross join unnest(metadata) as m
  cross join unnest(m.req) as r
where r.method in ("POST")
order by timestamp desc
limit 100;
```

#### Filter by IP address

```sql
select id, storage_logs.timestamp, event_message, r.remoteAddress
from
  storage_logs
  cross join unnest(metadata) as m
  cross join unnest(m.req) as r
where r.remoteAddress in ("IP_ADDRESS")
order by timestamp desc
limit 100;
```
