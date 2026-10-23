import { beforeEach, describe, expect, it } from 'vitest'

import {
  clearPendingSigningSecretReveal,
  getPendingSigningSecretReveal,
  resetPendingSigningSecretRevealForTests,
  setPendingSigningSecretReveal,
  shouldHandleEndpointNotFound,
  shouldRedirectFromWebhooks,
} from './PlatformWebhooksPage.utils'

describe('PlatformWebhooksPage.utils', () => {
  const endpointId = '7f2c9d4a-6e31-4d9d-9a1f-2c4b5e6f7081'
  const otherEndpointId = '1a4e8c73-5b29-44af-8c62-9f1d2b3c4d5e'
  const missingEndpointId = '00000000-0000-4000-8000-000000000000'

  beforeEach(() => {
    resetPendingSigningSecretRevealForTests()
  })

  it('returns false when endpoint id is absent', () => {
    expect(
      shouldHandleEndpointNotFound({
        endpointId: undefined,
        hasSelectedEndpoint: false,
        pendingCreatedEndpointId: null,
      })
    ).toBe(false)
  })

  it('returns false when endpoint is selected', () => {
    expect(
      shouldHandleEndpointNotFound({
        endpointId,
        hasSelectedEndpoint: true,
        pendingCreatedEndpointId: null,
      })
    ).toBe(false)
  })

  it('returns false while route is transitioning to a newly created endpoint', () => {
    expect(
      shouldHandleEndpointNotFound({
        endpointId,
        hasSelectedEndpoint: false,
        pendingCreatedEndpointId: endpointId,
      })
    ).toBe(false)
  })

  it('returns true for invalid endpoint routes', () => {
    expect(
      shouldHandleEndpointNotFound({
        endpointId: missingEndpointId,
        hasSelectedEndpoint: false,
        pendingCreatedEndpointId: null,
      })
    ).toBe(true)
  })

  describe('shouldRedirectFromWebhooks', () => {
    it('does not redirect while flags are still loading', () => {
      expect(
        shouldRedirectFromWebhooks({ areFlagsReady: false, isScopeReady: true, isEnabled: false })
      ).toBe(false)
    })

    it('does not redirect before route params are populated', () => {
      expect(
        shouldRedirectFromWebhooks({ areFlagsReady: true, isScopeReady: false, isEnabled: false })
      ).toBe(false)
    })

    it('does not redirect when webhooks are enabled', () => {
      expect(
        shouldRedirectFromWebhooks({ areFlagsReady: true, isScopeReady: true, isEnabled: true })
      ).toBe(false)
    })

    it('redirects once ready and webhooks are disabled', () => {
      expect(
        shouldRedirectFromWebhooks({ areFlagsReady: true, isScopeReady: true, isEnabled: false })
      ).toBe(true)
    })
  })

  it('stores and reads pending signing secret reveal for matching endpoint route', () => {
    setPendingSigningSecretReveal('project', {
      endpointId,
      signingSecret: 'whsec_example',
    })

    expect(getPendingSigningSecretReveal('project', endpointId)).toEqual({
      endpointId,
      signingSecret: 'whsec_example',
    })
  })

  it('ignores pending signing secret reveal when endpoint route does not match', () => {
    setPendingSigningSecretReveal('project', {
      endpointId,
      signingSecret: 'whsec_example',
    })

    expect(getPendingSigningSecretReveal('project', otherEndpointId)).toBeNull()
  })

  it('clears pending signing secret reveal', () => {
    setPendingSigningSecretReveal('project', {
      endpointId,
      signingSecret: 'whsec_example',
    })

    clearPendingSigningSecretReveal('project')

    expect(getPendingSigningSecretReveal('project', endpointId)).toBeNull()
  })
})
