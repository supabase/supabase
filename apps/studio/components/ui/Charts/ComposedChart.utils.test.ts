import { describe, expect, it } from 'vitest'
import {
  convertDataPointToPayload,
  normalizeToPercentageStacking,
  selectStackedAttributeKeys,
  transformDataForStacking,
  type MultiAttribute,
} from './ComposedChart.utils'

describe('convertDataPointToPayload', () => {
  it('should convert data point to payload format', () => {
    const dataPoint = {
      timestamp: 1704067200000,
      period_start: '2024-01-01',
      cpu_system: 20,
      cpu_user: 30,
      cpu_other: 50,
    }
    const attributes: MultiAttribute[] = [
      { attribute: 'cpu_system', enabled: true },
      { attribute: 'cpu_user', enabled: true },
      { attribute: 'cpu_other', enabled: true },
    ]

    const result = convertDataPointToPayload(dataPoint, attributes)

    expect(result).toEqual([
      { dataKey: 'cpu_system', value: 20 },
      { dataKey: 'cpu_user', value: 30 },
      { dataKey: 'cpu_other', value: 50 },
    ])
  })

  it('should filter out timestamp and period_start fields', () => {
    const dataPoint = {
      timestamp: 1704067200000,
      period_start: '2024-01-01',
      cpu_system: 20,
      cpu_user: 30,
    }
    const attributes: MultiAttribute[] = [
      { attribute: 'cpu_system', enabled: true },
      { attribute: 'cpu_user', enabled: true },
    ]

    const result = convertDataPointToPayload(dataPoint, attributes)

    expect(result?.some((p) => p.dataKey === 'timestamp')).toBe(false)
    expect(result?.some((p) => p.dataKey === 'period_start')).toBe(false)
    expect(result?.length).toBe(2)
  })

  it('should only include enabled attributes', () => {
    const dataPoint = {
      cpu_system: 20,
      cpu_user: 30,
      cpu_other: 50,
    }
    const attributes: MultiAttribute[] = [
      { attribute: 'cpu_system', enabled: true },
      { attribute: 'cpu_user', enabled: false },
      { attribute: 'cpu_other', enabled: true },
    ]

    const result = convertDataPointToPayload(dataPoint, attributes)

    expect(result?.length).toBe(2)
    expect(result?.some((p) => p.dataKey === 'cpu_system')).toBe(true)
    expect(result?.some((p) => p.dataKey === 'cpu_user')).toBe(false)
    expect(result?.some((p) => p.dataKey === 'cpu_other')).toBe(true)
  })

  it('should include attributes when enabled is undefined', () => {
    const dataPoint = {
      cpu_system: 20,
      cpu_user: 30,
    }
    const attributes: MultiAttribute[] = [
      { attribute: 'cpu_system' },
      { attribute: 'cpu_user', enabled: false },
    ]

    const result = convertDataPointToPayload(dataPoint, attributes)

    expect(result?.length).toBe(1)
    expect(result?.some((p) => p.dataKey === 'cpu_system')).toBe(true)
  })

  it('should return undefined for undefined data point', () => {
    const attributes: MultiAttribute[] = [{ attribute: 'cpu_system', enabled: true }]

    const result = convertDataPointToPayload(undefined, attributes)

    expect(result).toBeUndefined()
  })

  it('should handle empty attributes array', () => {
    const dataPoint = {
      cpu_system: 20,
      cpu_user: 30,
    }
    const attributes: MultiAttribute[] = []

    const result = convertDataPointToPayload(dataPoint, attributes)

    expect(result).toEqual([])
  })

  it('should filter out attributes not in the attributes list', () => {
    const dataPoint = {
      cpu_system: 20,
      cpu_user: 30,
      unknown_field: 100,
    }
    const attributes: MultiAttribute[] = [
      { attribute: 'cpu_system', enabled: true },
      { attribute: 'cpu_user', enabled: true },
    ]

    const result = convertDataPointToPayload(dataPoint, attributes)

    expect(result?.length).toBe(2)
    expect(result?.some((p) => p.dataKey === 'unknown_field')).toBe(false)
  })

  it('should handle numeric values correctly', () => {
    const dataPoint = {
      cpu_system: 20.5,
      cpu_user: 30.75,
    }
    const attributes: MultiAttribute[] = [
      { attribute: 'cpu_system', enabled: true },
      { attribute: 'cpu_user', enabled: true },
    ]

    const result = convertDataPointToPayload(dataPoint, attributes)

    expect(result).toEqual([
      { dataKey: 'cpu_system', value: 20.5 },
      { dataKey: 'cpu_user', value: 30.75 },
    ])
  })
})

