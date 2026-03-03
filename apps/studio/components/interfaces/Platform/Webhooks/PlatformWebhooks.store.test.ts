import { describe, expect, it } from 'vitest'
import { PLATFORM_WEBHOOKS_MOCK_DATA } from './PlatformWebhooks.mock'
import {
  createInitialPlatformWebhooksState,
  createWebhookEndpoint,
  deleteWebhookEndpoint,
  filterWebhookDeliveries,
  filterWebhookEndpoints,
  regenerateWebhookEndpointSecret,
  toggleWebhookEndpoint,
  updateWebhookEndpoint,
} from './PlatformWebhooks.store'

describe('PlatformWebhooks.store', () => {
  it('creates isolated initial state from mock seed', () => {
    const state = createInitialPlatformWebhooksState('organization')
    state.endpoints[0].name = 'Changed'

    expect(PLATFORM_WEBHOOKS_MOCK_DATA.organization.endpoints[0].name).not.toBe('Changed')
  })

  it('creates endpoint with deterministic options', () => {
    const state = createInitialPlatformWebhooksState('project')
    const { state: next, endpoint, signingSecret } = createWebhookEndpoint(
      state,
      {
        name: '',
        url: 'https://example.com/webhooks',
        description: 'Test endpoint',
        enabled: true,
        eventTypes: [],
        customHeaders: [{ key: 'X-Test', value: '1' }],
      },
      {
        endpointId: 'endpoint-fixed',
        now: '2026-02-27T00:00:00.000Z',
        createdBy: 'test@supabase.io',
        signingSecret: 'whsec_fixed',
      }
    )

    expect(endpoint.id).toBe('endpoint-fixed')
    expect(endpoint.name).toBe('endpoint-fixed')
    expect(endpoint.eventTypes).toEqual(['*'])
    expect(signingSecret).toBe('whsec_fixed')
    expect(endpoint).not.toHaveProperty('signingSecret')
    expect(next.endpoints[0].id).toBe('endpoint-fixed')
  })

  it('creates endpoint with generated secure id, header id, and signing secret', () => {
    const state = createInitialPlatformWebhooksState('project')
    const { endpoint, signingSecret } = createWebhookEndpoint(state, {
      name: 'Generated endpoint',
      url: 'https://example.com/webhooks',
      description: 'Generated values',
      enabled: true,
      eventTypes: ['project.updated'],
      customHeaders: [{ key: 'X-Test', value: '1' }],
    })

    expect(endpoint.id).toMatch(/^endpoint-[a-f0-9]{8}$/)
    expect(endpoint.customHeaders).toHaveLength(1)
    expect(endpoint.customHeaders[0].id).toMatch(/^header-[a-f0-9]{8}$/)
    expect(signingSecret).toMatch(/^whsec_[a-f0-9]{16}$/)
  })

  it('updates endpoint fields and replaces custom headers', () => {
    const state = createInitialPlatformWebhooksState('organization')
    const endpoint = state.endpoints[0]

    const next = updateWebhookEndpoint(
      state,
      endpoint.id,
      {
        name: 'Updated endpoint',
        url: 'https://updated.example.com/webhooks',
        description: 'Updated description',
        enabled: false,
        eventTypes: ['project.updated'],
        customHeaders: [
          { key: 'X-New', value: '1' },
          { key: 'Empty Value', value: '' },
        ],
      },
      {
        headerIdFactory: () => 'header-fixed',
      }
    )

    const updated = next.endpoints.find((item) => item.id === endpoint.id)
    expect(updated?.name).toBe('Updated endpoint')
    expect(updated?.enabled).toBe(false)
    expect(updated?.customHeaders).toEqual([{ id: 'header-fixed', key: 'X-New', value: '1' }])
  })

  it('deletes endpoint and associated deliveries', () => {
    const state = createInitialPlatformWebhooksState('organization')
    const endpointId = state.endpoints[0].id
    const next = deleteWebhookEndpoint(state, endpointId)

    expect(next.endpoints.find((endpoint) => endpoint.id === endpointId)).toBeUndefined()
    expect(next.deliveries.find((delivery) => delivery.endpointId === endpointId)).toBeUndefined()
  })

  it('toggles endpoint state and regenerates secret', () => {
    const state = createInitialPlatformWebhooksState('project')
    const endpoint = state.endpoints[0]

    const toggled = toggleWebhookEndpoint(state, endpoint.id)
    expect(toggled.endpoints.find((item) => item.id === endpoint.id)?.enabled).toBe(
      !endpoint.enabled
    )

    const regenerated = regenerateWebhookEndpointSecret(state, endpoint.id, 'whsec_new_secret')
    expect(regenerated.signingSecret).toBe('whsec_new_secret')
    expect(regenerated.state.endpoints).toEqual(state.endpoints)
  })

  it('regenerates secure signing secret when not explicitly provided', () => {
    const state = createInitialPlatformWebhooksState('project')
    const endpoint = state.endpoints[0]
    const regenerated = regenerateWebhookEndpointSecret(state, endpoint.id)

    expect(regenerated.signingSecret).toMatch(/^whsec_[a-f0-9]{16}$/)
    expect(regenerated.state.endpoints).toEqual(state.endpoints)
  })

  it('filters endpoints and deliveries by search query', () => {
    const state = createInitialPlatformWebhooksState('organization')
    const [firstEndpoint] = state.endpoints

    const matchingEndpoints = filterWebhookEndpoints(state.endpoints, 'lovable')
    expect(matchingEndpoints).toHaveLength(1)
    expect(matchingEndpoints[0].id).toBe(firstEndpoint.id)

    const matchingDeliveries = filterWebhookDeliveries(state.deliveries, firstEndpoint.id, '500')
    expect(matchingDeliveries).toHaveLength(1)
    expect(matchingDeliveries[0].status).toBe('failure')
  })
})
