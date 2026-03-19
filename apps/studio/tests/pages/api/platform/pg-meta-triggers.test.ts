import { createMocks } from 'node-mocks-http'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import handler from '../../../../pages/api/platform/pg-meta/[ref]/triggers'
import { fetchGet } from 'data/fetchers'

vi.mock('data/fetchers', () => ({
  fetchGet: vi.fn(),
}))

vi.mock('lib/api/apiHelpers', () => ({
  constructHeaders: vi.fn(() => ({})),
}))

describe('/api/platform/pg-meta/[ref]/triggers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('defaults to 500 when upstream error has no status code', async () => {
    vi.mocked(fetchGet).mockResolvedValue({
      error: { message: 'Upstream unavailable' },
    } as any)

    const { req, res } = createMocks({
      method: 'GET',
      query: { ref: 'default' },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
    expect(JSON.parse(res._getData())).toEqual({ message: 'Upstream unavailable' })
  })

  it('preserves upstream status code when provided', async () => {
    vi.mocked(fetchGet).mockResolvedValue({
      error: { code: 503, message: 'Service unavailable' },
    } as any)

    const { req, res } = createMocks({
      method: 'GET',
      query: { ref: 'default' },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(503)
    expect(JSON.parse(res._getData())).toEqual({ message: 'Service unavailable' })
  })
})
