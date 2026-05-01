import { tool } from 'ai'
import { IS_PLATFORM } from 'common'
import { z } from 'zod'

import { handleError, post } from '@/data/fetchers'
import { executeSql } from '@/data/sql/execute-sql-query'
import {
  EDGE_FUNCTION_PROMPT,
  PG_BEST_PRACTICES,
  REALTIME_PROMPT,
  RLS_PROMPT,
} from '@/lib/ai/prompts'
import { fixSqlBackslashEscapes } from '@/lib/ai/util'
import { executeQuery } from '@/lib/api/self-hosted/query'

const KNOWLEDGE = {
  pg_best_practices: PG_BEST_PRACTICES,
  rls: RLS_PROMPT,
  edge_functions: EDGE_FUNCTION_PROMPT,
  realtime: REALTIME_PROMPT,
} as const

type KnowledgeName = keyof typeof KNOWLEDGE

type StudioToolsContext = {
  projectRef?: string
  connectionString?: string
  authorization?: string
}

export const getStudioTools = (ctx: StudioToolsContext = {}) => {
  const { projectRef, connectionString, authorization } = ctx

  return {
    execute_sql: tool({
      description: 'Execute a SQL statement and return the results',
      needsApproval: true,
      inputSchema: z.object({
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
      }),
      execute: async ({ sql }) => {
        if (!projectRef || !connectionString) {
          throw new Error('projectRef and connectionString are required')
        }

        const { result } = await executeSql(
          { projectRef, connectionString, sql },
          undefined,
          {
            'Content-Type': 'application/json',
            ...(authorization && { Authorization: authorization }),
          },
          IS_PLATFORM ? undefined : executeQuery
        )
        return result
      },
    }),
    deploy_edge_function: tool({
      description:
        'Deploy a Supabase Edge Function from provided code. User will confirm before deploying.',
      needsApproval: true,
      inputSchema: z.object({
        name: z.string().describe('The URL-friendly name/slug of the Edge Function.'),
        code: z.string().describe('The TypeScript code for the Edge Function.'),
      }),
      execute: async ({ name, code }) => {
        if (!projectRef) {
          throw new Error('projectRef is required')
        }

        const { data, error } = await post('/v1/projects/{ref}/functions/deploy', {
          params: { path: { ref: projectRef }, query: { slug: name } },
          headers: authorization ? { Authorization: authorization } : {},
          body: {
            metadata: {
              name,
              entrypoint_path: 'index.ts',
              verify_jwt: true,
            },
            file: [{ name: 'index.ts', content: code }] as any,
          },
          bodySerializer(body) {
            const formData = new FormData()
            formData.append('metadata', JSON.stringify(body.metadata))
            const blob = new Blob([(body.file as any)[0].content], { type: 'text/plain' })
            formData.append('file', blob, 'index.ts')
            return formData
          },
        })

        if (error) handleError(error)
        return { success: true, function: data }
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
      inputSchema: z.object({
        name: z
          .enum(Object.keys(KNOWLEDGE) as [KnowledgeName, ...KnowledgeName[]])
          .describe('The knowledge to load'),
      }),
      execute: ({ name }) => KNOWLEDGE[name],
    }),
  }
}
