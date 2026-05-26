import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { createClient } from 'jsr:@supabase/supabase-js@2'

import { getTool, listTools } from './registry.ts'

import './tools/index.ts'

const SERVER_INFO = {
  name: 'supabase-mcp-server',
  version: '0.1.0',
}

const PROTOCOL_VERSION = '2024-11-05'

type JsonRpcRequest = {
  jsonrpc: '2.0'
  id?: string | number | null
  method: string
  params?: Record<string, unknown>
}

function rpcResult(id: JsonRpcRequest['id'], result: unknown) {
  return Response.json({ jsonrpc: '2.0', id: id ?? null, result })
}

function rpcError(id: JsonRpcRequest['id'], code: number, message: string) {
  return Response.json({
    jsonrpc: '2.0',
    id: id ?? null,
    error: { code, message },
  })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('expected POST request', { status: 405 })
  }

  let body: JsonRpcRequest
  try {
    body = await req.json()
  } catch {
    return rpcError(null, -32700, 'parse error')
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  switch (body.method) {
    case 'initialize':
      return rpcResult(body.id, {
        protocolVersion: PROTOCOL_VERSION,
        serverInfo: SERVER_INFO,
        capabilities: { tools: {} },
      })

    case 'tools/list':
      return rpcResult(body.id, {
        tools: listTools().map(({ name, description, inputSchema }) => ({
          name,
          description,
          inputSchema,
        })),
      })

    case 'tools/call': {
      const name = String(body.params?.name ?? '')
      const args = (body.params?.arguments ?? {}) as Record<string, unknown>
      const tool = getTool(name)

      if (!tool) {
        return rpcError(body.id, -32601, `unknown tool: ${name}`)
      }

      try {
        const result = await tool.handler(args, { supabase, request: req })
        return rpcResult(body.id, {
          content: [{ type: 'text', text: JSON.stringify(result) }],
        })
      } catch (err) {
        return rpcResult(body.id, {
          isError: true,
          content: [{ type: 'text', text: err instanceof Error ? err.message : String(err) }],
        })
      }
    }

    default:
      return rpcError(body.id, -32601, `unknown method: ${body.method}`)
  }
})
