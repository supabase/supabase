import { describe, expect, it } from 'vitest'

import { DatabaseFormSchema } from './PerformanceSettingsForm'

describe('DatabaseFormSchema', () => {
  describe('percent unit', () => {
    it('accepts 1 (lower bound)', () => {
      const result = DatabaseFormSchema.safeParse({
        DB_MAX_POOL_SIZE: 1,
        DB_MAX_POOL_SIZE_UNIT: 'percent',
      })
      expect(result.success).toBe(true)
    })

    it('accepts 100 (upper bound)', () => {
      const result = DatabaseFormSchema.safeParse({
        DB_MAX_POOL_SIZE: 100,
        DB_MAX_POOL_SIZE_UNIT: 'percent',
      })
      expect(result.success).toBe(true)
    })

    it('accepts a mid-range value', () => {
      const result = DatabaseFormSchema.safeParse({
        DB_MAX_POOL_SIZE: 50,
        DB_MAX_POOL_SIZE_UNIT: 'percent',
      })
      expect(result.success).toBe(true)
    })

    it('rejects 0', () => {
      const result = DatabaseFormSchema.safeParse({
        DB_MAX_POOL_SIZE: 0,
        DB_MAX_POOL_SIZE_UNIT: 'percent',
      })
      expect(result.success).toBe(false)
    })

    it('rejects 101', () => {
      const result = DatabaseFormSchema.safeParse({
        DB_MAX_POOL_SIZE: 101,
        DB_MAX_POOL_SIZE_UNIT: 'percent',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'DB_MAX_POOL_SIZE')
        expect(issue?.message).toBe('Percentage must be between 1 and 100')
      }
    })

    it('rejects negative values', () => {
      const result = DatabaseFormSchema.safeParse({
        DB_MAX_POOL_SIZE: -5,
        DB_MAX_POOL_SIZE_UNIT: 'percent',
      })
      expect(result.success).toBe(false)
    })

    it('coerces string input', () => {
      const result = DatabaseFormSchema.safeParse({
        DB_MAX_POOL_SIZE: '75',
        DB_MAX_POOL_SIZE_UNIT: 'percent',
      })
      expect(result.success).toBe(true)
    })

    it('rejects out-of-range string input', () => {
      const result = DatabaseFormSchema.safeParse({
        DB_MAX_POOL_SIZE: '150',
        DB_MAX_POOL_SIZE_UNIT: 'percent',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('connections unit', () => {
    it('accepts 1 (min)', () => {
      const result = DatabaseFormSchema.safeParse({
        DB_MAX_POOL_SIZE: 1,
        DB_MAX_POOL_SIZE_UNIT: 'connections',
      })
      expect(result.success).toBe(true)
    })

    it('accepts values above 100 (no upper schema bound for absolute)', () => {
      const result = DatabaseFormSchema.safeParse({
        DB_MAX_POOL_SIZE: 500,
        DB_MAX_POOL_SIZE_UNIT: 'connections',
      })
      expect(result.success).toBe(true)
    })

    it('rejects 0', () => {
      const result = DatabaseFormSchema.safeParse({
        DB_MAX_POOL_SIZE: 0,
        DB_MAX_POOL_SIZE_UNIT: 'connections',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('unit enum', () => {
    it('rejects unknown unit values', () => {
      const result = DatabaseFormSchema.safeParse({
        DB_MAX_POOL_SIZE: 10,
        DB_MAX_POOL_SIZE_UNIT: 'bytes',
      })
      expect(result.success).toBe(false)
    })
  })
})
