import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  generateWebhookEndpointName,
  getWebhookEndpointDisplayName,
} from './PlatformWebhooks.utils'

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
})
