import dayjs from 'dayjs'
import { describe, expect, test } from 'vitest'

import { REPORT_DATERANGE_HELPER_LABELS } from '@/components/interfaces/Reports/Reports.constants'
import { analyticsIntervalToGranularity } from '@/data/reports/report.utils'
import { getIntervalGranularity, resolveHelperFromUrl } from '@/hooks/misc/useReportDateRange'

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

describe('resolveHelperFromUrl', () => {
  test('returns the helper named by the URL when the helper flag is set', () => {
    expect(resolveHelperFromUrl(true, 'Last 3 hours')?.text).toBe(
      REPORT_DATERANGE_HELPER_LABELS.LAST_3_HOURS
    )
  })

  test('ignores the label when the helper flag is off', () => {
    expect(resolveHelperFromUrl(false, 'Last 3 hours')).toBeUndefined()
  })

  test('ignores labels that are not a known helper', () => {
    expect(resolveHelperFromUrl(true, 'Last 3 fortnights')).toBeUndefined()
  })
})
