import { afterEach, describe, expect, it, vi } from 'vitest'

import type { WebhookDelivery, WebhookEndpoint } from './PlatformWebhooks.types'
import {
  filterWebhookDeliveries,
  filterWebhookEndpoints,
  generateWebhookEndpointName,
  getWebhookEndpointDisplayName,
} from './PlatformWebhooks.utils'

const createEndpoint = (overrides: Partial<WebhookEndpoint> = {}): WebhookEndpoint => ({
  id: 'endpoint-1',
  name: '',
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
  status: 'success',
  responseCode: 200,
  responseBody: null,
  responseHeaders: null,
  attemptAt: '2026-03-16T00:00:00.000Z',
  ...overrides,
})

describe('PlatformWebhooks.utils', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the trimmed endpoint name when present', () => {
    expect(
      getWebhookEndpointDisplayName({
        name: '  Billing events  ',
        url: 'https://hooks.example.com/billing',
      })
    ).toBe('Billing events')
  })

  it('falls back to the endpoint url when the name is empty', () => {
    expect(
      getWebhookEndpointDisplayName({
        name: '   ',
        url: 'https://hooks.example.com/fallback',
      })
    ).toBe('https://hooks.example.com/fallback')
  })

  it('generates an adjective-noun endpoint name', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.1)

    expect(generateWebhookEndpointName()).toBe('swift-courier')
  })

  it('filters endpoints by name, url, and description', () => {
    const endpoints = [
      createEndpoint({ id: '1', name: 'Billing events', url: 'https://hooks.example.com/billing' }),
      createEndpoint({
        id: '2',
        name: 'Slack alerts',
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
