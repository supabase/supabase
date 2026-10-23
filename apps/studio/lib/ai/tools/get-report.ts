import { z } from 'zod'

import type { ToolContract } from './types'

const inputSchema = z.object({
  id: z.string().describe('The id of the report to fetch.'),
})

const timePeriodSchema = z.object({
  time_period: z.string().optional(),
  date: z.string().optional(),
})

const chartConfigSchema = z.object({
  view: z.string().optional(),
  type: z.string().optional(),
  cumulative: z.boolean().optional(),
  xKey: z.string().optional(),
  yKey: z.string().optional(),
  showLabels: z.boolean().optional(),
  showGrid: z.boolean().optional(),
  logScale: z.boolean().optional(),
})

const chartSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  label: z.string(),
  attribute: z.string(),
  provider: z.string(),
  chart_type: z.string(),
  chartConfig: chartConfigSchema.optional(),
  sql: z.string().optional(),
})

const outputSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  visibility: z.string(),
  period_start: timePeriodSchema,
  period_end: timePeriodSchema,
  interval: z.string(),
  layout: z.array(chartSchema),
})

export const contract = {
  name: 'get_report',
  description:
    'Get a single custom report by id, including the resolved SQL for any SQL-based chart blocks it contains.',
  inputSchema,
  outputSchema,
  minOptInLevel: 'schema',
  needsApproval: false,
  toModelOutput: (output: z.infer<typeof outputSchema>) => output,
} as const satisfies ToolContract
