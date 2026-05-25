import { describe, expect, it } from 'vitest'

import { QUERY_HIT_RATE_SQL } from '@/components/interfaces/Reports/Reports.constants'
import { parseHitRates } from './useHitRates'

describe('QUERY_HIT_RATE_SQL', () => {
  it('queries pg_statio_user_indexes for index hit rate', () => {
    expect(QUERY_HIT_RATE_SQL).toContain('pg_statio_user_indexes')
    expect(QUERY_HIT_RATE_SQL).toContain('idx_blks_hit')
    expect(QUERY_HIT_RATE_SQL).toContain('idx_blks_read')
  })

  it('queries pg_statio_user_tables for table hit rate', () => {
    expect(QUERY_HIT_RATE_SQL).toContain('pg_statio_user_tables')
    expect(QUERY_HIT_RATE_SQL).toContain('heap_blks_hit')
    expect(QUERY_HIT_RATE_SQL).toContain('heap_blks_read')
  })

  it('uses NULLIF to guard against division by zero', () => {
    expect(QUERY_HIT_RATE_SQL).toContain('nullif')
  })

  it('returns union of index and table rows', () => {
    expect(QUERY_HIT_RATE_SQL).toContain('union all')
    expect(QUERY_HIT_RATE_SQL).toContain("'index hit rate'")
    expect(QUERY_HIT_RATE_SQL).toContain("'table hit rate'")
  })
})

describe('parseHitRates', () => {
  it('returns nulls for non-array input', () => {
    expect(parseHitRates(null)).toEqual({ tableHitRate: null, indexHitRate: null })
    expect(parseHitRates(undefined)).toEqual({ tableHitRate: null, indexHitRate: null })
    expect(parseHitRates({})).toEqual({ tableHitRate: null, indexHitRate: null })
  })

  it('returns nulls for empty array', () => {
    expect(parseHitRates([])).toEqual({ tableHitRate: null, indexHitRate: null })
  })

  it('converts 0–1 ratios to percentages', () => {
    const data = [
      { name: 'index hit rate', ratio: 0.997 },
      { name: 'table hit rate', ratio: 0.985 },
    ]
    const result = parseHitRates(data)
    expect(result.indexHitRate).toBeCloseTo(99.7)
    expect(result.tableHitRate).toBeCloseTo(98.5)
  })

  it('handles string ratios from pg driver', () => {
    const data = [
      { name: 'index hit rate', ratio: '0.9987654321' },
      { name: 'table hit rate', ratio: '0.9912345678' },
    ]
    const result = parseHitRates(data)
    expect(result.indexHitRate).toBeCloseTo(99.88)
    expect(result.tableHitRate).toBeCloseTo(99.12)
  })

  it('returns null when ratio is null (no data yet)', () => {
    const data = [
      { name: 'index hit rate', ratio: null },
      { name: 'table hit rate', ratio: null },
    ]
    expect(parseHitRates(data)).toEqual({ tableHitRate: null, indexHitRate: null })
  })

  it('handles partial results', () => {
    const data = [{ name: 'table hit rate', ratio: 0.99 }]
    const result = parseHitRates(data)
    expect(result.tableHitRate).toBeCloseTo(99)
    expect(result.indexHitRate).toBeNull()
  })
})
