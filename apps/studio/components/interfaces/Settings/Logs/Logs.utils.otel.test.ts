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
import { formatSql } from '@/lib/formatSql'

// Format generated SQL so snapshots are deterministic and full strings can be compared.
const fmt = (fragment: string) => formatSql(fragment)

describe('genDefaultQueryOtel', () => {
  it('targets the OTEL logs table by source and aliases postgres columns', () => {
    expect(fmt(genDefaultQueryOtel(LogsTableName.POSTGRES, {}, 100))).toMatchInlineSnapshot(`
      "-- Logs Preview Query (otel) ['postgres_logs']
      select
        id,
        timestamp,
        event_message,
        log_attributes['identifier'] as identifier,
        log_attributes['parsed.error_severity'] as error_severity,
        log_attributes['parsed.detail'] as detail,
        log_attributes['parsed.hint'] as hint
      from
        logs
      where
        source = 'postgres_logs'
      order by
        timestamp desc
      limit
        100"
    `)
  })

  it('aliases edge columns to the leaf names the api renderer reads', () => {
    expect(fmt(genDefaultQueryOtel(LogsTableName.EDGE, {}, 50))).toMatchInlineSnapshot(`
      "-- Logs Preview Query (otel) ['edge_logs']
      select
        id,
        timestamp,
        event_message,
        log_attributes['identifier'] as identifier,
        log_attributes['request.method'] as method,
        log_attributes['request.path'] as path,
        log_attributes['request.search'] as search,
        log_attributes['response.status_code'] as status_code
      from
        logs
      where
        source = 'edge_logs'
      order by
        timestamp desc
      limit
        50"
    `)
  })

  it('maps pg_cron onto postgres_logs with the cron predicate', () => {
    expect(fmt(genDefaultQueryOtel(LogsTableName.PG_CRON, {}))).toMatchInlineSnapshot(`
      "-- Logs Preview Query (otel) ['pg_cron_logs']
      select
        id,
        timestamp,
        event_message,
        log_attributes['parsed.error_severity'] as error_severity,
        log_attributes['parsed.query'] as query
      from
        logs
      where
        source = 'postgres_logs'
        and (
          log_attributes['parsed.application_name'] = 'pg_cron'
          or event_message ilike '%cron job%'
        )
      order by
        timestamp desc
      limit
        100"
    `)
  })

  it('selects only id/timestamp/event_message for tables without a column map', () => {
    expect(fmt(genDefaultQueryOtel(LogsTableName.MULTIGRES, {}))).toMatchInlineSnapshot(`
      "-- Logs Preview Query (otel) ['multigres_logs']
      select
        id,
        timestamp,
        event_message
      from
        logs
      where
        source = 'multigres_logs'
      order by
        timestamp desc
      limit
        100"
    `)
  })

  it('translates an edge status_code filter to a ClickHouse predicate', () => {
    expect(fmt(genDefaultQueryOtel(LogsTableName.EDGE, { status_code: { error: true } })))
      .toMatchInlineSnapshot(`
      "-- Logs Preview Query (otel) ['edge_logs']
      select
        id,
        timestamp,
        event_message,
        log_attributes['identifier'] as identifier,
        log_attributes['request.method'] as method,
        log_attributes['request.path'] as path,
        log_attributes['request.search'] as search,
        log_attributes['response.status_code'] as status_code
      from
        logs
      where
        source = 'edge_logs'
        and (
          toInt32OrZero (log_attributes['response.status_code']) between 500 and 599
        )
      order by
        timestamp desc
      limit
        100"
    `)
  })

  it('translates a search_query filter to a case-insensitive event_message match', () => {
    expect(fmt(genDefaultQueryOtel(LogsTableName.POSTGRES, { search_query: 'deadlock' })))
      .toMatchInlineSnapshot(`
      "-- Logs Preview Query (otel) ['postgres_logs']
      select
        id,
        timestamp,
        event_message,
        log_attributes['identifier'] as identifier,
        log_attributes['parsed.error_severity'] as error_severity,
        log_attributes['parsed.detail'] as detail,
        log_attributes['parsed.hint'] as hint
      from
        logs
      where
        source = 'postgres_logs'
        and (event_message ilike '%deadlock%')
      order by
        timestamp desc
      limit
        100"
    `)
  })

  it('uses the shared auth severity condition for the severity.error filter', () => {
    expect(fmt(genDefaultQueryOtel(LogsTableName.AUTH, { severity: { error: true } })))
      .toMatchInlineSnapshot(`
      "-- Logs Preview Query (otel) ['auth_logs']
      select
        id,
        timestamp,
        event_message,
        log_attributes['level'] as level,
        log_attributes['status'] as status,
        log_attributes['path'] as path,
        log_attributes['msg'] as msg,
        log_attributes['error'] as error
      from
        logs
      where
        source = 'auth_logs'
        and (
          log_attributes['level'] in ('error', 'fatal')
          or toInt32OrZero (log_attributes['status']) >= 500
        )
      order by
        timestamp desc
      limit
        100"
    `)
  })

  it('falls back to a log_attributes equality for unknown filter keys', () => {
    expect(fmt(genDefaultQueryOtel(LogsTableName.AUTH, { trace_id: 'abc-123' })))
      .toMatchInlineSnapshot(`
      "-- Logs Preview Query (otel) ['auth_logs']
      select
        id,
        timestamp,
        event_message,
        log_attributes['level'] as level,
        log_attributes['status'] as status,
        log_attributes['path'] as path,
        log_attributes['msg'] as msg,
        log_attributes['error'] as error
      from
        logs
      where
        source = 'auth_logs'
        and (log_attributes['trace_id'] = 'abc-123')
      order by
        timestamp desc
      limit
        100"
    `)
  })

  it('combines multiple filters with AND alongside the source predicate', () => {
    expect(
      fmt(
        genDefaultQueryOtel(LogsTableName.EDGE, {
          status_code: { error: true },
          method: { get: true },
        })
      )
    ).toMatchInlineSnapshot(`
      "-- Logs Preview Query (otel) ['edge_logs']
      select
        id,
        timestamp,
        event_message,
        log_attributes['identifier'] as identifier,
        log_attributes['request.method'] as method,
        log_attributes['request.path'] as path,
        log_attributes['request.search'] as search,
        log_attributes['response.status_code'] as status_code
      from
        logs
      where
        source = 'edge_logs'
        and (
          toInt32OrZero (log_attributes['response.status_code']) between 500 and 599
        )
        and (log_attributes['request.method'] = 'GET')
      order by
        timestamp desc
      limit
        100"
    `)
  })
})

