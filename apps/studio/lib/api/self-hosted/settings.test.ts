import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getProjectSettings } from './settings'

vi.mock('./util', () => ({
  assertSelfHosted: vi.fn(),
}))

vi.mock('lib/constants/api', () => ({
  PROJECT_ENDPOINT: 'localhost:8000',
  PROJECT_ENDPOINT_PROTOCOL: 'http',
}))

describe('api/self-hosted/settings', () => {
  let mockAssertSelfHosted: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    const util = await import('./util')
    mockAssertSelfHosted = vi.mocked(util.assertSelfHosted)
  })

  describe('getProjectSettings', () => {
    it('should call assertSelfHosted', () => {
      getProjectSettings()

      expect(mockAssertSelfHosted).toHaveBeenCalled()
    })

    it('should return project settings with correct structure', () => {
      const settings = getProjectSettings()

      expect(settings).toHaveProperty('app_config')
      expect(settings).toHaveProperty('cloud_provider')
      expect(settings).toHaveProperty('db_dns_name')
      expect(settings).toHaveProperty('db_host')
      expect(settings).toHaveProperty('db_name')
      expect(settings).toHaveProperty('jwt_secret')
      expect(settings).toHaveProperty('service_api_keys')
    })

    it('should return correct default values', () => {
      const settings = getProjectSettings()

      expect(settings.cloud_provider).toBe('AWS')
      expect(settings.db_host).toBe('localhost')
      expect(settings.db_name).toBe('postgres')
      expect(settings.db_port).toBe(5432)
      expect(settings.db_user).toBe('postgres')
      expect(settings.ref).toBe('default')
      expect(settings.region).toBe('ap-southeast-1')
      expect(settings.status).toBe('ACTIVE_HEALTHY')
      expect(settings.ssl_enforced).toBe(false)
    })

    it('should include app_config with endpoint and protocol', () => {
      const settings = getProjectSettings()

      expect(settings.app_config).toEqual({
        db_schema: 'public',
        endpoint: 'localhost:8000',
        storage_endpoint: 'localhost:8000',
        protocol: 'http',
      })
    })

    it('should include service_api_keys array', () => {
      const settings = getProjectSettings()

      expect(settings.service_api_keys).toHaveLength(2)
      expect(settings.service_api_keys[0].name).toBe('service_role key')
      expect(settings.service_api_keys[0].tags).toBe('service_role')
      expect(settings.service_api_keys[1].name).toBe('anon key')
      expect(settings.service_api_keys[1].tags).toBe('anon')
    })

    it('should use environment variables when set', async () => {
      vi.stubEnv('AUTH_JWT_SECRET', 'custom-jwt-secret-with-at-least-32-chars')
      vi.stubEnv('DEFAULT_PROJECT_NAME', 'My Custom Project')
      vi.stubEnv('SUPABASE_SERVICE_KEY', 'custom-service-key')
      vi.stubEnv('SUPABASE_ANON_KEY', 'custom-anon-key')

      // Need to re-import to pick up new env vars
      vi.resetModules()

      const { getProjectSettings: getSettings } = await import('./settings')
      const settings = getSettings()

      expect(settings.jwt_secret).toBe('custom-jwt-secret-with-at-least-32-chars')
      expect(settings.name).toBe('My Custom Project')
      expect(settings.service_api_keys[0].api_key).toBe('custom-service-key')
      expect(settings.service_api_keys[1].api_key).toBe('custom-anon-key')
    })

    it('should use default JWT secret when not set', async () => {
      vi.unstubAllEnvs()

      vi.resetModules()
      const { getProjectSettings: getSettings } = await import('./settings')
      const settings = getSettings()

      expect(settings.jwt_secret).toBe('super-secret-jwt-token-with-at-least-32-characters-long')
    })

    it('should use default project name when not set', async () => {
      vi.unstubAllEnvs()

      vi.resetModules()
      const { getProjectSettings: getSettings } = await import('./settings')
      const settings = getSettings()

      expect(settings.name).toBe('Default Project')
    })

    it('should have correct db_ip_addr_config', () => {
      const settings = getProjectSettings()

      expect(settings.db_ip_addr_config).toBe('legacy')
    })

    it('should have correct inserted_at timestamp', () => {
      const settings = getProjectSettings()

      expect(settings.inserted_at).toBe('2021-08-02T06:40:40.646Z')
    })
  })
})
