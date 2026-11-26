import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/api/platform/storage/$ref/buckets/index'
import { callRoute } from '@/tests/lib/server-route'

const mocks = vi.hoisted(() => ({
  listBuckets: vi.fn(),
}))

vi.mock('@/lib/api/self-hosted-admin', () => ({
  selfHostedSupabaseAdmin: {
    storage: {
      listBuckets: mocks.listBuckets,
    },
  },
}))

describe('/api/platform/storage/$ref/buckets', () => {
  beforeEach(() => {
    mocks.listBuckets.mockReset()
  })

  it('parses pagination query parameters and passes them to listBuckets', async () => {
    mocks.listBuckets.mockResolvedValue({ data: [{ id: 'avatars' }], error: null })

    const response = await callRoute(
      Route,
      new Request(
        'http://localhost/api/platform/storage/default/buckets?limit=10&offset=5&search=ava&sortColumn=name&sortOrder=desc'
      ),
      { ref: 'default' }
    )

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

  it('drops invalid query parameters instead of rejecting the request', async () => {
    mocks.listBuckets.mockResolvedValue({ data: [], error: null })

    const response = await callRoute(
      Route,
      new Request(
        'http://localhost/api/platform/storage/default/buckets?limit=abc&offset=1.5&sortColumn=size&sortOrder=up'
      ),
      { ref: 'default' }
    )

    expect(mocks.listBuckets).toHaveBeenCalledWith({})
    expect(response.status).toBe(200)
  })
})
