import pgMeta from '@supabase/pg-meta'

import { contract } from './list-tables'
import { toListTablesOutput } from './list-tables-output'
import { toolFromContract } from './tool-from-contract'
import { runPgMetaQuery } from './tool-sql.server'
import type { ToolFactory } from './types'

export const createTool: ToolFactory<typeof contract> = (ctx) => {
  return toolFromContract(contract, ctx, async ({ schemas, verbose }, { abortSignal }) => {
    const rows = await runPgMetaQuery(
      ctx,
      pgMeta.tables.list({ includedSchemas: schemas, includeColumns: verbose }),
      abortSignal
    )
    return toListTablesOutput(rows, verbose)
  })
}
