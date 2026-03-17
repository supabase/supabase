import { describe, expect, it } from 'vitest'

import {
  createInitialPlatformWebhooksState,
  filterWebhookDeliveries,
  retryWebhookDelivery,
} from './PlatformWebhooks.store'

describe('PlatformWebhooks.store', () => {
  it('retries an individual delivery by resetting it to pending with a new timestamp', () => {
    const nextState = retryWebhookDelivery(
      createInitialPlatformWebhooksState('project'),
      'project-delivery-2',
      { now: '2026-03-17T02:15:00.000Z' }
    )

    expect(nextState.deliveries.find((delivery) => delivery.id === 'project-delivery-2')).toEqual({
      id: 'project-delivery-2',
      endpointId: 'project-endpoint-1',
      eventType: 'project.resource_exhausted',
      status: 'pending',
      responseCode: undefined,
      attemptAt: '2026-03-17T02:15:00.000Z',
    })
  })

  it('returns endpoint deliveries sorted by latest attempt first after a retry', () => {
    const nextState = retryWebhookDelivery(
      createInitialPlatformWebhooksState('project'),
      'project-delivery-2',
      { now: '2026-03-17T02:15:00.000Z' }
    )

    expect(
      filterWebhookDeliveries(nextState.deliveries, 'project-endpoint-1', '').map(
        (delivery) => delivery.id
      )
    ).toEqual(['project-delivery-2', 'project-delivery-1', 'project-delivery-3'])
  })

  it('does not retry successful deliveries', () => {
    const initialState = createInitialPlatformWebhooksState('project')
    const nextState = retryWebhookDelivery(initialState, 'project-delivery-1', {
      now: '2026-03-17T02:15:00.000Z',
    })

    expect(nextState).toBe(initialState)
  })
})
