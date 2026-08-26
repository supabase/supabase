import 'jsr:@supabase/functions-js@2.108.2/edge-runtime.d.ts'

// The SDK's export map points `.js` subpaths at type files that do not exist, so
// `deno check` cannot resolve them. The runtime needs the `.js` specifier and the
// type checker needs the extensionless one; @ts-types gives each what it wants.
// @ts-types="npm:@modelcontextprotocol/sdk@1.29.0/server/mcp"
import { McpServer } from 'npm:@modelcontextprotocol/sdk@1.29.0/server/mcp.js'
// @ts-types="npm:@modelcontextprotocol/sdk@1.29.0/server/webStandardStreamableHttp"
import { WebStandardStreamableHTTPServerTransport } from 'npm:@modelcontextprotocol/sdk@1.29.0/server/webStandardStreamableHttp.js'
import {
  withOAuthProtectedResource,
  withSupabase,
  type SupabaseContext,
} from 'npm:@supabase/server@1.5.0-rc.114'

import { requireOAuthContext } from './auth.ts'
import { applyToolsets, toolsetNames } from './tools/index.ts'

// An MCP server as a single Supabase Edge Function: transport, authentication,
// and one explicit toolset manifest. It knows nothing about individual tools —
// those are composed in ./tools/index.ts.
//
// withOAuthProtectedResource serves RFC 9728 metadata and points 401s at it.
// withSupabase verifies the user JWT, builds an RLS-scoped client, and applies
// CORS. The inner handler then requires an OAuth client token and a live session.

function readTextEnv(name: string, fallback: string): string {
  return Deno.env.get(name)?.trim() || fallback
}

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

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Authorization, Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id',
  'Access-Control-Expose-Headers': 'WWW-Authenticate, Mcp-Session-Id',
}

console.log(`MCP server "${SERVER_NAME}" with toolsets: ${toolsetNames.join(', ') || 'none'}`)

async function handleMcp(request: Request, ctx: SupabaseContext): Promise<Response> {
  const authentication = await requireOAuthContext(request, ctx)
  if (!authentication.ok) {
    return authentication.response
  }

  // A fresh server per request, because its tools are bound to this caller.
  const server = new McpServer(
    { name: SERVER_NAME, version: '1.0.0' },
    { instructions: SERVER_INSTRUCTIONS }
  )

  try {
    await applyToolsets(server, authentication.context)
  } catch (error) {
    // A toolset that cannot describe itself (an unreachable schema, say) would
    // otherwise surface as a confusing empty tool list.
    console.error('Toolset registration failed', error)
    return Response.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32603, message: 'Tools are unavailable' },
      },
      { status: 500 }
    )
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })

  await server.connect(transport)

  try {
    return await transport.handleRequest(request)
  } catch (error) {
    console.error('MCP request failed', error)
    return Response.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32603, message: 'Internal server error' },
      },
      { status: 500 }
    )
  }
}

Deno.serve(
  withOAuthProtectedResource(
    withSupabase({ auth: 'user', cors: { headers: CORS_HEADERS } }, handleMcp)
  )
)
