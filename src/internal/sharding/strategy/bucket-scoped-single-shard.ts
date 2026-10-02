import { ResourceKind, ShardRow, ShardStats, ShardStatus } from '@internal/sharding/store'
import { ReservationResult, Sharder, ShardResource } from '../sharder'

export class BucketScopedSingleShard implements Sharder {
  constructor(
    protected readonly opts: {
      keyPrefix: string
      capacity: number
    }
  ) {}

  protected shardKey(resource: ShardResource): string {
    return `${this.opts.keyPrefix}${resource.bucketName}`
  }

  listShardByKind(kind: ResourceKind): Promise<ShardRow[]> {
    // The actual shard_key varies per bucket (this.opts.keyPrefix + bucketName),
    // but list/stats have no bucket context. Return a single canonical entry
    // keyed by the prefix so generic introspection code doesn't think the
    // strategy has zero shards (parity with SingleShard's sentinel response).
    return Promise.resolve([
      {
        id: 1,
        kind,
        shard_key: this.opts.keyPrefix,
        capacity: this.opts.capacity,
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
        shardKey: this.opts.keyPrefix,
        capacity: this.opts.capacity,
        used: -1,
        free: -1,
      },
    ])
  }

  withTnx(_tnx: unknown): Sharder {
    return new BucketScopedSingleShard(this.opts)
  }

  freeByResource(_shardId: string | number, _resource: ShardResource): Promise<void> {
    return Promise.resolve()
  }

  cancel(_reservationId: string): Promise<void> {
    return Promise.resolve()
  }

  confirm(_reservationId: string, _resource: ShardResource): Promise<void> {
    return Promise.resolve()
  }

  createShard(opts: {
    kind: ResourceKind
    shardKey: string
    capacity?: number
    status?: ShardStatus
  }): Promise<ShardRow> {
    return Promise.resolve({
      shard_key: opts.shardKey,
      capacity: opts.capacity ?? this.opts.capacity,
      kind: opts.kind,
      id: 1,
      status: opts.status ?? 'active',
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
      shard_key: this.shardKey(param),
      capacity: this.opts.capacity,
      status: 'active',
      next_slot: 1,
      created_at: new Date().toISOString(),
    })
  }

  freeByLocation(_shardId: string | number, _slotNo: number): Promise<void> {
    return Promise.resolve()
  }

  reserve(opts: ShardResource): Promise<ReservationResult> {
    return Promise.resolve({
      leaseExpiresAt: '',
      reservationId: '',
      shardId: '1',
      shardKey: this.shardKey(opts),
      slotNo: 0,
    })
  }

  setShardStatus(_shardId: string | number, _status: ShardStatus): Promise<void> {
    return Promise.resolve()
  }
}
