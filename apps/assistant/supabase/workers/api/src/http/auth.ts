import { withSupabase } from '@supabase/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { env } from '../env'
import { corsForRequest } from './cors'
import { HttpError } from './errors'

export type UserClaims = {
  id: string
  email?: string
  role?: string
  appMetadata?: unknown
  userMetadata?: unknown
}

export type HandlerContext = {
  supabase: SupabaseClient
  supabaseAdmin: SupabaseClient
  userClaims: UserClaims | null
}

export type AuthedHandler = (req: Request, ctx: HandlerContext) => Promise<Response>

function clientOptions() {
  return {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  } as const
}

export function createAdminClient(): SupabaseClient {
  return createClient(env.supabaseUrl, env.supabaseSecretKey, clientOptions())
}

export function createPublishableClient(): SupabaseClient {
  return createClient(env.supabaseUrl, env.supabasePublishableKey, clientOptions())
}

export function resolveAdmin(ctx: HandlerContext): SupabaseClient {
  return ctx.supabaseAdmin ?? createAdminClient()
}

function supabaseServerEnv() {
  const jwks = env.supabaseJwks
  return jwks ? { jwks } : {}
}

export const withUser = (handler: AuthedHandler) => (request: Request) =>
  withSupabase(
    { auth: 'user', cors: corsForRequest(request), env: supabaseServerEnv() },
    (req, ctx) => handler(req, ctx as HandlerContext)
  )(request)

export const withNone = (handler: AuthedHandler) => (request: Request) =>
  withSupabase(
    { auth: 'none', cors: corsForRequest(request), env: supabaseServerEnv() },
    (req, ctx) => handler(req, ctx as HandlerContext)
  )(request)

export function bearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization') ?? request.headers.get('authorization')
  if (!header) return null
  const [scheme, token, ...rest] = header.split(' ')
  if (scheme.toLowerCase() !== 'bearer' || !token || rest.length > 0) return null
  return token
}

export function requireUserId(ctx: HandlerContext): string {
  const id = ctx.userClaims?.id
  if (!id) {
    throw new HttpError(401, 'unauthorized', 'Sign in to continue.')
  }
  return id
}
