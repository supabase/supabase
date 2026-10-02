import { describe, expect, test } from 'vitest'

import {
  formatNodeDuration,
  isExplainQuery,
} from '@/components/interfaces/ExplainVisualizer/ExplainVisualizer.utils'

describe('isExplainQuery', () => {
  test('returns true for valid EXPLAIN result rows', () => {
    const rows = [{ 'QUERY PLAN': 'Seq Scan on users' }]
    expect(isExplainQuery(rows)).toBe(true)
  })

  test('returns true for JSON format EXPLAIN result rows', () => {
    // JSON format returns an array/object in the QUERY PLAN column
    const rows = [{ 'QUERY PLAN': [{ Plan: { 'Node Type': 'Seq Scan' } }] }]
    expect(isExplainQuery(rows)).toBe(true)
  })

  test('returns false for empty array', () => {
    expect(isExplainQuery([])).toBe(false)
  })

  test('returns false for regular query results', () => {
    const rows = [{ id: 1, name: 'John' }]
    expect(isExplainQuery(rows)).toBe(false)
  })
})

describe('formatNodeDuration', () => {
  test('returns "-" for undefined', () => {
    expect(formatNodeDuration(undefined)).toBe('-')
  })

  test('formats seconds for large values', () => {
    expect(formatNodeDuration(1500)).toBe('1.50s')
  })

  test('formats milliseconds for medium values', () => {
    expect(formatNodeDuration(25.5)).toBe('25.50ms')
  })

  test('formats microseconds for small values', () => {
    expect(formatNodeDuration(0.0005)).toBe('0.5µs')
  })
})
