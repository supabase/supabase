import { z } from 'zod'

import {
  INVALID_NOTEBOOK_RUN_OUTPUT_MESSAGE,
  notebookRunOutputSchema,
  sanitizeNotebookRunOutput,
  type NotebookRunOutput,
} from './notebook-run-output'
import type { ToolContract } from './types'

const inputSchema = z.object({
  id: z.string().describe('The id of the notebook to run.'),
  expected_updated_at: z
    .string()
    .describe(
      'The `updated_at` received from `get_notebook`. The run is rejected if the notebook changed since.'
    ),
})

export const contract = {
  name: 'run_notebook',
  description:
    'Asks the user to run every database and logs query cell in a notebook, in notebook order, and returns each result according to the organization data-sharing permissions. Requires one user approval before any cell executes.',
  inputSchema,
  outputSchema: notebookRunOutputSchema,
  minOptInLevel: 'schema',
  needsApproval: true,
  toModelOutput: (output: NotebookRunOutput, optInLevel) =>
    sanitizeNotebookRunOutput(output, optInLevel),
  // Persisted output comes from the client, so a malformed run is replaced with an
  // explanation rather than dropped.
  outputOnInvalid: INVALID_NOTEBOOK_RUN_OUTPUT_MESSAGE,
} as const satisfies ToolContract
