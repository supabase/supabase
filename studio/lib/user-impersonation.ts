import { User } from 'data/auth/users-query'
import { uuidv4 } from './helpers'

function getClaims(user: User) {
  const nowTimestamp = Date.now() / 1000

  let expiryDate = new Date()
  expiryDate.setTime(expiryDate.getTime() + 60 * 60 * 1000) // 1 hour

  return {
    aal: 'aal1',
    amr: [{ method: 'password', timestamp: nowTimestamp }],
    app_metadata: user.raw_app_meta_data,
    aud: 'authenticated',
    email: user.email,
    exp: Math.floor(expiryDate.getTime() / 1000),
    iat: nowTimestamp,
    iss: 'https://ref.supabase.co/auth/v1',
    phone: user.phone,
    role: user.role,
    session_id: uuidv4(),
    sub: user.id,
    user_metadata: user.raw_user_meta_data,
  }
}

export function getUserImpersonationSql(user: User) {
  const claims = getClaims(user)

  return /* SQL */ `
    select set_config('role', '${user.role}', true),
           set_config('request.jwt.claims', '${JSON.stringify(claims)}', true),
           set_config('request.method', 'POST', true),
           set_config('request.path', '/impersonation-example-request-path', true),
           set_config('request.headers', '{"accept": "*/*"}', true);
  `
}

export function wrapWithUserImpersonation(sql: string, user?: User | null) {
  if (user === null || user === undefined) {
    return sql
  }

  const impersonationSql = getUserImpersonationSql(user)

  return /* SQL */ `
    ${impersonationSql}
    ${sql}
  `
}
