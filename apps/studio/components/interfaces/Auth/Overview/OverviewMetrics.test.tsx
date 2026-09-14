import { screen, waitFor } from '@testing-library/react'
import type { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
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
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type AnalyticsResponse = platformComponents['schemas']['AnalyticsResponse']

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

beforeEach(() => {
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

    customRender(<OverviewMetrics isLoading={false} error={null} />)

    expect(await screen.findByText('/auth/v1/token')).toBeVisible()
    expect(await screen.findByText('invalid_credentials')).toBeVisible()
    expect(screen.getByText('7')).toBeVisible()
    expect(screen.getByText('3')).toBeVisible()
    expect(requests).toHaveLength(2)
    for (const request of requests) {
      expect(request.pathname).toContain('/projects/default/analytics/endpoints/')
      const start = Date.parse(request.searchParams.get('iso_timestamp_start') ?? '')
      const end = Date.parse(request.searchParams.get('iso_timestamp_end') ?? '')
      expect(end - start).toBeCloseTo(24 * 60 * 60 * 1000, -2)
    }
  })

  describe.each(logQueries)('failures with useOtel=$useOtel', (query) => {
    it.each(['http', 'string', 'object'] as const)(
      'shows %s errors instead of empty log tables',
      async (failure) => {
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

        customRender(<OverviewMetrics isLoading={false} error={null} />)

        expect(await screen.findByText('Failed to retrieve Auth API errors')).toBeVisible()
        expect(await screen.findByText('Failed to retrieve Auth server errors')).toBeVisible()
        expect(screen.getAllByText('Error: Analytics unavailable')).toHaveLength(2)
        expect(screen.queryByText('No data to show')).not.toBeInTheDocument()
      }
    )
  })
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
    customRender(<OverviewMetrics metrics={metrics} isLoading={false} error={null} />)

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
    const { rerender } = customRender(
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
    customRender(
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
