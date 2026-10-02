# Sharding Implementation

This document explains how the sharding system works, how it allocates slots, manages reservations, and handles slot reuse.
This document was generated with Calude Code. A human did architecture & implementation.

## Overview

The sharding system provides a way to distribute resources (like vector indexes or Iceberg tables) across multiple physical shards while maintaining a logical namespace for tenants. It ensures that resources are evenly distributed and that capacity is managed efficiently.

## Core Concepts

### 1. Shards

A **shard** is a physical storage location (e.g., an S3 bucket) that can hold multiple resources. Each shard has:

- A `kind` (e.g., "vector" or "iceberg")
- A `shard_key` (the physical identifier, like "vector-shard-01")
- A `capacity` (maximum number of slots)
- A `next_slot` counter (tracks the next slot number to mint)
- A `status` ("active", "draining", or "disabled")

### 2. Slots

A **slot** is a numbered position within a shard. Slots are **sparse** - they only exist as rows in `shard_slots` when they've been allocated at least once.

Each slot can be in one of three states:

1. **Free**: `resource_id IS NULL` AND no active pending reservation exists
2. **Leased**: `resource_id IS NULL` AND an active pending reservation exists (temporarily held during creation)
3. **Confirmed**: `resource_id IS NOT NULL` (contains an active resource)

### 3. Reservations

A **reservation** is a time-bound claim on a slot. It's used to coordinate the two-phase process of creating a resource:

1. **Reserve**: Claim a slot and insert metadata in the database
2. **Confirm**: Create the actual resource (e.g., S3 Vector index) and mark the reservation as confirmed

Reservations have a `lease_expires_at` timestamp to prevent orphaned slots if a process crashes mid-creation.

## The Reservation Flow

### Phase 1: Reserve a Slot

When a tenant wants to create a new resource (e.g., a vector index), the system:

1. **Acquire advisory lock** on the logical key to prevent concurrent reservations
2. **Check for existing reservation** by `(kind, logical_key)`
   - If pending or confirmed → return the existing reservation
   - If cancelled or expired → delete it and continue
3. **Select a shard** using fullest first strategy
4. **Reserve a slot** on that shard (see "Slot Allocation" below)
5. **Create reservation record** in `shard_reservation` table
6. **Return reservation details** to the caller

### Phase 2: Confirm the Reservation

After the physical resource is created:

1. **Update `shard_slots`**: Set `resource_id`
2. **Update `shard_reservation`**: Set status to `'confirmed'`

This is done atomically to ensure consistency.

### Phase 3: Cleanup on Failure

If resource creation fails:

1. **Cancel the reservation**: Set status to `'cancelled'`

