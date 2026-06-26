/**
 * The SQL Editor can run against Postgres or, via a pseudo-source, against the
 * ClickHouse-backed logs endpoint. These helpers identify that source, supply a
 * default time window, and hold the schema context handed to the AI Assistant.
 */

// Sentinel id used in the database selector to mean "query the logs endpoint".
export const SQL_EDITOR_LOGS_SOURCE_ID = 'logs'

export const isLogsSource = (sourceId?: string): boolean => sourceId === SQL_EDITOR_LOGS_SOURCE_ID

// Logs queries need a time range. Default to the last 24 hours when the user
// hasn't picked one.
export const SQL_EDITOR_LOGS_DEFAULT_RANGE_HOURS = 24

export const getDefaultLogsTimeRange = (
  now: Date
): { iso_timestamp_start: string; iso_timestamp_end: string } => ({
  iso_timestamp_start: new Date(
    now.getTime() - SQL_EDITOR_LOGS_DEFAULT_RANGE_HOURS * 60 * 60 * 1000
  ).toISOString(),
  iso_timestamp_end: now.toISOString(),
})

// Starter query shown when the logs source is selected with an empty editor.
export const SQL_EDITOR_LOGS_DEFAULT_QUERY =
  "select\n  timestamp,\n  event_message,\n  log_attributes\nfrom logs\nwhere source = 'edge_logs'\norder by timestamp desc\nlimit 100"

// Schema reference handed to the AI Assistant so it writes ClickHouse logs SQL
// instead of Postgres. Kept backtick-free so it composes into prompts cleanly.
export const LOGS_SQL_AI_CONTEXT = `You are writing SQL for the Supabase logs source, which runs on a ClickHouse-backed engine, not Postgres. Do not write Postgres SQL.

All logs live in a single table named logs, with these columns:
- id (String)
- timestamp (DateTime64, UTC) formatted like 2026-06-22T09:34:06.215000
- event_message (String): the raw log line
- severity_text (String): log level when present
- source (String): the service the log belongs to. Always filter by it, e.g. where source = 'edge_logs'.
- log_attributes (Map(String, String)): structured per-source fields, read as log_attributes['key']. Values are strings, so wrap numeric ones in toInt32OrZero(...) for comparisons.

Sources and their common log_attributes keys:
- edge_logs: request.method, request.path, request.search, response.status_code, identifier
- postgres_logs: parsed.error_severity, parsed.detail, parsed.hint, parsed.query, identifier
- auth_logs: level, status, path, msg, error
- function_edge_logs: response.status_code, request.method, request.pathname, function_id, execution_id, execution_time_ms
- function_logs: event_type, function_id, execution_id, level
- storage_logs, realtime_logs, postgrest_logs, supavisor_logs, pgbouncer_logs: mostly id, timestamp, event_message, with extra fields in log_attributes

Rules:
- Always filter by source.
- The editor applies the selected time range, so a timestamp filter is usually unnecessary.
- Numeric filter example: toInt32OrZero(log_attributes['response.status_code']) between 500 and 599
- Text search: event_message ILIKE '%timeout%'
- List the keys on a row with: select mapKeys(log_attributes) from logs where source = '...' limit 1`
