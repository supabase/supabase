import { describe, it, expect } from 'vitest'
import { getHealthLevel } from './QueryInsightsHealth.utils'

describe('getHealthLevel', () => {
  it('returns healthy for scores >= 70', () => {
    expect(getHealthLevel(100)).toBe('healthy')
    expect(getHealthLevel(70)).toBe('healthy')
  })

  it('returns warning for scores between 40 and 69', () => {
    expect(getHealthLevel(69)).toBe('warning')
    expect(getHealthLevel(40)).toBe('warning')
  })

  it('returns critical for scores below 40', () => {
    expect(getHealthLevel(39)).toBe('critical')
    expect(getHealthLevel(0)).toBe('critical')
  })
})
