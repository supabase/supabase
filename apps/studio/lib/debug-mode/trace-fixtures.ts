/**
 * DEBUG-242 "Trace prototype" fixtures — fake OpenTelemetry spans joined to
 * fake unified-log rows, for a from-log-to-trace design review. Entirely
 * client-side; nothing here touches a real project.
 *
 * Extends the DEPR-705 debug-mode prototype (fixture.ts, state/debug-mode.ts)
 * rather than inventing a second mock-data system: log rows are filtered by
 * the same `DebugLevel` the debug-mode banner reads/writes. Spans are never
 * filtered by debug level — in the real product they arrive over a separate
 * OTLP ingestion path that debug mode doesn't govern.
 *
 * The dataset (6 traces + 2 standalone log events, spread over the last 60
 * minutes) is generated once per browser session — see `getDataset()` below
 * — so repeated queries/re-renders see a stable set of ids and timestamps.
 */
import { LOG_TYPE_TO_SOURCE } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.constants'
import {
  groupLogsFiltersByColumn,
  parseLogsFilterUrlParams,
  type LogsColumnFilterValue,
} from '@/components/interfaces/UnifiedLogs/UnifiedLogs.filters'
import type { ColumnSchema } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.schema'
import type { QuerySearchParamsType } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.types'
import { flattenOtelInspectionRow, type OtelLogRow } from '@/data/logs/otel-inspection.utils'
import type { UnifiedLogInspectionEntry } from '@/data/logs/unified-log-inspection-query'
import { isTracePrototypeEnabledSync } from '@/lib/debug-mode/trace-prototype-flag'
import type { DebugLevel } from '@/state/debug-mode'

// ---------------------------------------------------------------------------
// OpenTelemetry span shape
// ---------------------------------------------------------------------------

export type OtelSpanKind = 'INTERNAL' | 'SERVER' | 'CLIENT' | 'PRODUCER' | 'CONSUMER'
export type OtelSpanStatusCode = 'UNSET' | 'OK' | 'ERROR'

export interface OtelSpanFixture {
  trace_id: string
  span_id: string
  parent_span_id: string | null
  name: string
  kind: OtelSpanKind
  start_time: string // ISO 8601
  end_time: string // ISO 8601
  status: { code: OtelSpanStatusCode; message?: string }
  attributes: Record<string, string | number | boolean>
  resource: { attributes: { 'service.name': string } }
}

// ---------------------------------------------------------------------------
// Trace/log blueprints
// ---------------------------------------------------------------------------

type FixtureLogType = 'edge' | 'postgrest' | 'auth' | 'storage' | 'edge function' | 'postgres'
type FixtureMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
type FixtureLevel = 'success' | 'warning' | 'error'

interface SpanBlueprint {
  key: string
  parentKey: string | null
  name: string
  service: string
  kind: OtelSpanKind
  startOffsetMs: number
  durationMs: number
  statusCode: OtelSpanStatusCode
  statusMessage?: string
  httpMethod?: FixtureMethod
  httpRoute?: string
  httpStatusCode?: number
}

interface LogBlueprint {
  /** The log's timestamp is placed inside this span's [start, end] window, and
   * it inherits that span's request id — this is what makes "every log inside
   * the triggering span" and "one request id per Supabase call" automatic
   * rather than something each blueprint has to get right by hand. */
  triggeredBySpanKey: string
  positionInSpan: number // 0..1 fraction of the span's duration
  logType: FixtureLogType
  level: FixtureLevel
  status: number
  method?: FixtureMethod
  pathname?: string
  message: string
}

interface TraceBlueprint {
  name: string
  minutesAgo: number
  spans: SpanBlueprint[]
  logs: LogBlueprint[]
}

const FRONTEND = 'football-manager-db-frontend'
const API = 'football-manager-db-api'

