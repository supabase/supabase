import { useStorage } from './utils/storage'

describe('pg storage test helper', () => {
  const t = useStorage()

  it('creates and deletes an isolated bucket without dummy data', async () => {
    const bucketId = t.random.name('pg-helper')

    await t.storage.createBucket({
      id: bucketId,
      name: bucketId,
    })

    await expect(t.database.findBucketById(bucketId, 'id, name')).resolves.toEqual({
      id: bucketId,
      name: bucketId,
    })

    await expect(t.database.deleteBucket(bucketId)).resolves.toBe(1)
  })
})
