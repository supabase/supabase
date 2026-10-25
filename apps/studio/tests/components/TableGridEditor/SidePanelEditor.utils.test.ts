import { PGlite } from '@electric-sql/pglite'
import type { ForeignKey } from '@supabase/pg-meta'
import { HttpResponse } from 'msw'
import { toast } from 'sonner'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import { z } from 'zod'

import {
  generateColumnField,
  generateColumnFieldFromPGColumn,
} from '@/components/interfaces/TableGridEditor/SidePanelEditor/ColumnEditor/ColumnEditor.utils'
import {
  createColumn,
  updateColumn,
  updateTable,
} from '@/components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor.utils'
import type { ForeignKeyConstraint } from '@/data/database/foreign-key-constraints-query'
import { getQueryClient } from '@/data/query-client'
import { tableKeys } from '@/data/tables/keys'
import { getTable, type RetrieveTableResult } from '@/data/tables/table-retrieve-query'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const connection = { projectRef: 'default', connectionString: 'test-connection' }
const primaryKey = { id: 1, name: 'items_pkey', type: 'p' }
const foreignKey: ForeignKey = {
  id: 2,
  name: 'items_parent_id_fkey',
  schema: 'public',
  table: 'parent',
  columns: [{ source: 'parent_id', target: 'id' }],
  deletionAction: 'a',
  updateAction: 'a',
}
const existingForeignKey: ForeignKeyConstraint = {
  id: 2,
  constraint_name: 'items_parent_id_fkey',
  source_id: 1,
  source_schema: 'public',
  source_table: 'items',
  source_columns: ['parent_id'],
  target_id: 2,
  target_schema: 'public',
  target_table: 'parent',
  target_columns: ['id'],
  deletion_action: 'a',
  update_action: 'a',
}

