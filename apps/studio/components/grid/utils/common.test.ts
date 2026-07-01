import { describe, expect, test } from 'vitest'

import { formatClipboardValue } from './common'

describe('formatClipboardValue', () => {
  test('returns empty string for null and undefined', () => {
    expect(formatClipboardValue(null)).toBe('')
    expect(formatClipboardValue(undefined)).toBe('')
  })

  test('preserves falsy primitives', () => {
    expect(formatClipboardValue(false)).toBe('false')
    expect(formatClipboardValue(0)).toBe('0')
    expect(formatClipboardValue('')).toBe('')
  })

  test('converts truthy primitives to string', () => {
    expect(formatClipboardValue(true)).toBe('true')
    expect(formatClipboardValue(42)).toBe('42')
    expect(formatClipboardValue('hello')).toBe('hello')
  })

  test('stringifies objects and arrays', () => {
    expect(formatClipboardValue({ a: 1 })).toBe('{"a":1}')
    expect(formatClipboardValue([1, 2])).toBe('[1,2]')
  })
})
