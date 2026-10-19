/**
 * DEBUG-242 "Trace prototype" — a plain-JSON surface shaped like the future
 * `query_traces` platform API (to eventually be shared by Studio, MCP and
 * CLI, not just this UI).
 *
 * SWAP POINT: once that API exists, replace this function's body with a
 * fetch to it. Keep the same params in / shape out so call sites don't need
 * to change.
 */
import { getDataset, type OtelSpanFixture } from './trace-fixtures'

export interface QueryTracesParams {
  trace_id: string
}

export interface TraceLogEntry {
  id: string
  timestamp: number
  log_type: string
  level: 'success' | 'warning' | 'error' | null
  status: number | string | null
  method: string | null
  pathname: string | null
  event_message: string
  request_id: string | null
  // The span that made the request this log line is part of — in the real
  // product this would come from the incoming request's traceparent header,
  // the same place trace_id/request_id are captured from.
  span_id: string | null
}

export interface QueryTracesResult {
  spans: OtelSpanFixture[]
  logs: TraceLogEntry[]
}

export function queryTraces({ trace_id }: QueryTracesParams): QueryTracesResult {
  const { spans, rows, spanIdByLogRowId } = getDataset()

  return {
    spans: spans.filter((span) => span.trace_id === trace_id),
    logs: rows
      .filter((row) => row.trace_id === trace_id)
      .map((row) => ({
        id: row.id,
        timestamp: Number(row.timestamp),
        log_type: row.log_type,
        level: row.level,
        status: row.status,
        method: row.method,
        pathname: row.pathname,
        event_message: row.event_message ?? '',
        request_id: row.request_id ?? null,
        span_id: spanIdByLogRowId.get(row.id) ?? null,
      })),
  }
}
