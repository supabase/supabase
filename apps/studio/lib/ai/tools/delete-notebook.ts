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
  availability: {
    environments: new Set(['platform']),
    requires: new Set(['explorer']),
  },
  needsApproval: true,
  promptGuidance: `- Use \`delete_notebook\` only when the user explicitly asks to delete a whole notebook — never to remove a cell from one still in use; that's \`update_notebook\` with a \`delete_cell\` operation.
- Deleting a notebook is irreversible — warn the user before calling it, the same way you would for any other irreversible operation.
- When the request clearly calls for deleting a notebook, call \`delete_notebook\` directly; the tool handles user approval.`,
  toModelOutput: ({ id, name }) => ({ id, name }),
} as const satisfies ToolContract
