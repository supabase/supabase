import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { useRedirectLegacyReadReplicaDestination } from './useRedirectLegacyReadReplicaDestination'

const mockReplace = vi.fn()
const mockQuery = vi.fn(() => ({}) as Record<string, string | string[] | undefined>)
const mockIsReady = vi.fn(() => true)
const mockProjectRef = vi.fn(() => 'abc123')
const mockInfrastructureReadReplicas = vi.fn(() => true)

vi.mock('next/router', () => ({
  useRouter: () => ({
    isReady: mockIsReady(),
    query: mockQuery(),
    replace: mockReplace,
  }),
}))

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

describe('useRedirectLegacyReadReplicaDestination', () => {
  beforeEach(() => {
    mockReplace.mockClear()
    mockQuery.mockReturnValue({})
    mockIsReady.mockReturnValue(true)
    mockProjectRef.mockReturnValue('abc123')
    mockInfrastructureReadReplicas.mockReturnValue(true)
  })

  test('redirects legacy Read Replica destinationType to Infrastructure', async () => {
    mockQuery.mockReturnValue({ destinationType: 'Read Replica' })

    renderHook(() => useRedirectLegacyReadReplicaDestination())

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        '/project/abc123/settings/infrastructure?addReplica=true'
      )
    })
  })

  test('does not redirect for other destination types', () => {
    mockQuery.mockReturnValue({ destinationType: 'BigQuery' })

    renderHook(() => useRedirectLegacyReadReplicaDestination())

    expect(mockReplace).not.toHaveBeenCalled()
  })

  test('does not redirect when Infrastructure read replicas are disabled', () => {
    mockInfrastructureReadReplicas.mockReturnValue(false)
    mockQuery.mockReturnValue({ destinationType: 'Read Replica' })

    renderHook(() => useRedirectLegacyReadReplicaDestination())

    expect(mockReplace).not.toHaveBeenCalled()
  })
})
