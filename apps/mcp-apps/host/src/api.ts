import type {
  CallToolResult,
  ListToolsResult,
  ReadResourceResult,
  Tool,
} from '@modelcontextprotocol/sdk/types.js'
import type { ModelMessage } from 'ai'

export type { CallToolResult, Tool }

export interface HostPublicConfig {
  mcpUrl: string
  mcpQuery: Record<string, string>
  hasAccessToken: boolean
  model: string | null
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await response.json()
  if (!response.ok) throw new Error(json.error ?? `HTTP ${response.status}`)
  return json as T
}

export async function getConfig(): Promise<HostPublicConfig> {
  const response = await fetch('/api/host/config')
  return response.json()
}

export const mcp = {
  listTools: () => post<ListToolsResult>('/api/host/mcp', { method: 'tools/list' }),
  callTool: (name: string, args: Record<string, unknown> = {}) =>
    post<CallToolResult>('/api/host/mcp', {
      method: 'tools/call',
      params: { name, arguments: args },
    }),
  readResource: (uri: string) =>
    post<ReadResourceResult>('/api/host/mcp', { method: 'resources/read', params: { uri } }),
  request: (method: string, params: unknown) =>
    post<Record<string, unknown>>('/api/host/mcp', { method, params }),
}

export interface ModelToolCall {
  toolCallId: string
  toolName: string
  input: unknown
}

export interface ModelStep {
  text: string
  toolCalls: ModelToolCall[]
  messages: ModelMessage[]
  finishReason: string
}

export function runModelStep(request: {
  system: string
  messages: ModelMessage[]
  tools: { name: string; description?: string; inputSchema: Record<string, unknown> }[]
}) {
  return post<ModelStep>('/api/host/model', request)
}

// ---- tool metadata -----------------------------------------------------------

type UiMeta = {
  resourceUri?: string
  visibility?: ('model' | 'app')[]
}

export function uiMeta(tool: Tool | undefined): UiMeta {
  return ((tool?._meta as Record<string, unknown> | undefined)?.ui ?? {}) as UiMeta
}

/** Model-visible unless the server limits the tool to views. */
export function isModelVisible(tool: Tool) {
  const visibility = uiMeta(tool).visibility
  return !visibility || visibility.includes('model')
}

/** Views may call a tool only when the server allows it. */
export function isAppVisible(tool: Tool) {
  const visibility = uiMeta(tool).visibility
  return !visibility || visibility.includes('app')
}

export function openaiUi(tool: Tool | undefined) {
  return ((tool?._meta as Record<string, unknown> | undefined)?.['openai/ui'] ?? {}) as {
    entrypoints?: { type: 'global' | 'thread' }[]
    preferredModelDisplayMode?: 'inline' | 'fullscreen'
  }
}
