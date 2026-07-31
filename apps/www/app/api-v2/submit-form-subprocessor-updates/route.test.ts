import { describe, expect, it, vi } from 'vitest'

import { POST } from './route'

vi.mock('server-only', () => ({}))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

const makeRequest = (ip: string) =>
  new Request('http://localhost/api-v2/submit-form-subprocessor-updates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({}),
  })

describe('submit-form-subprocessor-updates rate limiting', () => {
  it('returns 429 on the sixth request in a window from one ip', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await POST(makeRequest('203.0.113.7'))
      expect(res.status).toBe(422)
    }
    const res = await POST(makeRequest('203.0.113.7'))
    expect(res.status).toBe(429)
  })

  it('does not rate limit a different ip', async () => {
    const res = await POST(makeRequest('203.0.113.8'))
    expect(res.status).toBe(422)
  })
})
