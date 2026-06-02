import { z } from 'zod'

export const generatedNotebookBlockResultConfigSchema = z.object({
  view: z
    .enum(['table', 'chart'])
    .describe(
      'Use "table" for raw rows or wide result sets; use "chart" for trends and aggregates'
    ),
  chart_type: z
    .enum(['bar', 'line'])
    .describe(
      'Bar for categorical comparisons; line for time series. Use "bar" when view is "table"'
    ),
  x_key: z
    .string()
    .describe(
      'Result column for the chart x-axis. Must match a SELECT alias. Empty string when view is "table"'
    ),
  y_key: z
    .string()
    .describe(
      'Numeric result column for the chart y-axis. Must match a SELECT alias. Empty string when view is "table"'
    ),
  cumulative: z
    .boolean()
    .describe('Cumulate y values over x for running totals. Use false when view is "table"'),
})

export const generatedNotebookBlockSchema = z.object({
  label: z.string().describe('Short title for this SQL block'),
  sql: z.string().describe('A complete Postgres SQL query for this block'),
  query_source: z
    .enum(['database', 'logs'])
    .describe('Use "logs" for Supabase log analytics SQL, otherwise "database"'),
  logs_time_range: z
    .enum(['Last hour', 'Last 3 hours', 'Last 24 hours', 'Last 3 days', 'Last 7 days'])
    .nullable()
    .describe(
      'Logs picker time range for blocks with query_source "logs". Use null for database blocks.'
    ),
  result_config: generatedNotebookBlockResultConfigSchema.describe(
    'How to display query results in the notebook block utility panel'
  ),
})

export const notebookGenerateOutputSchema = z.object({
  suggested_name: z
    .string()
    .describe(
      'Concise notebook title when the user did not provide one. Use an empty string when a preferred name was supplied.'
    ),
  blocks: z
    .array(generatedNotebookBlockSchema)
    .min(1)
    .max(8)
    .describe('Ordered SQL blocks that together answer the notebook goal'),
})

export type GeneratedNotebookBlock = z.infer<typeof generatedNotebookBlockSchema>
export type NotebookGenerateOutput = z.infer<typeof notebookGenerateOutputSchema>
