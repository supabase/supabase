import { describe, expect, it } from 'vitest'

import { resolvePublishedColumnNames } from './TableOptions.utils'

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
