import { acceptUntrustedSql, untrustedSql } from '@supabase/pg-meta'
import { tool } from 'ai'
import { z } from 'zod'

import { deployEdgeFunction } from '@/data/edge-functions/edge-functions-deploy-mutation'
import { executeSql } from '@/data/sql/execute-sql-query'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'
import {
  EDGE_FUNCTION_PROMPT,
  PG_BEST_PRACTICES,
  REALTIME_PROMPT,
  RLS_PROMPT,
} from '@/lib/ai/prompts'
import { NO_DATA_PERMISSIONS } from '@/lib/ai/tools/tool-sanitizer'
import { fixSqlBackslashEscapes } from '@/lib/ai/util'

const KNOWLEDGE = {
  pg_best_practices: PG_BEST_PRACTICES,
  rls: RLS_PROMPT,
  edge_functions: EDGE_FUNCTION_PROMPT,
  realtime: REALTIME_PROMPT,
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
      'Whether the SQL statement performs a write operation of any kind instead of a read operation'
    ),
})

export const loadKnowledgeInputSchema = z.object({
  name: z
    .enum(Object.keys(KNOWLEDGE) as [KnowledgeName, ...KnowledgeName[]])
    .describe('The knowledge to load'),
})

export type StudioToolsContext = {
  projectRef?: string
  connectionString?: string
  authorization?: string
  aiOptInLevel?: AiOptInLevel
}

export const getStudioTools = (ctx: StudioToolsContext = {}) => {
  const { projectRef, connectionString, authorization, aiOptInLevel = 'schema' } = ctx
  const authHeaders = authorization
    ? { 'Content-Type': 'application/json', Authorization: authorization }
    : undefined

  return {
    execute_sql: tool({
      description:
        'Asks the user to execute a SQL statement and return the results. Requires user approval before executing.',
      inputSchema: executeSqlInputSchema,
      needsApproval: true,
      execute: async ({ sql }) => {
        // The `needsApproval: true` gate on this tool means the user has
        // explicitly approved this AI-generated SQL before execute runs —
        // that approval is the user gesture that promotes untrusted to safe.
        const { result } = await executeSql(
          { projectRef, connectionString, sql: acceptUntrustedSql(untrustedSql(sql)) },
          undefined,
          authHeaders
        )
        return aiOptInLevel === 'schema_and_log_and_data' ? result : NO_DATA_PERMISSIONS
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
        await deployEdgeFunction({
          projectRef: projectRef ?? '',
          slug: name,
          metadata: {
            entrypoint_path: 'index.ts',
            name,
            verify_jwt: true,
          },
          files: [{ name: 'index.ts', content: code }],
          authorization,
        })
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
