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
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticator') THEN
      CREATE ROLE authenticator NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'dashboard_user') THEN
      CREATE ROLE dashboard_user NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'pgbouncer') THEN
      CREATE ROLE pgbouncer NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_admin') THEN
      CREATE ROLE supabase_admin NOLOGIN;
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
  // Read both the per-claim setting (request.jwt.claim.<name>) and the JSON blob
  // (request.jwt.claims) so these work whether the caller uses Studio's role
  // impersonation (sets the JSON blob) or PostgREST-style per-claim settings.
  // Mirrors how the real Supabase auth.* helpers are defined.
  `CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
    $fn$ SELECT COALESCE(
      NULLIF(current_setting('request.jwt.claim.sub', true), ''),
      (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid $fn$`,
  `CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS
    $fn$ SELECT COALESCE(
      NULLIF(current_setting('request.jwt.claim.role', true), ''),
      (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'),
      'anon'
    ) $fn$`,
  `CREATE OR REPLACE FUNCTION auth.email() RETURNS text LANGUAGE sql STABLE AS
    $fn$ SELECT COALESCE(
      NULLIF(current_setting('request.jwt.claim.email', true), ''),
      (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
    ) $fn$`,
  `GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role`,
  `GRANT EXECUTE ON FUNCTION auth.role() TO anon, authenticated, service_role`,
  `GRANT EXECUTE ON FUNCTION auth.email() TO anon, authenticated, service_role`,
  // Minimal auth table stubs — enough for FK references and policy expressions.
  // Projects commonly have FKs to auth.users from public schema tables (e.g. profiles),
  // so without this stub those tables fail to create and their policies can't be tested.
  `CREATE TABLE IF NOT EXISTS auth.users (
    instance_id uuid,
    id uuid NOT NULL PRIMARY KEY,
    aud varchar(255),
    role varchar(255),
    email varchar(255),
    encrypted_password varchar(255),
    email_confirmed_at timestamptz,
    invited_at timestamptz,
    confirmation_token varchar(255),
    confirmation_sent_at timestamptz,
    recovery_token varchar(255),
    recovery_sent_at timestamptz,
    email_change_token_new varchar(255),
    email_change varchar(255),
    email_change_sent_at timestamptz,
    last_sign_in_at timestamptz,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamptz,
    updated_at timestamptz,
    phone text DEFAULT NULL,
    phone_confirmed_at timestamptz,
    phone_change text DEFAULT '',
    phone_change_token varchar(255) DEFAULT '',
    phone_change_sent_at timestamptz,
    confirmed_at timestamptz,
    email_change_token_current varchar(255) DEFAULT '',
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamptz,
    reauthentication_token varchar(255) DEFAULT '',
    reauthentication_sent_at timestamptz,
    is_sso_user boolean NOT NULL DEFAULT false,
    deleted_at timestamptz,
    is_anonymous boolean NOT NULL DEFAULT false
  )`,
  `CREATE TABLE IF NOT EXISTS auth.sessions (
    id uuid NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz,
    updated_at timestamptz,
    factor_id uuid,
    aal text,
    not_after timestamptz,
    refreshed_at timestamp,
    user_agent text,
    ip inet,
    tag text
  )`,
  `CREATE TABLE IF NOT EXISTS auth.mfa_factors (
    id uuid NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friendly_name text,
    factor_type text NOT NULL,
    status text NOT NULL,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamptz,
    web_authn_credential jsonb,
    web_authn_aaguid uuid
  )`,
  `GRANT SELECT, INSERT, UPDATE, DELETE ON auth.users, auth.sessions, auth.mfa_factors TO anon, authenticated, service_role`,
]

// Seeded alongside public tables so FK references from public → auth.users
// resolve to real rows. rls flags are ignored here — auth.users is set up by
// SANDBOX_SETUP_STATEMENTS, this entry is only used by the seed step.
//
// Columns are an explicit allow-list: enough to evaluate realistic RLS
// policies (id for FK matching, role/email/metadata for claim-style checks)
// while keeping secrets out of the browser-side PGlite instance — no
// encrypted_password, no *_token columns.
export const AUTH_USERS_SEED_TABLE = {
  schema: 'auth',
  table: 'users',
  rls_enabled: false,
  rls_forced: false,
  columns: [
    'id',
    'aud',
    'role',
    'email',
    'phone',
    'email_confirmed_at',
    'phone_confirmed_at',
    'last_sign_in_at',
    'confirmed_at',
    'raw_app_meta_data',
    'raw_user_meta_data',
    'is_super_admin',
    'is_sso_user',
    'is_anonymous',
    'banned_until',
    'deleted_at',
    'created_at',
    'updated_at',
  ],
} as const
