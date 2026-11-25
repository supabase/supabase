import { describe, expect, it, vi } from 'vitest'

import { getTools } from '@/lib/ai/tools'
import { Route } from '@/routes/api/ai/sql/policy'
import { getRouteHandler } from '@/tests/lib/server-route'

vi.mock('@/lib/ai/model', () => ({
  getModel: vi.fn().mockResolvedValue({
    modelParams: { model: {} },
  }),
}))

vi.mock('@/lib/ai/tools', () => ({
  getTools: vi.fn().mockResolvedValue({}),
}))

vi.mock('ai', async () => {
  const actual = await vi.importActual('ai')
  return {
    ...actual,
    generateText: vi.fn().mockResolvedValue({
      output: {
        policies: [
          {
            name: 'Allow read',
            sql: 'CREATE POLICY "Allow read" ON public.todos FOR SELECT USING (true);',
            command: 'SELECT',
            definition: 'true',
            action: 'PERMISSIVE',
            roles: ['public'],
          },
        ],
      },
    }),
  }
})

describe('/api/ai/sql/policy', () => {
  it('generates policies and aborts the tool signal when finished', async () => {
    vi.mocked(getTools).mockClear()
    const response = await getRouteHandler(
      Route,
      'POST'
    )({
      request: new Request('http://localhost/api/ai/sql/policy', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableName: 'todos',
          schema: 'public',
          projectRef: 'ref',
          connectionString: 'conn',
        }),
      }),
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([
      expect.objectContaining({ name: 'Allow read', table: 'todos', schema: 'public' }),
    ])
    const { signal } = vi.mocked(getTools).mock.calls[0][0]
    expect(signal?.aborted).toBe(true)
  })

  it('returns 405 with Allow: POST for unsupported methods', async () => {
    const response = await getRouteHandler(
      Route,
      'GET'
    )({
      request: new Request('http://localhost/api/ai/sql/policy', { method: 'GET' }),
    })

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('POST')
  })
})
