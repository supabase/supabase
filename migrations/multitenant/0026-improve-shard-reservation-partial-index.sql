ALTER TABLE shard_reservation
DROP CONSTRAINT IF EXISTS shard_reservation_kind_resource_id_key CASCADE;

DROP INDEX IF EXISTS shard_reservation_active_slot_idx;

-- Create partial unique index for confirmed reservations
-- Only one confirmed reservation per resource
CREATE UNIQUE INDEX IF NOT EXISTS shard_reservation_kind_resource_confirmed_idx
    ON shard_reservation (tenant_id, kind, resource_id);