import { z } from 'zod'

const notebookToolErrorMetadataSchema = z.object({
  exposeToAssistant: z.boolean(),
})

export type NotebookToolErrorMetadata = z.infer<typeof notebookToolErrorMetadataSchema>

const notebookToolErrorSchema = notebookToolErrorMetadataSchema.extend({
  tag: z.literal('notebook_tool_error'),
  message: z.string(),
})

export type EncodedNotebookToolError = z.infer<typeof notebookToolErrorSchema>

/** Thrown by update_notebook for failures the assistant can act on by retrying. */
export class NotebookToolError extends Error {
  readonly metadata: NotebookToolErrorMetadata

  constructor(message: string, metadata: NotebookToolErrorMetadata) {
    super(message)
    this.name = 'NotebookToolError'
    this.metadata = notebookToolErrorMetadataSchema.parse(metadata)
  }
}

/** Called from the stream's `onError` (generate-v4.ts), which still has the live Error. */
export function encodeNotebookToolError(error: unknown): string | null {
  if (!(error instanceof NotebookToolError)) return null
  return JSON.stringify(
    notebookToolErrorSchema.parse({
      ...error.metadata,
      tag: 'notebook_tool_error',
      message: error.message,
    })
  )
}

export function decodeNotebookToolError(errorText: string): EncodedNotebookToolError | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(errorText)
  } catch {
    return null
  }
  const result = notebookToolErrorSchema.safeParse(parsed)
  return result.success ? result.data : null
}

/**
 * Rejects a made-up `database_identifier` before it's written: it would pass schema
 * validation (it's just a string) but silently break the cell at run time, since
 * QueryEditor's connection-string lookup can't resolve an identifier that isn't real.
 *
 * @throws NotebookToolError if any cell has a `database_identifier` that isn't in the
 * list of valid identifiers for this project.
 */
export function assertValidDatabaseIdentifiers(
  cells: ReadonlyArray<{ _tag: string; database_identifier?: string }>,
  validIdentifiers: Set<string>
): void {
  for (const cell of cells) {
    if (cell._tag !== 'database_cell' || cell.database_identifier === undefined) continue
    if (!validIdentifiers.has(cell.database_identifier)) {
      throw new NotebookToolError(
        `Unknown database_identifier "${cell.database_identifier}" — call list_databases to see this project's valid identifiers.`,
        { exposeToAssistant: true }
      )
    }
  }
}
