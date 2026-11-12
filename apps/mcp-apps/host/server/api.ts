/**
 * Backend for the local MCP Apps host, mounted into its Vite dev server.
 *
 *   GET  /api/host/config  what the page may know: server URL, model name
 *   POST /api/host/mcp     { method, params } forwarded to the MCP server
 *   POST /api/host/model   one model step (see model.ts)
 *
 * The host connects to the Supabase MCP server with the user's access token,
 * like a real host attaching its connector credentials. Views never see it.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type { Plugin } from 'vite'

import { publicConfig, readHostConfig, type HostConfig } from './config.ts'
import { runModelStep, type ModelStepRequest } from './model.ts'

export const HOST_INFO = { name: 'supabase-mcp-apps-dev-host', version: '0.0.0' }

/** What this host tells servers it can render. */
export const HOST_CLIENT_CAPABILITIES = {
  extensions: {
    'io.modelcontextprotocol/ui': { mimeTypes: ['text/html;profile=mcp-app'] },
  },
}

const FORWARDED = new Set(['tools/list', 'tools/call', 'resources/list', 'resources/read'])

function createMcpConnection(config: HostConfig) {
  let client: Promise<Client> | undefined

  async function connect() {
    if (!config.accessToken)
      throw new Error('Set SUPABASE_ACCESS_TOKEN so the host can connect to the MCP server.')
    const next = new Client(HOST_INFO, { capabilities: HOST_CLIENT_CAPABILITIES as never })
    await next.connect(
      new StreamableHTTPClientTransport(new URL(config.mcpUrl), {
        requestInit: { headers: { Authorization: `Bearer ${config.accessToken}` } },
      })
    )
    return next
  }

  return async function request(method: string, params: Record<string, unknown> = {}) {
    if (!FORWARDED.has(method)) throw new Error(`The host does not forward ${method}.`)
    client ??= connect().catch((error) => {
      client = undefined
      throw error
    })
    const connection = await client
    switch (method) {
      case 'tools/list':
        return connection.listTools(params as never)
      case 'tools/call':
        // Long-running tools (project creation) outlast the SDK's 60s default.
        return connection.callTool(params as never, undefined, { timeout: 300_000 })
      case 'resources/list':
        return connection.listResources(params as never)
      default:
        return connection.readResource(params as never)
    }
  }
}

async function readJson(req: IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export function hostApi(root: string): Plugin {
  const config = readHostConfig(root)
  const mcp = createMcpConnection(config)
  return {
    name: 'mcp-apps-dev-host-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/host/')) return next()
        try {
          if (req.url === '/api/host/config' && req.method === 'GET')
            return send(res, 200, publicConfig(config))
          if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })
          const body = await readJson(req)
          if (req.url === '/api/host/mcp')
            return send(res, 200, await mcp(body.method, body.params))
          if (req.url === '/api/host/model')
            return send(res, 200, await runModelStep(config, body as ModelStepRequest))
          return send(res, 404, { error: 'Not found' })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          server.config.logger.error(`[host] ${req.url}: ${message}`)
          return send(res, 502, { error: message })
        }
      })
    },
  }
}
