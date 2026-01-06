import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getProjectSettings } from './settings'
import { assertSelfHosted } from './util'

vi.mock('./util', () => ({
  assertSelfHosted: vi.fn(),
}))

describe('getProjectSettings', () => {
  beforeEach(() => {
    vi.stubEnv('DEFAULT_PROJECT_NAME', 'Test Project')
    vi.stubEnv('AUTH_JWT_SECRET', 'test-jwt-secret')
    vi.stubEnv('SUPABASE_SERVICE_KEY', 'test-service-key')
    vi.stubEnv('SUPABASE_ANON_KEY', 'test-anon-key')
    vi.stubEnv('PROJECT_ENDPOINT', 'localhost')
    vi.stubEnv('PROJECT_ENDPOINT_PROTOCOL', 'http')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('should call assertSelfHosted', () => {
    getProjectSettings()

    expect(assertSelfHosted).toHaveBeenCalled()
  })

  it('should return project settings with correct structure', () => {
    const result = getProjectSettings()

    expect(result).toHaveProperty('app_config')
    expect(result).toHaveProperty('cloud_provider')
    expect(result).toHaveProperty('db_dns_name')
    expect(result).toHaveProperty('db_host')
    expect(result).toHaveProperty('db_name')
    expect(result).toHaveProperty('db_port')
    expect(result).toHaveProperty('jwt_secret')
    expect(result).toHaveProperty('name')
    expect(result).toHaveProperty('ref')
    expect(result).toHaveProperty('region')
    expect(result).toHaveProperty('service_api_keys')
    expect(result).toHaveProperty('status')
  })

  it('should use DEFAULT_PROJECT_NAME from env', () => {
    vi.stubEnv('DEFAULT_PROJECT_NAME', 'Custom Project Name')

    const result = getProjectSettings()

    expect(result.name).toBe('Custom Project Name')
  })

  it('should use default project name when env var is not set', () => {
    vi.unstubAllEnvs()

    const result = getProjectSettings()

    expect(result.name).toBe('Default Project')
  })

  it('should include service_api_keys with anon and service_role keys', () => {
    const result = getProjectSettings()

    expect(result.service_api_keys).toHaveLength(2)
    expect(result.service_api_keys[0].name).toBe('service_role key')
    expect(result.service_api_keys[0].tags).toBe('service_role')
    expect(result.service_api_keys[1].name).toBe('anon key')
    expect(result.service_api_keys[1].tags).toBe('anon')
  })

  it('should set app_config with correct values', () => {
    const result = getProjectSettings()

    expect(result.app_config?.db_schema).toBe('public')
    expect(result.app_config?.endpoint).toBeDefined()
    expect(result.app_config?.storage_endpoint).toBeDefined()
    expect(result.app_config?.protocol).toBeDefined()
  })

  it('should set cloud_provider to AWS', () => {
    const result = getProjectSettings()

    expect(result.cloud_provider).toBe('AWS')
  })

  it('should set status to ACTIVE_HEALTHY', () => {
    const result = getProjectSettings()

    expect(result.status).toBe('ACTIVE_HEALTHY')
  })
})

