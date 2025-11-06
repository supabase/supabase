import { describe, it, expect, vi } from 'vitest'

import { toServiceStatsMap } from './ProjectUsageSection.utils'
import type { ProjectMetricsByService } from 'data/analytics/project-metrics-query'

const makeDatum = (n: number) => ({
  timestamp: new Date(1700000000000 + n * 60000).toISOString(),
  ok_count: n,
  warning_count: 0,
  error_count: 0,
})

const emptyData: ProjectMetricsByService = {
  db: { current: [], previous: [] },
  functions: { current: [], previous: [] },
  auth: { current: [], previous: [] },
  storage: { current: [], previous: [] },
  realtime: { current: [], previous: [] },
}

describe('toServiceStatsMap', () => {
  it('returns empty arrays when no data', () => {
    const onRefresh = vi.fn()
    const map = toServiceStatsMap({
      data: emptyData,
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
    const data: ProjectMetricsByService = {
      ...emptyData,
      db: { current: [makeDatum(1), makeDatum(2)], previous: [makeDatum(0)] },
    }
    const map = toServiceStatsMap({ data, isLoading: true, error: undefined, onRefresh: () => {} })

    expect(map.db.current.eventChartData.length).toBe(2)
    expect(map.db.previous.eventChartData.length).toBe(1)
    expect(map.db.current.isLoading).toBe(true)
  })

  it('propagates errors to all services', () => {
    const err = new Error('boom')
    const map = toServiceStatsMap({
      data: emptyData,
      isLoading: false,
      error: err,
      onRefresh: () => {},
    })

    expect(map.db.current.error).toBe(err)
    expect(map.functions.previous.error).toBe(err)
  })
})
