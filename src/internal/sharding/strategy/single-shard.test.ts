import { SingleShard } from './single-shard'

describe('SingleShard', () => {
  it('returns shard stats in the canonical array shape', async () => {
    const sharder = new SingleShard({
      shardKey: 'single-shard-key',
      capacity: 25,
    })

    await expect(sharder.shardStats()).resolves.toEqual([
      {
        shardId: '1',
        shardKey: 'single-shard-key',
        capacity: 25,
        used: -1,
        free: -1,
      },
    ])
  })
})
