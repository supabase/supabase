import type { JSONValue } from 'ai'
import { z } from 'zod'

import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

const jsonValueSchema: z.ZodType<JSONValue> = z.lazy(() =>
  z.union([
    z.null(),
    z.string(),
    z.number(),
    z.boolean(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ])
)

export const notebookRunOutputSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    updated_at: z.string(),
    cells: z.array(
      z
        .object({
          cell_id: z.string(),
          title: z.string(),
          source: z.enum(['database', 'logs']),
          status: z.enum(['success', 'error']),
          rows: z.array(jsonValueSchema).optional(),
          error: z.object({ message: z.string() }).strict().optional(),
          message: z.string().optional(),
        })
        .strict()
    ),
  })
  .strict()

export type NotebookRunOutput = z.infer<typeof notebookRunOutputSchema>
export type NotebookRunCellOutput = NotebookRunOutput['cells'][number]

const HIDDEN_RESULT_MESSAGE =
  'The query ran, but its rows were not shared with the Assistant at the current permission level.'
const HIDDEN_ERROR_MESSAGE =
  'The query failed. The user can review the error in the notebook run results.'
export const INVALID_NOTEBOOK_RUN_OUTPUT_MESSAGE =
  'The notebook was run, but its results were not shared with the Assistant because the saved output could not be safely validated.'

/**
 * Validates persisted output before applying sharing permissions. `source` is trusted only
 * after this strict parse because history tool output originates from the client.
 */
export function sanitizeNotebookRunOutput(
  output: NotebookRunOutput,
  aiOptInLevel: AiOptInLevel
): NotebookRunOutput
export function sanitizeNotebookRunOutput(
  output: unknown,
  aiOptInLevel: AiOptInLevel
): NotebookRunOutput | typeof INVALID_NOTEBOOK_RUN_OUTPUT_MESSAGE
export function sanitizeNotebookRunOutput(
  output: unknown,
  aiOptInLevel: AiOptInLevel
): NotebookRunOutput | typeof INVALID_NOTEBOOK_RUN_OUTPUT_MESSAGE {
  const parsedOutput = notebookRunOutputSchema.safeParse(output)
  if (!parsedOutput.success) return INVALID_NOTEBOOK_RUN_OUTPUT_MESSAGE

  return {
    ...parsedOutput.data,
    cells: parsedOutput.data.cells.map((cell) => {
      const canShareRows =
        aiOptInLevel === 'schema_and_log_and_data' ||
        (cell.source === 'logs' && aiOptInLevel === 'schema_and_log')

      if (cell.status === 'success') {
        return canShareRows ? cell : { ...cell, rows: undefined, message: HIDDEN_RESULT_MESSAGE }
      }

      return canShareRows ? cell : { ...cell, error: { message: HIDDEN_ERROR_MESSAGE } }
    }),
  }
}
