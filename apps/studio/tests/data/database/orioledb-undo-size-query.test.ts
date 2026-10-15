import { QueryClient } from '@tanstack/react-query'
import { HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'
import { z } from 'zod'

import { orioleDbUndoSizeQueryOptions } from '@/data/database/orioledb-undo-size-query'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const variables = { projectRef: 'default', connectionString: 'encrypted-connection' }

const fetchUndoSize = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return queryClient.fetchQuery(orioleDbUndoSizeQueryOptions(variables))
}

describe('orioleDbUndoSizeQueryOptions', () => {
  test('returns null when the extension does not provide the function', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () => HttpResponse.json<Record<string, unknown>[]>([]),
    })

    await expect(fetchUndoSize()).resolves.toBeNull()
  })

  test.each([0, '8192'])('parses the summed bytes: %j', async (undoSize) => {
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const { query } = z.object({ query: z.string() }).parse(await request.json())
        if (query.includes('pg_catalog.pg_proc')) {
          expect(query).toContain("extension.extname = 'orioledb'")
          expect(query).toContain("dependency.deptype = 'e'")
          return HttpResponse.json<Record<string, unknown>[]>([{ schema: 'extensions' }])
        }

        expect(query).toContain('COALESCE(SUM(undo_size), 0)::bigint')
        expect(query).toContain('extensions.orioledb_undo_size()')
        expect(request.headers.get('x-connection-encrypted')).toBe(variables.connectionString)
        return HttpResponse.json<Record<string, unknown>[]>([{ undo_size: undoSize }])
      },
    })

    await expect(fetchUndoSize()).resolves.toBe(Number(undoSize))
  })

  test('quotes the discovered schema as a SQL identifier', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const { query } = z.object({ query: z.string() }).parse(await request.json())
        if (query.includes('pg_catalog.pg_proc')) {
          return HttpResponse.json<Record<string, unknown>[]>([{ schema: 'schema"; select 1;--' }])
        }

        expect(query).toContain('"schema""; select 1;--".orioledb_undo_size()')
        return HttpResponse.json<Record<string, unknown>[]>([{ undo_size: 4096 }])
      },
    })

    await expect(fetchUndoSize()).resolves.toBe(4096)
  })

  test('rejects a null size instead of displaying zero', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const { query } = z.object({ query: z.string() }).parse(await request.json())
        const rows = query.includes('pg_catalog.pg_proc')
          ? [{ schema: 'public' }]
          : [{ undo_size: null }]
        return HttpResponse.json<Record<string, unknown>[]>(rows)
      },
    })

    await expect(fetchUndoSize()).rejects.toBeInstanceOf(z.ZodError)
  })

  test('surfaces database errors', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'permission denied' }, { status: 403 }),
    })

    await expect(fetchUndoSize()).rejects.toMatchObject({ message: 'permission denied' })
  })
})
