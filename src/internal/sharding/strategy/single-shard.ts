import { ResourceKind, ShardRow, ShardStats, ShardStatus } from '@internal/sharding/store'
import { ReservationResult, Sharder, ShardResource } from '../sharder'

export class SingleShard implements Sharder {
  constructor(
    protected readonly singleShard: {
      shardKey: string
      capacity: number
    }
  ) {}

  listShardByKind(_kind: ResourceKind): Promise<ShardRow[]> {
    return Promise.resolve([
      {
        id: 1,
        kind: 'iceberg-table',
        shard_key: this.singleShard.shardKey,
        capacity: this.singleShard.capacity,
        next_slot: -1,
        status: 'active',
        created_at: new Date().toISOString(),
      },
    ])
  }

  shardStats(_kind?: ResourceKind): Promise<ShardStats> {
    return Promise.resolve([
      {
        shardId: '1',
        shardKey: this.singleShard.shardKey,
        capacity: this.singleShard.capacity,
        used: -1,
        free: -1,
      },
    ])
  }

  withTnx(_tnx: unknown): Sharder {
    return new SingleShard({
      shardKey: this.singleShard.shardKey,
      capacity: this.singleShard.capacity,
    })
  }

  freeByResource(_shardId: string | number, _resource: ShardResource): Promise<void> {
    return Promise.resolve()
  }

  cancel(_reservationId: string): Promise<void> {
    return Promise.resolve(undefined)
  }

  confirm(_reservationId: string, _resource: ShardResource): Promise<void> {
    return Promise.resolve(undefined)
  }

  createShard(opts: {
    kind: ResourceKind
    shardKey: string
    capacity?: number
    status?: ShardStatus
  }): Promise<ShardRow> {
    return Promise.resolve({
      shard_key: opts.shardKey,
      capacity: opts.capacity || this.singleShard.capacity,
      kind: opts.kind,
      id: 1,
      status: 'active',
      next_slot: 1,
      created_at: new Date().toISOString(),
    })
  }

  expireLeases(): Promise<number> {
    return Promise.resolve(0)
  }

  findShardByResourceId(param: ShardResource): Promise<ShardRow> {
    return Promise.resolve({
      id: 1,
      kind: param.kind,
      shard_key: this.singleShard.shardKey,
      capacity: this.singleShard.capacity,
      status: 'active',
      next_slot: 1,
      created_at: new Date().toISOString(),
    })
  }

  freeByLocation(_shardId: string | number, _slotNo: number): Promise<void> {
    return Promise.resolve(undefined)
  }

  reserve(_opts: ShardResource): Promise<ReservationResult> {
    return Promise.resolve({
      leaseExpiresAt: '',
      reservationId: '',
      shardId: '1',
      shardKey: this.singleShard.shardKey,
      slotNo: 0,
    })
  }

  setShardStatus(_shardId: string | number, _status: ShardStatus): Promise<void> {
    return Promise.resolve(undefined)
  }
}
