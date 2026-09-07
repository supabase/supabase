import { withToolPolicy } from '@supabase/agent-runtime'
import { acceptUntrustedSql, untrustedSql, type SafeSqlFragment } from '@supabase/pg-meta'
import { tool } from 'ai'
import { z } from 'zod'

import type { ProjectPermissionLevel } from '../../permissions'
import { fixSqlBackslashEscapes } from '../util'
import { assistantToolPolicies } from './tool-policies'

export const executeSqlInputSchema = z.object({
  // Transform at parse time so the corrected SQL is what gets stored in
  // toolCall.input — ensuring evals and logs reflect what actually runs.
  sql: z.string().describe('The SQL statement to execute.').transform(fixSqlBackslashEscapes),
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
    .default(false)
    .describe(
      'Whether the SQL statement performs a write operation or has side effects. Set true for INSERT/UPDATE/DELETE/DDL and for SELECT statements that call side-effecting functions, such as select cron.schedule(...), cron.unschedule(...), or functions that create, modify, schedule, enqueue, notify, or trigger work.'
    ),
})

export type ManagementApi = {
  runQuery: (sql: SafeSqlFragment, opts?: { readOnly?: boolean }) => Promise<unknown>
  deployFunction: (input: { slug: string; code: string; name: string }) => Promise<unknown>
}

export function getProjectToolDefinitions({
  managementApi,
  executeOperation,
}: {
  managementApi: ManagementApi
  executeOperation: (
    id: string,
    name: string,
    input: unknown,
    execute: () => Promise<unknown>
  ) => Promise<unknown>
}) {
  return {
    execute_sql: tool({
      description:
        'Asks the user to execute a SQL statement and return the results. Requires user approval before executing.',
      inputSchema: executeSqlInputSchema,
      needsApproval: true,
      execute: async (input, { toolCallId }) =>
        executeOperation(toolCallId, 'execute_sql', input, () =>
          managementApi.runQuery(acceptUntrustedSql(untrustedSql(input.sql)), {
            readOnly: !input.isWriteQuery,
          })
        ),
    }),
    deploy_edge_function: tool({
      description:
        'Asks the user to deploy a Supabase Edge Function from provided code. Requires user approval before deploying.',
      inputSchema: z.object({
        name: z.string().describe('The URL-friendly name/slug of the Edge Function.'),
        code: z.string().describe('The TypeScript code for the Edge Function.'),
      }),
      needsApproval: true,
      execute: async (input, { toolCallId }) =>
        executeOperation(toolCallId, 'deploy_edge_function', input, async () => {
          await managementApi.deployFunction({
            slug: input.name,
            code: input.code,
            name: input.name,
          })
          return { success: true }
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
  }
}

/** Apply the same application policy when using these tools outside the full agent. */
export function getProjectTools({
  aiOptInLevel,
  ...options
}: Parameters<typeof getProjectToolDefinitions>[0] & {
  aiOptInLevel: ProjectPermissionLevel
}) {
  return withToolPolicy(getProjectToolDefinitions(options), {
    context: aiOptInLevel,
    policies: assistantToolPolicies,
  })
}
