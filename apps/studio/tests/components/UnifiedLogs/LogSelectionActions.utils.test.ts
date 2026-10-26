import { describe, expect, it } from 'vitest'

import { buildLogsPrompt, formatLogsAsJson } from '@/components/interfaces/Settings/Logs/Logs.utils'
import { parseSelectedLogs } from '@/components/interfaces/UnifiedLogs/LogSelectionActions.utils'
import type { ColumnSchema } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.schema'
import { mapUnifiedLogRow, parseUnifiedLogsQueryRows } from '@/data/logs/unified-logs.utils'

const row: ColumnSchema = {
  id: 'log-id',
  log_type: 'realtime',
  timestamp: 1_000_000,
  date: new Date(1000),
  event_message: 'Connection opened',
  method: null,
  pathname: null,
  level: null,
  status: null,
}

describe('parseSelectedLogs', () => {
  it.each(['edge', 'auth', 'compute', 'realtime'])(
    'accepts mapped %s logs with numeric and OTEL timestamps',
    (logType) => {
      const timestamps = [
        1788424716876000,
        '1788424716876000',
        '2026-09-03T09:58:36.876000',
        '2026-09-03T09:58:36.876Z',
      ]
      const rows = parseUnifiedLogsQueryRows(
        timestamps.map((timestamp) => ({
          id: `${logType}-${timestamp}`,
          log_type: logType,
          timestamp,
          event_message: 'Connection opened',
          method: null,
          pathname: null,
          status: '200',
          level: null,
          log_count: null,
          logs: null,
        }))
      ).map(mapUnifiedLogRow)

      const result = parseSelectedLogs(rows, true)

      expect(result.success).toBe(true)
      if (!result.success) throw result.error
      expect(result.data.map((log) => log.timestamp)).toEqual(timestamps)
      expect(JSON.parse(formatLogsAsJson(result.data))).toHaveLength(timestamps.length)
      expect(buildLogsPrompt(result.data)).toContain('Connection opened')
      if (logType !== 'compute') expect(result.data[0].log_count).toBeNull()
    }
  )

  it.each([false, true])('preserves log fields with metadata visibility %s', (metadataVisible) => {
    const input = {
      ...row,
      metadata: { host: 'host' },
      raw_log_data: { message: 'original', metadata: { request_id: 'request' } },
      custom_field: 'custom',
    }

    const result = parseSelectedLogs([input], metadataVisible)

    expect(result).toMatchObject({
      success: true,
      data: [
        {
          ...input,
          metadata: metadataVisible ? input.metadata : undefined,
          raw_log_data: {
            message: 'original',
            metadata: metadataVisible ? input.raw_log_data.metadata : undefined,
          },
        },
      ],
    })
    expect(input.raw_log_data.metadata).toEqual({ request_id: 'request' })
    expect(input.metadata).toEqual({ host: 'host' })
  })

  it.each([false, true])(
    'normalizes compute logs with metadata visibility %s',
    (metadataVisible) => {
      const result = parseSelectedLogs(
        [{ ...row, log_type: 'compute', event_message: undefined, metadata: { host: 'host' } }],
        metadataVisible
      )

      expect(result).toEqual({
        success: true,
        data: [
          {
            id: row.id,
            timestamp: row.timestamp,
            event_message: '',
            metadata: metadataVisible ? { host: 'host' } : undefined,
          },
        ],
      })
    }
  )

  it('accepts an empty selection', () => {
    expect(parseSelectedLogs([], true)).toEqual({ success: true, data: [] })
  })

  it('normalizes nullable metadata', () => {
    expect(parseSelectedLogs([{ ...row, metadata: null }], true)).toMatchObject({
      success: true,
      data: [{ metadata: undefined }],
    })
  })

  it.each([
    null,
    {},
    [null],
    [{ ...row, id: undefined }],
    [{ ...row, event_message: 123 }],
    [{ ...row, log_type: 'unknown' }],
    [{ ...row, metadata: 'invalid' }],
    [{ ...row, timestamp: true }],
    [{ ...row, timestamp: 'invalid timestamp' }],
    [{ ...row, timestamp: '' }],
  ])('returns a validation error for malformed input: %j', (input) => {
    expect(parseSelectedLogs(input, false).success).toBe(false)
  })

  it('validates the transformed output and rejects the whole selection', () => {
    const result = parseSelectedLogs([row, { ...row, timestamp: Infinity }], true)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toEqual([
        expect.objectContaining({ code: 'not_finite', path: [1, 'timestamp'] }),
      ])
    }
  })
})
