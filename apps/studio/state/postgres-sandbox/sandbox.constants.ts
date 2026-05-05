// All superuser-required setup runs as the PGlite bootstrap user.
// ALTER ROLE postgres SUPERUSER succeeds because the bootstrap connection owns the cluster.
// Each statement is individual so a single failure cannot abort the rest.
export const SANDBOX_SETUP_STATEMENTS = [
  `ALTER ROLE postgres SUPERUSER`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
      CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
      CREATE ROLE authenticated NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
      CREATE ROLE service_role NOLOGIN;
    END IF;
  END $$`,
  `ALTER ROLE service_role BYPASSRLS`,
  `GRANT anon TO postgres WITH ADMIN OPTION`,
  `GRANT authenticated TO postgres WITH ADMIN OPTION`,
  `GRANT service_role TO postgres WITH ADMIN OPTION`,
  `GRANT CONNECT ON DATABASE postgres TO anon, authenticated, service_role`,
  `CREATE SCHEMA IF NOT EXISTS auth`,
  `GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role`,
  `GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role`,
  `CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
    $fn$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid $fn$`,
  `CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS
    $fn$ SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), 'anon') $fn$`,
  `CREATE OR REPLACE FUNCTION auth.email() RETURNS text LANGUAGE sql STABLE AS
    $fn$ SELECT NULLIF(current_setting('request.jwt.claim.email', true), '') $fn$`,
  `GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role`,
  `GRANT EXECUTE ON FUNCTION auth.role() TO anon, authenticated, service_role`,
  `GRANT EXECUTE ON FUNCTION auth.email() TO anon, authenticated, service_role`,
]
