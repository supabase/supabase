import pgMeta from '@supabase/pg-meta'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { runPgMetaQuery } from './tool-sql.server'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { executeQuery } from '@/lib/api/self-hosted/query'

const state = vi.hoisted(() => ({ isPlatform: true }))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  const mocked = { ...actual }
  Object.defineProperty(mocked, 'IS_PLATFORM', { get: () => state.isPlatform, enumerable: true })
  return mocked
})
vi.mock('@/data/sql/execute-sql-mutation', () => ({ executeSql: vi.fn() }))
vi.mock('@/lib/api/self-hosted/query', () => ({ executeQuery: vi.fn() }))

const CTX = {
  projectRef: 'abcdefghijklmnopqrst',
  connectionString: 'encrypted',
  authorization: 'Bearer token',
}

describe('ai/tools/tool-sql runPgMetaQuery', () => {
  beforeEach(() => {
    vi.mocked(executeSql).mockReset()
    vi.mocked(executeSql).mockResolvedValue({ result: [] })
  })

  it('runs the builder SQL with the caller headers and no fetcher override on platform', async () => {
    state.isPlatform = true
    const query = pgMeta.schemas.list()
    const controller = new AbortController()

    await runPgMetaQuery(CTX, query, controller.signal)

    expect(executeSql).toHaveBeenCalledWith(
      expect.objectContaining({
        projectRef: CTX.projectRef,
        connectionString: CTX.connectionString,
        sql: query.sql,
      }),
      controller.signal,
      { Authorization: 'Bearer token' },
      undefined
    )
  })

  it('passes executeQuery as the fetcher override off platform', async () => {
    state.isPlatform = false

    await runPgMetaQuery(CTX, pgMeta.schemas.list())

    const fetcher = vi.mocked(executeSql).mock.calls[0][3]
    vi.mocked(executeQuery).mockResolvedValue({ data: [{ ok: true }], error: undefined })

    await expect(fetcher?.({ query: 'select 1' })).resolves.toEqual({ data: [{ ok: true }] })
    expect(executeQuery).toHaveBeenCalledWith({ query: 'select 1' })
  })

  it('surfaces the database error instead of an empty result off platform', async () => {
    state.isPlatform = false
    // Mirror executeSql's handling: a result with a `data` key counts as success.
    vi.mocked(executeSql).mockImplementation(async (_variables, _signal, _headers, fetcher) => {
      const result = await fetcher!({ query: 'select 1' })
      if ('data' in result) return { result: result.data }
      throw result.error
    })
    vi.mocked(executeQuery).mockResolvedValue({
      data: undefined,
      error: new Error('connection refused'),
    })

    await expect(runPgMetaQuery(CTX, pgMeta.schemas.list())).rejects.toThrow('connection refused')
  })

  it('parses rows with the builder schema', async () => {
    state.isPlatform = true
    vi.mocked(executeSql).mockResolvedValue({ result: [{ not: 'a schema' }] })

    await expect(runPgMetaQuery(CTX, pgMeta.schemas.list())).rejects.toThrow()
  })
})
