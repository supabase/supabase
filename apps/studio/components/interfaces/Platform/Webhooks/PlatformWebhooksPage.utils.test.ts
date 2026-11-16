import { beforeEach, describe, expect, it } from 'vitest'

import type { WebhookDelivery } from './PlatformWebhooks.types'
import {
  clearPendingSigningSecretReveal,
  findDeliveryToRetry,
  getDeliveriesRefetchInterval,
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

  describe('findDeliveryToRetry', () => {
    const makeDelivery = (id: string): WebhookDelivery => ({
      id,
      endpointId,
      eventId: 'evt_1',
      eventType: 'v1.project.paused',
      eventPayload: {},
      status: 'failure',
      responseCode: 500,
      responseBody: null,
      responseHeaders: null,
      attemptAt: '2026-02-27T08:04:00.000Z',
    })
    const onPage = makeDelivery('on-page')
    const offPage = makeDelivery('off-page')

    it('finds a delivery that is on the current page', () => {
      expect(
        findDeliveryToRetry({
          deliveryId: 'on-page',
          selectedDelivery: null,
          pageDeliveries: [onPage],
        })
      ).toBe(onPage)
    })

    it('uses the selected delivery when it is not on the current page', () => {
      expect(
        findDeliveryToRetry({
          deliveryId: 'off-page',
          selectedDelivery: offPage,
          pageDeliveries: [onPage],
        })
      ).toBe(offPage)
    })

    it('prefers the table row over a stale selected delivery with the same id', () => {
      const staleSelected = { ...onPage, status: 'pending' as const }
      const freshRow = { ...onPage, status: 'success' as const }

      expect(
        findDeliveryToRetry({
          deliveryId: 'on-page',
          selectedDelivery: staleSelected,
          pageDeliveries: [freshRow],
        })
      ).toBe(freshRow)
    })

    it('ignores the selected delivery when the id is a different one', () => {
      expect(
        findDeliveryToRetry({
          deliveryId: 'on-page',
          selectedDelivery: offPage,
          pageDeliveries: [onPage],
        })
      ).toBe(onPage)
    })

    it('returns undefined when the delivery is neither selected nor on the page', () => {
      expect(
        findDeliveryToRetry({
          deliveryId: 'missing',
          selectedDelivery: offPage,
          pageDeliveries: [onPage],
        })
      ).toBeUndefined()
    })
  })

  describe('getDeliveriesRefetchInterval', () => {
    const makeDelivery = (id: string, status: WebhookDelivery['status']): WebhookDelivery => ({
      id,
      endpointId,
      eventId: 'evt_1',
      eventType: 'v1.project.paused',
      eventPayload: {},
      status,
      responseCode: 200,
      responseBody: null,
      responseHeaders: null,
      attemptAt: '2026-02-27T08:04:00.000Z',
    })
    const settled = [makeDelivery('newest', 'success'), makeDelivery('older', 'failure')]
    const base = {
      isLive: false,
      isAwaitingDelivery: false,
      deliveries: settled,
    }

    it('does not poll by default', () => {
      expect(getDeliveriesRefetchInterval(base)).toBe(false)
    })

    it('polls while Live is on', () => {
      expect(getDeliveriesRefetchInterval({ ...base, isLive: true })).toBe(5000)
    })

    it('polls while a delivery is pending', () => {
      const deliveries = [makeDelivery('newest', 'pending'), ...settled]

      expect(getDeliveriesRefetchInterval({ ...base, deliveries })).toBe(5000)
    })

    it('polls while waiting for the delivery of a test event or retry', () => {
      expect(getDeliveriesRefetchInterval({ ...base, isAwaitingDelivery: true })).toBe(5000)
    })

    it('keeps polling while waiting, even when another delivery is on top of the table', () => {
      const deliveries = [makeDelivery('unrelated', 'success'), ...settled]

      expect(getDeliveriesRefetchInterval({ ...base, deliveries, isAwaitingDelivery: true })).toBe(
        5000
      )
    })

    it('keeps polling while Live is on or waiting, even with no rows after a failed load', () => {
      expect(getDeliveriesRefetchInterval({ ...base, isLive: true, deliveries: [] })).toBe(5000)
      expect(
        getDeliveriesRefetchInterval({ ...base, isAwaitingDelivery: true, deliveries: [] })
      ).toBe(5000)
      expect(getDeliveriesRefetchInterval({ ...base, deliveries: [] })).toBe(false)
    })
  })
})
