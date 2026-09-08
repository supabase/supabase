import type { McpServer } from 'npm:@modelcontextprotocol/server@2.0.0'

import { registerTaskTools } from './tasks.ts'
import type { ToolContext } from './types.ts'
import { registerWhoamiTool } from './whoami.ts'

export type { ToolContext } from './types.ts'

// Add your product's tool modules here. The shared MCP runtime supplies the
// authenticated context for each request.
export function registerTools(server: McpServer, context: ToolContext): void {
  registerWhoamiTool(server, context)
  registerTaskTools(server, context)
}
