import { describe, expect, it } from 'vitest'

import {
  getSizeRows,
  getTreemapLabelLines,
  getTreemapTiles,
  relationSize,
  sizePercentage,
} from '@/components/interfaces/Observability/DatabaseSize/DatabaseSize.utils'
import type { DatabaseSizeRelation } from '@/data/database/database-size-breakdown-query'

const relations: DatabaseSizeRelation[] = [
  {
    id: '1',
    name: 'orders',
    schema: 'public',
    table_bytes: 400,
    index_bytes: 200,
    toast_bytes: 100,
    indexes: [
      { id: '11', name: 'orders_pkey', bytes: 150 },
      { id: '12', name: 'orders_created', bytes: 50 },
    ],
  },
  {
    id: '2',
    name: 'users',
    schema: 'auth',
    table_bytes: 200,
    index_bytes: 100,
    toast_bytes: 0,
    indexes: [{ id: '21', name: 'users_pkey', bytes: 100 }],
  },
]

describe('database size accounting', () => {
  it('counts each physical byte once across all objects, including TOAST indexes', () => {
    const rows = getSizeRows(relations, 'all')
    expect(rows.reduce((sum, row) => sum + row.size, 0)).toBe(1000)
    expect(rows.find((row) => row.id === '1')).toMatchObject({ size: 400, index: 0, toast: 0 })
    expect(rows.filter((row) => row.type === 'Index').map((row) => row.size)).toEqual([
      150, 50, 100,
    ])
    expect(rows.find((row) => row.type === 'TOAST')).toMatchObject({ size: 100, toast: 100 })
  })

  it('includes owned indexes and TOAST in table and schema totals', () => {
    expect(getSizeRows(relations, 'tables').map((row) => row.size)).toEqual([700, 300])
    expect(getSizeRows([...relations, { ...relations[0], id: '3' }], 'schemas')).toEqual([
      {
        id: 'public',
        name: 'public',
        schema: 'public',
        type: 'Schema',
        size: 1400,
        table: 800,
        index: 400,
        toast: 200,
      },
      {
        id: 'auth',
        name: 'auth',
        schema: 'auth',
        type: 'Schema',
        size: 300,
        table: 200,
        index: 100,
        toast: 0,
      },
    ])
    expect(getSizeRows(relations, 'toast')).toHaveLength(1)
  })

  it('selects each treemap metric without changing relation totals', () => {
    expect(
      (['total', 'table', 'index', 'toast'] as const).map((metric) =>
        relationSize(relations[0], metric)
      )
    ).toEqual([700, 400, 200, 100])
    expect(getTreemapTiles(relations, 'toast').map((tile) => tile.schema)).toEqual(['public'])
    expect(sizePercentage(100, 1000)).toBe('10.0%')
    expect(sizePercentage(0, 0)).toBe('0.0%')
  })

  it('groups small objects without losing bytes or confusing a real Other objects table', () => {
    const tiles = getTreemapTiles(
      [
        {
          ...relations[0],
          name: 'Other objects',
          table_bytes: 1000,
          index_bytes: 0,
          toast_bytes: 0,
        },
        ...Array.from({ length: 20 }, (_, index) => ({
          ...relations[0],
          id: `${index + 2}`,
          name: `small_${index}`,
          table_bytes: 1,
          index_bytes: 0,
          toast_bytes: 0,
        })),
      ],
      'total'
    )
    expect(tiles.map((tile) => ({ name: tile.name, size: tile.size, kind: tile.kind }))).toEqual([
      { name: 'Other objects', size: 1000, kind: 'object' },
      { name: 'Other objects', size: 20, kind: 'objects' },
    ])
    expect(tiles[1].members).toHaveLength(20)
    expect(tiles.reduce((sum, tile) => sum + tile.size, 0)).toBe(1020)
    expect(getTreemapTiles([], 'total')).toEqual([])
    expect(getSizeRows([], 'schemas')).toEqual([])
  })

  it('preserves every metric byte when grouping tiny schemas in a skewed database', () => {
    const skewed = [
      {
        ...relations[0],
        id: 'public',
        schema: 'public',
        table_bytes: 7400,
        index_bytes: 100,
        toast_bytes: 30,
      },
      {
        ...relations[0],
        id: 'cron',
        schema: 'cron',
        table_bytes: 2250,
        index_bytes: 10,
        toast_bytes: 10,
      },
      ...Array.from({ length: 9 }, (_, index) => ({
        ...relations[0],
        id: `tiny-${index}`,
        schema: `tiny_${index}`,
        table_bytes: 20 - index,
        index_bytes: 1,
        toast_bytes: 1,
      })),
    ]
    for (const metric of ['total', 'table', 'index', 'toast'] as const) {
      const tiles = getTreemapTiles(skewed, metric)
      expect(tiles.reduce((sum, tile) => sum + tile.size, 0)).toBe(
        skewed.reduce((sum, relation) => sum + relationSize(relation, metric), 0)
      )
      expect(tiles.flatMap((tile) => tile.members.map((member) => member.id)).sort()).toEqual(
        skewed.map((relation) => relation.id).sort()
      )
    }
    const otherSchemas = getTreemapTiles(skewed, 'total').find((tile) => tile.kind === 'schemas')
    expect(otherSchemas?.name).toBe('Other schemas')
    expect(otherSchemas?.members).toHaveLength(9)
  })
  it('hides treemap labels unless complete lines fit in a tile', () => {
    expect(getTreemapLabelLines(31, 100)).toBe(0)
    expect(getTreemapLabelLines(100, 39)).toBe(0)
    expect(getTreemapLabelLines(100, 40)).toBe(1)
    expect(getTreemapLabelLines(100, 56)).toBe(2)
    expect(getTreemapLabelLines(100, 72)).toBe(3)
  })
})
