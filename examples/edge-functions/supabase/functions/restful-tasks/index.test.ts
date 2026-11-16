import assert from 'node:assert/strict'
import { exportJWK, generateKeyPair, SignJWT } from 'npm:jose@^6'

import handler from './index.ts'

Deno.test('task routes handle database errors and preserve successful responses', async (test) => {
  const { privateKey, publicKey } = await generateKeyPair('ES256')
  const publicJwk = await exportJWK(publicKey)
  const token = await new SignJWT({ role: 'authenticated' })
    .setProtectedHeader({ alg: 'ES256', kid: 'restful-tasks-test' })
    .setSubject('00000000-0000-4000-8000-000000000001')
    .setExpirationTime('5m')
    .sign(privateKey)
  const environment = {
    SUPABASE_URL: 'https://restful-tasks-test.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_restful_tasks_test',
    SUPABASE_JWKS: JSON.stringify({ keys: [{ ...publicJwk, kid: 'restful-tasks-test' }] }),
  }
  const previousEnvironment = Object.fromEntries(
    Object.keys(environment).map((name) => [name, Deno.env.get(name)])
  )
  const originalFetch = globalThis.fetch
  const task = { name: 'Test task', status: 0 }
  const routes = [
    { method: 'GET', path: '/restful-tasks', result: { tasks: [] } },
    { method: 'GET', path: '/restful-tasks/1', result: { task: [] } },
    { method: 'POST', path: '/restful-tasks', result: { task } },
    { method: 'PUT', path: '/restful-tasks/1', result: { task } },
    { method: 'DELETE', path: '/restful-tasks/1', result: {} },
    { method: 'PATCH', path: '/restful-tasks', result: { tasks: [] } },
  ]

  try {
    for (const [name, value] of Object.entries(environment)) Deno.env.set(name, value)

    for (const fails of [true, false]) {
      for (const route of routes) {
        await test.step(`${route.method} ${route.path}, database error=${fails}`, async () => {
          let databaseCalls = 0
          globalThis.fetch = async (input, init) => {
            const request = new Request(input, init)
            assert.equal(request.url.startsWith(`${environment.SUPABASE_URL}/rest/v1/tasks`), true)
            assert.equal(request.headers.get('Authorization'), `Bearer ${token}`)
            databaseCalls++
            return Response.json(
              fails ? { code: '42501', message: 'Database operation failed' } : [],
              { status: fails ? 403 : 200 }
            )
          }
          const hasBody = route.method === 'POST' || route.method === 'PUT'
          const response = await handler.fetch(
            new Request(`https://example.com${route.path}`, {
              method: route.method,
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: hasBody ? JSON.stringify({ task }) : undefined,
            })
          )
          assert.equal(databaseCalls, 1)
          assert.equal(response.status, fails ? 400 : 200)
          assert.deepEqual(
            await response.json(),
            fails ? { error: 'Database operation failed' } : route.result
          )
        })
      }
    }
  } finally {
    globalThis.fetch = originalFetch
    for (const [name, value] of Object.entries(previousEnvironment)) {
      if (value === undefined) Deno.env.delete(name)
      else Deno.env.set(name, value)
    }
  }
})
