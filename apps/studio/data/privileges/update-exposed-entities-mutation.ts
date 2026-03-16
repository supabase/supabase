import { useMutation } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { toast } from 'sonner'
import type { UseCustomMutationOptions } from 'types'

import type { ConnectionVars } from '../common.types'
import { buildFunctionPrivilegesSql, buildTablePrivilegesSql } from './privileges.sql'

export type UpdateExposedEntitiesVariables = ConnectionVars & {
  tableIdsToAdd: number[]
  tableIdsToRemove: number[]
  functionNamesToAdd: string[]
  functionNamesToRemove: string[]
}

export async function updateExposedEntities({
  projectRef,
  connectionString,
  tableIdsToAdd,
  tableIdsToRemove,
  functionNamesToAdd,
  functionNamesToRemove,
}: UpdateExposedEntitiesVariables): Promise<void> {
  if (!projectRef) throw new Error('projectRef is required')

  const sqlParts: string[] = []

  if (tableIdsToAdd.length > 0) {
    sqlParts.push(buildTablePrivilegesSql(tableIdsToAdd, 'grant'))
  }

  if (tableIdsToRemove.length > 0) {
    sqlParts.push(buildTablePrivilegesSql(tableIdsToRemove, 'revoke'))
  }

  if (functionNamesToAdd.length > 0) {
    sqlParts.push(buildFunctionPrivilegesSql(functionNamesToAdd, 'grant'))
  }

  if (functionNamesToRemove.length > 0) {
    sqlParts.push(buildFunctionPrivilegesSql(functionNamesToRemove, 'revoke'))
  }

  if (sqlParts.length === 0) return

  await executeSql({
    projectRef,
    connectionString,
    sql: sqlParts.join('\n'),
    queryKey: ['update-exposed-entities'],
  })
}

type UpdateExposedEntitiesData = Awaited<ReturnType<typeof updateExposedEntities>>

export const useUpdateExposedEntitiesMutation = ({
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<UpdateExposedEntitiesData, Error, UpdateExposedEntitiesVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<UpdateExposedEntitiesData, Error, UpdateExposedEntitiesVariables>({
    mutationFn: (vars: UpdateExposedEntitiesVariables) => updateExposedEntities(vars),
    onError(error: Error) {
      toast.error(`Failed to update entity access: ${error.message}`)
    },
    ...(onError ? { onError } : {}),
    ...options,
  })
}
