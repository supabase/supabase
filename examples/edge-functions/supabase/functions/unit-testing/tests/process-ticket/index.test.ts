// supabase/functions/tests/process-ticket/index.test.ts
import { assertEquals } from 'jsr:@std/assert'
import { afterEach, beforeEach, describe, it } from 'jsr:@std/testing/bdd'
import { assertSpyCalls, spy } from 'jsr:@std/testing/mock'

import EdgeFunction from '../../process-ticket/index.ts'
import { env, exportEnv, generateUserToken } from '../utils/supabase_env.ts'

const FUNCTION_URL = `${env.url}/functions/v1/process-ticket`

function mockTableRequest(restQuery: string, result: object, status = 200) {
  return spy(async (input: RequestInfo | URL): Promise<Response> => {
    const url = input.toString()
    if (url === `${env.url}/rest/v1/${restQuery}`) {
      const res = Response.json(result, { status })
      return await Promise.resolve(res)
    }
    return await Promise.resolve(new Response(null, { status: 404 }))
  })
}

describe('requests for /process-ticket endpoint', () => {
  const originalFetch = globalThis.fetch
  const originalEnv = Deno.env
  const mockEnv = new Map<string, string>()

  beforeEach(() => {
    // @ts-ignore
    Deno.env = {
      has: (key) => mockEnv.has(key),
      get: (key) => mockEnv.get(key),
      set: (key, value) => mockEnv.set(key, value),
      delete: (key) => mockEnv.delete(key),
      toObject: () => Object.fromEntries(mockEnv),
    } satisfies Deno.Env

    mockEnv.clear()
    exportEnv()
  })

  afterEach(() => {
    // @ts-ignore
    Deno.env = originalEnv
    globalThis.fetch = originalFetch
  })

  it('should return the correct price based on user age', async () => {
    const expects = [
      { age: 8, result: 0 }, // Free
      { age: 15, result: 8 }, // 20% off
      { age: 18, result: 10 }, // No discount
    ]

    for (const { age, result } of expects) {
      const token = await generateUserToken()

      const req = new Request(FUNCTION_URL, {
        method: 'POST',
        headers: {
          apikey: env.publishableKeys.default,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ price: 10 }),
      })

      const mockProfiles = mockTableRequest('profiles?select=age&limit=1', { age })
      globalThis.fetch = mockProfiles

      const res = await EdgeFunction.fetch(req)

      assertEquals(res.status, 200)
      assertEquals(await res.json(), { result })
      assertSpyCalls(mockProfiles, 1)
    }
  })

  it('should return 400 when price is missing', async () => {
    const token = await generateUserToken()
    const req = new Request(FUNCTION_URL, {
      method: 'POST',
      headers: {
        apikey: env.publishableKeys.default,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    })

    const res = await EdgeFunction.fetch(req)
    assertEquals(res.status, 400)
    assertEquals(await res.json(), { error: 'missing price field' })
  })

  it('should return 500 when age is missing or invalid', async () => {
    const token = await generateUserToken()
    const req = new Request(FUNCTION_URL, {
      method: 'POST',
      headers: {
        apikey: env.publishableKeys.default,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ price: 15 }),
    })

    const mockProfiles = mockTableRequest('profiles?select=age&limit=1', {})
    globalThis.fetch = mockProfiles

    const res = await EdgeFunction.fetch(req)
    assertEquals(res.status, 500)
    assertEquals(await res.json(), { error: 'could not process' })
  })

  it('should handle database errors gracefully', async () => {
    const token = await generateUserToken()
    const req = new Request(FUNCTION_URL, {
      method: 'POST',
      headers: {
        apikey: env.publishableKeys.default,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ price: 15 }),
    })

    const mockProfiles = mockTableRequest(
      'profiles?select=age&limit=1',
      { code: 'PGRST303', message: 'JWT expired' },
      401
    )
    globalThis.fetch = mockProfiles

    const res = await EdgeFunction.fetch(req)
    assertEquals(res.status, 500)
    assertEquals(await res.json(), { error: 'could not process' })
  })
})
