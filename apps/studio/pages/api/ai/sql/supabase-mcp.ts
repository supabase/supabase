import { createSupabaseApiPlatform, createSupabaseMcpServer } from '@supabase/mcp-server-supabase'
import { StreamTransport } from '@supabase/mcp-utils'
import {
  experimental_createMCPClient as createMCPClient,
  Tool,
  ToolExecutionOptions,
  ToolSet,
} from 'ai'
import { z } from 'zod'

import { AiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { API_URL } from 'lib/constants'

export async function createSupabaseMCPClient({
  accessToken,
  projectId,
}: {
  accessToken: string
  projectId: string
}) {
  // Create an in-memory transport pair
  const clientTransport = new StreamTransport()
  const serverTransport = new StreamTransport()
  clientTransport.readable.pipeTo(serverTransport.writable)
  serverTransport.readable.pipeTo(clientTransport.writable)

  // Instantiate the MCP server and connect to its transport
  const apiUrl = API_URL?.replace('/platform', '')
  const server = createSupabaseMcpServer({
    platform: createSupabaseApiPlatform({
      accessToken,
      apiUrl,
    }),
    projectId,
    readOnly: true,
  })
  await server.connect(serverTransport)

  // Create the MCP client and connect to its transport
  const client = await createMCPClient({
    name: 'supabase-studio',
    transport: clientTransport,
  })

  return client
}

const basicToolSchema = z.custom<Tool>((value) => typeof value === 'object')

/**
 * Schema to validate that the expected tools are available from the Supabase MCP.
 *
 * Note that tool structure itself is not validated, only that the tools exist.
 */
export const expectedToolsSchema = z.object({
  list_tables: basicToolSchema,
  list_extensions: basicToolSchema,
  list_edge_functions: basicToolSchema,
  list_branches: basicToolSchema,
  get_logs: basicToolSchema,
  execute_sql: basicToolSchema,
})

export const toolWhitelist = Object.keys(expectedToolsSchema.shape)

export function createPrivacyMessageTool(toolInstance: Tool<any, any>) {
  const privacyMessage =
    "You don't have permission to use this tool. This is an organization-wide setting requiring you to opt-in. Please choose your preferred data sharing level in your organization's settings. Supabase Assistant uses Amazon Bedrock, which does not store or log your prompts and completions, use them to train AWS models, or distribute them to third parties. By default, no data is shared. Granting permission allows Supabase to send information (like schema, logs, or data, depending on your chosen level) to Bedrock solely to generate responses."
  const condensedPrivacyMessage =
    'Requires opting in to sending data to Bedrock which does not store, train on, or distribute it. You can opt in via organization settings.'

  return {
    ...toolInstance,
    description: `${toolInstance.description} (Note: ${condensedPrivacyMessage})`,
    execute: async (_args: any, _context: any) => ({ status: privacyMessage }),
  }
}

export function filterToolsByOptInLevel(tools: ToolSet, aiOptInLevel: AiOptInLevel) {
  // Get allowed tools based on the AI opt-in level
  const allowedTools = getAllowedTools(aiOptInLevel)

  // Filter the tools to only include those that are allowed
  return Object.fromEntries(
    Object.entries(tools)
      .filter(([key]) => toolWhitelist.includes(key))
      .map(([key, toolInstance]) => {
        if (allowedTools.includes(key)) {
          return [key, toolInstance]
        }

        // If the tool is not allowed, provide a stub that returns a privacy message
        return [key, createPrivacyMessageTool(toolInstance)]
      })
  )
}

/**
 * Transforms the result of a tool execution to a new output.
 */
export function transformToolResult<OriginalResult, NewResult>(
  tool: Tool<any, OriginalResult>,
  execute: (result: OriginalResult) => NewResult
): Tool<any, NewResult> {
  if (!tool) {
    throw new Error('Tool is required')
  }

  if (!tool.execute) {
    throw new Error('Tool does not have an execute function')
  }

  // Intercept the tool to add a custom execute function
  return {
    ...tool,
    execute: async (args: any, options: ToolExecutionOptions) => {
      const result = await tool.execute!(args, options)
      return execute(result)
    },
  } as Tool<any, NewResult>
}

export function getAllowedTools(aiOptInLevel: AiOptInLevel) {
  // Build allowed tools based on permission level
  const allowedTools: string[] = []

  // For schema and above permission levels
  if (
    aiOptInLevel === 'schema' ||
    aiOptInLevel === 'schema_and_log' ||
    aiOptInLevel === 'schema_and_log_and_data'
  ) {
    allowedTools.push('list_tables', 'list_extensions', 'list_edge_functions', 'list_branches')
  }

  // For schema_and_log permission level, add log access tools
  if (aiOptInLevel === 'schema_and_log' || aiOptInLevel === 'schema_and_log_and_data') {
    allowedTools.push('get_logs')
  }

  // For schema_and_log_and_data permission level, add data access tools
  if (aiOptInLevel === 'schema_and_log_and_data') {
    allowedTools.push('execute_sql')
  }

  return allowedTools
}
