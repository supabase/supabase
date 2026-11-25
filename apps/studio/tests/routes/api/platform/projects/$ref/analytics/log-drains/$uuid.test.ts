import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/api/platform/projects/$ref/analytics/log-drains/$uuid'
import { getRouteHandler } from '@/tests/lib/server-route'

vi.mock('@/lib/constants/api', () => ({
  PROJECT_ANALYTICS_URL: 'http://logflare:4000/',
}))

describe('/api/platform/projects/$ref/analytics/log-drains/$uuid', () => {
  beforeEach(() => {
    vi.stubEnv('LOGFLARE_PRIVATE_ACCESS_TOKEN', 'test-token')
    vi.stubEnv('LOGFLARE_URL', 'http://logflare:4000')
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('returns 204 with an empty body on DELETE success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))

    const response = await getRouteHandler(
      Route,
      'DELETE'
    )({
      request: new Request(
        'http://localhost/api/platform/projects/default/analytics/log-drains/1',
        {
          method: 'DELETE',
        }
      ),
      params: { ref: 'default', uuid: '1' },
    })

    expect(response.status).toBe(204)
    expect(response.body).toBeNull()
    expect(await response.text()).toBe('')
  })

  it('returns 500 on DELETE when Logflare rejects the request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('fail', { status: 422 })))

    const response = await getRouteHandler(
      Route,
      'DELETE'
    )({
      request: new Request(
        'http://localhost/api/platform/projects/default/analytics/log-drains/1',
        {
          method: 'DELETE',
        }
      ),
      params: { ref: 'default', uuid: '1' },
    })

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: { message: 'Error deleting log drain' } })
  })

  it('strips metadata and returns 200 on PUT success', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: 1, name: 'updated' }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await getRouteHandler(
      Route,
      'PUT'
    )({
      request: new Request(
        'http://localhost/api/platform/projects/default/analytics/log-drains/1',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'updated', metadata: { type: 'log-drain' } }),
        }
      ),
      params: { ref: 'default', uuid: '1' },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ id: 1, name: 'updated' })
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ name: 'updated' })
  })

  it('returns 500 on PUT when Logflare rejects the request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('bad', { status: 400 })))

    const response = await getRouteHandler(
      Route,
      'PUT'
    )({
      request: new Request(
        'http://localhost/api/platform/projects/default/analytics/log-drains/1',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'bad' }),
        }
      ),
      params: { ref: 'default', uuid: '1' },
    })

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: { message: 'Error updating log drain' } })
  })

  it('returns 405 with Allow: GET, PUT, DELETE for unsupported methods', async () => {
    const response = await getRouteHandler(
      Route,
      'POST'
    )({
      request: new Request(
        'http://localhost/api/platform/projects/default/analytics/log-drains/1',
        {
          method: 'POST',
        }
      ),
      params: { ref: 'default', uuid: '1' },
    })

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('GET, PUT, DELETE')
  })
})
