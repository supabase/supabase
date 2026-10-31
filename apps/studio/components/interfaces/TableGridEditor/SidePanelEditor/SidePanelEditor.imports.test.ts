// @vitest-environment jsdom

import { safeSql } from '@supabase/pg-meta'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'
import { z } from 'zod'

import {
  executeImportInsertBatch,
  IMPORT_SQL_SIZE_LIMIT,
  insertRowsViaSpreadsheet,
  insertTableRows,
} from './SidePanelEditor.utils'
import type { RetrieveTableResult } from '@/data/tables/table-retrieve-query'
import type { RoleImpersonationState } from '@/lib/role-impersonation'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const table: RetrieveTableResult = {
  id: 1,
  name: 'import_test',
  schema: 'public',
  rls_enabled: true,
  rls_forced: false,
  replica_identity: 'DEFAULT',
  bytes: 0,
  size: '0 bytes',
  live_rows_estimate: 0,
  dead_rows_estimate: 0,
  comment: null,
  primary_keys: [],
  relationships: [],
}

const roleImpersonationState: RoleImpersonationState = {
  role: { type: 'postgrest', role: 'anon' },
  claims: { role: 'anon', exp: 0, iat: 0, iss: 'supabase', ref: 'default' },
}

describe('CSV imports with role impersonation', () => {
  test('import timeout reaches and aborts the real SQL request', async () => {
    let requestSignal: AbortSignal | undefined
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        requestSignal = request.signal
        await new Promise<void>((resolve) => {
          if (request.signal.aborted) {
            resolve()
          } else {
            request.signal.addEventListener('abort', () => resolve(), { once: true })
          }
        })
        return HttpResponse.json<unknown[]>([])
      },
    })

    await expect(
      executeImportInsertBatch({
        projectRef: 'default',
        connectionString: undefined,
        sql: safeSql`select 1`,
        timeoutMs: 100,
      })
    ).rejects.toMatchObject({ name: 'TimeoutError' })
    expect(requestSignal?.aborted).toBe(true)
  })

  test.each(['uploaded', 'pasted'])(
    '%s CSV wraps large-row batches in the selected role before updating sequences',
    async (source) => {
      const queries: string[] = []
      addAPIMock({
        method: 'post',
        path: '/platform/pg-meta/:ref/query',
        response: async ({ request }) => {
          const { query } = z.object({ query: z.string() }).parse(await request.json())
          queries.push(query)
          return HttpResponse.json<unknown[]>([])
        },
      })

      const rows = Array.from({ length: 3 }, (_, index) => ({
        id: String(index + 1),
        name: 'x'.repeat(400_000),
      }))
      const onProgressUpdate = vi.fn()
      const options = {
        projectRef: 'default',
        connectionString: undefined,
        table: {
          ...table,
          columns: [
            {
              id: '1.1',
              table_id: table.id,
              schema: table.schema,
              table: table.name,
              name: 'id',
              ordinal_position: 1,
              data_type: 'bigint',
              format: 'int8',
              is_identity: true,
              identity_generation: 'BY DEFAULT',
              is_generated: false,
              is_nullable: false,
              is_updatable: true,
              is_unique: true,
              check: null,
              default_value: null,
              enums: [],
              comment: null,
            },
          ],
        },
        selectedHeaders: ['id', 'name'],
        roleImpersonationState,
        onProgressUpdate,
      }
      const result =
        source === 'uploaded'
          ? await insertRowsViaSpreadsheet({
              ...options,
              file: new File(
                ['id,name\n', rows.map((row) => `${row.id},${row.name}`).join('\n')],
                'import.csv',
                {
                  type: 'text/csv',
                }
              ),
            })
          : await insertTableRows({ ...options, rows })

      expect(result.error).toBeUndefined()
      const insertQueries = queries.slice(0, -1)
      expect(insertQueries.length).toBeGreaterThan(1)
      for (const query of insertQueries) {
        expect(query).toContain("set_config('role', 'anon', true)")
        expect(query).toContain('request.jwt.claims')
        expect(query.includes('insert into public.import_test')).toBe(true)
        expect(new Blob([query]).size).toBeLessThanOrEqual(IMPORT_SQL_SIZE_LIMIT)
      }
      expect(queries.at(-1)).toContain('SELECT setval(')
      expect(queries.at(-1)).toContain("pg_get_serial_sequence('public.import_test', 'id')")
      expect(onProgressUpdate).toHaveBeenLastCalledWith(100)
    }
  )

  test('import batch errors retain upstream role impersonation line-number handling', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () =>
        HttpResponse.json<APIErrorBody & { error: string; formattedError: string }>(
          {
            message: 'permission denied',
            error: 'LINE 12: INSERT INTO import_test',
            formattedError: 'LINE 12: INSERT INTO import_test',
          },
          { status: 403 }
        ),
    })

    await expect(
      executeImportInsertBatch({
        projectRef: 'default',
        connectionString: undefined,
        sql: safeSql`select 1`,
        roleImpersonationState,
      })
    ).rejects.toMatchObject({ formattedError: 'LINE 1: INSERT INTO import_test' })
  })
})
