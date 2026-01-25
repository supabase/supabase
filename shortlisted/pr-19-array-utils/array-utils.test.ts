/**
 * Tests for array utilities.
 */

import {
  first,
  last,
  sum,
  average,
  min,
  max,
  groupBy,
  chunk,
  unique,
  partition,
  range,
  binarySearch,
  isEmpty,
} from './array-utils'

describe('array-utils', () => {
  describe('first', () => {
    it('returns first element', () => {
      expect(first([1, 2, 3])).toBe(1)
    })
  })

  describe('last', () => {
    it('returns last element', () => {
      expect(last([1, 2, 3])).toBe(3)
    })
  })

  describe('sum', () => {
    it('sums numbers', () => {
      expect(sum([1, 2, 3])).toBe(6)
    })
  })

  describe('average', () => {
    it('calculates average', () => {
      expect(average([2, 4, 6])).toBe(4)
    })
  })

  describe('min', () => {
    it('finds minimum', () => {
      expect(min([3, 1, 2])).toBe(1)
    })
  })

  describe('max', () => {
    it('finds maximum', () => {
      expect(max([1, 3, 2])).toBe(3)
    })
  })

  describe('groupBy', () => {
    it('groups by key', () => {
      const items = [
        { type: 'a', value: 1 },
        { type: 'b', value: 2 },
        { type: 'a', value: 3 },
      ]
      const result = groupBy(items, item => item.type)
      expect(result['a']).toHaveLength(2)
      expect(result['b']).toHaveLength(1)
    })
  })

  describe('chunk', () => {
    it('chunks array', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    })
  })

  describe('unique', () => {
    it('removes duplicates', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3])
    })
  })

  describe('partition', () => {
    it('partitions array', () => {
      const [even, odd] = partition([1, 2, 3, 4, 5], n => n % 2 === 0)
      expect(even).toEqual([2, 4])
      expect(odd).toEqual([1, 3, 5])
    })
  })

  describe('range', () => {
    it('creates range', () => {
      expect(range(0, 5)).toEqual([0, 1, 2, 3, 4])
    })

    it('creates range with step', () => {
      expect(range(0, 10, 2)).toEqual([0, 2, 4, 6, 8])
    })
  })

  describe('binarySearch', () => {
    it('finds element', () => {
      expect(binarySearch([1, 2, 3, 4, 5], 3)).toBe(2)
    })

    it('returns -1 for not found', () => {
      expect(binarySearch([1, 2, 3, 4, 5], 6)).toBe(-1)
    })
  })

  describe('isEmpty', () => {
    it('checks empty values', () => {
      expect(isEmpty(null)).toBe(true)
      expect(isEmpty(undefined)).toBe(true)
      expect(isEmpty('')).toBe(true)
      expect(isEmpty([])).toBe(true)
      expect(isEmpty({})).toBe(true)
      expect(isEmpty('hello')).toBe(false)
      expect(isEmpty([1])).toBe(false)
    })
  })
})
