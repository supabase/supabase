import { z } from 'zod'

import type { ToolContract } from './types'
import { notebookSchema } from '@/data/content/notebooks/notebook-schema'

const inputSchema = z.object({
  id: z.string().describe('The id of the notebook to fetch.'),
})

const outputSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  visibility: z.string(),
  updated_at: z.string(),
  cells: notebookSchema.shape.cells,
})

export const contract = {
  name: 'get_notebook',
  description:
    'Get a single notebook by id, including the markdown text and resolved SQL of every cell.',
  inputSchema,
  outputSchema,
  minOptInLevel: 'schema',
  needsApproval: false,
  toModelOutput: (output: z.infer<typeof outputSchema>) => output,
} as const satisfies ToolContract
