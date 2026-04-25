import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('api/self-hosted/constants', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  describe('ENCRYPTION_KEY', () => {
    it('should use PG_META_CRYPTO_KEY when set', async () => {
      vi.stubEnv('PG_META_CRYPTO_KEY', 'my-secret-key-123')
      const { ENCRYPTION_KEY } = await import('./constants')
      expect(ENCRYPTION_KEY).toBe('my-secret-key-123')
    })

    it('should use SAMPLE_KEY as default', async () => {
      vi.stubEnv('PG_META_CRYPTO_KEY', '')
      const { ENCRYPTION_KEY } = await import('./constants')
      expect(ENCRYPTION_KEY).toBe('SAMPLE_KEY')
    })
  })

  describe('POSTGRES_PORT', () => {
    it('should use POSTGRES_PORT when set', async () => {
      vi.stubEnv('POSTGRES_PORT', '5433')
      const { POSTGRES_PORT } = await import('./constants')
      expect(POSTGRES_PORT).toBe(5433)
    })

    it('should default to 5432', async () => {
      vi.stubEnv('POSTGRES_PORT', '')
      const { POSTGRES_PORT } = await import('./constants')
      expect(POSTGRES_PORT).toBe(5432)
    })
  })

  describe('POSTGRES_HOST', () => {
    it('should use POSTGRES_HOST when set', async () => {
      vi.stubEnv('POSTGRES_HOST', 'my-db-host.example.com')
      const { POSTGRES_HOST } = await import('./constants')
      expect(POSTGRES_HOST).toBe('my-db-host.example.com')
    })

    it('should default to db', async () => {
      vi.stubEnv('POSTGRES_HOST', '')
      const { POSTGRES_HOST } = await import('./constants')
      expect(POSTGRES_HOST).toBe('db')
    })
  })

  describe('POSTGRES_DATABASE', () => {
    it('should use POSTGRES_DB when set', async () => {
      vi.stubEnv('POSTGRES_DB', 'my_database')
      const { POSTGRES_DATABASE } = await import('./constants')
      expect(POSTGRES_DATABASE).toBe('my_database')
    })

    it('should default to postgres', async () => {
      vi.stubEnv('POSTGRES_DB', '')
      const { POSTGRES_DATABASE } = await import('./constants')
      expect(POSTGRES_DATABASE).toBe('postgres')
    })
  })

  describe('POSTGRES_PASSWORD', () => {
    it('should use POSTGRES_PASSWORD when set', async () => {
      vi.stubEnv('POSTGRES_PASSWORD', 'super-secret-password')
      const { POSTGRES_PASSWORD } = await import('./constants')
      expect(POSTGRES_PASSWORD).toBe('super-secret-password')
    })

    it('should default to postgres', async () => {
      vi.stubEnv('POSTGRES_PASSWORD', '')
      const { POSTGRES_PASSWORD } = await import('./constants')
      expect(POSTGRES_PASSWORD).toBe('postgres')
    })
  })

  describe('POSTGRES_USER_READ_WRITE', () => {
    it('should use POSTGRES_USER_READ_WRITE when set', async () => {
      vi.stubEnv('POSTGRES_USER_READ_WRITE', 'custom_admin')
      const { POSTGRES_USER_READ_WRITE } = await import('./constants')
      expect(POSTGRES_USER_READ_WRITE).toBe('custom_admin')
    })

    it('should default to supabase_admin', async () => {
      vi.stubEnv('POSTGRES_USER_READ_WRITE', '')
      const { POSTGRES_USER_READ_WRITE } = await import('./constants')
      expect(POSTGRES_USER_READ_WRITE).toBe('supabase_admin')
    })
  })

  describe('POSTGRES_USER_READ_ONLY', () => {
    it('should use POSTGRES_USER_READ_ONLY when set', async () => {
      vi.stubEnv('POSTGRES_USER_READ_ONLY', 'custom_readonly')
      const { POSTGRES_USER_READ_ONLY } = await import('./constants')
      expect(POSTGRES_USER_READ_ONLY).toBe('custom_readonly')
    })

    it('should default to supabase_read_only_user', async () => {
      vi.stubEnv('POSTGRES_USER_READ_ONLY', '')
      const { POSTGRES_USER_READ_ONLY } = await import('./constants')
      expect(POSTGRES_USER_READ_ONLY).toBe('supabase_read_only_user')
    })
  })
})
