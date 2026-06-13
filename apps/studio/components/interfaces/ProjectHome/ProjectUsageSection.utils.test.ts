import { describe, expect, it, vi } from 'vitest'

import { toServiceStatsMap } from './ProjectUsageSection.utils'
import type { ProjectMetricsRow } from '@/data/analytics/project-metrics-query'

const mkRow = (overrides: Partial<ProjectMetricsRow>): ProjectMetricsRow => ({
  // 2025-10-22T13:00:00Z in microseconds
  timestamp: 1761138000_000_000,
  service: 'db',
  time_window: 'current',
  ok_count: 0,
  warning_count: 0,
  error_count: 0,
  ...overrides,
})

describe('toServiceStatsMap', () => {
  it('returns empty series for every service when there is no data', () => {
    const map = toServiceStatsMap({ isLoading: false, onRefresh: () => {} })
    for (const key of ['db', 'functions', 'auth', 'storage', 'realtime'] as const) {
      expect(map[key].current.eventChartData).toEqual([])
      expect(map[key].previous.eventChartData).toEqual([])
    }
  })

  it('partitions rows by service and time_window', () => {
    const rows: ProjectMetricsRow[] = [
      mkRow({ service: 'db', time_window: 'current', ok_count: 10 }),
      mkRow({ service: 'db', time_window: 'previous', ok_count: 5 }),
      mkRow({ service: 'auth', time_window: 'current', ok_count: 7 }),
    ]

    const map = toServiceStatsMap({ data: rows, isLoading: false, onRefresh: () => {} })

    expect(map.db.current.eventChartData).toHaveLength(1)
    expect(map.db.current.eventChartData[0].ok_count).toBe(10)
    expect(map.db.previous.eventChartData).toHaveLength(1)
    expect(map.db.previous.eventChartData[0].ok_count).toBe(5)
    expect(map.auth.current.eventChartData).toHaveLength(1)
    expect(map.auth.previous.eventChartData).toHaveLength(0)
    expect(map.functions.current.eventChartData).toHaveLength(0)
  })

  it('converts microsecond timestamps to ISO strings', () => {
    const rows: ProjectMetricsRow[] = [mkRow({ timestamp: 1761138000_000_000, ok_count: 1 })]
    const map = toServiceStatsMap({ data: rows, isLoading: false, onRefresh: () => {} })
    expect(map.db.current.eventChartData[0].timestamp).toBe('2025-10-22T13:00:00.000Z')
  })

  it('sorts each series chronologically', () => {
    const later = 1761138000_000_000
    const earlier = 1761134400_000_000
    const rows: ProjectMetricsRow[] = [
      mkRow({ timestamp: later, ok_count: 2 }),
      mkRow({ timestamp: earlier, ok_count: 1 }),
    ]
    const map = toServiceStatsMap({ data: rows, isLoading: false, onRefresh: () => {} })
    expect(map.db.current.eventChartData.map((p) => p.ok_count)).toEqual([1, 2])
  })

  it('propagates loading and error state to every service', () => {
    const err = new Error('boom')
    const map = toServiceStatsMap({ isLoading: true, error: err, onRefresh: () => {} })
    expect(map.db.current.isLoading).toBe(true)
    expect(map.db.current.error).toBe(err)
    expect(map.realtime.previous.isLoading).toBe(true)
  })

  it('wires refresh through to onRefresh', () => {
    const onRefresh = vi.fn()
    const map = toServiceStatsMap({ isLoading: false, onRefresh })
    map.db.current.refresh()
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('skips rows for unknown services without throwing', () => {
    const rows = [mkRow({ service: 'unknown' as any })]
    expect(() =>
      toServiceStatsMap({ data: rows, isLoading: false, onRefresh: () => {} })
    ).not.toThrow()
  })
})
