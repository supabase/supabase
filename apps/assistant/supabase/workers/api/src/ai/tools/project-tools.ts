import { acceptUntrustedSql, untrustedSql } from '@supabase/pg-meta'
import { tool } from 'ai'
import { z } from 'zod'

import {
  EDGE_FUNCTION_PROMPT,
  LOGS_PROMPT,
  PG_BEST_PRACTICES,
  REALTIME_PROMPT,
  RLS_PROMPT,
  STORAGE_PROMPT,
} from '../prompts'
import { fixSqlBackslashEscapes } from '../util'

const KNOWLEDGE = {
  pg_best_practices: PG_BEST_PRACTICES,
  rls: RLS_PROMPT,
  storage: STORAGE_PROMPT,
  edge_functions: EDGE_FUNCTION_PROMPT,
  realtime: REALTIME_PROMPT,
  logs: LOGS_PROMPT,
} as const

type KnowledgeName = keyof typeof KNOWLEDGE

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

export const loadKnowledgeInputSchema = z.object({
  name: z
    .enum(Object.keys(KNOWLEDGE) as [KnowledgeName, ...KnowledgeName[]])
    .describe('The knowledge to load'),
})

export type ManagementApi = {
  runQuery: (sql: string, opts?: { readOnly?: boolean }) => Promise<any>
  deployFunction: (input: { slug: string; code: string; name: string }) => Promise<any>
}

export function getProjectTools({
  managementApi,
}: {
  projectRef: string
  oauthToken: string
  managementApi: ManagementApi
}) {
  return {
    execute_sql: tool({
      description:
        'Asks the user to execute a SQL statement and return the results. Requires user approval before executing.',
      inputSchema: executeSqlInputSchema,
      needsApproval: true,
      execute: async ({ sql }) => {
        // needsApproval: true is the user gesture that promotes LLM SQL to executable.
        return managementApi.runQuery(acceptUntrustedSql(untrustedSql(sql)))
      },
      toModelOutput: ({ output }: { output: any }) => {
        return { type: 'json' as const, value: output }
      },
    }),
    deploy_edge_function: tool({
      description:
        'Asks the user to deploy a Supabase Edge Function from provided code. Requires user approval before deploying.',
      inputSchema: z.object({
        name: z.string().describe('The URL-friendly name/slug of the Edge Function.'),
        code: z.string().describe('The TypeScript code for the Edge Function.'),
      }),
      needsApproval: true,
      execute: async ({ name, code }) => {
        await managementApi.deployFunction({ slug: name, code, name })
        return { success: true }
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
    load_knowledge: tool({
      description:
        'Load detailed knowledge about a Supabase topic before answering questions about it.',
      inputSchema: loadKnowledgeInputSchema,
      execute: ({ name }) => KNOWLEDGE[name],
    }),
  }
}
