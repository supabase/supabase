import pgMeta, { type SafeSqlFragment } from '@supabase/pg-meta'
import { z } from 'zod'

import { databaseKeys } from '@/data/database/keys'
import { grantedQueryOptions, type GrantedQueryCallerOptions } from '@/data/granted-query-options'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { GrantFor } from '@/lib/grants'

export type DatabaseFunctionsGrant = GrantFor<'post', '/platform/pg-meta/{ref}/query', 'read'>

export type DatabaseFunctionsVariables = {
  projectRef?: string
  grant?: DatabaseFunctionsGrant
  connectionString?: string | null
  schema?: string
}

export type DatabaseFunction = z.infer<typeof pgMeta.functions.pgFunctionZod>
export type SavedDatabaseFunction = Omit<
  DatabaseFunction,
  | 'complete_statement'
  | 'argument_types'
  | 'identity_argument_types'
  | 'return_type'
  | 'config_params'
> & {
  complete_statement: SafeSqlFragment
  argument_types: SafeSqlFragment
  identity_argument_types: SafeSqlFragment
  return_type: SafeSqlFragment
  config_params: Record<string, SafeSqlFragment> | null
  type: 'function' | 'procedure'
}

export async function getDatabaseFunctions(
  {
    projectRef,
    connectionString,
    schema,
    grant,
  }: Omit<DatabaseFunctionsVariables, 'grant'> & { grant: DatabaseFunctionsGrant },
  signal?: AbortSignal,
  headersInit?: HeadersInit
) {
  let headers = new Headers(headersInit)

  const pgMetaFunctionsList = pgMeta.functions.list({
    includedSchemas: schema ? [schema] : undefined,
  })
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sqlOrigin: 'studio',
      queryName: 'database-functions',
      sql: pgMetaFunctionsList.sql,
      queryKey: ['database-functions'],
      grant,
    },
    signal,
    headers
  )

  return result as SavedDatabaseFunction[]
}

export type DatabaseFunctionsData = Awaited<ReturnType<typeof getDatabaseFunctions>>
export type DatabaseFunctionsError = StudioError

export const databaseFunctionsQueryOptions = <TData = DatabaseFunctionsData>(
  vars: DatabaseFunctionsVariables,
  options?: GrantedQueryCallerOptions<
    DatabaseFunctionsData,
    DatabaseFunctionsError,
    TData,
    ReturnType<typeof databaseKeys.databaseFunctions>
  >
) => {
  const { projectRef, connectionString, schema, grant } = vars
  return grantedQueryOptions(
    {
      queryKey: databaseKeys.databaseFunctions(projectRef, schema),
      queryFn:
        projectRef && grant
          ? ({ signal }) =>
              getDatabaseFunctions({ projectRef, connectionString, schema, grant }, signal)
          : undefined,
    },
    options
  )
}
