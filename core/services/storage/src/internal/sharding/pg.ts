import { hashStringToInt } from '@internal/hashing'
import { logger, logSchema } from '@internal/monitoring'
import { DatabaseError, QueryResultRow } from 'pg'
import {
  type DatabaseExecutor,
  type DatabaseTransaction,
  type DatabaseTransactionalExecutor,
  isDatabaseTransaction,
} from '../database/connection'
import {
  ReservationRow,
  ResourceKind,
  ShardRow,
  ShardStatus,
  ShardStore,
  ShardStoreFactory,
  UniqueViolationError,
} from './store'

export class PgShardStoreFactory implements ShardStoreFactory<DatabaseTransaction> {
  constructor(private db: DatabaseTransactionalExecutor | DatabaseTransaction) {}

  withExistingTransaction(tnx: DatabaseTransaction): ShardStoreFactory<DatabaseTransaction> {
    return new PgShardStoreFactory(tnx)
  }

  async withTransaction<T>(fn: (store: ShardStore) => Promise<T>): Promise<T> {
    if (isDatabaseTransaction(this.db)) {
      return fn(new PgShardStore(this.db))
    }

    const trx = await this.db.beginTransaction()
    try {
      const result = await fn(new PgShardStore(trx))
      await trx.commit()
      return result
    } catch (e) {
      try {
        await trx.rollback()
      } catch (rollbackError) {
        logSchema.warning(logger, '[PgShardStoreFactory] Failed to rollback transaction', {
          type: 'db',
          error: rollbackError,
          metadata: JSON.stringify({ originalError: String(e) }),
        })
      }
      throw e
    }
  }

  autocommit(): ShardStore {
    return new PgShardStore(this.db)
  }
}

class PgShardStore implements ShardStore {
  constructor(private db: DatabaseExecutor) {}

