import { describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/api/ai/onboarding/design'
import { getRouteHandler } from '@/tests/lib/server-route'

vi.mock('@/lib/ai/model', () => ({
  getModel: vi.fn().mockResolvedValue({
    modelParams: { model: {} },
  }),
}))

vi.mock('ai', async () => {
  const actual = await vi.importActual('ai')
  return {
    ...actual,
    streamText: vi.fn().mockImplementation(() => ({
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue({ type: 'start' })
          controller.enqueue({ type: 'text-start', id: '1' })
          controller.enqueue({ type: 'text-delta', id: '1', text: 'Schema ready' })
          controller.enqueue({ type: 'text-end', id: '1' })
          controller.close()
        },
      }),
    })),
  }
})

describe('/api/ai/onboarding/design', () => {
  it('returns a native Web UIMessage SSE stream response', async () => {
    const response = await getRouteHandler(
      Route,
      'POST'
    )({
      request: new Request('http://localhost/api/ai/onboarding/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Build a todo app' }],
        }),
      }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-encoding')).toBe('none')
    const body = await response.text()
    expect(body).toContain('Schema ready')
  })

  it('returns 405 with Allow: POST for unsupported methods', async () => {
    const response = await getRouteHandler(
      Route,
      'GET'
    )({
      request: new Request('http://localhost/api/ai/onboarding/design', { method: 'GET' }),
    })

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('POST')
  })
})
