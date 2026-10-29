import { expect, test } from 'vitest'

import { getExposedFunctionsSql } from '../../../../src'
import { createTestDatabase } from '../../../db/utils'

/**
 * Regression cover for the exposed-functions privilege query.
 *
 * The default function ACL grants EXECUTE to PUBLIC. The previous
 * implementation joined `aclexplode(...).grantee` to `pg_roles`, but PUBLIC is
 * grantee OID 0 and has no `pg_roles` row, so access inherited through PUBLIC
 * was never attributed to the Data API roles and a callable function was
 * reported as `revoked`.
 *
 * @see https://github.com/supabase/supabase/issues/50441
 */

// Roles the Data API connects as. These must exist for the query to be
// meaningful; `has_function_privilege` resolves them the same way PostgreSQL
// does when actually executing the function.
const DATA_API_ROLES = ['anon', 'authenticated', 'service_role']

// `has_function_privilege` needs the Data API roles to exist before it can
// resolve their effective privileges. Idempotent, so each test can run against
// its own freshly created database.
function dataApiRoleSetup(): string {
  const statements = DATA_API_ROLES.map(
    (role) =>
      `if not exists (select 1 from pg_roles where rolname = '${role}') then create role ${role} noinherit; end if;`
  )
  return `do $$ begin ${statements.join(' ')} end $$;`
}

async function exposedFunctionStatus(
  db: Awaited<ReturnType<typeof createTestDatabase>>,
  name: string
): Promise<string | undefined> {
  // Scope by name so the result isn't truncated by `limit`; the query returns
  // a single row carrying a `functions` JSON array.
  const sql = getExposedFunctionsSql({ search: name, offset: 0, limit: 100 })
  const res = await db.executeQuery<{ functions: Array<{ name: string; status: string }> }>(
    sql
  )
  return res[0].functions.find((row) => row.name === name)?.status
}

test('function executable via PUBLIC reports granted, not revoked', async (ctx) => {
  const db = await createTestDatabase()
  ctx.onTestFinished(async () => {
    await db.cleanup()
  })

  await db.executeQuery(dataApiRoleSetup())

  // No explicit ACL: PostgreSQL falls back to the built-in function ACL, which
  // grants EXECUTE to PUBLIC, so anon can invoke it through the Data API.
  await db.executeQuery(
    "create function public.exposed_functions_repro_public() returns json language sql as $$ select '{}'::json $$;"
  )
  expect(await exposedFunctionStatus(db, 'exposed_functions_repro_public')).toBe('granted')
})

test('function with revoked execute reports revoked', async (ctx) => {
  const db = await createTestDatabase()
  ctx.onTestFinished(async () => {
    await db.cleanup()
  })

  await db.executeQuery(dataApiRoleSetup())

  await db.executeQuery(
    "create function public.exposed_functions_repro_revoked() returns json language sql as $$ select '{}'::json $$;"
  )
  await db.executeQuery(
    'revoke execute on function public.exposed_functions_repro_revoked() from public, anon, authenticated, service_role;'
  )
  expect(await exposedFunctionStatus(db, 'exposed_functions_repro_revoked')).toBe('revoked')
})
