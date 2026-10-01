import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { bucketObjectsInfiniteQueryOptions } from './bucket-objects-infinite-query'
import { addAPIMock } from '@/tests/lib/msw'

/** Mocks list-v2 and returns a getter for the last request body it received. */
const captureRequestBody = () => {
  let body: { prefix: string; cursor?: string } | undefined
  addAPIMock({
    method: 'post',
    path: '/platform/storage/:ref/buckets/:id/objects/list-v2',
    response: async ({ request }) => {
      body = (await request.json()) as { prefix: string; cursor?: string }
      return HttpResponse.json({ folders: [], objects: [], hasNext: false })
    },
  })
  return () => body
}

const runQueryFn = (path: string, search?: string, pageParam?: string) => {
  const options = bucketObjectsInfiniteQueryOptions({
    projectRef: 'default',
    bucketId: 'avatars',
    path,
    options: search ? { search } : undefined,
  })
  return options.queryFn!({ signal: new AbortController().signal, pageParam } as any)
}

describe('bucketObjectsInfiniteQueryOptions', () => {
  it('browses the bucket root with an empty prefix', async () => {
    const getBody = captureRequestBody()
    await runQueryFn('')
    expect(getBody()?.prefix).toBe('')
  })

  it('appends a trailing slash to browse into a subfolder', async () => {
    // list-v2 with with_delimiter:true treats a bare "photos" as a partial name match
    // against siblings like "photos-old" rather than descending into the folder.
    const getBody = captureRequestBody()
    await runQueryFn('photos')
    expect(getBody()?.prefix).toBe('photos/')
  })

  it('folds a search string into the prefix without a trailing slash after it', async () => {
    const getBody = captureRequestBody()
    await runQueryFn('photos', 'inv')
    expect(getBody()?.prefix).toBe('photos/inv')
  })

  it('searches at the bucket root without a leading slash', async () => {
    const getBody = captureRequestBody()
    await runQueryFn('', 'inv')
    expect(getBody()?.prefix).toBe('inv')
  })

  it('forwards the page param as the cursor', async () => {
    const getBody = captureRequestBody()
    await runQueryFn('photos', undefined, 'cursor-123')
    expect(getBody()?.cursor).toBe('cursor-123')
  })
})