The slot becomes **free** again and can be reused immediately (since there's no active pending reservation).

## Slot Allocation Algorithm

When `reserveOneSlotOnShard(shardId, tenantId)` is called:

### Step 1: Try to Claim a Free Existing Slot

```sql
WITH pick AS (
  SELECT slot_no
  FROM shard_slots ss
  WHERE ss.shard_id = ?
    AND ss.resource_id IS NULL        -- Not occupied by a resource
    AND NOT EXISTS (
      SELECT 1 FROM shard_reservation sr
      WHERE sr.shard_id = ss.shard_id
        AND sr.slot_no = ss.slot_no
        AND sr.status = 'pending'
        AND sr.lease_expires_at > now()
    )
  ORDER BY slot_no
  LIMIT 1
  FOR UPDATE SKIP LOCKED          -- Lock-free concurrent access
)
UPDATE shard_slots s
   SET tenant_id = ?
FROM pick
WHERE s.shard_id = ? AND s.slot_no = pick.slot_no
RETURNING s.slot_no;
```

**Why this works:**

- Free slots have `resource_id` as `NULL` and no active pending reservation
- These slots were previously used but are now available for reuse
- `FOR UPDATE SKIP LOCKED` allows concurrent processes to skip locked rows and find other free slots

### Step 2: Mint a Fresh Slot (if no free slots found)

```sql
WITH ok AS (
  SELECT id, capacity, next_slot
  FROM shard
  WHERE id = ? AND status = 'active'
),
bumped AS (
  UPDATE shard
     SET next_slot = ok.next_slot + 1
  FROM ok
  WHERE shard.id = ok.id
    AND ok.next_slot < ok.capacity   -- Enforce capacity limit
  RETURNING ok.next_slot AS slot_no
)
SELECT slot_no FROM bumped;
```

Then insert a new row in `shard_slots`:

```sql
INSERT INTO shard_slots (shard_id, slot_no, tenant_id)
VALUES (?, ?, ?);
```

**Why we need `next_slot`:**

- It ensures we never create duplicate slot numbers
- It tracks how many slots have ever been created (even if some are now free)
- It enforces the shard's capacity limit

## How Reservations Prevent Double Allocation

The `shard_reservation` table serves as the **source of truth** for active leases. Here's how the system prevents double allocation:

### The Problem: Resource Creation is Not Atomic

Creating a resource involves multiple steps:

1. Reserve a slot in the database
2. Create the actual resource (e.g., call S3 Vectors API)
3. Update status to confirmed

If a process crashes between steps 1 and 2, we'd have a slot that's "allocated" in the database but has no actual resource.

### The Solution: Time-Bound Reservation Records

1. **During allocation**: Create a reservation record with status `'pending'` and a `lease_expires_at` timestamp
2. **On success**: Set `resource_id` in the slot, mark reservation as `'confirmed'`
3. **On failure**: Mark reservation as `'cancelled'` (slot becomes free again)
4. **On timeout**: A background job marks expired reservations as `'expired'` automatically

### The State Machine

```
FREE                          LEASED                           CONFIRMED
(no resource_id,         (no resource_id,              (resource_id set,
 no active pending)      pending reservation exists)    confirmed reservation)
     │                            │                            │
     ├────reserve slot───────────►│                            │
     │   (create pending resv)    │                            │
     │                            ├──confirm───────────────────►│
     │                            │ (set resource_id,           │
     │                            │  mark resv confirmed)       │
     │                            │                             │
     │◄───cancel/expire───────────┤                             │
     │   (mark resv cancelled)    │                             │
     │                            │                             │
     │◄─────────────────delete resource────────────────────────┤
     │                (clear resource_id)                       │
```

**How the system prevents double allocation:**

- A slot is only considered "free" if there's no active pending reservation for it
- The `NOT EXISTS` query checks for pending reservations with unexpired leases
- Multiple processes cannot create duplicate pending reservations due to unique constraint on `(kind, logical_key)`
- The reservation table provides a full audit trail of all attempts

### Example: Concurrent Allocations

```
Process A                          Process B
────────────────────────────────────────────────────
1. Reserve slot 5
   INSERT INTO shard_reservation
   (status='pending', slot_no=5)

2. Start creating resource...
                                   3. Try to reserve slot 5
                                      WHERE NOT EXISTS (
                                        pending reservation for slot 5
                                      )
                                      → SKIP (pending exists!)

3a. If success:
    SET resource_id = 'res-A'
    UPDATE reservation status='confirmed'

3b. If failure:
    UPDATE reservation status='cancelled'
                                   4. Try again, now succeeds:
                                      WHERE NOT EXISTS (
                                        active pending for slot 5
                                      )
                                      → OK (cancelled, not pending!)
                                      INSERT new reservation for slot 5
```

Without checking for active pending reservations, both processes could claim the same slot simultaneously.

### Database Design

The relationship is:

- `shard_reservation` has a foreign key to `shard_slots` via `(shard_id, slot_no)`
- This means **reservations point to slots** (not vice versa)
- A slot can have multiple reservation records over time (audit trail)
- Only one pending reservation per slot at a time is allowed by the NOT EXISTS check

## Handling Old Reservations During Slot Reuse

### The Challenge

When a slot is freed (after a resource is deleted), we have:

- A row in `shard_slots` with `resource_id = NULL` (slot is free)
- A row in `shard_reservation` with status `'confirmed'` (from the previous allocation)

The slot is considered free because the NOT EXISTS check only looks for **pending** reservations with valid leases. However, when we try to create a new reservation for the same slot, we'd hit a unique constraint violation on `(shard_id, slot_no)` because the old confirmed reservation still exists.

### The Solution: `deleteStaleReservationsForSlot()`

Before inserting a new reservation, we call:

```typescript
await store.deleteStaleReservationsForSlot(shardId, slotNo);
```

This deletes any old reservation rows (cancelled, expired, or confirmed) for the same `(shard_id, slot_no)` pair, allowing the slot to be reused with a new reservation.

**Why we need this:**

- Old reservations (cancelled, expired, or confirmed from freed slots) would prevent creating new reservations for the same slot
- Without cleanup, we'd get a unique violation on the `(shard_id, slot_no)` constraint
- Deleting old reservations before inserting enables slot reuse while preventing conflicts
- Only pending reservations are preserved (active leases in progress)

## Tenant ID Tracking

Both `shard_slots` and `shard_reservation` tables include a `tenant_id` column for:

- **Usage accounting**: Count slots per tenant
- **Quota enforcement**: Limit resources per tenant
- **Billing**: Track resource consumption

The `tenant_id` is:

- Set in both `shard_slots` and `shard_reservation` when reserving a slot
- Preserved in `shard_slots` when confirming
- Cleared from `shard_slots` when freeing a slot for reuse

### Available Strategies

#### 1. Fill-First Strategy (Default)

Prioritizes the shard with the **least free capacity** (most full first). This minimizes the number of active shards by filling them sequentially.

**Implementation**: Uses a single efficient SQL query:

```sql
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
WHERE s.kind = ? AND s.status = 'active'
HAVING free_capacity > 0
ORDER BY free_capacity ASC, s.shard_key ASC
LIMIT 1;
```

**Good for:**

- Reducing operational costs (fewer active shards to manage)
- Low contention environments
- When deterministic placement isn't required
- Consolidating resources into fewer physical locations

**Trade-offs:**

- No consistency across retries (a resource could map to different shards if capacity changes)
- All new allocations go to the same shard until it fills up (potential write hotspot)

## Capacity Management

Each shard has a `capacity` limit. When a shard reaches capacity:

1. `reserveOneSlotOnShard()` returns `null`
2. The shard selector may return a different shard (depending on strategy)
3. If no shards have available capacity, allocation fails with `NoActiveShardError`

**Capacity calculation:**

```
available = (capacity - next_slot) + count(free_slots)
```

Where:

- `capacity - next_slot` = slots that were never minted
- `count(free_slots)` = previously used slots that are now free

## Lease Expiration

A background job periodically calls `expireLeases()` to:

1. Find reservations where `status = 'pending' AND lease_expires_at < now()`
2. Mark reservations as expired: `UPDATE shard_reservation SET status = 'expired'`

Once marked as expired, slots automatically become free (since the NOT EXISTS check only looks for pending reservations with valid leases). This ensures that crashed processes don't permanently leak slots.

## Consistency Guarantees

### Advisory Locks

The system uses PostgreSQL advisory locks (`pg_advisory_xact_lock`) to serialize operations on the same logical resource, preventing race conditions.

**Scope**: Per logical resource (tenant + bucket + resource name)
**Protection**: Prevents duplicate reservations for the same logical resource

### Transactions

All multi-step operations are wrapped in database transactions with serializable isolation level to ensure consistency.

### Atomic Confirmations

The `confirmReservation()` method uses a CTE (Common Table Expression) to atomically:

- Check the reservation is still valid
- Update the slot
- Update the reservation status

If any step fails, the entire operation rolls back.

### Handling Concurrent Shard Selection

**The Problem**: Without locking, two processes might:

1. Read the same `next_slot` value (uncommitted data)
2. Both try to allocate the same slot number
3. Violate fill-first ordering by reading stale capacity

**The Solution**: `FOR UPDATE` on Shard Selection

The shard selection query uses `FOR UPDATE` to lock shard rows:

```sql
WITH candidates AS (
  SELECT s.*, <free_capacity_calculation>
  FROM shard s
  WHERE s.kind = ? AND s.status = 'active'
  FOR UPDATE  -- ← Serialize selection on same shard
)
SELECT * FROM candidates
WHERE free_capacity > 0
ORDER BY free_capacity ASC
LIMIT 1;
```

**How it works**:

```
Process A                           Process B
────────────────────────────────────────────────────
SELECT ... FOR UPDATE
Locks shard-1 row
Returns shard-1
                                    SELECT ... FOR UPDATE
                                    ⏸ Waits for shard-1 lock
reserveSlot(1) → SUCCESS
Updates next_slot: 0 → 1
Commit → releases lock
                                    ✅ Lock acquired!
                                    Reads next_slot = 1 (committed)
                                    Returns shard-1
                                    reserveSlot(1) → SUCCESS (slot 1)
```

**Why `FOR UPDATE` (not `SKIP LOCKED`)**:

- ✅ **Serializes selection**: Processes wait for correct capacity
- ✅ **Maintains fill-first**: All processes try fullest shard first
- ✅ **Prevents stale reads**: Always see committed `next_slot` value
- ✅ **No race on next_slot**: Can't allocate duplicate slot numbers

**Why NOT `SKIP LOCKED`**:

- ❌ Would violate fill-first: Process B skips to shard-2 while shard-1 has space
- ❌ Would spread load prematurely: Defeats purpose of fill-first strategy

**Lock Scope**:

- Locks only shard rows (not slots)
- Lock duration: ~1ms (during SELECT only)
- Released on transaction commit
- Affects only processes selecting the **same** kind (e.g., all "vector" allocations)

**Additional Protection**: `FOR UPDATE SKIP LOCKED` on Slots

The `reserveOneSlotOnShard` query uses `FOR UPDATE SKIP LOCKED` on **slot rows**:

```sql
SELECT ss.slot_no
FROM shard_slots ss
WHERE ss.shard_id = ? AND ss.resource_id IS NULL
FOR UPDATE SKIP LOCKED  -- ← Skip locked slots
```

This allows **concurrent reservations on different slots** within the same shard.

## Error Handling

### UniqueViolationError

If `insertReservation()` fails with a unique constraint violation:

1. Check if another process created a valid reservation concurrently
2. If yes, return that reservation (idempotent)
3. If no, clear the lease and fail

### Serialization Errors

The vector metadata DB has retry logic for serialization errors:

- Max 3 retries with exponential backoff
- Only retries on PostgreSQL error code `40001` (serialization failure)

## Summary

The sharding system provides:

- **Efficient allocation**: Reuses free slots before minting new ones
- **Consistency**: Advisory locks and transactions prevent race conditions
- **Fault tolerance**: Lease expiration prevents permanent slot leaks
- **Scalability**: Sparse slot storage and lock-free concurrent access
- **Multi-tenancy**: Tenant tracking for accounting and quota enforcement
- **Audit trail**: Full history of all reservation attempts in `shard_reservation` table
