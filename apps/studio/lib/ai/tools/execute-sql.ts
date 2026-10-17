import { z } from 'zod'

import { executeSqlOutputSchema, toModelExecuteSqlOutput } from './execute-sql-output'
import type { ToolContract } from './types'
import { fixSqlBackslashEscapes } from '@/lib/ai/util'

const inputSchema = z.object({
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

export const contract = {
  name: 'execute_sql',
  description:
    'Asks the user to execute a SQL statement and return the results. Requires user approval before executing.',
  inputSchema,
  outputSchema: executeSqlOutputSchema,
  minOptInLevel: null,
  needsApproval: true,
  toModelOutput: toModelExecuteSqlOutput,
} as const satisfies ToolContract
