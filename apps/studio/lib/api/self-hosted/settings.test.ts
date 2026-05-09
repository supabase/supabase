import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getProjectSettings } from './settings'

vi.mock('./util', () => ({
  assertSelfHosted: vi.fn(),
}))

vi.mock('./projects', () => ({
  getProjectSettingsByRef: vi.fn().mockImplementation((ref = 'default') => ({
    app_config: {
      db_schema: 'public',
      endpoint: 'localhost:8000',
      storage_endpoint: 'localhost:8000',
      protocol: 'http',
    },
    cloud_provider: 'AWS',
    db_dns_name: '-',
    db_host: 'localhost',
    db_ip_addr_config: 'legacy',
    db_name: 'postgres',
    db_port: 5432,
    db_user: 'postgres',
    inserted_at: '2021-08-02T06:40:40.646Z',
    jwt_secret: 'super-secret-jwt-token-with-at-least-32-characters-long',
    name: process.env.DEFAULT_PROJECT_NAME || 'Default Project',
    ref: ref,
    region: 'ap-southeast-1',
    service_api_keys: [
      {
        api_key: process.env.SUPABASE_SERVICE_KEY ?? '',
        name: 'service_role key',
        tags: 'service_role',
      },
      {
        api_key: process.env.SUPABASE_ANON_KEY ?? '',
        name: 'anon key',
        tags: 'anon',
      },
    ],
    ssl_enforced: false,
    status: 'ACTIVE_HEALTHY',
  })),
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
