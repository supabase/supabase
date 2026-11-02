import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'

import { POST } from './route'

const rpcSpy = vi.fn()
vi.mock('~/lib/supabase', () => ({
  supabase: () => ({ rpc: rpcSpy }),
}))

const isFeatureEnabledMock = vi.fn().mockReturnValue(true)
vi.mock('common/enabled-features', () => ({
  isFeatureEnabled: (...args: unknown[]) => isFeatureEnabledMock(...args),
}))

function makeRequest(body: unknown) {
  return new NextRequest('https://example.com/api/search/fts', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('/api/search/fts', () => {
  it('returns 400 when query is missing', async () => {
    const response = await POST(makeRequest({}))
    expect(response.status).toBe(400)
    expect(rpcSpy).not.toHaveBeenCalled()
  })

  it('calls docs_search_fts when the full index feature is enabled', async () => {
    isFeatureEnabledMock.mockReturnValue(true)
    rpcSpy.mockResolvedValue({ data: [{ id: 1, path: '/guides/test' }], error: null })

    const response = await POST(makeRequest({ query: '  realtime  ' }))

    expect(rpcSpy).toHaveBeenCalledWith('docs_search_fts', { query: 'realtime' })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([{ id: 1, path: '/guides/test' }])
  })

  it('calls docs_search_fts_nimbus when the full index feature is disabled', async () => {
    isFeatureEnabledMock.mockReturnValue(false)
    rpcSpy.mockResolvedValue({ data: [], error: null })

    await POST(makeRequest({ query: 'realtime' }))

    expect(rpcSpy).toHaveBeenCalledWith('docs_search_fts_nimbus', { query: 'realtime' })
  })

  it('returns 500 when the RPC errors', async () => {
    rpcSpy.mockResolvedValue({ data: null, error: { message: 'boom' } })

    const response = await POST(makeRequest({ query: 'realtime' }))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'boom' })
  })
})
