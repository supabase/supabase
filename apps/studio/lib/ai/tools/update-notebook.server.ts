import { untrustedSql } from '@supabase/pg-meta'

import { getAuthHeaders } from './auth-headers'
import { assertValidDatabaseIdentifiers, NotebookToolError } from './notebook-tool-error'
import { approvalGatedToolFromContract } from './tool-from-contract'
import type { ApprovalGatedToolFactory } from './types'
import { contract } from './update-notebook'
import {
  applyNotebookOperations,
  describeNotebookOperationError,
} from '@/data/content/notebooks/notebook-operations'
import { getNotebook } from '@/data/content/notebooks/notebook-query'
import {
  toWireNotebook,
  type WritableCell,
  type WritableNotebook,
} from '@/data/content/notebooks/notebook-schema'
import { upsertNotebook } from '@/data/content/notebooks/notebook-upsert-mutation'
import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'
import { getReadReplicas } from '@/data/read-replicas/replicas-query'

export const createTool: ApprovalGatedToolFactory<typeof contract> = (ctx) => {
  const { projectRef } = ctx
  const authHeaders = getAuthHeaders(ctx.authorization)

  return approvalGatedToolFromContract(
    contract,
    ctx,
    async ({ id, expected_updated_at, operations }, { abortSignal }, gate) => {
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
        const databases = await getReadReplicas({ projectRef }, abortSignal, authHeaders)
        assertValidDatabaseIdentifiers(
          newCells,
          new Set((databases ?? []).map((database) => database.identifier))
        )
      }

      const notebook = await getNotebook({ projectRef, id }, abortSignal, authHeaders)

      if (notebook.updated_at !== expected_updated_at) {
        throw new NotebookToolError(
          `Notebook "${id}" changed since expected_updated_at (${expected_updated_at}); it is now ${notebook.updated_at}. Call get_notebook again and reissue update_notebook against the current content.`,
          { exposeToAssistant: true }
        )
      }

      // The result of applyNotebookOperations is never written or executed as-is — every
      // cell is re-promoted via gate.acceptUntrustedSql/gate.acceptUntrustedLogsSql further
      // down in this same execute, right before the PUT.
      const wireNotebook = toWireNotebook(notebook.content)

      const result = applyNotebookOperations(wireNotebook, operations)
      if (!result.success) {
        throw new NotebookToolError(describeNotebookOperationError(result.error), {
          exposeToAssistant: true,
        })
      }

      // Same promotion as create_notebook, inlined here for the same auditability reason: it
      // must stay visible in the function the approval gate guards. `gate` is only handed to
      // an `execute` that runs after the user approves.
      const cells: WritableNotebook['cells'] = result.notebook.cells.map((cell): WritableCell => {
        switch (cell._tag) {
          case 'markdown_cell':
            return cell
          case 'database_cell':
            return { ...cell, sql: gate.acceptUntrustedSql(untrustedSql(cell.sql)) }
          case 'log_cell':
            return { ...cell, sql: gate.acceptUntrustedLogsSql(untrustedLogSql(cell.sql)) }
        }
      })

      await upsertNotebook(
        {
          projectRef: projectRef ?? '',
          id,
          name: notebook.name,
          description: notebook.description ?? undefined,
          content: { schema_version: result.notebook.schema_version, cells },
        },
        abortSignal,
        authHeaders
      )

      return { id, name: notebook.name, previous_content: wireNotebook }
    }
  )
}
