-- migrate:up

ALTER ROLE authenticated inherit;
ALTER ROLE anon inherit;
ALTER ROLE service_role inherit;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'pgsodium_keyholder') THEN
    GRANT pgsodium_keyholder to service_role;
  END IF;
END $$;

-- migrate:down

