DROP FUNCTION IF EXISTS storage.get_size_by_bucket();
CREATE OR REPLACE FUNCTION storage.get_size_by_bucket()
 RETURNS TABLE (
    size BIGINT,
    bucket_id text
  )
 LANGUAGE plpgsql
AS $function$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$function$;
