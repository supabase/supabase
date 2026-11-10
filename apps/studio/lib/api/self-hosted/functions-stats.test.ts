import { describe, expect, it } from 'vitest'

import { combineFunctionsStats, getFunctionsStatsParams } from './functions-stats'
import {
  getExecutionMetrics,
  getUsageMetrics,
  toEdgeFunctionChartData,
} from '@/components/interfaces/Functions/EdgeFunctionOverview/EdgeFunctionOverview.utils'

const timestamp = 1794231480000000
const requests = {
  timestamp,
  requests_count: '2',
  worker_count: 0,
  success_count: 1,
  redirect_count: 0,
  client_err_count: 0,
  server_err_count: 1,
  avg_execution_time: '20',
  max_execution_time: '30',
  avg_cpu_time_used: null,
  max_cpu_time_used: null,
  avg_memory_used: null,
  avg_heap_memory_used: null,
  avg_external_memory_used: null,
}
const worker = {
  ...requests,
  requests_count: '0',
  worker_count: 1,
  success_count: 0,
  server_err_count: 0,
  avg_execution_time: null,
  max_execution_time: null,
  avg_cpu_time_used: '12',
  max_cpu_time_used: '12',
  avg_memory_used: '10',
  avg_heap_memory_used: '6',
  avg_external_memory_used: '4',
}

describe('self-hosted function stats', () => {
  it('queries bounded request and Shutdown aggregates separately', () => {
    const now = new Date('2026-11-09T14:00:00Z')
    const params = getFunctionsStatsParams({ function_id: "hello'", interval: '1hr' }, now)
    expect(params).toHaveLength(2)
    expect(params[0].iso_timestamp_start).toBe('2026-11-09T13:00:00.000Z')
    expect(params[0].sql).toContain("m.function_id = 'hello'''")
    expect(params[1].sql).toContain("runtime_metadata.event_type = 'Shutdown'")
    for (const { sql } of params) {
      expect(sql).not.toMatch(/\bWITH\b|UNION ALL/)
      expect(sql).toContain('LIMIT 1441')
    }
    expect(() => getFunctionsStatsParams({ function_id: 'hello', interval: 'all' })).toThrow()
  })

  it('combines matching buckets without counting worker events as requests', () => {
    const result = combineFunctionsStats([worker, requests])
    expect(result).toEqual([
      {
        ...worker,
        timestamp: '2026-11-09T13:38:00.000Z',
        requests_count: 2,
        worker_count: 1,
        success_count: 1,
        server_err_count: 1,
        avg_execution_time: 20,
        max_execution_time: 30,
        avg_cpu_time_used: 12,
        max_cpu_time_used: 12,
        avg_memory_used: 10,
        avg_heap_memory_used: 6,
        avg_external_memory_used: 4,
      },
    ])
    expect(combineFunctionsStats([requests])[0].avg_cpu_time_used).toBeNull()
    expect(() => combineFunctionsStats([{ ...requests, timestamp: 'invalid' }])).toThrow()
  })

  it('weights summaries by request and worker samples rather than buckets', () => {
    const data = toEdgeFunctionChartData([
      {
        timestamp: 'a',
        requests_count: 1,
        worker_count: 1,
        avg_execution_time: 10,
        avg_cpu_time_used: 10,
      },
      {
        timestamp: 'b',
        requests_count: 3,
        worker_count: 3,
        avg_execution_time: 30,
        avg_cpu_time_used: 30,
      },
      { timestamp: 'c', requests_count: 0, worker_count: 0 },
    ])
    expect(getExecutionMetrics(data).averageExecutionTime).toBe(25)
    expect(getUsageMetrics(data).averageCpuTime).toBe(25)
  })
})
