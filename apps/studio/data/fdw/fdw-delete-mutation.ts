import { getDeleteFDWSql } from '@supabase/pg-meta'
import { wrapWithTransaction } from '@supabase/pg-meta/src/query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fdwKeys } from './keys'
import type { WrapperMeta } from '@/components/interfaces/Integrations/Wrappers/Wrappers.types'
import { entityTypeKeys } from '@/data/entity-types/keys'
import { foreignTableKeys } from '@/data/foreign-tables/keys'
import { executeSql } from '@/data/sql/execute-sql-query'
import { vaultSecretsKeys } from '@/data/vault/keys'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type FDWDeleteVariables = {
  projectRef?: string
  connectionString?: string | null
  wrapper: { name: string }
  wrapperMeta: WrapperMeta
}

export async function deleteFDW({
  projectRef,
  connectionString,
  wrapper,
  wrapperMeta,
}: FDWDeleteVariables) {
  const sql = wrapWithTransaction(getDeleteFDWSql({ wrapper, wrapperMeta }))
  const { result } = await executeSql({ projectRef, connectionString, sql })
  return result
}

type FDWDeleteData = Awaited<ReturnType<typeof deleteFDW>>

export const useFDWDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<FDWDeleteData, ResponseError, FDWDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<FDWDeleteData, ResponseError, FDWDeleteVariables>({
    mutationFn: (vars) => deleteFDW(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: fdwKeys.list(projectRef), refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: entityTypeKeys.list(projectRef) }),
        queryClient.invalidateQueries({ queryKey: foreignTableKeys.list(projectRef) }),
        queryClient.invalidateQueries({ queryKey: vaultSecretsKeys.list(projectRef) }),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(
          `Failed to disable ${variables.wrapper.name} foreign data wrapper: ${data.message}`
        )
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
