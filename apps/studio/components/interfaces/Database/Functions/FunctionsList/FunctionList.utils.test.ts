import { describe, expect, it } from 'vitest'

import { getDatabaseTriggersHref } from './FunctionList.utils'

describe('FunctionList.utils: getDatabaseTriggersHref', () => {
  it('builds the triggers href with a plain function name', () => {
    expect(getDatabaseTriggersHref('abc', 'on_insert')).toBe(
      '/project/abc/database/triggers?search=on_insert'
    )
  })

  it('preserves special characters in the function name', () => {
    const href = getDatabaseTriggersHref('abc', 'on_insert&schema=secret')
    const parsed = new URL(href, 'http://example.com')
    expect(parsed.searchParams.get('search')).toBe('on_insert&schema=secret')
    expect(parsed.searchParams.get('schema')).toBeNull()
  })

  it('preserves spaces and plus signs in the function name', () => {
    const href = getDatabaseTriggersHref('abc', 'a name+x')
    const parsed = new URL(href, 'http://example.com')
    expect(parsed.searchParams.get('search')).toBe('a name+x')
  })

  it('falls back to empty strings for undefined inputs', () => {
    expect(getDatabaseTriggersHref(undefined, undefined)).toBe(
      '/project//database/triggers?search='
    )
  })
})
