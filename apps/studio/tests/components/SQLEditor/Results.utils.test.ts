import { describe, expect, test } from 'vitest'

import {
  formatCellValue,
  formatClipboardValue,
} from '@/components/interfaces/SQLEditor/UtilityPanel/Results.utils'

describe('formatClipboardValue', () => {
  test('returns empty string for null', () => {
    expect(formatClipboardValue(null)).toBe('')
  })

  test('stringifies objects', () => {
    expect(formatClipboardValue({ a: 1 })).toBe('{"a":1}')
  })

  test('stringifies arrays', () => {
    expect(formatClipboardValue([1, 2])).toBe('[1,2]')
  })

  test('converts primitives to string', () => {
    expect(formatClipboardValue('hello')).toBe('hello')
    expect(formatClipboardValue(42)).toBe('42')
    expect(formatClipboardValue(false)).toBe('false')
  })
})

describe('formatCellValue', () => {
  test('returns NULL for null', () => {
    expect(formatCellValue(null)).toBe('NULL')
  })

  test('returns strings as-is', () => {
    expect(formatCellValue('hello')).toBe('hello')
  })

  test('stringifies objects', () => {
    expect(formatCellValue({ a: 1 })).toBe('{"a":1}')
  })

  test('stringifies numbers', () => {
    expect(formatCellValue(42)).toBe('42')
  })

  test('stringifies booleans', () => {
    expect(formatCellValue(true)).toBe('true')
  })
})
