import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createSupabaseMcpServer, SupabasePlatform } from '@supabase/mcp-server-supabase'
import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import { stripIndent } from 'common-tags'
import { z } from 'zod'

import { commaSeparatedStringIntoArray, zBooleanString } from '@/lib/api/apiHelpers'
import {
  getDatabaseOperations,
  getDebuggingOperations,
  getDevelopmentOperations,
  getFeedbackOperations,
} from '@/lib/api/self-hosted/mcp'
import { DEFAULT_PROJECT } from '@/lib/constants/api'

// Twin of `pages/api/mcp/index.ts`. Web-fetch rewrite — the
// pages-router version used the SDK's Node-shaped
// `StreamableHTTPServerTransport`, which writes directly to the Node
// `res` and can't run through the buffering `toWebHandler` shim. MCP's
// `WebStandardStreamableHTTPServerTransport` accepts a Web `Request`
// and returns a Web `Response` directly, so the handler can pass the
// request through unmodified.

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:8000',
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

const supportedFeatureGroupSchema = z.enum([
  'docs',
  'database',
  'development',
  'debugging',
  'feedback',
])
const mcpOAuthEnabled = process.env.ENABLED_FEATURES_MCP_OAUTH === 'true'
const mcpResourceUrl =
  process.env.SUPABASE_PUBLIC_URL! + '/.well-known/oauth-protected-resource/mcp'

const mcpAllowedUsers = process.env.MCP_ALLOWED_USERS?.split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

if (mcpOAuthEnabled && (!mcpAllowedUsers || mcpAllowedUsers.length === 0)) {
  throw new Error(
    'MCP OAuth is enabled, but MCP_ALLOWED_USERS is not configured. Set it to a comma-separated list of allowed user email addresses.'
  )
}

const mcpQuerySchema = z.object({
  features: z
    .string()
    .transform(commaSeparatedStringIntoArray)
    .optional()
    .describe(
      stripIndent`
        A comma-separated list of feature groups to filter tools by. If not provided, all tools are available.

        The following feature groups are supported: ${supportedFeatureGroupSchema.options.map((group) => `\`${group}\``).join(', ')}.
      `
    )
    .pipe(z.array(supportedFeatureGroupSchema).optional()),
  read_only: zBooleanString()
    .default('false')
    .describe(
      'Indicates whether or not the MCP server should operate in read-only mode. This prevents write operations on any of your databases by executing SQL as a read-only Postgres user.'
    ),
})

const getClaims = async (token?: string) => {
  if (!token) return { data: null, error: new Error('invalid token') }
  try {
    return await supabase.auth.getClaims(token)
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

const POST = async ({ request }: { request: Request }) => {
  if (mcpOAuthEnabled) {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const { data, error } = await getClaims(token)

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'WWW-Authenticate': `Bearer error="invalid_token", error_description="The access token provided is invalid", resource_metadata="${mcpResourceUrl}"`,
        },
      })
    }
    const { email, aud } = data.claims
    const isValidAud = Array.isArray(aud) ? aud.includes('authenticated') : aud === 'authenticated'

    if (!isValidAud || !email || !mcpAllowedUsers!.includes(email.toLowerCase())) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  const url = new URL(request.url)
  const query = Object.fromEntries(url.searchParams.entries())
  const { error, data } = mcpQuerySchema.safeParse(query)

  if (error) {
    return new Response(JSON.stringify({ error: error.flatten().fieldErrors }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { features, read_only } = data
  const headers = request.headers

  const platform: SupabasePlatform = {
    database: getDatabaseOperations({ headers }),
    development: getDevelopmentOperations({ headers }),
    debugging: getDebuggingOperations({ headers }),
    feedback: getFeedbackOperations(),
  }

  try {
    const server = createSupabaseMcpServer({
      platform,
      projectId: DEFAULT_PROJECT.ref,
      features,
      readOnly: read_only,
    })

    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Stateless, don't use session management
      enableJsonResponse: true, // Stateless, discourage SSE streams
    })

    await server.connect(transport)
    return await transport.handleRequest(request)
  } catch (err) {
    // Errors at this point will be due to MCP setup issues. Subsequent
    // errors are handled at the JSON-RPC level inside the protocol.
    if (err instanceof Error) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    // `err` here is a non-Error throw, so stringify a safe representation
    // rather than embedding the raw value — a circular/non-serializable
    // object would make JSON.stringify throw inside the catch and turn this
    // into an unhandled 500.
    return new Response(
      JSON.stringify({ error: 'Unable to process MCP request', cause: String(err) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export const Route = createFileRoute('/api/mcp/')({
  server: {
    handlers: {
      POST,
    },
  },
})
