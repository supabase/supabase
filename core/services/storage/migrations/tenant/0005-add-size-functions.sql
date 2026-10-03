drop function if exists storage.get_size_by_bucket();
CREATE OR REPLACE FUNCTION storage.get_size_by_bucket()
 RETURNS TABLE (
    size BIGINT,
    bucket text
  )
 LANGUAGE plpgsql
AS $function$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, bucket_id as bucket
        from "storage".objects
        group by bucket_id;
END
$function$;