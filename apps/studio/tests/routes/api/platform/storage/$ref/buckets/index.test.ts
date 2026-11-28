import { http, HttpResponse } from 'msw'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/api/platform/storage/$ref/buckets/index'
import { mswServer } from '@/tests/lib/msw'
import { callRoute } from '@/tests/lib/server-route'

type ListBucketsResponse = Array<{ id: string; name: string }>

const SUPABASE_URL = 'http://supabase.test'

const PAGINATION_PARAMS = ['limit', 'offset', 'sortColumn', 'sortOrder']

function mockListBuckets(buckets: ListBucketsResponse) {
  const received: URLSearchParams[] = []
  mswServer.use(
    http.get(`${SUPABASE_URL}/storage/v1/bucket`, ({ request }) => {
      received.push(new URL(request.url).searchParams)
      return HttpResponse.json<ListBucketsResponse>(buckets)
    })
  )
  return received
}

describe('/api/platform/storage/$ref/buckets', () => {
  beforeAll(() => {
    vi.stubEnv('SUPABASE_URL', SUPABASE_URL)
    vi.stubEnv('SUPABASE_SERVICE_KEY', 'test-service-role-key')
  })

  afterAll(() => {
    vi.unstubAllEnvs()
  })

  it('forwards pagination query parameters to the storage API', async () => {
    const received = mockListBuckets([{ id: 'avatars', name: 'avatars' }])

    const response = await callRoute(
      Route,
      new Request(
        'http://localhost/api/platform/storage/default/buckets?limit=10&offset=5&search=ava&sortColumn=name&sortOrder=desc'
      ),
      { ref: 'default' }
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([{ id: 'avatars', name: 'avatars' }])
    expect(received).toHaveLength(1)
    expect(Object.fromEntries(received[0])).toEqual({
      limit: '10',
      offset: '5',
      search: 'ava',
      sortColumn: 'name',
      sortOrder: 'desc',
    })
  })

  it('drops invalid query parameters instead of rejecting the request', async () => {
    const received = mockListBuckets([])

    const response = await callRoute(
      Route,
      new Request(
        'http://localhost/api/platform/storage/default/buckets?limit=abc&offset=1.5&sortColumn=size&sortOrder=up'
      ),
      { ref: 'default' }
    )

    expect(response.status).toBe(200)
    expect(received).toHaveLength(1)
    for (const param of PAGINATION_PARAMS) {
      expect(received[0].has(param)).toBe(false)
    }
  })
})
