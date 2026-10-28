import pgMeta from '@supabase/pg-meta'

import { contract } from './list-functions'
import { toolFromContract } from './tool-from-contract'
import { runPgMetaQuery } from './tool-sql.server'
import type { ToolFactory } from './types'

export const createTool: ToolFactory<typeof contract> = (ctx) => {
  return toolFromContract(contract, ctx, async ({ schemas }, { abortSignal }) => {
    const functions = await runPgMetaQuery(
      ctx,
      pgMeta.functions.list({ includedSchemas: schemas }),
      abortSignal
    )
    return functions.map(({ schema, name, argument_types, return_type, language, definition }) => ({
      schema,
      name,
      argument_types,
      return_type,
      language,
      definition,
    }))
  })
}
