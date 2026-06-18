import { describe, expect, it } from 'vitest'

import { LogsTableName } from './Logs.constants'
import {
  genChartQueryOtel,
  genCountQueryOtel,
  genDefaultQueryOtel,
  genSingleLogQueryOtel,
  mapOtelPreviewRow,
  mapOtelSingleLogToLegacy,
  otelTimestampToMicros,
} from './Logs.utils.otel'
import type { OtelLogRow } from '@/data/logs/otel-inspection.utils'

// Collapse whitespace so assertions are resilient to formatting/newlines.
const sql = (fragment: string) => fragment.replace(/\s+/g, ' ').trim()

describe('genDefaultQueryOtel', () => {
  it('targets the OTEL logs table by source and aliases postgres columns', () => {
    const q = sql(genDefaultQueryOtel(LogsTableName.POSTGRES, {}, 100))
    expect(q).toContain('-- Logs Preview Query (otel)')
    expect(q).toContain('FROM logs')
    expect(q).toContain("source = 'postgres_logs'")
    expect(q).toContain("log_attributes['parsed.error_severity'] AS error_severity")
    expect(q).toContain("log_attributes['parsed.detail'] AS detail")
    expect(q).toContain("log_attributes['parsed.hint'] AS hint")
    expect(q).toContain('ORDER BY timestamp DESC')
    expect(q).toContain('LIMIT 100')
  })

  it('aliases edge columns to the leaf names the api renderer reads', () => {
    const q = sql(genDefaultQueryOtel(LogsTableName.EDGE, {}, 50))
    expect(q).toContain("source = 'edge_logs'")
    expect(q).toContain("log_attributes['request.method'] AS method")
    expect(q).toContain("log_attributes['request.path'] AS path")
    expect(q).toContain("log_attributes['response.status_code'] AS status_code")
    expect(q).toContain('LIMIT 50')
  })

  it('maps pg_cron onto postgres_logs with the cron predicate', () => {
    const q = sql(genDefaultQueryOtel(LogsTableName.PG_CRON, {}))
    expect(q).toContain("source = 'postgres_logs'")
    expect(q).toContain("log_attributes['parsed.application_name'] = 'pg_cron'")
    expect(q).toContain("event_message ILIKE '%cron job%'")
  })

  it('selects only id/timestamp/event_message for tables without a column map', () => {
    const q = sql(genDefaultQueryOtel(LogsTableName.MULTIGRES, {}))
    expect(q).toContain("source = 'multigres_logs'")
    expect(q).toContain('SELECT id, timestamp, event_message FROM logs')
  })

  it('translates an edge status_code filter to a ClickHouse predicate', () => {
    const q = sql(genDefaultQueryOtel(LogsTableName.EDGE, { status_code: { error: true } }))
    expect(q).toContain("toInt32OrZero(log_attributes['response.status_code']) BETWEEN 500 AND 599")
  })

  it('translates a search_query filter to a case-insensitive event_message match', () => {
    const q = sql(genDefaultQueryOtel(LogsTableName.POSTGRES, { search_query: 'deadlock' }))
    expect(q).toContain("event_message ILIKE '%deadlock%'")
  })

  it('uses the shared auth severity condition for the severity.error filter', () => {
    const q = sql(genDefaultQueryOtel(LogsTableName.AUTH, { severity: { error: true } }))
    expect(q).toContain(
      "log_attributes['level'] IN ('error', 'fatal') OR toInt32OrZero(log_attributes['status']) >= 500"
    )
  })

  it('falls back to a log_attributes equality for unknown filter keys', () => {
    const q = sql(genDefaultQueryOtel(LogsTableName.AUTH, { trace_id: 'abc-123' }))
    expect(q).toContain("log_attributes['trace_id'] = 'abc-123'")
  })

  it('combines multiple filters with AND alongside the source predicate', () => {
    const q = sql(
      genDefaultQueryOtel(LogsTableName.EDGE, {
        status_code: { error: true },
        method: { get: true },
      })
    )
    expect(q).toContain("source = 'edge_logs'")
    expect(q).toContain("toInt32OrZero(log_attributes['response.status_code']) BETWEEN 500 AND 599")
    expect(q).toContain("log_attributes['request.method'] = 'GET'")
    expect(q.match(/ AND /g)?.length).toBeGreaterThanOrEqual(2)
  })
})

