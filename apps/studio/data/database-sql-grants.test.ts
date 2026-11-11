import { safeSql } from '@supabase/pg-meta'
import type { PGTrigger, PGTriggerCreate } from '@supabase/pg-meta'
import type { PGFunctionCreate } from '@supabase/pg-meta/src/pg-meta-functions'
import { QueryClient } from '@tanstack/react-query'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { createDatabaseEventTrigger } from './database-event-triggers/database-event-trigger-create-mutation'
import { deleteDatabaseEventTrigger } from './database-event-triggers/database-event-trigger-delete-mutation'
import {
  databaseEventTriggersQueryOptions,
  type DatabaseEventTrigger,
} from './database-event-triggers/database-event-triggers-query'
import { createDatabaseFunction } from './database-functions/database-functions-create-mutation'
import { deleteDatabaseFunction } from './database-functions/database-functions-delete-mutation'
import {
  databaseFunctionsQueryOptions,
  type SavedDatabaseFunction,
} from './database-functions/database-functions-query'
import { updateDatabaseFunction } from './database-functions/database-functions-update-mutation'
import { createDatabaseTrigger } from './database-triggers/database-trigger-create-mutation'
import { deleteDatabaseTrigger } from './database-triggers/database-trigger-delete-mutation'
import { updateDatabaseTrigger as updateDatabaseTriggerTransaction } from './database-triggers/database-trigger-update-transaction-mutation'
import {
  databaseHooksQueryOptions,
  databaseTriggersQueryOptions,
} from './database-triggers/database-triggers-query'
import { addAPIMock } from '@/tests/lib/msw'
import { testGrant } from '@/tests/lib/test-grant'

const projectRef = 'proj'
const PG_META_QUERY = 'POST /platform/pg-meta/{ref}/query'
const readGrant = testGrant(PG_META_QUERY, { variant: 'read', projectRef })
const writeGrant = testGrant(PG_META_QUERY, { variant: 'write', projectRef })

/** Mocks the pg-meta query endpoint and records each executed SQL statement. */
function captureQueries(rows: unknown[] = []) {
  const onQuery = vi.fn<(query: string) => void>()
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: async ({ request }) => {
      const body = (await request.json()) as { query: string }
      onQuery(body.query)
      return HttpResponse.json(rows)
    },
  })
  return onQuery
}

describe('database function queries', () => {
  it('lists functions through the read grant', async () => {
    const onQuery = captureQueries([])

    await new QueryClient().fetchQuery(
      databaseFunctionsQueryOptions({ projectRef, grant: readGrant })
    )

    expect(onQuery).toHaveBeenCalledTimes(1)
  })

  it('stays disabled without a grant', () => {
    expect(databaseFunctionsQueryOptions({ projectRef }).enabled).toBe(false)
  })
})

describe('database function mutations', () => {
  const func = {
    id: 1,
    name: 'fn',
    schema: 'public',
    type: 'function',
    argument_types: '',
    identity_argument_types: '',
    return_type: 'void',
    config_params: null,
    complete_statement: 'create function fn() returns void as $$ $$ language sql',
  } as unknown as SavedDatabaseFunction

  it('creates, updates and deletes through the write grant', async () => {
    const onQuery = captureQueries([])

    await createDatabaseFunction({
      projectRef,
      grant: writeGrant,
      sqlOrigin: 'studio',
      payload: {
        name: 'fn',
        definition: safeSql`select 1`,
        args: [],
        behavior: 'VOLATILE',
        config_params: {},
        language: 'sql',
        return_type: safeSql`void`,
        schema: 'public',
        security_definer: false,
        type: 'function',
      } as unknown as PGFunctionCreate,
    })
    await updateDatabaseFunction({
      projectRef,
      grant: writeGrant,
      func,
      sqlOrigin: 'studio',
      payload: { name: 'fn2' },
    })
    await deleteDatabaseFunction({ projectRef, grant: writeGrant, func })

    expect(onQuery).toHaveBeenCalledTimes(3)
  })
})

