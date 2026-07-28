---
id: 'logs'
title: 'Logging'
description: 'Getting started with Supabase Log Browser'
---

The Supabase Platform includes a Logs Explorer that allows log tracing and debugging. Log retention is based on your [project's pricing plan](/pricing). For details on how Logs usage is billed, see [Manage Logs usage](/docs/guides/platform/manage-your-usage/logs).

## Product logs

Supabase provides a logging interface specific to each product. You can use regular expressions for keywords and patterns to search log event messages. You can also export and download the log events matching your query as a spreadsheet.

{/* <!-- To update screenshots, ensure that at least one log line is selected to display the metadata. Can use meme.town as an example. --> */}

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="api"
  queryGroup="product"
>
<TabPanel id="api" label="API">

[API logs](/dashboard/project/_/logs/edge-logs) show all network requests and response for the REST and GraphQL [APIs](../../guides/database/api). If [Read Replicas](/docs/guides/platform/read-replicas) are enabled, logs are automatically filtered between databases as well as the [API Load Balancer](/docs/guides/platform/read-replicas#api-load-balancer) endpoint. Logs for a specific endpoint can be toggled with the `Source` button on the upper-right section of the dashboard.

When viewing logs originating from the API Load Balancer endpoint, the upstream database or the one that eventually handles the request can be found under the `Redirect Identifier` field. This is equivalent to `metadata.load_balancer_redirect_identifier` when querying the underlying logs.

![API Logs](/docs/img/guides/platform/logs/logs-api.png)

</TabPanel>
<TabPanel id="postgres" label="Postgres">

[Postgres logs](/dashboard/project/_/logs/postgres-logs) show queries and activity for your [database](../../guides/database). If [Read Replicas](/docs/guides/platform/read-replicas) are enabled, logs are automatically filtered between databases. Logs for a specific database can be toggled with the `Source` button on the upper-right section of the dashboard.

![Postgres Logs](/docs/img/guides/platform/logs/logs-database.png)

</TabPanel>
<TabPanel id="auth" label="Auth">

[Auth logs](/dashboard/project/_/logs/auth-logs) show all server logs for your [Auth usage](../../guides/auth).

![Auth Logs](/docs/img/guides/platform/logs/logs-auth.png)

</TabPanel>
<TabPanel id="storage" label="Storage">

[Storage logs](/dashboard/project/_/logs/storage-logs) shows all server logs for your [Storage API](../../guides/storage).

![Storage Logs](/docs/img/guides/platform/logs/logs-storage.png)

</TabPanel>
<TabPanel id="realtime" label="Realtime">

[Realtime logs](/dashboard/project/_/logs/realtime-logs) show all server logs for your [Realtime API usage](../../guides/realtime).

<Admonition type="note">

Realtime connections are not logged by default. Turn on [Realtime connection logs per client](#logging-realtime-connections) with the `log_level` parameter.

</Admonition>

![Realtime Logs](/docs/img/guides/platform/logs/logs-realtime.png)

</TabPanel>
<TabPanel id="functions" label="Edge Functions">

For each [Edge Function](/dashboard/project/_/functions), logs are available under the following tabs:

**Invocations**

The Invocations tab displays the edge logs of function calls.

![Function Edge Logs](/docs/img/guides/platform/logs/logs-functions-edge.png)

**Logs**

The Logs tab displays logs emitted during function execution.

![Function Logs](/docs/img/guides/platform/logs/logs-functions.png)

**Log Message Length**

Edge Function log messages have a max length of 10,000 characters. If you try to log a message longer than that it will be truncated.

</TabPanel>
</Tabs>

---

## Working with API logs

[API logs](/dashboard/project/_/logs/edge-logs) run through the Cloudflare edge servers and will have attached Cloudflare metadata under the `metadata.request.cf.*` fields.

### Allowed headers

A strict list of request and response headers are permitted in the API logs. Request and response headers will still be received by the server(s) and client(s), but will not be attached to the API logs generated.

Request headers:

- `accept`
- `cf-connecting-ip`
- `cf-ipcountry`
- `host`
- `user-agent`
- `x-forwarded-proto`
- `referer`
- `content-length`
- `x-real-ip`
- `x-client-info`
- `x-forwarded-user-agent`
- `range`
- `prefer`

Response headers:

- `cf-cache-status`
- `cf-ray`
- `content-location`
- `content-range`
- `content-type`
- `content-length`
- `date`
- `transfer-encoding`
- `x-kong-proxy-latency`
- `x-kong-upstream-latency`
- `sb-gateway-mode`
- `sb-gateway-version`

### Additional request metadata

To attach additional metadata to a request, it is recommended to use the `User-Agent` header for purposes such as device or version identification.

For example:

```
node MyApp/1.2.3 (device-id:abc123)
Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0 MyApp/1.2.3 (Foo v1.3.2; Bar v2.2.2)
```

<Admonition type="note">

Do not log Personal Identifiable Information (PII) within the `User-Agent` header, to avoid infringing data protection privacy laws. Overly fine-grained and detailed user agents may allow fingerprinting and identification of the end user through PII.

</Admonition>

## Logging Postgres connections

Postgres can log connection lifecycle events to your project's Postgres logs, for example when a client connects or authenticates. By default, Supabase sets `log_connections` to off for new projects and you must enable it first.

To enable connection logging for audit or compliance, see [Postgres connection logging](/docs/guides/platform/postgres-connection-logging).

In the [Logs Explorer](/dashboard/project/_/logs-explorer), connection lifecycle messages may be hidden by default. Use the connection logs filter in the sidebar to show them.

## Logging Postgres queries

To enable query logs for other categories of statements:

1. [Enable the pgAudit extension](/dashboard/project/_/database/extensions).
2. Configure `pgaudit.log` (see below). Perform a fast reboot if needed.
3. View your query logs under [Logs > Postgres Logs](/dashboard/project/_/logs/postgres-logs).

### Configuring `pgaudit.log`

The stored value under `pgaudit.log` determines the classes of statements that are logged by [pgAudit extension](https://www.pgaudit.org/). Refer to the pgAudit documentation for the [full list of values](https://github.com/pgaudit/pgaudit/blob/master/README.md#pgauditlog).

To enable logging for function calls/do blocks, writes, and DDL statements for a single session, execute the following within the session:

```sql
-- temporary single-session config update
set pgaudit.log = 'function, write, ddl';
```

To _permanently_ set a logging configuration (beyond a single session), execute the following, then perform a fast reboot:

```sql
-- equivalent permanent config update.
alter role postgres set pgaudit.log to 'function, write, ddl';
```

To help with debugging, we recommend adjusting the log scope to only relevant statements as having too wide of a scope would result in a lot of noise in your Postgres logs.

Note that in the above example, the role is set to `postgres`. To log user-traffic flowing through the [HTTP APIs](../../guides/database/api#rest-api-overview) powered by PostgREST, set your configuration values for the `authenticator`.

```sql
-- for API-related logs
alter role authenticator set pgaudit.log to 'write';
```

By default, the log level will be set to `log`. To view other levels, run the following:

```sql
-- adjust log level
alter role postgres set pgaudit.log_level to 'info';
alter role postgres set pgaudit.log_level to 'debug5';
```

Note that as per the pgAudit [log_level documentation](https://github.com/pgaudit/pgaudit/blob/master/README.md#pgauditlog_level), `error`, `fatal`, and `panic` are not allowed.

To reset system-wide settings, execute the following, then perform a fast reboot:

```sql
-- resets stored config.
alter role postgres reset pgaudit.log
```

<Admonition type="note">

If any permission errors are encountered when executing `alter role postgres ...`, it is likely that your project has yet to receive the patch to the latest version of [supautils](https://github.com/supabase/supautils), which is currently being rolled out.

</Admonition>

### `RAISE`d log messages in Postgres

Messages that are manually logged via `RAISE INFO`, `RAISE NOTICE`, `RAISE WARNING`, and `RAISE LOG` are shown in Postgres Logs. Note that only messages at or above your logging level are shown. Syncing of messages to Postgres Logs may take a few minutes.

If your logs aren't showing, check your logging level by running:

```sql
show log_min_messages;
```

Note that `LOG` is a higher level than `WARNING` and `ERROR`, so if your level is set to `LOG`, you will not see `WARNING` and `ERROR` messages.

### Limits and caveats

- Postgres log events on the Supabase Platform are limited to 100,000 characters. If a log event exceeds this limit, it will be truncated. This does not apply to self-hosting.
- Internal connection logs to Postgres within the Supabase Platform by internal services are not logged. This does not apply to self-hosting.

## Logging realtime connections

Realtime doesn't log new WebSocket connections or Channel joins by default. Enable connection logging per client by including an `info` `log_level` parameter when instantiating the Supabase client.

```javascript
import { createClient } from '@supabase/supabase-js'

const options = {
  realtime: {
    params: {
      log_level: 'info',
    },
  },
}
const supabase = createClient('https://xyzcompany.supabase.co', 'sb_publishable_...', options)
```

## Logs Explorer

The [Logs Explorer](/dashboard/project/_/logs-explorer) exposes logs from each part of the Supabase stack as a separate table that can be queried and joined using SQL.

![Logs Explorer](/docs/img/guides/platform/logs/logs-explorer.png)

You can access the following logs from the **Sources** drop-down:

- `auth_logs`: GoTrue server logs, containing authentication/authorization activity.
- `edge_logs`: Edge network logs, containing request and response metadata retrieved from Cloudflare.
- `function_edge_logs`: Edge network logs for only edge functions, containing network requests and response metadata for each execution.
- `function_logs`: Function internal logs, containing any `console` logging from within the edge function.
- `postgres_logs`: Postgres database logs, containing statements executed by connected applications.
- `realtime_logs`: Realtime server logs, containing client connection information.
- `storage_logs`: Storage server logs, containing object upload and retrieval information.

## Querying with the Logs Explorer

The Logs Explorer runs on **ClickHouse**. Every log line from every source is a single row in the `logs` table, tagged by a `source` column. Structured fields live in a `log_attributes` map whose values are strings, and the raw line is in `event_message`.

<Admonition type="note">

ClickHouse has been the default engine since June 2026. Projects created before this date use BigQuery, whose `cross join unnest(metadata)` syntax is deprecated. We recommend rewriting those queries in the ClickHouse syntax shown in this guide.

</Admonition>

Read fields with bracket access, keeping the full dotted key, for example `log_attributes['request.path']` rather than `path`. Wrap numeric values in `toInt32OrZero(...)`, which returns `0` for a missing or non-numeric value. Use `count()` rather than `count(*)`.

For example, to find failing API requests:

```sql
select timestamp,
       toInt32OrZero(log_attributes['response.status_code']) as status,
       log_attributes['request.path'] as path
from logs
where source = 'edge_logs'
  and toInt32OrZero(log_attributes['response.status_code']) >= 400
order by timestamp desc
limit 100;
```

For example, to find a specific Postgres SQLSTATE (`42501` permission denied, `42P01` relation missing, `23505` duplicate key):

```sql
select timestamp, log_attributes['parsed.user_name'] as role, event_message
from logs
where source = 'postgres_logs'
  and log_attributes['parsed.sql_state_code'] = '42501'
order by timestamp desc
limit 100;
```

Do not guess `log_attributes` keys. A missing key returns an empty string rather than an error, so a wrong key makes a working query look empty instead of failing. Discover the real keys for a source, or read `event_message`, which always holds the full line. Statement text and error detail live there, not in `parsed.query` or `parsed.detail`, which are usually empty:

```sql
select arrayJoin(mapKeys(log_attributes)) as key, count() as n
from logs
where source = 'postgres_logs'
group by key
order by n desc
limit 100;
```

If you use the [Supabase MCP server](/docs/guides/getting-started/mcp), the `query_logs` tool runs a custom ClickHouse query like the ones above on hosted projects. The `get_logs` tool returns a service's recent logs without SQL; it is deprecated on hosted projects in favor of `query_logs`, and remains the option for local and self-hosted projects.

### LIMIT and result row limitations

The Logs Explorer has a maximum of 1000 rows per run. Use `LIMIT` to optimize your queries by reducing the number of rows returned further.

### Best practices

1. **Include a filter over the timestamp.**

Querying your entire log history might seem appealing. For **Enterprise** customers that have a large retention range, you run the risk of timeouts due additional time required to scan the larger dataset.

2. **Avoid selecting large nested objects; select individual values instead.**

When querying large objects, the columnar storage engine selects each column associated with each nested key, resulting in a large number of columns being selected. This inadvertently impacts the query speed and may result in timeouts or memory errors, especially for projects with a lot of logs.

Instead, select only the values required.

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

3. **Query one source at a time.**

Identify which service owns the problem from the error or status code first, then query only that source. Scanning every source at once buries the signal you need and scans far more data than the investigation requires.

4. **Follow a request across sources with an anchor.** Once a query gives you an anchor such as a timestamp, request id, or SQL state, filter the adjacent source by that anchor to correlate the request across layers (for example `edge_logs` to `postgres_logs`), instead of re-scanning each source from scratch.

5. **Reference only fields you have confirmed.**

A misspelled or non-existent field name either errors or silently returns nothing, which leaves a working query look empty. Confirm field names in the [field reference](#logs-field-reference), or select `event_message` and inspect a sample row first.

### Logs field reference

Refer to the full field reference for each source below. Each source's structured fields are listed as ClickHouse `log_attributes` keys, alongside the base columns (`id`, `timestamp`, `event_message`, `severity_text`, `source`) that every source has.

<SharedData data="logConstants">
  {(logConstants) => {
    const otelBaseFields = [
      { path: 'id', type: 'string' },
      { path: 'timestamp', type: 'datetime' },
      { path: 'event_message', type: 'string' },
      { path: 'severity_text', type: 'string' },
      { path: 'source', type: 'string' },
    ]
    const baseColumns = new Set(otelBaseFields.map((field) => field.path))
    return (
      <Tabs
        scrollable
        size="small"
        type="underlined"
        defaultActiveId="edge_logs"
        queryGroup="source"
      >
        {logConstants.schemas.map((schema) => {
          const fields = [
            ...otelBaseFields,
            ...schema.fields
              .filter((field) => !baseColumns.has(field.path))
              .map((field) => ({
                path: `log_attributes['${field.path.replace(/^metadata\./, '')}']`,
                type: field.type,
              })),
          ]
          return (
            <TabPanel id={schema.reference} key={schema.reference} label={schema.name}>
              <table>
                <thead>
                  <tr>
                    <th>Path</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => (
                    <tr>
                      <td>{field.path}</td>
                      <td>{field.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TabPanel>
          )
        })}
      </Tabs>
    )
  }}
</SharedData>
