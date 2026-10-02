DO $$
    DECLARE
        is_multitenant bool = COALESCE(current_setting('storage.multitenant', true), 'false')::boolean;
    BEGIN

        IF is_multitenant THEN
            RETURN;
        END IF;

        ALTER TABLE iceberg_namespaces ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';
        ALTER TABLE iceberg_tables ADD COLUMN IF NOT EXISTS remote_table_id TEXT NULL;

        ALTER TABLE iceberg_tables ADD COLUMN IF NOT EXISTS shard_key TEXT NULL;
        ALTER TABLE iceberg_tables ADD COLUMN IF NOT EXISTS shard_id TEXT NULL;
END
$$;