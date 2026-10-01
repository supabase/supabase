import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import type { FeatureFlagContextType } from 'common'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { useUnifiedLogsChartQuery } from './unified-logs-chart-query'
import { useUnifiedLogsCountQuery } from './unified-logs-count-query'
import { useUnifiedLogsInfiniteQuery } from './unified-logs-infinite-query'
import type { QuerySearchParamsType } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.types'

const { mockExecuteAnalyticsSql, mockIsPlatform } = vi.hoisted(() => ({
  mockExecuteAnalyticsSql: vi.fn(),
  mockIsPlatform: { value: true },
}))

vi.mock('./execute-analytics-sql', () => ({
  executeAnalyticsSql: mockExecuteAnalyticsSql,
}))

vi.mock('@/lib/constants', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/constants')
  return {
    ...actual,
    get IS_PLATFORM() {
      return mockIsPlatform.value
    },
  }
})

type FlagState = {
  hasLoaded: boolean
  otelUnifiedLogs?: boolean
  unrelatedFlag?: boolean
}

const flagState: FlagState = { hasLoaded: false }

const createWrapper = (queryClient: QueryClient) => {
  return function QueryWrapper({ children }: { children: React.ReactNode }) {
    const otelUnifiedLogs = flagState.otelUnifiedLogs
    const configcat: FeatureFlagContextType['configcat'] = {
      ...(otelUnifiedLogs === undefined ? {} : { otelUnifiedLogs }),
      ...(flagState.unrelatedFlag ? { unrelatedFlag: true } : {}),
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

const useUnifiedLogsQueries = () => {
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
    mockIsPlatform.value = true
    flagState.hasLoaded = false
    flagState.otelUnifiedLogs = undefined
    flagState.unrelatedFlag = undefined
    mockExecuteAnalyticsSql.mockResolvedValue({ result: [] })
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  afterEach(() => {
    queryClient.clear()
    vi.clearAllMocks()
  })

  test('does not request analytics while flags are pending', async () => {
    const { result } = renderHook(useUnifiedLogsQueries, { wrapper: createWrapper(queryClient) })

    await Promise.resolve()

    expect(mockExecuteAnalyticsSql).not.toHaveBeenCalled()

    await Promise.all([
      result.current.chart.refetch(),
      result.current.count.refetch(),
      result.current.logs.refetch(),
    ])

    expect(mockExecuteAnalyticsSql).not.toHaveBeenCalled()
  })

  test('starts only ClickHouse requests when the flag resolves enabled', async () => {
    const { rerender } = renderHook(useUnifiedLogsQueries, { wrapper: createWrapper(queryClient) })

    flagState.hasLoaded = true
    flagState.otelUnifiedLogs = true
    rerender()

    await waitFor(() => expect(mockExecuteAnalyticsSql).toHaveBeenCalledTimes(3))

    expect(endpoints()).toEqual([
      '/platform/projects/{ref}/analytics/endpoints/logs.all.otel',
      '/platform/projects/{ref}/analytics/endpoints/logs.all.otel',
      '/platform/projects/{ref}/analytics/endpoints/logs.all.otel',
    ])
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

  test('does not select BigQuery when ConfigCat fails', async () => {
    flagState.hasLoaded = true

    renderHook(useUnifiedLogsQueries, { wrapper: createWrapper(queryClient) })

    await Promise.resolve()

    expect(mockExecuteAnalyticsSql).not.toHaveBeenCalled()
  })

  test('does not select BigQuery when the loaded flags omit the backend flag', async () => {
    flagState.hasLoaded = true
    flagState.unrelatedFlag = true

    renderHook(useUnifiedLogsQueries, { wrapper: createWrapper(queryClient) })

    await Promise.resolve()

    expect(mockExecuteAnalyticsSql).not.toHaveBeenCalled()
  })

  test('keeps BigQuery available when self-hosted flags are disabled', async () => {
    mockIsPlatform.value = false

    renderHook(useUnifiedLogsQueries, { wrapper: createWrapper(queryClient) })

    await waitFor(() => expect(mockExecuteAnalyticsSql).toHaveBeenCalledTimes(3))

    expect(endpoints()).toEqual([
      '/platform/projects/{ref}/analytics/endpoints/logs.all',
      '/platform/projects/{ref}/analytics/endpoints/logs.all',
      '/platform/projects/{ref}/analytics/endpoints/logs.all',
    ])
  })

  test('does not start and abort a legacy batch before enabled flags resolve', async () => {
    const { rerender } = renderHook(useUnifiedLogsQueries, { wrapper: createWrapper(queryClient) })

    await Promise.resolve()
    expect(mockExecuteAnalyticsSql).not.toHaveBeenCalled()

    flagState.hasLoaded = true
    flagState.otelUnifiedLogs = true
    rerender()

    await waitFor(() => expect(mockExecuteAnalyticsSql).toHaveBeenCalledTimes(3))
    expect(endpoints()).not.toContain('/platform/projects/{ref}/analytics/endpoints/logs.all')
  })
})
