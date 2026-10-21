import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getUnifiedLogsChart } from './unified-logs-chart-query'
import { getUnifiedLogsChartBucket } from './unified-logs-chart.utils'
import { mockLogs, now, search } from './unified-logs.test-utils'
import {
  findMatchingDateHelper,
  formatDateRange,
  formatRelativeDuration,
  generateHelpersFromInput,
} from '@/components/interfaces/Settings/Logs/Logs.datePickerHelpers'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(now)
})
afterEach(() => vi.useRealTimers())

describe('second-resolution logs controls', () => {
  it('keeps helper width exact when the clock advances before resolving its start', () => {
    const helper = generateHelpersFromInput('10s')?.[0]
    const to = helper?.calcTo()
    vi.setSystemTime(now.getTime() + 1)
    expect(helper?.calcFrom(to)).toBe('2026-09-30T11:59:50.000Z')
  })

  it('uses elapsed 48-hour daily buckets across a daylight-saving boundary', async () => {
    vi.setSystemTime('2026-10-26T12:00:00Z')
    const requests = mockLogs([], true)
    const data = await getUnifiedLogsChart({
      projectRef: 'default',
      search: { ...search, durationSeconds: 48 * 3600 },
      useOtel: true,
    })
    expect(requests[0].sql).toContain('toStartOfDay(timestamp)')
    expect(data.map(({ timestamp }) => timestamp)).toEqual([
      Date.parse('2026-10-24T00:00:00Z'),
      Date.parse('2026-10-25T00:00:00Z'),
      Date.parse('2026-10-26T00:00:00Z'),
    ])
    expect(
      getUnifiedLogsChartBucket({
        date: [Date.parse('2026-10-24T12:00:00Z') * 1000, '2026-10-26T12:00:00Z'],
      }).level
    ).toBe('DAY')
  })
  it('distinguishes nearby second ranges and retains seconds in custom labels', () => {
    const helpers = generateHelpersFromInput('10s') ?? []
    expect(findMatchingDateHelper(new Date(now.getTime() - 10_000), now, helpers)).toBe(helpers[0])
    expect(findMatchingDateHelper(new Date(now.getTime() - 20_000), now, helpers)).toBeUndefined()
    expect(findMatchingDateHelper(new Date(now.getTime() - 10_025), now, helpers)).toBeUndefined()
    expect(formatDateRange('2026-09-30T12:00:00Z', '2026-09-30T12:00:10Z')).toMatch(
      /(\d{2}):00:00 - 30 Sep, \1:00:10/
    )
    expect(formatDateRange('2026-09-30T12:00:00Z', '2026-09-30T12:01:15Z')).toMatch(
      /:00:00 - .*:01:15/
    )
    expect(formatDateRange('2026-09-30T12:00:10Z', '2026-09-30T12:01:10Z')).toMatch(
      /:00:10 - .*:01:10/
    )
  })

  it.each([
    [1, 'Last 1 second'],
    [10, 'Last 10 seconds'],
    [600, 'Last 10 minutes'],
    [3600, 'Last 1 hour'],
    [86400, 'Last 1 day'],
  ] as const)('scales %s seconds into a readable label', (seconds, label) =>
    expect(formatRelativeDuration(seconds)).toBe(label)
  )

  it.each([
    [10, 'toStartOfSecond', 1000],
    [59.999, 'toStartOfSecond', 1000],
    [60, 'toStartOfMinute', 60_000],
    [12 * 3600, 'toStartOfHour', 3600_000],
    [48 * 3600, 'toStartOfDay', 86400_000],
  ] as const)(
    'uses matching SQL and zero-fill buckets for a %s-second range',
    async (durationSeconds, sqlFunction, step) => {
      const requests = mockLogs([], true)
      const data = await getUnifiedLogsChart({
        projectRef: 'default',
        search: { ...search, durationSeconds },
        useOtel: true,
      })
      expect(requests[0].sql).toContain(`${sqlFunction}(timestamp)`)
      const start = Math.floor((now.getTime() - durationSeconds * 1000) / step) * step
      expect(data.map(({ timestamp }) => timestamp)).toEqual(
        Array.from(
          { length: Math.floor((now.getTime() - start) / step) + 1 },
          (_, index) => start + index * step
        )
      )
      expect(
        data.every(({ success, warning, error }) => success === 0 && warning === 0 && error === 0)
      ).toBe(true)
    }
  )
})
