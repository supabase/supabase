import { closeMultitenantPg, multitenantPgExecutor } from '@internal/database'
import { runMultitenantMigrations } from '@internal/database/migrations'
import { logger, logSchema } from '@internal/monitoring'
import { PgShardStoreFactory, ShardCatalog, SingleShard } from '@internal/sharding'
import {
  ExpiredReservationError,
  NoActiveShardError,
  ReservationNotFoundError,
} from '@internal/sharding/errors'
import { refillShardsQuery } from '@storage/events/upgrades/sync-catalog-ids'
import { randomUUID } from 'crypto'
import { useStorage } from './utils/storage'

describe('Sharding System', () => {
  const storageTest = useStorage()
  let storeFactory: PgShardStoreFactory
  let catalog: ShardCatalog

  beforeAll(async () => {
    storeFactory = new PgShardStoreFactory(multitenantPgExecutor)
    catalog = new ShardCatalog(storeFactory)

    await runMultitenantMigrations()
  })

  afterAll(() => {
    storageTest.database.connection.dispose()
  })

  beforeEach(async () => {
    // Clean up sharding tables before each test
    await cleanShardingTables()
  })

  describe('Shard Management', () => {
    it('should create a shard successfully', async () => {
      const shard = await catalog.createShard({
        kind: 'vector',
        shardKey: 'test-shard-1',
        capacity: 100,
        status: 'active',
      })

      expect(shard).toBeDefined()
      expect(shard.shard_key).toBe('test-shard-1')
      expect(shard.kind).toBe('vector')
      expect(shard.capacity).toBe(100)
      expect(shard.status).toBe('active')
    })

    it('should be idempotent when creating the same shard twice', async () => {
      const shard1 = await catalog.createShard({
        kind: 'vector',
        shardKey: 'test-shard-1',
        capacity: 100,
      })

      const shard2 = await catalog.createShard({
        kind: 'vector',
        shardKey: 'test-shard-1',
        capacity: 100,
      })

      expect(shard1.id).toBe(shard2.id)
      expect(shard1.shard_key).toBe(shard2.shard_key)
    })

    it('should create multiple shards in batch', async () => {
      const shards = await catalog.createShards([
        { kind: 'vector', shardKey: 'shard-1', capacity: 100 },
        { kind: 'vector', shardKey: 'shard-2', capacity: 200 },
        { kind: 'vector', shardKey: 'shard-3', capacity: 300 },
      ])

      expect(shards).toHaveLength(3)
      expect(shards[0].shard_key).toBe('shard-1')
      expect(shards[1].shard_key).toBe('shard-2')
      expect(shards[2].shard_key).toBe('shard-3')
    })

    it('should update shard status', async () => {
      const shard = await catalog.createShard({
        kind: 'vector',
        shardKey: 'test-shard-1',
        capacity: 100,
      })

      await catalog.setShardStatus(shard.id, 'draining')

      const store = storeFactory.autocommit()
      const shards = await store.listActiveShards('vector')
      expect(shards).toHaveLength(0) // draining shards are not active
    })

    it('should get shard stats', async () => {
      await catalog.createShard({
        kind: 'vector',
        shardKey: 'test-shard-1',
        capacity: 100,
      })

      const stats = await catalog.shardStats('vector')

      expect(stats).toHaveLength(1)
      expect(stats[0].shardKey).toBe('test-shard-1')
      expect(stats[0].capacity).toBe(100)
      expect(stats[0].used).toBe(0)
      expect(stats[0].free).toBe(100)
    })

    it('refills Iceberg shard next slots for every shard', async () => {
      const runId = `refill-${randomUUID()}`
      const tenantId = `${runId}-tenant`
      const bucketName = `${runId}-bucket`
      const catalogId = randomUUID()
      const namespaceId = randomUUID()
      const shardAKey = `${runId}-shard-a`
      const shardBKey = `${runId}-shard-b`
      const shardA = await catalog.createShard({
        kind: 'iceberg-table',
        shardKey: shardAKey,
        capacity: 100,
      })
      const shardB = await catalog.createShard({
        kind: 'iceberg-table',
        shardKey: shardBKey,
        capacity: 100,
      })

      try {
        await multitenantPgExecutor.query({
          text: `
            UPDATE shard
            SET next_slot = 99
            WHERE shard_key IN ($1, $2)
          `,
          values: [shardAKey, shardBKey],
        })
        await multitenantPgExecutor.query({
          text: `
            INSERT INTO iceberg_catalogs (id, name, tenant_id)
            VALUES ($1, $2, $3)
          `,
          values: [catalogId, bucketName, tenantId],
        })
        await multitenantPgExecutor.query({
          text: `
            INSERT INTO iceberg_namespaces (id, tenant_id, bucket_name, name, catalog_id)
            VALUES ($1, $2, $3, $4, $5)
          `,
          values: [namespaceId, tenantId, bucketName, `${runId}-namespace`, catalogId],
        })
        await multitenantPgExecutor.query({
          text: `
            INSERT INTO iceberg_tables (
              tenant_id,
              namespace_id,
              bucket_name,
              catalog_id,
              name,
              location,
              shard_id,
              shard_key
            )
            VALUES
              ($1, $2, $3, $4, $5, $6, $7, $8),
              ($1, $2, $3, $4, $9, $10, $7, $8),
              ($1, $2, $3, $4, $11, $12, $13, $14)
          `,
          values: [
            tenantId,
            namespaceId,
            bucketName,
            catalogId,
            `${runId}-table-a-1`,
            `s3://${bucketName}/table-a-1`,
            shardA.id,
            shardAKey,
            `${runId}-table-a-2`,
            `s3://${bucketName}/table-a-2`,
            `${runId}-table-b-1`,
            `s3://${bucketName}/table-b-1`,
            shardB.id,
            shardBKey,
          ],
        })

        await multitenantPgExecutor.query(
          "DELETE FROM shard_reservation where resource_id LIKE 'iceberg-table::%'"
        )
        await multitenantPgExecutor.query(
          "DELETE FROM shard_slots where resource_id LIKE 'iceberg-table::%'"
        )
        await multitenantPgExecutor.query(refillShardsQuery())

        const stats = await multitenantPgExecutor.query<{
          shard_key: string
          next_slot: number
          used_slots: number
          max_slot: number | null
        }>({
          text: `
            SELECT
              s.shard_key,
              s.next_slot,
              count(ss.slot_no) AS used_slots,
              max(ss.slot_no) AS max_slot
            FROM shard s
            LEFT JOIN shard_slots ss ON ss.shard_id = s.id
            WHERE s.shard_key IN ($1, $2)
            GROUP BY s.shard_key, s.next_slot
            ORDER BY s.shard_key
          `,
          values: [shardAKey, shardBKey],
        })

        expect(stats.rows).toEqual([
          {
            shard_key: shardAKey,
            next_slot: 2,
            used_slots: 2,
            max_slot: 1,
          },
          {
            shard_key: shardBKey,
            next_slot: 1,
            used_slots: 1,
            max_slot: 0,
          },
        ])
      } finally {
        await cleanupIcebergRows(catalogId)
      }
    })
  })

  describe('Reservation Flow', () => {
    beforeEach(async () => {
      await catalog.createShard({
        kind: 'vector',
        shardKey: 'test-shard-1',
        capacity: 100,
      })
    })

    it('should reserve a slot successfully', async () => {
      const reservation = await catalog.reserve({
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
      })

      expect(reservation).toBeDefined()
      expect(reservation.reservationId).toBeDefined()
      expect(reservation.shardKey).toBe('test-shard-1')
      expect(reservation.slotNo).toBe(0)
      expect(reservation.leaseExpiresAt).toBeDefined()
    })

    it('should be idempotent - return existing reservation', async () => {
      const res1 = await catalog.reserve({
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
      })

      const res2 = await catalog.reserve({
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
      })

      expect(res1.reservationId).toBe(res2.reservationId)
      expect(res1.slotNo).toBe(res2.slotNo)
    })

    it('should confirm a reservation', async () => {
      const reservation = await catalog.reserve({
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
      })

      await catalog.confirm(reservation.reservationId, {
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
      })

      // Check that slot is now confirmed
      const slots = await findShardSlotBySlotNo(reservation.slotNo)

      expect(slots.resource_id).toBe('vector::bucket-1::index-1')
    })

    it('should cancel a reservation', async () => {
      const reservation = await catalog.reserve({
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
      })

      await catalog.cancel(reservation.reservationId)

      const resv = await findReservationById(reservation.reservationId)

      expect(resv.status).toBe('cancelled')
    })

    it('should not cancel a confirmed reservation', async () => {
      const reservation = await catalog.reserve({
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
      })

      await catalog.confirm(reservation.reservationId, {
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
      })

      await catalog.cancel(reservation.reservationId)

      const resv = await findReservationById(reservation.reservationId)

      expect(resv.status).toBe('confirmed')
    })

    it('should throw error when confirming non-existent reservation', async () => {
      await expect(
        catalog.confirm(randomUUID(), {
          kind: 'vector',
          tenantId: 'tenant-1',
          bucketName: 'bucket-1',
          logicalName: 'index-1',
        })
      ).rejects.toThrow(ReservationNotFoundError)
    })

    it('should throw error when confirming expired reservation', async () => {
      const reservation = await catalog.reserve({
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
        leaseMs: 1, // 1ms lease
      })

      // Wait for lease to expire
      await new Promise((resolve) => setTimeout(resolve, 10))

      await expect(
        catalog.confirm(reservation.reservationId, {
          kind: 'vector',
          tenantId: 'tenant-1',
          bucketName: 'bucket-1',
          logicalName: 'index-1',
        })
      ).rejects.toThrow(ExpiredReservationError)
    })

    it('should free a slot by location', async () => {
      const reservation = await catalog.reserve({
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
      })

      await catalog.confirm(reservation.reservationId, {
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
      })

      await catalog.freeByLocation(reservation.shardId, reservation.slotNo)

      const slot = await findShardSlotBySlotNo(reservation.slotNo)

      expect(slot.resource_id).toBeNull()
      expect(slot.tenant_id).toBeNull()
    })

    it('should delete cancelled reservation and reuse slot', async () => {
      const res1 = await catalog.reserve({
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
      })

      await catalog.cancel(res1.reservationId)

      // Try to reserve again with same logical key
      const res2 = await catalog.reserve({
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
      })

      expect(res2.reservationId).not.toBe(res1.reservationId)
      expect(res2.slotNo).toBe(res1.slotNo) // Same slot reused
    })

    it('should handle UniqueViolationError and return existing reservation', async () => {
      // This test simulates the race condition where:
      // 1. Process A checks for existing reservation (findReservationByKindKey) - finds nothing
      // 2. Process B inserts a reservation for the same logical key
      // 3. Process A tries to insert - gets UniqueViolationError on (kind, logical_key)
      // 4. Process A catches the error, queries again, and returns the reservation from Process B

      // To simulate this, we'll use two concurrent reserve calls
      // Due to advisory locks, only one will proceed at a time, but there's still a tiny
      // window for race conditions. We'll make this more deterministic by:
      // 1. Starting two concurrent reserve operations
      // 2. One will succeed and insert the reservation
      // 3. The other might hit UniqueViolationError if it checked before the first inserted
      //    but tries to insert after

      // Start two concurrent reservations for the same logical resource
      const promises = [
        catalog.reserve({
          kind: 'vector',
          tenantId: 'tenant-1',
          bucketName: 'bucket-1',
          logicalName: 'index-race',
        }),
        catalog.reserve({
          kind: 'vector',
          tenantId: 'tenant-1',
          bucketName: 'bucket-1',
          logicalName: 'index-race',
        }),
      ]

      const results = await Promise.all(promises)

      // Both should succeed and return the same reservation (idempotent)
      expect(results[0].reservationId).toBe(results[1].reservationId)
      expect(results[0].slotNo).toBe(results[1].slotNo)
      expect(results[0].shardKey).toBe(results[1].shardKey)

      // Verify only one reservation was created
      const reservations = await findReservationsByResourceId(
        'vector',
        'vector::bucket-1::index-race'
      )

      expect(reservations).toHaveLength(1)
    })
  })

  describe('Slot Allocation', () => {
    beforeEach(async () => {
      await catalog.createShard({
        kind: 'vector',
        shardKey: 'test-shard-1',
        capacity: 5,
      })
    })

    it('should allocate sequential slot numbers', async () => {
      const reservations = []
      for (let i = 0; i < 5; i++) {
        const res = await catalog.reserve({
          kind: 'vector',
          tenantId: 'tenant-1',
          bucketName: 'bucket-1',
          logicalName: `index-${i}`,
        })
        reservations.push(res)
      }

      expect(reservations[0].slotNo).toBe(0)
      expect(reservations[1].slotNo).toBe(1)
      expect(reservations[2].slotNo).toBe(2)
      expect(reservations[3].slotNo).toBe(3)
      expect(reservations[4].slotNo).toBe(4)
    })

    it('should reuse freed slots before minting new ones', async () => {
      const res1 = await catalog.reserve({
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
      })

      await catalog.confirm(res1.reservationId, {
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
      })

      // Free slot 0
      await catalog.freeByLocation(res1.shardId, res1.slotNo)

      // Reserve another - should reuse slot 0
      const res2 = await catalog.reserve({
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-2',
      })

      expect(res2.slotNo).toBe(0)
    })

    it('should throw error when shard is at capacity', async () => {
      // Reserve all 5 slots
      for (let i = 0; i < 5; i++) {
        await catalog.reserve({
          kind: 'vector',
          tenantId: 'tenant-1',
          bucketName: 'bucket-1',
          logicalName: `index-${i}`,
        })
      }

      // Try to reserve one more
      await expect(
        catalog.reserve({
          kind: 'vector',
          tenantId: 'tenant-1',
          bucketName: 'bucket-1',
          logicalName: 'index-6',
        })
      ).rejects.toThrow(NoActiveShardError)
    })

    it('should track tenant_id in slots', async () => {
      const res = await catalog.reserve({
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
      })

      const slot = await findShardSlotBySlotNo(res.slotNo)

      expect(slot.tenant_id).toBe('tenant-1')
    })
  })

  describe('Lease Expiration', () => {
    beforeEach(async () => {
      await catalog.createShard({
        kind: 'vector',
        shardKey: 'test-shard-1',
        capacity: 100,
      })
    })

    it('should expire leases past their expiry time', async () => {
      await catalog.reserve({
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
        leaseMs: 1, // 1ms lease
      })

      // Wait for lease to expire
      await new Promise((resolve) => setTimeout(resolve, 10))

      const expired = await catalog.expireLeases()

      expect(expired).toBe(1)

      // Check reservation is marked expired
      const resv = await findFirstReservation()
      expect(resv.status).toBe('expired')
    })

    it('should allow reusing slot after lease expiration', async () => {
      const res1 = await catalog.reserve({
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
        leaseMs: 1,
      })

      await new Promise((resolve) => setTimeout(resolve, 10))
      await catalog.expireLeases()

      // Reserve with different logical key should reuse the slot
      const res2 = await catalog.reserve({
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-2',
      })

      expect(res2.slotNo).toBe(res1.slotNo)
    })

    it('should allow reserving a slot after one slot is already expired', async () => {
      const res1 = await catalog.reserve({
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
        leaseMs: 1,
      })

      await new Promise((resolve) => setTimeout(resolve, 10))

      // Reserve with different logical key should reuse the slot
      const res2 = await catalog.reserve({
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-2',
      })

      expect(res2.slotNo).toBe(res1.slotNo)
    })
  })

  describe('Shard Selectors', () => {
    describe('FillFirstShardSelector', () => {
      beforeEach(async () => {
        catalog = new ShardCatalog(storeFactory)

        // Create shards with different capacities
        await catalog.createShards([
          { kind: 'vector', shardKey: 'shard-1', capacity: 10 },
          { kind: 'vector', shardKey: 'shard-2', capacity: 20 },
          { kind: 'vector', shardKey: 'shard-3', capacity: 30 },
        ])
      })

      it('should fill shard-1 first (least free capacity)', async () => {
        const res = await catalog.reserve({
          kind: 'vector',
          tenantId: 'tenant-1',
          bucketName: 'bucket-1',
          logicalName: 'index-1',
        })

        expect(res.shardKey).toBe('shard-1')
      })

      it('should fill shards sequentially', async () => {
        // Fill shard-1 completely (10 slots)
        for (let i = 0; i < 10; i++) {
          await catalog.reserve({
            kind: 'vector',
            tenantId: 'tenant-1',
            bucketName: 'bucket-1',
            logicalName: `index-${i}`,
          })
        }

        // Next reservation should go to shard-2
        const res = await catalog.reserve({
          kind: 'vector',
          tenantId: 'tenant-1',
          bucketName: 'bucket-1',
          logicalName: 'index-11',
        })

        expect(res.shardKey).toBe('shard-2')
      })
    })
  })

  describe('Concurrency Tests', () => {
    beforeEach(async () => {
      catalog = new ShardCatalog(storeFactory)

      await catalog.createShard({
        kind: 'vector',
        shardKey: 'test-shard-1',
        capacity: 100,
      })
    })

    it('should handle concurrent reservations without conflicts', async () => {
      const promises = []
      for (let i = 0; i < 20; i++) {
        promises.push(
          catalog.reserve({
            kind: 'vector',
            tenantId: `tenant-${i}`,
            bucketName: 'bucket-1',
            logicalName: `index-${i}`,
          })
        )
      }

      const results = await Promise.all(promises)

      // All should succeed
      expect(results).toHaveLength(20)

      // All should have unique slot numbers
      const slotNumbers = results.map((r) => r.slotNo)
      const uniqueSlots = new Set(slotNumbers)
      expect(uniqueSlots.size).toBe(20)
    })

    it('should handle concurrent reservations on nearly-full shard', async () => {
      // Create a shard with only 5 slots
      await deleteShards()
      await catalog.createShard({
        kind: 'vector',
        shardKey: 'small-shard',
        capacity: 5,
      })

      // Fill 3 slots
      for (let i = 0; i < 3; i++) {
        await catalog.reserve({
          kind: 'vector',
          tenantId: 'tenant-1',
          bucketName: 'bucket-1',
          logicalName: `index-${i}`,
        })
      }

      // Try to reserve 5 slots concurrently (only 2 should succeed)
      const promises = []
      for (let i = 3; i < 8; i++) {
        promises.push(
          catalog
            .reserve({
              kind: 'vector',
              tenantId: 'tenant-1',
              bucketName: 'bucket-1',
              logicalName: `index-${i}`,
            })
            .catch((e) => e)
        )
      }

      const results = await Promise.all(promises)

      const successes = results.filter((r) => r.reservationId)
      const failures = results.filter((r) => r instanceof Error)

      expect(successes.length).toBe(2)
      expect(failures.length).toBe(3)
    })

    it('should handle concurrent confirm operations', async () => {
      const reservations: {
        reservationId: string
        shardId: string
        shardKey: string
        slotNo: number
        leaseExpiresAt: string
      }[] = []
      for (let i = 0; i < 10; i++) {
        const res = await catalog.reserve({
          kind: 'vector',
          tenantId: 'tenant-1',
          bucketName: 'bucket-1',
          logicalName: `index-${i}`,
        })
        reservations.push(res)
      }

      // Confirm all concurrently
      const confirmPromises = reservations.map((res) =>
        catalog.confirm(res.reservationId, {
          kind: 'vector',
          tenantId: 'tenant-1',
          bucketName: 'bucket-1',
          logicalName: `index-${reservations.indexOf(res)}`,
        })
      )

      await Promise.all(confirmPromises)

      // All should be confirmed
      const freeSlotCount = await countFreeSlots()
      expect(freeSlotCount).toBe(0)
    })

    it('should handle race condition when selecting same nearly-full shard', async () => {
      // Create two shards
      await deleteShards()
      await catalog.createShards([
        { kind: 'vector', shardKey: 'shard-1', capacity: 3 },
        { kind: 'vector', shardKey: 'shard-2', capacity: 100 },
      ])

      // Fill shard-1 with 2 slots
      for (let i = 0; i < 2; i++) {
        await catalog.reserve({
          kind: 'vector',
          tenantId: 'tenant-1',
          bucketName: 'bucket-1',
          logicalName: `index-${i}`,
        })
      }

      // Try to reserve 5 slots concurrently
      // Both processes might initially select shard-1 (has 1 slot free)
      // One should get shard-1, others should fall back to shard-2
      const promises = []
      for (let i = 2; i < 7; i++) {
        promises.push(
          catalog.reserve({
            kind: 'vector',
            tenantId: 'tenant-1',
            bucketName: 'bucket-1',
            logicalName: `index-${i}`,
          })
        )
      }

      const results = await Promise.all(promises)

      // All should succeed (no false negatives)
      expect(results).toHaveLength(5)

      // Check shard distribution
      const shard1Count = results.filter((r) => r.shardKey === 'shard-1').length
      const shard2Count = results.filter((r) => r.shardKey === 'shard-2').length

      expect(shard1Count).toBe(1) // Only 1 slot available in shard-1
      expect(shard2Count).toBe(4) // Rest go to shard-2
    })
  })

  describe('Edge Cases', () => {
    it('should throw error when no shards exist', async () => {
      await expect(
        catalog.reserve({
          kind: 'vector',
          tenantId: 'tenant-1',
          bucketName: 'bucket-1',
          logicalName: 'index-1',
        })
      ).rejects.toThrow(NoActiveShardError)
    })

    it('should throw error when all shards are disabled', async () => {
      await catalog.createShard({
        kind: 'vector',
        shardKey: 'test-shard-1',
        capacity: 100,
        status: 'disabled',
      })

      await expect(
        catalog.reserve({
          kind: 'vector',
          tenantId: 'tenant-1',
          bucketName: 'bucket-1',
          logicalName: 'index-1',
        })
      ).rejects.toThrow(NoActiveShardError)
    })

    it('should handle zero-capacity shard', async () => {
      await catalog.createShard({
        kind: 'vector',
        shardKey: 'zero-capacity',
        capacity: 0,
      })

      await expect(
        catalog.reserve({
          kind: 'vector',
          tenantId: 'tenant-1',
          bucketName: 'bucket-1',
          logicalName: 'index-1',
        })
      ).rejects.toThrow(NoActiveShardError)
    })

    it('should isolate different resource kinds', async () => {
      await catalog.createShards([
        { kind: 'vector', shardKey: 'vector-shard', capacity: 10 },
        { kind: 'iceberg-table', shardKey: 'iceberg-shard', capacity: 10 },
      ])

      const vectorRes = await catalog.reserve({
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
      })

      const icebergRes = await catalog.reserve({
        kind: 'iceberg-table',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'table-1',
      })

      expect(vectorRes.shardKey).toBe('vector-shard')
      expect(icebergRes.shardKey).toBe('iceberg-shard')
    })

    it('should find shard by resource id', async () => {
      await catalog.createShard({
        kind: 'vector',
        shardKey: 'test-shard-1',
        capacity: 100,
      })

      const res = await catalog.reserve({
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
      })

      await catalog.confirm(res.reservationId, {
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
      })

      const foundShard = await catalog.findShardByResourceId({
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
      })

      expect(foundShard?.shard_key).toBe('test-shard-1')
    })
  })
})

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

