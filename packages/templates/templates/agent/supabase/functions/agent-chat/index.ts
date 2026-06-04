import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { openai } from 'npm:@ai-sdk/openai'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { streamText, stepCountIs, tool, type CoreMessage, type ToolSet } from 'npm:ai'
import { z } from 'npm:zod@3'

const DEFAULT_MODEL = 'gpt-4.1-mini'
const DEFAULT_SYSTEM_PROMPT =
  'You are a helpful assistant. Use available tools when they are relevant, and cite tool results clearly.'
const MAX_HISTORY_MESSAGES = 24

const mcpServerSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
})

const requestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  message: z.string().min(1),
  model: z.string().optional(),
  system: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  mcpServers: z.array(mcpServerSchema).optional(),
})

type AgentMcpServer = z.infer<typeof mcpServerSchema>

type AgentMemory = {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string | null
}

type McpToolDefinition = {
  name: string
  description?: string
  inputSchema?: Record<string, unknown>
}

type JsonRpcResponse<T> = {
  result?: T
  error?: { code: number; message: string }
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('expected POST request', { status: 405 })
  }

  const parseResult = requestSchema.safeParse(await req.json())

  if (!parseResult.success) {
    return new Response(`invalid request body: ${parseResult.error.message}`, { status: 400 })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey)

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()

  if (userError || !user) {
    return Response.json({ error: 'valid user JWT is required' }, { status: 401 })
  }

  const body = parseResult.data
  const sessionId = await getOrCreateSession(serviceClient, {
    sessionId: body.sessionId,
    userId: user.id,
    title: body.message.slice(0, 80),
    metadata: body.metadata ?? {},
  })

  if (!sessionId) {
    return Response.json({ error: 'session not found or not owned by user' }, { status: 404 })
  }

  await serviceClient.from('agent_memories').insert({
    session_id: sessionId,
    role: 'user',
    content: body.message,
    state: body.metadata ?? {},
  })

  const history = await loadHistory(serviceClient, sessionId)
  const mcpServers = await loadMcpServers(serviceClient, body.mcpServers, authHeader)
  const tools = await buildMcpTools(mcpServers)

  const result = streamText({
    model: openai(body.model ?? Deno.env.get('OPENAI_MODEL') ?? DEFAULT_MODEL),
    system: body.system ?? DEFAULT_SYSTEM_PROMPT,
    messages: toCoreMessages(history),
    tools,
    stopWhen: stepCountIs(5),
  })

  const encoder = new TextEncoder()
  let assistantText = ''

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of result.textStream) {
          assistantText += delta
          controller.enqueue(encoder.encode(delta))
        }

        await serviceClient.from('agent_memories').insert({
          session_id: sessionId,
          role: 'assistant',
          content: assistantText,
          state: { model: body.model ?? Deno.env.get('OPENAI_MODEL') ?? DEFAULT_MODEL },
        })

        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Agent-Session-Id': sessionId,
    },
  })
})

async function getOrCreateSession(
  supabase: ReturnType<typeof createClient>,
  {
    sessionId,
    userId,
    title,
    metadata,
  }: {
    sessionId?: string
    userId: string
    title: string
    metadata: Record<string, unknown>
  }
) {
  if (sessionId) {
    const { data } = await supabase
      .from('agent_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    return data?.id ?? null
  }

  const { data, error } = await supabase
    .from('agent_sessions')
    .insert({ user_id: userId, title, metadata })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`failed to create agent session: ${error?.message ?? 'unknown error'}`)
  }

  return data.id as string
}

async function loadHistory(
  supabase: ReturnType<typeof createClient>,
  sessionId: string
): Promise<AgentMemory[]> {
  const { data, error } = await supabase
    .from('agent_memories')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(MAX_HISTORY_MESSAGES)

  if (error) {
    throw new Error(`failed to load agent history: ${error.message}`)
  }

  return (data ?? []).reverse() as AgentMemory[]
}

