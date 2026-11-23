import { afterEach, describe, expect, it, vi } from 'vitest'

import { executeQuery } from './query'

vi.mock('@/lib/constants', () => ({
  IS_PLATFORM: false,
  PG_META_URL: 'http://localhost:8080',
}))

describe('api/self-hosted/query', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  const sentBody = async (engine: string | undefined, readOnly: boolean) => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => Response.json([]))
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('POSTGRES_ENGINE', engine)

    await executeQuery({ query: 'select 1', readOnly })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:8080/query')
    return JSON.parse(String(init.body))
  }

  it('sends read_only in the body on a Spark project', async () => {
    expect(await sentBody('spark', true)).toEqual({ query: 'select 1', read_only: true })
    expect(await sentBody('spark', false)).toEqual({ query: 'select 1' })
  })

  it('keeps the request body unchanged on a Postgres project', async () => {
    expect(await sentBody(undefined, true)).toEqual({ query: 'select 1' })
    expect(await sentBody(undefined, false)).toEqual({ query: 'select 1' })
  })
})
