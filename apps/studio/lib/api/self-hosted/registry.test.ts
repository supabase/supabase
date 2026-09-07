import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock fs so tests don't hit the real filesystem
vi.mock('fs', () => {
  const fn = vi.fn()
  const mock = { readFileSync: fn, existsSync: vi.fn().mockReturnValue(true) }
  return { ...mock, default: mock }
})

const REGISTRY_WITH_TWO_DBS = JSON.stringify({
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
      database: 'postgres',
      password_env: 'DB_ALPHA_PASSWORD',
      jwt_secret_env: 'DB_ALPHA_JWT_SECRET',
    },
  ],
})

describe('api/self-hosted/registry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  describe('readDatabaseRegistry', () => {
    it('parses a valid registry file', async () => {
      const { readFileSync } = await import('fs')
      vi.mocked(readFileSync).mockReturnValue(REGISTRY_WITH_TWO_DBS)

      const { readDatabaseRegistry } = await import('./registry')
      const result = readDatabaseRegistry()

      expect(result.version).toBe('1')
      expect(result.databases).toHaveLength(2)
    })

    it('throws when registry file is not found', async () => {
      const { readFileSync } = await import('fs')
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory')
      })

      const { readDatabaseRegistry } = await import('./registry')
      expect(() => readDatabaseRegistry()).toThrow()
    })

    it('uses DATABASE_REGISTRY_PATH env var for file path', async () => {
      vi.stubEnv('DATABASE_REGISTRY_PATH', '/custom/path/databases.json')
      const { readFileSync } = await import('fs')
      vi.mocked(readFileSync).mockReturnValue(REGISTRY_WITH_TWO_DBS)

      const { readDatabaseRegistry } = await import('./registry')
      readDatabaseRegistry()

      expect(readFileSync).toHaveBeenCalledWith('/custom/path/databases.json', 'utf-8')
    })
  })

  describe('getDatabaseByRef', () => {
    beforeEach(async () => {
      const { readFileSync } = await import('fs')
      vi.mocked(readFileSync).mockReturnValue(REGISTRY_WITH_TWO_DBS)
    })

    it('returns the matching database entry for a known ref', async () => {
      const { getDatabaseByRef } = await import('./registry')
      const db = getDatabaseByRef('project-alpha')

      expect(db).not.toBeNull()
      expect(db!.ref).toBe('project-alpha')
      expect(db!.host).toBe('db-alpha')
      expect(db!.password_env).toBe('DB_ALPHA_PASSWORD')
    })

    it('returns the default database for ref "default"', async () => {
      const { getDatabaseByRef } = await import('./registry')
      const db = getDatabaseByRef('default')

      expect(db).not.toBeNull()
      expect(db!.host).toBe('db')
    })

    it('returns null for an unknown ref', async () => {
      const { getDatabaseByRef } = await import('./registry')
      const db = getDatabaseByRef('nonexistent')

      expect(db).toBeNull()
    })
  })

  describe('getAllDatabases', () => {
    it('returns all database entries', async () => {
      const { readFileSync } = await import('fs')
      vi.mocked(readFileSync).mockReturnValue(REGISTRY_WITH_TWO_DBS)

      const { getAllDatabases } = await import('./registry')
      const dbs = getAllDatabases()

      expect(dbs).toHaveLength(2)
      expect(dbs.map((d) => d.ref)).toEqual(['default', 'project-alpha'])
    })

    it('returns empty array when registry has no databases', async () => {
      const { readFileSync } = await import('fs')
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ version: '1', databases: [] }))

      const { getAllDatabases } = await import('./registry')
      expect(getAllDatabases()).toEqual([])
    })
  })

  describe('getEnvValue', () => {
    it('returns the env var value when set', async () => {
      vi.stubEnv('MY_SECRET', 'hunter2')
      const { getEnvValue } = await import('./registry')
      expect(getEnvValue('MY_SECRET')).toBe('hunter2')
    })

    it('returns empty string when env var is not set', async () => {
      const { getEnvValue } = await import('./registry')
      expect(getEnvValue('TOTALLY_UNSET_VAR_XYZ')).toBe('')
    })
  })
})