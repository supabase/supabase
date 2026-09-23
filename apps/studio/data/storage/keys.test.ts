import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import { storageKeys } from './keys'

const PROJECT_REF = 'abcdefghijklmnopqrst'

/**
 * The bucket list registers its key through `bucketsList`, which always writes all
 * four params — so a filter built from `bucketsList(ref)` carries `undefined` for
 * each of them. React Query compares the keys the filter supplies, and `undefined`
 * does not match `'name'`, so such a filter silently matches nothing. The bucket
 * mutations therefore invalidate on `buckets`, a plain array prefix.
 */
const registerBucketList = (queryClient: QueryClient) => {
  const key = storageKeys.bucketsList(PROJECT_REF, {
    search: undefined,
    sortColumn: 'name',
    sortOrder: 'asc',
  })
  queryClient.setQueryData(key, { pages: [[]], pageParams: [0] })
  return key
}

describe('storageKeys.buckets as an invalidation filter', () => {
  it('reaches a registered bucket list', async () => {
    const queryClient = new QueryClient()
    const listKey = registerBucketList(queryClient)

    await queryClient.invalidateQueries({ queryKey: storageKeys.buckets(PROJECT_REF) })

    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true)
  })

  it('reaches a single bucket', async () => {
    const queryClient = new QueryClient()
    const bucketKey = storageKeys.bucket(PROJECT_REF, 'avatars')
    queryClient.setQueryData(bucketKey, { id: 'avatars' })

    await queryClient.invalidateQueries({ queryKey: storageKeys.buckets(PROJECT_REF) })

    expect(queryClient.getQueryState(bucketKey)?.isInvalidated).toBe(true)
  })

  it('leaves another project alone', async () => {
    const queryClient = new QueryClient()
    const otherKey = storageKeys.bucket('otherprojectrefzzzzz', 'avatars')
    queryClient.setQueryData(otherKey, { id: 'avatars' })

    await queryClient.invalidateQueries({ queryKey: storageKeys.buckets(PROJECT_REF) })

    expect(queryClient.getQueryState(otherKey)?.isInvalidated).toBe(false)
  })

  it('documents why bucketsList is the wrong filter to invalidate on', async () => {
    const queryClient = new QueryClient()
    const listKey = registerBucketList(queryClient)

    await queryClient.invalidateQueries({ queryKey: storageKeys.bucketsList(PROJECT_REF) })

    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(false)
  })
})
