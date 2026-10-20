import { randomUUID } from 'crypto'
import { afterAll, describe, expect, test } from 'vitest'

import { getImpersonationSQL, getRoleImpersonationLineOffset, safeSql } from '../../../src'
import { cleanupRoot, createTestDatabase } from '../../db/utils'

type Db = Awaited<ReturnType<typeof createTestDatabase>>

afterAll(async () => {
  await cleanupRoot()
})

const withTestDatabase = (name: string, fn: (db: Db) => Promise<void>) => {
  test(name, async () => {
    const db = await createTestDatabase()
    try {
      await fn(db)
    } finally {
      await db.cleanup()
    }
  })
}

const uniqueRole = () => `imp_${randomUUID().replace(/-/g, '_')}`

/**
 * A pre-request hook that records what PostgREST would have seen when it ran: the role in effect
 * and the claims, both of which have to be applied before the hook is called.
 *
 * Deliberately SECURITY INVOKER -- a definer-rights hook would report its own owner as
 * `current_user` and the role assertion below would pass no matter what impersonation did.
 */
const setupHook = async (db: Db, impersonatedRole: string) => {
  await db.executeQuery(`
    create role ${impersonatedRole} nologin;
    create table public.pre_request_calls (
      seen_user text,
      seen_claims text
    );
    grant usage on schema public to ${impersonatedRole};
    grant insert on public.pre_request_calls to ${impersonatedRole};
    create function public.record_pre_request() returns void
    language plpgsql as $fn$
    begin
      insert into public.pre_request_calls
        values (current_user, current_setting('request.jwt.claims', true));
    end
    $fn$;
  `)
}

const callsOf = (db: Db) =>
  db.executeQuery<{ seen_user: string; seen_claims: string | null }[]>(
    `select seen_user, seen_claims from public.pre_request_calls;`
  )

const impersonate = (role: string, sql = safeSql`select 1 as ok;`) =>
  getImpersonationSQL({
    role: { type: 'postgrest', role },
    unexpiredClaims: { role, sub: 'test-subject' },
    sql,
  })

describe('db_pre_request hook during role impersonation', () => {
  withTestDatabase('calls a hook configured on the authenticator role', async (db) => {
    const role = uniqueRole()
    await setupHook(db, role)
    // The shape Supabase itself uses. `in database` keeps the setting from leaking into the other
    // test databases on this cluster; `authenticator` is cluster-wide so it is only ever created.
    await db.executeQuery(`
      do $$ begin
        create role authenticator nologin;
      exception when duplicate_object then null;
      end $$;
      alter role authenticator in database ${db.dbName}
        set pgrst.db_pre_request = 'public.record_pre_request';
    `)

    await db.executeQuery(impersonate(role))

    expect(await callsOf(db)).toHaveLength(1)
  })

  withTestDatabase('calls a hook configured on the database', async (db) => {
    const role = uniqueRole()
    await setupHook(db, role)
    await db.executeQuery(
      `alter database ${db.dbName} set pgrst.db_pre_request = 'public.record_pre_request';`
    )

    await db.executeQuery(impersonate(role))

    expect(await callsOf(db)).toHaveLength(1)
  })

  withTestDatabase('runs the hook after the role and claims are applied', async (db) => {
    const role = uniqueRole()
    await setupHook(db, role)
    await db.executeQuery(
      `alter database ${db.dbName} set pgrst.db_pre_request = 'public.record_pre_request';`
    )

    await db.executeQuery(impersonate(role))

    // This ordering is the whole point: a hook that reads the role or the claims to decide what to
    // allow has to see the impersonated request, not the connection's own role.
    const [call] = await callsOf(db)
    expect(call.seen_user).toBe(role)
    expect(JSON.parse(call.seen_claims ?? '{}')).toMatchObject({ role, sub: 'test-subject' })
  })

  withTestDatabase('surfaces an error raised by the hook', async (db) => {
    const role = uniqueRole()
    await setupHook(db, role)
    await db.executeQuery(`
      create function public.blocking_pre_request() returns void
      language plpgsql as $fn$
      begin
        raise exception 'blocked by pre-request hook';
      end
      $fn$;
      alter database ${db.dbName} set pgrst.db_pre_request = 'public.blocking_pre_request';
    `)

    // A hook that blocks the Data API has to block impersonation too, otherwise impersonation
    // reports access that a real request would have been denied.
    await expect(db.executeQuery(impersonate(role))).rejects.toThrow('blocked by pre-request hook')
  })

  withTestDatabase('does not call the hook for custom role impersonation', async (db) => {
    const role = uniqueRole()
    await setupHook(db, role)
    await db.executeQuery(
      `alter database ${db.dbName} set pgrst.db_pre_request = 'public.record_pre_request';`
    )

    // `db_pre_request` is a PostgREST concept; impersonating a plain database role is not a
    // PostgREST request and must not run it.
    await db.executeQuery(
      getImpersonationSQL({ role: { type: 'custom', role }, sql: safeSql`select 1 as ok;` })
    )

    expect(await callsOf(db)).toHaveLength(0)
  })
})

