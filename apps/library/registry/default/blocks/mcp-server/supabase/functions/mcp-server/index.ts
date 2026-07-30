import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

// The SDK's export map points `.js` subpaths at type files that do not exist, so
// `deno check` cannot resolve them. The runtime needs the `.js` specifier and the
// type checker needs the extensionless one; @ts-types gives each what it wants.
// @ts-types="npm:@modelcontextprotocol/sdk@1.29.0/server/mcp"
import { McpServer } from 'npm:@modelcontextprotocol/sdk@1.29.0/server/mcp.js'
// @ts-types="npm:@modelcontextprotocol/sdk@1.29.0/server/webStandardStreamableHttp"
import { WebStandardStreamableHTTPServerTransport } from 'npm:@modelcontextprotocol/sdk@1.29.0/server/webStandardStreamableHttp.js'

import {
  applyCors,
  authenticateRequest,
  getAuthConfig,
  isProtectedResourceMetadataRequest,
  optionsResponse,
  protectedResourceMetadataResponse,
} from './auth.ts'
import { registerToolsets } from './tools/index.ts'
import { applyToolsets, listToolsets } from './tools/registry.ts'

// An MCP server as a single Supabase Edge Function: transport, authentication,
// and a toolset registry. It knows nothing about individual tools — those come
// from toolsets registered in ./tools/index.ts.

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

// Registration is module scope: it happens once per worker, not per request.
registerToolsets()
console.log(
  `MCP server "${SERVER_NAME}" with toolsets: ${
    listToolsets()
      .map((toolset) => toolset.name)
      .join(', ') || 'none'
  }`
)

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return optionsResponse()
  }

  const auth = getAuthConfig()

  // Unauthenticated discovery: how an OAuth client finds the authorization server.
  if (isProtectedResourceMetadataRequest(request)) {
    return protectedResourceMetadataResponse(auth)
  }

  const authentication = await authenticateRequest(request, auth)
  if (!authentication.ok) {
    return applyCors(authentication.response)
  }

  // A fresh server per request, because its tools are bound to this caller.
  const server = new McpServer(
    { name: SERVER_NAME, version: '1.0.0' },
    { instructions: SERVER_INSTRUCTIONS }
  )

  try {
    await applyToolsets(server, {
      supabase: authentication.context.supabase,
      principal: { claims: authentication.context.claims },
      accessToken: authentication.context.accessToken,
    })
  } catch (error) {
    // A toolset that cannot describe itself (an unreachable schema, say) would
    // otherwise surface as a confusing empty tool list.
    console.error('Toolset registration failed', error)
    return applyCors(
      Response.json(
        {
          jsonrpc: '2.0',
          id: null,
          error: { code: -32603, message: 'Tools are unavailable' },
        },
        { status: 500 }
      )
    )
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })

  await server.connect(transport)

  try {
    return applyCors(await transport.handleRequest(request))
  } catch (error) {
    console.error('MCP request failed', error)
    return applyCors(
      Response.json(
        {
          jsonrpc: '2.0',
          id: null,
          error: { code: -32603, message: 'Internal server error' },
        },
        { status: 500 }
      )
    )
  }
})
