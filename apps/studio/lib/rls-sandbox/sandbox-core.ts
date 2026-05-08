import { PGliteWorker } from '@electric-sql/pglite/worker'

import { applySchema } from './apply-schema'
import { applySeed } from './apply-seed'
import type { ProjectSchemaDDLData } from '@/data/rls-sandbox/project-schema-ddl-query'
import type { TableSeedData } from '@/data/rls-sandbox/project-seed-data-query'
import { getErrorMessage } from '@/lib/get-error-message'

export type TileConfig =
  | { id: string; role: 'anon' | 'service_role' }
  | { id: string; role: 'authenticated'; userId: string; userEmail: string }

export interface TileResult {
  rows: Record<string, unknown>[]
  error?: string
}

export interface SandboxCore {
  setSchema(data: ProjectSchemaDDLData): Promise<void>
  setSeed(tables: TableSeedData[]): Promise<void>
  broadcastSql(sql: string): Promise<void>
  runAll(tiles: TileConfig[], sql: string): Promise<Record<string, TileResult>>
  destroy(): Promise<void>
}

// ALTER ROLE postgres SUPERUSER succeeds because the bootstrap connection owns the cluster.
// Each statement is individual so a single failure cannot abort the rest.
const SANDBOX_SETUP_STATEMENTS = [
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
  `CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
    $fn$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid $fn$`,
  `CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS
    $fn$ SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), 'anon') $fn$`,
  `CREATE OR REPLACE FUNCTION auth.email() RETURNS text LANGUAGE sql STABLE AS
    $fn$ SELECT NULLIF(current_setting('request.jwt.claim.email', true), '') $fn$`,
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

let instance: SandboxCore | null = null
let initPromise: Promise<SandboxCore> | null = null

export async function getSandboxCore(): Promise<SandboxCore> {
  if (instance) return instance
  if (!initPromise) {
    initPromise = boot().finally(() => {
      initPromise = null
    })
  }
  return initPromise
}

export function destroySandboxCore(): Promise<void> {
  const current = instance
  instance = null
  initPromise = null
  return current?.destroy() ?? Promise.resolve()
}

async function boot(): Promise<SandboxCore> {
  const webWorker = new Worker(new URL('./pglite.worker.ts', import.meta.url), { type: 'module' })
  const pg = await PGliteWorker.create(webWorker)

  for (const sql of SANDBOX_SETUP_STATEMENTS) {
    try {
      await pg.exec(sql)
    } catch (err) {
      console.warn('[rls-sandbox] setup:', (err as Error).message, `— ${sql.slice(0, 60)}`)
    }
  }

  function makeExecutor() {
    return { execSql: (sql: string) => pg.exec(sql).then(() => undefined as void) }
  }

  async function setSchema(data: ProjectSchemaDDLData): Promise<void> {
    await applySchema(makeExecutor(), data)
  }

  async function setSeed(tables: TableSeedData[]): Promise<void> {
    await applySeed(makeExecutor(), tables)
  }

  async function broadcastSql(sql: string): Promise<void> {
    await pg.exec(sql)
  }

  async function runTileQuery(tile: TileConfig, sql: string): Promise<TileResult> {
    // BEGIN/COMMIT wraps each tile so SET LOCAL ROLE and set_config(local=true) are
    // transaction-scoped, preventing session state from leaking between tiles.
    await pg.exec('BEGIN')
    try {
      const claims =
        tile.role === 'authenticated'
          ? { role: tile.role, sub: tile.userId, email: tile.userEmail }
          : { role: tile.role, sub: '', email: '' }

      await pg.exec(`SET LOCAL ROLE ${claims.role}`)
      await pg.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [claims.sub])
      await pg.query(`SELECT set_config('request.jwt.claim.role', $1, true)`, [claims.role])
      await pg.query(`SELECT set_config('request.jwt.claim.email', $1, true)`, [claims.email])

      const result = await pg.query<Record<string, unknown>>(sql)
      await pg.exec('COMMIT')
      return { rows: result.rows }
    } catch (err) {
      await pg.exec('ROLLBACK').catch(() => {})
      return { rows: [], error: getErrorMessage(err) ?? String(err) }
    }
  }

  async function runAll(tiles: TileConfig[], sql: string): Promise<Record<string, TileResult>> {
    const results: Record<string, TileResult> = {}
    for (const tile of tiles) {
      results[tile.id] = await runTileQuery(tile, sql)
    }
    return results
  }

  async function destroy(): Promise<void> {
    webWorker.terminate()
  }

  instance = { setSchema, setSeed, broadcastSql, runAll, destroy }
  return instance
}
