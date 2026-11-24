import { QueryClient } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from '@tanstack/react-router'
import { act, screen, waitFor } from '@testing-library/react'
import type { platformComponents } from 'api-types'
import { LOCAL_STORAGE_KEYS } from 'common'
import { HttpResponse } from 'msw'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AUTH_TOP_ERROR_CODES_SQL,
  AUTH_TOP_ERROR_CODES_SQL_OTEL,
  AUTH_TOP_RESPONSE_ERRORS_SQL,
  AUTH_TOP_RESPONSE_ERRORS_SQL_OTEL,
} from './OverviewErrors.constants'
import { OverviewMetrics } from './OverviewMetrics'
import type { AuthMetricsResponse } from './OverviewUsage.constants'
import type { RawAuthMetricsRow } from './OverviewUsage.schema'
import { SEARCH_PARAMS_PARSER } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.constants'
import { parseLogsFilterUrlParams } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.filters'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type AnalyticsResponse = platformComponents['schemas']['AnalyticsResponse_Output']

const flags = vi.hoisted(() => ({ otelLegacyLogs: false }))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useParams: () => ({ ref: 'default' }),
    useFlag: (name: string) => name === 'otelLegacyLogs' && flags.otelLegacyLogs,
  }
})

const logQueries = [
  {
    useOtel: false,
    endpoint: '/platform/projects/:ref/analytics/endpoints/logs.all',
    responseSql: AUTH_TOP_RESPONSE_ERRORS_SQL,
    codeSql: AUTH_TOP_ERROR_CODES_SQL,
  },
  {
    useOtel: true,
    endpoint: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
    responseSql: AUTH_TOP_RESPONSE_ERRORS_SQL_OTEL,
    codeSql: AUTH_TOP_ERROR_CODES_SQL_OTEL,
  },
] as const

const metricRow = (
  period: RawAuthMetricsRow['period'],
  requests: number,
  errors: number
): RawAuthMetricsRow => ({
  period,
  active_users: 0,
  sign_up_count: 0,
  password_reset_requests: 0,
  api_total_requests: requests,
  api_error_requests: errors,
  auth_total_requests: requests,
  auth_total_errors: errors,
})

const mockEmptyLogs = () => {
  addAPIMock({
    method: 'get',
    path: logQueries[0].endpoint,
    response: () => HttpResponse.json<AnalyticsResponse>({ result: [] }),
  })
}

const renderMetrics = (component: ReactElement, queryClient?: QueryClient) => {
  const router = createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({ initialEntries: ['/project/default/auth'] }),
    parseSearch,
    stringifySearch,
  })
  const result = customRender(
    <RouterContextProvider router={router}>{component}</RouterContextProvider>,
    { queryClient }
  )
  return {
    ...result,
    rerender: (next: ReactElement) =>
      result.rerender(<RouterContextProvider router={router}>{next}</RouterContextProvider>),
  }
}

beforeEach(() => {
  localStorage.removeItem(LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS)
  flags.otelLegacyLogs = false
})

