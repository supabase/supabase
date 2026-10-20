import { waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { z } from 'zod'

import { identityColumn, importTable } from './SpreadsheetImport.fixtures'
import { getImportResultMessage } from './SpreadsheetImport.utils'
import { insertRowsViaSpreadsheet, insertTableRows } from './SpreadsheetImportInsert.utils'
import { addAPIMock } from '@/tests/lib/msw'

const options = {
  projectRef: 'default',
  connectionString: undefined,
  table: importTable,
  selectedHeaders: ['id'],
  onProgressUpdate: vi.fn(),
}
const querySchema = z.object({ query: z.string() })

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('spreadsheet insert execution', () => {
  test.each(['upload', 'paste'])(
    '%s uses the same counted, impersonated skip query',
    async (method) => {
      const queries: string[] = []
      addAPIMock({
        method: 'post',
        path: '/platform/pg-meta/:ref/query',
        response: async ({ request }) => {
          queries.push(querySchema.parse(await request.json()).query)
          return HttpResponse.json([{ inserted_count: '1' }])
        },
      })
      const settings = {
        ...options,
        skipConflictingRows: true,
        roleImpersonationState: {
          claims: undefined,
          role: { type: 'custom' as const, role: 'importer' },
        },
      }
      const result =
        method === 'upload'
          ? await insertRowsViaSpreadsheet({
              ...settings,
              file: new File(['id\n1\n1\n'], 'test.csv', { type: 'text/csv' }),
            })
          : await insertTableRows({ ...settings, rows: [{ id: 1 }, { id: 1 }] })
      expect(result).toEqual({ status: 'success', insertedCount: 1, skippedCount: 1 })
      expect(queries).toHaveLength(1)
      expect(queries[0]).toContain('on conflict do nothing')
      expect(queries[0]).toContain('returning 1')
      expect(queries[0]).toContain('importer')
      expect(options.onProgressUpdate).toHaveBeenLastCalledWith(100)
    }
  )

  test('keeps default conflict handling and reports database errors without retry', async () => {
    const queries: string[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        queries.push(querySchema.parse(await request.json()).query)
        return HttpResponse.json({ message: 'duplicate key' }, { status: 400 })
      },
    })
    const result = await insertTableRows({ ...options, rows: [{ id: 1 }] })
    expect(result).toMatchObject({
      status: 'error',
      outcome: 'known',
      insertedCount: 0,
      skippedCount: 0,
    })
    expect(queries).toHaveLength(1)
    expect(queries[0]).not.toContain('on conflict')
  })

  test('awaits all active pasted batches after a failure and does not schedule more', async () => {
    let requests = 0
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () => {
        requests++
        return requests === 1
          ? HttpResponse.json({ message: 'foreign key violation' }, { status: 400 })
          : HttpResponse.json([{ inserted_count: 1000 }])
      },
    })
    const result = await insertTableRows({
      ...options,
      rows: Array.from({ length: 11000 }, (_, id) => ({ id })),
    })
    expect(requests).toBe(10)
    expect(result).toMatchObject({
      status: 'error',
      insertedCount: 9000,
      skippedCount: 0,
      outcome: 'known',
    })
    expect(options.onProgressUpdate).not.toHaveBeenCalledWith(100)
  })

  test('does not resolve a pending insert after the old 30-second timeout', async () => {
    const response = Promise.withResolvers<void>()
    let hasRequest = false
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async () => {
        hasRequest = true
        await response.promise
        return HttpResponse.json([{ inserted_count: 1 }])
      },
    })
    let isComplete = false
    const pending = insertTableRows({ ...options, rows: [{ id: 1 }] }).then((result) => {
      isComplete = true
      return result
    })
    await waitFor(() => expect(hasRequest).toBe(true))
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    await vi.advanceTimersByTimeAsync(35000)
    expect(isComplete).toBe(false)
    expect(options.onProgressUpdate).not.toHaveBeenCalledWith(100)
    vi.useRealTimers()
    response.resolve()
    expect(await pending).toMatchObject({ status: 'success', insertedCount: 1 })
  })

  test('retries rate limits without counting a batch twice', async () => {
    let requests = 0
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () => {
        requests++
        if (requests === 1)
          return HttpResponse.json(
            { message: 'Rate limited' },
            { status: 429, headers: { 'Retry-After': '0' } }
          )
        return HttpResponse.json([{ inserted_count: 1 }])
      },
    })
    expect(await insertTableRows({ ...options, rows: [{ id: 1 }] })).toEqual({
      status: 'success',
      insertedCount: 1,
      skippedCount: 0,
    })
    expect(requests).toBe(2)
  })

  test.each(
    [[], [{ inserted_count: -1 }], [{ inserted_count: 2 }], [{ inserted_count: 'invalid' }]].map(
      (response) => ({ response })
    )
  )('does not invent counts for a malformed database result: %j', async ({ response }) => {
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () => HttpResponse.json(response),
    })
    const result = await insertTableRows({ ...options, rows: [{ id: 1 }] })
    expect(result).toMatchObject({
      status: 'error',
      outcome: 'unknown',
      insertedCount: 0,
      skippedCount: 0,
    })
    expect(getImportResultMessage(result)).toContain('could not be confirmed')
  })

  test('does not retry an ambiguous network failure', async () => {
    let requests = 0
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () => {
        requests++
        return HttpResponse.error()
      },
    })
    expect(await insertTableRows({ ...options, rows: [{ id: 1 }] })).toMatchObject({
      status: 'error',
      outcome: 'unknown',
    })
    expect(requests).toBe(1)
  })

  test('updates sequences after an unknown outcome, since the batch may have committed', async () => {
    const queries: string[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const { query } = querySchema.parse(await request.json())
        queries.push(query)
        if (query.includes('setval(')) return HttpResponse.json([])
        return HttpResponse.json({ message: 'Gateway timeout' }, { status: 504 })
      },
    })
    const result = await insertTableRows({
      ...options,
      table: { ...importTable, columns: [identityColumn] },
      rows: [{ id: 1 }],
    })
    expect(result).toMatchObject({ status: 'error', outcome: 'unknown', insertedCount: 0 })
    expect(result).not.toHaveProperty('sequenceError')
    expect(queries).toHaveLength(2)
    expect(queries[1]).toContain('setval(')
  })

  test('awaits sequence maintenance, including after partial insert failure', async () => {
    const queries: string[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const { query } = querySchema.parse(await request.json())
        queries.push(query)
        if (query.includes('setval('))
          return HttpResponse.json({ message: 'Sequence permission denied' }, { status: 403 })
        if (queries.length === 1)
          return HttpResponse.json({ message: 'check constraint' }, { status: 400 })
        return HttpResponse.json([{ inserted_count: 1000 }])
      },
    })
    const result = await insertTableRows({
      ...options,
      table: { ...importTable, columns: [identityColumn] },
      rows: Array.from({ length: 2000 }, (_, id) => ({ id })),
    })
    expect(result).toMatchObject({
      status: 'error',
      phase: 'insert',
      insertedCount: 1000,
      error: { message: 'check constraint' },
      sequenceError: { message: 'Sequence permission denied' },
    })
    expect(queries).toHaveLength(3)
    expect(queries[2]).toContain('setval(')
    expect(getImportResultMessage(result)).toContain('identity sequence')
  })

  test('reports sequence failure separately from successful insertion', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const { query } = querySchema.parse(await request.json())
        if (query.includes('setval('))
          return HttpResponse.json({ message: 'Sequence failed' }, { status: 400 })
        return HttpResponse.json([{ inserted_count: 1 }])
      },
    })
    const result = await insertTableRows({
      ...options,
      table: { ...importTable, columns: [identityColumn] },
      rows: [{ id: 1 }],
    })
    expect(result).toMatchObject({ status: 'error', phase: 'sequence', insertedCount: 1 })
  })

  test('an all-skipped import completes without rewinding identity sequences', async () => {
    let requests = 0
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () => {
        requests++
        return HttpResponse.json([{ inserted_count: 0 }])
      },
    })
    expect(
      await insertTableRows({
        ...options,
        table: { ...importTable, columns: [identityColumn] },
        skipConflictingRows: true,
        rows: [{ id: 1 }],
      })
    ).toEqual({ status: 'success', insertedCount: 0, skippedCount: 1 })
    expect(requests).toBe(1)
  })

  test('empty input succeeds without issuing SQL', async () => {
    expect(await insertTableRows({ ...options, rows: [] })).toEqual({
      status: 'success',
      insertedCount: 0,
      skippedCount: 0,
    })
    expect(
      await insertRowsViaSpreadsheet({ ...options, file: new File(['id\n'], 'empty.csv') })
    ).toEqual({ status: 'success', insertedCount: 0, skippedCount: 0 })
  })

  test('row-level parse issues do not stop an upload', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () => HttpResponse.json([{ inserted_count: 1 }]),
    })
    const result = await insertRowsViaSpreadsheet({
      ...options,
      file: new File(['id,name\n1\n'], 'ragged.csv'),
    })
    expect(result).toEqual({ status: 'success', insertedCount: 1, skippedCount: 0 })
  })

  test('a failed later upload chunk preserves earlier counts and stops reading', async () => {
    let requests = 0
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () => {
        requests++
        return requests === 1
          ? HttpResponse.json([{ inserted_count: 1 }])
          : HttpResponse.json({ message: 'foreign key violation' }, { status: 400 })
      },
    })
    const csv =
      'id,note\n' + Array.from({ length: 2500 }, (_, id) => `${id},${'a'.repeat(200)}`).join('\n')
    const result = await insertRowsViaSpreadsheet({
      ...options,
      selectedHeaders: ['id', 'note'],
      file: new File([csv], 'large.csv'),
      skipConflictingRows: true,
    })
    expect(result).toMatchObject({ status: 'error', outcome: 'known', insertedCount: 1 })
    expect(result.skippedCount).toBeGreaterThan(0)
    expect(requests).toBe(2)
    expect(options.onProgressUpdate).not.toHaveBeenCalledWith(100)
  })

  test('rejects oversized statements before sending SQL', async () => {
    const result = await insertTableRows({ ...options, rows: [{ id: 'x'.repeat(1024 * 1024) }] })
    expect(result).toMatchObject({
      status: 'error',
      outcome: 'known',
      insertedCount: 0,
      error: { message: 'Import batch is too large. Split the CSV into smaller files.' },
    })
  })
})