const TRACE_BLUEPRINTS: TraceBlueprint[] = [
  // 1. checkout -> supabase-js rpc charge_invoice, fails after ~640ms
  {
    name: 'checkout',
    minutesAgo: 4,
    spans: [
      {
        key: 'app',
        parentKey: null,
        name: 'checkout',
        service: FRONTEND,
        kind: 'INTERNAL',
        startOffsetMs: 0,
        durationMs: 700,
        statusCode: 'ERROR',
      },
      {
        key: 'client',
        parentKey: 'app',
        name: 'POST /api/checkout',
        service: FRONTEND,
        kind: 'CLIENT',
        startOffsetMs: 5,
        durationMs: 685,
        statusCode: 'ERROR',
        httpMethod: 'POST',
        httpRoute: '/api/checkout',
      },
      {
        key: 'server',
        parentKey: 'client',
        name: 'POST /api/checkout',
        service: API,
        kind: 'SERVER',
        startOffsetMs: 10,
        durationMs: 675,
        statusCode: 'ERROR',
        httpMethod: 'POST',
        httpRoute: '/api/checkout',
        httpStatusCode: 500,
      },
      {
        key: 'supabase',
        parentKey: 'server',
        name: 'rpc charge_invoice',
        service: API,
        kind: 'CLIENT',
        startOffsetMs: 20,
        durationMs: 640,
        statusCode: 'ERROR',
        statusMessage: 'PostgREST: function raised an uncaught exception',
        httpMethod: 'POST',
        httpRoute: '/rest/v1/rpc/charge_invoice',
        httpStatusCode: 500,
      },
    ],
    logs: [
      {
        triggeredBySpanKey: 'supabase',
        positionInSpan: 0.05,
        logType: 'auth',
        level: 'success',
        status: 200,
        method: 'GET',
        pathname: '/auth/v1/user',
        message: 'Token verified',
      },
      {
        triggeredBySpanKey: 'supabase',
        positionInSpan: 0.8,
        logType: 'postgres',
        level: 'error',
        status: 500,
        message: 'deadlock detected while updating "orders"',
      },
      {
        triggeredBySpanKey: 'supabase',
        positionInSpan: 0.9,
        logType: 'postgrest',
        level: 'error',
        status: 500,
        method: 'POST',
        pathname: '/rest/v1/rpc/charge_invoice',
        message: 'PostgREST: function raised an uncaught exception',
      },
      {
        triggeredBySpanKey: 'supabase',
        positionInSpan: 0.98,
        logType: 'edge',
        level: 'error',
        status: 500,
        method: 'POST',
        pathname: '/rest/v1/rpc/charge_invoice',
        message: 'Upstream service returned an error response',
      },
    ],
  },

  // 2. send receipt -> supabase-js functions.invoke, Edge Function OOMs
  {
    name: 'send receipt',
    minutesAgo: 12,
    spans: [
      {
        key: 'app',
        parentKey: null,
        name: 'send receipt',
        service: FRONTEND,
        kind: 'INTERNAL',
        startOffsetMs: 0,
        durationMs: 500,
        statusCode: 'ERROR',
      },
      {
        key: 'client',
        parentKey: 'app',
        name: 'POST /api/send-receipt',
        service: FRONTEND,
        kind: 'CLIENT',
        startOffsetMs: 5,
        durationMs: 480,
        statusCode: 'ERROR',
        httpMethod: 'POST',
        httpRoute: '/api/send-receipt',
      },
      {
        key: 'server',
        parentKey: 'client',
        name: 'POST /api/send-receipt',
        service: API,
        kind: 'SERVER',
        startOffsetMs: 10,
        durationMs: 470,
        statusCode: 'ERROR',
        httpMethod: 'POST',
        httpRoute: '/api/send-receipt',
        httpStatusCode: 500,
      },
      {
        key: 'supabase',
        parentKey: 'server',
        name: 'functions.invoke send-receipt',
        service: API,
        kind: 'CLIENT',
        startOffsetMs: 20,
        durationMs: 440,
        statusCode: 'ERROR',
        statusMessage: 'Edge Function crashed: out of memory',
        httpMethod: 'POST',
        httpRoute: '/functions/v1/send-receipt',
        httpStatusCode: 500,
      },
    ],
    logs: [
      {
        triggeredBySpanKey: 'supabase',
        positionInSpan: 0.9,
        logType: 'edge function',
        level: 'error',
        status: 500,
        method: 'POST',
        pathname: '/functions/v1/send-receipt',
        message: 'Edge Function crashed: out of memory',
      },
    ],
  },

  // 3. place order -> supabase-js POST /rest/v1/orders, 429
  {
    name: 'place order',
    minutesAgo: 20,
    spans: [
      {
        key: 'app',
        parentKey: null,
        name: 'place order',
        service: FRONTEND,
        kind: 'INTERNAL',
        startOffsetMs: 0,
        durationMs: 300,
        statusCode: 'ERROR',
      },
      {
        key: 'client',
        parentKey: 'app',
        name: 'POST /api/orders',
        service: FRONTEND,
        kind: 'CLIENT',
        startOffsetMs: 5,
        durationMs: 280,
        statusCode: 'ERROR',
        httpMethod: 'POST',
        httpRoute: '/api/orders',
      },
      {
        key: 'server',
        parentKey: 'client',
        name: 'POST /api/orders',
        service: API,
        kind: 'SERVER',
        startOffsetMs: 10,
        durationMs: 270,
        statusCode: 'ERROR',
        httpMethod: 'POST',
        httpRoute: '/api/orders',
        httpStatusCode: 429,
      },
      {
        key: 'supabase',
        parentKey: 'server',
        name: 'POST /rest/v1/orders',
        service: API,
        kind: 'CLIENT',
        startOffsetMs: 20,
        durationMs: 240,
        statusCode: 'ERROR',
        statusMessage: 'Rate limit exceeded for project API key',
        httpMethod: 'POST',
        httpRoute: '/rest/v1/orders',
        httpStatusCode: 429,
      },
    ],
    logs: [
      {
        triggeredBySpanKey: 'supabase',
        positionInSpan: 0.85,
        logType: 'edge',
        level: 'warning',
        status: 429,
        method: 'POST',
        pathname: '/rest/v1/orders',
        message: 'Rate limit exceeded for project API key',
      },
    ],
  },

  // 4. fully successful trace, several Supabase calls in parallel
  {
    name: 'load dashboard',
    minutesAgo: 30,
    spans: [
      {
        key: 'app',
        parentKey: null,
        name: 'load dashboard',
        service: FRONTEND,
        kind: 'INTERNAL',
        startOffsetMs: 0,
        durationMs: 220,
        statusCode: 'OK',
      },
      {
        key: 'client',
        parentKey: 'app',
        name: 'GET /api/dashboard',
        service: FRONTEND,
        kind: 'CLIENT',
        startOffsetMs: 5,
        durationMs: 200,
        statusCode: 'OK',
        httpMethod: 'GET',
        httpRoute: '/api/dashboard',
      },
      {
        key: 'server',
        parentKey: 'client',
        name: 'GET /api/dashboard',
        service: API,
        kind: 'SERVER',
        startOffsetMs: 10,
        durationMs: 190,
        statusCode: 'OK',
        httpMethod: 'GET',
        httpRoute: '/api/dashboard',
        httpStatusCode: 200,
      },
      {
        key: 'players',
        parentKey: 'server',
        name: 'GET /rest/v1/players',
        service: API,
        kind: 'CLIENT',
        startOffsetMs: 20,
        durationMs: 120,
        statusCode: 'OK',
        httpMethod: 'GET',
        httpRoute: '/rest/v1/players',
        httpStatusCode: 200,
      },
      {
        key: 'teams',
        parentKey: 'server',
        name: 'GET /rest/v1/teams',
        service: API,
        kind: 'CLIENT',
        startOffsetMs: 20,
        durationMs: 140,
        statusCode: 'OK',
        httpMethod: 'GET',
        httpRoute: '/rest/v1/teams',
        httpStatusCode: 200,
      },
      {
        key: 'matches',
        parentKey: 'server',
        name: 'GET /rest/v1/matches',
        service: API,
        kind: 'CLIENT',
        startOffsetMs: 22,
        durationMs: 150,
        statusCode: 'OK',
        httpMethod: 'GET',
        httpRoute: '/rest/v1/matches',
        httpStatusCode: 200,
      },
    ],
    logs: [
      {
        triggeredBySpanKey: 'players',
        positionInSpan: 0.6,
        logType: 'postgrest',
        level: 'success',
        status: 200,
        method: 'GET',
        pathname: '/rest/v1/players',
        message: 'Request completed',
      },
      {
        triggeredBySpanKey: 'teams',
        positionInSpan: 0.6,
        logType: 'postgrest',
        level: 'success',
        status: 200,
        method: 'GET',
        pathname: '/rest/v1/teams',
        message: 'Request completed',
      },
      {
        triggeredBySpanKey: 'matches',
        positionInSpan: 0.6,
        logType: 'postgrest',
        level: 'success',
        status: 200,
        method: 'GET',
        pathname: '/rest/v1/matches',
        message: 'Request completed',
      },
    ],
  },

  // 5. trace with no Supabase calls at all
  {
    name: 'view static page',
    minutesAgo: 40,
    spans: [
      {
        key: 'app',
        parentKey: null,
        name: 'view static page',
        service: FRONTEND,
        kind: 'INTERNAL',
        startOffsetMs: 0,
        durationMs: 150,
        statusCode: 'OK',
      },
      {
        key: 'client',
        parentKey: 'app',
        name: 'GET /api/health',
        service: FRONTEND,
        kind: 'CLIENT',
        startOffsetMs: 5,
        durationMs: 120,
        statusCode: 'OK',
        httpMethod: 'GET',
        httpRoute: '/api/health',
      },
      {
        key: 'server',
        parentKey: 'client',
        name: 'GET /api/health',
        service: API,
        kind: 'SERVER',
        startOffsetMs: 10,
        durationMs: 110,
        statusCode: 'OK',
        httpMethod: 'GET',
        httpRoute: '/api/health',
        httpStatusCode: 200,
      },
    ],
    logs: [],
  },

  // 6. successful single-call trace, for baseline variety
  {
    name: 'view leaderboard',
    minutesAgo: 50,
    spans: [
      {
        key: 'app',
        parentKey: null,
        name: 'view leaderboard',
        service: FRONTEND,
        kind: 'INTERNAL',
        startOffsetMs: 0,
        durationMs: 180,
        statusCode: 'OK',
      },
      {
        key: 'client',
        parentKey: 'app',
        name: 'GET /api/leaderboard',
        service: FRONTEND,
        kind: 'CLIENT',
        startOffsetMs: 5,
        durationMs: 160,
        statusCode: 'OK',
        httpMethod: 'GET',
        httpRoute: '/api/leaderboard',
      },
      {
        key: 'server',
        parentKey: 'client',
        name: 'GET /api/leaderboard',
        service: API,
        kind: 'SERVER',
        startOffsetMs: 10,
        durationMs: 150,
        statusCode: 'OK',
        httpMethod: 'GET',
        httpRoute: '/api/leaderboard',
        httpStatusCode: 200,
      },
      {
        key: 'supabase',
        parentKey: 'server',
        name: 'GET /rest/v1/leaderboard',
        service: API,
        kind: 'CLIENT',
        startOffsetMs: 20,
        durationMs: 110,
        statusCode: 'OK',
        httpMethod: 'GET',
        httpRoute: '/rest/v1/leaderboard',
        httpStatusCode: 200,
      },
    ],
    logs: [
      {
        triggeredBySpanKey: 'supabase',
        positionInSpan: 0.7,
        logType: 'postgrest',
        level: 'success',
        status: 200,
        method: 'GET',
        pathname: '/rest/v1/leaderboard',
        message: 'Request completed',
      },
    ],
  },
]

