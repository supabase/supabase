import { describe, expect, it, vi } from 'vitest'

import { POST } from './route'

vi.mock('server-only', () => ({}))
vi.mock('~/lib/notion', () => ({ insertPageInDatabase: vi.fn() }))
vi.mock('~/data/open-source/contributing/supasquad.utils', () => ({
  supaSquadApplicationSchema: {
    safeParse: () => ({ success: false, error: { flatten: () => ({}) } }),
  },
}))
vi.mock('@sentry/nextjs', () => ({
  getDefaultIntegrations: () => [],
  NodeClient: class {},
  makeNodeTransport: vi.fn(),
  defaultStackParser: [],
  Scope: class {
    setClient() {}
    captureException() {}
  },
}))

const makeRequest = (ip: string) =>
  new Request('http://localhost/api-v2/submit-form-apply-to-supasquad', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({}),
  })

describe('submit-form-apply-to-supasquad rate limiting', () => {
  it('returns 429 on the sixth request in a window from one ip', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await POST(makeRequest('203.0.113.9'))
      expect(res.status).not.toBe(429)
    }
    const res = await POST(makeRequest('203.0.113.9'))
    expect(res.status).toBe(429)
  })
})
