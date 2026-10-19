import { describe, expect, test } from 'vitest'

import { getFirstQueryParam } from './getFirstQueryParam'

describe('getFirstQueryParam', () => {
  test('returns a query value', () => {
    expect(getFirstQueryParam('public')).toBe('public')
  })

  test('returns the first value when the query repeats the key', () => {
    expect(getFirstQueryParam(['auth', 'public'])).toBe('auth')
  })

  test('ignores a missing or empty value', () => {
    expect(getFirstQueryParam(undefined)).toBeUndefined()
    expect(getFirstQueryParam('')).toBeUndefined()
    expect(getFirstQueryParam([])).toBeUndefined()
  })
})
