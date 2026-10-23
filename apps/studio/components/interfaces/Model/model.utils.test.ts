import { describe, expect, it } from 'vitest'

import { getModelSeries } from './model.utils'
import type { InfraMonitoringMultiData } from '@/data/analytics/infra-monitoring-query'

const metadata = { format: 'percent', total: 0, totalAverage: 0, yAxisLimit: 100 }
const start = '2026-10-21T08:00:00Z'
const end = '2026-10-21T09:00:00Z'

describe('metric samples', () => {
  it('preserves a real zero and gaps, sorts timestamps, and excludes samples outside the model', () => {
    const response: InfraMonitoringMultiData = {
      ...metadata,
      data: [
        { period_start: end, avg_cpu_usage: '0' },
        { period_start: start, avg_cpu_usage: undefined },
        { period_start: '2026-10-21T08:30:00Z', avg_cpu_usage: 'NaN' },
        { period_start: '2026-10-20T08:00:00Z', avg_cpu_usage: '23' },
        { period_start: 'invalid', avg_cpu_usage: '50' },
      ],
    }
    expect(getModelSeries(response, 'avg_cpu_usage', start, end)).toEqual([
      { time: Date.parse(start) },
      { time: Date.parse('2026-10-21T08:30:00Z') },
      { time: Date.parse(end), value: 0 },
    ])
  })

  it('reads the multi-attribute format without turning an absent metric into zero', () => {
    const response: InfraMonitoringMultiData = {
      series: { avg_cpu_usage: metadata },
      data: [
        { period_start: start, values: { avg_cpu_usage: '24.5' } },
        { period_start: end, values: { avg_cpu_usage: '' } },
      ],
    }
    expect(getModelSeries(response, 'avg_cpu_usage', start, end)).toEqual([
      { time: Date.parse(start), value: 24.5 },
      { time: Date.parse(end) },
    ])
  })
})
