import { describe, it, expect } from 'vitest'
import { getPostgrestClaims } from './role-impersonation'

const baseUser = {
  id: 'user123',
  email: 'test@example.com',
  phone: undefined,
  role: 'authenticated',
  is_anonymous: false,
  raw_app_meta_data: { provider: 'email' },
  raw_user_meta_data: { name: 'Tester' },
}

describe('getPostgrestClaims', () => {
  it('returns native user claims', () => {
    const claims = getPostgrestClaims('test-project', {
      type: 'postgrest',
      role: 'authenticated',
      userType: 'native',
      user: baseUser as any,
    })

    expect(claims.aud).toBe('authenticated')
    expect(claims.email).toBe('test@example.com')
    expect(claims.sub).toBe('user123')
  })

  it('returns external user claims', () => {
    const claims = getPostgrestClaims('test-project', {
      type: 'postgrest',
      role: 'authenticated',
      userType: 'external',
      externalAuth: {
        sub: 'ext123',
        additionalClaims: { foo: 'bar' },
      },
    })

    expect(claims.sub).toBe('ext123')
    expect((claims as any).foo).toBe('bar')
  })

  it('returns basic claims for anon role', () => {
    const claims = getPostgrestClaims('test-project', {
      type: 'postgrest',
      role: 'anon',
    })

    expect(claims.role).toBe('anon')
    expect(claims.ref).toBe('test-project')
  })

  it('returns basic claims for service_role', () => {
    const claims = getPostgrestClaims('test-project', {
      type: 'postgrest',
      role: 'service_role',
    })

    expect(claims.role).toBe('service_role')
    expect(claims.ref).toBe('test-project')
  })

  it('returns fallback claims if native user is missing', () => {
    const claims = getPostgrestClaims('test-project', {
      type: 'postgrest',
      role: 'authenticated',
      userType: 'native',
    } as any)

    expect(claims.role).toBe('authenticated')
    expect(claims.ref).toBe('test-project')
  })
})