// Standalone events with no matching trace — never filtered out of the
// "errors always ingested" guarantee below since one is a warning and the
// other is deliberately kept visible even at `min` (see filterRowsForDebugLevel).
const STANDALONE_EVENTS: {
  minutesAgo: number
  logType: FixtureLogType
  level: FixtureLevel
  status: number
  message: string
}[] = [
  {
    minutesAgo: 8,
    logType: 'postgres',
    level: 'success',
    status: 200,
    message: '[compliance] Role altered on table with RLS enabled',
  },
  {
    minutesAgo: 35,
    logType: 'auth',
    level: 'warning',
    status: 400,
    message: 'Password sign-in failed: invalid credentials',
  },
]

// ---------------------------------------------------------------------------
// Dataset construction
// ---------------------------------------------------------------------------

const randomHex = (length: number) =>
  Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('')

const newTraceId = () => randomHex(32) // W3C trace id: 128-bit
const newSpanId = () => randomHex(16) // W3C span id: 64-bit
const newRowId = () => randomHex(32)
const newRequestId = () => randomHex(32)

function buildLogAttributes(input: {
  logType: FixtureLogType
  status: number
  method?: FixtureMethod
  pathname?: string
  traceId: string | null
  requestId: string
}): Record<string, string | number> {
  const attrs: Record<string, string | number> = {
    'response.origin_time': 12 + Math.round(Math.random() * 40),
    request_id: input.requestId,
  }
  if (input.traceId) attrs.trace_id = input.traceId

  switch (input.logType) {
    case 'postgres': {
      const isError = input.status >= 500
      return {
        ...attrs,
        'parsed.error_severity': isError ? 'ERROR' : 'LOG',
        'parsed.sql_state_code': isError ? '40P01' : '00000',
        'parsed.command_tag': 'UPDATE',
        'parsed.database_name': 'postgres',
        'parsed.user_name': 'authenticator',
        'parsed.query': 'UPDATE orders SET status = $1 WHERE id = $2',
        'parsed.detail': isError ? 'Process 1234 waits for ShareLock on transaction 5678.' : '',
        'parsed.process_id': 1234,
      }
    }
    case 'postgrest':
      return {
        ...attrs,
        'request.method': input.method ?? '',
        'request.path': input.pathname ?? '',
        'response.status_code': input.status,
        api_role: 'authenticated',
      }
    case 'auth':
      return {
        ...attrs,
        'request.method': input.method ?? '',
        'request.path': input.pathname ?? '',
        status: input.status,
      }
    case 'edge function':
      return {
        ...attrs,
        'request.pathname': input.pathname ?? '',
        'request.method': input.method ?? '',
        'response.status_code': input.status,
        execution_id: randomHex(16),
        function_id: randomHex(12),
        execution_time_ms: 180 + Math.round(Math.random() * 300),
        'response.headers.x_sb_edge_region': 'us-east-1',
      }
    case 'storage':
      return {
        ...attrs,
        'req.method': input.method ?? '',
        'req.url': input.pathname ?? '',
        'res.statusCode': input.status,
      }
    case 'edge':
    default:
      return {
        ...attrs,
        'request.method': input.method ?? '',
        'request.path': input.pathname ?? '',
        'response.status_code': input.status,
      }
  }
}

