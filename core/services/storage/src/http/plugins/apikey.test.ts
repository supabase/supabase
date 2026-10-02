import Fastify from 'fastify'
import { vi } from 'vitest'
import { registerApiKeyAuth } from './apikey'

const config = vi.hoisted(() => ({ adminApiKeys: '' }))

vi.mock('../../config', () => ({ getConfig: () => config }))

function buildApp(adminApiKeys: string) {
  config.adminApiKeys = adminApiKeys
  const app = Fastify()
  const handler = vi.fn(async () => ({ authenticated: true }))

  registerApiKeyAuth(app)
  app.get('/protected', handler)

  return { app, handler }
}

describe('admin API key authentication', () => {
  it.each([
    '',
    ',',
    ',,',
    'key-a,',
    ',key-a',
    'key-a,,key-b',
    'key-a',
  ])('rejects unauthorized requests with configured keys %j', async (adminApiKeys) => {
    const { app, handler } = buildApp(adminApiKeys)

    try {
      for (const headers of [undefined, { apikey: '' }, { apikey: 'wrong-key' }]) {
        const response = await app.inject({ url: '/protected', headers })

        expect(response.statusCode).toBe(401)
        expect(handler).not.toHaveBeenCalled()
      }
    } finally {
      await app.close()
    }
  })

  it.each([
    { adminApiKeys: 'key-a', acceptedKeys: ['key-a'] },
    { adminApiKeys: 'key-a,key-b', acceptedKeys: ['key-a', 'key-b'] },
    { adminApiKeys: ',key-a,,key-b,', acceptedKeys: ['key-a', 'key-b'] },
  ])('accepts configured nonempty keys in $adminApiKeys', async ({
    adminApiKeys,
    acceptedKeys,
  }) => {
    const { app, handler } = buildApp(adminApiKeys)

    try {
      for (const apikey of acceptedKeys) {
        const response = await app.inject({ url: '/protected', headers: { apikey } })

        expect(response.statusCode).toBe(200)
        expect(response.json()).toEqual({ authenticated: true })
      }
      expect(handler).toHaveBeenCalledTimes(acceptedKeys.length)
    } finally {
      await app.close()
    }
  })
})
