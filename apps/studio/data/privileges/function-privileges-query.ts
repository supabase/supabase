import { QueryClient, queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { FUNCTION_PRIVILEGES_SQL } from '../sql/queries/get-function-privileges'
import { privilegeKeys } from './keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'

export type FunctionPrivilegesVariables = {
  projectRef?: string
  connectionString?: string | null
}

const pgFunctionPrivilegesZod = z.object({
  function_id: z.number(),
  schema: z.string(),
  name: z.string(),
  identity_argument_types: z.string(),
  privileges: z.array(
    z.object({
      grantor: z.string(),
      grantee: z.string(),
      privilege_type: z.literal('EXECUTE'),
      is_grantable: z.boolean(),
    })
  ),
})

const pgFunctionPrivilegesArrayZod = z.array(pgFunctionPrivilegesZod)

export type FunctionPrivilegesData = z.infer<typeof pgFunctionPrivilegesArrayZod>
export type FunctionPrivilegesError = ExecuteSqlError

async function getFunctionPrivileges(
  { projectRef, connectionString }: FunctionPrivilegesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql: FUNCTION_PRIVILEGES_SQL,
      queryKey: ['function-privileges'],
    },
    signal
  )

  return result as FunctionPrivilegesData
}

export const functionPrivilegesQueryOptions = (
  { projectRef, connectionString }: FunctionPrivilegesVariables,
  { enabled = true } = {}
) => {
  return queryOptions<FunctionPrivilegesData, FunctionPrivilegesError>({
    // Query is functionally the same if connectionString changes
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: privilegeKeys.functionPrivilegesList(projectRef),
    queryFn: ({ signal }) => getFunctionPrivileges({ projectRef, connectionString }, signal),
    enabled: enabled && !!projectRef,
  })
}

export function invalidateFunctionPrivilegesQuery(
  client: QueryClient,
  projectRef: string | undefined
) {
  return client.invalidateQueries({ queryKey: privilegeKeys.functionPrivilegesList(projectRef) })
}
