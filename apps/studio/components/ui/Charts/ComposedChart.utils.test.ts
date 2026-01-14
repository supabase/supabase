import { describe, expect, it } from 'vitest'
import { normalizeToPercentageStacking } from './ComposedChart.utils'

describe('normalizeToPercentageStacking', () => {
  it('should keep values unchanged when total is exactly 100%', () => {
    const data = [
      { timestamp: 1, cpu_system: 20, cpu_user: 30, cpu_other: 50 },
      { timestamp: 2, cpu_system: 10, cpu_user: 40, cpu_other: 50 },
    ]
    const attributeKeys = ['cpu_system', 'cpu_user', 'cpu_other']

    const result: typeof data = normalizeToPercentageStacking(data, attributeKeys)

    expect(result[0].cpu_system).toBe(20)
    expect(result[0].cpu_user).toBe(30)
    expect(result[0].cpu_other).toBe(50)

    expect(result[1].cpu_system).toBe(10)
    expect(result[1].cpu_user).toBe(40)
    expect(result[1].cpu_other).toBe(50)
  })

  it('should keep values unchanged when total is below 100%', () => {
    const data = [{ timestamp: 1, cpu_system: 5, cpu_user: 10, cpu_other: 35 }]
    const attributeKeys = ['cpu_system', 'cpu_user', 'cpu_other']

    const result: typeof data = normalizeToPercentageStacking(data, attributeKeys)

    expect(result[0].cpu_system).toBe(5)
    expect(result[0].cpu_user).toBe(10)
    expect(result[0].cpu_other).toBe(35)
  })

  it('should normalize values exceeding 100% (multi-core CPU)', () => {
    const data = [{ timestamp: 1, cpu_system: 40, cpu_user: 60, cpu_other: 100 }]
    const attributeKeys = ['cpu_system', 'cpu_user', 'cpu_other']

    const result: typeof data = normalizeToPercentageStacking(data, attributeKeys)

    expect(result[0].cpu_system).toBe(20)
    expect(result[0].cpu_user).toBe(30)
    expect(result[0].cpu_other).toBe(50)
    expect(result[0].cpu_system + result[0].cpu_user + result[0].cpu_other).toBe(100)
  })

  it('should normalize 2-core CPU at 150% to 100%', () => {
    const data = [{ timestamp: 1, cpu_system: 30, cpu_user: 60, cpu_iowait: 60 }]
    const attributeKeys = ['cpu_system', 'cpu_user', 'cpu_iowait']

    const result: typeof data = normalizeToPercentageStacking(data, attributeKeys)

    expect(result[0].cpu_system).toBe(20)
    expect(result[0].cpu_user).toBe(40)
    expect(result[0].cpu_iowait).toBe(40)
    expect(result[0].cpu_system + result[0].cpu_user + result[0].cpu_iowait).toBe(100)
  })

  it('should preserve non-attribute fields unchanged', () => {
    const data = [
      { timestamp: 1704067200000, period_start: '2024-01-01', cpu_system: 80, cpu_user: 120 },
    ]
    const attributeKeys = ['cpu_system', 'cpu_user']

    const result: typeof data = normalizeToPercentageStacking(data, attributeKeys)

    expect(result[0].timestamp).toBe(1704067200000)
    expect(result[0].period_start).toBe('2024-01-01')
  })

  it('should handle data points with zero total gracefully', () => {
    const data = [{ timestamp: 1, cpu_system: 0, cpu_user: 0, cpu_other: 0 }]
    const attributeKeys = ['cpu_system', 'cpu_user', 'cpu_other']

    const result = normalizeToPercentageStacking(data, attributeKeys)

    expect(result[0].cpu_system).toBe(0)
    expect(result[0].cpu_user).toBe(0)
    expect(result[0].cpu_other).toBe(0)
    expect(result[0].rest).toBe(100)
  })

  it('should handle empty data array', () => {
    const data: Array<Record<string, number>> = []
    const attributeKeys = ['cpu_system', 'cpu_user']

    const result: typeof data = normalizeToPercentageStacking(data, attributeKeys)

    expect(result).toEqual([])
  })

  it('should keep values unchanged when single attribute is below 100%', () => {
    const data = [{ timestamp: 1, cpu_system: 60 }]
    const attributeKeys = ['cpu_system', 'cpu_user']

    const result = normalizeToPercentageStacking(data, attributeKeys)

    expect(result[0].cpu_system).toBe(60)
    expect((result[0] as Record<string, unknown>).cpu_user).toBeUndefined()
  })

  it('should maintain proportions when normalizing values over 100%', () => {
    const data = [{ timestamp: 1, a: 100, b: 200, c: 300 }]
    const attributeKeys = ['a', 'b', 'c']

    const result: typeof data = normalizeToPercentageStacking(data, attributeKeys)

    const ratioAB = result[0].a / result[0].b
    const ratioBC = result[0].b / result[0].c

    expect(ratioAB).toBeCloseTo(0.5)
    expect(ratioBC).toBeCloseTo(2 / 3)
    expect(result[0].a + result[0].b + result[0].c).toBe(100)
  })

  it('should fill the result with a `rest` value that captures the difference between 100% and the sum of the other values', () => {
    const data = [{ timestamp: 1, a: 10, b: 10, c: 10 }]
    const attributeKeys = ['a', 'b', 'c']

    const result = normalizeToPercentageStacking(data, attributeKeys)

    expect(result[0].a).toBe(10)
    expect(result[0].b).toBe(10)
    expect(result[0].c).toBe(10)
    expect(result[0].rest).toBe(70)
  })

  it('should not fill the result with a `rest` value if `includeRestValue` is false', () => {
    const data = [{ timestamp: 1, a: 10, b: 10, c: 10 }]
    const attributeKeys = ['a', 'b', 'c']

    const result = normalizeToPercentageStacking(data, attributeKeys, false)

    expect(result[0].a).toBe(10)
    expect(result[0].b).toBe(10)
    expect(result[0].c).toBe(10)
    expect(result[0].rest).toBeUndefined()
  })
})
