DO $$
    DECLARE
        is_multitenant bool = COALESCE(current_setting('storage.multitenant', true), 'false')::boolean;
        drop_constraint_sql text;
    BEGIN

        IF is_multitenant = false THEN
            ALTER TABLE storage.iceberg_namespaces DROP CONSTRAINT IF EXISTS iceberg_namespaces_catalog_id_fkey;
            ALTER TABLE storage.iceberg_tables DROP CONSTRAINT IF EXISTS iceberg_tables_catalog_id_fkey;
            ALTER TABLE storage.iceberg_namespaces DROP CONSTRAINT IF EXISTS iceberg_namespaces_bucket_id_fkey;
            ALTER TABLE storage.iceberg_tables DROP CONSTRAINT IF EXISTS iceberg_tables_bucket_id_fkey;
        END IF;

        -- remove primary key on iceberg_catalogs id
        SELECT concat('ALTER TABLE storage.buckets_analytics DROP CONSTRAINT ', constraint_name)
        INTO drop_constraint_sql
        FROM information_schema.table_constraints
        WHERE table_schema = 'storage'
          AND table_name = 'buckets_analytics'
          AND constraint_type = 'PRIMARY KEY';

        IF drop_constraint_sql IS NOT NULL THEN
            EXECUTE drop_constraint_sql;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buckets_analytics' AND column_name = 'name') THEN
            ALTER TABLE storage.buckets_analytics RENAME COLUMN id TO name;
        END IF;

        ALTER TABLE storage.buckets_analytics ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid();
        ALTER TABLE storage.buckets_analytics ADD PRIMARY KEY (id);
        ALTER TABLE storage.buckets_analytics ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;

        CREATE UNIQUE INDEX IF NOT EXISTS buckets_analytics_unique_name_idx
            ON storage.buckets_analytics (name) WHERE deleted_at IS NULL;

        IF is_multitenant THEN
            RETURN;
        END IF;

        DROP INDEX IF EXISTS idx_iceberg_namespaces_bucket_id;
        DROP INDEX IF EXISTS idx_iceberg_tables_namespace_id;

        -- remove constraint on iceberg_namespaces bucket_id
        ALTER TABLE storage.iceberg_namespaces DROP CONSTRAINT IF EXISTS iceberg_namespaces_bucket_id_fkey;
        -- remove constraint on iceberg_tables bucket_id
        ALTER TABLE storage.iceberg_tables DROP CONSTRAINT IF EXISTS iceberg_tables_bucket_id_fkey;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'iceberg_namespaces' AND column_name = 'bucket_name') THEN
            ALTER TABLE storage.iceberg_namespaces RENAME COLUMN bucket_id to bucket_name;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'iceberg_tables' AND column_name = 'bucket_name') THEN
            ALTER TABLE storage.iceberg_tables RENAME COLUMN bucket_id to bucket_name;
        END IF;

        ALTER TABLE storage.iceberg_namespaces ADD COLUMN IF NOT EXISTS catalog_id uuid NULL;
        ALTER TABLE storage.iceberg_tables ADD COLUMN IF NOT EXISTS catalog_id uuid NULL;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_schema = 'storage'
              AND table_name = 'iceberg_namespaces'
              AND constraint_name = 'iceberg_namespaces_catalog_id_fkey'
        ) THEN
            ALTER TABLE storage.iceberg_namespaces ADD CONSTRAINT iceberg_namespaces_catalog_id_fkey
                FOREIGN KEY (catalog_id) REFERENCES storage.buckets_analytics(id) ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_schema = 'storage'
              AND table_name = 'iceberg_tables'
              AND constraint_name = 'iceberg_tables_catalog_id_fkey'
        ) THEN
            ALTER TABLE storage.iceberg_tables ADD CONSTRAINT iceberg_tables_catalog_id_fkey
                FOREIGN KEY (catalog_id) REFERENCES storage.buckets_analytics(id) ON DELETE CASCADE;
        END IF;

        CREATE UNIQUE INDEX IF NOT EXISTS idx_iceberg_namespaces_bucket_id ON storage.iceberg_namespaces (catalog_id, name);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_iceberg_tables_namespace_id ON storage.iceberg_tables (catalog_id, namespace_id, name);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_iceberg_tables_location ON storage.iceberg_tables (location);

        -- Backfill catalog_id for existing namespaces and tables
        UPDATE storage.iceberg_tables it
        SET catalog_id = c.id
        FROM storage.buckets_analytics c
        WHERE c.name = it.bucket_name;

        UPDATE storage.iceberg_namespaces iname
        SET catalog_id = c.id
        FROM storage.buckets_analytics c
        WHERE c.name = iname.bucket_name;

        ALTER TABLE storage.iceberg_namespaces ALTER COLUMN catalog_id SET NOT NULL;
        ALTER TABLE storage.iceberg_tables ALTER COLUMN catalog_id SET NOT NULL;
END
$$;