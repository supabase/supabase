-- Add lifecycle configuration.

ALTER TABLE storage.buckets
ADD COLUMN IF NOT EXISTS lifecycle_configuration jsonb,
ADD COLUMN IF NOT EXISTS lifecycle_configuration_generation uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint
    WHERE conrelid = 'storage.buckets'::regclass
      AND conname = 'buckets_lifecycle_configuration_pair_check'
  ) THEN
    ALTER TABLE storage.buckets
    ADD CONSTRAINT buckets_lifecycle_configuration_pair_check CHECK (
      (lifecycle_configuration IS NULL) =
      (lifecycle_configuration_generation IS NULL)
    ) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint
    WHERE conrelid = 'storage.buckets'::regclass
      AND conname = 'buckets_lifecycle_configuration_shape_check'
  ) THEN
    ALTER TABLE storage.buckets
    ADD CONSTRAINT buckets_lifecycle_configuration_shape_check CHECK (
      lifecycle_configuration IS NULL
      OR (
        jsonb_typeof(lifecycle_configuration) = 'object'
        AND lifecycle_configuration ? 'rules'
        AND CASE
          WHEN jsonb_typeof(lifecycle_configuration -> 'rules') = 'array'
            THEN jsonb_array_length(lifecycle_configuration -> 'rules') BETWEEN 1 AND 1000
          ELSE false
        END
      )
    ) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint
    WHERE conrelid = 'storage.buckets'::regclass
      AND conname = 'buckets_lifecycle_configuration_standard_only_check'
  ) THEN
    ALTER TABLE storage.buckets
    ADD CONSTRAINT buckets_lifecycle_configuration_standard_only_check CHECK (
      type = 'STANDARD'
      OR (
        lifecycle_configuration IS NULL
        AND lifecycle_configuration_generation IS NULL
      )
    ) NOT VALID;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION storage.protect_bucket_control_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  configuration_changed boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.lifecycle_configuration IS NOT NULL
       OR NEW.lifecycle_configuration_generation IS NOT NULL THEN
      IF NOT pg_has_role(current_user, TG_ARGV[0], 'MEMBER') THEN
        RAISE EXCEPTION 'only members of the configured storage service role may insert lifecycle policy state'
          USING ERRCODE = '42501',
                HINT = format(
                  'Insert with both lifecycle columns NULL and configure lifecycle through the Storage API afterward, or insert as a member of %I.',
                  TG_ARGV[0]
                );
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  configuration_changed =
    OLD.lifecycle_configuration IS DISTINCT FROM NEW.lifecycle_configuration
    OR OLD.lifecycle_configuration_generation IS DISTINCT FROM NEW.lifecycle_configuration_generation;

  IF NOT configuration_changed THEN
    RETURN NEW;
  END IF;

  IF NEW.type IS DISTINCT FROM 'STANDARD' THEN
    RAISE EXCEPTION 'bucket versioning and lifecycle controls require a Standard bucket'
      USING ERRCODE = '0A000';
  END IF;

  IF NEW.lifecycle_configuration IS NULL
     AND NEW.lifecycle_configuration_generation IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.lifecycle_configuration IS NULL
     OR NEW.lifecycle_configuration_generation IS NULL
     OR OLD.lifecycle_configuration IS NOT DISTINCT FROM NEW.lifecycle_configuration
     OR OLD.lifecycle_configuration_generation IS NOT DISTINCT FROM NEW.lifecycle_configuration_generation THEN
    RAISE EXCEPTION 'a changed lifecycle policy requires a new non-null generation'
      USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION storage.enforce_bucket_lifecycle_service_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  IF current_user::text IS DISTINCT FROM TG_ARGV[0]
     AND (
       OLD.lifecycle_configuration IS DISTINCT FROM NEW.lifecycle_configuration
       OR OLD.lifecycle_configuration_generation IS DISTINCT FROM NEW.lifecycle_configuration_generation
     ) THEN
    -- AFTER runs only after caller RLS has accepted the proposed row. The API
    -- recognizes this specific error after rolling back its permission probe;
    -- direct non-service writes still fail and cannot persist the change.
    RAISE EXCEPTION 'bucket control columns may only be changed by the configured storage service role'
      USING ERRCODE = 'PST01',
            SCHEMA = TG_TABLE_SCHEMA,
            TABLE = TG_TABLE_NAME,
            CONSTRAINT = TG_NAME;
  END IF;

  RETURN NULL;
END;
$$;

DO $$
DECLARE
  service_role text = COALESCE(current_setting('storage.service_role', true), 'service_role');
BEGIN
  DROP TRIGGER IF EXISTS protect_bucket_control_insert ON storage.buckets;
  EXECUTE format(
    'CREATE TRIGGER protect_bucket_control_insert BEFORE INSERT ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.protect_bucket_control_columns(%L)',
    service_role
  );

  DROP TRIGGER IF EXISTS protect_bucket_control_update ON storage.buckets;
  CREATE TRIGGER protect_bucket_control_update
    BEFORE UPDATE OF lifecycle_configuration, lifecycle_configuration_generation ON storage.buckets
    FOR EACH ROW EXECUTE FUNCTION storage.protect_bucket_control_columns();

  DROP TRIGGER IF EXISTS protect_bucket_control_update_role ON storage.buckets;
  EXECUTE format(
    'CREATE TRIGGER protect_bucket_control_update_role AFTER UPDATE OF lifecycle_configuration, lifecycle_configuration_generation ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_lifecycle_service_role(%L)',
    service_role
  );
END;
$$;
