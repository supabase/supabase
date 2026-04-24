import { describe, expect, it } from 'vitest'

import {
  createInitialPlatformWebhooksState,
  createWebhookEndpoint,
  filterWebhookDeliveries,
  filterWebhookEndpoints,
  retryWebhookDelivery,
  updateWebhookEndpoint,
} from './PlatformWebhooks.store'
import type { PlatformWebhooksState, WebhookEndpoint } from './PlatformWebhooks.types'

const EMPTY_STATE: PlatformWebhooksState = {
  endpoints: [],
  deliveries: [],
}

const createEndpoint = (overrides?: Partial<WebhookEndpoint>): WebhookEndpoint => ({
  id: '3c9b7e21-8d54-4f63-b2a1-6e7d8c9f0a12',
  name: 'Billing events',
  url: 'https://hooks.example.com/billing',
  description: 'Invoices and receipts',
  enabled: true,
  eventTypes: ['project.updated'],
  customHeaders: [],
  createdBy: 'user@supabase.io',
  createdAt: '2026-03-16T00:00:00.000Z',
  ...overrides,
})

describe('PlatformWebhooks.store', () => {
  it('stores an explicit non-empty endpoint name on create', () => {
    const result = createWebhookEndpoint(
      EMPTY_STATE,
      {
        name: '  Project analytics  ',
        url: 'https://hooks.example.com/analytics',
        description: '',
        enabled: true,
        eventTypes: ['project.updated'],
        customHeaders: [],
      },
      {
        endpointId: '9e4b1d62-7c35-4f18-a9d1-2b6e7f8c9012',
        signingSecret: 'whsec_example',
      }
    )

    expect(result.endpoint.name).toBe('Project analytics')
  })

  it('allows an empty endpoint name on create', () => {
    const result = createWebhookEndpoint(
      EMPTY_STATE,
      {
        name: '   ',
        url: 'https://hooks.example.com/fallback',
        description: '',
        enabled: true,
        eventTypes: ['project.updated'],
        customHeaders: [],
      },
      {
        endpointId: '9e4b1d62-7c35-4f18-a9d1-2b6e7f8c9012',
        signingSecret: 'whsec_example',
      }
    )

    expect(result.endpoint.name).toBe('')
  })

  it('allows clearing an existing endpoint name on update', () => {
    const state: PlatformWebhooksState = {
      endpoints: [createEndpoint()],
      deliveries: [],
    }

    const result = updateWebhookEndpoint(state, '3c9b7e21-8d54-4f63-b2a1-6e7d8c9f0a12', {
      name: '   ',
      url: 'https://hooks.example.com/billing',
      description: 'Invoices and receipts',
      enabled: true,
      eventTypes: ['project.updated'],
      customHeaders: [],
    })

    expect(result.endpoints[0].name).toBe('')
  })

  it('filters endpoints by name, url, and description', () => {
    const endpoints = [
      createEndpoint(),
      createEndpoint({
        id: '1a4e8c73-5b29-44af-8c62-9f1d2b3c4d5e',
        name: '',
        url: 'https://hooks.example.com/slack',
        description: 'Operational alerts',
      }),
    ]

    expect(filterWebhookEndpoints(endpoints, 'billing')).toEqual([endpoints[0]])
    expect(filterWebhookEndpoints(endpoints, 'slack')).toEqual([endpoints[1]])
    expect(filterWebhookEndpoints(endpoints, 'alerts')).toEqual([endpoints[1]])
  })

  it('retries an individual delivery by resetting it to pending with a new timestamp', () => {
    const nextState = retryWebhookDelivery(
      createInitialPlatformWebhooksState('project'),
      'project-delivery-2',
      { now: '2026-03-17T02:15:00.000Z' }
    )

    expect(nextState.deliveries.find((delivery) => delivery.id === 'project-delivery-2')).toEqual({
      id: 'project-delivery-2',
      endpointId: '3c9b7e21-8d54-4f63-b2a1-6e7d8c9f0a12',
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
    const endpointDeliveries = filterWebhookDeliveries(
      nextState.deliveries,
      '3c9b7e21-8d54-4f63-b2a1-6e7d8c9f0a12',
      ''
    )

    expect(endpointDeliveries).toHaveLength(8)
    expect(endpointDeliveries.map((delivery) => delivery.id).slice(0, 3)).toEqual([
      'project-delivery-2',
      'project-delivery-1',
      'project-delivery-3',
    ])
    expect(
      endpointDeliveries.every((delivery, index) => {
        if (index === 0) return true

        return (
          new Date(endpointDeliveries[index - 1].attemptAt).getTime() >=
          new Date(delivery.attemptAt).getTime()
        )
      })
    ).toBe(true)
  })

  it('does not retry successful deliveries', () => {
    const initialState = createInitialPlatformWebhooksState('project')
    const nextState = retryWebhookDelivery(initialState, 'project-delivery-1', {
      now: '2026-03-17T02:15:00.000Z',
    })

    expect(nextState).toBe(initialState)
  })
})
