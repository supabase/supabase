import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/api/v1/projects/$ref/api-keys/$id'
import { mswServer } from '@/tests/lib/msw'
import { getRouteHandler } from '@/tests/lib/server-route'

vi.mock('@/lib/constants', () => ({
  IS_PLATFORM: false,
  API_URL: 'https://api.example.com',
}))

const requestApiKey = (id: string, { method = 'GET', search = '' } = {}) =>
  getRouteHandler(
    Route,
    'GET'
  )({
    request: new Request(`http://localhost/api/v1/projects/default/api-keys/${id}${search}`, {
      method,
    }),
    params: { ref: 'default', id },
  })

describe('/api/v1/projects/$ref/api-keys/$id', () => {
  beforeEach(() => {
    mswServer.close()
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('Method handling', () => {
    it('should return 405 for non-GET methods', async () => {
      const response = await requestApiKey('secret', { method: 'POST' })

      expect(response.status).toBe(405)
      expect(await response.json()).toEqual({
        data: null,
        error: { message: 'Method POST Not Allowed' },
      })
      expect(response.headers.get('Allow')).toBe('GET')
    })
  })

  describe('GET', () => {
    it('returns 404 when the key id is unknown', async () => {
      vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_xyz')

      const response = await requestApiKey('missing')

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({
        error: { message: 'API key not found' },
      })
    })

    it('returns the publishable key by id', async () => {
      vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_abc')

      const response = await requestApiKey('publishable')

      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({
        id: 'publishable',
        type: 'publishable',
        api_key: 'sb_publishable_abc',
      })
    })

    it.each([
      { case: 'reveal is false', search: '?reveal=false' },
      { case: 'no reveal query param is set', search: '' },
    ])('masks the secret key when $case', async ({ search }) => {
      vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_abcdefghijklmnop')

      const response = await requestApiKey('secret', { search })

      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({
        id: 'secret',
        type: 'secret',
        api_key: 'sb_secret_abcde',
        prefix: 'sb_secret_abcde',
      })
    })

    it('returns the full secret key when reveal is true', async () => {
      vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_abcdefghijklmnop')

      const response = await requestApiKey('secret', { search: '?reveal=true' })

      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({
        id: 'secret',
        type: 'secret',
        api_key: 'sb_secret_abcdefghijklmnop',
      })
    })
  })
})
