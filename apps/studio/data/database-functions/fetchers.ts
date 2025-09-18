// [Joshen] These are being placed separately as they're also being used in the API
// which we should avoid mixing client side and server side logic (main problem was importing of react query)

import pgMeta from '@supabase/pg-meta'
import { z } from 'zod'

import { executeSql } from 'data/sql/execute-sql'

export const pgMetaFunctionsList = pgMeta.functions.list()

export type DatabaseFunction = z.infer<typeof pgMeta.functions.pgFunctionZod>

export type DatabaseFunctionsVariables = {
  projectRef?: string
  connectionString?: string | null
}

export async function getDatabaseFunctions(
  { projectRef, connectionString }: DatabaseFunctionsVariables,
  signal?: AbortSignal,
  headersInit?: HeadersInit
) {
  let headers = new Headers(headersInit)

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql: pgMetaFunctionsList.sql,
      queryKey: ['database-functions'],
    },
    signal,
    headers
  )

  return result as DatabaseFunction[]
}
