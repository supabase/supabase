import { describe, expect, it } from 'vitest'

import { getSqlErrorLines } from './UtilityTabResults.utils'

describe('getSqlErrorLines', () => {
  it('returns formattedError lines when present', () => {
    const lines = getSqlErrorLines({
      message: 'permission denied for table users',
      formattedError:
        'ERROR:  42501: permission denied for table users\n' +
        'HINT:  To grant access to anon on a specific table:\n' +
        '  GRANT SELECT ON TABLE public.users TO anon;',
    })

    expect(lines).toEqual([
      'ERROR:  42501: permission denied for table users',
      'HINT:  To grant access to anon on a specific table:',
      '  GRANT SELECT ON TABLE public.users TO anon;',
    ])
  })

  it('strips empty lines from formattedError', () => {
    const lines = getSqlErrorLines({
      formattedError: 'ERROR: boom\n\nHINT: retry\n',
    })

    expect(lines).toEqual(['ERROR: boom', 'HINT: retry'])
  })

  it('falls back to message lines when formattedError is missing and message is multi-line', () => {
    const lines = getSqlErrorLines({
      message:
        'ERROR:  42501: permission denied for table users\n' +
        'HINT:  To grant access to anon on a specific table:\n' +
        '  GRANT SELECT ON TABLE public.users TO anon;',
    })

    expect(lines).toEqual([
      'ERROR:  42501: permission denied for table users',
      'HINT:  To grant access to anon on a specific table:',
      '  GRANT SELECT ON TABLE public.users TO anon;',
    ])
  })

  it('returns empty array for a single-line message so callers render the fallback', () => {
    const lines = getSqlErrorLines({ message: 'permission denied for table users' })
    expect(lines).toEqual([])
  })

  it('returns empty array when both fields are missing', () => {
    expect(getSqlErrorLines({})).toEqual([])
  })

  it('returns empty array when message is an empty string', () => {
    expect(getSqlErrorLines({ message: '' })).toEqual([])
  })

  it('returns empty array when message only contains whitespace newlines', () => {
    // Only empty segments after filtering — treated as single-line
    expect(getSqlErrorLines({ message: '\n\n' })).toEqual([])
  })

  it('prefers formattedError even when message is also multi-line', () => {
    const lines = getSqlErrorLines({
      message: 'message line 1\nmessage line 2',
      formattedError: 'formatted line 1\nformatted line 2',
    })

    expect(lines).toEqual(['formatted line 1', 'formatted line 2'])
  })

  it('falls through to message when formattedError is empty string', () => {
    const lines = getSqlErrorLines({
      message: 'ERROR: line 1\nHINT: line 2',
      formattedError: '',
    })

    expect(lines).toEqual(['ERROR: line 1', 'HINT: line 2'])
  })
})
