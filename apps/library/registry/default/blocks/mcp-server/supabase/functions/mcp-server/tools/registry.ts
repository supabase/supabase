import type { McpServer } from 'npm:@modelcontextprotocol/sdk@1.29.0/server/mcp'

import type { ToolContext } from './types.ts'

// The toolset registry.
//
// A toolset is a named group of MCP tools that registers itself against a
// per-request McpServer. Keeping registration behind this registry means the
// framework never imports a specific tool, and a toolset can be added, replaced,
// or switched off without touching the transport or auth code.
//
// Registration happens once at module scope (see ./index.ts). Application
// happens per request, because each request builds its own McpServer bound to
// the caller's identity.

export type Toolset = {
  /** Stable id. Used by MCP_TOOLSETS and in logs. Registering the same name twice replaces the first. */
  name: string
  /** One line, for logs and the registry listing. Not shown to MCP clients. */
  description?: string
  /**
   * Add this toolset's tools to a server instance. Async is supported for
   * toolsets that need to look something up before they know their tools —
   * see the PostgREST toolset, which reads the API schema.
   */
  register: (server: McpServer, context: ToolContext) => void | Promise<void>
}

const toolsets = new Map<string, Toolset>()

/** Add a toolset, replacing any earlier one with the same name. */
export function registerToolset(toolset: Toolset): void {
  toolsets.set(toolset.name, toolset)
}

/** Every registered toolset, in registration order. */
export function listToolsets(): Toolset[] {
  return [...toolsets.values()]
}

/**
 * Toolset names allowed by MCP_TOOLSETS, or null when the variable is unset and
 * everything is allowed. Set it to run one function with a narrower surface,
 * for example MCP_TOOLSETS=postgrest.
 */
function allowedToolsets(): Set<string> | null {
  const configured = Deno.env.get('MCP_TOOLSETS')?.trim()
  if (!configured) return null

  return new Set(
    configured
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
  )
}

/**
 * Register every enabled toolset against one server instance. Returns the names
 * that were applied, which the caller logs so a misconfigured MCP_TOOLSETS is
 * visible in function logs rather than showing up as missing tools.
 */
export async function applyToolsets(server: McpServer, context: ToolContext): Promise<string[]> {
  const allowed = allowedToolsets()
  const applied: string[] = []

  for (const toolset of toolsets.values()) {
    if (allowed && !allowed.has(toolset.name)) continue
    await toolset.register(server, context)
    applied.push(toolset.name)
  }

  if (allowed) {
    const unknown = [...allowed].filter((name) => !toolsets.has(name))
    if (unknown.length) {
      console.warn(`MCP_TOOLSETS names unregistered toolsets: ${unknown.join(', ')}`)
    }
  }

  return applied
}