describe('database trigger queries', () => {
  it('lists triggers and webhooks through the read grant', async () => {
    const onQuery = captureQueries([])
    const queryClient = new QueryClient()

    await queryClient.fetchQuery(databaseTriggersQueryOptions({ projectRef, grant: readGrant }))
    await queryClient.fetchQuery(databaseHooksQueryOptions({ projectRef, grant: readGrant }))

    expect(onQuery).toHaveBeenCalledTimes(2)
  })

  it('stays disabled without a grant', () => {
    expect(databaseTriggersQueryOptions({ projectRef }).enabled).toBe(false)
    expect(databaseHooksQueryOptions({ projectRef }).enabled).toBe(false)
  })

  it('keeps only webhook triggers for the webhooks query', async () => {
    captureQueries([
      { id: 1, function_schema: 'supabase_functions', schema: 'public', function_args: ['a'] },
      { id: 2, function_schema: 'public', schema: 'public', function_args: [] },
    ])
    const hooks = await new QueryClient().fetchQuery(
      databaseHooksQueryOptions({ projectRef, grant: readGrant })
    )
    const options = databaseHooksQueryOptions({ projectRef, grant: readGrant })
    const selected = options.select?.(hooks as PGTrigger[])

    expect(selected?.map((t) => t.id)).toEqual([1])
  })
})

describe('database trigger mutations', () => {
  it('creates, deletes and updates through the write grant', async () => {
    const onQuery = captureQueries([])

    await createDatabaseTrigger({
      projectRef,
      grant: writeGrant,
      payload: {
        name: 't',
        table: 'tbl',
        schema: 'public',
        function_schema: 'public',
        function_name: 'fn',
        function_args: [],
        activation: 'AFTER',
        events: ['INSERT'],
        orientation: 'ROW',
      } as unknown as PGTriggerCreate,
    })
    await deleteDatabaseTrigger({
      projectRef,
      grant: writeGrant,
      trigger: { id: 1, name: 't', schema: 'public', table: 'tbl' },
    })
    await updateDatabaseTriggerTransaction({
      projectRef,
      grant: writeGrant,
      originalTrigger: {
        id: 1,
        name: 't',
        schema: 'public',
        table: 'tbl',
        function_schema: 'public',
        function_name: 'fn',
        function_args: [],
        activation: 'AFTER',
        events: ['INSERT'],
        orientation: 'ROW',
        enabled_mode: 'ORIGIN',
        condition: null,
      } as unknown as PGTrigger,
      updatedTrigger: {
        name: 't',
        table: 'tbl',
        schema: 'public',
        function_schema: 'public',
        function_name: 'fn',
        function_args: [],
        activation: 'AFTER',
        events: [safeSql`INSERT`],
        orientation: 'ROW',
        enabled_mode: 'ORIGIN',
      } as unknown as Parameters<typeof updateDatabaseTriggerTransaction>[0]['updatedTrigger'],
    })

    expect(onQuery).toHaveBeenCalledTimes(3)
  })
})

describe('database event triggers', () => {
  it('lists event triggers through the read grant', async () => {
    const onQuery = captureQueries([])

    await new QueryClient().fetchQuery(
      databaseEventTriggersQueryOptions({ projectRef, grant: readGrant })
    )

    expect(onQuery).toHaveBeenCalledTimes(1)
  })

  it('stays disabled without a grant', () => {
    expect(databaseEventTriggersQueryOptions({ projectRef }).enabled).toBe(false)
  })

  it('creates and deletes through the write grant', async () => {
    const onQuery = captureQueries([])

    await createDatabaseEventTrigger({
      projectRef,
      grant: writeGrant,
      sql: safeSql`create event trigger t on ddl_command_end execute function f()`,
    })
    await deleteDatabaseEventTrigger({
      projectRef,
      grant: writeGrant,
      trigger: { oid: 1, name: 't' } as DatabaseEventTrigger,
    })

    expect(onQuery).toHaveBeenCalledTimes(2)
    expect(onQuery.mock.calls[1][0]).toContain('DROP EVENT TRIGGER IF EXISTS')
  })
})
