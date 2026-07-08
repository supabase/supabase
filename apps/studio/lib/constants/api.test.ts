import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('constants/api', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  describe('PROJECT_ANALYTICS_URL', () => {
    it('should be undefined when LOGFLARE_URL is not set', async () => {
      vi.stubEnv('LOGFLARE_URL', '')
      const { PROJECT_ANALYTICS_URL } = await import('./api')
      expect(PROJECT_ANALYTICS_URL).toBeUndefined()
    })

    it('should use LOGFLARE_URL when set', async () => {
      vi.stubEnv('LOGFLARE_URL', 'https://logflare.example.com')
      const { PROJECT_ANALYTICS_URL } = await import('./api')
      expect(PROJECT_ANALYTICS_URL).toBe('https://logflare.example.com/api/')
    })
  })

  describe('PROJECT_REST_URL', () => {
    it('should construct URL from SUPABASE_PUBLIC_URL', async () => {
      vi.stubEnv('SUPABASE_PUBLIC_URL', 'https://test.supabase.co')
      const { PROJECT_REST_URL } = await import('./api')
      expect(PROJECT_REST_URL).toBe('https://test.supabase.co/rest/v1/')
    })

    it('should use default localhost when SUPABASE_PUBLIC_URL is not set', async () => {
      vi.stubEnv('SUPABASE_PUBLIC_URL', '')
      const { PROJECT_REST_URL } = await import('./api')
      expect(PROJECT_REST_URL).toBe('http://localhost:8000/rest/v1/')
    })
  })

  describe('PROJECT_ENDPOINT', () => {
    it('should extract host from SUPABASE_PUBLIC_URL', async () => {
      vi.stubEnv('SUPABASE_PUBLIC_URL', 'https://test.supabase.co:3000')
      const { PROJECT_ENDPOINT } = await import('./api')
      expect(PROJECT_ENDPOINT).toBe('test.supabase.co:3000')
    })

    it('should use default localhost host', async () => {
      vi.stubEnv('SUPABASE_PUBLIC_URL', '')
      const { PROJECT_ENDPOINT } = await import('./api')
      expect(PROJECT_ENDPOINT).toBe('localhost:8000')
    })
  })

  describe('PROJECT_ENDPOINT_PROTOCOL', () => {
    it('should extract protocol without colon from SUPABASE_PUBLIC_URL', async () => {
      vi.stubEnv('SUPABASE_PUBLIC_URL', 'https://test.supabase.co')
      const { PROJECT_ENDPOINT_PROTOCOL } = await import('./api')
      expect(PROJECT_ENDPOINT_PROTOCOL).toBe('https')
    })

    it('should use http for default localhost', async () => {
      vi.stubEnv('SUPABASE_PUBLIC_URL', '')
      const { PROJECT_ENDPOINT_PROTOCOL } = await import('./api')
      expect(PROJECT_ENDPOINT_PROTOCOL).toBe('http')
    })
  })

  describe('DEFAULT_PROJECT', () => {
    it('should have correct default values', async () => {
      vi.stubEnv('DEFAULT_PROJECT_NAME', '')
      const { DEFAULT_PROJECT } = await import('./api')

      expect(DEFAULT_PROJECT).toEqual({
        id: 1,
        ref: 'default',
        name: 'Default Project',
        organization_id: 1,
        cloud_provider: 'localhost',
        status: 'ACTIVE_HEALTHY',
        region: 'local',
        inserted_at: '2021-08-02T06:40:40.646Z',
      })
    })

    it('should use DEFAULT_PROJECT_NAME env var when set', async () => {
      vi.stubEnv('DEFAULT_PROJECT_NAME', 'My Custom Project')
      const { DEFAULT_PROJECT } = await import('./api')
      expect(DEFAULT_PROJECT.name).toBe('My Custom Project')
    })

    it('should have static id and ref', async () => {
      const { DEFAULT_PROJECT } = await import('./api')
      expect(DEFAULT_PROJECT.id).toBe(1)
      expect(DEFAULT_PROJECT.ref).toBe('default')
    })

    it('should have localhost cloud_provider', async () => {
      const { DEFAULT_PROJECT } = await import('./api')
      expect(DEFAULT_PROJECT.cloud_provider).toBe('localhost')
    })
  })
})
