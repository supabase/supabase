import { acceptUntrustedSql, untrustedSql } from '@supabase/pg-meta'
import { tool, type JSONValue } from 'ai'
import { z } from 'zod'

import { getAuthHeaders } from './auth-headers'
import {
  sanitizeNotebookRunOutput,
  type NotebookRunCellOutput,
  type NotebookRunOutput,
} from './notebook-run-output'
import { assertValidDatabaseIdentifiers, NotebookToolError } from './notebook-tool-error'
import type { ToolContext } from './types'
import { createTool as createUpdateNotebookTool } from './update-notebook.server'
import { resolveLogTimeRange } from '@/components/interfaces/QuerySources/LogTimeRange.utils'
import { deleteContents } from '@/data/content/content-delete-mutation'
import { getContent } from '@/data/content/content-infinite-query'
import { getNotebook } from '@/data/content/notebooks/notebook-query'
import {
  agentNotebookSchema,
  toWireNotebook,
  type WritableCell,
  type WritableNotebook,
} from '@/data/content/notebooks/notebook-schema'
import { createNotebook } from '@/data/content/notebooks/notebook-upsert-mutation'
import { executeLogsSql } from '@/data/logs/execute-logs-sql-mutation'
import { acceptUntrustedLogsSql, untrustedLogSql } from '@/data/logs/safe-analytics-sql'
import { QUERY_SOURCE_REGISTRY } from '@/data/query-sources/query-source-registry'
import { getReadReplicas } from '@/data/read-replicas/replicas-query'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { applyAutoLimit } from '@/data/sql/utils'
import type { Notebooks } from '@/types'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return 'An unexpected error occurred while running this query.'
}

export const getNotebookTools = (ctx: ToolContext = {}) => {
  const { projectRef, connectionString, authorization, aiOptInLevel = 'schema' } = ctx
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
    run_notebook: tool({
      description:
        'Asks the user to run every database and logs query cell in a notebook, in notebook order, and returns each result according to the organization data-sharing permissions. Requires one user approval before any cell executes.',
      inputSchema: z.object({
        id: z.string().describe('The id of the notebook to run.'),
        expected_updated_at: z
          .string()
          .describe(
            'The `updated_at` received from `get_notebook`. The run is rejected if the notebook changed since.'
          ),
      }),
      needsApproval: true,
      execute: async ({ id, expected_updated_at }, { abortSignal }) => {
        const notebook = await getNotebook({ projectRef, id }, abortSignal, authHeaders)

        if (notebook.updated_at !== expected_updated_at) {
          throw new NotebookToolError(
            `Notebook "${id}" changed since expected_updated_at (${expected_updated_at}); it is now ${notebook.updated_at}. Call get_notebook again and reissue run_notebook against the current content.`,
            { exposeToAssistant: true }
          )
        }

        const queryCells = notebook.content.cells.filter(
          (cell) => cell._tag === 'database_cell' || cell._tag === 'log_cell'
        )
        const shouldLookupReplica = queryCells.some(
          (cell) =>
            cell._tag === 'database_cell' &&
            cell.database_identifier !== undefined &&
            cell.database_identifier !== projectRef
        )
        let databases: Awaited<ReturnType<typeof getReadReplicas>> = []
        let replicaLookupFailure: { error: unknown } | undefined
        if (shouldLookupReplica) {
          try {
            databases = await getReadReplicas({ projectRef }, abortSignal, authHeaders)
          } catch (error) {
            replicaLookupFailure = { error }
          }
        }

        const cells: NotebookRunCellOutput[] = []

        // This execute function only runs after the AI SDK approval gate above resolves true.
        // That approval is the explicit user gesture which promotes every persisted cell's
        // untrusted SQL immediately before execution. Run sequentially to preserve notebook
        // order and avoid racing cells that may depend on earlier writes.
        for (const cell of queryCells) {
          const title = cell.title?.trim() || 'Untitled query'

          try {
            if (cell._tag === 'log_cell') {
              const result = await executeLogsSql({
                projectRef: projectRef ?? '',
                sql: acceptUntrustedLogsSql(cell.unchecked_sql),
                range: resolveLogTimeRange(cell.time_range),
                endpoint: QUERY_SOURCE_REGISTRY.logs.endpoint,
                signal: abortSignal,
                headers: authHeaders,
              })
              if (result.error) throw result.error
              cells.push({
                cell_id: cell._id,
                title,
                source: 'logs',
                status: 'success',
                // The analytics response crossed a JSON fetch boundary, although its shared
                // data-layer type remains `unknown[]` because individual endpoints vary.
                rows: result.rows as JSONValue[],
              })
              continue
            }

            const isReplicaTarget =
              cell.database_identifier !== undefined && cell.database_identifier !== projectRef

            if (isReplicaTarget && replicaLookupFailure !== undefined) {
              throw replicaLookupFailure.error
            }

            const selectedConnectionString = !isReplicaTarget
              ? connectionString
              : databases?.find((database) => database.identifier === cell.database_identifier)
                  ?.connectionString

            if (!selectedConnectionString) {
              throw new Error(
                `Unable to run query: connection string is missing for database "${cell.database_identifier ?? projectRef ?? 'primary'}"`
              )
            }

            const limitedSql = applyAutoLimit(
              acceptUntrustedSql(cell.unchecked_sql),
              cell.row_limit
            )
            const { result } = await executeSql<JSONValue[]>(
              {
                projectRef,
                connectionString: selectedConnectionString,
                sql: limitedSql.sql,
                isStatementTimeoutDisabled: true,
              },
              abortSignal,
              authHeaders
            )
            cells.push({
              cell_id: cell._id,
              title,
              source: 'database',
              status: 'success',
              rows: Array.isArray(result) ? result : [],
            })
          } catch (error) {
            cells.push({
              cell_id: cell._id,
              title,
              source: cell._tag === 'log_cell' ? 'logs' : 'database',
              status: 'error',
              error: { message: getErrorMessage(error) },
            })
          }
        }

        return {
          id: notebook.id,
          name: notebook.name,
          updated_at: notebook.updated_at,
          optInLevel: aiOptInLevel,
          cells,
        } satisfies NotebookRunOutput
      },
      toModelOutput: ({ output }) => ({
        type: 'json',
        value: sanitizeNotebookRunOutput(output, aiOptInLevel),
      }),
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
      execute: async ({ name, description, content }, { abortSignal }) => {
        if (
          content.cells.some(
            (cell) => cell._tag === 'database_cell' && cell.database_identifier !== undefined
          )
        ) {
          const databases = await getReadReplicas({ projectRef }, abortSignal, authHeaders)
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
          abortSignal,
          authHeaders
        )

        return { id: result.id, name }
      },
    }),
    update_notebook: createUpdateNotebookTool(ctx),
    delete_notebook: tool({
      description: 'Asks the user to delete a notebook. Requires user approval before deleting.',
      inputSchema: z.object({
        id: z.string().describe('The id of the notebook to delete.'),
      }),
      needsApproval: true,
      execute: async ({ id }, { abortSignal }) => {
        const notebook = await getNotebook({ projectRef, id }, abortSignal, authHeaders)

        await deleteContents({ projectRef: projectRef ?? '', ids: [id] }, abortSignal, authHeaders)

        return { id, name: notebook.name }
      },
    }),
  }
}
