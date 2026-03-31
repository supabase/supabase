/**
 * Web Worker for running RLS policy tests using PGlite (Postgres in WASM).
 *
 * Each test spins up an isolated PGlite instance, loads the user's schema,
 * seeds a data subset, applies the candidate RLS policy, and then runs
 * SELECT / INSERT / UPDATE / DELETE probes under different roles.
 */

import { PGlite } from '@electric-sql/pglite'

// ── message protocol ───────────────────────────────────────────────
export type WorkerRequest =
  | { type: 'init' }
  | { type: 'load_schema'; sql: string }
  | { type: 'load_data'; sql: string }
  | {
      type: 'test_policy'
      tableName: string
      schema: string
      policySql: string
      roles: TestRole[]
    }
  | { type: 'dispose' }

export type TestRole = {
  name: string
  uid?: string
  email?: string
  role?: string
  additionalClaims?: Record<string, unknown>
}

export type RoleTestResult = {
  role: TestRole
  select: { allowed: boolean; rowCount: number; rows: Record<string, unknown>[]; error?: string }
  insert: { allowed: boolean; error?: string }
  update: { allowed: boolean; error?: string }
  delete: { allowed: boolean; error?: string }
}

export type WorkerResponse =
  | { type: 'ready' }
  | { type: 'schema_loaded' }
  | { type: 'data_loaded'; rowCount: number }
  | { type: 'test_result'; results: RoleTestResult[] }
  | { type: 'error'; message: string }

// ── worker state ───────────────────────────────────────────────────
let db: PGlite | null = null

async function initDb() {
  db = new PGlite()

  // Bootstrap the auth schema that Supabase RLS policies rely on
  await db.exec(`
    CREATE SCHEMA IF NOT EXISTS auth;

    CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
      LANGUAGE sql STABLE
    AS $$ SELECT COALESCE(
      current_setting('request.jwt.claim.sub', true),
      (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    )::uuid $$;

    CREATE OR REPLACE FUNCTION auth.role() RETURNS text
      LANGUAGE sql STABLE
    AS $$ SELECT COALESCE(
      current_setting('request.jwt.claim.role', true),
      (current_setting('request.jwt.claims', true)::jsonb ->> 'role')
    )::text $$;

    CREATE OR REPLACE FUNCTION auth.email() RETURNS text
      LANGUAGE sql STABLE
    AS $$ SELECT COALESCE(
      current_setting('request.jwt.claim.email', true),
      (current_setting('request.jwt.claims', true)::jsonb ->> 'email')
    )::text $$;

    CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb
      LANGUAGE sql STABLE
    AS $$ SELECT current_setting('request.jwt.claims', true)::jsonb $$;
  `)

  respond({ type: 'ready' })
}

async function loadSchema(sql: string) {
  if (!db) throw new Error('DB not initialised')
  await db.exec(sql)
  respond({ type: 'schema_loaded' })
}

async function loadData(sql: string) {
  if (!db) throw new Error('DB not initialised')
  const res = await db.exec(sql)
  const rowCount = res.reduce((acc, r) => acc + (r.affectedRows ?? 0), 0)
  respond({ type: 'data_loaded', rowCount })
}

async function setRoleContext(role: TestRole) {
  if (!db) throw new Error('DB not initialised')

  const claims: Record<string, unknown> = {
    sub: role.uid ?? '00000000-0000-0000-0000-000000000000',
    role: role.role ?? role.name,
    email: role.email ?? '',
    ...(role.additionalClaims ?? {}),
  }

  await db.exec(`
    SET LOCAL role = '${role.name === 'anon' ? 'anon' : 'authenticated'}';
    SELECT set_config('request.jwt.claims', '${JSON.stringify(claims)}', true);
    SELECT set_config('request.jwt.claim.sub', '${claims.sub}', true);
    SELECT set_config('request.jwt.claim.role', '${claims.role}', true);
    SELECT set_config('request.jwt.claim.email', '${claims.email}', true);
  `)
}

