import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useEnabledIdentityProviders } from '../useEnabledIdentityProviders'
import { GITHUB_IDENTITY_PROVIDER } from '@/lib/external-identity-providers'

const mockIsFeatureEnabled = vi.hoisted(() => vi.fn())

vi.mock('../useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: mockIsFeatureEnabled,
}))

describe('useEnabledIdentityProviders', () => {
  it('returns every provider when all flags are enabled', () => {
    mockIsFeatureEnabled.mockReturnValue({
      dashboardAuthSignInWithGithub: true,
    })

    const { result } = renderHook(() => useEnabledIdentityProviders())

    expect(result.current).toEqual([GITHUB_IDENTITY_PROVIDER])
  })

  it('returns no providers when all flags are disabled', () => {
    mockIsFeatureEnabled.mockReturnValue({
      dashboardAuthSignInWithGithub: false,
    })

    const { result } = renderHook(() => useEnabledIdentityProviders())

    expect(result.current).toEqual([])
  })
})
