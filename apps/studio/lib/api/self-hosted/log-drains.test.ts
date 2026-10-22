import { describe, expect, it } from 'vitest'

import { asLogDrainResource, parseLogDrainRequest } from './log-drains'

describe('parseLogDrainRequest', () => {
  it('flattens a v2 request body into a Logflare backend payload', () => {
    const result = parseLogDrainRequest({
      data: {
        type: 'log_drain',
        attributes: {
          name: 'My drain',
          description: 'desc',
          backend_type: 'webhook',
          config: { url: 'https://example.com' },
        },
      },
    })

    expect(result).toEqual({
      success: true,
      data: {
        name: 'My drain',
        description: 'desc',
        type: 'webhook',
        config: { url: 'https://example.com' },
      },
    })
  })

  it('rejects a body that is not wrapped in data.attributes', () => {
    const result = parseLogDrainRequest({ name: 'My drain', type: 'webhook', config: {} })

    expect(result.success).toBe(false)
  })
})

describe('asLogDrainResource', () => {
  it('uses the Logflare token as the id and renames type to backend_type', () => {
    expect(
      asLogDrainResource({
        token: 'tok-1',
        name: 'My drain',
        description: 'desc',
        type: 'datadog',
        config: { api_key: 'key' },
      })
    ).toEqual({
      type: 'log_drain',
      id: 'tok-1',
      attributes: {
        name: 'My drain',
        description: 'desc',
        config: { api_key: 'key' },
        backend_type: 'datadog',
      },
    })
  })
})
