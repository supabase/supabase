import { describe, expect, it } from 'vitest'
import type { RoleImpersonationState } from './role-impersonation'
import {
  getExp1HourFromNow,
  getPostgrestClaims,
  wrapWithRoleImpersonation,
} from './role-impersonation'

const createBaseUser = (overrides = {}) => ({
  id: 'user123',
  email: 'test@example.com',
  phone: undefined,
  role: 'authenticated',
  is_anonymous: false,
  raw_app_meta_data: { provider: 'email' },
  raw_user_meta_data: { name: 'Tester' },
  ...overrides,
})

const createTestClaims = (overrides = {}) => ({
  ref: 'test-project',
  exp: getExp1HourFromNow(),
  iat: Math.floor(Date.now() / 1000),
  iss: 'https://test-project.supabase.co/auth/v1',
  role: 'authenticated' as const,
  ...overrides,
})

describe('getExp1HourFromNow', () => {
  it('returns a timestamp 1 hour in the future', () => {
    const now = Math.floor(Date.now() / 1000)
    const exp = getExp1HourFromNow()
    expect(exp).toBeGreaterThan(now)
    expect(exp).toBeLessThanOrEqual(now + 3600)
  })
})

describe('getPostgrestClaims', () => {
  describe('native user claims', () => {
    it('returns basic user claims', () => {
      const claims = getPostgrestClaims('test-project', {
        type: 'postgrest',
        role: 'authenticated',
        userType: 'native',
        user: createBaseUser() as any,
      })

      expect(claims.aud).toBe('authenticated')
      expect(claims.email).toBe('test@example.com')
      expect(claims.sub).toBe('user123')
    })

    it('handles missing user data gracefully', () => {
      const claims = getPostgrestClaims('test-project', {
        type: 'postgrest',
        role: 'authenticated',
        userType: 'native',
      } as any)

      expect(claims.role).toBe('authenticated')
      expect(claims.ref).toBe('test-project')
    })
  })

  describe('external user claims', () => {
    it('returns claims with additional data', () => {
      const claims = getPostgrestClaims('test-project', {
        type: 'postgrest',
        role: 'authenticated',
        userType: 'external',
        externalAuth: {
          sub: 'ext123',
          additionalClaims: { foo: 'bar', custom: 'value' },
        },
      })

      expect(claims.sub).toBe('ext123')
      expect((claims as any).foo).toBe('bar')
      expect((claims as any).custom).toBe('value')
    })

    it('handles missing additional claims', () => {
      const claims = getPostgrestClaims('test-project', {
        type: 'postgrest',
        role: 'authenticated',
        userType: 'external',
        externalAuth: {
          sub: 'ext123',
        },
      })

      expect(claims.sub).toBe('ext123')
      expect((claims as any).foo).toBeUndefined()
    })
  })

  describe('system roles', () => {
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
  })
})

describe('wrapWithRoleImpersonation', () => {
  const sql = 'select * from colors;'
  const ref = 'default'

  describe('postgres role (undefined)', () => {
    it('returns SQL as is when no role is selected', () => {
      const roleImpersonationState: RoleImpersonationState = {
        role: undefined,
        claims: undefined,
      }
      const result = wrapWithRoleImpersonation(sql, roleImpersonationState)
      expect(result).toBe(sql)
    })
  })

  describe('anon role', () => {
    it('wraps SQL with anon user configuration', () => {
      const claims = createTestClaims({
        iss: 'supabase',
        ref,
        role: 'anon' as const,
      })

      const roleImpersonationState: RoleImpersonationState = {
        role: { type: 'postgrest', role: 'anon' },
        claims,
      }
      const result = wrapWithRoleImpersonation(sql, roleImpersonationState)

      expect(result).toContain("set_config('role', 'anon', true)")
      expect(result).toContain('request.jwt.claims')
      expect(result).toContain('ROLE_IMPERSONATION_NO_RESULTS')
      expect(result).toContain(sql)
    })
  })

  describe('authenticated user', () => {
    it('wraps SQL with native user configuration', () => {
      const claims = createTestClaims({
        iss: `https://${ref}.supabase.co/auth/v1`,
        role: 'authenticated' as const,
      })

      const roleImpersonationState: RoleImpersonationState = {
        role: {
          type: 'postgrest',
          role: 'authenticated',
          aal: 'aal1',
          userType: 'native',
          user: {
            email: 'test@email.com',
            id: 'abc',
            providers: [],
          },
        },
        claims,
      }
      const result = wrapWithRoleImpersonation(sql, roleImpersonationState)

      expect(result).toContain("set_config('role', 'authenticated', true)")
      expect(result).toContain('request.jwt.claims')
      expect(result).toContain('ROLE_IMPERSONATION_NO_RESULTS')
      expect(result).toContain(sql)
    })

    it('wraps SQL with external user configuration', () => {
      const claims = createTestClaims({
        aal: 'aal1' as const,
        aud: 'authenticated',
        role: 'authenticated' as const,
        session_id: 'ecab6bfd-3707-4e63-9b3b-d37af69449d9',
        sub: 'user123',
      })

      const roleImpersonationState: RoleImpersonationState = {
        role: {
          type: 'postgrest',
          role: 'authenticated',
          userType: 'external',
          externalAuth: {
            sub: 'user123',
            additionalClaims: {},
          },
          aal: 'aal1',
        },
        claims,
      }
      const result = wrapWithRoleImpersonation(sql, roleImpersonationState)

      expect(result).toContain("set_config('role', 'authenticated', true)")
      expect(result).toContain('request.jwt.claims')
      expect(result).toContain('ROLE_IMPERSONATION_NO_RESULTS')
      expect(result).toContain(sql)
    })
  })

  describe('custom role', () => {
    it('wraps SQL with custom role configuration', () => {
      const customRole = 'test'
      const roleImpersonationState: RoleImpersonationState = {
        role: { type: 'custom', role: customRole },
        claims: undefined,
      }
      const result = wrapWithRoleImpersonation(sql, roleImpersonationState)

      expect(result).toContain(`set local role '${customRole}'`)
      expect(result).toContain('ROLE_IMPERSONATION_NO_RESULTS')
      expect(result).toContain(sql)
    })
  })
})
