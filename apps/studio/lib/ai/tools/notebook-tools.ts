import { acceptUntrustedSql, untrustedSql } from '@supabase/pg-meta'
import { tool } from 'ai'
import { z } from 'zod'

import { getContent } from '@/data/content/content-infinite-query'
import {
  applyNotebookOperations,
  notebookOperationsSchema,
  type NotebookOperationError,
} from '@/data/content/notebooks/notebook-operations'
import { getNotebook } from '@/data/content/notebooks/notebook-query'
import {
  agentNotebookSchema,
  type CellWire,
  type NotebookWire,
  type WritableCell,
  type WritableNotebook,
} from '@/data/content/notebooks/notebook-schema'
import { createNotebook, updateNotebook } from '@/data/content/notebooks/notebook-upsert-mutation'
import { acceptUntrustedLogsSql, untrustedLogSql } from '@/data/logs/safe-analytics-sql'
import type { Notebooks } from '@/types'

function toWireCell(cell: Notebooks.Content['cells'][number]): CellWire {
  switch (cell._tag) {
    case 'markdown_cell':
      return cell
    case 'database_cell': {
      const { unchecked_sql, ...rest } = cell
      return { ...rest, sql: unchecked_sql }
    }
    case 'log_cell': {
      const { unchecked_sql, ...rest } = cell
      return { ...rest, sql: unchecked_sql }
    }
  }
}

function describeOperationError(error: NotebookOperationError): string {
  switch (error._tag) {
    case 'unknown_cell_id':
      return `No cell with id "${error.cell_id}" exists in this notebook.`
    case 'conflicting_operations':
      return `More than one operation targets cell "${error.cell_id}".`
    case 'empty_result':
      return 'This update would leave the notebook with no cells.'
  }
}

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
      }),
      execute: async ({ cursor, limit }) => {
        const { content, cursor: nextCursor } = await getContent(
          { projectRef, type: 'notebook', limit, cursor },
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

        return {
          id: notebook.id,
          name: notebook.name,
          description: notebook.description,
          visibility: notebook.visibility,
          cells: notebook.content.cells.map(toWireCell),
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
        'Asks the user to apply an ordered list of cell operations (insert, replace, delete, move) to an existing notebook. Requires user approval before updating. Re-fetches the notebook right before applying the operations; concurrent edits are last-write-wins.',
      inputSchema: z.object({
        id: z.string().describe('The id of the notebook to update.'),
        operations: notebookOperationsSchema.describe(
          'An ordered list of operations to apply to the notebook, addressing existing cells by id.'
        ),
      }),
      needsApproval: true,
      execute: async ({ id, operations }) => {
        const notebook = await getNotebook({ projectRef, id }, undefined, authHeaders)
        const wireNotebook: NotebookWire = {
          schema_version: notebook.content.schema_version,
          cells: notebook.content.cells.map(toWireCell),
        }

        const result = applyNotebookOperations(wireNotebook, operations)
        if (!result.success) {
          throw new Error(describeOperationError(result.error))
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

        await updateNotebook(
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
