export type ResourceKind = 'vector' | 'iceberg-table'
export type ShardStatus = 'active' | 'draining' | 'disabled'
export type ReservationStatus = 'pending' | 'confirmed' | 'expired' | 'cancelled'

export type ShardRow = {
  id: number
  kind: ResourceKind
  shard_key: string
  capacity: number
  next_slot: number
  status: ShardStatus
  created_at: string
}

export type ReservationRow = {
  id: string
  kind: ResourceKind
  resource_id: string
  shard_id: string
  shard_key: string
  slot_no: number
  status: ReservationStatus
  tenant_id: string
  lease_expires_at: string
  created_at: string
}

export type ShardStats = Array<{
  shardId: string
  shardKey: string
  capacity: number
  used: number
  free: number
}>

/** Factory that opens a transaction and passes a store bound to that tx */
export interface ShardStoreFactory<Tnx = unknown> {
  withTransaction<T>(fn: (store: ShardStore) => Promise<T>): Promise<T>
  withExistingTransaction(tnx: Tnx): ShardStoreFactory<Tnx>
  /** Optional: an autocommit store for read-only helpers */
  autocommit(): ShardStore
}

export class UniqueViolationError extends Error {
  constructor(message = 'unique_violation') {
    super(message)
    this.name = 'UniqueViolationError'
  }
}

export interface ShardStoreFactory {
  withTransaction<T>(fn: (store: ShardStore) => Promise<T>): Promise<T>
  autocommit(): ShardStore // optional, for reads/one-off writes
}

/** Every method uses the bound tx/connection internally */
export interface ShardStore {
  // Locks
  advisoryLockByString(key: string): Promise<void>

  // Shards
  getOrInsertShard(
    kind: ResourceKind,
    shardKey: string,
    capacity: number,
    status: ShardStatus
  ): Promise<ShardRow>
  setShardStatus(shardId: string | number, status: ShardStatus): Promise<void>
  listActiveShards(kind: ResourceKind): Promise<ShardRow[]>
  findShardWithLeastFreeCapacity(kind: ResourceKind): Promise<ShardRow | null>

  // Reservations
  findReservationByKindKey(
    tenantId: string,
    kind: ResourceKind,
    resourceId: string
  ): Promise<ReservationRow | null>
  fetchReservationById(id: string): Promise<ReservationRow | null>

  // Sparse allocation (single-table, no freelist)
  // No longer needs reservationId parameter since slots don't track it
  reserveOneSlotOnShard(shardId: string | number, tenantId: string): Promise<number | null>

  insertReservation(data: {
    id: string
    kind: ResourceKind
    resourceId: string
    tenantId: string
    shardId: string | number
    shardKey: string
    slotNo: number
    leaseMs: number
  }): Promise<{ lease_expires_at: string }>

  /** Atomic confirm (checks: pending + lease valid) */
  confirmReservation(reservationId: string, resourceId: string, tenantId: string): Promise<number>

  updateReservationStatus(id: string, status: 'confirmed' | 'cancelled' | 'expired'): Promise<void>
  deleteReservation(id: string): Promise<void>
  deleteStaleReservationsForSlot(shardId: string | number, slotNo: number): Promise<void>

  // Expiry
  loadExpiredPendingReservations(): Promise<ReservationRow[]>
  markReservationsExpired(ids: string[]): Promise<void>

  // Free-by-location after delete
  freeByLocation(shardId: string | number, slotNo: number): Promise<void>
  freeByResource(shardId: string | number, resourceId: string, tenantId: string): Promise<void>
  findShardByResourceId(tenantId: string, resourceId: string): Promise<ShardRow | null>

  // Stats
  shardStats(kind?: ResourceKind): Promise<ShardStats>

  findShardById(shardId: number): Promise<ShardRow | null>
}
