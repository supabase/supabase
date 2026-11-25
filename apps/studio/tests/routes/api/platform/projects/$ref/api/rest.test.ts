import { afterEach, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/api/platform/projects/$ref/api/rest'
import { getRouteHandler } from '@/tests/lib/server-route'

describe('/api/platform/projects/$ref/api/rest', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns 200 with an empty body on HEAD', async () => {
    const response = await getRouteHandler(
      Route,
      'HEAD'
    )({
      request: new Request('http://localhost/api/platform/projects/default/api/rest', {
        method: 'HEAD',
      }),
      params: { ref: 'default' },
    })

    expect(response.status).toBe(200)
    expect(response.body).toBeNull()
  })

  it('returns 405 with Allow: GET, HEAD for unsupported methods', async () => {
    const response = await getRouteHandler(
      Route,
      'POST'
    )({
      request: new Request('http://localhost/api/platform/projects/default/api/rest', {
        method: 'POST',
      }),
      params: { ref: 'default' },
    })

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('GET, HEAD')
  })
})
