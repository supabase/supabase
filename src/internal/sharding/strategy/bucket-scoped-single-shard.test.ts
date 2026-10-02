import { BucketScopedSingleShard } from './bucket-scoped-single-shard'

describe('BucketScopedSingleShard', () => {
  const sharder = new BucketScopedSingleShard({
    keyPrefix: 'embedded__',
    capacity: 1_000_000,
  })

  it('composes shard_key from prefix + bucketName on findShardByResourceId', async () => {
    const shard = await sharder.findShardByResourceId({
      kind: 'vector',
      tenantId: 'tenant-a',
      bucketName: 'logos',
      logicalName: 'vecs',
    })

    expect(shard.shard_key).toBe('embedded__logos')
    expect(shard.kind).toBe('vector')
    expect(shard.capacity).toBe(1_000_000)
  })

  it('different buckets resolve to different shard keys', async () => {
    const a = await sharder.findShardByResourceId({
      kind: 'vector',
      tenantId: 't',
      bucketName: 'logos',
      logicalName: 'vecs',
    })
    const b = await sharder.findShardByResourceId({
      kind: 'vector',
      tenantId: 't',
      bucketName: 'icons',
      logicalName: 'vecs',
    })

    expect(a.shard_key).not.toEqual(b.shard_key)
  })

  it('reserve composes the shard_key from the resource bucket', async () => {
    const reservation = await sharder.reserve({
      kind: 'vector',
      tenantId: 'tenant-a',
      bucketName: 'logos',
      logicalName: 'vecs',
    })

    expect(reservation.shardKey).toBe('embedded__logos')
  })

  it('confirm/cancel/free are no-ops that resolve cleanly', async () => {
    await expect(
      sharder.confirm('', { kind: 'vector', tenantId: 't', bucketName: 'b', logicalName: 'l' })
    ).resolves.toBeUndefined()
    await expect(sharder.cancel('')).resolves.toBeUndefined()
    await expect(
      sharder.freeByResource(1, {
        kind: 'vector',
        tenantId: 't',
        bucketName: 'b',
        logicalName: 'l',
      })
    ).resolves.toBeUndefined()
    await expect(sharder.freeByLocation(1, 0)).resolves.toBeUndefined()
    await expect(sharder.expireLeases()).resolves.toBe(0)
  })

  it('withTnx returns a usable sharder with the same prefix', async () => {
    const tx = sharder.withTnx({})
    const shard = await tx.findShardByResourceId({
      kind: 'vector',
      tenantId: 't',
      bucketName: 'logos',
      logicalName: 'vecs',
    })
    expect(shard?.shard_key).toBe('embedded__logos')
  })
})
