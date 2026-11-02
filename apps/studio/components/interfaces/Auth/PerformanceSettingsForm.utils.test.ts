import { describe, expect, it, test } from 'vitest'

import { convertPoolSize, isAllocationUnit } from './PerformanceSettingsForm.utils'

describe('isAllocationUnit', () => {
  test.each([
    ['percent', true],
    ['connections', true],
    ['', false],
    [undefined, false],
    [null, false],
    ['bytes', false],
    [15, false],
  ])('%s -> %s', (value, expected) => {
    expect(isAllocationUnit(value)).toBe(expected)
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