describe('PgShardStoreFactory', () => {
  let catalog: ShardCatalog

  beforeAll(async () => {
    await runMultitenantMigrations()
    catalog = new ShardCatalog(new PgShardStoreFactory(multitenantPgExecutor))
  })

  afterAll(async () => {
    await closeMultitenantPg()
  })

  beforeEach(async () => {
    await cleanShardingTables()
  })

  it('preserves original transaction errors when rollback fails', async () => {
    const originalError = new Error('shard transaction failed')
    const rollbackError = new Error('rollback failed')
    const trx = {
      commit: vi.fn().mockResolvedValue(undefined),
      rollback: vi.fn().mockRejectedValue(rollbackError),
    }
    const factory = new PgShardStoreFactory({
      beginTransaction: vi.fn().mockResolvedValue(trx),
    } as never)
    const logSpy = vi.spyOn(logSchema, 'warning').mockImplementation(() => undefined)

    try {
      await expect(
        factory.withTransaction(async () => {
          throw originalError
        })
      ).rejects.toBe(originalError)

      expect(trx.rollback).toHaveBeenCalledTimes(1)
      expect(logSpy).toHaveBeenCalledWith(
        logger,
        '[PgShardStoreFactory] Failed to rollback transaction',
        expect.objectContaining({
          type: 'db',
          error: rollbackError,
        })
      )
    } finally {
      logSpy.mockRestore()
    }
  })

  it('supports create, reserve, confirm, stats, and free using pg', async () => {
    const shard = await catalog.createShard({
      kind: 'vector',
      shardKey: 'pg-shard-1',
      capacity: 10,
    })

    expect(shard.shard_key).toBe('pg-shard-1')

    const reservation = await catalog.reserve({
      kind: 'vector',
      tenantId: 'tenant-1',
      bucketName: 'bucket-1',
      logicalName: 'index-1',
    })

    expect(reservation.shardKey).toBe('pg-shard-1')

    await catalog.confirm(reservation.reservationId, {
      kind: 'vector',
      tenantId: 'tenant-1',
      bucketName: 'bucket-1',
      logicalName: 'index-1',
    })

    await expect(
      catalog.findShardByResourceId({
        kind: 'vector',
        tenantId: 'tenant-1',
        bucketName: 'bucket-1',
        logicalName: 'index-1',
      })
    ).resolves.toMatchObject({
      shard_key: 'pg-shard-1',
    })

    await expect(catalog.shardStats('vector')).resolves.toEqual([
      {
        shardId: String(shard.id),
        shardKey: 'pg-shard-1',
        capacity: 10,
        used: 1,
        free: 9,
      },
    ])

    await catalog.freeByResource(shard.id, {
      kind: 'vector',
      tenantId: 'tenant-1',
      bucketName: 'bucket-1',
      logicalName: 'index-1',
    })

    await expect(catalog.shardStats('vector')).resolves.toEqual([
      {
        shardId: String(shard.id),
        shardKey: 'pg-shard-1',
        capacity: 10,
        used: 0,
        free: 10,
      },
    ])
  })
})

