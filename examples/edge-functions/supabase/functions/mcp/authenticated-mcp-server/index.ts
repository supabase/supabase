// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { Hono, type Context, type Next } from 'hono'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Configuration
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

/**
 * Constructs the base URL from the request, using X-Forwarded headers if present.
 * This ensures correct URL construction when behind a proxy or load balancer.
 */
function getBaseUrl(c: Context): string {
  const url = new URL(c.req.url)
  const host = c.req.header('X-Forwarded-Host') ?? url.host
  const proto = c.req.header('X-Forwarded-Proto') ?? url.protocol.replace(':', '')
  const port = c.req.header('X-Forwarded-Port') ?? url.port

  const isStandardPort =
    (proto === 'https' && port === '443') || (proto === 'http' && port === '80')
  const portSuffix = port && !isStandardPort ? `:${port}` : ''

  return `${proto}://${host}${portSuffix}`
}

/**
 * Builds the URL to the OAuth Protected Resource Metadata endpoint.
 */
function getResourceMetadataUrl(c: Context): string {
  return `${getBaseUrl(c)}/functions/v1/authenticated-mcp-server/oauth-protected-resource`
}

/**
 * Builds the authorization server URL.
 */
function getAuthServerUrl(c: Context): string {
  return `${getBaseUrl(c)}/auth/v1`
}

// Create Hono app with base path
const app = new Hono().basePath('/authenticated-mcp-server')

// Create your MCP server
const server = new McpServer({
  name: 'authenticated-mcp-server',
  version: '1.0.0',
})

// Register a simple addition tool
server.registerTool(
  'add',
  {
    title: 'Addition Tool',
    description: 'Add two numbers together',
    inputSchema: { a: z.number(), b: z.number() },
  },
  ({ a, b }) => ({
    content: [{ type: 'text', text: String(a + b) }],
  })
)

/**
 * OAuth 2.0 Protected Resource Metadata endpoint (RFC 9728).
 * This advertises the authorization server that MCP clients should use.
 *
 * According to the MCP authorization spec, servers must implement at least one of:
 * 1. WWW-Authenticate header with resource_metadata URL on 401 responses
 * 2. Well-known URL at /.well-known/oauth-protected-resource
 *
 * Since Edge Functions don't support well-known URLs at the root path,
 * we expose this at a custom path and use the WWW-Authenticate header approach.
 */
app.get('/oauth-protected-resource', (c) => {
  return c.json({
    resource: `${getBaseUrl(c)}/functions/v1/authenticated-mcp-server`,
    authorization_servers: [getAuthServerUrl(c)],
    scopes_supported: ['openid', 'profile', 'email'],
  })
})

/**
 * Build WWW-Authenticate header for 401 responses.
 * This header points clients to the Protected Resource Metadata endpoint.
 * Per RFC 9728 OAuth 2.1 Protected Resource Metadata specification.
 */
function buildWwwAuthenticateHeader(
  c: Context,
  error?: string,
  errorDescription?: string
): string {
  let header = `Bearer resource_metadata="${getResourceMetadataUrl(c)}"`

  if (error) {
    header += `, error="${error}"`
  }

  if (errorDescription) {
    header += `, error_description="${errorDescription}"`
  }

  return header
}

/**
 * Validate access token using Supabase Auth.
 */
async function validateToken(
  c: Context,
  token: string
): Promise<{ valid: boolean; user?: unknown; error?: string }> {
  const supabase = createClient(getBaseUrl(c), supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  })

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { valid: false, error: error?.message || 'Invalid token' }
  }

  return { valid: true, user }
}

/**
 * OAuth authentication middleware.
 * Validates Bearer tokens and returns WWW-Authenticate headers on failure.
 * The WWW-Authenticate header includes a resource_metadata URL that points
 * clients to the Protected Resource Metadata endpoint for OAuth discovery.
 */
async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  // No authorization header - return 401 with discovery info
  if (!authHeader) {
    return c.json(
      { error: 'unauthorized', error_description: 'Missing authorization header' },
      401,
      { 'WWW-Authenticate': buildWwwAuthenticateHeader(c) }
    )
  }

  // Check for Bearer token format
  const [scheme, token] = authHeader.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return c.json(
      { error: 'invalid_request', error_description: 'Invalid authorization header format' },
      401,
      { 'WWW-Authenticate': buildWwwAuthenticateHeader(c, 'invalid_request', 'Bearer token required') }
    )
  }

  // Validate the token
  const { valid, user, error } = await validateToken(c, token)

  if (!valid) {
    return c.json(
      { error: 'invalid_token', error_description: error || 'Token validation failed' },
      401,
      { 'WWW-Authenticate': buildWwwAuthenticateHeader(c, 'invalid_token', error) }
    )
  }

  // Store user in context for downstream handlers
  c.set('user', user)

  await next()
}

// Health check endpoint (no auth required)
app.get('/', (c) => {
  return c.json({
    name: 'authenticated-mcp-server',
    version: '1.0.0',
    endpoints: {
      mcp: '/mcp',
      oauthMetadata: '/oauth-protected-resource',
    },
  })
})

// Apply auth middleware to the MCP endpoint
app.use('/mcp', authMiddleware)

/**
 * MCP protocol endpoint - requires authentication.
 * Handles MCP requests at /mcp path.
 */
app.all('/mcp', async (c) => {
  const transport = new WebStandardStreamableHTTPServerTransport()
  await server.connect(transport)
  return transport.handleRequest(c.req.raw)
})

Deno.serve(app.fetch)
