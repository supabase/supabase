import { z } from 'zod'

import { notebookMutationOutputSchema } from './notebook-mutation-output'
import type { ToolContract } from './types'

const inputSchema = z.object({
  id: z.string().describe('The id of the notebook to delete.'),
})

export const contract = {
  name: 'delete_notebook',
  description: 'Asks the user to delete a notebook. Requires user approval before deleting.',
  inputSchema,
  outputSchema: notebookMutationOutputSchema,
  minOptInLevel: 'schema',
  needsApproval: true,
  toModelOutput: ({ id, name }) => ({ id, name }),
} as const satisfies ToolContract
