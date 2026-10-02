DO $$
    DECLARE
        is_multitenant bool = COALESCE(current_setting('storage.multitenant', true), 'false')::boolean;
        anon_role text = COALESCE(current_setting('storage.anon_role', true), 'anon');
        authenticated_role text = COALESCE(current_setting('storage.authenticated_role', true), 'authenticated');
        service_role text = COALESCE(current_setting('storage.service_role', true), 'service_role');
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'buckettype') THEN
            create type storage.BucketType as enum (
                'STANDARD',
                'ANALYTICS'
            );
        END IF;

        ALTER TABLE storage.buckets DROP COLUMN IF EXISTS iceberg_catalog;
        ALTER TABLE storage.buckets ADD COLUMN IF NOT EXISTS type storage.BucketType NOT NULL default 'STANDARD';

        CREATE TABLE IF NOT EXISTS storage.buckets_analytics (
            id text not null primary key,
            type storage.BucketType NOT NULL default 'ANALYTICS',
            format text NOT NULL default 'ICEBERG',
            created_at timestamptz NOT NULL default now(),
            updated_at timestamptz NOT NULL default now()
        );

        ALTER TABLE storage.buckets_analytics ADD COLUMN IF NOT EXISTS type storage.BucketType NOT NULL default 'ANALYTICS';
        ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

        EXECUTE 'GRANT ALL ON TABLE storage.buckets_analytics TO ' || service_role || ', ' || authenticated_role || ', ' || anon_role;

        IF is_multitenant THEN
            RETURN;
        END IF;

        CREATE TABLE IF NOT EXISTS storage.iceberg_namespaces (
            id uuid primary key default gen_random_uuid(),
            bucket_id text NOT NULL references storage.buckets_analytics(id) ON DELETE CASCADE,
            name text COLLATE "C" NOT NULL,
            created_at timestamptz NOT NULL default now(),
            updated_at timestamptz NOT NULL default now()
        );

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'iceberg_namespaces' AND column_name = 'bucket_id') THEN
            CREATE UNIQUE INDEX IF NOT EXISTS idx_iceberg_namespaces_bucket_id ON storage.iceberg_namespaces (bucket_id, name);
        END IF;

        CREATE TABLE IF NOT EXISTS storage.iceberg_tables (
          id uuid primary key default gen_random_uuid(),
          namespace_id uuid NOT NULL references storage.iceberg_namespaces(id) ON DELETE CASCADE,
          bucket_id text NOT NULL references storage.buckets_analytics(id) ON DELETE CASCADE,
          name text COLLATE "C" NOT NULL,
          location text not null,
          created_at timestamptz NOT NULL default now(),
          updated_at timestamptz NOT NULL default now()
        );

        DROP INDEX IF EXISTS idx_iceberg_tables_namespace_id;
        CREATE UNIQUE INDEX idx_iceberg_tables_namespace_id ON storage.iceberg_tables (namespace_id, name);

        ALTER TABLE storage.iceberg_namespaces ENABLE ROW LEVEL SECURITY;
        ALTER TABLE storage.iceberg_tables ENABLE ROW LEVEL SECURITY;

        EXECUTE 'revoke all on storage.iceberg_namespaces from ' || anon_role || ', ' || authenticated_role;
        EXECUTE 'GRANT ALL ON TABLE storage.iceberg_namespaces TO ' || service_role;
        EXECUTE 'GRANT SELECT ON TABLE storage.iceberg_namespaces TO ' || authenticated_role || ', ' || anon_role;

        EXECUTE 'revoke all on storage.iceberg_tables from ' || anon_role || ', ' || authenticated_role;
        EXECUTE 'GRANT ALL ON TABLE storage.iceberg_tables TO ' || service_role;
        EXECUTE 'GRANT SELECT ON TABLE storage.iceberg_tables TO ' || authenticated_role || ', ' || anon_role;
END$$;