import { ToolSet } from 'ai'
import { getMcpTools } from './mcp-tools'
import { getRenderingTools } from './rendering-tools'

/**
 * For evals. See `index.ts` for the real tools
 */
export async function getMockTools() {
  // Always include rendering tools
  let tools: ToolSet = getRenderingTools()

  const mcpTools = await getMcpTools({
    accessToken: 'mock-access-token',
    projectRef: 'mock-project-ref',
    aiOptInLevel: 'schema_and_log_and_data',
  })

  // Override execute handlers for all MCP tools to return mock responses
  const mockedMcpTools = Object.fromEntries(
    Object.entries(mcpTools).map(([name, baseTool]) => [
      name,
      {
        ...baseTool,
        execute: async () => ({ status: 'successful' }),
      },
    ])
  ) as ToolSet

  tools = {
    ...tools,
    ...mockedMcpTools,
  }

  return tools
}