function buildLogRow(input: {
  timestamp: number
  logType: FixtureLogType
  level: FixtureLevel
  status: number
  method?: FixtureMethod
  pathname?: string
  message: string
  traceId: string | null
  requestId: string
}): { row: ColumnSchema; raw: OtelLogRow } {
  const id = newRowId()
  const source = LOG_TYPE_TO_SOURCE[input.logType]

  const row: ColumnSchema = {
    id,
    log_type: input.logType,
    method: input.method ?? null,
    pathname: input.pathname ?? null,
    level: input.level,
    status: input.status,
    date: new Date(input.timestamp),
    timestamp: input.timestamp,
    event_message: input.message,
    log_count: null,
    logs: [],
    auth_user: null,
    metadata: null,
    // FDBKIN-36185: top-level, same as the real mapUnifiedLogRow — see
    // UnifiedLogs.schema.ts for why this lives alongside the rest of the row
    // rather than nested under metadata.
    trace_id: input.traceId,
    request_id: input.requestId,
  }

  const raw: OtelLogRow = {
    id,
    timestamp: new Date(input.timestamp).toISOString(),
    source,
    event_message: input.message,
    severity_text: input.level === 'error' ? 'ERROR' : input.level === 'warning' ? 'WARN' : 'INFO',
    log_attributes: buildLogAttributes(input),
  }

  return { row, raw }
}

