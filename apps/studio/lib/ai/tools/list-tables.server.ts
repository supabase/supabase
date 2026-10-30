import pgMeta from '@supabase/pg-meta'

import { contract } from './list-tables'
import { toListTablesOutput } from './list-tables-output'
import { toolFromContract } from './tool-from-contract'
import { runPgMetaQuery } from './tool-sql.server'
import type { ToolFactory } from './types'

export const createTool: ToolFactory<typeof contract> = (ctx) => {
  return toolFromContract(contract, ctx, async ({ schemas, verbose }, { abortSignal }) => {
    const options = { includedSchemas: schemas, includeColumns: verbose }
    const [tables, views, materializedViews, foreignTables] = await Promise.all([
      runPgMetaQuery(ctx, pgMeta.tables.list(options), abortSignal),
      runPgMetaQuery(ctx, pgMeta.views.list(options), abortSignal),
      runPgMetaQuery(ctx, pgMeta.materializedViews.list(options), abortSignal),
      runPgMetaQuery(ctx, pgMeta.foreignTables.list(options), abortSignal),
    ])
    return toListTablesOutput({ tables, views, materializedViews, foreignTables }, verbose)
  })
}
