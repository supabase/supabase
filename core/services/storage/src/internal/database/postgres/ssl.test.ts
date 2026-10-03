import type { PeerCertificate } from 'node:tls'
import { getSslSettings, isIpAddress } from '@internal/database/postgres/ssl'

describe('database utils', () => {
  test.each([
    ['', false],
    ['test', false],
    ['db.foobar.supabase.red', false],
    ['5.5.5.a', false],
    ['5.5.5.5', true],
    ['121.212.187.123', true],
    ['121.212.187.5', true],
    ['2001:db8:3333:4444:5555:6666:7777:8888', true],
    ['[2001:db8:3333:4444:5555:6666:7777:8888]', true],
    ['%5B2001%3Adb8%3A3333%3A4444%3A5555%3A6666%3A7777%3A8888%5D', true],
    ['2001:db8:3333:4444:CCCC:DDDD:EEEE:FFFF', true],
    ['2406%3Ada18%3A4fd%3A9b09%3A2c76%3A5d38%3Ade30%3A7904', true],
  ])('is %s ip address, expected %s', (text: string, expected: boolean) => {
    expect(isIpAddress(text)).toBe(expected)
  })

  describe('getSslSettings', () => {
    test('should return no SSL settings if database root CA not set', () => {
      expect(
        getSslSettings({ connectionString: 'foobar', databaseSSLRootCert: undefined })
      ).toBeUndefined()
    })

    test('should skip verification with a shared context if hostname is an IP address', () => {
      const settings = getSslSettings({
        connectionString: 'postgres://foo:bar@1.2.3.4:5432/postgres',
        databaseSSLRootCert: '<cert>',
      })
      expect(settings?.secureContext).toBeDefined()
      expect(settings?.rejectUnauthorized).toBe(false)
      expect(settings?.checkServerIdentity).toBeInstanceOf(Function)
      expect(settings?.checkServerIdentity?.('1.2.3.4', {} as PeerCertificate)).toBeUndefined()
      expect(settings).not.toHaveProperty('ca')
    })

    test('should detect IP host without constructing a URL', () => {
      const originalUrl = global.URL

      try {
        global.URL = class {
          constructor() {
            throw new Error('URL parsing should not be used')
          }
        } as unknown as typeof URL

        const settings = getSslSettings({
          connectionString: 'postgres://foo:bar@1.2.3.4:5432/postgres',
          databaseSSLRootCert: '<cert>',
        })
        expect(settings?.secureContext).toBeDefined()
        expect(settings?.rejectUnauthorized).toBe(false)
      } finally {
        global.URL = originalUrl
      }
    })

    test('should skip verification if hostname is a bracketed IPv6 address', () => {
      const settings = getSslSettings({
        connectionString:
          'postgres://foo:bar@[2001:db8:3333:4444:5555:6666:7777:8888]:5432/postgres',
        databaseSSLRootCert: '<cert>',
      })
      expect(settings?.secureContext).toBeDefined()
      expect(settings?.rejectUnauthorized).toBe(false)
    })

    test('should detect an IP host even when the password contains an @', () => {
      const settings = getSslSettings({
        connectionString: 'postgres://user:p@ss@1.2.3.4:5432/postgres',
        databaseSSLRootCert: '<cert>',
      })
      expect(settings?.secureContext).toBeDefined()
      expect(settings?.rejectUnauthorized).toBe(false)
    })

    test('should verify (no rejectUnauthorized override) when an IP is only in the userinfo', () => {
      const settings = getSslSettings({
        connectionString: 'postgres://1.2.3.4@db.ref.supabase.red:5432/postgres',
        databaseSSLRootCert: '<cert>',
      })
      expect(settings?.secureContext).toBeDefined()
      expect(settings?.rejectUnauthorized).toBeUndefined()
      expect(settings?.checkServerIdentity).toBeUndefined()
      expect(settings).not.toHaveProperty('ca')
    })

    test('should verify against the shared context if hostname is not an IP address', () => {
      const settings = getSslSettings({
        connectionString: 'postgres://foo:bar@db.ref.supabase.red:5432/postgres',
        databaseSSLRootCert: '<cert>',
      })
      expect(settings?.secureContext).toBeDefined()
      expect(settings?.rejectUnauthorized).toBeUndefined()
      expect(settings).not.toHaveProperty('ca')
    })

    test('should return SSL settings if hostname is not parseable', () => {
      const settings = getSslSettings({
        connectionString: 'postgres://foo:bar@db.ref.supabase."red:5432/postgres',
        databaseSSLRootCert: '<cert>',
      })
      expect(settings?.secureContext).toBeDefined()
      expect(settings?.rejectUnauthorized).toBeUndefined()
    })

    test('reuses one SecureContext per root cert across different hosts', () => {
      const ipHost = getSslSettings({
        connectionString: 'postgres://foo:bar@1.2.3.4:5432/postgres',
        databaseSSLRootCert: '<shared-cert>',
      })
      const namedHost = getSslSettings({
        connectionString: 'postgres://foo:bar@db.ref.supabase.red:5432/postgres',
        databaseSSLRootCert: '<shared-cert>',
      })
      expect(ipHost?.secureContext).toBeDefined()
      expect(ipHost?.secureContext).toBe(namedHost?.secureContext)
    })

    test('builds distinct SecureContexts for distinct root certs', () => {
      const certA = getSslSettings({
        connectionString: 'postgres://foo:bar@db.ref.supabase.red:5432/postgres',
        databaseSSLRootCert: '<cert-a>',
      })
      const certB = getSslSettings({
        connectionString: 'postgres://foo:bar@db.ref.supabase.red:5432/postgres',
        databaseSSLRootCert: '<cert-b>',
      })
      expect(certA?.secureContext).not.toBe(certB?.secureContext)
    })
  })
})