describe('Table Editor transactional schema changes', () => {
  let db: PGlite
  let table: RetrieveTableResult
  let requests: Array<{ query: string; connectionString: string | null }>
  let databaseErrors: string[]
  let beforeExecute: (() => Promise<void>) | undefined
  const track = vi.fn()
  const queryClient = getQueryClient()

  beforeAll(async () => {
    // Run the actual SQL in embedded PostgreSQL, without requiring Docker for Studio unit tests.
    db = await PGlite.create()
  })

  beforeEach(async () => {
    queryClient.clear()
    track.mockClear()
    vi.spyOn(toast, 'success').mockImplementation(() => 'success-toast')
    vi.spyOn(toast, 'error').mockImplementation(() => 'error-toast')
    requests = []
    databaseErrors = []
    beforeExecute = undefined
    await db.exec(`
      DROP SCHEMA IF EXISTS edited CASCADE;
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      CREATE SCHEMA edited;
      CREATE TABLE public.parent (id integer PRIMARY KEY);
      CREATE TABLE public.other_parent (id integer PRIMARY KEY);
      INSERT INTO public.parent VALUES (1);
      INSERT INTO public.other_parent VALUES (2);
      CREATE TABLE public.items (
        id integer PRIMARY KEY,
        value integer NOT NULL,
        parent_id integer REFERENCES public.parent(id),
        obsolete text
      );
      INSERT INTO public.items VALUES (1, 7, 1, 'first'), (2, 7, 1, 'second');
    `)

    // Keep Studio's real executeSql/fetcher, SQL builders, and cache behavior. Only the
    // HTTP boundary is replaced; PostgreSQL decides whether each constraint succeeds.
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const { query } = z.object({ query: z.string() }).parse(await request.json())
        requests.push({ query, connectionString: request.headers.get('x-connection-encrypted') })
        await beforeExecute?.()
        try {
          const results = await db.exec(query)
          const rows = z
            .array(z.record(z.unknown()))
            .parse(results.findLast((result) => result.rows.length > 0)?.rows ?? [])
          return HttpResponse.json<Record<string, unknown>[]>(rows)
        } catch (error) {
          const { message, code } = z.object({ message: z.string(), code: z.string() }).parse(error)
          databaseErrors.push(code)
          // Release the failed transaction before reusing this connection.
          // This cannot undo any premature COMMIT in the SQL under test.
          await db.exec('ROLLBACK')
          return HttpResponse.json<APIErrorBody>({ message }, { status: 400 })
        }
      },
    })
    table = await getTable({ ...connection, schema: 'public', name: 'items' })
    requests = []
  })

  afterEach(() => {
    queryClient.clear()
    vi.restoreAllMocks()
  })

  afterAll(async () => {
    await db?.close()
  })

  const getColumn = (name: string) => {
    const column = table.columns?.find((column) => column.name === name)
    if (!column) throw new Error(`Missing fixture column: ${name}`)
    return column
  }

  const snapshot = async () => {
    const metadata = await db.query(`
      SELECT n.nspname, c.relname, c.relrowsecurity, obj_description(c.oid) AS comment
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.oid = 'public.items'::regclass
    `)
    const columns = await db.query(`
      SELECT a.attname, a.atttypid, a.attnotnull, pg_get_expr(d.adbin, d.adrelid) AS default_value
      FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
      WHERE a.attrelid = 'public.items'::regclass AND a.attnum > 0 AND NOT a.attisdropped
      ORDER BY a.attnum
    `)
    const constraints = await db.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) AS definition
      FROM pg_constraint WHERE conrelid = 'public.items'::regclass ORDER BY conname
    `)
    const rows = await db.query('SELECT * FROM public.items ORDER BY id')
    return [metadata.rows, columns.rows, constraints.rows, rows.rows]
  }

  const expectSingleTransaction = () => {
    const mutations = requests.filter(({ query }) => /^BEGIN;/i.test(query.trim()))
    expect(mutations).toHaveLength(1)
    const [{ query, connectionString }] = mutations
    expect(connectionString).toBe(connection.connectionString)
    expect(query.trim()).toMatch(/;\s*COMMIT;$/)
    expect(query.match(/\bBEGIN;/gi)).toHaveLength(1)
    expect(query.match(/\bCOMMIT;/gi)).toHaveLength(1)
  }

  const expectRollback = async (before: Awaited<ReturnType<typeof snapshot>>, code: string) => {
    expect(databaseErrors).toEqual([code])
    expect(await snapshot()).toEqual(before)
    expectSingleTransaction()
    // No follow-up mutation, metadata fetch, or success notification after the failed request.
    expect(requests).toHaveLength(1)
    expect(toast.success).not.toHaveBeenCalled()
  }

  test('createColumn restores the old primary key and removes the new column when PK creation fails', async () => {
    const before = await snapshot()
    const result = await createColumn({
      ...connection,
      selectedTable: table,
      primaryKey,
      payload: {
        schema: 'public',
        table: 'items',
        name: 'new_id',
        type: { name: 'int4' },
        isPrimaryKey: true,
      },
    })
    expect(result.error).toBeDefined()
    expect(toast.error).toHaveBeenCalledOnce()
    await expectRollback(before, '23502') // Existing rows have NULL in the new PK column.
  })

  test.each([true, false])('createColumn with a foreign key (invalid: %s)', async (isInvalid) => {
    const before = await snapshot()
    const result = await createColumn({
      ...connection,
      selectedTable: table,
      primaryKey,
      payload: {
        schema: 'public',
        table: 'items',
        name: 'new_id',
        type: { name: 'int4' },
        defaultValue: isInvalid ? 99 : 1,
        isPrimaryKey: true,
      },
      foreignKeyRelations: [
        { ...foreignKey, id: 'new', columns: [{ source: 'new_id', target: 'id' }] },
      ],
    })
    if (isInvalid) {
      expect(result.error).toBeDefined()
      await expectRollback(before, '23503')
    } else {
      expect(result.error).toBeUndefined()
      expectSingleTransaction()
      expect(requests).toHaveLength(1)
      expect(toast.success).toHaveBeenCalledOnce()
      const updated = await getTable({ ...connection, schema: 'public', name: 'items' })
      expect(updated.primary_keys.map(({ name }) => name)).toEqual(['id', 'new_id'])
      expect(updated.relationships).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ source_column_name: 'new_id', target_table_name: 'parent' }),
        ])
      )
    }
  })

  test('updateColumn rolls back a rename and restores the composite PK when its replacement fails', async () => {
    await db.exec(
      'ALTER TABLE public.items DROP CONSTRAINT items_pkey, ADD PRIMARY KEY (id, parent_id)'
    )
    table = await getTable({ ...connection, schema: 'public', name: 'items' })
    requests = []
    const before = await snapshot()
    const result = await updateColumn({
      ...connection,
      selectedTable: table,
      primaryKey,
      originalColumn: getColumn('id'),
      payload: { name: 'item_id', isPrimaryKey: false },
    })
    expect(result?.error).toBeDefined()
    await expectRollback(before, '23505') // parent_id alone is not unique.
  })

  test.each([false, true])(
    'updateColumn preserves a renamed primary key without duplicating it (skipPKCreation: %s)',
    async (skipPKCreation) => {
      const result = await updateColumn({
        ...connection,
        selectedTable: table,
        primaryKey,
        originalColumn: getColumn('id'),
        payload: { name: 'item_id', isPrimaryKey: true },
        skipPKCreation,
        skipSuccessMessage: true,
      })
      expect(result).toBeUndefined()
      expect(databaseErrors).toEqual([])
      expectSingleTransaction()
      expect(requests).toHaveLength(1)
      expect(toast.success).not.toHaveBeenCalled()
      if (skipPKCreation) expect(requests[0].query).not.toContain('PRIMARY KEY')
      const updated = await getTable({ ...connection, schema: 'public', name: 'items' })
      expect(updated.primary_keys.map(({ name }) => name)).toEqual(['item_id'])
    }
  )

  test.each([true, false])(
    'updateColumn replaces a foreign key after renaming its column (invalid: %s)',
    async (isInvalid) => {
      const before = await snapshot()
      const result = await updateColumn({
        ...connection,
        selectedTable: table,
        originalColumn: getColumn('parent_id'),
        payload: { name: 'owner_id', defaultValue: 1 },
        existingForeignKeyRelations: [existingForeignKey],
        foreignKeyRelations: [
          {
            ...foreignKey,
            table: isInvalid ? 'other_parent' : 'parent',
            columns: [{ source: 'owner_id', target: 'id' }],
            deletionAction: 'c',
          },
        ],
      })
      if (isInvalid) {
        expect(result?.error).toBeDefined()
        await expectRollback(before, '23503')
      } else {
        expect(result).toBeUndefined()
        expectSingleTransaction()
        expect(requests).toHaveLength(1)
        expect(toast.success).toHaveBeenCalledOnce()
        expect((await db.query('SELECT owner_id FROM public.items')).rows).toEqual([
          { owner_id: 1 },
          { owner_id: 1 },
        ])
        expect(
          (
            await db.query(
              "SELECT confdeltype FROM pg_constraint WHERE conrelid = 'public.items'::regclass AND contype = 'f'"
            )
          ).rows
        ).toEqual([{ confdeltype: 'c' }])
      }
    }
  )

  const tableUpdate = (failure?: 'primary' | 'foreign') => ({
    ...connection,
    toastId: 'table-update',
    table,
    primaryKey,
    track,
    payload: { name: 'renamed_items', schema: 'edited', comment: 'updated', rls_enabled: true },
    columns: [
      ...(table.columns ?? [])
        .filter(({ name }) => name !== 'obsolete')
        .map((column) => ({
          ...generateColumnFieldFromPGColumn(column, table, []),
          name: column.name === 'id' ? 'item_id' : column.name,
          isPrimaryKey: failure === 'primary' ? column.name === 'value' : column.name === 'id',
        })),
      { ...generateColumnField({ name: 'added', format: 'int4' }), defaultValue: '1' },
    ],
    foreignKeyRelations: [
      {
        ...foreignKey,
        table: failure === 'foreign' ? 'other_parent' : 'parent',
        deletionAction: 'c',
      },
    ],
    existingForeignKeyRelations: [existingForeignKey],
  })

  test.each(['primary', 'foreign'] as const)(
    'updateTable rolls back table, column, and constraint changes when the %s key fails',
    async (failure) => {
      const before = await snapshot()
      const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
      await expect(updateTable(tableUpdate(failure))).rejects.toThrow()
      await expectRollback(before, failure === 'primary' ? '23505' : '23503')
      expect(invalidate).not.toHaveBeenCalled()
      expect(track).not.toHaveBeenCalled()
      expect((await db.query("SELECT to_regclass('edited.renamed_items') AS target")).rows).toEqual(
        [{ target: null }]
      )
    }
  )

  test('updateTable commits all changes before refreshing metadata and tracking success', async () => {
    const oldListKey = tableKeys.infiniteListPrefix(connection.projectRef, 'public')
    const newListKey = tableKeys.infiniteListPrefix(connection.projectRef, 'edited')
    queryClient.setQueryData(oldListKey, [])
    queryClient.setQueryData(newListKey, [])
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const gate = Promise.withResolvers<void>()
    beforeExecute = () => gate.promise
    const operation = updateTable(tableUpdate())
    try {
      await vi.waitFor(() => expect(requests).toHaveLength(1))
      expect(invalidate).not.toHaveBeenCalled()
      expect(track).not.toHaveBeenCalled()
    } finally {
      gate.resolve()
    }
    const result = await operation
    expect(databaseErrors).toEqual([])
    expectSingleTransaction()
    expect(result).toMatchObject({
      table: { name: 'renamed_items', schema: 'edited', rls_enabled: true },
      hasError: false,
    })
    expect(queryClient.getQueryState(oldListKey)?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(newListKey)?.isInvalidated).toBe(true)
    expect(track).toHaveBeenCalledOnce()
    expect(
      (
        await db.query(
          'SELECT item_id, value, parent_id, added FROM edited.renamed_items ORDER BY item_id'
        )
      ).rows
    ).toEqual([
      { item_id: 1, value: 7, parent_id: 1, added: 1 },
      { item_id: 2, value: 7, parent_id: 1, added: 1 },
    ])
    expect(
      (
        await db.query(
          "SELECT column_name FROM information_schema.columns WHERE table_schema = 'edited' AND table_name = 'renamed_items' AND column_name = 'obsolete'"
        )
      ).rows
    ).toEqual([])
  })
})
