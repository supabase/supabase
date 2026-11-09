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
  availability: {
    environments: new Set(['platform']),
    requires: new Set(['explorer']),
  },
  needsApproval: true,
  promptGuidance: `- When the user asks to read or analyze a notebook using its current results, call \`get_notebook\` and then \`run_notebook\`. The run tool presents all query cells for one user approval, executes them in notebook order, and returns only the results allowed by the organization's sharing level. Do not replace it with one \`execute_sql\` call per cell.
- Questions only about a notebook's saved structure or query configuration do not require \`run_notebook\`.`,
  toModelOutput: (output: NotebookRunOutput, optInLevel) =>
    sanitizeNotebookRunOutput(output, optInLevel),
  // Persisted output comes from the client, so a malformed run is replaced with an
  // explanation rather than dropped.
  outputOnInvalid: INVALID_NOTEBOOK_RUN_OUTPUT_MESSAGE,
} as const satisfies ToolContract
