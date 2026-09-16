import { createMcpHandler, McpServer } from '@modelcontextprotocol/server'
import { getEnv, pipeline } from '@supabase/middleware'
import {
  fromSupabaseUrl,
  withOAuthProtectedResource,
  withSupabase,
  type SupabaseContext,
} from '@supabase/server'

import { registerTools, type ToolContext } from './tools/index.ts'

// An MCP server as a single Supabase Compute service, composed as a pipeline:
//
//   withOAuthProtectedResource  OAuth discovery for external MCP clients. Runs
//                               before the auth gate so unauthenticated clients
//                               can fetch the RFC 9728 metadata, and adds the
//                               WWW-Authenticate challenge to the gate's 401.
//   withSupabase                Verifies the user access token and builds an
//                               RLS-scoped client, so both embedded product
//                               agents and external OAuth clients act as the
//                               signed-in user.
//   handleMcp                   MCP transport and tools (./tools/index.ts).
//
// Same libraries and same pipeline as the Edge Function block. The one real
// difference is the advertised URLs. `@supabase/server` derives them from the
// request only on Edge Functions, and a `node` Compute service is not Edge
// Functions, so the library declines to guess: `resourceServer` is required
// (unset, every request is answered `500` with `MISSING_RESOURCE_SERVER`) and
// `authorizationServer` falls back to `SUPABASE_PUBLIC_URL`, then
// `SUPABASE_URL`, with `/auth/v1` appended. RFC 9728 §3.3 requires the
// advertised resource identifier to equal the URL the client called, and a
// Compute instance's own origin is an internal host and `$PORT`, so both
// options are passed explicitly below. That is the required configuration off
// Edge Functions, not a workaround.

const COMPUTE_PATH_PREFIX = '/compute/v1'

// `getEnv` is `@supabase/middleware`'s runtime-agnostic environment read, the
// same one `@supabase/server` uses internally.
function readTextEnv(name: string, fallback: string): string {
  return getEnv(name)?.trim() || fallback
}

function readEnv(name: string): string | null {
  return getEnv(name)?.trim() || null
}

/** Strips a trailing slash so joining a path never produces `//`. */
function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

/**
 * The public URL of a Compute service: the project origin plus
 * `/compute/v1/<service>`. Pure, so the derivation is checkable without an
 * environment or a request.
 */
export function computeUrl(origin: string, serviceName: string): string {
  return `${trimTrailingSlash(origin)}${COMPUTE_PATH_PREFIX}/${serviceName}`
}

/**
 * The origin a gateway reports the client used, or null when the request did
 * not arrive through one. Used only as a last resort: a Compute instance
 * listens on an internal host and port, so its own request URL never carries
 * the project's public origin.
 */
function forwardedOrigin(request: Request): string | null {
  const host = request.headers.get('X-Forwarded-Host')
  if (!host) return null

  const proto = (request.headers.get('X-Forwarded-Proto') ?? 'https').toLowerCase()
  return `${proto}://${host}`
}

// The service name must match `[compute.<name>]` in supabase/config.toml,
// because it is the last segment of the public URL.
const SERVICE_NAME = readTextEnv('MCP_COMPUTE_SERVICE_NAME', 'mcp-server')

const SERVER_NAME = readTextEnv('MCP_SERVER_NAME', 'supabase-mcp')
const SERVER_DESCRIPTION = readTextEnv(
  'MCP_SERVER_DESCRIPTION',
  'MCP access to this Supabase project for the signed-in user.'
)

const SERVER_INSTRUCTIONS =
  `${SERVER_DESCRIPTION} ` +
  'Every tool runs as the signed-in Supabase user, so role grants and Row Level Security apply. ' +
  "Call tools/list to discover what this project exposes, and read a tool's description and " +
  'annotations before calling it — some tools have side effects.'

const PROJECT_URL = readEnv('SUPABASE_PUBLIC_URL') ?? readEnv('SUPABASE_URL')

// Resolved once, at startup, so a missing value fails the deploy instead of
// every request. `MCP_RESOURCE_SERVER` wins, for a custom domain or a proxy in
// front of the instance; otherwise the project URL and the service name spell
// the documented Compute URL exactly.
const RESOURCE_SERVER =
  readEnv('MCP_RESOURCE_SERVER')?.replace(/\/$/, '') ??
  (PROJECT_URL ? computeUrl(PROJECT_URL, SERVICE_NAME) : null)

// `MCP_AUTHORIZATION_SERVER` points external clients at a non-Supabase OAuth
// 2.1 issuer. Unset, this project's Supabase Auth is the issuer.
const AUTHORIZATION_SERVER =
  readEnv('MCP_AUTHORIZATION_SERVER') ?? (PROJECT_URL ? fromSupabaseUrl(PROJECT_URL) : null)

if (!AUTHORIZATION_SERVER) {
  throw new Error(
    'Cannot derive the OAuth authorization server. Set SUPABASE_URL to the project URL, ' +
      'or MCP_AUTHORIZATION_SERVER to a third-party OAuth 2.1 issuer.'
  )
}

function resourceServer(request: Request): string {
  if (RESOURCE_SERVER) return RESOURCE_SERVER

  const origin = forwardedOrigin(request)
  if (origin) return computeUrl(origin, SERVICE_NAME)

  throw new Error(
    "Cannot derive this service's public URL. Set MCP_RESOURCE_SERVER to " +
      `https://<project-ref>.supabase.co${COMPUTE_PATH_PREFIX}/${SERVICE_NAME}, or set SUPABASE_URL.`
  )
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Authorization, Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id, Mcp-Method, Mcp-Name',
  'Access-Control-Expose-Headers': 'WWW-Authenticate, Mcp-Session-Id',
}

function createServer(context: ToolContext): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: '1.0.0' },
    { instructions: SERVER_INSTRUCTIONS }
  )

  registerTools(server, context)
  return server
}

async function handleMcp(request: Request, ctx: SupabaseContext): Promise<Response> {
  // The server and its tools are bound to this caller for exactly one request.
  const handler = createMcpHandler(
    () =>
      createServer({
        supabase: ctx.supabase,
        // auth: 'user' guarantees both claim shapes before this handler runs.
        userClaims: ctx.userClaims!,
        jwtClaims: ctx.jwtClaims!,
      }),
    { onerror: (error) => console.error('MCP request failed', error) }
  )

  return handler.fetch(request)
}

// The handler is passed inline so TypeScript infers its context from the entries.
// Passing `handleMcp` directly collapses the inferred context to `object`.
const fetchHandler = pipeline(
  [
    withOAuthProtectedResource({ resourceServer, authorizationServer: AUTHORIZATION_SERVER }),
    withSupabase({ auth: 'user', cors: { headers: CORS_HEADERS } }),
  ],
  (request, ctx) => handleMcp(request, ctx)
)

// Compute owns the listener: it imports this module and serves the default
// export on $PORT. Everything above is module-level work, and a `node` service
// pays a TypeScript strip on top of it, so keep it cheap — a public instance
// has to accept connections shortly after start.
export default { fetch: fetchHandler }