describe('normalizeToPercentageStacking', () => {
  it('keeps values unchanged when total is exactly 100%', () => {
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

  it('keeps values unchanged when total is below 100%', () => {
    const data = [{ timestamp: 1, cpu_system: 5, cpu_user: 10, cpu_other: 35 }]
    const attributeKeys = ['cpu_system', 'cpu_user', 'cpu_other']

    const result: typeof data = normalizeToPercentageStacking(data, attributeKeys)

    expect(result[0].cpu_system).toBe(5)
    expect(result[0].cpu_user).toBe(10)
    expect(result[0].cpu_other).toBe(35)
  })

  it('normalizes values exceeding 100% (multi-core CPU)', () => {
    const data = [{ timestamp: 1, cpu_system: 40, cpu_user: 60, cpu_other: 100 }]
    const attributeKeys = ['cpu_system', 'cpu_user', 'cpu_other']

    const result: typeof data = normalizeToPercentageStacking(data, attributeKeys)

    expect(result[0].cpu_system).toBe(20)
    expect(result[0].cpu_user).toBe(30)
    expect(result[0].cpu_other).toBe(50)
    expect(result[0].cpu_system + result[0].cpu_user + result[0].cpu_other).toBe(100)
  })

  it('normalizes 2-core CPU at 150% to 100%', () => {
    const data = [{ timestamp: 1, cpu_system: 30, cpu_user: 60, cpu_iowait: 60 }]
    const attributeKeys = ['cpu_system', 'cpu_user', 'cpu_iowait']

    const result: typeof data = normalizeToPercentageStacking(data, attributeKeys)

    expect(result[0].cpu_system).toBe(20)
    expect(result[0].cpu_user).toBe(40)
    expect(result[0].cpu_iowait).toBe(40)
    expect(result[0].cpu_system + result[0].cpu_user + result[0].cpu_iowait).toBe(100)
  })

  it('preserves non-attribute fields unchanged', () => {
    const data = [
      { timestamp: 1704067200000, period_start: '2024-01-01', cpu_system: 80, cpu_user: 120 },
    ]
    const attributeKeys = ['cpu_system', 'cpu_user']

    const result: typeof data = normalizeToPercentageStacking(data, attributeKeys)

    expect(result[0].timestamp).toBe(1704067200000)
    expect(result[0].period_start).toBe('2024-01-01')
  })

  it('handles data points with zero total gracefully', () => {
    const data = [{ timestamp: 1, cpu_system: 0, cpu_user: 0, cpu_other: 0 }]
    const attributeKeys = ['cpu_system', 'cpu_user', 'cpu_other']

    const result = normalizeToPercentageStacking(data, attributeKeys)

    expect(result[0].cpu_system).toBe(0)
    expect(result[0].cpu_user).toBe(0)
    expect(result[0].cpu_other).toBe(0)
  })

  it('handles empty data array', () => {
    const data: Array<Record<string, number>> = []
    const attributeKeys = ['cpu_system', 'cpu_user']

    const result: typeof data = normalizeToPercentageStacking(data, attributeKeys)

    expect(result).toEqual([])
  })

  it('keeps values unchanged when single attribute is below 100%', () => {
    const data = [{ timestamp: 1, cpu_system: 60 }]
    const attributeKeys = ['cpu_system', 'cpu_user']

    const result = normalizeToPercentageStacking(data, attributeKeys)

    expect(result[0].cpu_system).toBe(60)
    expect((result[0] as Record<string, unknown>).cpu_user).toBeUndefined()
  })

  it('maintains proportions when normalizing values over 100%', () => {
    const data = [{ timestamp: 1, a: 100, b: 200, c: 300 }]
    const attributeKeys = ['a', 'b', 'c']

    const result: typeof data = normalizeToPercentageStacking(data, attributeKeys)

    const ratioAB = result[0].a / result[0].b
    const ratioBC = result[0].b / result[0].c

    expect(ratioAB).toBeCloseTo(0.5)
    expect(ratioBC).toBeCloseTo(2 / 3)
    expect(result[0].a + result[0].b + result[0].c).toBe(100)
  })
})

describe('selectStackedAttributeKeys', () => {
  it('filters out reference lines, max values, disabled and special attributes', () => {
    const attributes: MultiAttribute[] = [
      { attribute: 'a', enabled: true },
      { attribute: 'b', enabled: false },
      { attribute: 'c', provider: 'reference-line' },
      { attribute: 'd', isMaxValue: true },
      { attribute: 'rest' },
      { attribute: 'e' },
    ]

    const keys = selectStackedAttributeKeys(attributes)
    expect(keys).toEqual(['a', 'e'])
  })
})

describe('transformDataForStacking', () => {
  it('returns input when stackingMode is normal', () => {
    const data = [{ a: 1, b: 2 }]
    const attributes: MultiAttribute[] = [{ attribute: 'a' }, { attribute: 'b' }]

    const result = transformDataForStacking(data, attributes, 'normal')
    expect(result).toEqual(data)
  })

  it('normalizes data when stackingMode is percentage', () => {
    const data = [{ timestamp: 1, a: 100, b: 200 }]
    const attributes: MultiAttribute[] = [{ attribute: 'a' }, { attribute: 'b' }]

    const result = transformDataForStacking(data, attributes, 'percentage')!
    expect(result[0].a + result[0].b).toBe(100)
  })

  it('handles undefined or empty data gracefully', () => {
    const attributes: MultiAttribute[] = [{ attribute: 'a' }]
    expect(transformDataForStacking(undefined, attributes, 'percentage')).toBeUndefined()
    expect(transformDataForStacking([], attributes, 'percentage')).toEqual([])
  })
})
