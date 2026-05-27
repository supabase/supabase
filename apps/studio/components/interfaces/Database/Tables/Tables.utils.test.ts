import { describe, expect, it } from 'vitest'

import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import {
  DEFAULT_TABLE_LIST_SORT,
  handleTableListSortChange,
  isTableListSort,
  sortEntities,
  type FormattedEntity,
} from './Tables.utils'

const makeEntity = (overrides: Partial<FormattedEntity> & { id: number; name: string }) =>
  ({
    type: ENTITY_TYPE.TABLE,
    schema: 'public',
    comment: null,
    columns: [],
    rows: 0,
    size: '0 bytes',
    bytes: 0,
    ...overrides,
  }) as unknown as FormattedEntity

const realtimeEnabledIds = new Set<number>()

describe('Tables.utils', () => {
  describe('isTableListSort', () => {
    it('accepts every supported column / direction combination', () => {
      expect(isTableListSort('name:asc')).toBe(true)
      expect(isTableListSort('columns:desc')).toBe(true)
      expect(isTableListSort('rows:asc')).toBe(true)
      expect(isTableListSort('size:desc')).toBe(true)
      expect(isTableListSort('realtime:asc')).toBe(true)
    })

    it('rejects unknown columns and directions', () => {
      expect(isTableListSort('schema:asc')).toBe(false)
      expect(isTableListSort('name:sideways')).toBe(false)
      expect(isTableListSort('')).toBe(false)
    })
  })

  describe('handleTableListSortChange', () => {
    it('toggles direction when the same column is reselected', () => {
      let next = ''
      handleTableListSortChange('rows:desc', 'rows', (s) => (next = s))
      expect(next).toBe('rows:asc')
    })

    it('defaults numeric columns to descending on first selection', () => {
      let next = ''
      handleTableListSortChange(DEFAULT_TABLE_LIST_SORT, 'size', (s) => (next = s))
      expect(next).toBe('size:desc')
    })

    it('defaults name and realtime to ascending on first selection', () => {
      let next = ''
      handleTableListSortChange('rows:desc', 'name', (s) => (next = s))
      expect(next).toBe('name:asc')
      handleTableListSortChange('rows:desc', 'realtime', (s) => (next = s))
      expect(next).toBe('realtime:asc')
    })
  })

  describe('sortEntities', () => {
    const entities = [
      makeEntity({ id: 1, name: 'orders', bytes: 1024, rows: 10 }),
      makeEntity({ id: 2, name: 'Customers', bytes: 4096, rows: 100 }),
      makeEntity({ id: 3, name: 'audit_log', bytes: 16, rows: 0 }),
    ]

    it('sorts by name ascending case-insensitively', () => {
      const sorted = sortEntities(entities, 'name:asc', realtimeEnabledIds)
      expect(sorted.map((x) => x.name)).toEqual(['audit_log', 'Customers', 'orders'])
    })

    it('sorts by size descending using the numeric bytes field', () => {
      const sorted = sortEntities(entities, 'size:desc', realtimeEnabledIds)
      expect(sorted.map((x) => x.name)).toEqual(['Customers', 'orders', 'audit_log'])
    })

    it('sorts empty tables to the top when sorting rows ascending', () => {
      const sorted = sortEntities(entities, 'rows:asc', realtimeEnabledIds)
      expect(sorted[0].name).toBe('audit_log')
    })

    it('keeps entities with undefined size at the bottom regardless of direction', () => {
      const mixed = [
        ...entities,
        makeEntity({ id: 4, name: 'public_view', bytes: undefined as unknown as number, type: ENTITY_TYPE.VIEW as any, size: undefined as any }),
      ]
      const asc = sortEntities(mixed as FormattedEntity[], 'size:asc', realtimeEnabledIds)
      const desc = sortEntities(mixed as FormattedEntity[], 'size:desc', realtimeEnabledIds)
      expect(asc[asc.length - 1].name).toBe('public_view')
      expect(desc[desc.length - 1].name).toBe('public_view')
    })

    it('sorts realtime-enabled entities ahead when descending', () => {
      const enabled = new Set<number>([2])
      const sorted = sortEntities(entities, 'realtime:desc', enabled)
      expect(sorted[0].id).toBe(2)
    })
  })
})
