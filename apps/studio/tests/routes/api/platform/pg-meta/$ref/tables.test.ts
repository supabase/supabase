import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchGet } from '@/data/fetchers'
import { Route } from '@/routes/api/platform/pg-meta/$ref/tables'
import { getRouteHandler } from '@/tests/lib/server-route'

vi.mock('@/lib/constants', () => ({
  IS_PLATFORM: false,
  PG_META_URL: 'http://meta:8080',
}))

vi.mock('@/data/fetchers', () => ({
  fetchGet: vi.fn(),
}))

describe('/api/platform/pg-meta/$ref/tables', () => {
  beforeEach(() => {
    vi.mocked(fetchGet).mockReset()
  })

  it('forwards query params to pg-meta and returns the response', async () => {
    vi.mocked(fetchGet).mockResolvedValue([{ id: 1, name: 'users' }])

    const response = await getRouteHandler(
      Route,
      'GET'
    )({
      request: new Request(
        'http://localhost/api/platform/pg-meta/default/tables?included_schemas=public'
      ),
      params: { ref: 'default' },
    })

    expect(fetchGet).toHaveBeenCalledWith(
      'http://meta:8080/tables?included_schemas=public',
      expect.objectContaining({ headers: expect.any(Object) })
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([{ id: 1, name: 'users' }])
  })

  it('falls back to 500 when the upstream error has no status code', async () => {
    vi.mocked(fetchGet).mockResolvedValue({
      error: { message: 'Network failed', code: undefined },
    })

    const response = await getRouteHandler(
      Route,
      'GET'
    )({
      request: new Request('http://localhost/api/platform/pg-meta/default/tables'),
      params: { ref: 'default' },
    })

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ message: 'Network failed' })
  })

  it('returns 405 with Allow: GET for unsupported methods', async () => {
    const response = await getRouteHandler(
      Route,
      'POST'
    )({
      request: new Request('http://localhost/api/platform/pg-meta/default/tables', {
        method: 'POST',
      }),
      params: { ref: 'default' },
    })

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('GET')
  })
})
