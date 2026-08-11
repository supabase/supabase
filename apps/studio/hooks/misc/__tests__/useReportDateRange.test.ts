import dayjs from 'dayjs'
import { describe, expect, test } from 'vitest'

import { analyticsIntervalToGranularity } from '@/data/reports/report.utils'
import { getIntervalGranularity } from '@/hooks/misc/useReportDateRange'

const rangeOf = (value: number, unit: dayjs.ManipulateType) => {
  const to = dayjs()
  return { from: to.subtract(value, unit).toISOString(), to: to.toISOString() }
}

describe('getIntervalGranularity', () => {
  test.each([
    [24, 'hour' as dayjs.ManipulateType, 24],
    [7, 'day' as dayjs.ManipulateType, 168],
  ])('a %s-%s range buckets hourly (FE-4023)', (value, unit, expectedBuckets) => {
    const { from, to } = rangeOf(value, unit)
    const interval = getIntervalGranularity(from, to)

    expect(interval).toBe('1h')
    expect(analyticsIntervalToGranularity(interval)).toBe('hour')
    expect(dayjs(to).diff(from, 'hour')).toBe(expectedBuckets)
  })

  test.each([
    [10, 'minute' as dayjs.ManipulateType, '1m'],
    [1, 'hour' as dayjs.ManipulateType, '1m'],
    [3, 'hour' as dayjs.ManipulateType, '2m'],
    [14, 'day' as dayjs.ManipulateType, '1d'],
    [28, 'day' as dayjs.ManipulateType, '1d'],
  ])('leaves a %s-%s range on the %s interval', (value, unit, expected) => {
    const { from, to } = rangeOf(value, unit)
    expect(getIntervalGranularity(from, to)).toBe(expected)
  })
})
