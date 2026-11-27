import { QueryClient } from '@tanstack/react-query'
import { waitFor } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import { HttpResponse } from 'msw'
import { expect, it, vi } from 'vitest'

import type { EdgeFunction } from '@/data/edge-functions/edge-function-query'
import { projectKeys } from '@/data/projects/keys'
import { Route } from '@/routes/project/$ref/functions/$functionSlug/index'
import { createMockProject } from '@/tests/helpers'
import { CustomWrapper } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { renderRoute } from '@/tests/lib/route-render'

vi.unmock('common')

it('redirects the self-hosted overview to function details before feature flags load', async () => {
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

  const { router } = await renderRoute(Route, {
    routeId: '/project/$ref/functions/$functionSlug/',
    url: '/project/default/functions/send-email',
    renderOptions: {
      wrapper: ({ children }) => (
        <CustomWrapper queryClient={queryClient}>
          <FeatureFlagContext.Provider value={{ configcat: {}, posthog: {}, hasLoaded: false }}>
            {children}
          </FeatureFlagContext.Provider>
        </CustomWrapper>
      ),
    },
  })

  await waitFor(() =>
    expect(router.state.location.pathname).toBe('/project/default/functions/send-email/details')
  )
})
