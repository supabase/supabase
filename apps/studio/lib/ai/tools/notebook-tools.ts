import { tool } from 'ai'
import { z } from 'zod'

import { getAuthHeaders } from './auth-headers'
import { createTool as createCreateNotebookTool } from './create-notebook.server'
import { createTool as createDeleteNotebookTool } from './delete-notebook.server'
import { createTool as createRunNotebookTool } from './run-notebook.server'
import type { ToolContext } from './types'
import { createTool as createUpdateNotebookTool } from './update-notebook.server'
import { getContent } from '@/data/content/content-infinite-query'
import { getNotebook } from '@/data/content/notebooks/notebook-query'
import { toWireNotebook } from '@/data/content/notebooks/notebook-schema'
import { getReadReplicas } from '@/data/read-replicas/replicas-query'
import type { Notebooks } from '@/types'

export const getNotebookTools = (ctx: ToolContext = {}) => {
  const { projectRef, authorization } = ctx
  const authHeaders = getAuthHeaders(authorization)

  return {
    list_databases: tool({
      description:
        'List the databases available for this project — the primary and any read replicas.',
      inputSchema: z.object({}),
      execute: async (_input, { abortSignal }) => {
        const databases = await getReadReplicas({ projectRef }, abortSignal, authHeaders)

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
      execute: async ({ cursor, limit, sort_by }, { abortSignal }) => {
        const { content, cursor: nextCursor } = await getContent(
          { projectRef, type: 'notebook', limit, cursor, sort: sort_by },
          abortSignal,
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
      execute: async ({ id }, { abortSignal }) => {
        const notebook = await getNotebook({ projectRef, id }, abortSignal, authHeaders)

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
    run_notebook: createRunNotebookTool(ctx),
    create_notebook: createCreateNotebookTool(ctx),
    update_notebook: createUpdateNotebookTool(ctx),
    delete_notebook: createDeleteNotebookTool(ctx),
  }
}
