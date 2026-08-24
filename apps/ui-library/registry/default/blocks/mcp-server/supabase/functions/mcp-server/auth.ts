import { createContextClient, verifyAuth } from 'npm:@supabase/server@1.4.1/core'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.108.2'

import {
  createSupabaseFetch,
  getPublicSupabaseUrl,
  getSupabaseEnvironment,
  type SupabaseFetch,
} from './supabase.ts'

// This function is an OAuth 2.1 protected resource; Supabase Auth is the
// authorization server. Every accepted token must identify an OAuth client and
// be audience-bound to this exact MCP resource by the included access-token
// hook. The session is then confirmed against Auth, so a revoked grant or
// deleted session takes effect immediately instead of at token expiry.

const FUNCTION_PATH = '/functions/v1/mcp-server'
const METADATA_PATH = '/.well-known/oauth-protected-resource'

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Authorization, Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id',
  'Access-Control-Expose-Headers': 'WWW-Authenticate, Mcp-Session-Id',
}

export type AuthConfig = {
  resourceUrl: string
  metadataUrl: string
  resourceName: string
  authorizationServer: string
}

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

// -----------------------------------------------------------------------------
// Canonical URLs
// -----------------------------------------------------------------------------
//
// The public Supabase project URL is the single source of truth shared with the
// browser block and access-token hook. It may differ from the Docker-only URL
// the function uses for internal project API calls during local development.

function readTextEnv(name: string, fallback: string): string {
  return Deno.env.get(name)?.trim() || fallback
}

export function getAuthConfig(): AuthConfig {
  const projectUrl = getPublicSupabaseUrl()
  const resourceUrl = `${projectUrl}${FUNCTION_PATH}`

  return {
    resourceUrl,
    metadataUrl: `${resourceUrl}${METADATA_PATH}`,
    resourceName: readTextEnv('MCP_SERVER_NAME', 'supabase-mcp'),
    authorizationServer: `${projectUrl}/auth/v1`,
  }
}

// -----------------------------------------------------------------------------
// Protected-resource metadata and challenges
// -----------------------------------------------------------------------------

export function isProtectedResourceMetadataRequest(request: Request): boolean {
  if (request.method !== 'GET') return false

  const pathname = new URL(request.url).pathname
  return pathname.endsWith(METADATA_PATH) || pathname === `${METADATA_PATH}${FUNCTION_PATH}`
}

export function protectedResourceMetadataResponse(config: AuthConfig): Response {
  return applyCors(
    Response.json({
      resource: config.resourceUrl,
      resource_name: config.resourceName,
      authorization_servers: [config.authorizationServer],
      bearer_methods_supported: ['header'],
    })
  )
}

/** The WWW-Authenticate value that points a client at the metadata document. */
function challenge(config: AuthConfig): string {
  return `Bearer resource_metadata="${config.metadataUrl}"`
}

function unauthorized(config: AuthConfig, description: string): Response {
  return Response.json(
    { error: 'unauthorized', error_description: description },
    { status: 401, headers: { 'WWW-Authenticate': challenge(config) } }
  )
}

// -----------------------------------------------------------------------------
// Authentication
// -----------------------------------------------------------------------------

/** Normalise the `aud` claim, which may be a string or an array. */
function audienceValues(audience: unknown): string[] {
  if (typeof audience === 'string') return [audience]
  if (Array.isArray(audience)) {
    return audience.filter((value): value is string => typeof value === 'string')
  }
  return []
}

export async function authenticateRequest(
  request: Request,
  config: AuthConfig
): Promise<AuthenticationResult> {
  // Step 1: let @supabase/server extract the bearer token, verify its
  // signature against the project's JWKS, and return its normalized auth
  // context. MCP-specific issuer and resource checks stay below.
  const environment = getSupabaseEnvironment()
  const { data: auth, error } = await verifyAuth(request, {
    auth: 'user',
    env: environment,
  })

  if (error) {
    if (error.status >= 500) {
      console.error('Supabase authentication configuration failed', error)
      return {
        ok: false,
        response: Response.json(
          { error: 'server_error', error_description: 'Authentication is unavailable' },
          { status: 500 }
        ),
      }
    }

    return { ok: false, response: unauthorized(config, 'A valid access token is required') }
  }

  const claims = auth.jwtClaims
  const audiences = audienceValues(claims?.aud)
  const clientId =
    typeof claims?.client_id === 'string' && claims.client_id ? claims.client_id : null

  // Step 2: require a user token issued to an OAuth client.
  if (claims?.role !== 'authenticated') {
    return { ok: false, response: unauthorized(config, 'An authenticated user token is required') }
  }
  if (!audiences.includes('authenticated')) {
    return { ok: false, response: unauthorized(config, 'The token audience is invalid') }
  }
  if (typeof claims?.sub !== 'string' || !claims.sub) {
    return { ok: false, response: unauthorized(config, 'The token subject is invalid') }
  }

  if (!clientId) {
    return { ok: false, response: unauthorized(config, 'An OAuth access token is required') }
  }
  if (claims?.iss !== config.authorizationServer) {
    return { ok: false, response: unauthorized(config, 'The token issuer is invalid') }
  }
  if (!audiences.includes(config.resourceUrl)) {
    // The usual cause is the access-token hook not being enabled, which is easy
    // to miss because registration, consent, and token exchange still succeed.
    console.warn(
      `Token audience ${JSON.stringify(claims?.aud)} does not include ${config.resourceUrl}. ` +
        'Enable [auth.hook.custom_access_token] in config.toml and run supabase config push.'
    )
    return {
      ok: false,
      response: unauthorized(
        config,
        'This token is not bound to this MCP server. The access-token hook may not be enabled.'
      ),
    }
  }

  const token = auth.token
  if (!token) {
    return { ok: false, response: unauthorized(config, 'A bearer token is required') }
  }

  // Step 3: a user-scoped client, so every tool inherits RLS.
  let supabase: SupabaseClient
  try {
    supabase = createContextClient({
      auth: { token, keyName: auth.keyName },
      env: environment,
    })
  } catch (contextError) {
    console.error('Unable to create a user-scoped Supabase client', contextError)
    return {
      ok: false,
      response: Response.json(
        { error: 'server_error', error_description: 'Database access is unavailable' },
        { status: 500 }
      ),
    }
  }

  // Step 4: online validation, so revoked grants and deleted sessions take
  // effect now rather than when the JWT expires.
  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  if (userError || !userData.user || userData.user.id !== claims.sub) {
    return { ok: false, response: unauthorized(config, 'The user session is no longer valid') }
  }

  return {
    ok: true,
    context: {
      supabase,
      fetchSupabase: createSupabaseFetch(token),
      claims: claims as Record<string, unknown>,
      clientId,
    },
  }
}

// -----------------------------------------------------------------------------
// CORS
// -----------------------------------------------------------------------------

export function optionsResponse(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

/** A copy of `response` with the CORS headers applied. */
export function applyCors(response: Response): Response {
  const headers = new Headers(response.headers)
  for (const [name, value] of Object.entries(CORS_HEADERS)) {
    headers.set(name, value)
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
