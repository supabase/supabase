-- storage.filename is pure path parsing (same as foldername / extension) but was
-- left VOLATILE because PL/pgSQL defaults to that when unmarked. That breaks
-- plpgsql_check / `supabase db lint` for STABLE callers:
--   routine is marked as STABLE, but expression is VOLATILE
-- Align with foldername / extension (0036 / 0060).

CREATE OR REPLACE FUNCTION storage.filename(name text)
    RETURNS text
    LANGUAGE plpgsql
    IMMUTABLE
AS $function$
DECLARE
    _parts text[];
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    RETURN _parts[array_length(_parts, 1)];
END
$function$;
