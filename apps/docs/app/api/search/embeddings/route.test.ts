import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'

import { POST } from './route'

const isFeatureEnabledMock = vi.fn().mockReturnValue(true)
vi.mock('common/enabled-features', () => ({
  isFeatureEnabled: (...args: unknown[]) => isFeatureEnabledMock(...args),
}))

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

function makeRequest(body: unknown) {
  return new NextRequest('https://example.com/api/search/embeddings', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('/api/search/embeddings', () => {
  it('returns 400 when query is missing', async () => {
    const response = await POST(makeRequest({}))
    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('forwards the query and feature flag to the search-embeddings function', async () => {
    isFeatureEnabledMock.mockReturnValue(false)
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify([{ id: 1, path: '/guides/test' }]), { status: 200 })
    )

    const response = await POST(makeRequest({ query: 'realtime' }))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/functions/v1/search-embeddings')
    expect(JSON.parse(init.body)).toEqual({ query: 'realtime', useAlternateSearchIndex: true })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([{ id: 1, path: '/guides/test' }])
  })

  it('propagates the upstream status on error', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: 'boom' }), { status: 500 }))

    const response = await POST(makeRequest({ query: 'realtime' }))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'boom' })
  })
})
