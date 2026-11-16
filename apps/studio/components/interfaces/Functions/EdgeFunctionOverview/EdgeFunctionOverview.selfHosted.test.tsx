import { dehydrate, QueryClient } from '@tanstack/react-query'
import { waitFor } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import { HttpResponse } from 'msw'
import { createDynamicRouteParser } from 'next-router-mock/dynamic-routes'
import { useRouter } from 'next/router'
import { afterAll, expect, it, vi } from 'vitest'

import type { EdgeFunction } from '@/data/edge-functions/edge-function-query'
import { projectKeys } from '@/data/projects/keys'
import OverviewPage from '@/pages/project/[ref]/functions/[functionSlug]/index'
import { createMockProject } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

vi.unmock('common')

const { default: routerMock } =
  await vi.importMock<typeof import('next-router-mock')>('next/router')
const removeRouteParser = routerMock.useParser(
  createDynamicRouteParser([
    '/project/[ref]/functions/[functionSlug]',
    '/project/[ref]/functions/[functionSlug]/details',
  ])
)
afterAll(removeRouteParser)

it('redirects the self-hosted overview to function details before feature flags load', async () => {
  routerMock.setCurrentUrl('/project/default/functions/send-email')
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(projectKeys.detail('default'), createMockProject({ ref: 'default' }))
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/functions/:function_slug',
    response: () =>
      HttpResponse.json<EdgeFunction>({
        id: 'function-id',
        name: 'Send email',
        slug: 'send-email',
        status: 'ACTIVE',
        version: 2,
        created_at: new Date('2026-03-20T08:00:00Z').valueOf(),
        updated_at: new Date('2026-03-20T09:00:00Z').valueOf(),
      }),
  })

  const OverviewRoute = () => {
    const { asPath } = useRouter()
    return asPath === '/project/default/functions/send-email' ? (
      <OverviewPage dehydratedState={dehydrate(queryClient)} />
    ) : null
  }

  customRender(
    <FeatureFlagContext.Provider value={{ configcat: {}, posthog: {}, hasLoaded: false }}>
      <OverviewRoute />
    </FeatureFlagContext.Provider>,
    { queryClient }
  )

  await waitFor(() =>
    expect(routerMock.asPath).toBe('/project/default/functions/send-email/details')
  )
})
