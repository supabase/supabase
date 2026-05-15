import { describe, expect, it } from 'vitest'

import { EMPTY_ARR, EMPTY_OBJ, noop } from './void'

describe('void utilities', () => {
  describe('noop', () => {
    it('should return undefined', () => {
      expect(noop()).toBeUndefined()
    })
  })

  describe('EMPTY_OBJ', () => {
    it('should always return the same reference', () => {
      expect(EMPTY_OBJ).toBe(EMPTY_OBJ)
    })

    it('should be an empty object', () => {
      expect(Object.keys(EMPTY_OBJ)).toHaveLength(0)
    })
  })

  describe('EMPTY_ARR', () => {
    it('should always return the same reference', () => {
      expect(EMPTY_ARR).toBe(EMPTY_ARR)
    })

    it('should be an empty array', () => {
      expect(EMPTY_ARR).toHaveLength(0)
    })
  })
})
