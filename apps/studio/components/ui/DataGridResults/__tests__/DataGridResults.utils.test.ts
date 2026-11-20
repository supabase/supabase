import { describe, expect, it } from 'vitest'

import {
  calculateResultColumnWidth,
  formatCellValue,
  formatClipboardValue,
  isLargeValue,
} from '../DataGridResults.utils'

describe('Results.utils', () => {
  describe('calculateResultColumnWidth', () => {
    it('uses the minimum width when the column name and values are short', () => {
      expect(calculateResultColumnWidth('id', [{ id: 1 }])).toBe(100)
    })

    it('accounts for a column name that is longer than its values', () => {
      expect(calculateResultColumnWidth('source_campaign_id', [{ source_campaign_id: null }])).toBe(
        148.5
      )
    })

    it('accounts for a value that is longer than the column name', () => {
      expect(calculateResultColumnWidth('name', [{ name: 'a'.repeat(20) }])).toBe(165)
    })

    it('accounts for the formatted JSON representation of an object value', () => {
      expect(
        calculateResultColumnWidth('metadata', [{ metadata: { campaign: 'a'.repeat(20) } }])
      ).toBe(288.75)
    })

    it('accounts for the formatted JSON representation of an array value', () => {
      expect(calculateResultColumnWidth('tags', [{ tags: ['a'.repeat(10), 'b'.repeat(10)] }])).toBe(
        222.75
      )
    })

    it('caps the width when the column name exceeds the maximum', () => {
      expect(calculateResultColumnWidth('a'.repeat(100), [])).toBe(500)
    })

    it('caps the width when a value exceeds the maximum', () => {
      expect(calculateResultColumnWidth('value', [{ value: 'a'.repeat(100) }])).toBe(500)
    })

    it('uses the minimum width when there are no rows', () => {
      expect(calculateResultColumnWidth('id', [])).toBe(100)
    })
  })

  describe('formatClipboardValue', () => {
    it('returns empty string for null', () => {
      expect(formatClipboardValue(null)).toBe('')
    })

    it('stringifies objects', () => {
      expect(formatClipboardValue({ a: 1 })).toBe('{"a":1}')
    })

    it('stringifies arrays', () => {
      expect(formatClipboardValue([1, 2])).toBe('[1,2]')
    })

    it('converts primitives to string', () => {
      expect(formatClipboardValue('hello')).toBe('hello')
      expect(formatClipboardValue(42)).toBe('42')
      expect(formatClipboardValue(false)).toBe('false')
    })
  })

  describe('formatCellValue', () => {
    it.each([
      [null, 'NULL'],
      ['hello', 'hello'],
      [{ a: 1 }, '{"a":1}'],
      [42, '42'],
      [true, 'true'],
    ])('formats %j as %s', (value, expected) => {
      expect(formatCellValue(value)).toBe(expected)
    })
  })

  describe('isLargeValue', () => {
    it.each([
      // Strings are large past 60 characters or when multi-line
      ['a'.repeat(61), true],
      ['hello\nworld', true],
      [{ a: 1 }, true],
      [[1, 2, 3], true],
      [null, false],
      [undefined, false],
      ['', false],
      ['hello', false],
      ['a'.repeat(60), false],
      [42, false],
      [true, false],
    ])('classifies %j as large: %s', (value, expected) => {
      expect(isLargeValue(value)).toBe(expected)
    })
  })
})
