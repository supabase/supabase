import { waitFor } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import mockRouter from 'next-router-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useInboundBranding } from './useInboundBranding'
import type { ApiAuthorizationResponse } from '@/data/api-authorization/api-authorization-query'
import {
  GITHUB_IDENTITY_PROVIDER,
  type ExternalIdentityProviderConfig,
} from '@/lib/external-identity-providers'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type GetOAuthAuthorizationResponse = components['schemas']['GetOAuthAuthorizationResponse']

vi.mock('next/router', () => import('next-router-mock'))

const mockEnabledProviders = vi.hoisted(() => vi.fn<() => ExternalIdentityProviderConfig[]>())

vi.mock('./useEnabledIdentityProviders', () => ({
  useEnabledIdentityProviders: mockEnabledProviders,
}))

const enabledProvider: ExternalIdentityProviderConfig = GITHUB_IDENTITY_PROVIDER

describe('useInboundBranding', () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl('/sign-in')
    mockEnabledProviders.mockReturnValue([enabledProvider])
  })

  it('focuses an enabled provider without deriving a destination', () => {
    mockRouter.setCurrentUrl('/sign-in?provider=github')

    const { result } = customRenderHook(() => useInboundBranding('sign-in'))

    expect(result.current.focusProvider?.authProvider).toBe('github')
    expect(result.current.destination).toBeUndefined()
  })

  it('does not focus on a destination id passed as the provider param', () => {
    mockRouter.setCurrentUrl('/sign-in?provider=cli')

    const { result } = customRenderHook(() => useInboundBranding('sign-in'))

    expect(result.current.focusProvider).toBeUndefined()
    expect(result.current.destination).toBeUndefined()
  })

  it('derives the destination from returnTo without a focused provider', () => {
    mockRouter.setCurrentUrl('/sign-in?returnTo=%2Fcli%2Flogin%3Fsession_id%3Dabc')

    const { result } = customRenderHook(() => useInboundBranding('sign-in'))

    expect(result.current.destination?.id).toBe('cli')
    expect(result.current.focusProvider).toBeUndefined()
  })

  it('keeps the returnTo destination when a provider is focused', () => {
    mockRouter.setCurrentUrl('/sign-in?returnTo=%2Fcli%2Flogin&provider=github')

    const { result } = customRenderHook(() => useInboundBranding('sign-in'))

    expect(result.current.destination?.id).toBe('cli')
    expect(result.current.focusProvider?.authProvider).toBe('github')
  })

  it('brands an OAuth app destination from the authorization request in returnTo', async () => {
    const authorization: ApiAuthorizationResponse = {
      name: 'Acme App',
      website: 'https://acme.app',
      icon: null,
      domain: 'acme.app',
      scopes: [],
      expires_at: new Date(Date.now() + 60_000).toISOString(),
      approved_at: null,
      registration_type: 'manual',
    }
    addAPIMock({
      method: 'get',
      path: '/platform/oauth/authorizations/:id',
      // The frontend type widens the OpenAPI shape (see ApiAuthorization.test.tsx); cast to
      // satisfy the network-boundary contract.
      response: () =>
        HttpResponse.json<GetOAuthAuthorizationResponse>(
          authorization as unknown as GetOAuthAuthorizationResponse
        ),
    })
    mockRouter.setCurrentUrl('/sign-in?returnTo=%2Fauthorize%3Fauth_id%3Dabc123')

    const { result } = customRenderHook(() => useInboundBranding('sign-in'))

    await waitFor(() => expect(result.current.destination?.id).toBe('oauth-app'))
    expect(result.current.destination?.displayName).toBe('Acme App')
    expect(result.current.focusProvider).toBeUndefined()
  })

  it('brands an OAuth app destination when a provider is focused', async () => {
    const authorization: ApiAuthorizationResponse = {
      name: 'Acme App',
      website: 'https://acme.app',
      icon: null,
      domain: 'acme.app',
      scopes: [],
      expires_at: new Date(Date.now() + 60_000).toISOString(),
      approved_at: null,
      registration_type: 'manual',
    }
    addAPIMock({
      method: 'get',
      path: '/platform/oauth/authorizations/:id',
      response: () =>
        HttpResponse.json<GetOAuthAuthorizationResponse>(
          authorization as unknown as GetOAuthAuthorizationResponse
        ),
    })
    mockRouter.setCurrentUrl('/sign-in?returnTo=%2Fauthorize%3Fauth_id%3Dabc123&provider=github')

    const { result } = customRenderHook(() => useInboundBranding('sign-in'))

    await waitFor(() => expect(result.current.destination?.id).toBe('oauth-app'))
    expect(result.current.focusProvider?.authProvider).toBe('github')
  })

  it('does not focus a provider that is hidden from the current flow', () => {
    mockEnabledProviders.mockReturnValue([{ ...enabledProvider, showOnSignUp: false }])
    mockRouter.setCurrentUrl('/sign-up?provider=github')

    const { result } = customRenderHook(() => useInboundBranding('sign-up'))

    expect(result.current.focusProvider).toBeUndefined()
    expect(result.current.destination).toBeUndefined()
  })

  it('does not focus a provider that is not enabled', () => {
    mockEnabledProviders.mockReturnValue([])
    mockRouter.setCurrentUrl('/sign-in?provider=github')

    const { result } = customRenderHook(() => useInboundBranding('sign-in'))

    expect(result.current.focusProvider).toBeUndefined()
    expect(result.current.destination).toBeUndefined()
  })
})
