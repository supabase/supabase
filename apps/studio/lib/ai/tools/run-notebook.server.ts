import type { JSONValue } from 'ai'

import { getAuthHeaders } from './auth-headers'
import type { NotebookRunCellOutput, NotebookRunOutput } from './notebook-run-output'
import { NotebookToolError } from './notebook-tool-error'
import { contract } from './run-notebook'
import { approvalGatedToolFromContract } from './tool-from-contract'
import type { ApprovalGatedToolFactory } from './types'
import { resolveLogTimeRange } from '@/components/interfaces/QuerySources/LogTimeRange.utils'
import { getNotebook } from '@/data/content/notebooks/notebook-query'
import { executeLogsSql } from '@/data/logs/execute-logs-sql-mutation'
import { QUERY_SOURCE_REGISTRY } from '@/data/query-sources/query-source-registry'
import { getReadReplicas } from '@/data/read-replicas/replicas-query'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { applyAutoLimit } from '@/data/sql/utils'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return 'An unexpected error occurred while running this query.'
}

export const createTool: ApprovalGatedToolFactory<typeof contract> = (ctx) => {
  const { projectRef, connectionString, aiOptInLevel = 'schema' } = ctx
  const authHeaders = getAuthHeaders(ctx.authorization)

  return approvalGatedToolFromContract(
    contract,
    ctx,
    async ({ id, expected_updated_at }, { abortSignal }, gate) => {
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

      // This execute function only runs after the AI SDK approval gate resolves true. That
      // approval is the explicit user gesture which promotes every persisted cell's
      // untrusted SQL immediately before execution. Run sequentially to preserve notebook
      // order and avoid racing cells that may depend on earlier writes.
      for (const cell of queryCells) {
        const title = cell.title?.trim() || 'Untitled query'

        try {
          if (cell._tag === 'log_cell') {
            const result = await executeLogsSql({
              projectRef: projectRef ?? '',
              sql: gate.acceptUntrustedLogsSql(cell.unchecked_sql),
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
            gate.acceptUntrustedSql(cell.unchecked_sql),
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
    }
  )
}
