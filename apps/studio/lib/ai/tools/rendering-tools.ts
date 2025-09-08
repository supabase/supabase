import { tool } from 'ai'
import { z } from 'zod'

export const getRenderingTools = () => ({
  execute_sql: tool({
    description:
      'Execute a SQL statement on the client. Use for SELECT/DDL/DML. Client will confirm before running and return results.',
    inputSchema: z.object({
      sql: z.string().describe('The SQL statement to execute.'),
    }),
    // No execute – runs client-side in the UI
  }),
  deploy_edge_function: tool({
    description:
      'Deploy a Supabase Edge Function from provided code on the client. Client will confirm before deploying and return the result.',
    inputSchema: z.object({
      name: z.string().describe('The URL-friendly name/slug of the Edge Function.'),
      code: z.string().describe('The TypeScript code for the Edge Function.'),
    }),
    // No execute – runs client-side in the UI
  }),
  display_query: tool({
    description:
      'Displays SQL query results (table or chart) or renders SQL for write/DDL operations. Use this for all query display needs. Optionally references a previous execute_sql call via manualToolCallId for displaying SELECT results.',
    inputSchema: z.object({
      manualToolCallId: z
        .string()
        .optional()
        .describe('The manual ID from the corresponding execute_sql result (for SELECT queries).'),
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
    }),
    execute: async (args) => {
      const statusMessage = args.manualToolCallId
        ? 'Tool call sent to client for rendering SELECT results.'
        : 'Tool call sent to client for rendering write/DDL query.'
      return { status: statusMessage }
    },
  }),
  display_edge_function: tool({
    description: 'Renders the code for a Supabase Edge Function for the user to deploy manually.',
    inputSchema: z.object({
      name: z
        .string()
        .describe('The URL-friendly name of the Edge Function (e.g., "my-function").'),
      code: z.string().describe('The TypeScript code for the Edge Function.'),
    }),
    execute: async () => {
      return { status: 'Tool call sent to client for rendering.' }
    },
  }),
  rename_chat: tool({
    description: `Rename the current chat session when the current chat name doesn't describe the conversation topic.`,
    inputSchema: z.object({
      newName: z.string().describe('The new name for the chat session. Five words or less.'),
    }),
    execute: async () => {
      return { status: 'Chat request sent to client' }
    },
  }),
})
