import { createMocks } from 'node-mocks-http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import handler from '../../../../../../../pages/api/v1/projects/[ref]/api-keys/[id]'
import { mswServer } from '@/tests/lib/msw'

vi.mock('@/lib/constants', () => ({
  IS_PLATFORM: false,
  API_URL: 'https://api.example.com',
}))

describe('/api/v1/projects/[ref]/api-keys/[id]', () => {
  beforeEach(() => {
    mswServer.close()
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('Method handling', () => {
    it('should return 405 for non-GET methods', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { ref: 'default', id: 'secret' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({
        data: null,
        error: { message: 'Method POST Not Allowed' },
      })
      expect(res.getHeader('Allow')).toEqual(['GET'])
    })
  })

  describe('GET', () => {
    it('returns 404 when the key id is unknown', async () => {
      vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_xyz')

      const { req, res } = createMocks({
        method: 'GET',
        query: { ref: 'default', id: 'missing' },
      })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(404)
      expect(JSON.parse(res._getData())).toEqual({
        error: { message: 'API key not found' },
      })
    })

    it('returns the publishable key by id', async () => {
      vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_abc')

      const { req, res } = createMocks({
        method: 'GET',
        query: { ref: 'default', id: 'publishable' },
      })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(JSON.parse(res._getData())).toMatchObject({
        id: 'publishable',
        type: 'publishable',
        api_key: 'sb_publishable_abc',
      })
    })

    it('masks the secret key when reveal is false', async () => {
      vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_abcdefghijklmnop')

      const { req, res } = createMocks({
        method: 'GET',
        query: { ref: 'default', id: 'secret', reveal: 'false' },
      })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(JSON.parse(res._getData())).toMatchObject({
        id: 'secret',
        type: 'secret',
        api_key: 'sb_secret_abcde',
        prefix: 'sb_secret_abcde',
      })
    })

    it('masks the secret key by default when no reveal query param is set', async () => {
      vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_abcdefghijklmnop')

      const { req, res } = createMocks({
        method: 'GET',
        query: { ref: 'default', id: 'secret' },
      })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(JSON.parse(res._getData())).toMatchObject({
        id: 'secret',
        type: 'secret',
        api_key: 'sb_secret_abcde',
        prefix: 'sb_secret_abcde',
      })
    })

    it('returns the full secret key when reveal is true', async () => {
      vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_abcdefghijklmnop')

      const { req, res } = createMocks({
        method: 'GET',
        query: { ref: 'default', id: 'secret', reveal: 'true' },
      })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(JSON.parse(res._getData())).toMatchObject({
        id: 'secret',
        type: 'secret',
        api_key: 'sb_secret_abcdefghijklmnop',
      })
    })
  })
})