describe('genCountQueryOtel', () => {
  it('counts rows for the source with translated auth filters', () => {
    const q = sql(genCountQueryOtel(LogsTableName.AUTH, { status_code: { server_error: true } }))
    expect(q).toContain('-- Logs Count Query (otel)')
    expect(q).toContain('SELECT count() AS count FROM logs')
    expect(q).toContain("source = 'auth_logs'")
    expect(q).toContain("toInt32OrZero(log_attributes['status']) BETWEEN 500 AND 599")
  })
})

describe('genChartQueryOtel', () => {
  const params = {
    iso_timestamp_start: '2024-01-01T00:00:00.000Z',
    iso_timestamp_end: '2024-01-01T00:30:00.000Z',
  }

  it('buckets by minute for short ranges and emits ok/error/warning counts', () => {
    const q = sql(genChartQueryOtel(LogsTableName.EDGE, params, {}))
    expect(q).toContain('-- Logs Chart Query (otel)')
    expect(q).toContain('toStartOfMinute(timestamp) AS timestamp')
    expect(q).toContain('AS ok_count')
    expect(q).toContain('AS error_count')
    expect(q).toContain('AS warning_count')
    expect(q).toContain('countIf(')
    expect(q).toContain('GROUP BY timestamp')
  })

  it('buckets by hour for ranges longer than 12 hours', () => {
    const q = sql(
      genChartQueryOtel(
        LogsTableName.POSTGRES,
        {
          iso_timestamp_start: '2024-01-01T00:00:00.000Z',
          iso_timestamp_end: '2024-01-02T00:00:00.000Z',
        },
        {}
      )
    )
    expect(q).toContain('toStartOfHour(timestamp) AS timestamp')
  })

  it('classifies auth severity by level and status, matching the BigQuery conditions', () => {
    const q = sql(genChartQueryOtel(LogsTableName.AUTH, params, {}))
    expect(q).toContain(
      "log_attributes['level'] IN ('error', 'fatal') OR toInt32OrZero(log_attributes['status']) >= 500"
    )
    expect(q).toContain(
      "log_attributes['level'] = 'warning' OR toInt32OrZero(log_attributes['status']) BETWEEN 400 AND 499"
    )
  })

  it('uses JSONExtractString for multigres severity (event_message is a JSON string)', () => {
    const q = sql(genChartQueryOtel(LogsTableName.MULTIGRES, params, {}))
    expect(q).toContain("JSONExtractString(event_message, 'level') IN ('ERROR', 'FATAL', 'PANIC')")
  })

  it('emits constant-false severity for tables without a severity concept', () => {
    const q = sql(genChartQueryOtel(LogsTableName.STORAGE, params, {}))
    expect(q).toContain("source = 'storage_logs'")
    // No error/warning predicate, so every row counts as ok.
    expect(q).toContain('countIf(NOT ((0) OR (0))) AS ok_count')
    expect(q).toContain('countIf(0) AS error_count')
  })
})

describe('genSingleLogQueryOtel', () => {
  it('fetches a single row by id with raw attributes', () => {
    const q = sql(genSingleLogQueryOtel('123e4567-e89b-12d3-a456-426614174000'))
    expect(q).toContain('-- Single Log Query (otel)')
    expect(q).toContain('FROM logs')
    expect(q).toContain("WHERE id = '123e4567-e89b-12d3-a456-426614174000'")
    expect(q).toContain('log_attributes')
    expect(q).toContain('LIMIT 1')
  })

  it('rejects a non-uuid id', () => {
    expect(() => genSingleLogQueryOtel("1' OR '1'='1")).toThrow('Invalid logId')
  })
})

