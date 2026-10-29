import { describe, expect, it } from 'vitest'

import type { WebhookDelivery, WebhookEndpoint } from './PlatformWebhooks.types'
import {
  filterWebhookDeliveries,
  filterWebhookEndpoints,
  getWebhookEndpointDisplayName,
} from './PlatformWebhooks.utils'

const createEndpoint = (overrides: Partial<WebhookEndpoint> = {}): WebhookEndpoint => ({
  id: 'endpoint-1',
  url: 'https://hooks.example.com/billing',
  description: '',
  enabled: true,
  eventTypes: ['v1.project.updated'],
  customHeaders: [],
  createdBy: 'user@supabase.io',
  createdAt: '2026-03-16T00:00:00.000Z',
  ...overrides,
})

const createDelivery = (overrides: Partial<WebhookDelivery> = {}): WebhookDelivery => ({
  id: 'delivery-1',
  endpointId: 'endpoint-1',
  eventId: 'event-1',
  eventType: 'v1.project.updated',
  eventPayload: {},
  status: 'success',
  responseCode: 200,
  responseBody: null,
  responseHeaders: null,
  attemptAt: '2026-03-16T00:00:00.000Z',
  ...overrides,
})

describe('PlatformWebhooks.utils', () => {
  it('combines the endpoint url and subscribed event types', () => {
    expect(
      getWebhookEndpointDisplayName({
        url: 'https://hooks.example.com/billing',
        eventTypes: ['v1.project.paused', 'v1.project.created'],
      })
    ).toBe('https://hooks.example.com/billing (v1.project.paused, v1.project.created)')
  })

  it('shows "all events" when subscribed to every event type', () => {
    expect(
      getWebhookEndpointDisplayName({
        url: 'https://hooks.example.com/billing',
        eventTypes: ['*'],
      })
    ).toBe('https://hooks.example.com/billing (all events)')
  })

  it('filters endpoints by url and description', () => {
    const endpoints = [
      createEndpoint({ id: '1', url: 'https://hooks.example.com/billing' }),
      createEndpoint({
        id: '2',
        url: 'https://hooks.slack.com/x',
        description: 'operational alerts',
      }),
    ]

    expect(filterWebhookEndpoints(endpoints, 'billing')).toEqual([endpoints[0]])
    expect(filterWebhookEndpoints(endpoints, 'slack')).toEqual([endpoints[1]])
    expect(filterWebhookEndpoints(endpoints, 'alerts')).toEqual([endpoints[1]])
  })

  it('filters deliveries by event type, status, and response code, sorted newest first', () => {
    const deliveries = [
      createDelivery({
        id: 'a',
        eventType: 'v1.project.updated',
        status: 'success',
        responseCode: 200,
        attemptAt: '2026-03-16T00:00:00.000Z',
      }),
      createDelivery({
        id: 'b',
        eventType: 'v1.project.paused',
        status: 'failure',
        responseCode: 500,
        attemptAt: '2026-03-17T00:00:00.000Z',
      }),
    ]

    expect(filterWebhookDeliveries(deliveries, '')).toEqual([deliveries[1], deliveries[0]])
    expect(filterWebhookDeliveries(deliveries, 'paused')).toEqual([deliveries[1]])
    expect(filterWebhookDeliveries(deliveries, '500')).toEqual([deliveries[1]])
  })
})
