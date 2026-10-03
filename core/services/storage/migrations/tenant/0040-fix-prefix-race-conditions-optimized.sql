-- postgres-migrations ignore
-- Drop old prefix-related triggers that conflict with new GC system
DROP TRIGGER IF EXISTS prefixes_delete_hierarchy ON storage.prefixes;
DROP TRIGGER IF EXISTS objects_delete_delete_prefix ON storage.objects;
DROP TRIGGER IF EXISTS objects_update_create_prefix ON storage.objects;

-- Helper: Acquire statement-scoped advisory locks for the top-level path
-- for each \[bucket_id, name] pair to serialize operations per "bucket/top_level_prefix".
CREATE OR REPLACE FUNCTION storage.lock_top_prefixes(bucket_ids text[], names text[])
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
AS $$
DECLARE
    v_bucket text;
    v_top text;
BEGIN
    FOR v_bucket, v_top IN
        SELECT DISTINCT t.bucket_id,
            split_part(t.name, '/', 1) AS top
        FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        WHERE t.name <> ''
        ORDER BY 1, 2
        LOOP
            PERFORM pg_advisory_xact_lock(hashtextextended(v_bucket || '/' || v_top, 0));
        END LOOP;
END;
$$;

-- Helper: Given arrays of bucket_ids and names, compute all ancestor
-- prefixes and delete those that are leaves (no children objects or prefixes).
-- Repeats bottom-up until no more rows are removed.
CREATE OR REPLACE FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[])
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
            SELECT bucket_id,
                   name,
                   storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
            SELECT p.bucket_id, p.name, p.level
            FROM storage.prefixes AS p
            JOIN uniq AS u
              ON u.bucket_id = p.bucket_id
                  AND u.name = p.name
                  AND u.level = p.level
            WHERE NOT EXISTS (
                SELECT 1
                FROM storage.objects AS o
                WHERE o.bucket_id = p.bucket_id
                  AND storage.get_level(o.name) = p.level + 1
                  AND o.name COLLATE "C" LIKE p.name || '/%'
            )
            AND NOT EXISTS (
                SELECT 1
                FROM storage.prefixes AS c
                WHERE c.bucket_id = p.bucket_id
                  AND c.level = p.level + 1
                  AND c.name COLLATE "C" LIKE p.name || '/%'
            )
        )
        DELETE FROM storage.prefixes AS p
        USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;

-- After DELETE on storage.objects
-- - Guards with `gc.prefixes`
-- - Locks top-level prefixes for touched objects
-- - Deletes leaf prefixes derived from deleted object names and their ancestors
CREATE OR REPLACE FUNCTION storage.objects_delete_cleanup()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;

-- After UPDATE on storage.objects
-- - Only OLD names matter for cleanup; NEW prefixes are created elsewhere
-- - Guards with `gc.prefixes`, locks, then prunes leaves derived from OLD names
CREATE OR REPLACE FUNCTION storage.objects_update_cleanup()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
AS $$
DECLARE
    -- NEW - OLD (destinations to create prefixes for)
    v_add_bucket_ids text[];
    v_add_names      text[];

    -- OLD - NEW (sources to prune)
    v_src_bucket_ids text[];
    v_src_names      text[];
