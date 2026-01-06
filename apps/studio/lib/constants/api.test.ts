import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('constants/api', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should set PROJECT_ANALYTICS_URL from LOGFLARE_URL', async () => {
    vi.stubEnv('LOGFLARE_URL', 'https://logflare.example.com')
    vi.stubEnv('SUPABASE_PUBLIC_URL', 'https://test.supabase.co')

    const { PROJECT_ANALYTICS_URL } = await import('./api')

    expect(PROJECT_ANALYTICS_URL).toBe('https://logflare.example.com/api/')
  })

  it('should set PROJECT_ANALYTICS_URL to undefined when LOGFLARE_URL is not set', async () => {
    vi.stubEnv('SUPABASE_PUBLIC_URL', 'https://test.supabase.co')

    const { PROJECT_ANALYTICS_URL } = await import('./api')

    expect(PROJECT_ANALYTICS_URL).toBeUndefined()
  })

  it('should construct PROJECT_REST_URL from SUPABASE_PUBLIC_URL', async () => {
    vi.stubEnv('SUPABASE_PUBLIC_URL', 'https://test.supabase.co')

    const { PROJECT_REST_URL } = await import('./api')

    expect(PROJECT_REST_URL).toBe('https://test.supabase.co/rest/v1/')
  })

  it('should use default SUPABASE_PUBLIC_URL when not set', async () => {
    const { PROJECT_REST_URL } = await import('./api')

    expect(PROJECT_REST_URL).toBe('http://localhost:8000/rest/v1/')
  })

  it('should extract PROJECT_ENDPOINT from SUPABASE_PUBLIC_URL', async () => {
    vi.stubEnv('SUPABASE_PUBLIC_URL', 'https://test.supabase.co')

    const { PROJECT_ENDPOINT } = await import('./api')

    expect(PROJECT_ENDPOINT).toBe('test.supabase.co')
  })

  it('should extract PROJECT_ENDPOINT_PROTOCOL from SUPABASE_PUBLIC_URL', async () => {
    vi.stubEnv('SUPABASE_PUBLIC_URL', 'https://test.supabase.co')

    const { PROJECT_ENDPOINT_PROTOCOL } = await import('./api')

    expect(PROJECT_ENDPOINT_PROTOCOL).toBe('https')
  })

  it('should use DEFAULT_PROJECT_NAME from env', async () => {
    vi.stubEnv('DEFAULT_PROJECT_NAME', 'Custom Project')

    const { DEFAULT_PROJECT } = await import('./api')

    expect(DEFAULT_PROJECT.name).toBe('Custom Project')
  })

  it('should use default project name when env var is not set', async () => {
    const { DEFAULT_PROJECT } = await import('./api')

    expect(DEFAULT_PROJECT.name).toBe('Default Project')
  })

  it('should set DEFAULT_PROJECT with correct structure', async () => {
    const { DEFAULT_PROJECT } = await import('./api')

    expect(DEFAULT_PROJECT).toHaveProperty('id', 1)
    expect(DEFAULT_PROJECT).toHaveProperty('ref', 'default')
    expect(DEFAULT_PROJECT).toHaveProperty('organization_id', 1)
    expect(DEFAULT_PROJECT).toHaveProperty('cloud_provider', 'localhost')
    expect(DEFAULT_PROJECT).toHaveProperty('status', 'ACTIVE_HEALTHY')
    expect(DEFAULT_PROJECT).toHaveProperty('region', 'local')
    expect(DEFAULT_PROJECT).toHaveProperty('inserted_at')
  })
})

