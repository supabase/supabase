import { beforeEach, describe, expect, it, vi } from 'vitest'

import { executeQuery } from '@/lib/api/self-hosted/query'
import { PgMetaDatabaseError } from '@/lib/api/self-hosted/types'
import { Route } from '@/routes/api/platform/pg-meta/$ref/query/index'
import { getRouteHandler } from '@/tests/lib/server-route'

vi.mock('@/lib/constants', () => ({
  IS_PLATFORM: false,
  PG_META_URL: 'http://meta:8080',
}))

vi.mock('@/lib/api/self-hosted/query', () => ({
  executeQuery: vi.fn(),
}))

describe('/api/platform/pg-meta/$ref/query', () => {
  beforeEach(() => {
    vi.mocked(executeQuery).mockReset()
  })

  it('executes the query and returns 200 JSON', async () => {
    vi.mocked(executeQuery).mockResolvedValue({ data: [{ one: 1 }], error: undefined })

    const response = await getRouteHandler(
      Route,
      'POST'
    )({
      request: new Request('http://localhost/api/platform/pg-meta/default/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'select 1 as one' }),
      }),
      params: { ref: 'default' },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([{ one: 1 }])
  })

  it('preserves PgMetaDatabaseError status codes', async () => {
    vi.mocked(executeQuery).mockResolvedValue({
      data: undefined,
      error: new PgMetaDatabaseError('syntax error', '42601', 400, 'ERROR: syntax error'),
    })

    const response = await getRouteHandler(
      Route,
      'POST'
    )({
      request: new Request('http://localhost/api/platform/pg-meta/default/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'select from' }),
      }),
      params: { ref: 'default' },
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      message: 'syntax error',
      formattedError: 'ERROR: syntax error',
    })
  })

  it('returns 400 for malformed JSON bodies', async () => {
    const response = await getRouteHandler(
      Route,
      'POST'
    )({
      request: new Request('http://localhost/api/platform/pg-meta/default/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{',
      }),
      params: { ref: 'default' },
    })

    expect(response.status).toBe(400)
  })

  it('returns 405 with Allow: POST for unsupported methods', async () => {
    const response = await getRouteHandler(
      Route,
      'GET'
    )({
      request: new Request('http://localhost/api/platform/pg-meta/default/query', {
        method: 'GET',
      }),
      params: { ref: 'default' },
    })

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('POST')
  })
})
