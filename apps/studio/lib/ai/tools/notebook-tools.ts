import { acceptUntrustedSql, untrustedSql } from '@supabase/pg-meta'
import { tool } from 'ai'
import { z } from 'zod'

import { getContent } from '@/data/content/content-infinite-query'
import {
  applyNotebookOperations,
  describeNotebookOperationError,
  notebookOperationsSchema,
} from '@/data/content/notebooks/notebook-operations'
import { getNotebook } from '@/data/content/notebooks/notebook-query'
import {
  agentNotebookSchema,
  toWireNotebook,
  type WritableCell,
  type WritableNotebook,
} from '@/data/content/notebooks/notebook-schema'
import { createNotebook, upsertNotebook } from '@/data/content/notebooks/notebook-upsert-mutation'
import { acceptUntrustedLogsSql, untrustedLogSql } from '@/data/logs/safe-analytics-sql'
import { getReadReplicas } from '@/data/read-replicas/replicas-query'
import type { Notebooks } from '@/types'

export type NotebookToolsContext = {
  projectRef?: string
  authorization?: string
}

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

/** Called from the history filter (generate-assistant-response.ts) on a persisted errorText. */
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
function assertValidDatabaseIdentifiers(
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

export const getNotebookTools = (ctx: NotebookToolsContext = {}) => {
  const { projectRef, authorization } = ctx
  const authHeaders = authorization ? { Authorization: authorization } : undefined

  return {
    list_databases: tool({
      description:
        'List the databases available for this project — the primary and any read replicas.',
      inputSchema: z.object({}),
      execute: async () => {
        const databases = await getReadReplicas({ projectRef }, undefined, authHeaders)

        return {
          databases: (databases ?? []).map((database) => ({
            identifier: database.identifier,
            is_primary: database.identifier === projectRef,
            region: database.region,
            status: database.status,
          })),
        }
      },
    }),
    list_notebooks: tool({
      description: 'List the notebooks saved for this project',
      inputSchema: z.object({
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
      }),
      execute: async ({ cursor, limit, sort_by }) => {
        const { content, cursor: nextCursor } = await getContent(
          { projectRef, type: 'notebook', limit, cursor, sort: sort_by },
          undefined,
          authHeaders
        )

        return {
          notebooks: content.map((notebook) => ({
            id: notebook.id,
            name: notebook.name,
            description: notebook.description,
            visibility: notebook.visibility,
            updated_at: notebook.updated_at,
            cell_count: (notebook.content as Notebooks.Content).cells.length,
          })),
          cursor: nextCursor,
        }
      },
    }),
    get_notebook: tool({
      description:
        'Get a single notebook by id, including the markdown text and resolved SQL of every cell.',
      inputSchema: z.object({
        id: z.string().describe('The id of the notebook to fetch.'),
      }),
      execute: async ({ id }) => {
        const notebook = await getNotebook({ projectRef, id }, undefined, authHeaders)

        // toWireNotebook discards the `unchecked_sql` brand for display purposes only — the
        // result is returned to the agent, never written back.
        return {
          id: notebook.id,
          name: notebook.name,
          description: notebook.description,
          visibility: notebook.visibility,
          updated_at: notebook.updated_at,
          cells: toWireNotebook(notebook.content).cells,
        }
      },
    }),
    create_notebook: tool({
      description:
        'Asks the user to create a new notebook with the given cells. Requires user approval before creating.',
      inputSchema: z.object({
        name: z.string().describe('A short, descriptive name for the notebook.'),
        description: z
          .string()
          .optional()
          .describe('A short description of what the notebook is for.'),
        content: agentNotebookSchema.describe(
          'The notebook content: a schema version and an ordered list of cells (markdown, database, or log). Cells must not include an id — one is assigned when the notebook is saved.'
        ),
      }),
      needsApproval: true,
      execute: async ({ name, description, content }) => {
        if (
          content.cells.some(
            (cell) => cell._tag === 'database_cell' && cell.database_identifier !== undefined
          )
        ) {
          const databases = await getReadReplicas({ projectRef }, undefined, authHeaders)
          assertValidDatabaseIdentifiers(
            content.cells,
            new Set((databases ?? []).map((database) => database.identifier))
          )
        }

        // This approval gate is the user gesture that promotes each cell's SQL from
        // untrusted to safe — keep the promotion here, not in a shared helper, so it's
        // auditable directly alongside the `needsApproval: true` above.
        const cells: WritableNotebook['cells'] = content.cells.map((cell): WritableCell => {
          switch (cell._tag) {
            case 'markdown_cell':
              return cell
            case 'database_cell':
              return { ...cell, sql: acceptUntrustedSql(untrustedSql(cell.sql)) }
            case 'log_cell':
              return { ...cell, sql: acceptUntrustedLogsSql(untrustedLogSql(cell.sql)) }
          }
        })

        const result = await createNotebook(
          {
            projectRef: projectRef ?? '',
            name,
            description,
            content: { schema_version: content.schema_version, cells },
          },
          undefined,
          authHeaders
        )

        return { id: result.id, name }
      },
    }),
    update_notebook: tool({
      description:
        'Asks the user to apply an ordered list of cell operations (insert, replace, delete, move) to an existing notebook. Requires user approval before updating. Re-fetches the notebook right before applying the operations and rejects the update if it changed since expected_updated_at.',
      inputSchema: z.object({
        id: z.string().describe('The id of the notebook to update.'),
        expected_updated_at: z
          .string()
          .describe(
            'The `updated_at` you received from `get_notebook`. The update is rejected if the notebook changed since.'
          ),
        operations: notebookOperationsSchema.describe(
          'An ordered list of operations to apply to the notebook, addressing existing cells by id.'
        ),
      }),
      needsApproval: true,
      execute: async ({ id, expected_updated_at, operations }) => {
        const newCells = operations.flatMap((operation) =>
          operation._tag === 'insert_cell' || operation._tag === 'replace_cell'
            ? [operation.cell]
            : []
        )
        if (
          newCells.some(
            (cell) => cell._tag === 'database_cell' && cell.database_identifier !== undefined
          )
        ) {
          const databases = await getReadReplicas({ projectRef }, undefined, authHeaders)
          assertValidDatabaseIdentifiers(
            newCells,
            new Set((databases ?? []).map((database) => database.identifier))
          )
        }

        const notebook = await getNotebook({ projectRef, id }, undefined, authHeaders)

        if (notebook.updated_at !== expected_updated_at) {
          throw new NotebookToolError(
            `Notebook "${id}" changed since expected_updated_at (${expected_updated_at}); it is now ${notebook.updated_at}. Call get_notebook again and reissue update_notebook against the current content.`,
            { exposeToAssistant: true }
          )
        }

        // The result of applyNotebookOperations is never written or executed as-is — every
        // cell is re-promoted via acceptUntrustedSql/acceptUntrustedLogsSql further down in
        // this same execute, right before the PUT.
        const wireNotebook = toWireNotebook(notebook.content)

        const result = applyNotebookOperations(wireNotebook, operations)
        if (!result.success) {
          throw new NotebookToolError(describeNotebookOperationError(result.error), {
            exposeToAssistant: true,
          })
        }

        // Same promotion as create_notebook above, inlined here for the same auditability
        // reason: it must stay visible next to this tool's own `needsApproval: true`.
        const cells: WritableNotebook['cells'] = result.notebook.cells.map((cell): WritableCell => {
          switch (cell._tag) {
            case 'markdown_cell':
              return cell
            case 'database_cell':
              return { ...cell, sql: acceptUntrustedSql(untrustedSql(cell.sql)) }
            case 'log_cell':
              return { ...cell, sql: acceptUntrustedLogsSql(untrustedLogSql(cell.sql)) }
          }
        })

        await upsertNotebook(
          {
            projectRef: projectRef ?? '',
            id,
            name: notebook.name,
            description: notebook.description,
            content: { schema_version: result.notebook.schema_version, cells },
          },
          undefined,
          authHeaders
        )

        // `previous_content` lets the client re-derive the diff it already showed for
        // approval, without re-fetching a notebook that's now post-update. Never reaches
        // the model — see toModelOutput below.
        return { id, name: notebook.name, previous_content: wireNotebook }
      },
      toModelOutput: ({ output }) => ({
        type: 'json',
        value: { id: output.id, name: output.name },
      }),
    }),
  }
}
