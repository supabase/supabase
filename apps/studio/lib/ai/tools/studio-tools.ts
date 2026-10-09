import { acceptUntrustedSql, untrustedSql } from '@supabase/pg-meta'
import { tool } from 'ai'
import { z } from 'zod'

import { deployEdgeFunction } from '@/data/edge-functions/edge-functions-deploy-mutation'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'
import {
  EDGE_FUNCTION_PROMPT,
  LOGS_PROMPT,
  PG_BEST_PRACTICES,
  REALTIME_PROMPT,
  RLS_PROMPT,
  STORAGE_PROMPT,
} from '@/lib/ai/prompts'
import { isOptInLevelAtLeast, updateOptInLevelInputSchema } from '@/lib/ai/tool-filter'
import { NO_DATA_PERMISSIONS } from '@/lib/ai/tools/tool-sanitizer'
import { fixSqlBackslashEscapes } from '@/lib/ai/util'

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
    // Tools that wait on the user use `needsApproval` with a server-side `execute`, not a
    // client tool resolved through `addToolResult`. Client results never land in a Braintrust
    // tool span: https://github.com/supabase/supabase/pull/45654
    execute_sql: tool({
      description:
        'Asks the user to execute a SQL statement and return the results. Requires user approval before executing.',
      inputSchema: executeSqlInputSchema,
      needsApproval: true,
      execute: async ({ sql }, { abortSignal }) => {
        // The `needsApproval: true` gate on this tool means the user has
        // explicitly approved this AI-generated SQL before execute runs —
        // that approval is the user gesture that promotes untrusted to safe.
        const { result } = await executeSql(
          { projectRef, connectionString, sql: acceptUntrustedSql(untrustedSql(sql)) },
          abortSignal,
          authHeaders
        )
        return { rows: Array.isArray(result) ? result : [], optInLevel: aiOptInLevel }
      },
      toModelOutput: ({ output }) => {
        return aiOptInLevel === 'schema_and_log_and_data'
          ? { type: 'json', value: output.rows }
          : { type: 'text', value: NO_DATA_PERMISSIONS }
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

// Rewritten at parse time so the stored input is what the card shows. A level the org already
// has is a review request, and `levelWhenAsked` outlives the user changing the setting.
export const createUpdateOptInLevelInputSchema = (aiOptInLevel: AiOptInLevel) =>
  updateOptInLevelInputSchema.transform(({ requiredLevel }) => ({
    levelWhenAsked: aiOptInLevel,
    ...(requiredLevel && !isOptInLevelAtLeast(aiOptInLevel, requiredLevel) && { requiredLevel }),
  }))

/** Registered at every level so an approval that lands on the top level can still execute. */
export const getOptInTools = ({ aiOptInLevel }: { aiOptInLevel: AiOptInLevel }) => ({
  update_opt_in_level: tool({
    description:
      'Asks the user to review or change the organization-wide AI opt-in level. Call it with `requiredLevel` when a tool needs a higher level than the organization has or you need to read query results. Call it without `requiredLevel` whenever the user asks to change the setting, including lowering it. Do not call it again in the same chat after the user skipped it unless they ask.',
    inputSchema: createUpdateOptInLevelInputSchema(aiOptInLevel),
    needsApproval: true,
    execute: async ({ requiredLevel }) => {
      const sufficient = !requiredLevel || isOptInLevelAtLeast(aiOptInLevel, requiredLevel)
      return {
        levelAfterReview: aiOptInLevel,
        ...(requiredLevel && { sufficient }),
        ...(!sufficient && {
          status: `The opt-in level is still below the requested ${requiredLevel}. If you still need that access, call update_opt_in_level again.`,
        }),
      }
    },
  }),
})
