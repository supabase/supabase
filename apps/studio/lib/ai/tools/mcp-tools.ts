// Type-only import (erased at build time — pulls no runtime code into this route).
import type * as SupabaseMcp from '@supabase/mcp-server-supabase'
import type { ToolSet } from 'ai'

import { createSupabaseMCPClient } from '../supabase-mcp'
import { filterToolsByOptInLevel, toolSetValidationSchema } from '../tool-filter'
import { REMOTE_TOOL_CONTRACTS } from './registry'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

/**
 * Union of the tool names exposed by the pinned `@supabase/mcp-server-supabase`
 * version. Studio's dependency is bumped in lockstep with the remote MCP server
 * (via automated bump PRs), so typing our tool-name lists against this makes an
 * upstream rename/removal a **compile-time** failure (`pnpm typecheck`) in that
 * PR, instead of a silent capability loss at runtime.
 */
type SupabaseMcpToolName = keyof typeof SupabaseMcp.supabaseMcpToolSchemas

// The remote tools the assistant relies on: those with a remote contract. Typing the names as
// `SupabaseMcpToolName` makes an upstream rename/removal a compile-time failure; the runtime
// check below also catches a deployed server that returns fewer tools (feature flags / version
// skew).
const EXPECTED_MCP_TOOLS: readonly SupabaseMcpToolName[] = Object.values(REMOTE_TOOL_CONTRACTS).map(
  ({ name }) => name
)

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
  // Connect to the remote MCP server over HTTP and fetch its tools, replacing
  // the local tools. A remote failure (outage, timeout, auth) degrades to the
  // remaining tools in `getTools` rather than breaking the assistant.
  const mcpClient = await createSupabaseMCPClient({
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
    const remoteTools = (await mcpClient.tools()) as ToolSet

    // Only tools with a remote contract get through, checked before the opt-in filter: local
    // contracts share names with remote tools (`execute_sql`, `deploy_edge_function`), so the
    // filter alone would let the remote versions in.
    const availableMcpTools: ToolSet = {}
    for (const contract of Object.values(REMOTE_TOOL_CONTRACTS)) {
      if (!(contract.name in remoteTools)) continue
      // Reject a malformed entry here: if the opt-in filter below stubbed it, the spread would
      // turn it into an object and it would pass validation.
      const remoteTool = remoteTools[contract.name]
      if (typeof remoteTool !== 'object' || remoteTool === null) {
        console.error(`MCP tool ${contract.name} is not an object`)
        throw new Error('Internal error: MCP tools validation failed')
      }
      availableMcpTools[contract.name] = { ...remoteTool, needsApproval: contract.needsApproval }
    }

    // Runtime drift detection: `EXPECTED_MCP_TOOLS` is compile-time-checked
    // against the pinned package (see its declaration), but the *deployed* remote
    // server can still return fewer tools than the pinned types — feature flags,
    // killswitches, or version skew during a bump. A missing tool just drops
    // out of the selection above, so warn to make that observable.
    const missingExpectedTools = EXPECTED_MCP_TOOLS.filter((name) => !(name in availableMcpTools))
    if (missingExpectedTools.length > 0) {
      console.error(
        `Remote MCP server is missing expected tools: ${missingExpectedTools.join(', ')}. ` +
          'The tool contract may have drifted; the assistant will operate without them.'
      )
    }

    // Safety gate: the remote-contract selection above keeps only tools Studio declares and
    // drops everything else. This, not the `read_only` query param, is what prevents the remote
    // server's write/destructive tools (apply_migration, create_branch, ...) from reaching the
    // assistant. `read_only` is defense-in-depth (those tools throw at runtime). Do not remove
    // the selection on the assumption `read_only` suffices.
    const allowedMcpTools = filterToolsByOptInLevel(availableMcpTools, aiOptInLevel)

    // Validate that only known tools are provided
    const validation = toolSetValidationSchema.safeParse(allowedMcpTools)
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
