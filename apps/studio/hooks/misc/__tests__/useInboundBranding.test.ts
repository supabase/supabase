import mockRouter from 'next-router-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useInboundBranding } from '../useInboundBranding'
import {
  GITHUB_IDENTITY_PROVIDER,
  type ExternalIdentityProviderConfig,
} from '@/lib/external-identity-providers'
import { customRenderHook } from '@/tests/lib/custom-render'

vi.mock('next/router', () => import('next-router-mock'))

const mockEnabledProviders = vi.hoisted(() => vi.fn<() => ExternalIdentityProviderConfig[]>())

vi.mock('../useEnabledIdentityProviders', () => ({
  useEnabledIdentityProviders: mockEnabledProviders,
}))

const enabledProvider: ExternalIdentityProviderConfig = GITHUB_IDENTITY_PROVIDER

describe('useInboundBranding', () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl('/sign-in')
    mockEnabledProviders.mockReturnValue([enabledProvider])
  })

  it('focuses an enabled provider without deriving a destination', () => {
    mockRouter.setCurrentUrl('/sign-in?method=github')

    const { result } = customRenderHook(() => useInboundBranding('sign-in'))

    expect(result.current.focusProvider?.authProvider).toBe('github')
    expect(result.current.destination).toBeUndefined()
  })

  it('does not focus on a destination id passed as the method param', () => {
    mockRouter.setCurrentUrl('/sign-in?method=cli')

    const { result } = customRenderHook(() => useInboundBranding('sign-in'))

    expect(result.current.focusProvider).toBeUndefined()
    expect(result.current.destination).toBeUndefined()
  })

  it('derives the destination from the destination param without a focused provider', () => {
    mockRouter.setCurrentUrl('/sign-in?destination=cli')

    const { result } = customRenderHook(() => useInboundBranding('sign-in'))

    expect(result.current.destination?.id).toBe('cli')
    expect(result.current.focusProvider).toBeUndefined()
  })

  it('keeps the destination when a provider is focused', () => {
    mockRouter.setCurrentUrl('/sign-in?destination=cli&method=github')

    const { result } = customRenderHook(() => useInboundBranding('sign-in'))

    expect(result.current.destination?.id).toBe('cli')
    expect(result.current.focusProvider?.authProvider).toBe('github')
  })

  it('ignores an unknown destination param', () => {
    mockRouter.setCurrentUrl('/sign-in?destination=not-a-real-destination')

    const { result } = customRenderHook(() => useInboundBranding('sign-in'))

    expect(result.current.destination).toBeUndefined()
    expect(result.current.focusProvider).toBeUndefined()
  })

  it('does not focus a provider that is hidden from the current flow', () => {
    mockEnabledProviders.mockReturnValue([{ ...enabledProvider, showOnSignUp: false }])
    mockRouter.setCurrentUrl('/sign-up?method=github')

    const { result } = customRenderHook(() => useInboundBranding('sign-up'))

    expect(result.current.focusProvider).toBeUndefined()
    expect(result.current.destination).toBeUndefined()
  })

  it('does not focus a provider that is not enabled', () => {
    mockEnabledProviders.mockReturnValue([])
    mockRouter.setCurrentUrl('/sign-in?method=github')

    const { result } = customRenderHook(() => useInboundBranding('sign-in'))

    expect(result.current.focusProvider).toBeUndefined()
    expect(result.current.destination).toBeUndefined()
  })
})
