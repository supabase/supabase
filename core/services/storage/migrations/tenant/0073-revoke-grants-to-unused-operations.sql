DO $$
DECLARE
    anon_role text = COALESCE(current_setting('storage.anon_role', true), 'anon');
    authenticated_role text = COALESCE(current_setting('storage.authenticated_role', true), 'authenticated');
BEGIN
    EXECUTE 'REVOKE TRUNCATE, REFERENCES, TRIGGER ON storage.objects, storage.buckets, storage.buckets_analytics FROM ' || anon_role || ', ' || authenticated_role;
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA storage REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM ' || anon_role || ', ' || authenticated_role;

    IF current_setting('server_version_num')::int >= 170000 THEN
        EXECUTE 'REVOKE MAINTAIN ON storage.objects, storage.buckets, storage.buckets_analytics FROM ' || anon_role || ', ' || authenticated_role;
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA storage REVOKE MAINTAIN ON TABLES FROM ' || anon_role || ', ' || authenticated_role;
    END IF;

    EXECUTE 'REVOKE ALL ON storage.buckets_vectors, storage.vector_indexes FROM ' || anon_role || ', ' || authenticated_role;
    EXECUTE 'GRANT SELECT ON storage.buckets_vectors, storage.vector_indexes TO ' || anon_role || ', ' || authenticated_role;
END$$;
