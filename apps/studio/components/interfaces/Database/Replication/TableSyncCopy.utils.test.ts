import { describe, expect, it } from 'vitest'

import {
  getTableCopyTargets,
  shouldCopyTable,
  summarizeTableCopyEstimate,
  type TableSyncCopyConfig,
} from './TableSyncCopy.utils'

const tables = [
  { id: 101, schema: 'public', name: 'orders' },
  { id: 202, schema: 'billing', name: 'orders' },
]

describe('shouldCopyTable', () => {
  it('defaults an omitted policy to copying every table', () => {
    expect(shouldCopyTable(undefined, 101)).toBe(true)
  })

  it.each<[TableSyncCopyConfig, number[]]>([
    [{ type: 'include_all_tables' }, [101, 202]],
    [{ type: 'skip_all_tables' }, []],
    [{ type: 'include_tables', table_ids: [202] }, [202]],
    [{ type: 'skip_tables', table_ids: [202] }, [101]],
  ])('filters copy targets for $0', (config, expectedIds) => {
    expect(getTableCopyTargets(tables, config).map(({ id }) => id)).toEqual(expectedIds)
  })
})

describe('summarizeTableCopyEstimate', () => {
  const estimates = [
    {
      schema: 'public',
      name: 'orders.v2',
      estimated_bytes: 100,
      estimated_cost: 1,
      is_row_filtered: false,
    },
    {
      schema: 'billing',
      name: 'orders.v2',
      estimated_bytes: 200,
      estimated_cost: 2,
      is_row_filtered: true,
    },
  ]

  it('matches schema-qualified identities without dot-delimited collisions', () => {
    expect(
      summarizeTableCopyEstimate(estimates, [{ schema: 'billing', name: 'orders.v2' }])
    ).toMatchObject({
      isComplete: true,
      estimatedBytes: 200,
      estimatedCost: 2,
      hasRowFilteredTables: true,
      tables: [estimates[1]],
    })
  })

  it('marks an estimate incomplete instead of presenting a partial total', () => {
    expect(
      summarizeTableCopyEstimate(estimates, [
        { schema: 'public', name: 'orders.v2' },
        { schema: 'missing', name: 'table' },
      ])
    ).toMatchObject({
      isComplete: false,
      estimatedBytes: 100,
      estimatedCost: 1,
    })
  })

  it('returns a complete zero-cost summary when no table will be copied', () => {
    expect(summarizeTableCopyEstimate(estimates, [])).toEqual({
      isComplete: true,
      tables: [],
      estimatedBytes: 0,
      estimatedCost: 0,
      hasRowFilteredTables: false,
    })
  })
})
