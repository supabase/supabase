import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createSupabaseMcpServer, SupabasePlatform } from '@supabase/mcp-server-supabase'
import { createFileRoute } from '@tanstack/react-router'
import { stripIndent } from 'common-tags'
import { z } from 'zod'

import { commaSeparatedStringIntoArray, zBooleanString } from '@/lib/api/apiHelpers'
import {
  getDatabaseOperations,
  getDebuggingOperations,
  getDevelopmentOperations,
} from '@/lib/api/self-hosted/mcp'
import { DEFAULT_PROJECT } from '@/lib/constants/api'

// Twin of `pages/api/mcp/index.ts`. Web-fetch rewrite — the
// pages-router version used the SDK's Node-shaped
// `StreamableHTTPServerTransport`, which writes directly to the Node
// `res` and can't run through the buffering `toWebHandler` shim. MCP's
// `WebStandardStreamableHTTPServerTransport` accepts a Web `Request`
// and returns a Web `Response` directly, so the handler can pass the
// request through unmodified.

const supportedFeatureGroupSchema = z.enum(['docs', 'database', 'development', 'debugging'])

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

const POST = async ({ request }: { request: Request }) => {
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
