import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/api/platform/projects/$ref/analytics/endpoints/$name'
import { mswServer } from '@/tests/lib/msw'
import { callRoute } from '@/tests/lib/server-route'

vi.mock('@/lib/constants/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants/api')>()),
  PROJECT_ANALYTICS_URL: 'http://logflare:4000/api/',
}))

const ENDPOINT_URL = 'http://localhost/api/platform/projects/default/analytics/endpoints/logs.all'
const params = { ref: 'default', name: 'logs.all' }

describe('/api/platform/projects/$ref/analytics/endpoints/$name', () => {
  let forwardedQuery: Record<string, string>

  beforeEach(() => {
    vi.stubEnv('LOGFLARE_PRIVATE_ACCESS_TOKEN', 'test-token')
    mswServer.use(
      http.get('http://logflare:4000/api/endpoints/query/logs.all', ({ request }) => {
        forwardedQuery = Object.fromEntries(new URL(request.url).searchParams)
        return HttpResponse.json<{ result: unknown[] }>({ result: [] })
      })
    )
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('forwards GET query params except the route params', async () => {
    const response = await callRoute(
      Route,
      new Request(`${ENDPOINT_URL}?sql=select%201&name=other&ref=other`),
      params
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ result: [] })
    expect(forwardedQuery).toEqual({ project: 'default', sql: 'select 1' })
  })

  it('forwards the JSON body as query params on POST', async () => {
    const response = await callRoute(
      Route,
      new Request(ENDPOINT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: 'select 1' }),
      }),
      params
    )

    expect(response.status).toBe(200)
    expect(forwardedQuery).toEqual({ project: 'default', sql: 'select 1' })
  })
})
