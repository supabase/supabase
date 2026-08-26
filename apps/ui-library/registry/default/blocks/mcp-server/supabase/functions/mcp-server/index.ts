import 'jsr:@supabase/functions-js@2.108.2/edge-runtime.d.ts'

import { createMcpHandler, McpServer } from 'npm:@modelcontextprotocol/server@2.0.0'
import {
  withOAuthProtectedResource,
  withSupabase,
  type SupabaseContext,
} from 'npm:@supabase/server@1.5.0-rc.114'

import { registerTools, type ToolContext } from './tools/index.ts'

// An MCP server as a single Supabase Edge Function. withSupabase accepts any
// verified user access token and builds an RLS-scoped client, so both embedded
// product agents and external OAuth clients can act as the signed-in user.
//
// withOAuthProtectedResource adds OAuth discovery for external MCP clients and
// points authentication failures at it. Tools are composed in ./tools/index.ts.

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

Deno.serve(
  withOAuthProtectedResource(
    withSupabase({ auth: 'user', cors: { headers: CORS_HEADERS } }, handleMcp)
  )
)