describe('Auth overview logs requests', () => {
  it.each(logQueries)('uses matching SQL and endpoint with useOtel=$useOtel', async (query) => {
    flags.otelLegacyLogs = query.useOtel
    const requests: URL[] = []
    addAPIMock({
      method: 'get',
      path: query.endpoint,
      response: ({ request }) => {
        const url = new URL(request.url)
        requests.push(url)
        if (url.searchParams.get('sql') === query.responseSql) {
          return HttpResponse.json<AnalyticsResponse>({
            result: [{ method: 'POST', path: '/auth/v1/token', status_code: '401', count: '7' }],
          })
        }
        if (url.searchParams.get('sql') === query.codeSql) {
          return HttpResponse.json<AnalyticsResponse>({
            result: [{ error_code: 'invalid_credentials', count: '3' }],
          })
        }
        return HttpResponse.json<APIErrorBody>({ message: 'Unexpected SQL' }, { status: 400 })
      },
    })

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { rerender } = renderMetrics(
      <OverviewMetrics isLoading={false} error={null} />,
      queryClient
    )

    expect(await screen.findByText('/auth/v1/token')).toBeVisible()
    expect(await screen.findByText('invalid_credentials')).toBeVisible()
    expect(screen.getByText('7')).toBeVisible()
    expect(screen.getByText('3')).toBeVisible()
    const assertLogsLink = (request: URL) => {
      const link = screen.getAllByRole('link', { name: 'Go to Logs' })[0]
      const url = new URL(link.getAttribute('href') ?? '', 'http://localhost')
      expect(url.pathname).toBe('/project/default/logs')
      const filters = SEARCH_PARAMS_PARSER.filter.parse(url.searchParams.get('filter') ?? '')
      expect(parseLogsFilterUrlParams(filters)).toEqual([
        { column: 'log_type', operator: '=', value: 'edge' },
        { column: 'method', operator: '=', value: 'POST' },
        { column: 'pathname', operator: '=', value: '/auth/v1/token' },
        { column: 'status', operator: '=', value: '401' },
      ])
      const date = SEARCH_PARAMS_PARSER.date.parse(url.searchParams.get('date') ?? '')
      expect(date?.map((value) => value.toISOString())).toEqual([
        request.searchParams.get('iso_timestamp_start'),
        request.searchParams.get('iso_timestamp_end'),
      ])
    }
    const responseRequest = () => {
      const request = requests
        .filter((url) => url.searchParams.get('sql') === query.responseSql)
        .at(-1)
      if (!request) throw new Error('Expected a response errors request')
      return request
    }
    assertLogsLink(responseRequest())
    rerender(<OverviewMetrics isLoading={false} error={null} />)
    assertLogsLink(responseRequest())
    expect(requests).toHaveLength(2)
    await act(async () => {
      await queryClient.invalidateQueries({
        queryKey: ['auth-overview', 'default', 'top-response-errors'],
      })
    })
    expect(requests).toHaveLength(3)
    await waitFor(() => assertLogsLink(responseRequest()))
    for (const request of requests) {
      expect(request.pathname).toContain('/projects/default/analytics/endpoints/')
      const start = Date.parse(request.searchParams.get('iso_timestamp_start') ?? '')
      const end = Date.parse(request.searchParams.get('iso_timestamp_end') ?? '')
      expect(end - start).toBeCloseTo(24 * 60 * 60 * 1000, -2)
    }
  })

  it('respects an explicit legacy logs preference', async () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS, 'false')
    addAPIMock({
      method: 'get',
      path: logQueries[0].endpoint,
      response: ({ request }) =>
        HttpResponse.json<AnalyticsResponse>({
          result:
            new URL(request.url).searchParams.get('sql') === logQueries[0].responseSql
              ? [{ method: 'POST', path: '/auth/v1/token', status_code: 401, count: 7 }]
              : [],
        }),
    })
    renderMetrics(<OverviewMetrics isLoading={false} error={null} />)
    expect(await screen.findByRole('link', { name: 'Go to Logs' })).toHaveAttribute(
      'href',
      '/project/default/logs/edge-logs?s=%2Fauth%2Fv1%2Ftoken'
    )
  })

  it.each(['http', 'string', 'object'] as const)(
    'shows %s errors instead of empty log tables',
    async (failure) => {
      const query = logQueries[1]
      flags.otelLegacyLogs = query.useOtel
      addAPIMock({
        method: 'get',
        path: query.endpoint,
        response: () => {
          if (failure === 'http') {
            return HttpResponse.json<APIErrorBody>(
              { message: 'Analytics unavailable' },
              { status: 500 }
            )
          }
          const error =
            failure === 'string'
              ? 'Analytics unavailable'
              : { code: 500, errors: [], message: 'Analytics unavailable', status: 'INTERNAL' }
          return HttpResponse.json<AnalyticsResponse>({ result: [], error })
        },
      })

      renderMetrics(<OverviewMetrics isLoading={false} error={null} />)

      expect(await screen.findByText('Failed to retrieve Auth API errors')).toBeVisible()
      expect(await screen.findByText('Failed to retrieve Auth server errors')).toBeVisible()
      expect(screen.getAllByText('Error: Analytics unavailable')).toHaveLength(2)
      expect(screen.queryByText('No data to show')).not.toBeInTheDocument()
    }
  )
})

describe('Auth success rate presentation', () => {
  it.each([
    { name: 'no requests', current: metricRow('current', 0, 0) },
    { name: 'missing current period', current: undefined },
  ])('shows No data without a comparison for $name', async ({ current }) => {
    mockEmptyLogs()
    const metrics: AuthMetricsResponse = {
      result: [metricRow('previous', 500, 500), ...(current ? [current] : [])],
      error: null,
    }
    renderMetrics(<OverviewMetrics metrics={metrics} isLoading={false} error={null} />)

    expect(screen.getAllByText('No data')).toHaveLength(2)
    expect(screen.queryByText('0.0%')).not.toBeInTheDocument()
    expect(screen.queryByText(/ pp$/)).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByText('No data to show')).toHaveLength(2))
  })

  it('renders genuine zero success followed by a 0.2 percentage point increase', async () => {
    mockEmptyLogs()
    const metrics: AuthMetricsResponse = {
      result: [metricRow('current', 500, 500), metricRow('previous', 500, 500)],
      error: null,
    }
    const { rerender } = renderMetrics(
      <OverviewMetrics metrics={metrics} isLoading={false} error={null} />
    )
    expect(screen.getAllByText('0.0%')).toHaveLength(2)
    expect(screen.getAllByText('0.0 pp')).toHaveLength(2)
    expect(screen.queryByText('No data')).not.toBeInTheDocument()

    rerender(
      <OverviewMetrics
        metrics={{ ...metrics, result: [metricRow('current', 500, 499), metrics.result[1]] }}
        isLoading={false}
        error={null}
      />
    )
    expect(screen.getAllByText('0.2%')).toHaveLength(2)
    expect(screen.getAllByText('+0.2 pp')).toHaveLength(2)
    expect(screen.queryByText('+100.0%')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByText('No data to show')).toHaveLength(2))
  })

  it('shows a populated current rate without comparison when the previous period has no requests', async () => {
    mockEmptyLogs()
    renderMetrics(
      <OverviewMetrics
        metrics={{
          result: [metricRow('current', 500, 499), metricRow('previous', 0, 0)],
          error: null,
        }}
        isLoading={false}
        error={null}
      />
    )

    expect(screen.getAllByText('0.2%')).toHaveLength(2)
    expect(screen.queryByText(/ pp$/)).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByText('No data to show')).toHaveLength(2))
  })
})
