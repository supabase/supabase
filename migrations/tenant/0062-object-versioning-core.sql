-- Establish the additive, dark schema shared by object versioning and lifecycle.
-- No bucket can be enabled until a later writer-protocol migration and constraints are removed.

ALTER TABLE storage.buckets
ADD COLUMN IF NOT EXISTS versioning_status text NOT NULL DEFAULT 'DISABLED';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint
    WHERE conrelid = 'storage.buckets'::regclass
      AND conname = 'buckets_versioning_status_check'
  ) THEN
    ALTER TABLE storage.buckets
    ADD CONSTRAINT buckets_versioning_status_check CHECK (
      versioning_status IN ('DISABLED', 'ENABLED', 'SUSPENDED')
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint
    WHERE conrelid = 'storage.buckets'::regclass
      AND conname = 'buckets_versioning_standard_only_check'
  ) THEN
    ALTER TABLE storage.buckets
    ADD CONSTRAINT buckets_versioning_standard_only_check CHECK (
      type = 'STANDARD'
      OR versioning_status = 'DISABLED'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint
    WHERE conrelid = 'storage.buckets'::regclass
      AND conname = 'buckets_versioning_dark_check'
  ) THEN
    ALTER TABLE storage.buckets
    ADD CONSTRAINT buckets_versioning_dark_check CHECK (
      versioning_status = 'DISABLED'
    );
  END IF;
END;
$$;

-- The existing nullable version column, objects_pkey(id), and bucketid_objname
-- unique index intentionally remain unchanged in this wave.
ALTER TABLE storage.objects
ADD COLUMN IF NOT EXISTS archived_at timestamptz,
ADD COLUMN IF NOT EXISTS is_delete_marker boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_versioned boolean NOT NULL DEFAULT false;
