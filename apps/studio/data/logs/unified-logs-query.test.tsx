import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { useUnifiedLogsChartQuery } from './unified-logs-chart-query'
import { useUnifiedLogsCountQuery } from './unified-logs-count-query'
import { useUnifiedLogsInfiniteQuery } from './unified-logs-infinite-query'

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
  configcatError?: boolean
  otelUnifiedLogs?: boolean
}

const flagState: FlagState = { hasLoaded: false }

const createWrapper = (queryClient: QueryClient) => {
  return function QueryWrapper({ children }: { children: React.ReactNode }) {
    const configcat =
      flagState.otelUnifiedLogs === undefined
        ? {}
        : { otelUnifiedLogs: flagState.otelUnifiedLogs }

    return (
      <QueryClientProvider client={queryClient}>
        <FeatureFlagContext.Provider
          value={{
            configcat,
            posthog: {},
            hasLoaded: flagState.hasLoaded,
            configcatError: flagState.configcatError,
          }}
        >
          {children}
        </FeatureFlagContext.Provider>
      </QueryClientProvider>
    )
  }
}

const useUnifiedLogsQueries = () => {
  const variables = { projectRef: 'project-ref', search: {} }
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
    flagState.configcatError = undefined
    flagState.otelUnifiedLogs = undefined
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
    flagState.configcatError = true

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
