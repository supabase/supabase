import { HttpResponse } from 'msw'
import { afterEach, expect, test, vi } from 'vitest'
import { z } from 'zod'

import { createTable } from './SidePanelEditor.utils'
import { importTable } from './SpreadsheetImport/SpreadsheetImport.fixtures'
import { getQueryClient } from '@/data/query-client'
import { addAPIMock } from '@/tests/lib/msw'

afterEach(() => getQueryClient().clear())

test.each(['upload', 'paste'])(
  'new-table %s retains the created table and reports an import error',
  async (method) => {
    const queries: string[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const { query } = z.object({ query: z.string() }).parse(await request.json())
        queries.push(query)
        if (query.includes('jsonb_populate_recordset')) {
          return HttpResponse.json(
            { message: 'invalid input syntax for type integer' },
            { status: 400 }
          )
        }
        if (new URL(request.url).searchParams.get('key')?.includes('projects-default-table-')) {
          return HttpResponse.json([importTable])
        }
        return HttpResponse.json([])
      },
    })
    const result = await createTable({
      projectRef: 'default',
      toastId: 'import-test',
      payload: { name: 'imports', schema: 'public' },
      columns: [],
      foreignKeyRelations: [],
      isRLSEnabled: false,
      track: vi.fn(),
      importContent: {
        file: method === 'upload' ? new File(['id\nbad\n'], 'bad.csv') : undefined,
        rows: [{ id: 'bad' }],
        rowCount: 1,
        headers: ['id'],
        selectedHeaders: ['id'],
        columnTypeMap: { id: 'text' },
        // The existing-table option must never affect new-table creation.
        skipConflictingRows: true,
      },
    })
    expect(result.table).toEqual(importTable)
    expect(result.importResult).toMatchObject({
      status: 'error',
      phase: 'insert',
      insertedCount: 0,
      error: { message: 'invalid input syntax for type integer' },
    })
    expect(queries.some((query) => query.includes('on conflict do nothing'))).toBe(false)
  },
  15000
)
