import { createMocks } from 'node-mocks-http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import handler from '../../../../../../pages/api/v1/projects/[ref]/api-keys'
import { mswServer } from '@/tests/lib/msw'

vi.mock('@/lib/constants', () => ({
  IS_PLATFORM: false,
  API_URL: 'https://api.example.com',
}))

describe('/api/v1/projects/[ref]/api-keys', () => {
  beforeEach(() => {
    // The handler does not hit the network; disable MSW so unrelated unhandled-request errors don't fire.
    mswServer.close()
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('Method handling', () => {
    it('should return 405 for non-GET methods', async () => {
      const { req, res } = createMocks({ method: 'POST', query: { ref: 'default' } })

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
    it('returns only the two legacy keys when no new-key env vars are set', async () => {
      vi.stubEnv('SUPABASE_ANON_KEY', 'anon-key-value')
      vi.stubEnv('SUPABASE_SERVICE_KEY', 'service-key-value')
      vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', '')
      vi.stubEnv('SUPABASE_SECRET_KEY', '')

      const { req, res } = createMocks({ method: 'GET', query: { ref: 'default' } })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data).toHaveLength(2)
      expect(data[0]).toMatchObject({
        name: 'anon',
        id: 'anon',
        type: 'legacy',
        api_key: 'anon-key-value',
      })
      expect(data[1]).toMatchObject({
        name: 'service_role',
        id: 'service_role',
        type: 'legacy',
        api_key: 'service-key-value',
      })
    })

    it('falls back to empty strings when legacy env vars are unset', async () => {
      vi.stubEnv('SUPABASE_ANON_KEY', '')
      vi.stubEnv('SUPABASE_SERVICE_KEY', '')
      vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', '')
      vi.stubEnv('SUPABASE_SECRET_KEY', '')

      const { req, res } = createMocks({ method: 'GET', query: { ref: 'default' } })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data[0].api_key).toBe('')
      expect(data[1].api_key).toBe('')
    })

    it('appends a publishable entry when SUPABASE_PUBLISHABLE_KEY is set', async () => {
      vi.stubEnv('SUPABASE_ANON_KEY', 'anon-key-value')
      vi.stubEnv('SUPABASE_SERVICE_KEY', 'service-key-value')
      vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_abc')
      vi.stubEnv('SUPABASE_SECRET_KEY', '')

      const { req, res } = createMocks({ method: 'GET', query: { ref: 'default' } })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data).toHaveLength(3)
      expect(data[2]).toEqual({
        name: 'publishable',
        api_key: 'sb_publishable_abc',
        id: 'publishable',
        type: 'publishable',
        hash: '',
        prefix: '',
        description: 'Publishable API key (anon role)',
      })
      expect(data.find((k: { type: string }) => k.type === 'secret')).toBeUndefined()
    })

    it('appends a secret entry when SUPABASE_SECRET_KEY is set', async () => {
      vi.stubEnv('SUPABASE_ANON_KEY', 'anon-key-value')
      vi.stubEnv('SUPABASE_SERVICE_KEY', 'service-key-value')
      vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', '')
      vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_xyz')

      const { req, res } = createMocks({ method: 'GET', query: { ref: 'default' } })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data).toHaveLength(3)
      expect(data[2]).toEqual({
        name: 'secret',
        api_key: 'sb_secret_xyz',
        id: 'secret',
        type: 'secret',
        hash: '',
        prefix: '',
        description: 'Secret API key (service_role)',
      })
      expect(data.find((k: { type: string }) => k.type === 'publishable')).toBeUndefined()
    })

    it('appends both new entries when both env vars are set, in publishable-then-secret order', async () => {
      vi.stubEnv('SUPABASE_ANON_KEY', 'anon-key-value')
      vi.stubEnv('SUPABASE_SERVICE_KEY', 'service-key-value')
      vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_abc')
      vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_xyz')

      const { req, res } = createMocks({ method: 'GET', query: { ref: 'default' } })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data).toHaveLength(4)
      expect(data.map((k: { id: string }) => k.id)).toEqual([
        'anon',
        'service_role',
        'publishable',
        'secret',
      ])
    })
  })
})
