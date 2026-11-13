import { strict as assert } from 'node:assert'

import EdgeFunction from './index.ts'

Deno.test('preserves the email provider response status and body', async (t) => {
  const originalFetch = globalThis.fetch
  const originalUrl = Deno.env.get('SUPABASE_URL')
  const originalKeys = Deno.env.get('SUPABASE_SECRET_KEYS')
  const originalPublishableKeys = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')
  Deno.env.set('SUPABASE_URL', 'http://supabase.test')
  Deno.env.set('SUPABASE_SECRET_KEYS', JSON.stringify({ default: 'sb_secret_test' }))
  Deno.env.set('SUPABASE_PUBLISHABLE_KEYS', JSON.stringify({ default: 'sb_publishable_test' }))

  try {
    for (const status of [200, 401, 422, 429, 500]) {
      await t.step(`HTTP ${status}`, async () => {
        const body = status === 200 ? { id: 'email-id' } : { message: 'Email not sent' }
        let calls = 0
        globalThis.fetch = async (input, init) => {
          calls++
          assert.equal(input, 'https://api.resend.com/emails')
          assert.equal(init?.method, 'POST')
          return Response.json(body, { status })
        }

        const response = await EdgeFunction.fetch(
          new Request('http://localhost/send-email-resend', {
            method: 'POST',
            headers: { apikey: 'sb_secret_test' },
          })
        )

        assert.equal(calls, 1, calls === 0 ? await response.text() : undefined)
        assert.equal(response.status, status)
        assert.deepEqual(await response.json(), body)
      })
    }
  } finally {
    globalThis.fetch = originalFetch
    for (const [key, value] of [
      ['SUPABASE_URL', originalUrl],
      ['SUPABASE_SECRET_KEYS', originalKeys],
      ['SUPABASE_PUBLISHABLE_KEYS', originalPublishableKeys],
    ] as const) {
      if (value === undefined) Deno.env.delete(key)
      else Deno.env.set(key, value)
    }
  }
})
