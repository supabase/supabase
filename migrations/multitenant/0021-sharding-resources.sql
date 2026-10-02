

-- Main shards table.
CREATE TABLE IF NOT EXISTS shard (
    id           BIGSERIAL PRIMARY KEY,
    kind         TEXT NOT NULL,
    shard_key    TEXT NOT NULL,
    capacity     INT  NOT NULL DEFAULT 10000,
    next_slot    INT  NOT NULL DEFAULT 0,
    status       TEXT NOT NULL DEFAULT 'active',    -- active|draining|disabled
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (kind, shard_key)
);

-- Sparse slot rows: only the slots that have ever been used exist here.
-- A "free" slot is a row with reservation_id NULL and resource_id NULL.
CREATE TABLE IF NOT EXISTS shard_slots (
    shard_id       BIGINT NOT NULL REFERENCES shard(id) ON DELETE CASCADE,
    slot_no        INT    NOT NULL,
    tenant_id      TEXT,
    resource_id    TEXT,               -- set when confirmed
    PRIMARY KEY (shard_id, slot_no)
);

-- Reservations with short leases
CREATE TABLE IF NOT EXISTS shard_reservation (
    id               UUID PRIMARY KEY default gen_random_uuid(),
    kind             text NOT NULL,
    tenant_id        TEXT,
    resource_id      TEXT NOT NULL,               -- e.g. "vector::bucket::name"
    shard_id         BIGINT NOT NULL,
    slot_no          INT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'pending',  -- pending|confirmed|expired|cancelled
    lease_expires_at TIMESTAMPTZ NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (kind, resource_id),
    UNIQUE (shard_id, slot_no)
);

-- Fast “used count” per shard
CREATE INDEX IF NOT EXISTS shard_slots_used_idx
    ON shard_slots (shard_id)
    WHERE resource_id IS NOT NULL;

ALTER TABLE shard
    ADD CONSTRAINT shard_capacity_not_less_than_minted
        CHECK (capacity >= next_slot);


-- Create index for counting slots by tenant
CREATE INDEX IF NOT EXISTS shard_slots_tenant_id_idx
    ON shard_slots (tenant_id);

-- Create index for counting reservations by tenant
CREATE INDEX IF NOT EXISTS shard_reservation_tenant_id_idx
    ON shard_reservation (tenant_id);

-- Create index for counting used slots by tenant
CREATE INDEX IF NOT EXISTS shard_slots_tenant_resource_idx
    ON shard_slots (tenant_id, shard_id)
    WHERE resource_id IS NOT NULL;


ALTER TABLE shard_reservation
    ADD CONSTRAINT fk_shard_slot
        FOREIGN KEY (shard_id, slot_no)
            REFERENCES shard_slots(shard_id, slot_no)
            ON DELETE RESTRICT;


CREATE INDEX IF NOT EXISTS shard_slots_free_idx
    ON shard_slots (shard_id, slot_no)
    WHERE resource_id IS NULL;

-- Add index for finding active reservations by slot
CREATE INDEX IF NOT EXISTS shard_reservation_active_slot_idx
    ON shard_reservation (shard_id, slot_no, lease_expires_at)
    WHERE status = 'pending';