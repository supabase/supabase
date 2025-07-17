import { CoreMessage, LanguageModel, streamText, tool, ToolSet } from 'ai'
import { z } from 'zod'

import { filterToolsByOptInLevel, toolSetValidationSchema } from './tool-filter'
import { createSupabaseMCPClient } from './supabase-mcp'
import { system } from './prompt'

export const systemPrompt = system

export async function generateAssistantResponse({
  messages,
  projectRef,
  connectionString,
  accessToken,
  isPlatform,
  chatName,
  model,
  aiOptInLevel,
  apiUrl,
  additionalTools,
}: {
  messages: CoreMessage[]
  projectRef: string
  connectionString?: string
  chatName: string
  accessToken: string
  model: LanguageModel
  isPlatform: boolean
  aiOptInLevel: string
  apiUrl: string
  additionalTools: ToolSet
}) {
  try {
    const authorization = `Bearer ${accessToken}`

    let mcpTools: ToolSet = {}
    let localTools: ToolSet = {
      display_query: tool({
        description:
          'Displays SQL query results (table or chart) or renders SQL for write/DDL operations. Use this for all query display needs. Optionally references a previous execute_sql call via manualToolCallId for displaying SELECT results.',
        parameters: z.object({
          manualToolCallId: z
            .string()
            .optional()
            .describe(
              'The manual ID from the corresponding execute_sql result (for SELECT queries).'
            ),
          sql: z.string().describe('The SQL query.'),
          label: z
            .string()
            .describe(
              'The title or label for this query block (e.g., "Users Over Time", "Create Users Table").'
            ),
          view: z
            .enum(['table', 'chart'])
            .optional()
            .describe(
              'Display mode for SELECT results: table or chart. Required if manualToolCallId is provided.'
            ),
          xAxis: z.string().optional().describe('Key for the x-axis (required if view is chart).'),
          yAxis: z.string().optional().describe('Key for the y-axis (required if view is chart).'),
          runQuery: z
            .boolean()
            .optional()
            .describe(
              'Whether to automatically run the query. Set to true for read-only queries when manualToolCallId does not exist due to permissions. Should be false for write/DDL operations.'
            ),
        }),
        execute: async (args) => {
          const statusMessage = args.manualToolCallId
            ? 'Tool call sent to client for rendering SELECT results.'
            : 'Tool call sent to client for rendering write/DDL query.'
          return { status: statusMessage }
        },
      }),
      display_edge_function: tool({
        description:
          'Renders the code for a Supabase Edge Function for the user to deploy manually.',
        parameters: z.object({
          name: z
            .string()
            .describe('The URL-friendly name of the Edge Function (e.g., "my-function").'),
          code: z.string().describe('The TypeScript code for the Edge Function.'),
        }),
        execute: async () => {
          return { status: 'Tool call sent to client for rendering.' }
        },
      }),
    }
    // if (accessToken) {
    //   // If platform, fetch MCP client and tools which replace old local tools
    //   const mcpClient = await createSupabaseMCPClient({
    //     accessToken,
    //     projectId: projectRef,
    //     apiUrl,
    //   })

    //   console.log('mcpClient', mcpClient)

    //   const availableMcpTools = await mcpClient.tools()
    //   // Filter tools based on the (potentially modified) AI opt-in level
    //   const allowedMcpTools = filterToolsByOptInLevel(availableMcpTools, aiOptInLevel)

    //   // Validate that only known tools are provided
    //   const { data: validatedTools, error: validationError } =
    //     toolSetValidationSchema.safeParse(allowedMcpTools)

    //   if (validationError) {
    //     console.error('MCP tools validation error:', validationError)
    //     return {
    //       error: 'Internal error: MCP tools validation failed',
    //       issues: validationError.issues,
    //     }
    //   }

    //   mcpTools = { ...validatedTools }
    // }

    // Filter local tools based on the (potentially modified) AI opt-in level
    const filteredLocalTools = filterToolsByOptInLevel(
      { ...localTools, ...additionalTools },
      aiOptInLevel
    )

    // Combine MCP tools with filtered local tools
    const tools: ToolSet = {
      ...mcpTools,
      ...filteredLocalTools,
    }

    return streamText({
      model,
      system: 'Help the user with their Supabase project',
      maxSteps: 5,
      messages,
      tools,
    })
  } catch (error) {
    console.error('Error in generateAssistantResponse:', error)
    throw error
  }
}
