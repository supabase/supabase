import type { JWTClaims } from 'npm:@supabase/server@1.5.0-rc.114'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.108.2'

import { createSupabaseFetch, type SupabaseFetch } from './supabase.ts'

// This function is an OAuth 2.1 protected resource; Supabase Auth is the
// authorization server. withSupabase already verified the JWT. These checks
// additionally require an OAuth client and a live user session, so revoked
// grants and deleted sessions take effect immediately instead of at token expiry.

export type AuthenticatedContext = {
  /** User-scoped Supabase client, with the bearer token attached. */
  supabase: SupabaseClient
  /** Authenticated requests to this project's HTTP APIs without exposing the token. */
  fetchSupabase: SupabaseFetch
  claims: Record<string, unknown>
  clientId: string
}

type AuthenticationResult =
  | { ok: true; context: AuthenticatedContext }
  | { ok: false; response: Response }

function unauthorized(description: string): Response {
  return Response.json(
    { error: 'unauthorized', error_description: description },
    { status: 401 }
  )
}

function readBearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization')
  if (!header) return null

  const [scheme, token] = header.split(/\s+/, 2)
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null

  return token
}

export async function requireOAuthContext(
  request: Request,
  ctx: {
    supabase: SupabaseClient
    jwtClaims: JWTClaims | null
  }
): Promise<AuthenticationResult> {
  const claims = ctx.jwtClaims
  const clientId =
    typeof claims?.client_id === 'string' && claims.client_id ? claims.client_id : null

  if (!claims || claims.role !== 'authenticated') {
    return { ok: false, response: unauthorized('An authenticated user token is required') }
  }
  if (typeof claims.sub !== 'string' || !claims.sub) {
    return { ok: false, response: unauthorized('The token subject is invalid') }
  }
  if (!clientId) {
    return { ok: false, response: unauthorized('An OAuth access token is required') }
  }

  const token = readBearerToken(request)
  if (!token) {
    return { ok: false, response: unauthorized('A bearer token is required') }
  }

  const { data: userData, error: userError } = await ctx.supabase.auth.getUser(token)
  if (userError || !userData.user || userData.user.id !== claims.sub) {
    return { ok: false, response: unauthorized('The user session is no longer valid') }
  }

  return {
    ok: true,
    context: {
      supabase: ctx.supabase,
      fetchSupabase: createSupabaseFetch(token),
      claims,
      clientId,
    },
  }
}
