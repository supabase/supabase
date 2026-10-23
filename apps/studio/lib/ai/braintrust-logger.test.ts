import { describe, expect, it } from 'vitest'

import {
  hideSpanErrorFromTrace,
  isTracingAllowed,
  maskTraceValue,
  redactHiddenSpanError,
} from './braintrust-logger'
import { NO_DATA_ERROR, NO_DATA_PERMISSIONS } from './tools/execute-sql-output'
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

  it('masks execute_sql output below the data level', () => {
    expect(maskTraceValue({ rows, totalRows: 1, optInLevel: 'disabled' })).toBe(NO_DATA_PERMISSIONS)
  })

  it('preserves output at the data level', () => {
    const output = { rows, totalRows: 1, optInLevel: 'schema_and_log_and_data' }
    expect(maskTraceValue(output)).toEqual(output)
  })

  it('masks run_notebook output below the data level', () => {
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

  it('masks stamped output in message history', () => {
    const messages = [{ parts: [{ output: { rows, optInLevel: 'schema' } }] }]
    expect(maskTraceValue(messages)).toEqual([{ parts: [{ output: NO_DATA_PERMISSIONS }] }])
  })
})

describe('redactHiddenSpanError', () => {
  it('hides child errors until the hidden span ends', () => {
    hideSpanErrorFromTrace('parent')
    const childError = (span_id: string) => ({
      span_id,
      span_parents: ['parent'],
      error: 'key (email)=(a@b.c)',
    })

    for (const span_id of ['tool-1', 'tool-2']) {
      expect(redactHiddenSpanError(childError(span_id))).toEqual({
        ...childError(span_id),
        error: NO_DATA_ERROR,
      })
    }
    redactHiddenSpanError({ span_id: 'parent', metrics: { end: 1 } })
    expect(redactHiddenSpanError(childError('tool-3'))).toEqual(childError('tool-3'))
  })

  it('leaves errors on other spans alone', () => {
    hideSpanErrorFromTrace('hidden')
    const otherError = { span_id: 'other', span_parents: ['root'], error: 'boom' }

    expect(redactHiddenSpanError(otherError)).toEqual(otherError)
  })
})
