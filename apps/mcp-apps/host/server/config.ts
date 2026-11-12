/**
 * Configuration for the local MCP Apps host, read from the environment (and
 * `apps/mcp-apps/.env.host` when present, see README). Nothing here reaches the
 * browser except what `publicConfig` returns.
 */
import { join } from 'node:path'

import { loadEnvFile } from './env.mjs'

export interface HostConfig {
  /** Streamable HTTP endpoint of the Supabase MCP server, with any query parameters. */
  mcpUrl: string
  accessToken?: string
  /** `<provider>:<model>`, e.g. `bedrock:us.anthropic.claude-sonnet-4-5-20250929-v1:0`. Unset runs without a model. */
  model?: string
  modelBaseUrl?: string
  modelApiKey?: string
}

export function readHostConfig(root: string): HostConfig {
  loadEnvFile(join(root, '.env.host'))
  return {
    mcpUrl: process.env.MCP_SERVER_URL ?? 'http://127.0.0.1:3111/mcp',
    accessToken: process.env.SUPABASE_ACCESS_TOKEN,
    model: process.env.HOST_MODEL || undefined,
    modelBaseUrl: process.env.HOST_MODEL_BASE_URL || undefined,
    modelApiKey: process.env.HOST_MODEL_API_KEY || undefined,
  }
}

export function publicConfig(config: HostConfig) {
  const url = new URL(config.mcpUrl)
  return {
    mcpUrl: `${url.origin}${url.pathname}`,
    mcpQuery: Object.fromEntries(url.searchParams),
    hasAccessToken: !!config.accessToken,
    model: config.model ?? null,
  }
}