interface FixtureDataset {
  spans: OtelSpanFixture[]
  rows: ColumnSchema[]
  rawById: Map<string, OtelLogRow>
  // The span a log row attaches to in the Trace tab — kept out of the public
  // row/entry shapes (span_id isn't part of the real log row contract) and
  // tracked here instead, the same way the fixture already knows which span
  // "triggered" each log at generation time.
  spanIdByLogRowId: Map<string, string>
}

function buildDataset(): FixtureDataset {
  const now = Date.now()
  const spans: OtelSpanFixture[] = []
  const rows: ColumnSchema[] = []
  const rawById = new Map<string, OtelLogRow>()
  const spanIdByLogRowId = new Map<string, string>()

  TRACE_BLUEPRINTS.forEach((trace) => {
    const traceId = newTraceId()
    const traceStart = now - trace.minutesAgo * 60_000
    const spanIds = new Map<string, string>()
    const spanWindows = new Map<string, { start: number; end: number }>()
    const requestIds = new Map<string, string>()

    trace.spans.forEach((span) => spanIds.set(span.key, newSpanId()))

    trace.spans.forEach((span) => {
      const start = traceStart + span.startOffsetMs
      const end = start + span.durationMs
      spanWindows.set(span.key, { start, end })
      requestIds.set(span.key, newRequestId())

      const attributes: Record<string, string | number | boolean> = {}
      if (span.httpMethod) attributes['http.method'] = span.httpMethod
      if (span.httpRoute) attributes['http.route'] = span.httpRoute
      if (span.httpStatusCode) attributes['http.status_code'] = span.httpStatusCode

      spans.push({
        trace_id: traceId,
        span_id: spanIds.get(span.key)!,
        parent_span_id: span.parentKey ? (spanIds.get(span.parentKey) ?? null) : null,
        name: span.name,
        kind: span.kind,
        start_time: new Date(start).toISOString(),
        end_time: new Date(end).toISOString(),
        status: {
          code: span.statusCode,
          ...(span.statusMessage ? { message: span.statusMessage } : {}),
        },
        attributes,
        resource: { attributes: { 'service.name': span.service } },
      })
    })

    trace.logs.forEach((log) => {
      const window = spanWindows.get(log.triggeredBySpanKey)
      const requestId = requestIds.get(log.triggeredBySpanKey)
      const spanId = spanIds.get(log.triggeredBySpanKey)
      if (!window || !requestId || !spanId) return

      const timestamp = Math.round(window.start + (window.end - window.start) * log.positionInSpan)
      const { row, raw } = buildLogRow({
        timestamp,
        logType: log.logType,
        level: log.level,
        status: log.status,
        method: log.method,
        pathname: log.pathname,
        message: log.message,
        traceId,
        requestId,
      })
      rows.push(row)
      rawById.set(row.id, raw)
      spanIdByLogRowId.set(row.id, spanId)
    })
  })

  STANDALONE_EVENTS.forEach((event) => {
    const timestamp = now - event.minutesAgo * 60_000
    const { row, raw } = buildLogRow({
      timestamp,
      logType: event.logType,
      level: event.level,
      status: event.status,
      message: event.message,
      traceId: null,
      requestId: newRequestId(),
    })
    rows.push(row)
    rawById.set(row.id, raw)
  })

  rows.sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
  return { spans, rows, rawById, spanIdByLogRowId }
}

