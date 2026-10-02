import { ERRORS } from '@internal/errors'
import {
  ExpiredReservationError,
  InvalidReservationStatusError,
  NoActiveShardError,
  ReservationNotFoundError,
} from '@internal/sharding/errors'
import { randomUUID } from 'crypto'
import { Sharder, ShardResource } from '../sharder'
import {
  ResourceKind,
  ShardRow,
  ShardStatus,
  ShardStoreFactory,
  UniqueViolationError,
} from '../store'

/**
 * Represents the configuration options for a shard in a distributed system or database.
 *
 * @interface ShardOptions
 *
 * @property {ResourceKind} kind - The type of resource the shard is managing or related to.
 * @property {string} shardKey - A unique identifier used to determine data placement within the shard.
 * @property {number} [capacity] - Optional. The storage or operational capacity allocated to the shard.
 * @property {ShardStatus} [status] - Optional. The current operational status of the shard.
 */
interface ShardOptions {
  kind: ResourceKind
  shardKey: string
  capacity?: number
  status?: ShardStatus
}

/**
 * Represents a catalog that manages shards and provides functionality for allocation, reservation, and management.
 * This class uses transactions for consistent state management and interacts with a shard storage system via a factory.
 */
export class ShardCatalog implements Sharder {
  constructor(private factory: ShardStoreFactory) {}

  withTnx(tnx: unknown) {
    return new ShardCatalog(this.factory.withExistingTransaction(tnx))
  }

  /**
  /**
   * Creates a new shard or retrieves an existing one based on the provided options.
   *
    * @param opts - The options to configure the shard. Includes properties like kind, shardKey, capacity, and status.
    * @return A promise that resolves to the created or retrieved shard row.
   */
  async createShard(opts: ShardOptions): Promise<ShardRow> {
    const capacity = opts.capacity ?? 10_000

    return this.factory.withTransaction(async (store) => {
      return await store.getOrInsertShard(
        opts.kind,
        opts.shardKey,
        capacity,
        opts.status ?? 'active'
      )
    })
  }

  /**
  /**
   * Creates multiple shards based on the provided shard options.
   *
    * @param opts - An array of shard options to configure each shard.
    * @return A promise that resolves to an array of created shards.
   */
  createShards(opts: ShardOptions[]) {
    return Promise.all(opts.map((o) => this.createShard(o)))
  }

  /**
  /**
   * Updates the status of a shard.
   *
    * @param shardId - The unique identifier of the shard to update.
    * @param status - The new status to set for the shard.
    * @return A promise that resolves when the status is updated.
   */
  async setShardStatus(shardId: string | number, status: ShardStatus) {
    return this.factory.withTransaction((store) => store.setShardStatus(shardId, status))
  }

  /**
   * Reserves a slot on a shard for a specific resource.
   * If a reservation already exists for the same resource, returns the existing reservation.
   * Uses advisory locking to prevent race conditions.
   *
   * @param opts - The reservation options.
   * @param opts.kind - The type of resource being reserved.
   * @param opts.tenantId - The ID of the tenant making the reservation.
   * @param opts.bucketName - The name of the bucket containing the resource.
   * @param opts.logicalName - The logical name of the resource.
   * @param opts.leaseMs - Optional. The lease duration in milliseconds (default: 60000ms).
   * @return A promise that resolves to an object containing reservation details.
   * @return return.reservationId - The unique identifier for the reservation.
   * @return return.shardId - The ID of the shard where the slot was reserved.
   * @return return.shardKey - The key of the shard where the slot was reserved.
   * @return return.slotNo - The slot number that was reserved.
   * @return return.leaseExpiresAt - The ISO timestamp when the lease expires.
   * @throws NoActiveShardError if no active shard is available for the resource kind.
   */
  async reserve(opts: {
    kind: ResourceKind
    tenantId: string
    bucketName: string
    logicalName: string
    leaseMs?: number
    shardId?: number
  }): Promise<{
    reservationId: string
    shardId: string
    shardKey: string
    slotNo: number
    leaseExpiresAt: string
  }> {
    const leaseMs = opts.leaseMs ?? 60_000
    const resourceId = `${opts.kind}::${opts.bucketName}::${opts.logicalName}`

    return this.factory.withTransaction(async (store) => {
      await store.advisoryLockByString(resourceId)

      const existing = await store.findReservationByKindKey(opts.tenantId, opts.kind, resourceId)

      if (existing) {
        if (existing.status === 'pending' || existing.status === 'confirmed') {
          return {
            shardKey: existing.shard_key,
            reservationId: existing.id,
            shardId: String(existing.shard_id),
            slotNo: Number(existing.slot_no),
            leaseExpiresAt: existing.lease_expires_at,
          }
        }

        // If cancelled or expired, delete it so we can create a new reservation
        if (
          existing.status === 'cancelled' ||
          existing.status === 'expired' ||
          new Date(existing.lease_expires_at) < new Date()
        ) {
          await store.deleteReservation(existing.id)
        }
      }

      const reservationId = randomUUID()

      // Select shard using FOR UPDATE to serialize selection and ensure
      // we read the committed next_slot value
      const shard = opts.shardId
        ? await store.findShardById(opts.shardId)
        : await store.findShardWithLeastFreeCapacity(opts.kind)
      if (!shard) {
        throw new NoActiveShardError(opts.kind)
      }

      // Reserve a slot on the selected shard
      // FOR UPDATE ensures no two processes reserve on the same shard simultaneously
      const slotNo = await store.reserveOneSlotOnShard(shard.id, opts.tenantId)
      if (slotNo == null) {
        // This should be very rare since FOR UPDATE serializes selection
        // Only happens if shard fills up between selection and reservation
        throw new NoActiveShardError(opts.kind)
      }

      await store.deleteStaleReservationsForSlot(shard.id, slotNo)

      try {
        const { lease_expires_at } = await store.insertReservation({
          id: reservationId,
          kind: opts.kind,
          resourceId,
          tenantId: opts.tenantId,
          shardId: shard.id,
          shardKey: shard.shard_key,
          slotNo,
          leaseMs,
        })

        return {
          reservationId,
          shardId: String(shard.id),
          shardKey: shard.shard_key,
          slotNo,
          leaseExpiresAt: lease_expires_at,
        }
      } catch (e) {
        if (e instanceof UniqueViolationError) {
          throw ERRORS.ResourceAlreadyExists(e)
        }
        throw e
      }
    })
  }

