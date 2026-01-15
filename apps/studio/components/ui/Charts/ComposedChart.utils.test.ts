import { describe, expect, it } from 'vitest'
import {
  convertDataPointToPayload,
  resolveHighlightedChartValue,
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

describe('resolveHighlightedChartValue', () => {
  const attributes: MultiAttribute[] = [
    { attribute: 'cpu_system', enabled: true },
    { attribute: 'cpu_user', enabled: true },
    { attribute: 'cpu_max', provider: 'reference-line', isMaxValue: true },
  ]

  const data = [
    { timestamp: 1, cpu_system: 10, cpu_user: 20, cpu_max: 100 },
    { timestamp: 2, cpu_system: 15, cpu_user: 25, cpu_max: 100 },
  ]

  it('returns highlightedValue when no focus and showTotal is false', () => {
    const result = resolveHighlightedChartValue({
      data,
      attributes,
      focusDataIndex: null,
      showTotal: false,
      yAxisKey: 'cpu_system',
      highlightedValue: 999,
      hiddenAttributes: new Set(),
      maxAttributeName: 'cpu_max',
      referenceLineAttributes: ['cpu_max'],
    })

    expect(result).toBe(999)
  })

  it('uses activePayload when focused and showTotal is true', () => {
    const result = resolveHighlightedChartValue({
      data,
      attributes,
      focusDataIndex: 0,
      showTotal: true,
      yAxisKey: 'cpu_system',
      activePayload: [
        { dataKey: 'cpu_system', value: 10 },
        { dataKey: 'cpu_user', value: 20 },
        { dataKey: 'cpu_max', value: 100 },
      ],
      hiddenAttributes: new Set(),
      maxAttributeName: 'cpu_max',
      referenceLineAttributes: ['cpu_max'],
    })

    expect(result).toBe(30)
  })

  it('uses computed payload when activePayload is missing', () => {
    const result = resolveHighlightedChartValue({
      data,
      attributes,
      focusDataIndex: 1,
      showTotal: true,
      yAxisKey: 'cpu_system',
      activePayload: undefined,
      hiddenAttributes: new Set(),
      maxAttributeName: 'cpu_max',
      referenceLineAttributes: ['cpu_max'],
    })

    expect(result).toBe(40)
  })
})
