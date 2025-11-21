import { tool } from 'ai'
import { z } from 'zod'

export const getRenderingTools = () => ({
  execute_sql: tool({
    description: 'Asks the user to execute a SQL statement and return the results',
    inputSchema: z.object({
      sql: z.string().describe('The SQL statement to execute.'),
      label: z.string().describe('A short 2-4 word label for the SQL statement.'),
      chartConfig: z
        .object({
          view: z.enum(['table', 'chart']).describe('How to render the results after execution'),
          xAxis: z.string().optional().describe('The column to use for the x-axis of the chart.'),
          yAxis: z.string().optional().describe('The column to use for the y-axis of the chart.'),
        })
        .describe('Chart configuration for rendering the results'),
      isWriteQuery: z
        .boolean()
        .describe(
          'Whether the SQL statement performs a write operation of any kind instead of a read operation'
        ),
    }),
  }),
  deploy_edge_function: tool({
    description:
      'Ask the user to deploy a Supabase Edge Function from provided code on the client. Client will confirm before deploying and return the result',
    inputSchema: z.object({
      name: z.string().describe('The URL-friendly name/slug of the Edge Function.'),
      code: z.string().describe('The TypeScript code for the Edge Function.'),
    }),
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
