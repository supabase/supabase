-- postgres-migrations disable-transaction
DO $$
    BEGIN
        DROP INDEX IF EXISTS idx_iceberg_namespaces_bucket_id;
        DROP INDEX IF EXISTS idx_iceberg_tables_tenant_namespace_id;
        DROP INDEX IF EXISTS idx_iceberg_tables_tenant_location;
        DROP INDEX IF EXISTS idx_iceberg_tables_location;

        -- remove primary key on iceberg_catalogs id
        ALTER TABLE iceberg_catalogs DROP CONSTRAINT IF EXISTS iceberg_catalogs_pkey;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'iceberg_catalogs' AND column_name = 'name') THEN
            ALTER TABLE iceberg_catalogs RENAME COLUMN id TO name;
        END IF;

        ALTER TABLE iceberg_catalogs ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid();
        ALTER TABLE iceberg_catalogs ADD PRIMARY KEY (id);
        ALTER TABLE iceberg_catalogs ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;

        CREATE INDEX IF NOT EXISTS iceberg_catalogs_unique_name_idx
            ON iceberg_catalogs (tenant_id, name) WHERE deleted_at IS NULL;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'iceberg_namespaces' AND column_name = 'bucket_name') THEN
            ALTER TABLE iceberg_namespaces RENAME COLUMN bucket_id to bucket_name;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'iceberg_tables' AND column_name = 'bucket_name') THEN
            ALTER TABLE iceberg_tables RENAME COLUMN bucket_id to bucket_name;
        END IF;

        ALTER TABLE iceberg_namespaces ADD COLUMN IF NOT EXISTS catalog_id uuid NULL REFERENCES iceberg_catalogs(id) ON DELETE CASCADE ON UPDATE CASCADE ;
        ALTER TABLE iceberg_tables ADD COLUMN IF NOT EXISTS catalog_id uuid NULL REFERENCES iceberg_catalogs(id) ON DELETE CASCADE ON UPDATE CASCADE;

        CREATE UNIQUE INDEX IF NOT EXISTS idx_iceberg_namespaces_bucket_id ON iceberg_namespaces (tenant_id, catalog_id, name);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_iceberg_tables_tenant_namespace_id ON iceberg_tables (tenant_id, namespace_id, catalog_id, name);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_iceberg_tables_tenant_location ON iceberg_tables (tenant_id, location);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_iceberg_tables_location ON iceberg_tables (location);

        -- create a unique index on name and deleted_at to allow only one active catalog with a given name
        CREATE UNIQUE INDEX IF NOT EXISTS iceberg_catalogs_name_deleted_at_idx
            ON iceberg_catalogs (tenant_id, name)
            WHERE deleted_at IS NULL;

        -- Backfill catalog_id for existing namespaces and tables
        UPDATE iceberg_tables it
        SET catalog_id = c.id
        FROM iceberg_catalogs c
        WHERE c.name = it.bucket_name;

        UPDATE iceberg_namespaces iname
        SET catalog_id = c.id
        FROM iceberg_catalogs c
        WHERE c.name = iname.bucket_name;

        ALTER TABLE iceberg_namespaces ALTER COLUMN catalog_id SET NOT NULL;
        ALTER TABLE iceberg_tables ALTER COLUMN catalog_id SET NOT NULL;
    END
$$;
