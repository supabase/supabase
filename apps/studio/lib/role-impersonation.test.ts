import { describe, expect, it } from 'vitest'
import type { RoleImpersonationState } from './role-impersonation'
import {
  getExp1HourFromNow,
  getPostgrestClaims,
  wrapWithRoleImpersonation,
} from './role-impersonation'

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

describe('wrapWithRoleImpersonation', () => {
  const sql = 'select * from colors;'
  const ref = 'default'
  it('should return as is if selected role is postgres (undefined)', () => {
    const roleImpersonationState: RoleImpersonationState = {
      role: undefined,
      claims: undefined,
    }
    const result = wrapWithRoleImpersonation(sql, roleImpersonationState)
    expect(result).toBe(sql)
  })

  it('should return the SQL wrapped with anon user if anon role is selected', () => {
    const exp = getExp1HourFromNow()
    const iat = Math.floor(Date.now() / 1000)
    const claims = {
      iss: 'supabase',
      ref,
      role: 'anon' as 'anon',
      exp,
      iat,
    }

    const roleImpersonationState: RoleImpersonationState = {
      role: { type: 'postgrest', role: 'anon' },
      claims,
    }
    const result = wrapWithRoleImpersonation(sql, roleImpersonationState)

    const stringiedClaims = JSON.stringify({ ...claims, exp: getExp1HourFromNow() }).replaceAll(
      "'",
      "''"
    )

    expect(result).toBe(
      `
select set_config('role', 'anon', true),
set_config('request.jwt.claims', '{"iss":"supabase","ref":"${ref}","role":"anon","exp":${exp},"iat":${iat}}', true),
set_config('request.method', 'POST', true),
set_config('request.path', '/impersonation-example-request-path', true),
set_config('request.headers', '{"accept": "*/*"}', true);

    -- If the users sql returns no rows, pg-meta will
    -- fallback to returning the result of the impersonation sql.
    select 1 as "ROLE_IMPERSONATION_NO_RESULTS";

    ${sql}
`.trim()
    )
  })

  it('should return the SQL wrapped with authenticated user if a user is selected', () => {
    const exp = getExp1HourFromNow()
    const iat = Math.floor(Date.now() / 1000)
    const iss = `https://${ref}.supabase.co/auth/v1`
    const role = 'authenticated'
    const email = 'test@email.com'

    const roleImpersonationState: RoleImpersonationState = {
      role: {
        type: 'postgrest',
        role: 'authenticated',
        aal: 'aal1',
        userType: 'native',
        user: {
          email,
          id: 'abc',
          providers: [],
        },
      },
      claims: {
        ref,
        exp,
        iat,
        iss,
        role,
      },
    }
    const result = wrapWithRoleImpersonation(sql, roleImpersonationState)
    expect(result).toBe(
      `
select set_config('role', '${role}', true),
set_config('request.jwt.claims', '{"ref":"default","exp":${getExp1HourFromNow()},"iat":${Math.floor(Date.now() / 1000)},"iss":"https://default.supabase.co/auth/v1","role":"authenticated"}', true),
set_config('request.method', 'POST', true),
set_config('request.path', '/impersonation-example-request-path', true),
set_config('request.headers', '{"accept": "*/*"}', true);

    -- If the users sql returns no rows, pg-meta will
    -- fallback to returning the result of the impersonation sql.
    select 1 as "ROLE_IMPERSONATION_NO_RESULTS";

    ${sql}
`.trim()
    )
  })

  it('should return the SQL wrapped with externally authenticated user', () => {
    const exp = getExp1HourFromNow()
    const iat = Math.floor(Date.now() / 1000)
    const role = 'authenticated'
    const sessionId = 'ecab6bfd-3707-4e63-9b3b-d37af69449d9'
    const user = 'user123'

    const roleImpersonationState: RoleImpersonationState = {
      role: {
        type: 'postgrest',
        role: 'authenticated',
        userType: 'external',
        externalAuth: {
          sub: user,
          additionalClaims: {},
        },
        aal: 'aal1',
      },
      claims: {
        aal: 'aal1',
        aud: role,
        exp,
        iat,
        role,
        session_id: sessionId,
        sub: user,
      },
    }

    const result = wrapWithRoleImpersonation(sql, roleImpersonationState)
    expect(result).toBe(
      `
select set_config('role', '${role}', true),
set_config('request.jwt.claims', '{"aal":"aal1","aud":"${role}","exp":${getExp1HourFromNow()},"iat":${Math.floor(Date.now() / 1000)},"role":"${role}","session_id":"${sessionId}","sub":"${user}"}', true),
set_config('request.method', 'POST', true),
set_config('request.path', '/impersonation-example-request-path', true),
set_config('request.headers', '{"accept": "*/*"}', true);

    -- If the users sql returns no rows, pg-meta will
    -- fallback to returning the result of the impersonation sql.
    select 1 as "ROLE_IMPERSONATION_NO_RESULTS";

    ${sql}
`.trim()
    )
  })

  it('should return the SQL wrapped with custom role', () => {
    const customRole = 'test'
    const roleImpersonationState: RoleImpersonationState = {
      role: { type: 'custom', role: customRole },
      claims: undefined,
    }
    const result = wrapWithRoleImpersonation(sql, roleImpersonationState)
    expect(result).toBe(
      `
set local role '${customRole}';

    -- If the users sql returns no rows, pg-meta will
    -- fallback to returning the result of the impersonation sql.
    select 1 as "ROLE_IMPERSONATION_NO_RESULTS";

    ${sql}
`.trim()
    )
  })
})
