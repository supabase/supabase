import { formatPatternMatchFilterValue } from '@supabase/pg-meta/src/query/table-row-query'
import { describe, expect, it } from 'vitest'

import { getTableRowDeleteAllSql } from './table-row-delete-all-mutation'
import { getAllTableRowsSql } from './table-rows-query'
import type { Filter, SupaTable } from '@/components/grid/types'
import type { Entity } from '@/data/table-editor/table-editor-types'

const makeFilter = (column: string, value: any, operator: Filter['operator'] = '='): Filter => ({
  column,
  operator,
  value,
})

const table = {
  id: 1,
  name: 'precise_values',
  schema: 'public',
  columns: [
    { name: 'id', dataType: 'bigint', format: 'int8' },
    { name: 'amount', dataType: 'numeric', format: 'numeric' },
    { name: 'name', dataType: 'text', format: 'text' },
  ],
} as unknown as SupaTable

const sqlFor = (filter: Filter) =>
  String(getAllTableRowsSql({ table, filters: [filter] }).sql.toSql())

describe('table row filters keep numeric values exact', () => {
  // High-precision numerics lose digits when coerced through Number(), so the
  // generated `=` comparison would no longer match the stored value.
  const preciseValues = [
    '0.123456789012345678901', // numeric(30, 21)
    '12345678901234567890.5',
    '9223372036854775807', // int8 max
    '-9223372036854775808', // int8 min
    '-9007199254740993', // just below MIN_SAFE_INTEGER
  ]

  it.each(preciseValues)('rows query emits %s as a quoted literal', (value) => {
    expect(sqlFor(makeFilter('amount', value))).toContain(`amount = '${value}'`)
  })

  it.each(preciseValues)('delete-all query emits %s as a quoted literal', (value) => {
    const sql = String(
      getTableRowDeleteAllSql({
        table: table as unknown as Entity,
        filters: [makeFilter('amount', value)],
      })
    )
    expect(sql).toContain(`amount = '${value}'`)
  })

  it('does not rewrite the numeric form of the input', () => {
    expect(sqlFor(makeFilter('amount', '1.0'))).toContain(`amount = '1.0'`)
    expect(sqlFor(makeFilter('amount', '1e3'))).toContain(`amount = '1e3'`)
  })
})

describe('formatPatternMatchFilterValue', () => {
  it('returns the value untouched for non-pattern operators', () => {
    expect(formatPatternMatchFilterValue('123', '=')).toBe('123')
    expect(formatPatternMatchFilterValue('abc', '=')).toBe('abc')
  })

  it.each(['~~', '~~*', '!~~', '!~~*'] as const)(
    'wraps the value in %%...%% for the %s operator when no wildcard is present',
    (operator) => {
      expect(formatPatternMatchFilterValue('al', operator)).toBe('%al%')
    }
  )

  it.each(['~~', '~~*', '!~~', '!~~*'] as const)(
    'leaves the value untouched for the %s operator when it already contains a % or _ wildcard',
    (operator) => {
      expect(formatPatternMatchFilterValue('al%', operator)).toBe('al%')
      expect(formatPatternMatchFilterValue('%al', operator)).toBe('%al')
      expect(formatPatternMatchFilterValue('j_hn', operator)).toBe('j_hn')
    }
  )
})
