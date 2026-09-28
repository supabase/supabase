import { describe, expect, it } from 'vitest'

import type { InfraMonitoringMultiResponse } from '@/data/analytics/infra-monitoring-query'
import {
  COMPUTE_METRICS_ATTRIBUTES,
  getComputeMetricAvailability,
} from '@/hooks/analytics/useComputeMetrics.utils'

function createMetricsResponse(): InfraMonitoringMultiResponse {
  return {
    data: [],
    series: Object.fromEntries(
      COMPUTE_METRICS_ATTRIBUTES.map((attribute) => [
        attribute,
        { yAxisLimit: 100, format: '', total: 0, totalAverage: 0 },
      ])
    ),
  }
}

const allAvailable = { cpu: true, memory: true, disk: true, connections: true }

describe('getComputeMetricAvailability', () => {
  it('keeps successful zero values available', () => {
    expect(getComputeMetricAvailability(createMetricsResponse())).toEqual(allAvailable)
  })

  it.each([
    ['avg_cpu_usage', 'cpu'],
    ['ram_usage', 'memory'],
    ['disk_fs_used_system', 'disk'],
    ['disk_fs_used_wal', 'disk'],
    ['pg_database_size', 'disk'],
    ['disk_fs_size', 'disk'],
    ['pg_stat_database_num_backends', 'connections'],
  ])(
    'only marks the affected metric unavailable when %s fails or is missing',
    (attribute, metric) => {
      const response = createMetricsResponse()
      response.errors = { [attribute]: { message: 'Failed to load attribute' } }
      expect(getComputeMetricAvailability(response)).toEqual({ ...allAvailable, [metric]: false })

      delete response.errors
      delete response.series[attribute]
      expect(getComputeMetricAvailability(response)).toEqual({ ...allAvailable, [metric]: false })
    }
  )

  it('ignores errors for unrelated attributes', () => {
    const response = createMetricsResponse()
    response.errors = { disk_io_consumption: { message: 'Failed to load attribute' } }
    expect(getComputeMetricAvailability(response)).toEqual(allAvailable)
  })

  it.each([undefined, { data: [], series: {} }])('handles absent metrics', (response) => {
    expect(getComputeMetricAvailability(response)).toEqual({
      cpu: false,
      memory: false,
      disk: false,
      connections: false,
    })
  })

  it('handles a response without multi-attribute series', () => {
    expect(
      getComputeMetricAvailability({
        data: [],
        yAxisLimit: 100,
        format: '',
        total: 0,
        totalAverage: 0,
      })
    ).toEqual({ cpu: false, memory: false, disk: false, connections: false })
  })
})
