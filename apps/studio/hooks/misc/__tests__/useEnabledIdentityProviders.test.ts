import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useEnabledIdentityProviders } from '../useEnabledIdentityProviders'
import {
  CHATGPT_IDENTITY_PROVIDER,
  GITHUB_IDENTITY_PROVIDER,
} from '@/lib/external-identity-providers'

const mockIsFeatureEnabled = vi.hoisted(() => vi.fn())
const mockUseLocalStorageQuery = vi.hoisted(() => vi.fn())

vi.mock('../useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: mockIsFeatureEnabled,
}))

vi.mock('../useLocalStorage', () => ({
  useLocalStorageQuery: mockUseLocalStorageQuery,
}))

describe('useEnabledIdentityProviders', () => {
  it('returns every provider when all flags are enabled', () => {
    mockIsFeatureEnabled.mockReturnValue({
      dashboardAuthSignInWithGithub: true,
      dashboardAuthSignInWithChatgpt: true,
    })
    mockUseLocalStorageQuery.mockReturnValue([true])

    const { result } = renderHook(() => useEnabledIdentityProviders())

    expect(result.current).toEqual([GITHUB_IDENTITY_PROVIDER, CHATGPT_IDENTITY_PROVIDER])
  })

  it('returns no providers when all flags are disabled', () => {
    mockIsFeatureEnabled.mockReturnValue({
      dashboardAuthSignInWithGithub: false,
      dashboardAuthSignInWithChatgpt: false,
    })
    mockUseLocalStorageQuery.mockReturnValue([false])

    const { result } = renderHook(() => useEnabledIdentityProviders())

    expect(result.current).toEqual([])
  })

  it('includes ChatGPT when its flag is enabled and the local storage switch is truthy', () => {
    mockIsFeatureEnabled.mockReturnValue({
      dashboardAuthSignInWithGithub: false,
      dashboardAuthSignInWithChatgpt: true,
    })
    mockUseLocalStorageQuery.mockReturnValue([true])

    const { result } = renderHook(() => useEnabledIdentityProviders())

    expect(result.current).toEqual([CHATGPT_IDENTITY_PROVIDER])
  })

  it('excludes ChatGPT when its flag is enabled but the local storage switch is unset', () => {
    mockIsFeatureEnabled.mockReturnValue({
      dashboardAuthSignInWithGithub: false,
      dashboardAuthSignInWithChatgpt: true,
    })
    mockUseLocalStorageQuery.mockReturnValue([false])

    const { result } = renderHook(() => useEnabledIdentityProviders())

    expect(result.current).toEqual([])
  })

  it('excludes ChatGPT when the local storage switch is truthy but its flag is disabled', () => {
    mockIsFeatureEnabled.mockReturnValue({
      dashboardAuthSignInWithGithub: false,
      dashboardAuthSignInWithChatgpt: false,
    })
    mockUseLocalStorageQuery.mockReturnValue([true])

    const { result } = renderHook(() => useEnabledIdentityProviders())

    expect(result.current).toEqual([])
  })
})
