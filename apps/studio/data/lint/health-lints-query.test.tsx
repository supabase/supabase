import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { FeatureFlagContext } from 'common'
import { HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { useProjectHealthLintsQuery } from './health-lints-query'
import { projectKeys } from '@/data/projects/keys'
import { addAPIMock } from '@/tests/lib/msw'

vi.mock('@/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants')>()),
  IS_PLATFORM: true,
}))

type HealthResponse = components['schemas']['V2ProjectAdvisorsResponse_Output']

function createWrapper(configcat: Record<string, boolean>, hasLoaded: boolean) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(projectKeys.detail('default'), {
    ref: 'default',
    status: 'ACTIVE_HEALTHY',
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <FeatureFlagContext.Provider value={{ configcat, posthog: {}, hasLoaded }}>
          {children}
        </FeatureFlagContext.Provider>
      </QueryClientProvider>
    )
  }
}

describe('useProjectHealthLintsQuery feature flag', () => {
  it.each<{ configcat: Record<string, boolean>; hasLoaded: boolean }>([
    { configcat: { healthAdvisor: false }, hasLoaded: true },
    { configcat: {}, hasLoaded: false },
  ])('keeps health checks idle with %o', async ({ configcat, hasLoaded }) => {
    const { result } = renderHook(() => useProjectHealthLintsQuery({ projectRef: 'default' }), {
      wrapper: createWrapper(configcat, hasLoaded),
    })

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))
    expect(result.current.isEnabled).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('requests health checks when the flag is enabled', async () => {
    addAPIMock({
      method: 'post',
      path: '/v2/projects/:ref/advisors/run',
      response: () =>
        HttpResponse.json<HealthResponse>({
          data: { type: 'project_advisors', attributes: { lints: [] } },
        }),
    })

    const { result } = renderHook(() => useProjectHealthLintsQuery({ projectRef: 'default' }), {
      wrapper: createWrapper({ healthAdvisor: true }, true),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })
})