// Anchored on globalThis (not a plain module-level variable) so dev-mode Fast
// Refresh — which re-evaluates this module on every edit — reuses the same
// dataset instead of regenerating fresh ids/timestamps on every save.
const GLOBAL_KEY = '__supabaseTracePrototypeDataset__'
const globalWithDataset = globalThis as typeof globalThis & { [GLOBAL_KEY]?: FixtureDataset }

const EMPTY_DATASET: FixtureDataset = {
  spans: [],
  rows: [],
  rawById: new Map(),
  spanIdByLogRowId: new Map(),
}

export function getDataset(): FixtureDataset {
  // Gate here, not just at the query-hook call sites — hasSpansForTrace and
  // getTraceSummary are called unconditionally from row rendering, so a real
  // row with some other trace_id (e.g. a compute log) must never trigger
  // fixture generation when the prototype is off.
  if (!isTracePrototypeEnabledSync()) return EMPTY_DATASET

  if (!globalWithDataset[GLOBAL_KEY]) {
    globalWithDataset[GLOBAL_KEY] = buildDataset()
  }
  return globalWithDataset[GLOBAL_KEY]
}

// ---------------------------------------------------------------------------
// Query-hook-shaped accessors — same return shapes as the real log hooks, so
// the components consuming them can't tell the data is fake.
// ---------------------------------------------------------------------------

