import { describe, expect, it } from 'vitest'

import {
  createWebhookEndpoint,
  filterWebhookEndpoints,
  updateWebhookEndpoint,
} from './PlatformWebhooks.store'
import type { PlatformWebhooksState, WebhookEndpoint } from './PlatformWebhooks.types'

const EMPTY_STATE: PlatformWebhooksState = {
  endpoints: [],
  deliveries: [],
}

const createEndpoint = (overrides?: Partial<WebhookEndpoint>): WebhookEndpoint => ({
  id: 'endpoint-1',
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
        endpointId: 'endpoint-new',
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
        endpointId: 'endpoint-new',
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

    const result = updateWebhookEndpoint(state, 'endpoint-1', {
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
        id: 'endpoint-2',
        name: '',
        url: 'https://hooks.example.com/slack',
        description: 'Operational alerts',
      }),
    ]

    expect(filterWebhookEndpoints(endpoints, 'billing')).toEqual([endpoints[0]])
    expect(filterWebhookEndpoints(endpoints, 'slack')).toEqual([endpoints[1]])
    expect(filterWebhookEndpoints(endpoints, 'alerts')).toEqual([endpoints[1]])
  })
})
