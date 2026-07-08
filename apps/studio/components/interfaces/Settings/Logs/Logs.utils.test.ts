import { describe, expect, test } from 'vitest'

import { LogsTableName } from './Logs.constants'
import type { Filters, LogData } from './Logs.types'
import {
  buildLogsPrompt,
  checkForLimitClause,
  ensureNoTimestampConflict,
  extractEdgeFunctionName,
  formatLogsAsCsv,
  formatLogsAsJson,
  formatLogsAsMarkdown,
  genChartQuery,
  genDefaultQuery,
  getAuthLogSeverity,
  parseMultigresEventMessage,
} from './Logs.utils'

const createLog = (overrides: Partial<LogData> = {}): LogData => ({
  id: 'test-id',
  timestamp: 1621323232312,
  event_message: 'test message',
  ...overrides,
})

describe('Logs.utils', () => {
  describe('formatLogsAsJson', () => {
    test('formats single log as JSON', () => {
      const rows: LogData[] = [createLog({ id: '1', event_message: 'test message' })]
      const result = formatLogsAsJson(rows)
      expect(result).toContain('"id": "1"')
      expect(result).toContain('"event_message": "test message"')
    })

    test('formats multiple logs as JSON array', () => {
      const rows: LogData[] = [
        createLog({ id: '1', event_message: 'first' }),
        createLog({ id: '2', event_message: 'second' }),
      ]
      const result = formatLogsAsJson(rows)
      expect(result).toContain('"id": "1"')
      expect(result).toContain('"id": "2"')
    })
  })

  describe('formatLogsAsCsv', () => {
    test('returns empty string for empty list', () => {
      expect(formatLogsAsCsv([])).toBe('')
    })

    test('formats single row with header line', () => {
      const rows: LogData[] = [createLog({ id: '1', event_message: 'hello' })]
      const result = formatLogsAsCsv(rows)
      const [header, row] = result.split('\r\n')
      expect(header.split(',').sort()).toEqual(['event_message', 'id', 'timestamp'].sort())
      expect(row).toContain('1')
      expect(row).toContain('hello')
    })

    test('formats multiple rows', () => {
      const rows: LogData[] = [
        createLog({ id: '1', event_message: 'first' }),
        createLog({ id: '2', event_message: 'second' }),
      ]
      const lines = formatLogsAsCsv(rows).split('\r\n')
      expect(lines).toHaveLength(3)
      expect(lines[1]).toContain('first')
      expect(lines[2]).toContain('second')
    })

    test('escapes commas, quotes, and newlines per RFC 4180', () => {
      const rows: LogData[] = [
        createLog({
          id: 'a,b',
          event_message: 'line1\nline2',
        }),
        createLog({
          id: 'c"d',
          event_message: 'has "quotes"',
        }),
      ]
      const result = formatLogsAsCsv(rows)
      expect(result).toContain('"a,b"')
      expect(result).toContain('"line1\nline2"')
      expect(result).toContain('"c""d"')
      expect(result).toContain('"has ""quotes"""')
    })

    test('emits columns based on the first row', () => {
      const rows: LogData[] = [
        { id: '1', event_message: 'first', timestamp: 1 },
        // Extra `status` key on later rows is dropped because headers
        // come from the first row.
        { id: '2', event_message: 'second', timestamp: 2, status: '500' } as LogData,
      ]
      const result = formatLogsAsCsv(rows)
      expect(result).not.toContain('500')
      expect(result.split('\r\n')[0]).toBe('id,event_message,timestamp')
    })

    test('renders null as the string "null" and undefined as empty', () => {
      const rows: LogData[] = [
        { id: '1', event_message: null as unknown as string, timestamp: undefined as any },
      ]
      const result = formatLogsAsCsv(rows)
      const dataRow = result.split('\r\n')[1]
      // Order matches first-row keys: id, event_message, timestamp
      expect(dataRow).toBe('1,null,')
    })
  })

  describe('formatLogsAsMarkdown', () => {
    test('formats single log with timestamp', () => {
      const rows: LogData[] = [
        createLog({
          id: '123',
          timestamp: 1621323232312,
          event_message: 'Test error',
          status: '500',
        }),
      ]
      const result = formatLogsAsMarkdown(rows)
      expect(result).toContain('## Log 1')
      expect(result).toContain('**Timestamp:**')
      expect(result).toContain('**Message:** Test error')
      expect(result).toContain('**Details:**')
    })

    test('formats multiple logs with separators', () => {
      const rows: LogData[] = [
        createLog({ id: '1', event_message: 'first error' }),
        createLog({ id: '2', event_message: 'second error' }),
      ]
      const result = formatLogsAsMarkdown(rows)
      expect(result).toContain('## Log 1')
      expect(result).toContain('## Log 2')
      expect(result).toContain('---')
    })
  })

  describe('buildLogsPrompt', () => {
    test('builds prompt with single log', () => {
      const rows: LogData[] = [createLog({ id: '1', event_message: 'error occurred' })]
      const result = buildLogsPrompt(rows)
      expect(result).toContain('1 Supabase log entry')
      expect(result).toContain('error occurred')
      expect(result).toContain('What do these logs indicate')
    })

    test('builds prompt with multiple logs', () => {
      const rows: LogData[] = [
        createLog({ id: '1', event_message: 'error 1' }),
        createLog({ id: '2', event_message: 'error 2' }),
      ]
      const result = buildLogsPrompt(rows)
      expect(result).toContain('2 Supabase log entries')
    })

    test('handles singular correctly', () => {
      const rows: LogData[] = [createLog({ id: '1', event_message: 'single error' })]
      const result = buildLogsPrompt(rows)
      expect(result).toContain('1 Supabase log entry')
    })
  })

  describe('extractEdgeFunctionName', () => {
    test('extracts function name from full pathname', () => {
      expect(extractEdgeFunctionName('/functions/v1/hello-world-1')).toBe('hello-world-1')
    })

    test('returns empty string for null', () => {
      expect(extractEdgeFunctionName(null)).toBe('')
    })

    test('returns empty string for undefined', () => {
      expect(extractEdgeFunctionName(undefined)).toBe('')
    })

    test('returns empty string for non-string values', () => {
      expect(extractEdgeFunctionName(42)).toBe('')
      expect(extractEdgeFunctionName({})).toBe('')
    })

    test('handles pathname with no slashes', () => {
      expect(extractEdgeFunctionName('my-function')).toBe('my-function')
    })

    test('handles trailing slash', () => {
      expect(extractEdgeFunctionName('/functions/v1/hello-world-1/')).toBe('hello-world-1')
    })
  })

  describe('parseMultigresEventMessage', () => {
    test('parses a JSON object event_message into a plain object', () => {
      const eventMessage = JSON.stringify({
        time: '2026-06-02T15:44:52.84043038Z',
        level: 'ERROR',
        msg: 'Failed to write heartbeat',
        error: 'context deadline exceeded',
      })
      expect(parseMultigresEventMessage(eventMessage)).toEqual({
        time: '2026-06-02T15:44:52.84043038Z',
        level: 'ERROR',
        msg: 'Failed to write heartbeat',
        error: 'context deadline exceeded',
      })
    })

    test('returns null when event_message is not valid JSON', () => {
      expect(parseMultigresEventMessage('connection closed')).toBeNull()
    })

    test('returns null when event_message parses to an array', () => {
      expect(parseMultigresEventMessage('[1, 2, 3]')).toBeNull()
    })

    test('returns null when event_message parses to a primitive', () => {
      expect(parseMultigresEventMessage('42')).toBeNull()
      expect(parseMultigresEventMessage('"a string"')).toBeNull()
    })

    test('returns null for non-string input', () => {
      expect(parseMultigresEventMessage(undefined)).toBeNull()
      expect(parseMultigresEventMessage(null)).toBeNull()
      expect(parseMultigresEventMessage(42)).toBeNull()
    })
  })

  describe('getAuthLogSeverity', () => {
    test('reports server errors (5xx) as error', () => {
      expect(getAuthLogSeverity('info', 500)).toBe('error')
      expect(getAuthLogSeverity('info', 503)).toBe('error')
    })

    test('reports client errors (4xx) as warning', () => {
      expect(getAuthLogSeverity('info', 400)).toBe('warning')
      expect(getAuthLogSeverity('info', 401)).toBe('warning')
      expect(getAuthLogSeverity('info', 429)).toBe('warning')
      expect(getAuthLogSeverity('info', 499)).toBe('warning')
    })

    test('handles status passed as a string', () => {
      expect(getAuthLogSeverity('info', '500')).toBe('error')
      expect(getAuthLogSeverity('info', '404')).toBe('warning')
      expect(getAuthLogSeverity('info', '200')).toBe('info')
    })

    test('preserves the original level for non-error statuses', () => {
      expect(getAuthLogSeverity('info', 200)).toBe('info')
      expect(getAuthLogSeverity('info', 302)).toBe('info')
      expect(getAuthLogSeverity('info', 399)).toBe('info')
    })

    test('falls back to the level when status is missing or invalid', () => {
      expect(getAuthLogSeverity('info')).toBe('info')
      expect(getAuthLogSeverity('warning', null)).toBe('warning')
      expect(getAuthLogSeverity('info', 'not-a-number')).toBe('info')
    })

    test('keeps explicit error levels even with a non-error status', () => {
      expect(getAuthLogSeverity('error')).toBe('error')
      expect(getAuthLogSeverity('fatal')).toBe('fatal')
      expect(getAuthLogSeverity('error', 200)).toBe('error')
      expect(getAuthLogSeverity('fatal', 404)).toBe('fatal')
    })

    test('returns an empty string when level is missing', () => {
      expect(getAuthLogSeverity()).toBe('')
      expect(getAuthLogSeverity(null, 200)).toBe('')
    })

    test('ignores non-string levels and non-numeric statuses', () => {
      expect(getAuthLogSeverity({}, {})).toBe('')
      expect(getAuthLogSeverity(42, 500)).toBe('error')
      expect(getAuthLogSeverity('info', {})).toBe('info')
      expect(getAuthLogSeverity('info', [500])).toBe('info')
    })
  })

  describe('auth_logs severity filter query', () => {
    const queryFor = (severity: Filters['severity']) =>
      genDefaultQuery(LogsTableName.AUTH, { severity } as Filters, 100)

    test('error severity filter matches 5xx status as well as the log level', () => {
      const sql = queryFor({ error: true })
      expect(sql).toContain("IFNULL(metadata.level, '') IN ('error', 'fatal')")
      expect(sql).toContain('IFNULL(SAFE_CAST(metadata.status AS INT64), 0) >= 500')
    })

    test('warning severity filter matches 4xx status as well as the log level', () => {
      const sql = queryFor({ warning: true })
      expect(sql).toContain("IFNULL(metadata.level, '') = 'warning'")
      expect(sql).toContain('IFNULL(SAFE_CAST(metadata.status AS INT64), 0) BETWEEN 400 AND 499')
    })

    test('info severity filter excludes error and warning rows', () => {
      const sql = queryFor({ info: true })
      expect(sql).toContain('NOT (')
    })
  })

  describe('checkForLimitClause', () => {
    test('detects a limit clause regardless of casing', () => {
      expect(checkForLimitClause('select event_message from edge_logs limit 100')).toBe(true)
      expect(checkForLimitClause('SELECT event_message FROM edge_logs LIMIT 5')).toBe(true)
    })

    test('detects a limit clause across newlines', () => {
      expect(checkForLimitClause('select event_message\nfrom edge_logs\nlimit 50')).toBe(true)
    })

    test('returns false when no limit clause is present', () => {
      expect(checkForLimitClause('select event_message from edge_logs')).toBe(false)
    })

    test('returns false for a bare limit keyword without a row count', () => {
      expect(checkForLimitClause('select event_message from edge_logs limit')).toBe(false)
    })

    test('ignores a column named like limit', () => {
      expect(checkForLimitClause('select limit_reached from edge_logs')).toBe(false)
    })

    test('ignores the word limit inside a string literal', () => {
      expect(checkForLimitClause("select event_message from edge_logs where s = 'limit 10'")).toBe(
        false
      )
    })

    test('ignores a limit clause that is commented out', () => {
      expect(checkForLimitClause('select event_message from edge_logs -- limit 10')).toBe(false)
    })
  })

  describe('genChartQuery', () => {
    // Regression: an unparseable iso_timestamp_start used to reach
    // startOffset.toISOString() as an Invalid Date and throw RangeError.
    test('falls back to minute buckets for an unparseable time range without throwing', () => {
      const params = { iso_timestamp_start: 'not-a-date', iso_timestamp_end: 'also-bad' }
      expect(() => genChartQuery(LogsTableName.AUTH, params as any, {})).not.toThrow()
      expect(genChartQuery(LogsTableName.AUTH, params as any, {})).toContain(
        'timestamp_trunc(t.timestamp, minute)'
      )
    })
  })

  describe('ensureNoTimestampConflict', () => {
    test('does not throw for unparseable initial timestamps', () => {
      expect(() =>
        ensureNoTimestampConflict(['not-a-date', 'also-bad'], ['', '2024-01-01T00:00:00.000Z'])
      ).not.toThrow()
    })
  })
})
