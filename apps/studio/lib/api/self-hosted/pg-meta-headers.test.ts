import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mocks must be set up before the module is imported
vi.mock('@/lib/constants', () => ({ IS_PLATFORM: false }))
vi.mock('./util', () => ({
  encryptString: (s: string) => `encrypted:${s}`,
  getConnectionStringForRef: (ref: string) =>
    `postgresql://postgres:password@${ref === 'default' ? 'db' : `db-${ref}`}:5432/postgres`,
}))

describe('api/self-hosted/pg-meta-headers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPgMetaConnectionHeaders — self-hosted mode (IS_PLATFORM=false)', () => {
    it('injects x-connection-encrypted header for default ref', async () => {
      const { getPgMetaConnectionHeaders } = await import('./pg-meta-headers')
      const base = { 'content-type': 'application/json' }
      const headers = getPgMetaConnectionHeaders('default', base)

      expect(headers['x-connection-encrypted']).toBe(
        'encrypted:postgresql://postgres:password@db:5432/postgres'
      )
      // base headers preserved
      expect(headers['content-type']).toBe('application/json')
    })

    it('injects the correct connection string for a named project ref', async () => {
      const { getPgMetaConnectionHeaders } = await import('./pg-meta-headers')
      const headers = getPgMetaConnectionHeaders('project-alpha', {})

      expect(headers['x-connection-encrypted']).toBe(
        'encrypted:postgresql://postgres:password@db-project-alpha:5432/postgres'
      )
    })

    it('does not mutate the base headers object', async () => {
      const { getPgMetaConnectionHeaders } = await import('./pg-meta-headers')
      const base = { authorization: 'Bearer token' }
      const baseCopy = { ...base }

      getPgMetaConnectionHeaders('default', base)

      expect(base).toEqual(baseCopy)
    })

    it('overwrites any existing x-connection-encrypted in base headers', async () => {
      const { getPgMetaConnectionHeaders } = await import('./pg-meta-headers')
      const base = { 'x-connection-encrypted': 'old-value' }
      const headers = getPgMetaConnectionHeaders('project-alpha', base)

      expect(headers['x-connection-encrypted']).not.toBe('old-value')
      expect(headers['x-connection-encrypted']).toContain('db-project-alpha')
    })
  })

  describe('getPgMetaConnectionHeaders — platform mode (IS_PLATFORM=true)', () => {
    it('returns base headers unchanged on platform', async () => {
      // Re-mock IS_PLATFORM as true for this test
      vi.doMock('@/lib/constants', () => ({ IS_PLATFORM: true }))
      vi.resetModules()

      const { getPgMetaConnectionHeaders } = await import('./pg-meta-headers')
      const base = { authorization: 'Bearer platform-token', 'x-connection-encrypted': 'platform-val' }
      const headers = getPgMetaConnectionHeaders('any-ref', base)

      expect(headers).toEqual(base)
    })
  })
})