describe('genCountQueryOtel', () => {
  it('counts rows for the source with translated auth filters', () => {
    expect(fmt(genCountQueryOtel(LogsTableName.AUTH, { status_code: { server_error: true } })))
      .toMatchInlineSnapshot(`
      "-- Logs Count Query (otel) ['auth_logs']
      select
        count() as count
      from
        logs
      where
        source = 'auth_logs'
        and (
          toInt32OrZero (log_attributes['status']) between 500 and 599
        )"
    `)
  })
})

describe('genChartQueryOtel', () => {
  const params = {
    iso_timestamp_start: '2024-01-01T00:00:00.000Z',
    iso_timestamp_end: '2024-01-01T00:30:00.000Z',
  }

  it('buckets by minute for short ranges and emits ok/error/warning counts', () => {
    expect(fmt(genChartQueryOtel(LogsTableName.EDGE, params, {}))).toMatchInlineSnapshot(`
      "-- Logs Chart Query (otel) ['edge_logs']
      select
        toStartOfMinute (timestamp) as timestamp,
        countIf (
          not (
            (
              toInt32OrZero (log_attributes['response.status_code']) >= 500
            )
            or (
              toInt32OrZero (log_attributes['response.status_code']) between 400 and 499
            )
          )
        ) as ok_count,
        countIf (
          toInt32OrZero (log_attributes['response.status_code']) >= 500
        ) as error_count,
        countIf (
          toInt32OrZero (log_attributes['response.status_code']) between 400 and 499
        ) as warning_count
      from
        logs
      where
        source = 'edge_logs'
      group by
        timestamp
      order by
        timestamp asc"
    `)
  })

  it('buckets by hour for ranges longer than 12 hours', () => {
    expect(
      fmt(
        genChartQueryOtel(
          LogsTableName.POSTGRES,
          {
            iso_timestamp_start: '2024-01-01T00:00:00.000Z',
            iso_timestamp_end: '2024-01-02T00:00:00.000Z',
          },
          {}
        )
      )
    ).toMatchInlineSnapshot(`
      "-- Logs Chart Query (otel) ['postgres_logs']
      select
        toStartOfHour (timestamp) as timestamp,
        countIf (
          not (
            (
              log_attributes['parsed.error_severity'] in ('ERROR', 'FATAL', 'PANIC')
            )
            or (
              log_attributes['parsed.error_severity'] = 'WARNING'
            )
          )
        ) as ok_count,
        countIf (
          log_attributes['parsed.error_severity'] in ('ERROR', 'FATAL', 'PANIC')
        ) as error_count,
        countIf (
          log_attributes['parsed.error_severity'] = 'WARNING'
        ) as warning_count
      from
        logs
      where
        source = 'postgres_logs'
      group by
        timestamp
      order by
        timestamp asc"
    `)
  })

  it('classifies auth severity by level and status, matching the BigQuery conditions', () => {
    expect(fmt(genChartQueryOtel(LogsTableName.AUTH, params, {}))).toMatchInlineSnapshot(`
      "-- Logs Chart Query (otel) ['auth_logs']
      select
        toStartOfMinute (timestamp) as timestamp,
        countIf (
          not (
            (
              log_attributes['level'] in ('error', 'fatal')
              or toInt32OrZero (log_attributes['status']) >= 500
            )
            or (
              log_attributes['level'] = 'warning'
              or toInt32OrZero (log_attributes['status']) between 400 and 499
            )
          )
        ) as ok_count,
        countIf (
          log_attributes['level'] in ('error', 'fatal')
          or toInt32OrZero (log_attributes['status']) >= 500
        ) as error_count,
        countIf (
          log_attributes['level'] = 'warning'
          or toInt32OrZero (log_attributes['status']) between 400 and 499
        ) as warning_count
      from
        logs
      where
        source = 'auth_logs'
      group by
        timestamp
      order by
        timestamp asc"
    `)
  })

  it('uses JSONExtractString for multigres severity (event_message is a JSON string)', () => {
    expect(fmt(genChartQueryOtel(LogsTableName.MULTIGRES, params, {}))).toMatchInlineSnapshot(`
      "-- Logs Chart Query (otel) ['multigres_logs']
      select
        toStartOfMinute (timestamp) as timestamp,
        countIf (
          not (
            (
              JSONExtractString (event_message, 'level') in ('ERROR', 'FATAL', 'PANIC')
            )
            or (
              JSONExtractString (event_message, 'level') in ('WARN', 'WARNING')
            )
          )
        ) as ok_count,
        countIf (
          JSONExtractString (event_message, 'level') in ('ERROR', 'FATAL', 'PANIC')
        ) as error_count,
        countIf (
          JSONExtractString (event_message, 'level') in ('WARN', 'WARNING')
        ) as warning_count
      from
        logs
      where
        source = 'multigres_logs'
      group by
        timestamp
      order by
        timestamp asc"
    `)
  })

  it('counts pg_cron errors but never warnings, matching BigQuery (no pg_cron warning case)', () => {
    expect(fmt(genChartQueryOtel(LogsTableName.PG_CRON, params, {}))).toMatchInlineSnapshot(`
      "-- Logs Chart Query (otel) ['pg_cron_logs']
      select
        toStartOfMinute (timestamp) as timestamp,
        countIf (
          not (
            (
              log_attributes['parsed.error_severity'] in ('ERROR', 'FATAL', 'PANIC')
            )
            or (0)
          )
        ) as ok_count,
        countIf (
          log_attributes['parsed.error_severity'] in ('ERROR', 'FATAL', 'PANIC')
        ) as error_count,
        countIf (0) as warning_count
      from
        logs
      where
        source = 'postgres_logs'
        and (
          log_attributes['parsed.application_name'] = 'pg_cron'
          or event_message ilike '%cron job%'
        )
      group by
        timestamp
      order by
        timestamp asc"
    `)
  })

  it('emits constant-false severity for tables without a severity concept', () => {
    expect(fmt(genChartQueryOtel(LogsTableName.STORAGE, params, {}))).toMatchInlineSnapshot(`
      "-- Logs Chart Query (otel) ['storage_logs']
      select
        toStartOfMinute (timestamp) as timestamp,
        countIf (
          not (
            (0)
            or (0)
          )
        ) as ok_count,
        countIf (0) as error_count,
        countIf (0) as warning_count
      from
        logs
      where
        source = 'storage_logs'
      group by
        timestamp
      order by
        timestamp asc"
    `)
  })

  it('defaults the chart bucket to minute when no time range is given', () => {
    expect(fmt(genChartQueryOtel(LogsTableName.EDGE, {}, {}))).toMatchInlineSnapshot(`
      "-- Logs Chart Query (otel) ['edge_logs']
      select
        toStartOfMinute (timestamp) as timestamp,
        countIf (
          not (
            (
              toInt32OrZero (log_attributes['response.status_code']) >= 500
            )
            or (
              toInt32OrZero (log_attributes['response.status_code']) between 400 and 499
            )
          )
        ) as ok_count,
        countIf (
          toInt32OrZero (log_attributes['response.status_code']) >= 500
        ) as error_count,
        countIf (
          toInt32OrZero (log_attributes['response.status_code']) between 400 and 499
        ) as warning_count
      from
        logs
      where
        source = 'edge_logs'
      group by
        timestamp
      order by
        timestamp asc"
    `)
  })
})

