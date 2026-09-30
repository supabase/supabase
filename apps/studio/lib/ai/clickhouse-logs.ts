/**
 * Everything the model needs to know about the ClickHouse-backed Supabase `logs`
 * table, in one place. Both ClickHouse completion flows — the inline "edit this
 * query" path and the whole-query BigQuery rewrite — are assembled from these,
 * server-side in `pages/api/ai/code/complete.ts`, so there is exactly one
 * description of the schema to keep current.
 */

/** System-prompt half: the dialect rules that hold for every ClickHouse request. */
export const CLICKHOUSE_LOGS_COMPLETION_INSTRUCTIONS = `
# Supabase logs SQL (ClickHouse)
You are writing SQL for Supabase logs, which run on a ClickHouse-backed engine. This is NOT Postgres and NOT BigQuery. Output valid ClickHouse SQL only.
- All logs are in a single table named \`logs\`, keyed by a \`source\` column. There are no per-service tables (no \`edge_logs\`, \`postgres_logs\`, and so on) and no \`unnest\` joins.
- Per-source fields live in the \`log_attributes\` Map(String, String), read as \`log_attributes['key']\`. Map values are strings, so wrap numeric ones in \`toInt32OrZero(...)\`.
- Use ClickHouse functions, not Postgres or BigQuery ones. Use \`match(col, 'regex')\` or \`col ILIKE '%text%'\` instead of \`regexp_contains\`, \`count()\` instead of \`count(*)\`, and select the \`timestamp\` column directly instead of \`cast(timestamp as datetime)\`.
- Do not filter on \`timestamp\` in SQL and do not wrap it in \`toDateTime64\`, \`toDateTime\`, or \`parseDateTime*\`. The editor applies the selected time range as a request parameter. A trailing \`Z\` inside those functions is invalid ClickHouse.
- Filter by \`source\` to scope to one service; omit it to query across services.
- Do not quote identifiers with double quotes and do not append a trailing semicolon.
- Do not use \`select *\`, this is disallowed by the backend.
`

/**
 * User-message half: the concrete shape of the table. Complements the dialect
 * rules above — this is the part that changes when a log source or its fields
 * change, and it is the ClickHouse counterpart to the Postgres DDL section.
 */
const CLICKHOUSE_LOGS_COLUMN_REFERENCE = `The logs table has these columns:
- id (String)
- timestamp (DateTime64, UTC) formatted like 2026-06-22T09:34:06.215000 (ISO 8601, microsecond precision, no trailing Z)
- event_message (String): the raw log line
- severity_text (String): log level when present
- source (String): the service the log belongs to. Filter by it to scope to one service, e.g. where source = 'edge_logs'. Omit it to query across services.
- log_attributes (Map(String, String)): structured per-source fields, read as log_attributes['key']

Sources and their common log_attributes keys:
- edge_logs: request.method, request.path, request.search, response.status_code, identifier
- postgres_logs: parsed.error_severity, parsed.detail, parsed.hint, parsed.query, identifier
- pg_cron logs live under source = 'postgres_logs' (parsed.error_severity, parsed.query)
- auth_logs: level, status, path, msg, error
- function_edge_logs: response.status_code, request.method, request.pathname, function_id, execution_id, execution_time_ms
- function_logs: event_type, function_id, execution_id, level
- storage_logs, realtime_logs, postgrest_logs, supavisor_logs, pgbouncer_logs: mostly id, timestamp, event_message, with extra fields in log_attributes

The editor or query_logs tool applies the user's selected time range as a request parameter, so do not add a timestamp filter in SQL.`

function renderAvailableKeys(availableKeys?: string[]): string {
  if (!availableKeys || availableKeys.length === 0) return ''
  const list = availableKeys.map((key) => `- log_attributes['${key}']`).join('\n')
  return `\nThe actual log_attributes keys present for this source are listed below. Use these EXACT keys — do not invent, shorten, or drop any dotted prefix. If a BigQuery field maps to one of these (e.g. request.headers.x_real_ip, request.cf.country), use the full key shown here:
${list}\n`
}

/**
 * The ClickHouse schema section of the user message — the counterpart to
 * `buildDatabaseSchemaSection` for Postgres. `availableKeys` are the real
 * `log_attributes` keys observed for the query's source, when the caller
 * discovered them.
 */
export function buildClickhouseLogsSchemaSection(availableKeys?: string[]): string {
  return `${CLICKHOUSE_LOGS_COLUMN_REFERENCE}\n${renderAvailableKeys(availableKeys)}`
}

/**
 * The instruction for the whole-query BigQuery → ClickHouse rewrite. Used in
 * place of a user instruction when the request's intent is `rewrite`.
 *
 * It states that a rewrite is REQUIRED: the system prompt covers writing and
 * editing ClickHouse SQL generally, and without an explicit demand here the model
 * echoes the input back, which surfaces to the user as an empty diff.
 */
export const CLICKHOUSE_LOGS_REWRITE_INSTRUCTION = `Your task is to REWRITE the selected query. It is BigQuery SQL and will not run on ClickHouse, so returning it unchanged is likely wrong — every rule below that applies must be applied.

1. Replace the FROM table with the single logs table and filter by source. The old table name is the source value: "from postgres_logs as t" becomes "from logs where source = 'postgres_logs'". This is required, never select from a table like postgres_logs or edge_logs.
2. Remove every join that unnests metadata or its structs. This includes "cross join unnest(...)" and "left join unnest(...) on true".
3. Replace any column that came from an unnest alias with a log_attributes lookup. A field off unnest(metadata) becomes log_attributes['field']; a field off a nested struct like unnest(m.parsed) becomes log_attributes['parsed.field'] (keep the struct name as a dotted prefix, drop the metadata root and every alias). When the actual keys are listed above, match against them and use the full dotted key exactly.
4. Wrap numeric fields in toInt32OrZero(...) before comparing or aggregating them.
5. Replace BigQuery functions with ClickHouse equivalents: regexp_contains(x, 'p') becomes match(x, 'p'), or x ILIKE '%p%' for a plain substring. Replace cast(timestamp as datetime) with timestamp. Use count() instead of count(*).
6. Preserve the original select list, filters, group by, order by, and limit intent.

Example.
BigQuery:
select count(t.timestamp) as count, p.error_severity
from postgres_logs as t
cross join unnest(metadata) as m
cross join unnest(m.parsed) as p
where p.error_severity in ('ERROR', 'FATAL', 'PANIC')
group by p.error_severity
order by count desc
limit 100

ClickHouse:
select count() as count, log_attributes['parsed.error_severity'] as error_severity
from logs
where source = 'postgres_logs'
  and log_attributes['parsed.error_severity'] in ('ERROR', 'FATAL', 'PANIC')
group by log_attributes['parsed.error_severity']
order by count desc
limit 100`
