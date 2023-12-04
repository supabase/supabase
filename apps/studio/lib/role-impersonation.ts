import jwt from 'jwt-simple'

import { User } from 'data/auth/users-query'
import { uuidv4 } from './helpers'

export type PostgrestImpersonationRole =
  | {
      type: 'postgrest'
      role: 'anon'
    }
  | {
      type: 'postgrest'
      role: 'service_role'
    }
  | {
      type: 'postgrest'
      role: 'authenticated'
      user: User
    }

export type PostgrestRole = PostgrestImpersonationRole['role']

export type CustomImpersonationRole = {
  type: 'custom'
  role: string
}

export type ImpersonationRole = PostgrestImpersonationRole | CustomImpersonationRole

function getPostgrestClaims(projectRef: string, role: PostgrestImpersonationRole) {
  let expiryDate = new Date()
  expiryDate.setTime(expiryDate.getTime() + 60 * 60 * 1000) // 1 hour

  const exp = Math.floor(expiryDate.getTime() / 1000)
  const nowTimestamp = Math.floor(Date.now() / 1000)

  if (role.role === 'authenticated') {
    const user = role.user

    return {
      aal: 'aal1',
      amr: [{ method: 'password', timestamp: nowTimestamp }],
      app_metadata: user.raw_app_meta_data,
      aud: 'authenticated',
      email: user.email,
      exp,
      iat: nowTimestamp,
      iss: `https://${projectRef}.supabase.co/auth/v1`,
      phone: user.phone,
      role: user.role ?? role.role,
      session_id: uuidv4(),
      sub: user.id,
      user_metadata: user.raw_user_meta_data,
    }
  }

  return {
    iss: 'supabase',
    ref: projectRef,
    role: role.role,
    iat: nowTimestamp,
    exp,
  }
}

export function getPostgrestRoleImpersonationSql(
  projectRef: string,
  role: PostgrestImpersonationRole
) {
  const claims = getPostgrestClaims(projectRef, role)

  return /* SQL */ `
    select set_config('role', '${role.role}', true),
           set_config('request.jwt.claims', '${JSON.stringify(claims)}', true),
           set_config('request.method', 'POST', true),
           set_config('request.path', '/impersonation-example-request-path', true),
           set_config('request.headers', '{"accept": "*/*"}', true);
  `.trim()
}

// Includes getPostgrestRoleImpersonationSql() and wrapWithRoleImpersonation()
export const ROLE_IMPERSONATION_SQL_LINE_COUNT = 11
export const ROLE_IMPERSONATION_NO_RESULTS = 'ROLE_IMPERSONATION_NO_RESULTS'

export function getCustomRoleImpersonationSql(roleName: string) {
  return /* SQL */ `
    set local role '${roleName}';
  `
}

export interface WrapWithRoleImpersonationOptions {
  projectRef: string
  role?: ImpersonationRole
}

export function wrapWithRoleImpersonation(
  sql: string,
  { projectRef, role }: WrapWithRoleImpersonationOptions
) {
  if (role === undefined) {
    return sql
  }

  const impersonationSql =
    role.type === 'postgrest'
      ? getPostgrestRoleImpersonationSql(projectRef, role)
      : getCustomRoleImpersonationSql(role.role)

  return /* SQL */ `
    ${impersonationSql}

    -- If the users sql returns no rows, pg-meta will
    -- fallback to returning the result of the impersonation sql.
    select 1 as "${ROLE_IMPERSONATION_NO_RESULTS}";

    ${sql}
  `
}

export function getRoleImpersonationJWT(
  projectRef: string,
  jwtSecret: string,
  role: PostgrestImpersonationRole
) {
  const claims = getPostgrestClaims(projectRef, role)

  return jwt.encode(claims, jwtSecret, 'HS256')
}
