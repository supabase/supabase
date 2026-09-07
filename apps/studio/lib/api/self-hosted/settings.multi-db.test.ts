import { beforeEach, describe, expect, it, vi } from 'vitest'

const REGISTRY_TWO_DBS = JSON.stringify({
  version: '1',
  databases: [
    {
      ref: 'default',
      name: 'Default Project',
      host: 'db',
      port: 5432,
      database: 'postgres',
      password_env: 'POSTGRES_PASSWORD',
      jwt_secret_env: 'JWT_SECRET',
      anon_key_env: 'ANON_KEY',
      service_key_env: 'SERVICE_ROLE_KEY',
    },
    {
      ref: 'project-alpha',
      name: 'Project Alpha',
      host: 'db-alpha',
      port: 5432,
      database: 'mydb',
      password_env: 'DB_ALPHA_PASSWORD',
      jwt_secret_env: 'DB_ALPHA_JWT_SECRET',
      anon_key_env: 'DB_ALPHA_ANON_KEY',
      service_key_env: 'DB_ALPHA_SERVICE_KEY',
    },
  ],
})

vi.mock('fs', () => {
  const fn = vi.fn()
  const mock = { readFileSync: fn, existsSync: vi.fn().mockReturnValue(true) }
  return { ...mock, default: mock }
})

describe('api/self-hosted/settings — multi-database', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  async function setup(envOverrides: Record<string, string> = {}) {
    const { readFileSync } = await import('fs')
    vi.mocked(readFileSync).mockReturnValue(REGISTRY_TWO_DBS)

    // Set env vars used by the registry resolver
    vi.stubEnv('POSTGRES_PASSWORD', 'default-pass')
    vi.stubEnv('JWT_SECRET', 'default-secret')
    vi.stubEnv('ANON_KEY', 'default-anon')
    vi.stubEnv('SERVICE_ROLE_KEY', 'default-service')
    vi.stubEnv('DB_ALPHA_PASSWORD', 'alpha-pass')
    vi.stubEnv('DB_ALPHA_JWT_SECRET', 'alpha-secret')
    vi.stubEnv('DB_ALPHA_ANON_KEY', 'alpha-anon')
    vi.stubEnv('DB_ALPHA_SERVICE_KEY', 'alpha-service')
    for (const [k, v] of Object.entries(envOverrides)) {
      vi.stubEnv(k, v)
    }

    const { getProjectSettings } = await import('./settings')
    return getProjectSettings
  }

  it('returns default DB settings when no ref is provided', async () => {
    const getProjectSettings = await setup()
    const settings = getProjectSettings()

    expect(settings.ref).toBe('default')
    expect(settings.db_host).toBe('db')
    expect(settings.db_password).toBe('default-pass')
    expect(settings.jwt_secret).toBe('default-secret')
  })

  it('returns default DB settings for ref="default"', async () => {
    const getProjectSettings = await setup()
    const settings = getProjectSettings('default')

    expect(settings.ref).toBe('default')
    expect(settings.db_host).toBe('db')
  })

  it('returns per-database settings for a named registry ref', async () => {
    const getProjectSettings = await setup()
    const settings = getProjectSettings('project-alpha')

    expect(settings.ref).toBe('project-alpha')
    expect(settings.name).toBe('Project Alpha')
    expect(settings.db_host).toBe('db-alpha')
    expect(settings.db_name).toBe('mydb')
    expect(settings.db_password).toBe('alpha-pass')
    expect(settings.jwt_secret).toBe('alpha-secret')
    expect(settings.anon_key).toBe('alpha-anon')
    expect(settings.service_key).toBe('alpha-service')
  })

  it('falls back to env-var config for an unknown ref (backward compat)', async () => {
    vi.stubEnv('POSTGRES_HOST', 'legacy-host')
    vi.stubEnv('POSTGRES_PORT', '5433')
    vi.stubEnv('POSTGRES_DB', 'legacydb')
    vi.stubEnv('POSTGRES_PASSWORD', 'legacy-pass')
    vi.stubEnv('JWT_SECRET', 'legacy-secret')

    const getProjectSettings = await setup()
    const settings = getProjectSettings('nonexistent-ref')

    // Falls back to env-based config
    expect(settings.ref).toBe('default')
    expect(settings.db_host).toBe('legacy-host')
    expect(settings.db_port).toBe(5433)
  })

  it('returns different passwords for different refs', async () => {
    const getProjectSettings = await setup()

    const defaultSettings = getProjectSettings('default')
    const alphaSettings = getProjectSettings('project-alpha')

    expect(defaultSettings.db_password).toBe('default-pass')
    expect(alphaSettings.db_password).toBe('alpha-pass')
    expect(defaultSettings.db_password).not.toBe(alphaSettings.db_password)
  })
})