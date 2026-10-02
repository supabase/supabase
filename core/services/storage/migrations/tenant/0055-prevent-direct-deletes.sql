-- Create a function that prevents direct deletes unless storage.allow_delete_query is set
CREATE OR REPLACE FUNCTION storage.protect_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS protect_buckets_delete ON storage.buckets;
CREATE TRIGGER protect_buckets_delete
    BEFORE DELETE ON storage.buckets
    FOR EACH STATEMENT
    EXECUTE FUNCTION storage.protect_delete();

DROP TRIGGER IF EXISTS protect_objects_delete ON storage.objects;
CREATE TRIGGER protect_objects_delete
    BEFORE DELETE ON storage.objects
    FOR EACH STATEMENT
    EXECUTE FUNCTION storage.protect_delete();
