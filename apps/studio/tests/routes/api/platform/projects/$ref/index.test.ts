import { afterEach, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/api/platform/projects/$ref/index'
import { getRouteHandler } from '@/tests/lib/server-route'

async function getProject() {
  const response = await getRouteHandler(
    Route,
    'GET'
  )({
    request: new Request('http://localhost/api/platform/projects/default'),
    params: { ref: 'default' },
  })
  return response.json()
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('/api/platform/projects/$ref', () => {
  it.each([undefined, '', 'postgres'])(
    'omits postgres_engine when POSTGRES_ENGINE is %j',
    async (value) => {
      if (value === undefined) vi.stubEnv('POSTGRES_ENGINE', undefined)
      else vi.stubEnv('POSTGRES_ENGINE', value)

      const body = await getProject()

      expect(body.ref).toBe('default')
      expect(body).not.toHaveProperty('postgres_engine')
    }
  )

  it('reports the spark engine when POSTGRES_ENGINE is spark', async () => {
    vi.stubEnv('POSTGRES_ENGINE', 'spark')

    expect(await getProject()).toMatchObject({ ref: 'default', postgres_engine: 'spark' })
  })
})
