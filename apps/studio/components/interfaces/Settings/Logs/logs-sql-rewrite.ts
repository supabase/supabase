import { BASE_PATH } from '@/lib/constants'

export const LOGS_SCHEMA_REFERENCE = `The logs table (ClickHouse) has these columns:
- id (String)
- timestamp (DateTime64, UTC) formatted like 2026-06-22T09:34:06.215000 (ISO 8601, microsecond precision, no trailing Z)
- event_message (String): the raw log line
- severity_text (String): log level when present
- source (String): the service the log belongs to. Always filter by it, e.g. where source = 'edge_logs'.
- log_attributes (Map(String, String)): structured per-source fields, read as log_attributes['key']. Values are strings, so wrap numeric ones in toInt32OrZero(...) for comparisons.

Sources and their common log_attributes keys:
- edge_logs: request.method, request.path, request.search, response.status_code, identifier
- postgres_logs: parsed.error_severity, parsed.detail, parsed.hint, parsed.query, identifier
- pg_cron logs live under source = 'postgres_logs' (parsed.error_severity, parsed.query)
- auth_logs: level, status, path, msg, error
- function_edge_logs: response.status_code, request.method, request.pathname, function_id, execution_id, execution_time_ms
- function_logs: event_type, function_id, execution_id, level
- storage_logs, realtime_logs, postgrest_logs, supavisor_logs, pgbouncer_logs: mostly id, timestamp, event_message, with extra fields in log_attributes

Rules: always filter by source; the editor applies the selected time range so a timestamp filter is usually unnecessary; the old BigQuery unnest joins become log_attributes['key'] lookups (drop the metadata root).`

function renderAvailableKeys(availableKeys?: string[]): string {
  if (!availableKeys || availableKeys.length === 0) return ''
  const list = availableKeys.map((key) => `- log_attributes['${key}']`).join('\n')
  return `\nThe actual log_attributes keys present for this source are listed below. Use these EXACT keys — do not invent, shorten, or drop any dotted prefix. If a BigQuery field maps to one of these (e.g. request.headers.x_real_ip, request.cf.country), use the full key shown here:
${list}\n`
}

export function buildClickhouseRewritePrompt(sql: string, availableKeys?: string[]): string {
  return `${LOGS_SCHEMA_REFERENCE}
${renderAvailableKeys(availableKeys)}
Convert the BigQuery logs query below to ClickHouse SQL for the logs table. There are no per-service tables and no unnest joins in ClickHouse. Follow these rules exactly:

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
limit 100

Reply with ONLY the rewritten SQL query: no explanation, no comments, and no markdown code fences.

${sql}`
}

export function stripSqlCodeFences(text: string): string {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:sql)?\s*\n?([\s\S]*?)\n?```/i)
  return (fenced ? fenced[1] : trimmed).trim()
}

const SOURCE_ALIASES: Record<string, string> = {
  pg_cron_logs: 'postgres_logs',
}

export function detectLogSource(sql: string): string | undefined {
  const bySource = sql.match(/source\s*=\s*'([^']+)'/i)
  if (bySource) {
    const source = bySource[1].toLowerCase()
    return SOURCE_ALIASES[source] ?? source
  }
  const byFrom = sql.match(/\bfrom\s+([a-z_][a-z0-9_]*)/i)
  if (byFrom) {
    const table = byFrom[1].toLowerCase()
    if (table === 'logs') return undefined
    return SOURCE_ALIASES[table] ?? table
  }
  return undefined
}

export function looksLikeLegacyLogsQuery(sql: string): boolean {
  const lower = sql.toLowerCase()
  if (/\bunnest\s*\(/.test(lower)) return true
  if (/cast\s*\(\s*timestamp\s+as\s+datetime\s*\)/.test(lower)) return true
  const byFrom = lower.match(/\bfrom\s+([a-z_][a-z0-9_]*)/)
  return byFrom ? byFrom[1] !== 'logs' : false
}

export interface RewriteLogsSqlArgs {
  sql: string
  projectRef: string
  connectionString?: string | null
  orgSlug?: string
  authorizationHeader?: string | null
  availableKeys?: string[]
}

export async function rewriteLogsSqlWithAI(args: RewriteLogsSqlArgs) {
  const { sql, projectRef, connectionString, orgSlug, authorizationHeader, availableKeys } = args

  const response = await fetch(`${BASE_PATH}/api/ai/code/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authorizationHeader ? { Authorization: authorizationHeader } : {}),
    },
    body: JSON.stringify({
      projectRef,
      connectionString,
      language: 'sql',
      dialect: 'clickhouse',
      orgSlug,
      completionMetadata: {
        textBeforeCursor: '',
        textAfterCursor: '',
        language: 'pgsql',
        prompt: buildClickhouseRewritePrompt(sql, availableKeys),
        selection: sql,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Failed to rewrite the query')
  }

  const raw = await response.json()
  const rewritten = stripSqlCodeFences(typeof raw === 'string' ? raw : String(raw))
  if (!rewritten) throw new Error('The assistant returned an empty query')
  return rewritten
}
