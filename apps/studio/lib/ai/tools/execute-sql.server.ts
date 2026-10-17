import { untrustedSql } from '@supabase/pg-meta'

import { getAuthHeaders } from './auth-headers'
import { capReadQuery } from './cap-read-query'
import { contract } from './execute-sql'
import { approvalGatedToolFromContract } from './tool-from-contract'
import type { ApprovalGatedToolFactory } from './types'
import { DEFAULT_CELL_ROW_LIMIT } from '@/components/interfaces/Explorer/QueryCell/QueryCell.utils'
import { executeSql } from '@/data/sql/execute-sql-mutation'

export const createTool: ApprovalGatedToolFactory<typeof contract> = (ctx) => {
  const { projectRef, connectionString, aiOptInLevel = 'schema' } = ctx
  const authHeaders = getAuthHeaders(ctx.authorization, { contentType: true })

  return approvalGatedToolFromContract(
    contract,
    ctx,
    async ({ sql, isWriteQuery }, { abortSignal }, gate) => {
      const approvedSql = gate.acceptUntrustedSql(untrustedSql(sql))
      const { sql: limitedSql, isCappedInDatabase } = isWriteQuery
        ? { sql: approvedSql, isCappedInDatabase: false }
        : capReadQuery(approvedSql, DEFAULT_CELL_ROW_LIMIT + 1)
      const { result } = await executeSql(
        { projectRef, connectionString, sql: limitedSql },
        abortSignal,
        authHeaders
      )
      const rows = Array.isArray(result) ? result : []
      const isCapped = rows.length > DEFAULT_CELL_ROW_LIMIT
      const hasMoreRows = isCappedInDatabase && isCapped
      return {
        rows: rows.slice(0, DEFAULT_CELL_ROW_LIMIT),
        ...(hasMoreRows ? { hasMoreRows } : { totalRows: rows.length }),
        optInLevel: aiOptInLevel,
      }
    }
  )
}
