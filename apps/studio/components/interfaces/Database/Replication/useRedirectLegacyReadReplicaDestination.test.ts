// @vitest-environment jsdom
import { waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { useRedirectLegacyReadReplicaDestination } from './useRedirectLegacyReadReplicaDestination'
import { createTestRouter, customRenderHook } from '@/tests/lib/custom-render'

const mockParams = vi.fn(() => ({ ref: 'abc123' }) as Record<string, string | undefined>)
const mockInfrastructureReadReplicas = vi.fn(() => true)

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useParams: () => mockParams(),
  }
})

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: () => ({
    infrastructureReadReplicas: mockInfrastructureReadReplicas(),
  }),
}))

describe('useRedirectLegacyReadReplicaDestination', () => {
  beforeEach(() => {
    mockParams.mockReturnValue({ ref: 'abc123', destinationType: 'Read Replica' })
    mockInfrastructureReadReplicas.mockReturnValue(true)
  })

  test('redirects legacy Read Replica destinationType to Infrastructure', async () => {
    const router = createTestRouter('/project/abc123/database/pipelines')
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
    mockParams.mockReturnValue({ ref: 'abc123', destinationType: 'BigQuery' })
    const router = createTestRouter()
    const navigateSpy = vi.spyOn(router, 'navigate')

    customRenderHook(() => useRedirectLegacyReadReplicaDestination(), { router })

    expect(navigateSpy).not.toHaveBeenCalled()
  })

  test('does not redirect when Infrastructure read replicas are disabled', () => {
    mockInfrastructureReadReplicas.mockReturnValue(false)
    const router = createTestRouter()
    const navigateSpy = vi.spyOn(router, 'navigate')

    customRenderHook(() => useRedirectLegacyReadReplicaDestination(), { router })

    expect(navigateSpy).not.toHaveBeenCalled()
  })
})
