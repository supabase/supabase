import { describe, expect, it } from 'vitest'

import { isTracingAllowed, maskTraceValue } from './braintrust-logger'
import { NO_DATA_PERMISSIONS } from './tools/execute-sql-output'
import { sanitizeNotebookRunOutput, type NotebookRunOutput } from './tools/notebook-run-output'

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
  const notebook = {
    id: 'nb',
    name: 'Signups',
    updated_at: '2026-10-21T00:00:00Z',
    optInLevel: 'schema',
    cells: [
      {
        cell_id: 'a',
        title: 'Emails',
        source: 'database',
        status: 'success',
        rows,
      },
    ],
  } satisfies NotebookRunOutput

  it('replaces execute_sql output below the data level with what the model saw', () => {
    expect(maskTraceValue({ rows, totalRows: 1, optInLevel: 'disabled' })).toBe(NO_DATA_PERMISSIONS)
  })

  it('leaves output at the data level unchanged', () => {
    const output = { rows, totalRows: 1, optInLevel: 'schema_and_log_and_data' }
    expect(maskTraceValue(output)).toEqual(output)
  })

  it('replaces run_notebook output below the data level with what the model saw', () => {
    const masked = maskTraceValue(notebook)
    expect(masked).toEqual(sanitizeNotebookRunOutput(notebook, 'schema'))
    expect(JSON.stringify(masked)).not.toContain('test@example.com')
  })

  it('keeps only the stamp when no tool schema matches', () => {
    expect(maskTraceValue({ records: rows, optInLevel: 'bogus' })).toEqual({ optInLevel: 'bogus' })
  })

  it('leaves unstamped values alone', () => {
    const modelView = { rows, note: 'Only the first 100 rows are included.' }
    expect(maskTraceValue(modelView)).toEqual(modelView)
  })

  it('masks stamped output nested in message history', () => {
    const messages = [{ parts: [{ output: { rows, optInLevel: 'schema' } }] }]
    expect(maskTraceValue(messages)).toEqual([{ parts: [{ output: NO_DATA_PERMISSIONS }] }])
  })
})
