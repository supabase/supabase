import { describe, it, expect } from 'vitest'
import {
  parseSupamonitorLogs,
  transformLogsToChartData,
  aggregateLogsByQuery,
} from './WithSupamonitor.utils'
import { ParsedLogEntry } from '../QueryPerformance.types'

const makeSampleLog = (overrides: Partial<ParsedLogEntry> = {}): any => ({
  timestamp: '2025-01-01T00:00:00Z',
  application_name: 'test_app',
  calls: 10,
  database_name: 'test_db',
  query: 'SELECT 1',
  query_id: 1,
  total_exec_time: 100,
  total_plan_time: 20,
  user_name: 'postgres',
  mean_exec_time: 10,
  mean_plan_time: 2,
  min_exec_time: 1,
  max_exec_time: 50,
  min_plan_time: 0.5,
  max_plan_time: 5,
  p50_exec_time: 8,
  p95_exec_time: 40,
  p50_plan_time: 1.5,
  p95_plan_time: 4,
  ...overrides,
})

describe('parseSupamonitorLogs', () => {
  it('returns empty array for null or empty input', () => {
    expect(parseSupamonitorLogs(null as any)).toEqual([])
    expect(parseSupamonitorLogs([])).toEqual([])
  })

  it('parses log entries preserving all fields', () => {
    const raw = [makeSampleLog()]
    const result = parseSupamonitorLogs(raw)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      timestamp: '2025-01-01T00:00:00Z',
      application_name: 'test_app',
      calls: 10,
      database_name: 'test_db',
      query: 'SELECT 1',
      query_id: 1,
      total_exec_time: 100,
      total_plan_time: 20,
      user_name: 'postgres',
      mean_exec_time: 10,
      mean_plan_time: 2,
      min_exec_time: 1,
      max_exec_time: 50,
      min_plan_time: 0.5,
      max_plan_time: 5,
      p50_exec_time: 8,
      p95_exec_time: 40,
      p50_plan_time: 1.5,
      p95_plan_time: 4,
    })
  })

  it('handles multiple log entries', () => {
    const raw = [makeSampleLog(), makeSampleLog({ query: 'SELECT 2', query_id: 2 })]
    const result = parseSupamonitorLogs(raw)
    expect(result).toHaveLength(2)
  })
})

describe('transformLogsToChartData', () => {
  it('returns empty array for null or empty input', () => {
    expect(transformLogsToChartData(null as any)).toEqual([])
    expect(transformLogsToChartData([])).toEqual([])
  })

  it('filters out entries with no timestamp', () => {
    const logs: ParsedLogEntry[] = [{ query: 'SELECT 1', calls: 5 }]
    const result = transformLogsToChartData(logs)
    expect(result).toEqual([])
  })

  it('filters out entries with invalid timestamp', () => {
    const logs: ParsedLogEntry[] = [{ timestamp: 'not-a-date', calls: 5 }]
    const result = transformLogsToChartData(logs)
    expect(result).toEqual([])
  })

  it('transforms a valid log entry into a chart data point', () => {
    const logs: ParsedLogEntry[] = [
      {
        timestamp: '2025-01-01T00:00:00Z',
        mean_exec_time: 10,
        mean_plan_time: 2,
        min_exec_time: 1,
        max_exec_time: 50,
        min_plan_time: 0.5,
        max_plan_time: 5,
        p50_exec_time: 8,
        p95_exec_time: 40,
        p50_plan_time: 1.5,
        p95_plan_time: 4,
        calls: 10,
      },
    ]

    const result = transformLogsToChartData(logs)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      period_start: new Date('2025-01-01T00:00:00Z').getTime(),
      timestamp: '2025-01-01T00:00:00Z',
      query_latency: 12, // 10 + 2
      mean_time: 10,
      min_time: 1.5, // 1 + 0.5
      max_time: 55, // 50 + 5
      stddev_time: 0,
      p50_time: 9.5, // 8 + 1.5
      p95_time: 44, // 40 + 4
      rows_read: 0,
      calls: 10,
      cache_hits: 0,
      cache_misses: 0,
    })
  })

  it('defaults missing numeric fields to 0', () => {
    const logs: ParsedLogEntry[] = [
      {
        timestamp: '2025-06-01T12:00:00Z',
      },
    ]

    const result = transformLogsToChartData(logs)

    expect(result).toHaveLength(1)
    expect(result[0].query_latency).toBe(0)
    expect(result[0].calls).toBe(0)
    expect(result[0].min_time).toBe(0)
    expect(result[0].max_time).toBe(0)
  })

  it('sorts results by period_start ascending', () => {
    const logs: ParsedLogEntry[] = [
      { timestamp: '2025-01-03T00:00:00Z', mean_exec_time: 1 },
      { timestamp: '2025-01-01T00:00:00Z', mean_exec_time: 2 },
      { timestamp: '2025-01-02T00:00:00Z', mean_exec_time: 3 },
    ]

    const result = transformLogsToChartData(logs)

    expect(result).toHaveLength(3)
    expect(result[0].timestamp).toBe('2025-01-01T00:00:00Z')
    expect(result[1].timestamp).toBe('2025-01-02T00:00:00Z')
    expect(result[2].timestamp).toBe('2025-01-03T00:00:00Z')
  })
})

