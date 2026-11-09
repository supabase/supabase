import { untrustedSql } from '@supabase/pg-meta'

import { getAuthHeaders } from './auth-headers'
import { contract } from './create-notebook'
import { assertValidDatabaseIdentifiers } from './notebook-tool-error'
import { approvalGatedToolFromContract } from './tool-from-contract'
import type { ApprovalGatedToolFactory } from './types'
import type { WritableCell, WritableNotebook } from '@/data/content/notebooks/notebook-schema'
import { createNotebook } from '@/data/content/notebooks/notebook-upsert-mutation'
import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'
import { getReadReplicas } from '@/data/read-replicas/replicas-query'

export const createTool: ApprovalGatedToolFactory<typeof contract> = (ctx) => {
  const { projectRef } = ctx
  const authHeaders = getAuthHeaders(ctx.authorization)

  return approvalGatedToolFromContract(
    contract,
    ctx,
    async ({ name, description, content }, { abortSignal }, gate) => {
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

      // `gate` is only handed to an `execute` that runs after the user approves, so that
      // approval is the user gesture that promotes each cell's SQL from untrusted to safe.
      // Keep the promotion here, not in a shared helper, so it's auditable directly.
      const cells: WritableNotebook['cells'] = content.cells.map((cell): WritableCell => {
        switch (cell._tag) {
          case 'markdown_cell':
            return cell
          case 'database_cell':
            return { ...cell, sql: gate.acceptUntrustedSql(untrustedSql(cell.sql)) }
          case 'log_cell':
            return { ...cell, sql: gate.acceptUntrustedLogsSql(untrustedLogSql(cell.sql)) }
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
    }
  )
}
