import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Tests for proxy.ts
// ---------------------------------------------------------------------------

function makeRequest(pathname: string): NextRequest {
  return new NextRequest(`http://localhost${pathname}`)
}

describe('proxy — self-hosted mode (IS_PLATFORM = false)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.doMock('@/lib/constants', () => ({ IS_PLATFORM: false }))
  })

  it('returns undefined (no-op) for any path', async () => {
    const { proxy } = await import('@/proxy')

    expect(proxy(makeRequest('/api/some-endpoint'))).toBeUndefined()
    expect(proxy(makeRequest('/'))).toBeUndefined()
    expect(proxy(makeRequest('/project/default'))).toBeUndefined()
  })
})

describe('proxy — platform mode (IS_PLATFORM = true)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.doMock('@/lib/constants', () => ({ IS_PLATFORM: true }))
  })

  it('returns 404 for unsupported API paths in platform mode', async () => {
    const { proxy } = await import('@/proxy')
    const response = proxy(makeRequest('/api/platform/some-internal-route'))

    expect(response).toBeDefined()
    expect(response!.status).toBe(404)
    const body = await response!.json()
    expect(body.success).toBe(false)
  })

  it('returns undefined (allows through) for supported AI paths', async () => {
    const { proxy } = await import('@/proxy')

    expect(proxy(makeRequest('/api/ai/sql/generate-v4'))).toBeUndefined()
    expect(proxy(makeRequest('/api/ai/sql/policy'))).toBeUndefined()
    expect(proxy(makeRequest('/api/parse-query'))).toBeUndefined()
  })

  it('returns undefined for /get-ip-address', async () => {
    const { proxy } = await import('@/proxy')
    expect(proxy(makeRequest('/get-ip-address'))).toBeUndefined()
  })
})
