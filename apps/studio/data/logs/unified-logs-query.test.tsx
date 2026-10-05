import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import type { FeatureFlagContextType } from 'common'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { useUnifiedLogsChartQuery } from './unified-logs-chart-query'
import { useUnifiedLogsCountQuery } from './unified-logs-count-query'
import { useUnifiedLogsInfiniteQuery } from './unified-logs-infinite-query'
import type { QuerySearchParamsType } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.types'

const { mockExecuteAnalyticsSql } = vi.hoisted(() => ({
  mockExecuteAnalyticsSql: vi.fn(),
}))

vi.mock('./execute-analytics-sql', () => ({
  executeAnalyticsSql: mockExecuteAnalyticsSql,
}))

type FlagState = {
  hasLoaded: boolean
  otelUnifiedLogs?: boolean | null
}

const flagState: FlagState = { hasLoaded: false }

const createWrapper = (queryClient: QueryClient) => {
  return function QueryWrapper({ children }: { children: React.ReactNode }) {
    const otelUnifiedLogs = flagState.otelUnifiedLogs
    const configcat: FeatureFlagContextType['configcat'] = {
      ...(otelUnifiedLogs === undefined ? {} : { otelUnifiedLogs }),
    }

    return (
      <QueryClientProvider client={queryClient}>
        <FeatureFlagContext.Provider
          value={{
            configcat,
            posthog: {},
            hasLoaded: flagState.hasLoaded,
          }}
        >
          {children}
        </FeatureFlagContext.Provider>
      </QueryClientProvider>
    )
  }
}

const search: QuerySearchParamsType = {
  filter: null,
  latency: null,
  'timing.dns': null,
  'timing.connection': null,
  'timing.tls': null,
  'timing.ttfb': null,
  'timing.transfer': null,
  date: null,
  sort: null,
  size: 40,
  start: 0,
  direction: 'next',
  cursor: new Date(),
  id: null,
  show_connection_logs: true,
  edge_auth: true,
  edge_storage: true,
  edge_postgrest: true,
  user: null,
}

const useUnifiedLogsQueries = () => {
  const variables = { projectRef: 'project-ref', search }
  return {
    chart: useUnifiedLogsChartQuery(variables),
    count: useUnifiedLogsCountQuery(variables),
    logs: useUnifiedLogsInfiniteQuery(variables),
  }
}

const endpoints = () => mockExecuteAnalyticsSql.mock.calls.map(([args]) => args.endpoint)

describe('unified logs queries', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    flagState.hasLoaded = false
    flagState.otelUnifiedLogs = undefined
    mockExecuteAnalyticsSql.mockResolvedValue({ result: [] })
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  afterEach(() => {
    queryClient.clear()
    vi.clearAllMocks()
  })

  test('uses OTEL for initial and manual requests while flags are pending', async () => {
    const { result } = renderHook(useUnifiedLogsQueries, { wrapper: createWrapper(queryClient) })

    await waitFor(() => expect(mockExecuteAnalyticsSql).toHaveBeenCalledTimes(3))

    await Promise.all([
      result.current.chart.refetch(),
      result.current.count.refetch(),
      result.current.logs.refetch(),
    ])

    expect(mockExecuteAnalyticsSql).toHaveBeenCalledTimes(6)
    expect(endpoints()).toEqual(
      Array(6).fill('/platform/projects/{ref}/analytics/endpoints/logs.all.otel')
    )
  })

  test('does not start or abort a legacy batch before the flag resolves enabled', async () => {
    const { rerender } = renderHook(useUnifiedLogsQueries, { wrapper: createWrapper(queryClient) })

    await waitFor(() => expect(mockExecuteAnalyticsSql).toHaveBeenCalledTimes(3))
    expect(endpoints()).toEqual(
      Array(3).fill('/platform/projects/{ref}/analytics/endpoints/logs.all.otel')
    )

    flagState.hasLoaded = true
    flagState.otelUnifiedLogs = true
    rerender()

    await Promise.resolve()

    expect(mockExecuteAnalyticsSql).toHaveBeenCalledTimes(3)
    expect(mockExecuteAnalyticsSql.mock.calls.every(([args]) => !args.signal.aborted)).toBe(true)
  })

  test('allows BigQuery requests when the flag resolves disabled', async () => {
    flagState.hasLoaded = true
    flagState.otelUnifiedLogs = false

    renderHook(useUnifiedLogsQueries, { wrapper: createWrapper(queryClient) })

    await waitFor(() => expect(mockExecuteAnalyticsSql).toHaveBeenCalledTimes(3))

    expect(endpoints()).toEqual([
      '/platform/projects/{ref}/analytics/endpoints/logs.all',
      '/platform/projects/{ref}/analytics/endpoints/logs.all',
      '/platform/projects/{ref}/analytics/endpoints/logs.all',
    ])
  })

  test('defaults to OTEL when ConfigCat fails', async () => {
    flagState.hasLoaded = true

    renderHook(useUnifiedLogsQueries, { wrapper: createWrapper(queryClient) })

    await waitFor(() => expect(mockExecuteAnalyticsSql).toHaveBeenCalledTimes(3))
    expect(endpoints()).toEqual(
      Array(3).fill('/platform/projects/{ref}/analytics/endpoints/logs.all.otel')
    )
  })

  test('defaults to OTEL when the backend flag is null', async () => {
    flagState.hasLoaded = true
    flagState.otelUnifiedLogs = null

    renderHook(useUnifiedLogsQueries, { wrapper: createWrapper(queryClient) })

    await waitFor(() => expect(mockExecuteAnalyticsSql).toHaveBeenCalledTimes(3))
    expect(endpoints()).toEqual(
      Array(3).fill('/platform/projects/{ref}/analytics/endpoints/logs.all.otel')
    )
  })
})