async function cleanShardingTables() {
  await multitenantPgExecutor.query('DELETE FROM shard_reservation')
  await multitenantPgExecutor.query('DELETE FROM shard_slots')
  await multitenantPgExecutor.query('DELETE FROM shard')
}

async function cleanupIcebergRows(catalogId: string) {
  await multitenantPgExecutor.query({
    text: `
      DELETE FROM iceberg_tables
      WHERE catalog_id = $1
    `,
    values: [catalogId],
  })
  await multitenantPgExecutor.query({
    text: `
      DELETE FROM iceberg_namespaces
      WHERE catalog_id = $1
    `,
    values: [catalogId],
  })
  await multitenantPgExecutor.query({
    text: `
      DELETE FROM iceberg_catalogs
      WHERE id = $1
    `,
    values: [catalogId],
  })
}

async function findShardSlotBySlotNo(slotNo: number) {
  const result = await multitenantPgExecutor.query<{
    resource_id: string | null
    tenant_id: string | null
  }>({
    text: 'SELECT resource_id, tenant_id FROM shard_slots WHERE slot_no = $1 LIMIT 1',
    values: [slotNo],
  })

  return result.rows[0]
}

async function findReservationById(id: string) {
  const result = await multitenantPgExecutor.query<{ status: string }>({
    text: 'SELECT status FROM shard_reservation WHERE id = $1 LIMIT 1',
    values: [id],
  })

  return result.rows[0]
}

async function findReservationsByResourceId(kind: string, resourceId: string) {
  const result = await multitenantPgExecutor.query({
    text: 'SELECT * FROM shard_reservation WHERE kind = $1 AND resource_id = $2',
    values: [kind, resourceId],
  })

  return result.rows
}

async function findFirstReservation() {
  const result = await multitenantPgExecutor.query<{ status: string }>(
    'SELECT status FROM shard_reservation LIMIT 1'
  )

  return result.rows[0]
}

async function countFreeSlots() {
  const result = await multitenantPgExecutor.query<{ count: number }>(
    'SELECT COUNT(*)::int AS count FROM shard_slots WHERE resource_id IS NULL'
  )

  return result.rows[0]?.count ?? 0
}

async function deleteShards() {
  await multitenantPgExecutor.query('DELETE FROM shard')
}
