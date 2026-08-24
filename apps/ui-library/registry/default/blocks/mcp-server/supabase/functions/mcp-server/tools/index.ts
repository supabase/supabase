import type { McpServer } from 'npm:@modelcontextprotocol/sdk@1.29.0/server/mcp'

import type { ToolContext, Toolset } from './types.ts'
import { whoamiToolset } from './whoami.ts'

export type { ToolContext, Toolset } from './types.ts'

// The single tool registry. Add each installed or custom toolset here. The
// explicit array makes composition visible and rejects duplicate names instead
// of allowing import order to silently replace a toolset.
const toolRegistry: readonly Toolset[] = [whoamiToolset]

export const toolsetNames = toolRegistry.map(({ name }) => name)
const duplicate = toolsetNames.find((name, index) => toolsetNames.indexOf(name) !== index)
if (duplicate) throw new Error(`Duplicate MCP toolset name: ${duplicate}`)

/** Register every toolset against a server bound to one caller. */
export async function applyToolsets(server: McpServer, context: ToolContext): Promise<void> {
  for (const toolset of toolRegistry) {
    await toolset.register(server, context)
  }
}