function toCoreMessages(memories: AgentMemory[]): CoreMessage[] {
  return memories
    .filter((memory) => memory.content && memory.role !== 'tool')
    .map((memory) => ({
      role: memory.role === 'assistant' ? 'assistant' : memory.role === 'system' ? 'system' : 'user',
      content: memory.content ?? '',
    }))
}

async function loadMcpServers(
  supabase: ReturnType<typeof createClient>,
  requestServers: AgentMcpServer[] | undefined,
  authHeader: string
): Promise<AgentMcpServer[]> {
  const { data } = await supabase
    .from('agent_mcp_servers')
    .select('name, url, headers')
    .eq('enabled', true)

  const configuredServers = (data ?? []).map((server) => ({
    name: String(server.name),
    url: String(server.url),
    headers: normalizeHeaders(server.headers),
  }))

  const defaultLocalServer = {
    name: 'project',
    url: `${supabaseUrl}/functions/v1/mcp-server`,
    headers: authHeader ? { Authorization: authHeader } : undefined,
  }

  const servers = [...configuredServers, ...(requestServers ?? [])]
  return dedupeServers(servers.length > 0 ? servers : [defaultLocalServer])
}

async function buildMcpTools(servers: AgentMcpServer[]): Promise<ToolSet> {
  const entries = await Promise.all(
    servers.map(async (server) => {
      try {
        const tools = await listMcpTools(server)
        return tools.map((mcpTool) => {
          const name = toAiToolName(server.name, mcpTool.name)

          return [
            name,
            tool({
              description: `[${server.name}] ${mcpTool.description ?? mcpTool.name}`,
              inputSchema: (mcpTool.inputSchema ?? { type: 'object', properties: {} }) as never,
              execute: async (args) => callMcpTool(server, mcpTool.name, args),
            }),
          ] as const
        })
      } catch {
        return []
      }
    })
  )

  return Object.fromEntries(entries.flat())
}

async function listMcpTools(server: AgentMcpServer): Promise<McpToolDefinition[]> {
  await mcpRequest(server, 'initialize', {
    protocolVersion: '2024-11-05',
    clientInfo: { name: 'supabase-agent', version: '0.1.0' },
    capabilities: {},
  })

  const response = await mcpRequest<{ tools: McpToolDefinition[] }>(server, 'tools/list')
  return response.tools ?? []
}

async function callMcpTool(
  server: AgentMcpServer,
  name: string,
  args: unknown
): Promise<unknown> {
  const response = await mcpRequest<{ content?: Array<{ type: string; text?: string }>; isError?: boolean }>(
    server,
    'tools/call',
    {
      name,
      arguments: args,
    }
  )

  if (response.isError) {
    throw new Error(response.content?.map((item) => item.text).filter(Boolean).join('\n') ?? name)
  }

  return response.content?.map((item) => item.text).filter(Boolean).join('\n') ?? response
}

async function mcpRequest<T>(
  server: AgentMcpServer,
  method: string,
  params?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(server.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(server.headers ?? {}),
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method,
      params,
    }),
  })

  if (!response.ok) {
    throw new Error(`MCP server ${server.name} returned HTTP ${response.status}`)
  }

  const payload = (await response.json()) as JsonRpcResponse<T>

  if (payload.error) {
    throw new Error(payload.error.message)
  }

  if (payload.result === undefined) {
    throw new Error(`MCP server ${server.name} returned no result`)
  }

  return payload.result
}

function normalizeHeaders(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined

  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
      .map(([key, headerValue]) => [key, headerValue])
  )
}

function dedupeServers(servers: AgentMcpServer[]): AgentMcpServer[] {
  const seen = new Set<string>()
  return servers.filter((server) => {
    const key = server.name
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function toAiToolName(serverName: string, toolName: string) {
  return `${serverName}_${toolName}`.replace(/[^a-zA-Z0-9_]/g, '_')
}
