import { describe, it, expect, vi } from 'vitest'

import { toServiceStatsMap } from './ProjectUsageSection.utils'
import type { ProjectMetricsRow } from 'data/analytics/project-metrics-query'

const mkRow = (
  n: number,
  service: ProjectMetricsRow['service'],
  time_window: ProjectMetricsRow['time_window']
): ProjectMetricsRow => ({
  timestamp: (1700000000000 + n * 60000) * 1000, // microseconds
  service,
  time_window,
  ok_count: n,
  warning_count: 0,
  error_count: 0,
})

const emptyRows: ProjectMetricsRow[] = []

describe('toServiceStatsMap', () => {
  it('returns empty arrays when no data', () => {
    const onRefresh = vi.fn()
    const map = toServiceStatsMap({
      data: emptyRows,
      isLoading: false,
      error: undefined,
      onRefresh,
    })

    expect(map.db.current.eventChartData).toEqual([])
    expect(map.functions.previous.eventChartData).toEqual([])
    expect(map.auth.current.isLoading).toBe(false)
    expect(map.storage.current.error).toBeNull()

    map.realtime.current.refresh()
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('maps data rows through for each service', () => {
    const rows: ProjectMetricsRow[] = [
      mkRow(1, 'db', 'current'),
      mkRow(2, 'db', 'current'),
      mkRow(0, 'db', 'previous'),
    ]
    const map = toServiceStatsMap({
      data: rows,
      isLoading: true,
      error: undefined,
      onRefresh: () => {},
    })

    expect(map.db.current.eventChartData.length).toBe(2)
    expect(map.db.previous.eventChartData.length).toBe(1)
    expect(map.db.current.isLoading).toBe(true)
  })

  it('propagates errors to all services', () => {
    const err = new Error('boom')
    const map = toServiceStatsMap({
      data: emptyRows,
      isLoading: false,
      error: err,
      onRefresh: () => {},
    })

    expect(map.db.current.error).toBe(err)
    expect(map.functions.previous.error).toBe(err)
  })
})
