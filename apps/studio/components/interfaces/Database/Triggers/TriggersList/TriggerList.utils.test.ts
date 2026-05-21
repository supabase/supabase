import { describe, expect, it } from 'vitest'

import { getDatabaseFunctionsHref } from './TriggerList.utils'

describe('TriggerList.utils: getDatabaseFunctionsHref', () => {
  it('builds the functions href with plain values', () => {
    expect(getDatabaseFunctionsHref('abc', 'public', 'do_thing')).toBe(
      '/project/abc/database/functions?search=do_thing&schema=public'
    )
  })

  it('preserves special characters in the function name', () => {
    const href = getDatabaseFunctionsHref('abc', 'public', 'do_thing&secret=1')
    const parsed = new URL(href, 'http://example.com')
    expect(parsed.searchParams.get('search')).toBe('do_thing&secret=1')
    expect(parsed.searchParams.get('schema')).toBe('public')
  })

  it('preserves special characters in the schema', () => {
    const href = getDatabaseFunctionsHref('abc', 'my schema+x', 'do_thing')
    const parsed = new URL(href, 'http://example.com')
    expect(parsed.searchParams.get('schema')).toBe('my schema+x')
    expect(parsed.searchParams.get('search')).toBe('do_thing')
  })

  it('encodes both name and schema together', () => {
    const href = getDatabaseFunctionsHref('abc', 'a&b=c', 'd e+f')
    const parsed = new URL(href, 'http://example.com')
    expect(parsed.searchParams.get('schema')).toBe('a&b=c')
    expect(parsed.searchParams.get('search')).toBe('d e+f')
  })

  it('falls back to empty strings for undefined inputs', () => {
    expect(getDatabaseFunctionsHref(undefined, undefined, undefined)).toBe(
      '/project//database/functions?search=&schema='
    )
  })
})