describe('aggregateLogsByQuery', () => {
  it('returns empty array for null or empty input', () => {
    expect(aggregateLogsByQuery(null as any)).toEqual([])
    expect(aggregateLogsByQuery([])).toEqual([])
  })

  it('skips entries with empty or whitespace-only queries', () => {
    const logs: ParsedLogEntry[] = [
      { query: '', calls: 5 },
      { query: '   ', calls: 3 },
    ]
    const result = aggregateLogsByQuery(logs)
    expect(result).toEqual([])
  })

  it('aggregates a single log entry correctly', () => {
    const logs: ParsedLogEntry[] = [
      {
        query: 'SELECT 1',
        user_name: 'postgres',
        application_name: 'app',
        calls: 10,
        total_exec_time: 100,
        total_plan_time: 20,
        min_exec_time: 1,
        max_exec_time: 50,
        min_plan_time: 0.5,
        max_plan_time: 5,
      },
    ]

    const result = aggregateLogsByQuery(logs)

    expect(result).toHaveLength(1)
    expect(result[0].query).toBe('SELECT 1')
    expect(result[0].rolname).toBe('postgres')
    expect(result[0].application_name).toBe('app')
    expect(result[0].calls).toBe(10)
    expect(result[0].total_time).toBe(120)
    expect(result[0].mean_time).toBe(12)
    expect(result[0].min_time).toBe(1.5)
    expect(result[0].max_time).toBe(55)
    expect(result[0].prop_total_time).toBe(100)
  })

  it('aggregates multiple entries for the same query', () => {
    const logs: ParsedLogEntry[] = [
      {
        query: 'SELECT 1',
        user_name: 'postgres',
        calls: 5,
        total_exec_time: 50,
        total_plan_time: 10,
        min_exec_time: 2,
        max_exec_time: 20,
        min_plan_time: 1,
        max_plan_time: 3,
      },
      {
        query: 'SELECT 1',
        user_name: 'postgres',
        calls: 10,
        total_exec_time: 100,
        total_plan_time: 20,
        min_exec_time: 1,
        max_exec_time: 50,
        min_plan_time: 0.5,
        max_plan_time: 5,
      },
    ]

    const result = aggregateLogsByQuery(logs)

    expect(result).toHaveLength(1)
    expect(result[0].calls).toBe(15) // 5 + 10
    expect(result[0].total_time).toBe(180) // (50+10) + (100+20)
    expect(result[0].mean_time).toBe(12) // 180 / 15
    expect(result[0].min_time).toBe(1.5) // min(2+1, 1+0.5) = 1.5
    expect(result[0].max_time).toBe(55) // max(20+3, 50+5) = 55
    expect(result[0]._count).toBe(2) // 2 log entries
  })

  it('normalizes whitespace differences in queries', () => {
    const logs: ParsedLogEntry[] = [
      { query: 'SELECT  1', calls: 5, total_exec_time: 50, total_plan_time: 0 },
      { query: 'SELECT 1', calls: 3, total_exec_time: 30, total_plan_time: 0 },
    ]

    const result = aggregateLogsByQuery(logs)

    expect(result).toHaveLength(1)
    expect(result[0].calls).toBe(8)
  })

  it('sorts results by total_time descending', () => {
    const logs: ParsedLogEntry[] = [
      { query: 'SELECT 1', calls: 1, total_exec_time: 10, total_plan_time: 0 },
      { query: 'SELECT 2', calls: 1, total_exec_time: 100, total_plan_time: 0 },
      { query: 'SELECT 3', calls: 1, total_exec_time: 50, total_plan_time: 0 },
    ]

    const result = aggregateLogsByQuery(logs)

    expect(result).toHaveLength(3)
    expect(result[0].query).toBe('SELECT 2')
    expect(result[1].query).toBe('SELECT 3')
    expect(result[2].query).toBe('SELECT 1')
  })

  it('calculates prop_total_time as percentage of total execution', () => {
    const logs: ParsedLogEntry[] = [
      { query: 'SELECT 1', calls: 1, total_exec_time: 75, total_plan_time: 0 },
      { query: 'SELECT 2', calls: 1, total_exec_time: 25, total_plan_time: 0 },
    ]

    const result = aggregateLogsByQuery(logs)

    expect(result[0].prop_total_time).toBe(75)
    expect(result[1].prop_total_time).toBe(25)
  })

  it('handles zero calls gracefully (mean_time defaults to 0)', () => {
    const logs: ParsedLogEntry[] = [
      { query: 'SELECT 1', calls: 0, total_exec_time: 100, total_plan_time: 0 },
    ]

    const result = aggregateLogsByQuery(logs)

    expect(result).toHaveLength(1)
    expect(result[0].mean_time).toBe(0)
  })

  it('sets static fields correctly', () => {
    const logs: ParsedLogEntry[] = [
      { query: 'SELECT 1', calls: 1, total_exec_time: 10, total_plan_time: 0 },
    ]

    const result = aggregateLogsByQuery(logs)

    expect(result[0].rows_read).toBe(0)
    expect(result[0].cache_hit_rate).toBe(0)
    expect(result[0].index_advisor_result).toBeNull()
    expect(result[0]._total_cache_hits).toBe(0)
    expect(result[0]._total_cache_misses).toBe(0)
  })
})