describe('genSingleLogQueryOtel', () => {
  it('fetches a single row by id with raw attributes', () => {
    expect(fmt(genSingleLogQueryOtel('123e4567-e89b-12d3-a456-426614174000')))
      .toMatchInlineSnapshot(`
      "-- Single Log Query (otel)
      select
        id,
        timestamp,
        event_message,
        source,
        severity_text,
        log_attributes
      from
        logs
      where
        id = '123e4567-e89b-12d3-a456-426614174000'
      limit
        1"
    `)
  })

  it('rejects a non-uuid id', () => {
    expect(() => genSingleLogQueryOtel("1' OR '1'='1")).toThrow('Invalid logId')
  })
})

describe('OTEL filter translation', () => {
  it('translates the database filter for postgres', () => {
    expect(fmt(genDefaultQueryOtel(LogsTableName.POSTGRES, { database: 'replica-1' })))
      .toMatchInlineSnapshot(`
      "-- Logs Preview Query (otel) ['postgres_logs']
      select
        id,
        timestamp,
        event_message,
        log_attributes['identifier'] as identifier,
        log_attributes['parsed.error_severity'] as error_severity,
        log_attributes['parsed.detail'] as detail,
        log_attributes['parsed.hint'] as hint
      from
        logs
      where
        source = 'postgres_logs'
        and (log_attributes['identifier'] = 'replica-1')
      order by
        timestamp desc
      limit
        100"
    `)
  })

  it('translates the database filter for supavisor', () => {
    expect(fmt(genDefaultQueryOtel(LogsTableName.SUPAVISOR, { database: 'proj' })))
      .toMatchInlineSnapshot(`
      "-- Logs Preview Query (otel) ['supavisor_logs']
      select
        id,
        timestamp,
        event_message
      from
        logs
      where
        source = 'supavisor_logs'
        and (log_attributes['project'] like 'proj%')
      order by
        timestamp desc
      limit
        100"
    `)
  })

  it('translates the etl pipeline_id filter', () => {
    expect(fmt(genDefaultQueryOtel(LogsTableName.ETL, { pipeline_id: '42' })))
      .toMatchInlineSnapshot(`
      "-- Logs Preview Query (otel) ['etl_replication_logs']
      select
        id,
        timestamp,
        event_message
      from
        logs
      where
        source = 'etl_replication_logs'
        and (log_attributes['pipeline_id'] = '42')
      order by
        timestamp desc
      limit
        100"
    `)
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

  it('returns a safe empty row for an invalid (non-object) input', () => {
    const log = mapOtelSingleLogToLegacy(undefined) as any
    expect(log.id).toBe('')
    expect(log.metadata).toBeUndefined()
  })

  it('fills api metadata with null when attributes are missing', () => {
    const log = mapOtelSingleLogToLegacy({ log_attributes: {} }, 'api') as any
    expect(log.metadata[0].request[0].method).toBeNull()
    expect(log.metadata[0].response[0].status_code).toBeNull()
    expect(log.metadata[0].response[0].headers[0].x_sb_error_code).toBeNull()
  })

  it('falls back to the legacy x_sb_error_code key for api rows', () => {
    const log = mapOtelSingleLogToLegacy(
      { log_attributes: { 'response.headers.x_sb_error_code': 'pgrst' } },
      'api'
    ) as any
    expect(log.metadata[0].response[0].headers[0].x_sb_error_code).toBe('pgrst')
  })

  it('fills database metadata with null when attributes are missing', () => {
    const log = mapOtelSingleLogToLegacy({ log_attributes: {} }, 'database') as any
    expect(log.metadata[0].parsed[0].hint).toBeNull()
    expect(log.metadata[0].parsed[0].detail).toBeNull()
    expect(log.metadata[0].parsed[0].query).toBeNull()
  })
})
