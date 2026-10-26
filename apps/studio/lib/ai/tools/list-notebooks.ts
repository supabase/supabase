import { z } from 'zod'

import type { ToolContract } from './types'

const inputSchema = z.object({
  cursor: z
    .string()
    .optional()
    .describe('Cursor from a previous call, used to fetch the next page.'),
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .default(20)
    .describe('Max number of notebooks to return.'),
  sort_by: z
    .enum(['name', 'inserted_at'])
    .optional()
    .describe(
      'Field to sort notebooks by. There is no "updated_at" sort — use "inserted_at" for creation order.'
    ),
})

const outputSchema = z.object({
  notebooks: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullish(),
      visibility: z.string(),
      updated_at: z.string(),
      cell_count: z.number(),
    })
  ),
  cursor: z.string().optional(),
})

export const contract = {
  name: 'list_notebooks',
  description: 'List the notebooks saved for this project',
  inputSchema,
  outputSchema,
  minOptInLevel: 'schema',
  needsApproval: false,
  toModelOutput: (output: z.infer<typeof outputSchema>) => output,
} as const satisfies ToolContract
