-- migrate:up

-- Note: supatils extension is not installed in docker image.

DO $$
DECLARE
  supautils_exists boolean;
BEGIN
  supautils_exists = (
      select count(*) = 1
      from pg_available_extensions
      where name = 'supautils'
  );

  IF supautils_exists
  THEN
  ALTER ROLE authenticator SET session_preload_libraries = supautils, safeupdate;
  END IF;
END $$;

-- migrate:down
