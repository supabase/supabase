import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useEnabledIdentityProviders } from '../useEnabledIdentityProviders'
import {
  CHATGPT_IDENTITY_PROVIDER,
  GITHUB_IDENTITY_PROVIDER,
} from '@/lib/external-identity-providers'

const mockIsFeatureEnabled = vi.hoisted(() => vi.fn())

vi.mock('../useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: mockIsFeatureEnabled,
}))

function mockFeatures({ github = false, chatgpt = true }: { github?: boolean; chatgpt?: boolean }) {
  mockIsFeatureEnabled.mockReturnValue({
    dashboardAuthSignInWithGithub: github,
    dashboardAuthSignInWithChatgpt: chatgpt,
  })
}

describe('useEnabledIdentityProviders', () => {
  it('returns every provider when all flags are enabled', () => {
    mockFeatures({ github: true, chatgpt: true })

    const { result } = renderHook(() => useEnabledIdentityProviders())

    expect(result.current).toEqual([GITHUB_IDENTITY_PROVIDER, CHATGPT_IDENTITY_PROVIDER])
  })

  it('returns no providers when all flags are disabled', () => {
    mockFeatures({ github: false, chatgpt: false })

    const { result } = renderHook(() => useEnabledIdentityProviders())

    expect(result.current).toEqual([])
  })

  it('includes ChatGPT when its feature flag is enabled', () => {
    mockFeatures({ chatgpt: true })

    const { result } = renderHook(() => useEnabledIdentityProviders())

    expect(result.current).toEqual([CHATGPT_IDENTITY_PROVIDER])
  })

  it('excludes ChatGPT when its feature flag is disabled', () => {
    mockFeatures({ github: true, chatgpt: false })

    const { result } = renderHook(() => useEnabledIdentityProviders())

    expect(result.current).toEqual([GITHUB_IDENTITY_PROVIDER])
  })

  it('excludes GitHub when its feature flag is disabled', () => {
    mockFeatures({ github: false, chatgpt: true })

    const { result } = renderHook(() => useEnabledIdentityProviders())

    expect(result.current).toEqual([CHATGPT_IDENTITY_PROVIDER])
  })
})
