import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ConnectionVars } from '../common.types'
import { getFunctionGrantSql, getFunctionRevokeSql } from '../sql/queries/edit-function-permissions'
import {
  FUNCTION_API_ACCESS_ROLES,
  type FunctionApiPrivilegesByRole,
} from './function-api-access-query'
import { invalidateFunctionPrivilegesQuery } from './function-privileges-query'
import { executeSql } from '@/data/sql/execute-sql-query'
import type { UseCustomMutationOptions } from '@/types'

export type FunctionApiAccessPrivilegesVariables = ConnectionVars & {
  functionSchema: string
  functionName: string
  functionArgs: string
  roles: FunctionApiPrivilegesByRole
}

export async function updateFunctionApiAccessPrivileges({
  projectRef,
  connectionString,
  functionSchema,
  functionName,
  functionArgs,
  roles,
}: FunctionApiAccessPrivilegesVariables) {
  const sqlStatements: Array<string> = []
  let addPublicRevokeStatement = false

  for (const role of FUNCTION_API_ACCESS_ROLES) {
    if (roles[role]) {
      sqlStatements.push(
        getFunctionGrantSql({
          functionSchema,
          functionName,
          functionArgs,
          role,
        })
      )
    } else {
      sqlStatements.push(
        getFunctionRevokeSql({
          functionSchema,
          functionName,
          functionArgs,
          role,
        })
      )
      addPublicRevokeStatement = true
    }
  }

  // Always revoke EXECUTE from public if any other role is revoked
  if (addPublicRevokeStatement) {
    sqlStatements.push(
      getFunctionRevokeSql({
        functionSchema,
        functionName,
        functionArgs,
        role: 'public',
      })
    )
  }

  if (sqlStatements.length === 0) {
    return null
  }

  const { result } = await executeSql<[]>({
    projectRef,
    connectionString,
    sql: sqlStatements.join('\n'),
    queryKey: ['function-api-access', 'update-privileges'],
  })

  return result
}

type UpdateFunctionApiAccessPrivilegesData = Awaited<
  ReturnType<typeof updateFunctionApiAccessPrivileges>
>

export const useFunctionApiAccessPrivilegesMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    UpdateFunctionApiAccessPrivilegesData,
    Error,
    FunctionApiAccessPrivilegesVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    UpdateFunctionApiAccessPrivilegesData,
    Error,
    FunctionApiAccessPrivilegesVariables
  >({
    mutationFn: (vars) => updateFunctionApiAccessPrivileges(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await invalidateFunctionPrivilegesQuery(queryClient, projectRef)
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update API access privileges: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
