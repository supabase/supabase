import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('fs', () => {
  const fn = vi.fn()
  const mock = { readFileSync: fn, existsSync: vi.fn().mockReturnValue(true) }
  return { ...mock, default: mock }
})

const REGISTRY = JSON.stringify({
  version: '1',
  databases: [
    {
      ref: 'default',
      name: 'Default',
      host: 'db',
      port: 5432,
      database: 'postgres',
      password_env: 'POSTGRES_PASSWORD',
      jwt_secret_env: 'JWT_SECRET',
    },
    {
      ref: 'project-alpha',
      name: 'Alpha',
      host: 'db-alpha',
      port: 5432,
      database: 'alphadb',
      password_env: 'DB_ALPHA_PASSWORD',
      jwt_secret_env: 'DB_ALPHA_JWT_SECRET',
    },
  ],
})

describe('api/self-hosted/util — multi-database extensions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  async function setupUtil(envOverrides: Record<string, string> = {}) {
    const { readFileSync } = await import('fs')
    vi.mocked(readFileSync).mockReturnValue(REGISTRY)

    vi.stubEnv('POSTGRES_PASSWORD', 'default-pass')
    vi.stubEnv('POSTGRES_HOST', 'db')
    vi.stubEnv('POSTGRES_PORT', '5432')
    vi.stubEnv('POSTGRES_DB', 'postgres')
    vi.stubEnv('DB_ALPHA_PASSWORD', 'alpha-pass')

    for (const [k, v] of Object.entries(envOverrides)) {
      vi.stubEnv(k, v)
    }

    return import('./util')
  }

  describe('getConnectionString — ref-based routing', () => {
    it('returns the single-DB connection string with no ref (backward compat)', async () => {
      const { getConnectionString } = await setupUtil()
      const cs = getConnectionString({ readOnly: false })
      expect(cs).toContain('db:5432')
      expect(cs).toContain('default-pass')
    })

    it('returns the registry DB connection string for ref="default"', async () => {
      const { getConnectionString } = await setupUtil()
      const cs = getConnectionString({ readOnly: false, ref: 'default' })
      expect(cs).toContain('db:5432')
      expect(cs).toContain('default-pass')
    })

    it('returns per-database connection string for a named ref', async () => {
      const { getConnectionString } = await setupUtil()
      const cs = getConnectionString({ readOnly: false, ref: 'project-alpha' })
      expect(cs).toContain('db-alpha:5432')
      expect(cs).toContain('alpha-pass')
      expect(cs).toContain('alphadb')
    })

    it('falls back to env-based connection string for an unknown ref', async () => {
      const { getConnectionString } = await setupUtil()
      const cs = getConnectionString({ readOnly: false, ref: 'nonexistent' })
      // Falls back to default env-based connection
      expect(cs).toContain('db:5432')
    })

    it('produces different connection strings for different refs', async () => {
      const { getConnectionString } = await setupUtil()
      const defaultCs = getConnectionString({ readOnly: false, ref: 'default' })
      const alphaCs = getConnectionString({ readOnly: false, ref: 'project-alpha' })
      expect(defaultCs).not.toBe(alphaCs)
    })
  })

  describe('getConnectionStringForRef', () => {
    it('returns connection string for a known ref', async () => {
      const { getConnectionStringForRef } = await setupUtil()
      const cs = getConnectionStringForRef('project-alpha')
      expect(cs).toContain('db-alpha')
      expect(cs).toContain('alpha-pass')
    })

    it('falls back to default for unknown ref', async () => {
      const { getConnectionStringForRef } = await setupUtil()
      const cs = getConnectionStringForRef('unknown')
      expect(cs).toContain('db:5432')
    })
  })

  describe('encryptString / decryptString round-trip', () => {
    it('decrypts what it encrypts', async () => {
      const { encryptString, decryptString } = await setupUtil()
      const original = 'postgresql://postgres:secret@db:5432/postgres'
      const encrypted = encryptString(original)
      const decrypted = decryptString(encrypted)
      expect(decrypted).toBe(original)
    })

    it('produces different ciphertext for same plaintext (IV randomness)', async () => {
      const { encryptString } = await setupUtil()
      const plain = 'postgresql://postgres:pass@db:5432/postgres'
      const a = encryptString(plain)
      const b = encryptString(plain)
      // Different IVs → different ciphertext
      expect(a).not.toBe(b)
    })

    it('encrypted string is base64 (crypto-js OpenSSL format)', async () => {
      const { encryptString } = await setupUtil()
      const encrypted = encryptString('test')
      // crypto-js AES output is base64-encoded OpenSSL format (no colon separator)
      expect(encrypted).toMatch(/^[A-Za-z0-9+/]+=*$/)
    })
  })
})