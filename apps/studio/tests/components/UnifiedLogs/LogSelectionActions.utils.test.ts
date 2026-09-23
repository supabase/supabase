import { describe, expect, it } from 'vitest'

import { parseSelectedLogs } from '@/components/interfaces/UnifiedLogs/LogSelectionActions.utils'
import type { ColumnSchema } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.schema'

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
    [{ ...row, date: new Date(NaN) }],
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