describe('otelTimestampToMicros', () => {
  it('converts an ISO string to microseconds since epoch', () => {
    const micros = otelTimestampToMicros('2024-01-01T00:00:00.000Z')
    expect(micros).toBe(Date.UTC(2024, 0, 1) * 1000)
  })

  it('parses a space-separated ClickHouse datetime as UTC', () => {
    const micros = otelTimestampToMicros('2024-01-01 00:00:00')
    expect(micros).toBe(Date.UTC(2024, 0, 1) * 1000)
  })

  it('passes through numeric microseconds', () => {
    const micros = otelTimestampToMicros(1704067200000000)
    expect(micros).toBe(1704067200000000)
  })

  it('parses numeric microseconds supplied as a string', () => {
    const micros = otelTimestampToMicros('1704067200000000')
    expect(micros).toBe(1704067200000000)
  })
})

describe('mapOtelPreviewRow', () => {
  it('normalizes the timestamp to a microsecond number and keeps other columns', () => {
    const row = mapOtelPreviewRow({
      id: 'abc',
      timestamp: '2024-01-01T00:00:00.000Z',
      event_message: 'hello',
      status_code: '200',
    })
    expect(row.timestamp).toBe(Date.UTC(2024, 0, 1) * 1000)
    expect(row.event_message).toBe('hello')
    expect((row as any).status_code).toBe('200')
  })
})

describe('mapOtelSingleLogToLegacy', () => {
  const baseRow: OtelLogRow = {
    id: 'log-1',
    timestamp: '2024-01-01T00:00:00.000Z',
    source: 'edge_logs',
    event_message: 'GET /rest/v1/foo',
    log_attributes: {
      'request.method': 'GET',
      'request.path': '/rest/v1/foo',
      'request.search': '?select=*',
      'request.headers.user_agent': 'curl/8',
      'response.status_code': '200',
      // Real OTEL gateway key is `sb_error_code` (BigQuery used `x_sb_error_code`).
      'response.headers.sb_error_code': 'none',
    },
  }

  it('reconstructs the nested metadata shape the api panel reads', () => {
    const log = mapOtelSingleLogToLegacy(baseRow, 'api') as any
    expect(log.metadata[0].request[0].method).toBe('GET')
    expect(log.metadata[0].request[0].path).toBe('/rest/v1/foo')
    expect(log.metadata[0].request[0].search).toBe('?select=*')
    expect(log.metadata[0].request[0].headers[0].user_agent).toBe('curl/8')
    expect(log.metadata[0].response[0].status_code).toBe('200')
    expect(log.metadata[0].response[0].headers[0].x_sb_error_code).toBe('none')
    expect(log.timestamp).toBe(Date.UTC(2024, 0, 1) * 1000)
  })

  it('falls back to the legacy x_sb_error_code key when the OTEL key is absent', () => {
    const row: OtelLogRow = {
      ...baseRow,
      log_attributes: {
        'request.method': 'GET',
        'response.status_code': '500',
        // Only the legacy BigQuery-style key is present.
        'response.headers.x_sb_error_code': 'pgrst_error',
      },
    }
    const log = mapOtelSingleLogToLegacy(row, 'api') as any
    expect(log.metadata[0].response[0].headers[0].x_sb_error_code).toBe('pgrst_error')
  })

  it('reconstructs the nested parsed metadata for the database panel', () => {
    const row: OtelLogRow = {
      id: 'log-2',
      timestamp: '2024-01-01T00:00:00.000Z',
      source: 'postgres_logs',
      event_message: 'ERROR: deadlock detected',
      log_attributes: {
        'parsed.hint': 'retry',
        'parsed.detail': 'process 1 waits',
        'parsed.query': 'UPDATE foo',
      },
    }
    const log = mapOtelSingleLogToLegacy(row, 'database') as any
    expect(log.metadata[0].parsed[0].hint).toBe('retry')
    expect(log.metadata[0].parsed[0].detail).toBe('process 1 waits')
    expect(log.metadata[0].parsed[0].query).toBe('UPDATE foo')
  })

  it('returns a flat row with spread attributes for other query types', () => {
    const row: OtelLogRow = {
      id: 'log-3',
      timestamp: '2024-01-01T00:00:00.000Z',
      source: 'storage_logs',
      event_message: 'object uploaded',
      log_attributes: { level: 'info' },
    }
    const log = mapOtelSingleLogToLegacy(row, 'storage') as any
    expect(log.metadata).toBeUndefined()
    expect(log.level).toBe('info')
    expect(log.event_message).toBe('object uploaded')
  })
})
