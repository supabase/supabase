import { describe, expect, test } from 'vitest'

import { getTableRowsCountSql } from '../../../src'
import type { Filter } from '../../../src/query'

const table = {
  name: 'orders',
  schema: 'public',
  columns: [{ name: 'quantity', format: 'int4' }],
}

const countSql = (value: Filter['value']) =>
  String(
    getTableRowsCountSql({
      table: table as Parameters<typeof getTableRowsCountSql>[0]['table'],
      filters: [{ column: 'quantity', operator: '=', value }],
      enforceExactCount: true,
    })
  )

describe('getTableRowsCountSql filter guards', () => {
  test('keeps a zero filter, so the count matches the rows', () => {
    // The rows query applies every filter it is given, so dropping `= 0` here is what made
    // the grid show filtered rows next to a whole-table count.
    expect(countSql(0)).toContain('where quantity = 0')
  })

  test('keeps a non-zero filter', () => {
    expect(countSql(5)).toContain('where quantity = 5')
  })

  test('still ignores a blank filter', () => {
    expect(countSql('')).not.toContain('where')
  })
})
