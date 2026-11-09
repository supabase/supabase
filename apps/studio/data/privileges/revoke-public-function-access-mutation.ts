import { buildRevokePublicFunctionExecuteSql } from '@supabase/pg-meta'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { privilegeKeys } from './keys'
import type { ConnectionVars } from '@/data/common.types'
import { unguarded } from '@/data/fetchers'
import { lintKeys } from '@/data/lint/keys'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { UseCustomMutationOptions } from '@/types'

export type RevokePublicFunctionAccessVariables = ConnectionVars & {
  /** Fully-qualified function names as `schema.name` (all overloads). */
  functionNames: string[]
}

export async function revokePublicFunctionAccess({
  projectRef,
  connectionString,
  functionNames,
}: RevokePublicFunctionAccessVariables): Promise<void> {
  if (!projectRef) throw new Error('projectRef is required')
  if (functionNames.length === 0) return

  await executeSql({
    projectRef,
    connectionString,
    sql: buildRevokePublicFunctionExecuteSql(functionNames),
    queryKey: ['revoke-public-function-access'],
    grant: unguarded.migrating,
  })
}

type RevokePublicFunctionAccessData = Awaited<ReturnType<typeof revokePublicFunctionAccess>>

export const useRevokePublicFunctionAccessMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    RevokePublicFunctionAccessData,
    Error,
    RevokePublicFunctionAccessVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<RevokePublicFunctionAccessData, Error, RevokePublicFunctionAccessVariables>({
    mutationFn: (vars) => revokePublicFunctionAccess(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: privilegeKeys.exposedFunctionsAll(projectRef) }),
        queryClient.invalidateQueries({
          queryKey: privilegeKeys.exposedFunctionsInfinite(projectRef),
        }),
        queryClient.invalidateQueries({
          queryKey: privilegeKeys.exposedFunctionCounts(projectRef),
        }),
        queryClient.invalidateQueries({ queryKey: lintKeys.lint(projectRef) }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to revoke public access: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