  private query<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]) {
    return this.db.query<T>({ text, values })
  }

  async findShardById(shardId: number): Promise<ShardRow | null> {
    const result = await this.query<ShardRow>(
      `
        SELECT *
        FROM shard
        WHERE id = $1
        LIMIT 1
      `,
      [shardId]
    )

    return result.rows[0] ?? null
  }

  async advisoryLockByString(key: string): Promise<void> {
    const id = hashStringToInt(key)
    await this.query(`SELECT pg_advisory_xact_lock($1::bigint)`, [String(id)])
  }

  async findShardByResourceId(tenantId: string, resourceId: string): Promise<ShardRow | null> {
    const result = await this.query<ShardRow>(
      `
        SELECT s.shard_key, s.id
        FROM shard_slots AS ss
        JOIN shard AS s ON s.id = ss.shard_id
        WHERE ss.resource_id = $1
          AND ss.tenant_id = $2
        LIMIT 1
      `,
      [resourceId, tenantId]
    )

    return result.rows[0] ?? null
  }

  async getOrInsertShard(
    kind: ResourceKind,
    shardKey: string,
    capacity: number,
    status: ShardStatus
  ): Promise<ShardRow> {
    const inserted = await this.query<ShardRow>(
      `
        INSERT INTO shard (kind, shard_key, capacity, status, next_slot)
        VALUES ($1, $2, $3, $4, 0)
        ON CONFLICT (kind, shard_key) DO NOTHING
        RETURNING *
      `,
      [kind, shardKey, capacity, status]
    )

    if (inserted.rows[0]) {
      return inserted.rows[0]
    }

    const existing = await this.query<ShardRow>(
      `
        SELECT *
        FROM shard
        WHERE kind = $1
          AND shard_key = $2
        LIMIT 1
      `,
      [kind, shardKey]
    )

    if (!existing.rows[0]) {
      throw new Error('Failed to fetch shard after idempotent insert')
    }

    return existing.rows[0]
  }

  async setShardStatus(shardId: string | number, status: ShardStatus): Promise<void> {
    await this.query(
      `
        UPDATE shard
        SET status = $1
        WHERE id = $2
      `,
      [status, shardId]
    )
  }

  async listActiveShards(kind: ResourceKind): Promise<ShardRow[]> {
    const result = await this.query<ShardRow>(
      `
        SELECT *
        FROM shard
        WHERE kind = $1
          AND status = 'active'
      `,
      [kind]
    )

    return result.rows
  }

  async findShardWithLeastFreeCapacity(kind: ResourceKind): Promise<ShardRow | null> {
    const result = await this.query<ShardRow>(
      `
        WITH candidates AS (
          SELECT s.*,
                 GREATEST(
                   (s.capacity - s.next_slot) +
                   COALESCE((
                     SELECT COUNT(*)
                     FROM shard_slots sl
                     WHERE sl.shard_id = s.id
                       AND sl.resource_id IS NULL
                       AND NOT EXISTS (
                         SELECT 1 FROM shard_reservation sr
                         WHERE sr.shard_id = sl.shard_id
                           AND sr.slot_no = sl.slot_no
                           AND sr.status = 'pending'
                           AND sr.lease_expires_at > now()
                       )
                   ), 0),
                   0
                 ) AS free_capacity
          FROM shard s
          WHERE s.kind = $1 AND s.status = 'active'
          FOR UPDATE
        )
        SELECT *
        FROM candidates
        WHERE free_capacity > 0
        ORDER BY free_capacity ASC, shard_key ASC
        LIMIT 1
      `,
      [kind]
    )

    return result.rows[0] ?? null
  }

  async findReservationByKindKey(
    tenantId: string,
    kind: ResourceKind,
    resourceId: string
  ): Promise<ReservationRow | null> {
    const result = await this.query<ReservationRow>(
      `
        SELECT shard_reservation.*, shard.shard_key AS shard_key
        FROM shard_reservation
        JOIN shard ON shard.id = shard_reservation.shard_id
        WHERE shard_reservation.kind = $1
          AND shard_reservation.resource_id = $2
          AND shard_reservation.tenant_id = $3
        LIMIT 1
      `,
      [kind, resourceId, tenantId]
    )

    return result.rows[0] ?? null
  }

  async fetchReservationById(id: string): Promise<ReservationRow | null> {
    const result = await this.query<ReservationRow>(
      `
        SELECT *
        FROM shard_reservation
        WHERE id = $1
        LIMIT 1
      `,
      [id]
    )

    return result.rows[0] ?? null
  }

  async reserveOneSlotOnShard(shardId: string | number, tenantId: string): Promise<number | null> {
    const claimed = await this.query<{ slot_no: number }>(
      `
        WITH pick AS (
          SELECT ss.slot_no
          FROM shard_slots ss
          WHERE ss.shard_id = $1
            AND ss.resource_id IS NULL
            AND NOT EXISTS (
              SELECT 1 FROM shard_reservation sr
              WHERE sr.shard_id = ss.shard_id
                AND sr.slot_no = ss.slot_no
                AND sr.status = 'pending'
                AND sr.lease_expires_at > now()
            )
          ORDER BY ss.slot_no
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        UPDATE shard_slots s
           SET tenant_id = $2
        FROM pick
        WHERE s.shard_id = $3 AND s.slot_no = pick.slot_no
        RETURNING s.slot_no
      `,
      [shardId, tenantId, shardId]
    )

    if (claimed.rows.length) {
      return claimed.rows[0].slot_no
    }

    const minted = await this.query<{ slot_no: number }>(
      `
        WITH ok AS (
          SELECT id, capacity, next_slot
          FROM shard
          WHERE id = $1 AND status = 'active'
        ),
        bumped AS (
          UPDATE shard
             SET next_slot = ok.next_slot + 1
          FROM ok
          WHERE shard.id = ok.id
            AND ok.next_slot < ok.capacity
          RETURNING ok.next_slot AS slot_no
        )
        SELECT slot_no FROM bumped
      `,
      [shardId]
    )

    const slotNo = minted.rows[0]?.slot_no ?? null
    if (slotNo == null) {
      return null
    }

    try {
      await this.query(
        `
          INSERT INTO shard_slots (shard_id, slot_no, tenant_id)
          VALUES ($1, $2, $3)
        `,
        [shardId, slotNo, tenantId]
      )
      return slotNo
    } catch (e) {
      if (isUniqueViolation(e)) {
        return null
      }
      throw e
    }
  }

  async insertReservation(data: {
    id: string
    kind: ResourceKind
    resourceId: string
    tenantId: string
    shardId: string | number
    shardKey: string
    slotNo: number
    leaseMs: number
  }): Promise<{ lease_expires_at: string }> {
    try {
      const result = await this.query<{ lease_expires_at: string }>(
        `
          INSERT INTO shard_reservation (
            id,
            kind,
            resource_id,
            tenant_id,
            shard_id,
            slot_no,
            status,
            lease_expires_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, 'pending', now() + ($7::int * interval '1 millisecond'))
          RETURNING lease_expires_at
        `,
        [
          data.id,
          data.kind,
          data.resourceId,
          data.tenantId,
          data.shardId,
          data.slotNo,
          data.leaseMs,
        ]
      )

      return result.rows[0]
    } catch (e) {
      if (isUniqueViolation(e)) {
        throw new UniqueViolationError()
      }
      throw e
    }
  }

  async confirmReservation(
    reservationId: string,
    resourceId: string,
    tenantId: string
  ): Promise<number> {
    const result = await this.query(
      `
        WITH ok AS (
          SELECT r.shard_id, r.slot_no
          FROM shard_reservation r
          WHERE r.id = $1
            AND r.status = 'pending'
            AND r.tenant_id = $2
            AND r.lease_expires_at > now()
        ),
        upd_slots AS (
          UPDATE shard_slots s
             SET resource_id = $3
          FROM ok
          WHERE s.shard_id = ok.shard_id
            AND s.slot_no  = ok.slot_no
          RETURNING 1
        )
        UPDATE shard_reservation r
           SET status = 'confirmed'
        WHERE r.id = $1
          AND EXISTS (SELECT 1 FROM upd_slots)
        RETURNING 1
      `,
      [reservationId, tenantId, resourceId]
    )

    return result.rows.length
  }

  async updateReservationStatus(
    id: string,
    status: 'confirmed' | 'cancelled' | 'expired'
  ): Promise<void> {
    await this.query(
      `
        UPDATE shard_reservation
        SET status = $1
        WHERE id = $2
          AND status <> $1
      `,
      [status, id]
    )
  }

  async deleteReservation(id: string): Promise<void> {
    await this.query(`DELETE FROM shard_reservation WHERE id = $1`, [id])
  }

  async deleteStaleReservationsForSlot(shardId: string | number, slotNo: number): Promise<void> {
    await this.query(
      `
        DELETE FROM shard_reservation
        WHERE shard_id = $1
          AND slot_no = $2
          AND (
            status IN ('cancelled', 'expired')
            OR (
              status IN ('pending', 'cancelled', 'expired')
              AND lease_expires_at < now()
            )
          )
      `,
      [shardId, slotNo]
    )
  }

  async loadExpiredPendingReservations(): Promise<ReservationRow[]> {
    const result = await this.query<ReservationRow>(
      `
        SELECT *
        FROM shard_reservation
        WHERE status = 'pending'
          AND lease_expires_at < now()
      `
    )

    return result.rows
  }

  async markReservationsExpired(ids: string[]): Promise<void> {
    if (!ids.length) {
      return
    }

    await this.query(
      `
        UPDATE shard_reservation
        SET status = 'expired'
        WHERE id = ANY($1::uuid[])
      `,
      [ids]
    )
  }

  async freeByLocation(shardId: string | number, slotNo: number): Promise<void> {
    await this.query(
      `
        WITH updated_slots AS (
          UPDATE shard_slots
            SET resource_id = NULL, tenant_id = NULL
          WHERE shard_id = $1 AND slot_no = $2
          RETURNING shard_id, slot_no
        ),
        deleted_reservations AS (
          DELETE FROM shard_reservation
          WHERE shard_id = $1 AND slot_no = $2
        )
        SELECT 1
      `,
      [shardId, slotNo]
    )
  }

  async freeByResource(
    shardId: string | number,
    resourceId: string,
    tenantId: string
  ): Promise<void> {
    await this.query(
      `
        WITH updated_slots AS (
          UPDATE shard_slots
            SET resource_id = NULL, tenant_id = NULL
          WHERE shard_id = $1 AND resource_id = $2 AND tenant_id = $3
          RETURNING shard_id, slot_no
        ),
        deleted_reservations AS (
          DELETE FROM shard_reservation
          WHERE shard_id = $1
            AND resource_id = $2
            AND tenant_id = $3
        )
        SELECT 1
      `,
      [shardId, resourceId, tenantId]
    )
  }

  async shardStats(kind?: ResourceKind) {
    const result = await this.query<{
      shard_id: string | number
      shard_key: string
      capacity: string | number
      used: string | number
      free: string | number
    }>(
      `
        SELECT s.id AS shard_id, s.shard_key, s.capacity, s.next_slot,
               (
                 SELECT COUNT(*)
                 FROM shard_slots sl
                 WHERE sl.shard_id = s.id
                   AND sl.resource_id IS NOT NULL
               ) AS used,
               GREATEST(
                 (s.capacity - s.next_slot) +
                 COALESCE((
                   SELECT COUNT(*)
                   FROM shard_slots sl
                   WHERE sl.shard_id = s.id
                     AND sl.resource_id IS NULL
                     AND NOT EXISTS (
                       SELECT 1 FROM shard_reservation sr
                       WHERE sr.shard_id = sl.shard_id
                         AND sr.slot_no = sl.slot_no
                         AND sr.status = 'pending'
                         AND sr.lease_expires_at > now()
                     )
                 ), 0),
                 0
               ) AS free
        FROM shard s
        WHERE ($1::text IS NULL OR s.kind = $1)
        ORDER BY s.kind, s.shard_key
      `,
      [kind ?? null]
    )

    return result.rows.map((row) => ({
      shardId: String(row.shard_id),
      shardKey: row.shard_key,
      capacity: Number(row.capacity),
      used: Number(row.used),
      free: Number(row.free),
    }))
  }
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof DatabaseError && error.code === '23505'
}
