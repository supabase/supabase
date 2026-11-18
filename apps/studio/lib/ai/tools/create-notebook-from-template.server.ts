import { untrustedSql } from '@supabase/pg-meta'

import { getAuthHeaders } from './auth-headers'
import { contract } from './create-notebook-from-template'
import { approvalGatedToolFromContract } from './tool-from-contract'
import type { ApprovalGatedToolFactory } from './types'
import { buildTemplateNotebook } from '@/components/interfaces/Explorer/templates'
import type { WritableCell } from '@/data/content/notebooks/notebook-schema'
import { createNotebook } from '@/data/content/notebooks/notebook-upsert-mutation'
import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'

export const createTool: ApprovalGatedToolFactory<typeof contract> = (ctx) => {
  const { projectRef } = ctx
  const authHeaders = getAuthHeaders(ctx.authorization)

  return approvalGatedToolFromContract(
    contract,
    ctx,
    async ({ template }, { abortSignal }, gate) => {
      const { name, content } = buildTemplateNotebook(template)

      // Same promotion as create_notebook: `gate` only reaches an `execute` that runs after
      // the user approves the proposal, which showed every cell's SQL.
      const cells = content.cells.map((cell): WritableCell => {
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
          content: { schema_version: content.schema_version, cells },
        },
        abortSignal,
        authHeaders
      )

      return { id: result.id, name }
    }
  )
}
