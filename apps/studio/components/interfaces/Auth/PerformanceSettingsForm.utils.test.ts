import { describe, expect, it } from 'vitest'

import { convertPoolSize, isAllocationUnit } from './PerformanceSettingsForm.utils'

describe('isAllocationUnit', () => {
  it('accepts "percent"', () => {
    expect(isAllocationUnit('percent')).toBe(true)
  })

  it('accepts "connections"', () => {
    expect(isAllocationUnit('connections')).toBe(true)
  })

  it('rejects an empty string', () => {
    expect(isAllocationUnit('')).toBe(false)
  })

  it('rejects undefined', () => {
    expect(isAllocationUnit(undefined)).toBe(false)
  })

  it('rejects null', () => {
    expect(isAllocationUnit(null)).toBe(false)
  })

  it('rejects an unrelated string', () => {
    expect(isAllocationUnit('bytes')).toBe(false)
  })

  it('rejects a non-string value', () => {
    expect(isAllocationUnit(15)).toBe(false)
  })
})

describe('convertPoolSize', () => {
  it('returns the value unchanged when the unit does not change', () => {
    expect(
      convertPoolSize({
        fromUnit: 'percent',
        toUnit: 'percent',
        currentValue: 15,
        maxConnectionLimit: 60,
      })
    ).toBe(15)
  })

  it('converts connections to percent, rounding up', () => {
    // Matches the original customer report: 10 connections out of 60 -> 17%
    expect(
      convertPoolSize({
        fromUnit: 'connections',
        toUnit: 'percent',
        currentValue: 10,
        maxConnectionLimit: 60,
      })
    ).toBe(17)
  })

  it('converts percent to connections, rounding down', () => {
    // Matches the reproduction: 15% of 60 -> 9 connections
    expect(
      convertPoolSize({
        fromUnit: 'percent',
        toUnit: 'connections',
        currentValue: 15,
        maxConnectionLimit: 60,
      })
    ).toBe(9)
  })

  it('clamps a connections value above the max when converting to percent', () => {
    expect(
      convertPoolSize({
        fromUnit: 'connections',
        toUnit: 'percent',
        currentValue: 100,
        maxConnectionLimit: 60,
      })
    ).toBe(100)
  })

  it('clamps a percent value above 100 when converting to connections', () => {
    expect(
      convertPoolSize({
        fromUnit: 'percent',
        toUnit: 'connections',
        currentValue: 150,
        maxConnectionLimit: 60,
      })
    ).toBe(60)
  })

  it('handles a zero value', () => {
    expect(
      convertPoolSize({
        fromUnit: 'connections',
        toUnit: 'percent',
        currentValue: 0,
        maxConnectionLimit: 60,
      })
    ).toBe(0)
  })
})