describe('databases without a usable hook impersonate as before', () => {
  withTestDatabase('no hook configured', async (db) => {
    const role = uniqueRole()
    await setupHook(db, role)

    const rows = await db.executeQuery<{ ok: number }[]>(impersonate(role))

    expect(rows).toEqual([{ ok: 1 }])
    expect(await callsOf(db)).toHaveLength(0)
  })

  withTestDatabase('hook name that does not resolve to a function', async (db) => {
    const role = uniqueRole()
    await setupHook(db, role)
    await db.executeQuery(
      `alter database ${db.dbName} set pgrst.db_pre_request = 'public.no_such_function';`
    )

    const rows = await db.executeQuery<{ ok: number }[]>(impersonate(role))

    expect(rows).toEqual([{ ok: 1 }])
  })

  withTestDatabase('hook name that cannot be parsed at all', async (db) => {
    const role = uniqueRole()
    await setupHook(db, role)
    // to_regprocedure() returns null for a name it cannot find, but raises "improper qualified
    // name" for one with more than two dotted parts -- which must not fail the user's query.
    await db.executeQuery(`alter database ${db.dbName} set pgrst.db_pre_request = 'a.b.c.d';`)

    const rows = await db.executeQuery<{ ok: number }[]>(impersonate(role))

    expect(rows).toEqual([{ ok: 1 }])
  })

  withTestDatabase('hook that takes arguments', async (db) => {
    const role = uniqueRole()
    await setupHook(db, role)
    await db.executeQuery(`
      create function public.hook_with_args(x int) returns void language sql as $fn$ select $fn$;
      alter database ${db.dbName} set pgrst.db_pre_request = 'public.hook_with_args';
    `)

    // PostgREST only ever calls the hook with no arguments, so an arity mismatch is a
    // misconfiguration to ignore rather than an error to raise.
    const rows = await db.executeQuery<{ ok: number }[]>(impersonate(role))

    expect(rows).toEqual([{ ok: 1 }])
  })
})

describe('getRoleImpersonationLineOffset', () => {
  const userSql = safeSql`select * from colors;`

  const offsetOf = (sql: string) => {
    const lines = sql.split('\n')
    return lines.findIndex((line) => line.includes('select * from colors;'))
  }

  // The offset has to be measured, not remembered: it is the number of lines between the start of
  // the statement Postgres reports `LINE n:` against and the first line the user wrote.
  test('matches where the wrapped SQL actually puts the user query, for postgrest roles', () => {
    const sql = getImpersonationSQL({
      role: { type: 'postgrest', role: 'anon' },
      unexpiredClaims: { role: 'anon' },
      sql: userSql,
    })

    expect(getRoleImpersonationLineOffset(sql)).toBe(offsetOf(sql))
  })

  test('matches where the wrapped SQL actually puts the user query, for custom roles', () => {
    const sql = getImpersonationSQL({ role: { type: 'custom', role: 'my_role' }, sql: userSql })

    expect(getRoleImpersonationLineOffset(sql)).toBe(offsetOf(sql))
  })

  test('is zero for SQL that was never wrapped', () => {
    expect(getRoleImpersonationLineOffset(userSql)).toBe(0)
  })
})
