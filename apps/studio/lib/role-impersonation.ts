import type { User } from 'data/auth/users-query'
import { uuidv4 } from './helpers'

type PostgrestImpersonationRole =
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
      aal?: 'aal1' | 'aal2'
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
      aal: role.aal ?? 'aal1',
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
      is_anonymous: user.is_anonymous,
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

function getPostgrestRoleImpersonationSql(projectRef: string, role: PostgrestImpersonationRole) {
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

function getCustomRoleImpersonationSql(roleName: string) {
  return /* SQL */ `
    set local role '${roleName}';
  `
}

interface WrapWithRoleImpersonationOptions {
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

function encodeText(data: string) {
  return new TextEncoder().encode(data)
}

function encodeBase64Url(data: ArrayBuffer | Uint8Array | string): string {
  return btoa(
    String.fromCharCode(...new Uint8Array(typeof data === 'string' ? encodeText(data) : data))
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function genKey(rawKey: string) {
  return window.crypto.subtle.importKey(
    'raw',
    encodeText(rawKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

async function createToken(jwtPayload: object, key: string) {
  const headerAndPayload =
    encodeBase64Url(encodeText(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))) +
    '.' +
    encodeBase64Url(encodeText(JSON.stringify(jwtPayload)))

  const signature = encodeBase64Url(
    new Uint8Array(
      await window.crypto.subtle.sign(
        { name: 'HMAC' },
        await genKey(key),
        encodeText(headerAndPayload)
      )
    )
  )

  return `${headerAndPayload}.${signature}`
}

export function getRoleImpersonationJWT(
  projectRef: string,
  jwtSecret: string,
  role: PostgrestImpersonationRole
): Promise<string> {
  const claims = getPostgrestClaims(projectRef, role)
  return createToken(claims, jwtSecret)
}
