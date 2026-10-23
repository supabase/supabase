import { describe, expect, it } from 'vitest'

import {
  getSizeRows,
  getTreemapGroups,
  getTreemapLabelLines,
  partitionTreemap,
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
    expect(getTreemapGroups(relations, 'toast').map((group) => group.name)).toEqual(['public'])
    expect(sizePercentage(100, 1000)).toBe('10.0%')
    expect(sizePercentage(0, 0)).toBe('0.0%')
  })

  it('groups small objects without losing bytes or confusing a real Other table', () => {
    const group = getTreemapGroups(
      [
        { ...relations[0], name: 'Other', table_bytes: 1000, index_bytes: 0, toast_bytes: 0 },
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
    )[0]
    expect(group.size).toBe(1020)
    expect(group.children).toEqual([
      { name: 'Other', size: 1000, isOther: false },
      { name: 'Other', size: 20, isOther: true },
    ])
    expect(getTreemapGroups([], 'total')).toEqual([])
    expect(getSizeRows([], 'schemas')).toEqual([])
  })

  it('lays out proportional non-overlapping rectangles covering the entire treemap', () => {
    const rectangles = partitionTreemap([{ size: 60 }, { size: 25 }, { size: 10 }, { size: 5 }])
    expect(rectangles.reduce((sum, item) => sum + item.width * item.height, 0)).toBeCloseTo(10000)
    for (const rectangle of rectangles) {
      expect((rectangle.width * rectangle.height) / 100).toBeCloseTo(rectangle.size)
      expect(rectangle.x + rectangle.width).toBeLessThanOrEqual(100)
      expect(rectangle.y + rectangle.height).toBeLessThanOrEqual(100)
    }
    expect(partitionTreemap([])).toEqual([])
    expect(partitionTreemap([{ size: 0 }, { size: 0 }])).toEqual([])
  })
  it('hides treemap labels unless complete lines fit in a tile', () => {
    expect(getTreemapLabelLines(71, 100)).toBe(0)
    expect(getTreemapLabelLines(100, 39)).toBe(0)
    expect(getTreemapLabelLines(100, 40)).toBe(1)
    expect(getTreemapLabelLines(100, 56)).toBe(2)
    expect(getTreemapLabelLines(100, 72)).toBe(3)
  })
})
