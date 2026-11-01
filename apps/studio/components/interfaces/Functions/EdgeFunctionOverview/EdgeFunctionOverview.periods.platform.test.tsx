import { dehydrate, QueryClient } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeatureFlagContext } from 'common'
import { HttpResponse } from 'msw'
import { afterEach, expect, it, vi } from 'vitest'

import { configKeys } from '@/data/config/keys'
import { customDomainKeys } from '@/data/custom-domains/keys'
import type { EdgeFunction } from '@/data/edge-functions/edge-function-query'
import { edgeFunctionsKeys } from '@/data/edge-functions/keys'
import { projectKeys } from '@/data/projects/keys'
import { subscriptionKeys } from '@/data/subscriptions/keys'
import OverviewPage from '@/pages/project/[ref]/functions/[functionSlug]/index'
import { createMockProject } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

afterEach(() => vi.useRealTimers())

it('loads the overview before feature flags and updates metrics with the selected period', async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-03-20T10:37:21Z'))
  const user = userEvent.setup()
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(projectKeys.detail('default'), createMockProject({ ref: 'default' }))
  queryClient.setQueryData(configKeys.settingsV2('default'), {
    app_config: { endpoint: 'default.supabase.co' },
  })
  queryClient.setQueryData(subscriptionKeys.addons('default'), { selected_addons: [] })
  queryClient.setQueryData(customDomainKeys.list('default'), {})
  queryClient.setQueryData<EdgeFunction>(edgeFunctionsKeys.detail('default', undefined), {
    id: 'function-id',
    name: 'Send email',
    slug: 'send-email',
    status: 'ACTIVE',
    version: 2,
    created_at: new Date('2026-03-20T08:00:00Z').valueOf(),
    updated_at: new Date('2026-03-20T09:00:00Z').valueOf(),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/analytics/endpoints/functions.combined-stats',
    response: ({ request }) => {
      const interval = new URL(request.url).searchParams.get('interval')
      if (interval === '15min') return HttpResponse.json<{ result: never[] }>({ result: [] })
      const isDaily = interval === '1day'
      return HttpResponse.json<{
        result: Array<{ timestamp: string; avg_execution_time: number }>
      }>({
        result: [
          { timestamp: '2026-03-20T10:35:00Z', avg_execution_time: isDaily ? 90 : 40 },
          { timestamp: '2026-03-20T10:36:00Z', avg_execution_time: isDaily ? 90 : 80 },
        ],
      })
    },
  })
  addAPIMock({
    method: 'post',
    path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
    response: () => HttpResponse.json<{ result: never[] }>({ result: [] }),
  })

  customRender(
    <FeatureFlagContext.Provider value={{ configcat: {}, posthog: {}, hasLoaded: false }}>
      <OverviewPage dehydratedState={dehydrate(queryClient)} />
    </FeatureFlagContext.Provider>,
    { queryClient }
  )

  expect(await screen.findByText('60ms')).toBeVisible()
  await user.click(screen.getByRole('button', { name: '15 min' }))
  expect((await screen.findAllByText('No data to show'))[0]).toBeVisible()
  await user.click(screen.getByRole('button', { name: '1 day' }))
  await waitFor(() =>
    expect(screen.getByRole('button', { name: '1 day', pressed: true })).toBeVisible()
  )
  expect(await screen.findByText('90ms')).toBeVisible()
})
