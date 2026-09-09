import { describe, expect, it } from 'vitest'

import { trimPageSentinel } from './errorModel'

describe('trimPageSentinel', () => {
  describe('first (last = false)', () => {
    it('drops the over-fetched sentinel row when present', () => {
      // limit 2, over-fetched 3 rows -> keep the first 2
      expect(trimPageSentinel(['a', 'b', 'c'], 2, false)).toEqual(['a', 'b'])
    })

    it('keeps every row when the window is not full', () => {
      expect(trimPageSentinel(['a', 'b'], 5, false)).toEqual(['a', 'b'])
    })

    it('returns an empty array for no rows', () => {
      expect(trimPageSentinel([], 5, false)).toEqual([])
    })
  })

  describe('last (last = true)', () => {
    it('drops the leading sentinel row when present', () => {
      // a `last` query is fetched in reverse then re-reversed to ascending, so
      // the over-fetched sentinel is the first (lowest-id) row.
      expect(trimPageSentinel(['a', 'b', 'c'], 2, true)).toEqual(['b', 'c'])
    })

    it('keeps every row when the window has <= limit rows (regression)', () => {
      // Previously this branch unconditionally sliced off the first row, so a
      // `last` query whose result window was not full silently lost its
      // lowest-id row (returned ['b','c','d'] instead of ['a','b','c','d']).
      expect(trimPageSentinel(['a', 'b', 'c', 'd'], 10, true)).toEqual(['a', 'b', 'c', 'd'])
    })

    it('keeps a single row rather than dropping it', () => {
      expect(trimPageSentinel(['a'], 10, true)).toEqual(['a'])
    })

    it('returns an empty array for no rows', () => {
      expect(trimPageSentinel([], 10, true)).toEqual([])
    })
  })
})
