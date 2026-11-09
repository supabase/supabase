import pgMeta from '@supabase/pg-meta'
import { z } from 'zod'

import { contract } from './list-functions'
import { toolFromContract } from './tool-from-contract'
import { runPgMetaQuery } from './tool-sql.server'
import type { ToolFactory } from './types'

// `pg_get_function_result` is NULL for procedures, which pg-meta's `return_type: z.string()` rejects.
const functionRowsZod = z.array(
  pgMeta.functions.pgFunctionZod.extend({ return_type: z.string().nullable() })
)

export const createTool: ToolFactory<typeof contract> = (ctx) => {
  return toolFromContract(contract, ctx, async ({ schemas }, { abortSignal }) => {
    const functions = await runPgMetaQuery(
      ctx,
      { sql: pgMeta.functions.list({ includedSchemas: schemas }).sql, zod: functionRowsZod },
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
