import { z } from 'zod'

import { notebookMutationOutputSchema } from './notebook-mutation-output'
import type { ToolContract } from './types'
import { agentNotebookSchema } from '@/data/content/notebooks/notebook-schema'

const inputSchema = z.object({
  name: z.string().describe('A short, descriptive name for the notebook.'),
  description: z.string().optional().describe('A short description of what the notebook is for.'),
  content: agentNotebookSchema.describe(
    'The notebook content: a schema version and an ordered list of cells (markdown, database, or log). Cells must not include an id — one is assigned when the notebook is saved.'
  ),
})

export const contract = {
  name: 'create_notebook',
  description:
    'Asks the user to create a new notebook with the given cells. Requires user approval before creating.',
  inputSchema,
  outputSchema: notebookMutationOutputSchema,
  minOptInLevel: 'schema',
  needsApproval: true,
  toModelOutput: ({ id, name }) => ({ id, name }),
} as const satisfies ToolContract
