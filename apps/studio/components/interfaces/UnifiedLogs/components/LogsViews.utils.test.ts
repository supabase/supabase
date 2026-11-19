import { describe, expect, it } from 'vitest'

import { getFilterCombinationKey, isDuplicateViewName, truncateViewName } from './LogsViews.utils'

describe('truncateViewName', () => {
  it('leaves a short name untouched', () => {
    expect(truncateViewName('Errors only')).toBe('Errors only')
  })

  it('truncates a long name with an ellipsis', () => {
    const truncated = truncateViewName('a'.repeat(64))
    expect(truncated).toBe(`${'a'.repeat(31)}…`)
    expect(truncated.length).toBe(32)
  })
})

describe('getFilterCombinationKey', () => {
  it('is order-independent', () => {
    expect(getFilterCombinationKey(['a', 'b', 'c'])).toBe(getFilterCombinationKey(['c', 'a', 'b']))
  })

  it('differs when the filter set actually differs', () => {
    expect(getFilterCombinationKey(['a', 'b'])).not.toBe(getFilterCombinationKey(['a', 'c']))
  })

  it('treats null/undefined/empty as the same empty key', () => {
    expect(getFilterCombinationKey(null)).toBe('')
    expect(getFilterCombinationKey(undefined)).toBe('')
    expect(getFilterCombinationKey([])).toBe('')
  })

  it('does not collide when a value contains the delimiter', () => {
    expect(getFilterCombinationKey(['a|b'])).not.toBe(getFilterCombinationKey(['a', 'b']))
  })
})

describe('isDuplicateViewName', () => {
  it('matches regardless of case or surrounding whitespace', () => {
    expect(isDuplicateViewName(' Errors Only ', ['errors only'])).toBe(true)
  })

  it('does not match a genuinely different name', () => {
    expect(isDuplicateViewName('Errors only', ['Slow requests'])).toBe(false)
  })
})
