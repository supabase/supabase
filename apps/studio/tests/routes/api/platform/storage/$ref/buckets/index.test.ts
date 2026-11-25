import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/api/platform/storage/$ref/buckets/index'
import { Route as VectorBucketRoute } from '@/routes/api/platform/storage/$ref/vector-buckets/$id/index'
import { Route as VectorIndexRoute } from '@/routes/api/platform/storage/$ref/vector-buckets/$id/indexes/$indexName'
import { getRouteHandler } from '@/tests/lib/server-route'

const mocks = vi.hoisted(() => ({
  listBuckets: vi.fn(),
  createBucket: vi.fn(),
}))

vi.mock('@/lib/api/self-hosted-admin', () => ({
  selfHostedSupabaseAdmin: {
    storage: {
      listBuckets: mocks.listBuckets,
      createBucket: mocks.createBucket,
    },
  },
}))

describe('/api/platform/storage/$ref/buckets', () => {
  beforeEach(() => {
    mocks.listBuckets.mockReset()
    mocks.createBucket.mockReset()
  })

  it('parses pagination query parameters and passes them to listBuckets', async () => {
    mocks.listBuckets.mockResolvedValue({ data: [{ id: 'avatars' }], error: null })

    const response = await getRouteHandler(
      Route,
      'GET'
    )({
      request: new Request(
        'http://localhost/api/platform/storage/default/buckets?limit=10&offset=5&search=ava&sortColumn=name&sortOrder=desc'
      ),
      params: { ref: 'default' },
    })

    expect(mocks.listBuckets).toHaveBeenCalledWith({
      limit: 10,
      offset: 5,
      search: 'ava',
      sortColumn: 'name',
      sortOrder: 'desc',
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([{ id: 'avatars' }])
  })

  it('returns accurate Allow headers on storage and vector-bucket routes', async () => {
    const bucketRes = await getRouteHandler(
      Route,
      'DELETE'
    )({
      request: new Request('http://localhost/api/platform/storage/default/buckets', {
        method: 'DELETE',
      }),
    })
    expect(bucketRes.status).toBe(405)
    expect(bucketRes.headers.get('Allow')).toBe('GET, POST')

    const vectorBucketRes = await getRouteHandler(
      VectorBucketRoute,
      'PATCH'
    )({
      request: new Request('http://localhost/api/platform/storage/default/vector-buckets/b1', {
        method: 'PATCH',
      }),
    })
    expect(vectorBucketRes.status).toBe(405)
    expect(vectorBucketRes.headers.get('Allow')).toBe('GET, DELETE')

    const vectorIndexRes = await getRouteHandler(
      VectorIndexRoute,
      'GET'
    )({
      request: new Request(
        'http://localhost/api/platform/storage/default/vector-buckets/b1/indexes/idx1',
        { method: 'GET' }
      ),
    })
    expect(vectorIndexRes.status).toBe(405)
    expect(vectorIndexRes.headers.get('Allow')).toBe('DELETE')
  })
})
