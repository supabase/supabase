import { z } from 'zod'

import { notebookMutationOutputSchema } from './notebook-mutation-output'
import type { ToolContract } from './types'
import { notebookOperationsSchema } from '@/data/content/notebooks/notebook-operations'
import { notebookSchema } from '@/data/content/notebooks/notebook-schema'

const inputSchema = z.object({
  id: z.string().describe('The id of the notebook to update.'),
  expected_updated_at: z
    .string()
    .describe(
      'The `updated_at` you received from `get_notebook`. The update is rejected if the notebook changed since.'
    ),
  operations: notebookOperationsSchema.describe(
    'An ordered list of operations to apply to the notebook, addressing existing cells by id.'
  ),
})

/**
 * `previous_content` lets the client re-derive the diff it already showed for approval,
 * without re-fetching a notebook that's now post-update. It is UI-only: `toModelOutput` drops it.
 */
const outputSchema = notebookMutationOutputSchema.extend({
  previous_content: notebookSchema.optional(),
})

export const contract = {
  name: 'update_notebook',
  description:
    'Asks the user to apply an ordered list of cell operations (insert, replace, delete, move) to an existing notebook. Requires user approval before updating. Re-fetches the notebook right before applying the operations and rejects the update if it changed since expected_updated_at.',
  inputSchema,
  outputSchema,
  minOptInLevel: 'schema',
  needsApproval: true,
  toModelOutput: ({ id, name }) => ({ id, name }),
} as const satisfies ToolContract
