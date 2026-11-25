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
  // list-v2 with with_delimiter:true treats a bare "photos" as a partial name match against
  // siblings like "photos-old", so browsing into a folder needs a trailing slash.
  it.each([
    ['browses the bucket root with an empty prefix', '', undefined, ''],
    ['appends a trailing slash to browse into a subfolder', 'photos', undefined, 'photos/'],
    [
      'folds a search string into the prefix without a trailing slash',
      'photos',
      'inv',
      'photos/inv',
    ],
    ['searches at the bucket root without a leading slash', '', 'inv', 'inv'],
  ])('%s', async (_, path, search, expectedPrefix) => {
    const getBody = captureRequestBody()
    await runQueryFn(path, search)
    expect(getBody()?.prefix).toBe(expectedPrefix)
  })

  it('forwards the page param as the cursor', async () => {
    const getBody = captureRequestBody()
    await runQueryFn('photos', undefined, 'cursor-123')
    expect(getBody()?.cursor).toBe('cursor-123')
  })
})