// Debug mode only ever governs which *log* rows are visible — it has no
// effect on spans, which arrive over a separate OTLP ingestion path.
function filterRowsForDebugLevel(rows: ColumnSchema[], level: DebugLevel): ColumnSchema[] {
  if (level === 'max') return rows
  return rows.filter((row) => row.level !== 'success')
}

// Mirrors getUnifiedLogsISOStartEnd (unified-logs-infinite-query.ts) without
// importing from it — that file imports from here, so importing back would
// create a cycle. Defaults to the last hour, same as the real query.
function getSearchDateBoundsMs(search: QuerySearchParamsType): { start: number; end: number } {
  if (search.date && search.date.length === 2) {
    const [from, to] = search.date
    return { start: new Date(from).getTime(), end: new Date(to).getTime() }
  }
  const end = Date.now()
  return { start: end - 60 * 60 * 1000, end }
}

const FILTERABLE_COLUMN_VALUES: Record<string, (row: ColumnSchema) => string | null> = {
  log_type: (row) => row.log_type,
  level: (row) => row.level,
  method: (row) => row.method,
  status: (row) => (row.status === null || row.status === undefined ? null : String(row.status)),
  pathname: (row) => row.pathname,
  trace_id: (row) => row.trace_id ?? null,
}

function matchesColumnFilter(value: string | null, filter: LogsColumnFilterValue): boolean {
  if (value === null) return false
  switch (filter.operator) {
    case '=':
      return filter.values.includes(value)
    case '<>':
      return !filter.values.includes(value)
    case '~~*':
      return filter.values.some((v) => value.toLowerCase().includes(v.toLowerCase()))
    case '!~~*':
      return !filter.values.some((v) => value.toLowerCase().includes(v.toLowerCase()))
  }
}

// Applied in place of the real SQL WHERE clause — same inputs (the `search`
// params already threaded through every real query hook), evaluated against
// the in-memory fixture rows instead of ClickHouse.
function filterRowsForSearch(rows: ColumnSchema[], search: QuerySearchParamsType): ColumnSchema[] {
  const { start, end } = getSearchDateBoundsMs(search)
  const grouped = groupLogsFiltersByColumn(parseLogsFilterUrlParams(search.filter))

  return rows.filter((row) => {
    const timestamp = Number(row.timestamp)
    if (timestamp < start || timestamp > end) return false

    return Object.entries(grouped).every(([column, filter]) => {
      const getValue = FILTERABLE_COLUMN_VALUES[column]
      if (!getValue) return true // unsupported column in this prototype — don't exclude on it
      return matchesColumnFilter(getValue(row), filter)
    })
  })
}

// Normalizes ColumnSchema's optional fields to the definite shape
// `mapUnifiedLogRow` produces for the real backend — every consumer
// downstream expects `event_message`/`log_count`/`logs`/`auth_user`/`metadata`
// to always be set, even though the schema itself types them optional.
function toMappedRow(row: ColumnSchema) {
  return {
    id: row.id,
    date: row.date,
    method: row.method,
    pathname: row.pathname,
    status: row.status,
    timestamp: row.timestamp,
    level: row.level,
    event_message: row.event_message ?? '',
    log_type: row.log_type,
    log_count: row.log_count ?? null,
    logs: row.logs ?? [],
    auth_user: row.auth_user || null,
    metadata: row.metadata ?? null,
    trace_id: row.trace_id ?? null,
    request_id: row.request_id ?? null,
  }
}

