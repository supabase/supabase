import { describe, expect, it } from 'vitest'

import { isTracingAllowed, maskTraceValue } from './braintrust-logger'

describe('isTracingAllowed', () => {
  it('allows tracing for non-EU regions', () => {
    expect(isTracingAllowed({ projectRegion: 'us-east-1' })).toBe(true)
    expect(isTracingAllowed({ projectRegion: 'ap-southeast-1' })).toBe(true)
  })

  it('disallows tracing for EU regions', () => {
    expect(isTracingAllowed({ projectRegion: 'eu-west-1' })).toBe(false)
    expect(isTracingAllowed({ projectRegion: 'eu-central-1' })).toBe(false)
  })

  it('disallows tracing when the region is unknown', () => {
    expect(isTracingAllowed({ projectRegion: undefined })).toBe(false)
  })
})

describe('maskTraceValue', () => {
  const rows = [{ email: 'test@example.com' }]

  it('redacts rows stamped below the data level and keeps the rest', () => {
    expect(maskTraceValue({ rows, totalRows: 1, optInLevel: 'disabled' })).toEqual({
      rows: '[redacted]',
      totalRows: 1,
      optInLevel: 'disabled',
    })
  })

  it('leaves rows stamped at the data level', () => {
    const output = { rows, totalRows: 1, optInLevel: 'schema_and_log_and_data' }
    expect(maskTraceValue(output)).toEqual(output)
  })

  it('redacts an unknown stamp', () => {
    expect(maskTraceValue({ rows, optInLevel: 'bogus' })).toEqual({
      rows: '[redacted]',
      optInLevel: 'bogus',
    })
  })

  it('leaves unstamped values alone', () => {
    const modelView = { rows, note: 'Only the first 100 rows are included.' }
    expect(maskTraceValue(modelView)).toEqual(modelView)
    expect(maskTraceValue(rows)).toEqual(rows)
  })

  it('redacts notebook cell rows and errors under the notebook stamp', () => {
    const output = {
      id: 'nb',
      optInLevel: 'schema',
      cells: [
        { cell_id: 'a', title: 'Emails', status: 'success', rows },
        { cell_id: 'b', title: 'Bad', status: 'error', error: { message: 'key (email)=(a@b.c)' } },
      ],
    }
    expect(maskTraceValue(output)).toEqual({
      id: 'nb',
      optInLevel: 'schema',
      cells: [
        { cell_id: 'a', title: 'Emails', status: 'success', rows: '[redacted]' },
        { cell_id: 'b', title: 'Bad', status: 'error', error: '[redacted]' },
      ],
    })
  })

  it('redacts stamped output nested in message history', () => {
    const messages = [
      { parts: [{ type: 'tool-execute_sql', output: { rows, optInLevel: 'schema' } }] },
    ]
    expect(maskTraceValue(messages)).toEqual([
      {
        parts: [{ type: 'tool-execute_sql', output: { rows: '[redacted]', optInLevel: 'schema' } }],
      },
    ])
  })

  it('redacts values nested deeper than the depth limit', () => {
    const deep = Array.from({ length: 60 }).reduce<unknown>((child) => [child], 'secret')
    expect(JSON.stringify(maskTraceValue(deep))).not.toContain('secret')
  })
})