async function testPolicy(
  tableName: string,
  schema: string,
  policySql: string,
  roles: TestRole[]
) {
  if (!db) throw new Error('DB not initialised')

  const qualifiedTable = `"${schema}"."${tableName}"`

  // Enable RLS & apply the candidate policy inside a savepoint so we can
  // roll back between role probes without losing the table data.
  await db.exec(`ALTER TABLE ${qualifiedTable} ENABLE ROW LEVEL SECURITY;`)
  await db.exec(`ALTER TABLE ${qualifiedTable} FORCE ROW LEVEL SECURITY;`)

  // Create roles if they don't exist
  for (const role of roles) {
    const pgRole = role.name === 'anon' ? 'anon' : 'authenticated'
    try {
      await db.exec(`CREATE ROLE ${pgRole};`)
    } catch {
      // role may already exist
    }
    try {
      await db.exec(`GRANT USAGE ON SCHEMA "${schema}" TO ${pgRole};`)
      await db.exec(`GRANT ALL ON ${qualifiedTable} TO ${pgRole};`)
    } catch {
      // ignore if already granted
    }
  }

  // Drop any existing policies on the table to start clean
  const existingPolicies = await db.query<{ policyname: string }>(
    `SELECT policyname FROM pg_policies WHERE schemaname = $1 AND tablename = $2`,
    [schema, tableName]
  )
  for (const p of existingPolicies.rows) {
    await db.exec(`DROP POLICY IF EXISTS "${p.policyname}" ON ${qualifiedTable};`)
  }

  // Apply the candidate policy
  await db.exec(policySql)

  const results: RoleTestResult[] = []

  for (const role of roles) {
    const result: RoleTestResult = {
      role,
      select: { allowed: false, rowCount: 0, rows: [] },
      insert: { allowed: false },
      update: { allowed: false },
      delete: { allowed: false },
    }

    // Each role test runs in its own transaction to isolate side effects
    await db.exec('BEGIN;')
    try {
      await setRoleContext(role)

      // SELECT
      try {
        const selectRes = await db.query(`SELECT * FROM ${qualifiedTable};`)
        result.select = {
          allowed: true,
          rowCount: selectRes.rows.length,
          rows: selectRes.rows as Record<string, unknown>[],
        }
      } catch (e: any) {
        result.select = { allowed: false, rowCount: 0, rows: [], error: e.message }
      }

      // INSERT – try inserting a row with default/null values
      try {
        await db.exec('SAVEPOINT insert_test;')
        // Get column info to build a minimal insert
        const cols = await db.query<{ column_name: string; data_type: string }>(
          `SELECT column_name, data_type FROM information_schema.columns
           WHERE table_schema = $1 AND table_name = $2
           AND is_generated = 'NEVER' AND column_default IS NULL
           ORDER BY ordinal_position LIMIT 1`,
          [schema, tableName]
        )
        if (cols.rows.length > 0) {
          await db.exec(
            `INSERT INTO ${qualifiedTable} DEFAULT VALUES;`
          )
        }
        result.insert = { allowed: true }
        await db.exec('ROLLBACK TO insert_test;')
      } catch (e: any) {
        result.insert = { allowed: false, error: e.message }
        try {
          await db.exec('ROLLBACK TO insert_test;')
        } catch {
          // savepoint may not exist
        }
      }

      // UPDATE – try a no-op update on the first column
      try {
        await db.exec('SAVEPOINT update_test;')
        const colInfo = await db.query<{ column_name: string }>(
          `SELECT column_name FROM information_schema.columns
           WHERE table_schema = '${schema}' AND table_name = '${tableName}'
           ORDER BY ordinal_position LIMIT 1`
        )
        const col = colInfo.rows[0]?.column_name ?? 'id'
        await db.exec(
          `UPDATE ${qualifiedTable} SET "${col}" = "${col}" WHERE true;`
        )
        result.update = { allowed: true }
        await db.exec('ROLLBACK TO update_test;')
      } catch (e: any) {
        result.update = { allowed: false, error: e.message }
        try {
          await db.exec('ROLLBACK TO update_test;')
        } catch {
          // savepoint may not exist
        }
      }

      // DELETE – try deleting
      try {
        await db.exec('SAVEPOINT delete_test;')
        await db.exec(`DELETE FROM ${qualifiedTable} WHERE true;`)
        result.delete = { allowed: true }
        await db.exec('ROLLBACK TO delete_test;')
      } catch (e: any) {
        result.delete = { allowed: false, error: e.message }
        try {
          await db.exec('ROLLBACK TO delete_test;')
        } catch {
          // savepoint may not exist
        }
      }
    } finally {
      await db.exec('ROLLBACK;')
    }

    results.push(result)
  }

  respond({ type: 'test_result', results })
}

// ── message handling ───────────────────────────────────────────────
function respond(msg: WorkerResponse) {
  ;(self as unknown as Worker).postMessage(msg)
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  try {
    const msg = event.data
    switch (msg.type) {
      case 'init':
        await initDb()
        break
      case 'load_schema':
        await loadSchema(msg.sql)
        break
      case 'load_data':
        await loadData(msg.sql)
        break
      case 'test_policy':
        await testPolicy(msg.tableName, msg.schema, msg.policySql, msg.roles)
        break
      case 'dispose':
        if (db) {
          await db.close()
          db = null
        }
        break
    }
  } catch (err: any) {
    respond({ type: 'error', message: err.message ?? String(err) })
  }
}
