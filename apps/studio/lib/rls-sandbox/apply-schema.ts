import type { PostgresPolicy } from '@supabase/postgres-meta'

import type { CustomRole, RlsTableStatus } from '@/data/rls-sandbox/project-schema-ddl-query'
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
    entityDefinitions,
    functionDefinitions,
    policies,
    rlsStatuses,
    customRoles,
  }: {
    entityDefinitions: string[]
    functionDefinitions: string[]
    policies: PostgresPolicy[]
    rlsStatuses: RlsTableStatus[]
    customRoles: CustomRole[]
  }
): Promise<void> {
  for (const role of customRoles) {
    const safeName = role.name.replace(/"/g, '""')
    const safeNameLiteral = role.name.replace(/'/g, "''")
    await tryExec(
      sandbox,
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${safeNameLiteral}') THEN
          CREATE ROLE "${safeName}" NOLOGIN;
        END IF;
      END $$`,
      `role ${role.name}`
    )
  }

  await applyDDLWithRetries(sandbox, entityDefinitions)

  // Grant Supabase roles access to public schema — mirrors real Supabase grants
  await tryExec(
    sandbox,
    `GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role`,
    'grant schema usage'
  )

  for (const table of rlsStatuses) {
    await tryExec(
      sandbox,
      `GRANT SELECT, INSERT, UPDATE, DELETE ON "${table.schema}"."${table.table}" TO anon, authenticated, service_role`,
      `grant roles on ${table.schema}.${table.table}`
    )
    if (table.rls_enabled) {
      await tryExec(
        sandbox,
        `ALTER TABLE "${table.schema}"."${table.table}" ENABLE ROW LEVEL SECURITY`,
        `enable RLS ${table.schema}.${table.table}`
      )
    }
  }

  // Apply user-defined functions before policies — policies reference them and Postgres resolves
  // function bodies at query time, not at CREATE POLICY time. Disable check_function_bodies so a
  // function referencing a not-yet-created object doesn't abort the batch.
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
