import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { mswServer } from '@/tests/lib/msw'
import { getRouteHandler } from '@/tests/lib/server-route'

describe('/api/platform/projects/$ref/analytics/log-drains/$uuid', () => {
  let Route: typeof import('@/routes/api/platform/projects/$ref/analytics/log-drains/$uuid').Route

  beforeEach(async () => {
    vi.resetModules()
    vi.stubEnv('LOGFLARE_PRIVATE_ACCESS_TOKEN', 'test-token')
    vi.stubEnv('LOGFLARE_URL', 'http://logflare:4000')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    ;({ Route } = await import('@/routes/api/platform/projects/$ref/analytics/log-drains/$uuid'))
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('returns 204 with an empty body on DELETE success', async () => {
    mswServer.use(
      http.delete(
        'http://logflare:4000/api/backends/1',
        () => new HttpResponse(null, { status: 204 })
      )
    )

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
    mswServer.use(
      http.delete(
        'http://logflare:4000/api/backends/1',
        () => new HttpResponse('fail', { status: 422 })
      )
    )

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
    let forwardedBody: unknown
    let forwardedAuth: string | null = null

    mswServer.use(
      http.put('http://logflare:4000/api/backends/1', async ({ request }) => {
        forwardedAuth = request.headers.get('authorization')
        forwardedBody = await request.json()
        return HttpResponse.json<{ id: number; name: string }>({ id: 1, name: 'updated' })
      })
    )

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
    expect(forwardedAuth).toBe('Bearer test-token')
    expect(forwardedBody).toEqual({ name: 'updated' })
  })

  it('returns 500 on PUT when Logflare rejects the request', async () => {
    mswServer.use(
      http.put(
        'http://logflare:4000/api/backends/1',
        () => new HttpResponse('bad', { status: 400 })
      )
    )

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
