// @vitest-environment jsdom
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
  it.each([
    [{ github: true, chatgpt: true }, [GITHUB_IDENTITY_PROVIDER, CHATGPT_IDENTITY_PROVIDER]],
    [{ github: true, chatgpt: false }, [GITHUB_IDENTITY_PROVIDER]],
    [{ github: false, chatgpt: true }, [CHATGPT_IDENTITY_PROVIDER]],
    [{ github: false, chatgpt: false }, []],
  ])('returns only the providers whose flags are enabled: %o', (flags, expected) => {
    mockFeatures(flags)

    const { result } = renderHook(() => useEnabledIdentityProviders())

    expect(result.current).toEqual(expected)
  })
})
