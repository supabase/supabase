/**
 * Rewrites a legacy BigQuery logs query into ClickHouse SQL for the OTEL
 * `logs.all.otel` endpoint by asking the AI completion endpoint, then returns
 * only the rewritten query. The Logs Explorer shows it as a diff to accept; the
 * AI Assistant panel is not opened.
 */
import { BASE_PATH } from '@/lib/constants'

// Schema reference given to the model so it writes ClickHouse logs SQL. Kept
// backtick-free so it composes into the prompt cleanly.
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

/**
 * Prompt for the AI completion endpoint. Includes the schema and the query to
 * rewrite, and instructs the model to return only the SQL so the result can go
 * straight into the editor diff.
 */
export function buildClickhouseRewritePrompt(sql: string): string {
  return `${LOGS_SCHEMA_REFERENCE}

Rewrite the following query to valid ClickHouse SQL against the logs schema above, preserving its original intent. Reply with ONLY the rewritten SQL query: no explanation, no comments, and no markdown code fences.

${sql}`
}

// Models sometimes wrap SQL in a markdown code fence despite being asked not to.
// Strip a single surrounding fence so the editor gets raw SQL.
export function stripSqlCodeFences(text: string): string {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:sql)?\s*\n?([\s\S]*?)\n?```$/i)
  return (fenced ? fenced[1] : trimmed).trim()
}

export interface RewriteLogsSqlArgs {
  sql: string
  projectRef?: string
  connectionString?: string | null
  orgSlug?: string
  authorizationHeader?: string | null
}

/**
 * Calls the AI completion endpoint in the background and returns the rewritten
 * ClickHouse query. Throws on a failed request or an empty result.
 */
export async function rewriteLogsSqlWithAI(args: RewriteLogsSqlArgs) {
  const { sql, projectRef, connectionString, orgSlug, authorizationHeader } = args

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
      orgSlug,
      completionMetadata: {
        textBeforeCursor: '',
        textAfterCursor: '',
        language: 'pgsql',
        prompt: buildClickhouseRewritePrompt(sql),
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