  /**
   * Confirms a pending reservation and associates it with a resource.
   * If the reservation has expired, frees the slot and throws an error.
   *
   * @param reservationId - The unique identifier of the reservation to confirm.
   * @param resource - The resource details to associate with the reservation.
   * @param resource.kind - The type of resource.
   * @param resource.tenantId - The ID of the tenant owning the resource.
   * @param resource.bucketName - The name of the bucket containing the resource.
   * @param resource.logicalName - The logical name of the resource.
   * @return A promise that resolves when the reservation is confirmed.
   * @throws ReservationNotFoundError if the reservation does not exist.
   * @throws InvalidReservationStatusError if the reservation is not in a pending state.
   * @throws ExpiredReservationError if the reservation lease has expired.
   */
  async confirm(
    reservationId: string,
    resource: {
      kind: ResourceKind
      tenantId: string
      bucketName: string
      logicalName: string
    }
  ): Promise<void> {
    await this.factory.withTransaction(async (store) => {
      const resv = await store.fetchReservationById(reservationId)
      if (!resv) throw new ReservationNotFoundError()
      if (resv.status === 'confirmed') return

      const resourceId = `${resource.kind}::${resource.bucketName}::${resource.logicalName}`

      const ok = await store.confirmReservation(reservationId, resourceId, resource.tenantId)

      if (!ok) {
        const fresh = await store.fetchReservationById(reservationId)

        if (!fresh) {
          throw new ReservationNotFoundError()
        }

        if (fresh.status !== 'pending') {
          throw new InvalidReservationStatusError(fresh.status)
        }

        await this.freeByLocation(fresh.shard_id, fresh.slot_no)

        throw new ExpiredReservationError()
      }
    })
  }

  /**
   * Cancels a pending reservation.
   * If the reservation does not exist, the operation completes silently.
   *
   * @param reservationId - The unique identifier of the reservation to cancel.
   * @return A promise that resolves when the reservation is cancelled.
   */
  async cancel(reservationId: string): Promise<void> {
    await this.factory.withTransaction(async (store) => {
      const resv = await store.fetchReservationById(reservationId)
      if (!resv) return
      if (resv.status !== 'pending') return
      await store.updateReservationStatus(reservationId, 'cancelled')
    })
  }

  /**
   * Expires all pending reservations whose lease has expired.
   *
   * @return A promise that resolves to the number of reservations that were expired.
   */
  async expireLeases(): Promise<number> {
    return this.factory.withTransaction(async (store) => {
      const expired = await store.loadExpiredPendingReservations()
      if (!expired.length) return 0
      await store.markReservationsExpired(expired.map((r) => r.id))
      return expired.length
    })
  }

  /**
   * Frees a slot on a shard by its location (shard ID and slot number).
   *
   * @param shardId - The unique identifier of the shard.
   * @param slotNo - The slot number to free.
   * @return A promise that resolves when the slot is freed.
   */
  freeByLocation(shardId: string | number, slotNo: number) {
    return this.factory.autocommit().freeByLocation(shardId, slotNo)
  }

  /**
   * Frees a slot on a shard by resource identifier.
   *
   * @param shardId - The unique identifier of the shard.
   * @param resource - The resource details to identify the slot.
   * @param resource.kind - The type of resource.
   * @param resource.bucketName - The name of the bucket containing the resource.
   * @param resource.logicalName - The logical name of the resource.
   * @param resource.tenantId - The ID of the tenant owning the resource.
   * @return A promise that resolves when the slot is freed.
   */
  freeByResource(shardId: string | number, resource: ShardResource): Promise<void> {
    const resourceId = `${resource.kind}::${resource.bucketName}::${resource.logicalName}`
    return this.factory.autocommit().freeByResource(shardId, resourceId, resource.tenantId)
  }

  /**
   * Retrieves statistics for shards, optionally filtered by resource kind.
   *
   * @param kind - Optional. The resource kind to filter statistics by.
   * @return A promise that resolves to an array of shard statistics.
   */
  shardStats(kind?: ResourceKind) {
    return this.factory.autocommit().shardStats(kind)
  }

  /**
   * Finds the shard associated with a specific resource.
   *
   * @param param - The resource identifier parameters.
   * @param param.kind - The type of resource.
   * @param param.tenantId - The ID of the tenant owning the resource.
   * @param param.logicalName - The logical name of the resource.
   * @param param.bucketName - The name of the bucket containing the resource.
   * @return A promise that resolves to the shard row if found, or null if not found.
   */
  async findShardByResourceId(param: {
    kind: string
    tenantId: string
    logicalName: string
    bucketName: string
  }) {
    const resourceId = `${param.kind}::${param.bucketName}::${param.logicalName}`
    return this.factory.autocommit().findShardByResourceId(param.tenantId, resourceId)
  }

  async listShardByKind(icebergTables: ResourceKind) {
    return this.factory.autocommit().listActiveShards(icebergTables)
  }
}
