DO $$
    DECLARE
        anon_role text = COALESCE(current_setting('storage.anon_role', true), 'anon');
        authenticated_role text = COALESCE(current_setting('storage.authenticated_role', true), 'authenticated');
        service_role text = COALESCE(current_setting('storage.service_role', true), 'service_role');
    BEGIN
        CREATE TABLE IF NOT EXISTS storage.buckets_vectors (
            id text not null primary key,
            type storage.BucketType NOT NULL default 'VECTOR',
            created_at timestamptz NOT NULL default now(),
            updated_at timestamptz NOT NULL default now()
        );

        CREATE TABLE IF NOT EXISTS storage.vector_indexes
        (
            id                     text             primary key default gen_random_uuid(),
            name                   text COLLATE "C" NOT NULL,
            bucket_id              text             NOT NULL references storage.buckets_vectors (id),
            data_type              text             NOT NULL,
            dimension              integer          NOT NULL,
            distance_metric        text             NOT NULL,
            metadata_configuration jsonb            NULL,
            created_at             timestamptz      NOT NULL default now(),
            updated_at             timestamptz      NOT NULL default now()
        );

        ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;
        ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

        EXECUTE 'GRANT SELECT ON TABLE storage.buckets_vectors TO ' || service_role || ', ' || authenticated_role || ', ' || anon_role;
        EXECUTE 'GRANT SELECT ON TABLE storage.vector_indexes TO ' || service_role || ', ' || authenticated_role || ', ' || anon_role;

        CREATE UNIQUE INDEX IF NOT EXISTS vector_indexes_name_bucket_id_idx ON storage.vector_indexes (name, bucket_id);
END$$;