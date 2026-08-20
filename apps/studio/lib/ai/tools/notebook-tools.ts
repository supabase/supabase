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
import type { Notebooks } from '@/types'

export type NotebookToolsContext = {
  projectRef?: string
  authorization?: string
}

export const getNotebookTools = (ctx: NotebookToolsContext = {}) => {
  const { projectRef, authorization } = ctx
  const authHeaders = authorization ? { Authorization: authorization } : undefined

  return {
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
        const notebook = await getNotebook({ projectRef, id }, undefined, authHeaders)

        if (notebook.updated_at !== expected_updated_at) {
          throw new Error(
            `Notebook "${id}" changed since expected_updated_at (${expected_updated_at}); it is now ${notebook.updated_at}. Call get_notebook again and reissue update_notebook against the current content.`
          )
        }

        // The result of applyNotebookOperations is never written or executed as-is — every
        // cell is re-promoted via acceptUntrustedSql/acceptUntrustedLogsSql further down in
        // this same execute, right before the PUT.
        const wireNotebook = toWireNotebook(notebook.content)

        const result = applyNotebookOperations(wireNotebook, operations)
        if (!result.success) {
          throw new Error(describeNotebookOperationError(result.error))
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

        return { id, name: notebook.name }
      },
    }),
  }
}
