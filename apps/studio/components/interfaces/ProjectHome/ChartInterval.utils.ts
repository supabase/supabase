import type { ChartIntervalKey } from './ProjectUsage.metrics'
import { CHART_INTERVALS, getDaysRequired } from '@/components/ui/Logs/logs.utils'

export const isChartIntervalKey = (value: unknown): value is ChartIntervalKey =>
  value === '1hr' || value === '1day' || value === '7day'

export const getDefaultChartInterval = (retentionDays: number | undefined): ChartIntervalKey =>
  retentionDays !== undefined && retentionDays < 7 ? '1hr' : '1day'

/**
 * Returns the stored interval if it's valid and allowed by the plan's log retention,
 * otherwise the plan default.
 */
export const resolveChartInterval = (
  storedInterval: unknown,
  retentionDays: number | undefined
): ChartIntervalKey => {
  if (isChartIntervalKey(storedInterval)) {
    const interval = CHART_INTERVALS.find((i) => i.key === storedInterval)
    const isAllowed =
      interval !== undefined &&
      (retentionDays === undefined ||
        getDaysRequired(interval.startValue, interval.startUnit) <= retentionDays)
    if (isAllowed) return storedInterval
  }
  return getDefaultChartInterval(retentionDays)
}
