import { afterEach, describe, expect, it, vi } from 'vitest'

import { applyAndTrackMigrations } from './migrations'
import { PgMetaDatabaseError } from './types'

vi.mock('@/lib/constants', () => ({
  IS_PLATFORM: false,
  PG_META_URL: 'http://localhost:8080',
}))

describe('api/self-hosted/migrations', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  const stubFetch = (respond: () => Response) => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => respond())
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  describe('applyAndTrackMigrations on a Spark project', () => {
    const migration = {
      query: 'create table public.labels (id bigint primary key)',
      name: 'labels',
    }

    const stubSpark = () => {
      vi.stubEnv('POSTGRES_ENGINE', 'spark')
      vi.stubEnv('SUPABASE_URL', 'http://localhost:54321')
      vi.stubEnv('SUPABASE_SERVICE_KEY', 'service-key')
    }

    it("posts the migration to Spark's migration route with only the service key", async () => {
      stubSpark()
      const fetchMock = stubFetch(() =>
        Response.json({ version: '20260101000000', name: 'labels' }, { status: 201 })
      )

      const result = await applyAndTrackMigrations({
        ...migration,
        headers: { cookie: 'session=browser', Authorization: 'Bearer browser' },
      })

      expect(result).toEqual({ data: [], error: undefined })
      expect(fetchMock).toHaveBeenCalledOnce()
      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe('http://localhost:54321/system/v1/migrations')
      expect(init.method).toBe('POST')
      expect(init.headers).toEqual({ 'Content-Type': 'application/json', apikey: 'service-key' })
      expect(JSON.parse(String(init.body))).toEqual({ sql: migration.query, name: 'labels' })
    })

    it("returns Spark's refusal with its code and status", async () => {
      stubSpark()
      stubFetch(() =>
        Response.json(
          { code: '0A000', message: 'CREATE EXTENSION is not supported' },
          { status: 400 }
        )
      )

      const { data, error } = await applyAndTrackMigrations(migration)

      expect(data).toBeUndefined()
      expect(error).toBeInstanceOf(PgMetaDatabaseError)
      expect(error).toMatchObject({
        message: 'CREATE EXTENSION is not supported',
        code: '0A000',
        statusCode: 400,
      })
    })

    it.each([
      ['a 2xx answer that is not JSON', () => new Response('<html></html>')],
      ['a 2xx answer without a version', () => Response.json({})],
      [
        'an unreachable server',
        () => {
          throw new TypeError('fetch failed')
        },
      ],
    ])('reports %s as an error, not as an applied migration', async (_case, respond) => {
      stubSpark()
      stubFetch(respond)

      const { data, error } = await applyAndTrackMigrations(migration)

      expect(data).toBeUndefined()
      expect(error?.message).toBe("Spark's migration route did not answer as expected")
    })
  })

  it('applies a migration with its own SQL through pg-meta on a Postgres project', async () => {
    const fetchMock = stubFetch(() => Response.json([]))

    const result = await applyAndTrackMigrations({ query: 'select 1', name: 'one' })

    expect(result).toEqual({ data: [], error: undefined })
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'http://localhost:8080/query',
      'http://localhost:8080/query',
    ])
    const [, apply] = fetchMock.mock.calls.map(([, init]) => JSON.parse(String(init.body)).query)
    expect(apply).toContain('insert into supabase_migrations.schema_migrations')
  })
})