BEGIN
    IF TG_OP <> 'UPDATE' THEN
        RETURN NULL;
    END IF;

    -- 1) Compute NEW−OLD (added paths) and OLD−NEW (moved-away paths)
    WITH added AS (
        SELECT n.bucket_id, n.name
        FROM new_rows n
        WHERE n.name <> '' AND position('/' in n.name) > 0
        EXCEPT
        SELECT o.bucket_id, o.name FROM old_rows o WHERE o.name <> ''
    ),
    moved AS (
         SELECT o.bucket_id, o.name
         FROM old_rows o
         WHERE o.name <> ''
         EXCEPT
         SELECT n.bucket_id, n.name FROM new_rows n WHERE n.name <> ''
    )
    SELECT
        -- arrays for ADDED (dest) in stable order
        COALESCE( (SELECT array_agg(a.bucket_id ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        COALESCE( (SELECT array_agg(a.name      ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        -- arrays for MOVED (src) in stable order
        COALESCE( (SELECT array_agg(m.bucket_id ORDER BY m.bucket_id, m.name) FROM moved m), '{}' ),
        COALESCE( (SELECT array_agg(m.name      ORDER BY m.bucket_id, m.name) FROM moved m), '{}' )
    INTO v_add_bucket_ids, v_add_names, v_src_bucket_ids, v_src_names;

    -- Nothing to do?
    IF (array_length(v_add_bucket_ids, 1) IS NULL) AND (array_length(v_src_bucket_ids, 1) IS NULL) THEN
        RETURN NULL;
    END IF;

    -- 2) Take per-(bucket, top) locks: ALL prefixes in consistent global order to prevent deadlocks
    DECLARE
        v_all_bucket_ids text[];
        v_all_names text[];
    BEGIN
        -- Combine source and destination arrays for consistent lock ordering
        v_all_bucket_ids := COALESCE(v_src_bucket_ids, '{}') || COALESCE(v_add_bucket_ids, '{}');
        v_all_names := COALESCE(v_src_names, '{}') || COALESCE(v_add_names, '{}');

        -- Single lock call ensures consistent global ordering across all transactions
        IF array_length(v_all_bucket_ids, 1) IS NOT NULL THEN
            PERFORM storage.lock_top_prefixes(v_all_bucket_ids, v_all_names);
        END IF;
    END;

    -- 3) Create destination prefixes (NEW−OLD) BEFORE pruning sources
    IF array_length(v_add_bucket_ids, 1) IS NOT NULL THEN
        WITH candidates AS (
            SELECT DISTINCT t.bucket_id, unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(v_add_bucket_ids, v_add_names) AS t(bucket_id, name)
            WHERE name <> ''
        )
        INSERT INTO storage.prefixes (bucket_id, name)
        SELECT c.bucket_id, c.name
        FROM candidates c
        ON CONFLICT DO NOTHING;
    END IF;

    -- 4) Prune source prefixes bottom-up for OLD−NEW
    IF array_length(v_src_bucket_ids, 1) IS NOT NULL THEN
        -- re-entrancy guard so DELETE on prefixes won't recurse
        IF current_setting('storage.gc.prefixes', true) <> '1' THEN
            PERFORM set_config('storage.gc.prefixes', '1', true);
        END IF;

        PERFORM storage.delete_leaf_prefixes(v_src_bucket_ids, v_src_names);
    END IF;

    RETURN NULL;
END;
$$;

-- After DELETE on storage.prefixes
-- - When prefixes are deleted, remove now-empty ancestor prefixes
-- - Guards with `gc.prefixes`, locks, then prunes leaves derived from deleted prefixes
CREATE OR REPLACE FUNCTION storage.prefixes_delete_cleanup()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS objects_delete_cleanup ON storage.objects;
DROP TRIGGER IF EXISTS prefixes_delete_cleanup ON storage.prefixes;
DROP TRIGGER IF EXISTS objects_update_cleanup ON storage.objects;

-- Trigger bindings
CREATE TRIGGER objects_delete_cleanup
    AFTER DELETE ON storage.objects
    REFERENCING OLD TABLE AS deleted
    FOR EACH STATEMENT
EXECUTE FUNCTION storage.objects_delete_cleanup();

CREATE TRIGGER prefixes_delete_cleanup
    AFTER DELETE ON storage.prefixes
    REFERENCING OLD TABLE AS deleted
    FOR EACH STATEMENT
EXECUTE FUNCTION storage.prefixes_delete_cleanup();

CREATE TRIGGER objects_update_cleanup
    AFTER UPDATE ON storage.objects
    REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
    FOR EACH STATEMENT
EXECUTE FUNCTION storage.objects_update_cleanup();