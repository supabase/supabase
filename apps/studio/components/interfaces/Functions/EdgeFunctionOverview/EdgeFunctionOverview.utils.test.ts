import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'

import {
  EDGE_FUNCTION_CHART_INTERVALS,
  formatChartTimestamp,
  formatMetric,
  formatRate,
  formatReferenceDelta,
  getChartEmptyStateCopy,
  getChartTimeRangeLabels,
  getEdgeFunctionLogsScope,
  getEdgeFunctionLogsUrl,
  getExecutionMetrics,
  getInvocationChartData,
  getInvocationChartNavigationUrl,
  getInvocationTotals,
  getInvocationUpdateAnnotation,
  getLegacyEdgeFunctionLogsUrl,
  getMemoryTooltipDetail,
  getRollingTimeRange,
  getUsageMetrics,
  toEdgeFunctionChartData,
  type EdgeFunctionChartRawDatum,
} from './EdgeFunctionOverview.utils'
import { getUnifiedLogsQuery } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.queries'
import { createUnifiedLogsSearch } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.utils'

describe('Edge function overview chart summaries', () => {
  it('counts every invocation status and groups redirects and client errors as warnings', () => {
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

  it('labels the first and last chart timestamps for the selected period', () => {
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

  it('summarizes execution time, CPU time, and memory across the returned invocation buckets', () => {
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

  it.each([
    ['an ISO string', '2026-03-20T10:16:30.000Z'],
    ['a numeric', new Date('2026-03-20T10:16:30.000Z').valueOf()],
  ])(
    'marks the nearest invocation bucket to a deployment recorded with %s timestamp',
    (_, updatedAt) => {
      const annotation = getInvocationUpdateAnnotation({
        updatedAt,
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
    }
  )

  it('hides deployments outside the selected chart period', () => {
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

  it('hides the deployment marker when its timestamp cannot be read', () => {
    const annotation = getInvocationUpdateAnnotation({
      updatedAt: 'invalid',
      invocationChartData: [
        { timestamp: '2026-03-20T10:00:00.000Z', ok_count: 3, warning_count: 0, error_count: 0 },
      ],
      windowStart: new Date('2026-03-20T09:45:00.000Z'),
      windowEnd: new Date('2026-03-20T10:45:00.000Z'),
    })

    expect(annotation).toBeUndefined()
  })

  it.each([
    {
      updatedAt: undefined,
      invocationChartData: [
        { timestamp: '2026-03-20T10:00:00.000Z', ok_count: 3, warning_count: 0, error_count: 0 },
      ],
    },
    { updatedAt: '2026-03-20T10:00:00.000Z', invocationChartData: [] },
  ])(
    'hides the deployment marker until its timestamp and invocation data are available',
    ({ updatedAt, invocationChartData }) => {
      const annotation = getInvocationUpdateAnnotation({
        updatedAt,
        invocationChartData,
        windowStart: new Date('2026-03-20T09:45:00.000Z'),
        windowEnd: new Date('2026-03-20T10:45:00.000Z'),
      })

      expect(annotation).toBeUndefined()
    }
  )

  it.each([
    { period: '1hr', start: '2026-03-20T09:37:00.000Z' },
    { period: '1day', start: '2026-03-19T10:37:00.000Z' },
  ])('opens the full past $period through the current minute', ({ period, start }) => {
    const interval = EDGE_FUNCTION_CHART_INTERVALS.find((item) => item.key === period)
    if (!interval) throw new Error(`Unknown function chart period: ${period}`)

    const [rollingStart, rollingEnd] = getRollingTimeRange(
      interval,
      new Date('2026-03-20T10:37:00.000Z')
    )

    expect(rollingStart.toISOString()).toBe(start)
    expect(rollingEnd.toISOString()).toBe('2026-03-20T10:37:00.000Z')
  })

  it.each([
    {
      isUnifiedLogsEnabled: true,
      expected: `/project/project-ref/functions/function-slug/logs?date=${Date.parse('2026-03-20T10:27:30.000Z')}-${Date.parse('2026-03-20T10:32:30.000Z')}`,
    },
    {
      isUnifiedLogsEnabled: false,
      expected:
        '/project/project-ref/functions/function-slug/invocations?its=2026-03-20T10%3A27%3A30.000Z&ite=2026-03-20T10%3A32%3A30.000Z',
    },
  ])(
    'builds a focused URL from the clicked bar (unified logs: $isUnifiedLogsEnabled)',
    ({ isUnifiedLogsEnabled, expected }) => {
      const url = getInvocationChartNavigationUrl({
        projectRef: 'project-ref',
        functionSlug: 'function-slug',
        isUnifiedLogsEnabled,
        rangeStart: '2026-03-20T10:00:00.000Z',
        rangeEnd: '2026-03-20T11:00:00.000Z',
        clickedTimestamp: '2026-03-20T10:30:00.000Z',
      })

      expect(url).toBe(expected)
    }
  )

  it('links to the unified function logs tab with an optional range and selected log', () => {
    const base = { projectRef: 'project-ref', functionSlug: 'function-slug' }

    expect(getEdgeFunctionLogsUrl(base)).toBe('/project/project-ref/functions/function-slug/logs')
    expect(
      getEdgeFunctionLogsUrl({
        ...base,
        start: '2026-03-20T10:00:00.000Z',
        end: '2026-03-20T11:00:00.000Z',
        filters: ['level:eq:error'],
        logId: 'log-id',
      })
    ).toBe(
      `/project/project-ref/functions/function-slug/logs?filter=level:eq:error&date=${Date.parse('2026-03-20T10:00:00.000Z')}-${Date.parse('2026-03-20T11:00:00.000Z')}&id=log-id`
    )
  })

  it("scopes unified logs to the function's invocations and runtime logs", () => {
    const sql = getUnifiedLogsQuery(createUnifiedLogsSearch({}, getEdgeFunctionLogsScope('fn-1')))
    const where = sql.split(/\bWHERE\b/)[1] ?? ''

    expect(where).toContain(
      `((source = 'function_edge_logs') OR (source = 'function_logs')) AND log_attributes['function_id'] IN ('fn-1')`
    )
    expect(where).not.toContain(`source = 'postgres_logs'`)
  })

  it('links to the pre-unified Invocations and Logs tabs with their own params', () => {
    const base = { projectRef: 'project-ref', functionSlug: 'function-slug' }

    expect(getLegacyEdgeFunctionLogsUrl({ ...base, tab: 'logs' })).toBe(
      '/project/project-ref/functions/function-slug/logs'
    )
    expect(
      getLegacyEdgeFunctionLogsUrl({
        ...base,
        tab: 'invocations',
        start: '2026-03-20T10:00:00.000Z',
        end: '2026-03-20T11:00:00.000Z',
        logId: 'log-id',
      })
    ).toBe(
      '/project/project-ref/functions/function-slug/invocations?its=2026-03-20T10%3A00%3A00.000Z&ite=2026-03-20T11%3A00%3A00.000Z&log=log-id'
    )
  })

  it('shows metric units, invocation percentages, and differences from the average', () => {
    expect(formatMetric(12.34, 'MB')).toBe('12.3MB')
    expect(formatMetric(1234, 'ms')).toBe('1,234ms')
    expect(formatRate(1, 4)).toBe('25%')
    expect(formatReferenceDelta(110, 100)).toBe('10% above average')
    expect(formatReferenceDelta(90, 100)).toBe('10% below average')
    expect(formatReferenceDelta(100, 100)).toBe('At average')
  })

  it('explains empty charts, query failures, and heap and external memory usage', () => {
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
