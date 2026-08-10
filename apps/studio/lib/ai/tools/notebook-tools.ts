import { tool } from 'ai'
import { z } from 'zod'

import { getContent } from '@/data/content/content-infinite-query'
import { getNotebook } from '@/data/content/notebooks/notebook-query'
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
          cells: notebook.content.cells.map((cell) => {
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
          }),
        }
      },
    }),
  }
}
