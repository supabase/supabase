import { beforeEach, describe, expect, it, vi } from 'vitest'

import { assertSelfHosted, encryptString, getConnectionString } from './util'

vi.mock('lib/constants', () => ({
  IS_PLATFORM: false,
}))

vi.mock('crypto-js', () => {
  const mockEncrypt = vi.fn()
  return {
    default: {
      AES: {
        encrypt: mockEncrypt,
      },
    },
    AES: {
      encrypt: mockEncrypt,
    },
  }
})

describe('api/self-hosted/util', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('assertSelfHosted', () => {
    it('should not throw when IS_PLATFORM is false', async () => {
      const constants = await import('lib/constants')
      vi.spyOn(constants, 'IS_PLATFORM', 'get').mockReturnValue(false)

      expect(() => assertSelfHosted()).not.toThrow()
    })

    it('should throw error when IS_PLATFORM is true', async () => {
      const constants = await import('lib/constants')
      vi.spyOn(constants, 'IS_PLATFORM', 'get').mockReturnValue(true)

      expect(() => assertSelfHosted()).toThrow(
        'This function can only be called in self-hosted environments'
      )
    })
  })

  describe('encryptString', () => {
    it('should encrypt string using AES', async () => {
      const crypto = await import('crypto-js')
      const mockEncrypted = 'encrypted-string-123'
      vi.mocked(crypto.default.AES.encrypt).mockReturnValue({
        toString: () => mockEncrypted,
      } as any)

      const result = encryptString('my-secret-data')

      expect(crypto.default.AES.encrypt).toHaveBeenCalledWith('my-secret-data', expect.any(String))
      expect(result).toBe(mockEncrypted)
    })

    it('should return encrypted string as string', async () => {
      const crypto = await import('crypto-js')
      vi.mocked(crypto.default.AES.encrypt).mockReturnValue({
        toString: () => 'U2FsdGVkX1+abc123',
      } as any)

      const result = encryptString('test')

      expect(typeof result).toBe('string')
      expect(result).toBe('U2FsdGVkX1+abc123')
    })
  })

  describe('getConnectionString', () => {
    beforeEach(() => {
      vi.resetModules()
    })

    it('should build connection string with read-write user', async () => {
      vi.stubEnv('POSTGRES_HOST', 'localhost')
      vi.stubEnv('POSTGRES_PORT', '5432')
      vi.stubEnv('POSTGRES_DB', 'testdb')
      vi.stubEnv('POSTGRES_PASSWORD', 'testpass')
      vi.stubEnv('POSTGRES_USER_READ_WRITE', 'admin_user')

      // Re-import to get updated env values
      const { getConnectionString } = await import('./util')

      const result = getConnectionString({ readOnly: false })

      expect(result).toBe('postgresql://admin_user:testpass@localhost:5432/testdb')
    })

    it('should build connection string with read-only user', async () => {
      vi.stubEnv('POSTGRES_HOST', 'db.example.com')
      vi.stubEnv('POSTGRES_PORT', '5433')
      vi.stubEnv('POSTGRES_DB', 'mydb')
      vi.stubEnv('POSTGRES_PASSWORD', 'secret')
      vi.stubEnv('POSTGRES_USER_READ_ONLY', 'readonly_user')

      const { getConnectionString } = await import('./util')

      const result = getConnectionString({ readOnly: true })

      expect(result).toBe('postgresql://readonly_user:secret@db.example.com:5433/mydb')
    })

    it('should use default values when env vars not set', async () => {
      vi.stubEnv('POSTGRES_HOST', '')
      vi.stubEnv('POSTGRES_PORT', '')
      vi.stubEnv('POSTGRES_DB', '')
      vi.stubEnv('POSTGRES_PASSWORD', '')
      vi.stubEnv('POSTGRES_USER_READ_WRITE', '')
      vi.stubEnv('POSTGRES_USER_READ_ONLY', '')

      const { getConnectionString } = await import('./util')

      const resultReadWrite = getConnectionString({ readOnly: false })
      const resultReadOnly = getConnectionString({ readOnly: true })

      expect(resultReadWrite).toBe('postgresql://supabase_admin:postgres@db:5432/postgres')
      expect(resultReadOnly).toBe('postgresql://supabase_read_only_user:postgres@db:5432/postgres')
    })
  })
})
