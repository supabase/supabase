-- migrate:up

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_extension WHERE extname = 'pgsodium') THEN
    CREATE OR REPLACE FUNCTION pgsodium.mask_role(masked_role regrole, source_name text, view_name text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO ''
    AS $function$
    BEGIN
      EXECUTE format(
        'GRANT SELECT ON pgsodium.key TO %s',
        masked_role);

      EXECUTE format(
        'GRANT pgsodium_keyiduser, pgsodium_keyholder TO %s',
        masked_role);

      EXECUTE format(
        'GRANT ALL ON %I TO %s',
        view_name,
        masked_role);
      RETURN;
    END
    $function$;
  END IF;
END $$;

-- migrate:down
