import { describe, expect, it } from 'vitest'

import {
  isIntegerPartitionColumnType,
  isPartitionColumnTypeCompatible,
  isTimePartitionColumnType,
  resolvePublishedColumnNames,
} from './TableOptions.utils'

describe('resolvePublishedColumnNames', () => {
  it('returns the columns from the nearest configured partition ancestor', () => {
    const configuredTables = new Map([
      [1, { id: 1, columns: ['root_column'] }],
      [2, { id: 2, columns: ['middle_column'] }],
    ])
    const sourceTables = new Map([
      [1, { id: 1, partition_parent_id: null }],
      [2, { id: 2, partition_parent_id: 1 }],
      [3, { id: 3, partition_parent_id: 2 }],
    ])

    expect(resolvePublishedColumnNames(3, configuredTables, sourceTables)).toEqual(
      new Set(['middle_column'])
    )
  })

  it('returns undefined when the nearest configured ancestor publishes every column', () => {
    const configuredTables = new Map([[1, { id: 1, columns: null }]])
    const sourceTables = new Map([
      [1, { id: 1, partition_parent_id: null }],
      [2, { id: 2, partition_parent_id: 1 }],
    ])

    expect(resolvePublishedColumnNames(2, configuredTables, sourceTables)).toBeUndefined()
  })

  it('returns null when an ancestry link cannot be resolved', () => {
    expect(
      resolvePublishedColumnNames(
        3,
        new Map([[1, { id: 1, columns: ['id'] }]]),
        new Map([[3, { id: 3, partition_parent_id: 2 }]])
      )
    ).toBeNull()
  })

  it('returns null for a cyclic partition ancestry', () => {
    const sourceTables = new Map([
      [2, { id: 2, partition_parent_id: 3 }],
      [3, { id: 3, partition_parent_id: 2 }],
    ])

    expect(resolvePublishedColumnNames(3, new Map(), sourceTables)).toBeNull()
  })

  it('returns null when no configured ancestor exists', () => {
    const sourceTables = new Map([[1, { id: 1, partition_parent_id: null }]])

    expect(resolvePublishedColumnNames(1, new Map(), sourceTables)).toBeNull()
  })
})

describe('partition column type compatibility', () => {
  it('accepts Postgres date and timestamp types for time-column partitioning', () => {
    expect(isTimePartitionColumnType('date')).toBe(true)
    expect(isTimePartitionColumnType('timestamp with time zone')).toBe(true)
    expect(isTimePartitionColumnType('timestamptz')).toBe(true)
    expect(isTimePartitionColumnType('integer')).toBe(false)
  })

  it('accepts integer family types for integer-range partitioning', () => {
    expect(isIntegerPartitionColumnType('bigint')).toBe(true)
    expect(isIntegerPartitionColumnType('int4')).toBe(true)
    expect(isIntegerPartitionColumnType('date')).toBe(false)
  })

  it('treats an unknown type as compatible so columns can still be chosen while loading', () => {
    expect(isPartitionColumnTypeCompatible('time_column')).toBe(true)
    expect(isPartitionColumnTypeCompatible('integer_range', 'text')).toBe(false)
  })
})
