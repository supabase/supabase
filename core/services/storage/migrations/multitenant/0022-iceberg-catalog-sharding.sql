DO $$
    DECLARE
        iceberg_shards text[] = COALESCE(current_setting('storage.iceberg_shards', true), '[]::text[]')::text[];
        iceberg_default_shard text = COALESCE(current_setting('storage.iceberg_default_shard', true), '')::text;
        i_shard_key text;
    BEGIN

        ALTER TABLE iceberg_namespaces ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

        ALTER TABLE iceberg_tables ADD COLUMN IF NOT EXISTS remote_table_id TEXT NULL;
        ALTER TABLE iceberg_tables ADD COLUMN IF NOT EXISTS shard_key TEXT NULL;
        ALTER TABLE iceberg_tables ADD COLUMN IF NOT EXISTS shard_id bigint NULL;

        -- Only allow deleting namespaces if empty
        ALTER TABLE iceberg_tables DROP CONSTRAINT IF EXISTS iceberg_tables_namespace_id_fkey;
        ALTER TABLE iceberg_tables DROP CONSTRAINT IF EXISTS iceberg_tables_namespace_id_fkey;

        ALTER TABLE iceberg_tables
            ADD CONSTRAINT iceberg_tables_namespace_id_fkey
                FOREIGN KEY (namespace_id)
                    REFERENCES iceberg_namespaces(id) ON DELETE RESTRICT;

        IF array_length(iceberg_shards, 1) = 0 THEN
            RETURN;
        END IF;

        FOREACH i_shard_key IN ARRAY iceberg_shards
            LOOP
                INSERT INTO shard (kind, shard_key, capacity) VALUES ('iceberg-table', i_shard_key, 10000)
                ON CONFLICT (kind, shard_key) DO NOTHING;
            END LOOP;

        UPDATE iceberg_tables
        SET shard_id = (
            SELECT id FROM shard WHERE kind = 'iceberg-table' AND shard_key = iceberg_default_shard LIMIT 1
        ), shard_key = iceberg_default_shard
        WHERE shard_id IS NULL;
    END
$$;
