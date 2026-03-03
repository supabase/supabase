import { beforeEach, describe, expect, it } from 'vitest'

import {
  clearPendingSigningSecretReveal,
  getPendingSigningSecretReveal,
  resetPendingSigningSecretRevealForTests,
  setPendingSigningSecretReveal,
  shouldHandleEndpointNotFound,
} from './PlatformWebhooksPage.utils'

describe('PlatformWebhooksPage.utils', () => {
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
        endpointId: 'endpoint-abc12345',
        hasSelectedEndpoint: true,
        pendingCreatedEndpointId: null,
      })
    ).toBe(false)
  })

  it('returns false while route is transitioning to a newly created endpoint', () => {
    expect(
      shouldHandleEndpointNotFound({
        endpointId: 'endpoint-abc12345',
        hasSelectedEndpoint: false,
        pendingCreatedEndpointId: 'endpoint-abc12345',
      })
    ).toBe(false)
  })

  it('returns true for invalid endpoint routes', () => {
    expect(
      shouldHandleEndpointNotFound({
        endpointId: 'endpoint-missing',
        hasSelectedEndpoint: false,
        pendingCreatedEndpointId: null,
      })
    ).toBe(true)
  })

  it('stores and reads pending signing secret reveal for matching endpoint route', () => {
    setPendingSigningSecretReveal('project', {
      endpointId: 'endpoint-abc12345',
      signingSecret: 'whsec_example',
    })

    expect(getPendingSigningSecretReveal('project', 'endpoint-abc12345')).toEqual({
      endpointId: 'endpoint-abc12345',
      signingSecret: 'whsec_example',
    })
  })

  it('ignores pending signing secret reveal when endpoint route does not match', () => {
    setPendingSigningSecretReveal('project', {
      endpointId: 'endpoint-abc12345',
      signingSecret: 'whsec_example',
    })

    expect(getPendingSigningSecretReveal('project', 'endpoint-other')).toBeNull()
  })

  it('clears pending signing secret reveal', () => {
    setPendingSigningSecretReveal('project', {
      endpointId: 'endpoint-abc12345',
      signingSecret: 'whsec_example',
    })

    clearPendingSigningSecretReveal('project')

    expect(getPendingSigningSecretReveal('project', 'endpoint-abc12345')).toBeNull()
  })
})
