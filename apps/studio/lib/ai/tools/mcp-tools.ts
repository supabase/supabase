// Type-only import (erased at build time — pulls no runtime code into this route).
import type * as SupabaseMcp from '@supabase/mcp-server-supabase'
import type { ToolSet } from 'ai'

import { createInProcessSupabaseMCPClient, createSupabaseMCPClient } from '../supabase-mcp'
import { filterToolsByOptInLevel, toolSetValidationSchema } from '../tool-filter'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

/**
 * Union of the tool names exposed by the pinned `@supabase/mcp-server-supabase`
 * version. Studio's dependency is bumped in lockstep with the remote MCP server
 * (via automated bump PRs), so typing our tool-name lists against this makes an
 * upstream rename/removal a **compile-time** failure (`pnpm typecheck`) in that
 * PR, instead of a silent capability loss at runtime.
 */
type SupabaseMcpToolName = keyof typeof SupabaseMcp.supabaseMcpToolSchemas

// UI-executed tools handled locally by Studio (see getStudioTools); the remote
// MCP server's versions are removed so the UI-controlled Studio versions win.
const UI_EXECUTED_TOOLS = [
  'execute_sql',
  'deploy_edge_function',
] as const satisfies readonly SupabaseMcpToolName[]

// Read-only tools the assistant relies on from the remote MCP server — the
// MCP-sourced subset of the allowlist in tool-filter.ts (TOOL_CATEGORY_MAP).
// `satisfies` gives the compile-time drift guard; the runtime check below also
// catches a deployed server that returns fewer tools (feature flags / version
// skew). The allowlist remains the source of truth for what is allowed.
const EXPECTED_MCP_TOOLS = [
  'search_docs',
  'list_tables',
  'list_extensions',
  'list_edge_functions',
  'list_branches',
  'get_advisors',
  'get_logs',
] as const satisfies readonly SupabaseMcpToolName[]

export const getMcpTools = async ({
  accessToken,
  projectRef,
  aiOptInLevel,
  signal,
}: {
  accessToken: string
  projectRef: string
  aiOptInLevel: AiOptInLevel
  // Required: the remote client holds an HTTP connection that must be torn down
  // when the request ends. The caller owns that lifecycle via this signal.
  signal: AbortSignal
}) => {
  // Connect to the MCP server and fetch its tools, which replace the old local
  // tools. `USE_REMOTE_MCP` gates the transport: the remote HTTP server (target
  // state) or the legacy in-process server (fallback during the migration),
  // defaulting to in-process until an environment opts in. Flip it per
  // environment (staging → prod → Nimbus) once each one's prerequisites are met
  // (dashboard-token support on the MCP API, remote MCP enabled for Nimbus);
  // unset to roll back on the next deploy. Both transports expose the same tool
  // surface, so the filtering, drift detection, and lifecycle handling below are
  // transport-agnostic.
  //
  // TODO(AI-897): remove in process mcp — once every environment has been
  // flipped and is stable, delete `createInProcessSupabaseMCPClient` and this
  // fallback branch.
  const useRemoteMcp = process.env.USE_REMOTE_MCP === 'true'
  const createClient = useRemoteMcp ? createSupabaseMCPClient : createInProcessSupabaseMCPClient
  const mcpClient = await createClient({
    accessToken,
    projectRef,
  })

  // The remote client keeps an HTTP connection open. The tools' `execute`
  // functions are invoked later, while the response is streaming, so the
  // connection must stay open until the request ends. Close it exactly once when
  // the request is done (normal completion or abort) to avoid leaking a
  // connection per request.
  let closed = false
  const closeClient = () => {
    if (closed) return
    closed = true
    void mcpClient.close().catch(() => {})
  }

  // The request already ended before we could fetch tools; don't bother.
  if (signal.aborted) {
    closeClient()
    return {} as ToolSet
  }
  signal.addEventListener('abort', closeClient, { once: true })

  try {
    const availableMcpTools = (await mcpClient.tools()) as ToolSet

    // Runtime drift detection: `EXPECTED_MCP_TOOLS` is compile-time-checked
    // against the pinned package (see its declaration), but the *deployed* remote
    // server can still return fewer tools than the pinned types — feature flags,
    // killswitches, or version skew during a bump. `filterToolsByOptInLevel`
    // drops missing tools silently, so warn to make that observable.
    const missingExpectedTools = EXPECTED_MCP_TOOLS.filter((name) => !(name in availableMcpTools))
    if (missingExpectedTools.length > 0) {
      console.error(
        `Remote MCP server is missing expected tools: ${missingExpectedTools.join(', ')}. ` +
          'The tool contract may have drifted; the assistant will operate without them.'
      )
    }

    // Safety gate: `filterToolsByOptInLevel` keeps only tools in the allowlist
    // (tool-filter.ts TOOL_CATEGORY_MAP) and drops everything else. This — not
    // the `read_only` query param — is what prevents the remote server's
    // write/destructive tools (apply_migration, create_branch, ...) from reaching
    // the assistant. `read_only` is defense-in-depth (those tools throw at
    // runtime). Do not remove this filter on the assumption `read_only` suffices.
    const allowedMcpTools = filterToolsByOptInLevel(availableMcpTools, aiOptInLevel)

    // Remove UI-executed tools handled locally
    const filteredMcpTools: ToolSet = { ...allowedMcpTools }
    UI_EXECUTED_TOOLS.forEach((toolName) => {
      delete filteredMcpTools[toolName]
    })

    // Validate that only known tools are provided
    const validation = toolSetValidationSchema.safeParse(filteredMcpTools)
    if (!validation.success) {
      console.error('MCP tools validation error:', validation.error)
      throw new Error('Internal error: MCP tools validation failed')
    }

    return validation.data
  } catch (error) {
    // Don't leak the connection if fetching or validating tools fails
    closeClient()
    throw error
  }
}