export function getFixtureLogsPage(level: DebugLevel, search: QuerySearchParamsType) {
  const rows = filterRowsForSearch(filterRowsForDebugLevel(getDataset().rows, level), search)
  return {
    data: rows.map(toMappedRow),
    nextCursor: null,
    prevCursor: Date.now(),
    nextRow: null,
  }
}

const FACET_KEYS = ['log_type', 'level', 'method', 'status', 'pathname'] as const
const FACET_EXTRACTORS: Record<
  (typeof FACET_KEYS)[number],
  (row: ColumnSchema) => string | number | null | undefined
> = {
  log_type: (row) => row.log_type,
  level: (row) => row.level,
  method: (row) => row.method,
  status: (row) => row.status,
  pathname: (row) => row.pathname,
}

export function getFixtureLogsCount(level: DebugLevel, search: QuerySearchParamsType) {
  const rows = filterRowsForSearch(filterRowsForDebugLevel(getDataset().rows, level), search)
  const facets: Record<string, { total: number; rows: { value: string; total: number }[] }> = {}

  FACET_KEYS.forEach((key) => {
    const counts = new Map<string, number>()
    rows.forEach((row) => {
      const value = FACET_EXTRACTORS[key](row)
      if (value === null || value === undefined) return
      counts.set(String(value), (counts.get(String(value)) ?? 0) + 1)
    })
    const facetRows = Array.from(counts.entries())
      .map(([value, total]) => ({ value, total }))
      .sort((a, b) => b.total - a.total)
    facets[key] = { total: facetRows.reduce((sum, r) => sum + r.total, 0), rows: facetRows }
  })

  return { totalRowCount: rows.length, facets }
}

const CHART_BUCKET_MS = 60_000

export function getFixtureLogsChart(level: DebugLevel, search: QuerySearchParamsType) {
  const rows = filterRowsForSearch(filterRowsForDebugLevel(getDataset().rows, level), search)
  const now = Date.now()
  const earliest =
    rows.length > 0 ? Math.min(...rows.map((row) => Number(row.timestamp))) : now - 60 * 60_000
  const startBucket = Math.floor(earliest / CHART_BUCKET_MS) * CHART_BUCKET_MS
  const endBucket = Math.floor(now / CHART_BUCKET_MS) * CHART_BUCKET_MS

  const buckets = new Map<
    number,
    { timestamp: number; success: number; warning: number; error: number }
  >()
  for (let t = startBucket; t <= endBucket; t += CHART_BUCKET_MS) {
    buckets.set(t, { timestamp: t, success: 0, warning: 0, error: 0 })
  }
  rows.forEach((row) => {
    const bucketTs = Math.floor(Number(row.timestamp) / CHART_BUCKET_MS) * CHART_BUCKET_MS
    const bucket = buckets.get(bucketTs)
    if (bucket && row.level) bucket[row.level] += 1
  })

  return Array.from(buckets.values()).sort((a, b) => a.timestamp - b.timestamp)
}

export function getFixtureLogInspection(logId: string | undefined): {
  result: UnifiedLogInspectionEntry[]
} {
  if (!logId) return { result: [] }
  const raw = getDataset().rawById.get(logId)
  if (!raw) return { result: [] }
  return { result: [flattenOtelInspectionRow(raw)] }
}

// ---------------------------------------------------------------------------
// Row-level "does this trace have spans" lookups — phase 2 entry points
// (trace icon, "Open trace", the Trace tab) key off this rather than
// assuming every trace_id has a matching trace, since not every log line
// necessarily will once this is wired to a real OTLP-backed trace.
// ---------------------------------------------------------------------------

export function hasSpansForTrace(traceId: string | null | undefined): boolean {
  if (!traceId) return false
  return getDataset().spans.some((span) => span.trace_id === traceId)
}

export interface TraceSummary {
  spanCount: number
  logCount: number
}

export function getTraceSummary(traceId: string | null | undefined): TraceSummary | null {
  if (!traceId) return null
  const { spans, rows } = getDataset()
  const spanCount = spans.filter((span) => span.trace_id === traceId).length
  if (spanCount === 0) return null
  const logCount = rows.filter((row) => row.trace_id === traceId).length
  return { spanCount, logCount }
}
