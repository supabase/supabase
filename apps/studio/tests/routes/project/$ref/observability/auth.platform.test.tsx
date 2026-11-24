import { QueryClient } from '@tanstack/react-query'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import dayjs from 'dayjs'
import { mockAnimationsApi, mockIntersectionObserver } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { expect, test } from 'vitest'

import type { components } from '@/data/api'
import { organizationKeys } from '@/data/organizations/keys'
import { projectKeys } from '@/data/projects/keys'
import { Route } from '@/routes/project/$ref/observability/auth'
import { CustomWrapper } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { renderRoute } from '@/tests/lib/route-render'

type LogsResponse = components['schemas']['AnalyticsResponse_Output']

mockAnimationsApi()
mockIntersectionObserver()

test('refresh reloads Auth charts and shared API metrics for a custom URL range', async () => {
  const start = dayjs().subtract(3, 'hour').toISOString()
  const end = dayjs().subtract(2, 'hour').toISOString()
  const queries: string[] = []
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/analytics/endpoints/logs.all',
    response: ({ request }) => {
      queries.push(new URL(request.url).searchParams.get('sql') ?? '')
      return HttpResponse.json<LogsResponse>({ result: [] })
    },
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(projectKeys.detail('default'), { organization_id: 1 })
  queryClient.setQueryData(organizationKeys.list(), [
    { id: 1, slug: 'test-org', plan: { id: 'free' } },
  ])
  queryClient.setQueryData(organizationKeys.entitlements('test-org'), {
    entitlements: [],
  })

  await renderRoute(Route, {
    routeId: '/project/$ref/observability/auth',
    url: '/project/default/observability/auth',
    queryClient,
    renderOptions: {
      wrapper: ({ children }) => (
        <FeatureFlagContext.Provider
          value={{ configcat: { otelReports: false }, posthog: {}, hasLoaded: true }}
        >
          <CustomWrapper
            queryClient={queryClient}
            nuqs={{ hasMemory: true, searchParams: { its: start, ite: end } }}
          >
            {children}
          </CustomWrapper>
        </FeatureFlagContext.Provider>
      ),
    },
  })

  await screen.findByRole('heading', { name: 'Auth' })
  await waitFor(() => expect(queries.filter((sql) => sql.includes('reports-api-'))).toHaveLength(7))
  await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  expect(queries.some((sql) => !sql.includes('reports-api-'))).toBe(true)
  const initialQueries = [...queries].sort()
  queries.length = 0

  fireEvent.keyDown(document, { key: 'R', code: 'KeyR', shiftKey: true })

  await waitFor(() => expect(queries).toHaveLength(initialQueries.length))
  expect([...queries].sort()).toEqual(initialQueries)
})
