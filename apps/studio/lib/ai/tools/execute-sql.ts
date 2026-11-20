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
  availability: {
    environments: new Set(['platform', 'self-hosted']),
  },
  needsApproval: true,
  promptGuidance: `- When the user's request is clear, call \`execute_sql\` immediately—never propose a query and ask "do you want me to run this?" The tool implementation handles user confirmation.
- Only ask clarifying questions when required information is missing or ambiguous—not as a confirmation step before execution.
- Do not show the SQL query before execution; the client will display it to the user.
- Set chartConfig \`view\` to \`chart\` and xAxis/yAxis if the results would be best displayed as a chart e.g. count of items by date
- On execution error, explain succinctly and attempt to correct if possible, validating each outcome briefly (1–2 lines) after execution.
- If a user skips execution, acknowledge and suggest alternatives. A skip is a user choice, not a permission or environment error.
- Use markdown code blocks (\`\`\`sql\`\`\`) for illustrative SQL only if requested by the user or when providing non-executable examples.
- This tool requires user approval, and tools that need approval must be called one per step: never call it in parallel with another tool that needs approval. Issue one per step and wait for its result before calling the next.
- After execution, summarize outcomes concisely without duplicating results, as the client will present these.`,
  toModelOutput: toModelExecuteSqlOutput,
} as const satisfies ToolContract
