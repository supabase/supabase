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
    it('returns NULL for null', () => {
      expect(formatCellValue(null)).toBe('NULL')
    })

    it('returns strings as-is', () => {
      expect(formatCellValue('hello')).toBe('hello')
    })

    it('stringifies objects', () => {
      expect(formatCellValue({ a: 1 })).toBe('{"a":1}')
    })

    it('stringifies numbers', () => {
      expect(formatCellValue(42)).toBe('42')
    })

    it('stringifies booleans', () => {
      expect(formatCellValue(true)).toBe('true')
    })
  })

  describe('isLargeValue', () => {
    it('returns false for null', () => {
      expect(isLargeValue(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isLargeValue(undefined)).toBe(false)
    })

    it('returns false for an empty string', () => {
      expect(isLargeValue('')).toBe(false)
    })

    it('returns false for a short string under the threshold', () => {
      expect(isLargeValue('hello')).toBe(false)
    })

    it('returns false for a string at the 60-char boundary', () => {
      expect(isLargeValue('a'.repeat(60))).toBe(false)
    })

    it('returns true for a string just over the 60-char threshold', () => {
      expect(isLargeValue('a'.repeat(61))).toBe(true)
    })

    it('returns true for a short string containing a newline', () => {
      expect(isLargeValue('hello\nworld')).toBe(true)
    })

    it('returns true for an object', () => {
      expect(isLargeValue({ a: 1 })).toBe(true)
    })

    it('returns true for an array', () => {
      expect(isLargeValue([1, 2, 3])).toBe(true)
    })

    it('returns false for a number', () => {
      expect(isLargeValue(42)).toBe(false)
    })

    it('returns false for a boolean', () => {
      expect(isLargeValue(true)).toBe(false)
    })
  })
})
