// @vitest-environment jsdom
import { createMemoryHistory, createRootRoute, createRouter } from '@tanstack/react-router'
import { waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { useRedirectLegacyReadReplicaDestination } from './useRedirectLegacyReadReplicaDestination'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'
import { customRenderHook } from '@/tests/lib/custom-render'

const mockProjectRef = vi.fn(() => 'abc123')
const mockInfrastructureReadReplicas = vi.fn(() => true)

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useParams: () => ({ ref: mockProjectRef() }),
  }
})

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: () => ({
    infrastructureReadReplicas: mockInfrastructureReadReplicas(),
  }),
}))

const createTestRouter = (initialUrl: string) =>
  createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({ initialEntries: [initialUrl] }),
    parseSearch,
    stringifySearch,
  })

describe('useRedirectLegacyReadReplicaDestination', () => {
  beforeEach(() => {
    mockProjectRef.mockReturnValue('abc123')
    mockInfrastructureReadReplicas.mockReturnValue(true)
  })

  test('redirects legacy Read Replica destinationType to Infrastructure', async () => {
    const router = createTestRouter(
      '/project/abc123/database/pipelines?destinationType=Read+Replica'
    )
    const navigateSpy = vi.spyOn(router, 'navigate')

    customRenderHook(() => useRedirectLegacyReadReplicaDestination(), { router })

    await waitFor(() => {
      expect(router.state.location.href).toBe(
        '/project/abc123/settings/infrastructure?addReplica=true'
      )
    })
    expect(navigateSpy).toHaveBeenCalledWith(expect.objectContaining({ replace: true }))
  })

  test('does not redirect for other destination types', () => {
    const router = createTestRouter('/project/abc123/database/pipelines?destinationType=BigQuery')
    const navigateSpy = vi.spyOn(router, 'navigate')

    customRenderHook(() => useRedirectLegacyReadReplicaDestination(), { router })

    expect(navigateSpy).not.toHaveBeenCalled()
  })

  test('does not redirect when Infrastructure read replicas are disabled', () => {
    mockInfrastructureReadReplicas.mockReturnValue(false)
    const router = createTestRouter(
      '/project/abc123/database/pipelines?destinationType=Read+Replica'
    )
    const navigateSpy = vi.spyOn(router, 'navigate')

    customRenderHook(() => useRedirectLegacyReadReplicaDestination(), { router })

    expect(navigateSpy).not.toHaveBeenCalled()
  })
})
