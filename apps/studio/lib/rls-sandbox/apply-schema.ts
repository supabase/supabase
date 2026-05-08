import type { PostgresPolicy } from '@supabase/postgres-meta'

import type { ProjectSchemaDDL } from '@/data/rls-sandbox/project-schema-ddl-query'
import { getErrorMessage } from '@/lib/get-error-message'

interface Executor {
  execSql(sql: string): Promise<void>
}

function buildPolicySQL(policy: PostgresPolicy): string {
  const target = `"${policy.schema}"."${policy.table}"`
  const permissiveness = policy.action === 'RESTRICTIVE' ? 'AS RESTRICTIVE' : ''
  const command = policy.command === 'ALL' ? '' : `FOR ${policy.command}`
  const roles = policy.roles?.length ? `TO ${policy.roles.join(', ')}` : ''
  const using = policy.definition ? `USING (${policy.definition})` : ''
  const withCheck = policy.check ? `WITH CHECK (${policy.check})` : ''

  const drop = `DROP POLICY IF EXISTS "${policy.name}" ON ${target}`
  const create = [
    `CREATE POLICY "${policy.name}"`,
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

async function applyDDLWithRetries(sandbox: Executor, ddlStatements: string[]): Promise<void> {
  let pending = ddlStatements.slice()

  while (pending.length > 0) {
    const failed: Array<{ ddl: string; error: string }> = []
    for (const ddl of pending) {
      try {
        await sandbox.execSql(ddl)
      } catch (err) {
        failed.push({ ddl, error: getErrorMessage(err) ?? String(err) })
      }
    }
    if (failed.length === pending.length) {
      for (const { ddl, error } of failed) {
        console.warn(
          `[rls-sandbox] skipped DDL: ${ddl.slice(0, 80).replace(/\s+/g, ' ')} — ${error}`
        )
      }
      break
    }
    pending = failed.map((f) => f.ddl)
  }
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
  }: ProjectSchemaDDL
): Promise<void> {
  for (const schema of schemas) {
    if (schema === 'public') continue
    const safe = schema.replace(/"/g, '""')
    await tryExec(sandbox, `CREATE SCHEMA IF NOT EXISTS "${safe}"`, `schema ${schema}`)
    await tryExec(
      sandbox,
      `GRANT USAGE ON SCHEMA "${safe}" TO anon, authenticated, service_role`,
      `grant schema ${schema}`
    )
  }

  if (customRoles.length > 0) {
    const checks = customRoles
      .map(({ name }) => {
        const safeLiteral = name.replace(/'/g, "''")
        const safeIdent = name.replace(/"/g, '""')
        return `IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${safeLiteral}') THEN CREATE ROLE "${safeIdent}" NOLOGIN; END IF;`
      })
      .join('\n')
    await tryExec(sandbox, `DO $$ BEGIN\n${checks}\nEND $$`, 'custom roles')
  }

  await applyDDLWithRetries(sandbox, typeDefinitions)
  await applyDDLWithRetries(sandbox, entityDefinitions)

  for (const schema of [...new Set(rlsStatuses.map((t) => t.schema))]) {
    const safe = schema.replace(/"/g, '""')
    await tryExec(
      sandbox,
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "${safe}" TO anon, authenticated, service_role`,
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
      `ALTER TABLE "${schema}"."${table}" ${actions.join(', ')}`,
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
