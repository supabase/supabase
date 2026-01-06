import { describe, it, expect } from 'vitest'
import { EMPTY_OBJ, EMPTY_ARR, noop } from './void'

describe('void', () => {
  describe('EMPTY_OBJ', () => {
    it('should be an empty object', () => {
      expect(EMPTY_OBJ).toEqual({})
      expect(Object.keys(EMPTY_OBJ)).toHaveLength(0)
    })

    it('should be the same reference when imported multiple times', async () => {
      const { EMPTY_OBJ: obj1 } = await import('./void')
      const { EMPTY_OBJ: obj2 } = await import('./void')
      expect(obj1).toBe(obj2)
    })
  })

  describe('EMPTY_ARR', () => {
    it('should be an empty array', () => {
      expect(EMPTY_ARR).toEqual([])
      expect(EMPTY_ARR).toHaveLength(0)
    })

    it('should be the same reference when imported multiple times', async () => {
      const { EMPTY_ARR: arr1 } = await import('./void')
      const { EMPTY_ARR: arr2 } = await import('./void')
      expect(arr1).toBe(arr2)
    })
  })

  describe('noop', () => {
    it('should be a function', () => {
      expect(typeof noop).toBe('function')
    })

    it('should return undefined when called', () => {
      expect(noop()).toBeUndefined()
    })

    it('should accept any arguments without throwing', () => {
      expect(() => noop(1, 2, 3)).not.toThrow()
      expect(() => noop('test', {}, [])).not.toThrow()
      expect(() => noop()).not.toThrow()
    })
  })
})

