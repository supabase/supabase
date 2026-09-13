import { describe, expect, it } from 'vitest'

import { mapLogsError } from './execute-logs-sql-mutation'

describe('mapLogsError', () => {
  it('returns undefined when there is no error', () => {
    expect(mapLogsError(undefined)).toBeUndefined()
    expect(mapLogsError(null)).toBeUndefined()
  })

  it('extracts the top-level message from the structured backend error body', () => {
    const structured = {
      code: 400,
      errors: [{ domain: 'global', message: 'nested detail', reason: 'invalidQuery' }],
      message: 'Syntax error near LIMIT',
      status: 'INVALID_ARGUMENT',
    }
    expect(mapLogsError(structured)).toEqual({ message: 'Syntax error near LIMIT' })
  })

  it('falls back to the first nested errors[].message when top-level message is missing', () => {
    const structured = {
      code: 400,
      errors: [
        { domain: 'global', message: '', reason: 'invalidQuery' },
        { domain: 'global', message: 'first usable detail', reason: 'invalidQuery' },
      ],
      status: 'INVALID_ARGUMENT',
    }
    expect(mapLogsError(structured)).toEqual({ message: 'first usable detail' })
  })

  it('does not throw and falls back when errors is a malformed non-array value', () => {
    expect(mapLogsError({ code: 400, errors: {}, status: 'INVALID_ARGUMENT' })).toEqual({
      message: 'An unexpected error occurred while running the logs query.',
    })
    expect(mapLogsError({ message: 'top-level wins', errors: 'nope' })).toEqual({
      message: 'top-level wins',
    })
  })

  it('normalizes a plain string error', () => {
    expect(mapLogsError('boom')).toEqual({ message: 'boom' })
  })

  it('returns a generic fallback when an error is present but carries no usable text', () => {
    expect(mapLogsError({ code: 500, errors: [], status: 'INTERNAL' })).toEqual({
      message: 'An unexpected error occurred while running the logs query.',
    })
    expect(mapLogsError('')).toEqual({
      message: 'An unexpected error occurred while running the logs query.',
    })
    expect(mapLogsError({ message: '' })).toEqual({
      message: 'An unexpected error occurred while running the logs query.',
    })
  })
})
