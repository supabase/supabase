import { describe, expect, it } from 'vitest'

import type { WebhookEndpoint } from './PlatformWebhooks.types'
import { filterWebhookEndpoints, getWebhookEndpointDisplayName } from './PlatformWebhooks.utils'

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
})
