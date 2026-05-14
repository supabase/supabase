import { ident, literal, type PGPolicy } from '@supabase/pg-meta'

import { DatabaseSchemaDDL } from '@/data/rls-tester/get-schema-ddl'
import { TableSeedData } from '@/data/rls-tester/get-seed-data'
import { getErrorMessage } from '@/lib/get-error-message'

interface Executor {
  execSql(sql: string): Promise<void>
}

function buildPolicySQL(policy: PGPolicy): string {
  const name = ident(policy.name)
  const target = `${ident(policy.schema)}.${ident(policy.table)}`
  const permissiveness = policy.action === 'RESTRICTIVE' ? 'AS RESTRICTIVE' : ''
  const command = policy.command === 'ALL' ? '' : `FOR ${policy.command}`
  const roles = policy.roles?.length ? `TO ${policy.roles.map(ident).join(', ')}` : ''
  const using = policy.definition ? `USING (${policy.definition})` : ''
  const withCheck = policy.check ? `WITH CHECK (${policy.check})` : ''

  const drop = `DROP POLICY IF EXISTS ${name} ON ${target}`
  const create = [
    `CREATE POLICY ${name}`,
    `ON ${target}`,
    permissiveness,
    command,
    roles,
    using,
    withCheck,
  ]
    .filter(Boolean)
    .join(' ')
  return `${drop}; ${create}`
}

async function tryExec(sandbox: Executor, sql: string, label: string): Promise<void> {
  try {
    await sandbox.execSql(sql)
  } catch (err) {
    console.warn(`[rls-sandbox] skipped ${label}:`, getErrorMessage(err) ?? err)
  }
}

// Retry items until no further progress can be made — handles ordering
// dependencies (e.g. table A references type B that hasn't been created yet).
// Each pass attempts every pending item; survivors carry forward. When a full
// pass makes zero progress, surviving items are reported as unresolved.
async function runUntilFixpoint<T>(
  items: T[],
  attempt: (item: T) => Promise<void>,
  onUnresolved: (item: T, error: unknown) => void
): Promise<void> {
  let pending = items.slice()
  while (pending.length > 0) {
    const failed: Array<{ item: T; error: unknown }> = []
    for (const item of pending) {
      try {
        await attempt(item)
      } catch (error) {
        failed.push({ item, error })
      }
    }
    if (failed.length === pending.length) {
      for (const { item, error } of failed) onUnresolved(item, error)
      break
    }
    pending = failed.map((f) => f.item)
  }
}

async function applyDDLWithRetries(sandbox: Executor, ddlStatements: string[]): Promise<void> {
  await runUntilFixpoint(
    ddlStatements,
    (ddl) => sandbox.execSql(ddl),
    (ddl, error) =>
      console.warn(
        `[rls-sandbox] skipped DDL: ${ddl.slice(0, 80).replace(/\s+/g, ' ')} — ${getErrorMessage(error) ?? String(error)}`
      )
  )
}

