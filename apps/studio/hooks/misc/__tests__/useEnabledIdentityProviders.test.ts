import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useEnabledIdentityProviders } from '../useEnabledIdentityProviders'
import {
  CHATGPT_IDENTITY_PROVIDER,
  GITHUB_IDENTITY_PROVIDER,
} from '@/lib/external-identity-providers'

const mockIsFeatureEnabled = vi.hoisted(() => vi.fn())
const mockUseLocalStorageQuery = vi.hoisted(() => vi.fn())
const mockUseFlag = vi.hoisted(() => vi.fn())

vi.mock('../useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: mockIsFeatureEnabled,
}))

vi.mock('../useLocalStorage', () => ({
  useLocalStorageQuery: mockUseLocalStorageQuery,
}))

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useFlag: mockUseFlag,
}))

describe('useEnabledIdentityProviders', () => {
  beforeEach(() => {
    mockUseFlag.mockReset()
  })

  it('returns every provider when all flags are enabled', () => {
    mockIsFeatureEnabled.mockReturnValue({
      dashboardAuthSignInWithGithub: true,
    })
    mockUseLocalStorageQuery.mockReturnValue([true])
    mockUseFlag.mockReturnValue(true)

    const { result } = renderHook(() => useEnabledIdentityProviders())

    expect(result.current).toEqual([GITHUB_IDENTITY_PROVIDER, CHATGPT_IDENTITY_PROVIDER])
  })

  it('returns no providers when all flags are disabled', () => {
    mockIsFeatureEnabled.mockReturnValue({
      dashboardAuthSignInWithGithub: false,
    })
    mockUseLocalStorageQuery.mockReturnValue([false])
    mockUseFlag.mockReturnValue(false)

    const { result } = renderHook(() => useEnabledIdentityProviders())

    expect(result.current).toEqual([])
  })

  it('includes ChatGPT when localStorage is true and configcat is true', () => {
    mockIsFeatureEnabled.mockReturnValue({ dashboardAuthSignInWithGithub: false })
    mockUseLocalStorageQuery.mockReturnValue([true])
    mockUseFlag.mockReturnValue(true)

    const { result } = renderHook(() => useEnabledIdentityProviders())

    expect(result.current).toEqual([CHATGPT_IDENTITY_PROVIDER])
  })

  it('includes ChatGPT when localStorage is true and configcat is false', () => {
    mockIsFeatureEnabled.mockReturnValue({ dashboardAuthSignInWithGithub: false })
    mockUseLocalStorageQuery.mockReturnValue([true])
    mockUseFlag.mockReturnValue(false)

    const { result } = renderHook(() => useEnabledIdentityProviders())

    expect(result.current).toEqual([CHATGPT_IDENTITY_PROVIDER])
  })

  it('includes ChatGPT when localStorage is false and configcat is true', () => {
    mockIsFeatureEnabled.mockReturnValue({ dashboardAuthSignInWithGithub: false })
    mockUseLocalStorageQuery.mockReturnValue([false])
    mockUseFlag.mockReturnValue(true)

    const { result } = renderHook(() => useEnabledIdentityProviders())

    expect(result.current).toEqual([CHATGPT_IDENTITY_PROVIDER])
  })

  it('excludes ChatGPT when localStorage is false and configcat is false', () => {
    mockIsFeatureEnabled.mockReturnValue({ dashboardAuthSignInWithGithub: false })
    mockUseLocalStorageQuery.mockReturnValue([false])
    mockUseFlag.mockReturnValue(false)

    const { result } = renderHook(() => useEnabledIdentityProviders())

    expect(result.current).toEqual([])
  })

  it('includes GitHub when its feature flag is enabled', () => {
    mockIsFeatureEnabled.mockReturnValue({ dashboardAuthSignInWithGithub: true })
    mockUseLocalStorageQuery.mockReturnValue([false])
    mockUseFlag.mockReturnValue(false)

    const { result } = renderHook(() => useEnabledIdentityProviders())

    expect(result.current).toEqual([GITHUB_IDENTITY_PROVIDER])
  })

  it('excludes GitHub when its feature flag is disabled', () => {
    mockIsFeatureEnabled.mockReturnValue({ dashboardAuthSignInWithGithub: false })
    mockUseLocalStorageQuery.mockReturnValue([false])
    mockUseFlag.mockReturnValue(false)

    const { result } = renderHook(() => useEnabledIdentityProviders())

    expect(result.current).toEqual([])
  })
})
