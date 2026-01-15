import { describe, expect, it } from 'vitest'
import { convertDataPointToPayload, type MultiAttribute } from './ComposedChart.utils'

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
