import { createMocks } from 'node-mocks-http'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import handler from '../../../../pages/api/platform/projects/[ref]/analytics/endpoints/[name]'
import { retrieveAnalyticsData } from 'lib/api/self-hosted/logs'

vi.mock('lib/api/self-hosted/logs', () => ({
  retrieveAnalyticsData: vi.fn(),
}))

describe('/api/platform/projects/[ref]/analytics/endpoints/[name]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns upstream analytics payload on success', async () => {
    vi.mocked(retrieveAnalyticsData).mockResolvedValue({
      data: { result: [{ id: '1' }] },
      error: undefined,
    })

    const { req, res } = createMocks({
      method: 'GET',
      query: { ref: 'default', name: 'logs.all' },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual({ result: [{ id: '1' }] })
  })

  it('falls back gracefully for local logs when analytics is unavailable', async () => {
    vi.mocked(retrieveAnalyticsData).mockResolvedValue({
      data: undefined,
      error: new Error('PROJECT_ANALYTICS_URL is required'),
    })

    const { req, res } = createMocks({
      method: 'GET',
      query: { ref: 'default', name: 'logs.all' },
    })

    await handler(req, res)

    const body = JSON.parse(res._getData())
    expect(res._getStatusCode()).toBe(200)
    expect(body.result).toEqual([])
    expect(body.error.message).toContain('Local analytics is unavailable')
    expect(body.error.message).toContain('supabase/config.toml')
  })

  it('keeps non-log analytics errors as 500 responses', async () => {
    vi.mocked(retrieveAnalyticsData).mockResolvedValue({
      data: undefined,
      error: new Error('Some upstream failure'),
    })

    const { req, res } = createMocks({
      method: 'GET',
      query: { ref: 'default', name: 'auth.metrics' },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
    expect(JSON.parse(res._getData())).toEqual({
      error: { message: 'Some upstream failure' },
    })
  })
})
