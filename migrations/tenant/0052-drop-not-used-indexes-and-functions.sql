-- Drop triggers if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='storage' AND table_name='prefixes') THEN
        DROP TRIGGER IF EXISTS prefixes_create_hierarchy ON storage.prefixes;
        DROP TRIGGER IF EXISTS prefixes_delete_hierarchy ON storage.prefixes;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END;
$$;

DO $$
    BEGIN
    ALTER TABLE storage.objects DROP COLUMN IF EXISTS level;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
$$;

DROP TABLE IF EXISTS storage.prefixes cascade;

-- Drop functions with exception handling so failures don't block migration
DO $$
BEGIN
    DROP FUNCTION IF EXISTS storage.objects_delete_cleanup();
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

DO $$
BEGIN
    DROP FUNCTION IF EXISTS storage.objects_update_cleanup();
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

DO $$
BEGIN
    DROP FUNCTION IF EXISTS storage.prefixes_delete_cleanup();
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

DO $$
BEGIN
    DROP FUNCTION IF EXISTS storage.objects_insert_prefix_trigger();
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

DO $$
BEGIN
    DROP FUNCTION IF EXISTS storage.delete_prefix_hierarchy_trigger();
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

DO $$
BEGIN
    DROP FUNCTION IF EXISTS storage.prefixes_insert_trigger();
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

DO $$
BEGIN
    DROP FUNCTION IF EXISTS storage.delete_leaf_prefixes();
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

DO $$
BEGIN
    DROP FUNCTION IF EXISTS storage.get_level();
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

DO $$
BEGIN
    DROP FUNCTION IF EXISTS storage.get_prefixes();
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

DO $$
BEGIN
    DROP FUNCTION IF EXISTS storage.delete_prefix(_bucket_id text, _name text);
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

DO $$
BEGIN
    DROP FUNCTION IF EXISTS storage.add_prefixes(_bucket_id text, _name text);
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

DO $$
BEGIN
    DROP FUNCTION IF EXISTS storage.get_prefix();
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

DO $$
BEGIN
    DROP FUNCTION IF EXISTS storage.objects_update_level_trigger();
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

DO $$
BEGIN
    DROP FUNCTION IF EXISTS storage.objects_update_prefix_trigger();
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

DO $$
BEGIN
    DROP FUNCTION IF EXISTS storage.lock_top_prefixes(bucket_ids text[], names text[]);
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

DO $$
BEGIN
    DROP FUNCTION IF EXISTS storage.search_v1_optimised(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text);
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;
