import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'

import {
  EDGE_FUNCTION_CHART_INTERVALS,
  formatChartTimestamp,
  formatMetric,
  formatRate,
  formatReferenceDelta,
  getBucketedTimeRange,
  getChartEmptyStateCopy,
  getChartTimeRangeLabels,
  getExecutionMetrics,
  getInvocationChartData,
  getInvocationTotals,
  getInvocationUpdateAnnotation,
  getMemoryTooltipDetail,
  getRollingTimeRange,
  getSegmentedButtonClassName,
  getUsageMetrics,
  toEdgeFunctionChartData,
  type EdgeFunctionChartRawDatum,
} from './EdgeFunctionOverview.utils'

describe('EdgeFunctionOverview.utils', () => {
  it('uses a full day interval for the 1 day option', () => {
    expect(
      EDGE_FUNCTION_CHART_INTERVALS.find((interval) => interval.key === '1day')?.startUnit
    ).toBe('day')
  })

  it('builds invocation chart data and totals from combined stats', () => {
    const chartData = toEdgeFunctionChartData([
      {
        timestamp: '2026-03-20T10:00:00.000Z',
        success_count: 10,
        redirect_count: 2,
        client_err_count: 1,
        server_err_count: 3,
      },
      {
        timestamp: '2026-03-20T10:15:00.000Z',
        success_count: '4',
        redirect_count: '1',
        client_err_count: '0',
        server_err_count: '2',
      },
    ] satisfies EdgeFunctionChartRawDatum[])
    const data = getInvocationChartData(chartData)

    expect(data).toEqual([
      {
        timestamp: '2026-03-20T10:00:00.000Z',
        ok_count: 10,
        warning_count: 3,
        error_count: 3,
      },
      {
        timestamp: '2026-03-20T10:15:00.000Z',
        ok_count: 4,
        warning_count: 1,
        error_count: 2,
      },
    ])

    expect(chartData[1]).toEqual({
      timestamp: '2026-03-20T10:15:00.000Z',
      success_count: 4,
      redirect_count: 1,
      client_err_count: 0,
      server_err_count: 2,
      avg_execution_time: 0,
      max_execution_time: 0,
      avg_cpu_time_used: 0,
      max_cpu_time_used: 0,
      avg_memory_used: 0,
      avg_heap_memory_used: 0,
      avg_external_memory_used: 0,
    })

    expect(getInvocationTotals(data)).toEqual({
      totalInvocationCount: 23,
      totalWarningCount: 4,
      totalErrorCount: 5,
    })
  })

  it('builds segmented button classes and chart range labels', () => {
    expect(getSegmentedButtonClassName(0, 4)).toBe('rounded-tr-none rounded-br-none')
    expect(getSegmentedButtonClassName(1, 4)).toBe('rounded-none')
    expect(getSegmentedButtonClassName(3, 4)).toBe('rounded-tl-none rounded-bl-none')

    expect(
      getChartTimeRangeLabels(
        [{ timestamp: '2026-03-20T10:00:00.000Z' }, { timestamp: '2026-03-20T11:00:00.000Z' }],
        'MMM D, h:mma'
      )
    ).toEqual({
      start: dayjs('2026-03-20T10:00:00.000Z').format('MMM D, h:mma'),
      end: dayjs('2026-03-20T11:00:00.000Z').format('MMM D, h:mma'),
    })
    expect(getChartTimeRangeLabels([], 'MMM D')).toBeUndefined()
    expect(formatChartTimestamp('2026-03-20T10:00:00.000Z', 'MMM D, h:mma')).toBe(
      dayjs('2026-03-20T10:00:00.000Z').format('MMM D, h:mma')
    )
  })

  it('computes execution and usage metrics', () => {
    const stats = [
      {
        timestamp: '2026-03-20T10:00:00.000Z',
        success_count: 0,
        redirect_count: 0,
        client_err_count: 0,
        server_err_count: 0,
        avg_execution_time: 10,
        max_execution_time: 18,
        avg_cpu_time_used: 5,
        max_cpu_time_used: 8,
        avg_memory_used: 100,
        avg_heap_memory_used: 75,
        avg_external_memory_used: 25,
      },
      {
        timestamp: '2026-03-20T10:15:00.000Z',
        success_count: 0,
        redirect_count: 0,
        client_err_count: 0,
        server_err_count: 0,
        avg_execution_time: 30,
        max_execution_time: 45,
        avg_cpu_time_used: 15,
        max_cpu_time_used: 20,
        avg_memory_used: 200,
        avg_heap_memory_used: 150,
        avg_external_memory_used: 50,
      },
    ]

    expect(getExecutionMetrics(stats)).toEqual({
      averageExecutionTime: 20,
      maxExecutionTime: 45,
    })

    expect(getUsageMetrics(stats)).toEqual({
      averageCpuTime: 10,
      maxCpuTime: 20,
      averageMemoryUsage: 150,
      totalHeapMemory: 225,
      totalExternalMemory: 75,
      totalMemoryByType: 300,
    })
  })

  it('returns a snapped deploy annotation when updated_at falls within the selected window', () => {
    const annotation = getInvocationUpdateAnnotation({
      updatedAt: '2026-03-20T10:16:30.000Z',
      invocationChartData: [
        { timestamp: '2026-03-20T10:00:00.000Z', ok_count: 3, warning_count: 0, error_count: 0 },
        { timestamp: '2026-03-20T10:15:00.000Z', ok_count: 5, warning_count: 1, error_count: 1 },
        { timestamp: '2026-03-20T10:30:00.000Z', ok_count: 2, warning_count: 0, error_count: 0 },
      ],
      windowStart: new Date('2026-03-20T09:45:00.000Z'),
      windowEnd: new Date('2026-03-20T10:45:00.000Z'),
    })

    expect(annotation?.timestamp).toBe('2026-03-20T10:15:00.000Z')
    expect(annotation?.position).toBeCloseTo(50)
    expect(annotation?.updatedAt.toISOString()).toBe('2026-03-20T10:16:30.000Z')
  })

  it('hides the deploy annotation when updated_at is outside the selected window', () => {
    const annotation = getInvocationUpdateAnnotation({
      updatedAt: '2026-03-20T11:05:00.000Z',
      invocationChartData: [
        { timestamp: '2026-03-20T10:00:00.000Z', ok_count: 3, warning_count: 0, error_count: 0 },
      ],
      windowStart: new Date('2026-03-20T09:45:00.000Z'),
      windowEnd: new Date('2026-03-20T10:45:00.000Z'),
    })

    expect(annotation).toBeUndefined()
  })

  it('builds bucketed and rolling time windows from the selected interval', () => {
    const interval = EDGE_FUNCTION_CHART_INTERVALS.find((item) => item.key === '1hr')
    expect(interval).toBeDefined()

    const now = new Date('2026-03-20T10:37:00.000Z')
    const [bucketedStart, bucketedEnd] = getBucketedTimeRange(interval!, now)
    const [rollingStart, rollingEnd] = getRollingTimeRange(interval!, now)

    expect(bucketedStart.toISOString()).toBe('2026-03-20T09:00:00.000Z')
    expect(bucketedEnd.toISOString()).toBe('2026-03-20T10:00:00.000Z')
    expect(rollingStart.toISOString()).toBe('2026-03-20T09:37:00.000Z')
    expect(rollingEnd.toISOString()).toBe('2026-03-20T10:37:00.000Z')
  })

  it('formats metric, rate, and reference deltas consistently', () => {
    expect(formatMetric(12.34, 'MB')).toBe('12.3MB')
    expect(formatMetric(1234, 'ms')).toBe('1,234ms')
    expect(formatRate(1, 4)).toBe('25%')
    expect(formatReferenceDelta(110, 100)).toBe('10% above average')
    expect(formatReferenceDelta(90, 100)).toBe('10% below average')
    expect(formatReferenceDelta(100, 100)).toBe('At average')
  })

  it('builds empty-state copy and tooltip detail strings', () => {
    expect(getChartEmptyStateCopy('invocations', false, 'boom')).toEqual({
      title: 'No data to show',
      description: undefined,
    })
    expect(getChartEmptyStateCopy('CPU time', true, 'Request failed')).toEqual({
      title: 'Unable to load CPU time',
      description: 'Request failed',
    })
    expect(getMemoryTooltipDetail(12.34, 5.67)).toBe('Heap 12.3MB • External 5.7MB')
  })
})
