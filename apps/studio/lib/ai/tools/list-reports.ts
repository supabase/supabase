import { z } from 'zod'

import type { ToolContract } from './types'

const inputSchema = z.object({
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .default(20)
    .describe('Max number of reports to return.'),
})

const outputSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullish(),
    visibility: z.string(),
    updated_at: z.string(),
    chart_count: z.number(),
  })
)

export const contract = {
  name: 'list_reports',
  description: 'List the custom reports saved for this project',
  inputSchema,
  outputSchema,
  minOptInLevel: 'schema',
  needsApproval: false,
  toModelOutput: (output: z.infer<typeof outputSchema>) => output,
} as const satisfies ToolContract