export async function applySchema(
  sandbox: Executor,
  {
    schemas,
    typeDefinitions,
    entityDefinitions,
    functionDefinitions,
    policies,
    rlsStatuses,
    customRoles,
  }: DatabaseSchemaDDL
): Promise<void> {
  // Reset each user schema so re-syncs pick up renames/drops/column changes and
  // CREATE statements don't collide with the previous run's objects.
  for (const schema of schemas) {
    const schemaId = ident(schema)
    await tryExec(sandbox, `DROP SCHEMA IF EXISTS ${schemaId} CASCADE`, `drop schema ${schema}`)
    await tryExec(sandbox, `CREATE SCHEMA ${schemaId}`, `create schema ${schema}`)
    await tryExec(
      sandbox,
      `GRANT USAGE ON SCHEMA ${schemaId} TO anon, authenticated, service_role`,
      `grant schema ${schema}`
    )
  }

  if (customRoles.length > 0) {
    const checks = customRoles
      .map(
        ({ name }) =>
          `IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = ${literal(name)}) THEN CREATE ROLE ${ident(name)} NOLOGIN; END IF;`
      )
      .join('\n')
    await tryExec(sandbox, `DO $$ BEGIN\n${checks}\nEND $$`, 'custom roles')
  }

  await applyDDLWithRetries(sandbox, typeDefinitions)
  await applyDDLWithRetries(sandbox, entityDefinitions)

  for (const schema of [...new Set(rlsStatuses.map((t) => t.schema))]) {
    await tryExec(
      sandbox,
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${ident(schema)} TO anon, authenticated, service_role`,
      `grant tables in schema ${schema}`
    )
  }

  for (const { schema, table, rls_enabled, rls_forced } of rlsStatuses) {
    const actions: string[] = []
    if (rls_enabled) actions.push('ENABLE ROW LEVEL SECURITY')
    if (rls_forced) actions.push('FORCE ROW LEVEL SECURITY')
    if (actions.length === 0) continue
    await tryExec(
      sandbox,
      `ALTER TABLE ${ident(schema)}.${ident(table)} ${actions.join(', ')}`,
      `RLS on ${schema}.${table}`
    )
  }

  // Disable check_function_bodies so functions referencing not-yet-created objects don't abort.
  // Postgres resolves policy→function references at query time, not at CREATE POLICY time.
  await tryExec(sandbox, `SET check_function_bodies = off`, 'set check_function_bodies')
  for (const fn of functionDefinitions) {
    await tryExec(sandbox, fn, `function ${fn.slice(0, 60).replace(/\s+/g, ' ')}`)
  }
  await tryExec(sandbox, `RESET check_function_bodies`, 'reset check_function_bodies')

  for (const policy of policies) {
    await tryExec(
      sandbox,
      buildPolicySQL(policy),
      `policy ${policy.schema}.${policy.table} "${policy.name}"`
    )
  }
}

function serializeValue(val: unknown): string {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
  if (typeof val === 'number') return String(val)
  if (val instanceof Date) return `'${val.toISOString()}'`
  if (Array.isArray(val)) return `ARRAY[${val.map(serializeValue).join(', ')}]`
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`
  return `'${String(val).replace(/'/g, "''")}'`
}

function buildInsertSQL(schema: string, table: string, rows: Record<string, unknown>[]): string {
  if (rows.length === 0) throw new Error(`buildInsertSQL requires at least one row`)
  const columns = Object.keys(rows[0])
  const colList = columns.map((c) => ident(c)).join(', ')
  const valuesList = rows
    .map((row) => `(${columns.map((c) => serializeValue(row[c])).join(', ')})`)
    .join(',\n  ')
  return `INSERT INTO ${ident(schema)}.${ident(table)} (${colList}) VALUES\n  ${valuesList};`
}

export async function applySeed(sandbox: Executor, tables: TableSeedData[]): Promise<void> {
  // Disable FK triggers so we can delete and re-insert in any order.
  // Requires superuser (ALTER ROLE postgres SUPERUSER in SANDBOX_SETUP_STATEMENTS).
  // Falls back gracefully if the privilege is not available.
  let triggersDisabled = false
  try {
    await sandbox.execSql(`SET session_replication_role = replica`)
    triggersDisabled = true
  } catch {
    // postgres not yet a superuser in this PGlite build — proceed without it
  }

  try {
    // Always clear before inserting so re-seed reflects the latest data.
    for (const { schema, table } of tables) {
      try {
        await sandbox.execSql(`DELETE FROM ${ident(schema)}.${ident(table)}`)
      } catch {
        // table may not exist yet — ignore
      }
    }

    // Retry loop handles any remaining FK ordering constraints.
    await runUntilFixpoint(
      tables.filter((t) => t.rows.length > 0),
      (entry) => sandbox.execSql(buildInsertSQL(entry.schema, entry.table, entry.rows)),
      (entry) =>
        console.warn(`[rls-sandbox] seed skipped ${entry.schema}.${entry.table}: unresolved FK`)
    )
  } finally {
    if (triggersDisabled) {
      await sandbox.execSql(`SET session_replication_role = DEFAULT`)
    }
  }
}
